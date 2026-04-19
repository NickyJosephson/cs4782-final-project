import pytest
import torch
import torch.nn as nn
import torchgeometry as tgm

import sys
import os

# Adds the parent directory to the search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from degradation import Degradation


# ── helpers ───────────────────────────────────────────────────────────────────

def make_img(b=1, c=3, h=128, w=128):
    """Return a random float image tensor in [0, 1]."""
    return torch.rand(b, c, h, w)


# ── construction ──────────────────────────────────────────────────────────────

class TestInit:
    def test_default_construction(self):
        n = 20
        d = Degradation(num_timesteps=n)
        assert d.degradation_type == "gaussian_blur"
        assert d.num_timesteps == n
        assert len(d.kernels) == n
        for layer in d.kernels:
            assert isinstance(layer, nn.Conv2d)

# ── forward / end-to-end ──────────────────────────────────────────────────────

class TestForward:
    """Core: feed a 128x128 image in, get a degraded image out."""

    def test_forward_returns_tensor(self):
        d = Degradation(num_timesteps=3)
        out = d(make_img())
        print(type(out))
        assert isinstance(out, torch.Tensor)

    def test_forward_128x128_single_image(self):
        """The headline requirement: 128x128 in -> 128x128 out."""
        d = Degradation(num_timesteps=5)
        out = d(make_img(h=128, w=128))
        assert out.shape == (1, 3, 128, 128)

    def test_forward_shape_preserved(self):
        d = Degradation(num_timesteps=3, kernel_size=3)
        x = make_img(b=1, c=3, h=128, w=128)
        assert d(x).shape == x.shape

    def test_forward_batch(self):
        d = Degradation(num_timesteps=3)
        out = d(make_img(b=4, h=128, w=128))
        assert out.shape == (4, 3, 128, 128)

    def test_forward_grayscale(self):
        d = Degradation(num_timesteps=3, image_channels=1)
        out = d(make_img(b=1, c=1, h=128, w=128))
        assert out.shape == (1, 1, 128, 128)

    def test_forward_values_finite(self):
        d = Degradation(num_timesteps=3)
        out = d(make_img())
        assert torch.isfinite(out).all(), "Output contains NaN or Inf"


# ── blur behaviour ────────────────────────────────────────────────────────────

class TestBlurBehaviour:
    def test_blurred_differs_from_input(self):
        d = Degradation(num_timesteps=5, kernel_std=1.0)
        x = torch.zeros(1, 3, 128, 128)
        x[:, :, 64, 64] = 1.0
        out = d(x)
        assert not torch.allclose(out, x), "Blur had no effect"

    def test_blurred_is_smoother(self):
        def tv(t):
            return (
                (t[:, :, 1:, :] - t[:, :, :-1, :]).abs().sum()
                + (t[:, :, :, 1:] - t[:, :, :, :-1]).abs().sum()
            )
        d = Degradation(num_timesteps=10, kernel_std=2.0)
        x = torch.rand(1, 3, 128, 128)
        assert tv(d(x)) <= tv(x), "Blurred image is not smoother than input"

    def test_more_timesteps_blurs_more(self):
        x = torch.rand(1, 3, 128, 128)
        d_few  = Degradation(num_timesteps=2,  kernel_std=0.5)
        d_many = Degradation(num_timesteps=20, kernel_std=0.5)
        diff_few  = (d_few(x) - x).abs().mean().item()
        diff_many = (d_many(x) - x).abs().mean().item()
        assert diff_many >= diff_few


# ── conv layer properties ─────────────────────────────────────────────────────

class TestConvProperties:
    def test_kernel_size_constant(self):
        ks = 5
        d = Degradation(num_timesteps=3, kernel_size=ks)
        for layer in d.kernels:
            assert layer.kernel_size == (ks, ks)

    def test_weights_are_non_negative(self):
        d = Degradation(num_timesteps=5)
        for layer in d.kernels:
            assert (layer.weight >= 0).all()

    def test_weights_sum_to_one(self):
        """Each depthwise kernel should be normalised (sum approx 1)."""
        d = Degradation(num_timesteps=5)
        for layer in d.kernels:
            weight_sum = layer.weight.sum(dim=[-1, -2])
            assert torch.allclose(weight_sum, torch.ones_like(weight_sum), atol=1e-5)

    def test_incremental_std_increases(self):
        """Later kernels should have larger std -> smaller peak weight value."""
        d = Degradation(num_timesteps=5, kernel_std=0.5)
        peaks = [layer.weight.max().item() for layer in d.kernels]
        assert peaks == sorted(peaks, reverse=True), (
            "Peak weight should decrease as std grows with each timestep"
        )
    def test_exponential_std_increases(self):
        """Later kernels should have exponentially larger std -> smaller peak weight value."""
        d = Degradation(num_timesteps=5, kernel_std=0.5)
        peaks = [layer.weight.max().item() for layer in d.kernels]
        assert peaks == sorted(peaks, reverse=True), (
            "Peak weight should decrease as std grows with each timestep"
        )


# ── error handling ────────────────────────────────────────────────────────────

    def test_wrong_channel_count_raises(self):
        d = Degradation(num_timesteps=3, image_channels=3)
        with pytest.raises(RuntimeError):
            d(make_img(c=1))