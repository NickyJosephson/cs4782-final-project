import pytest
import torch
import torch.nn as nn
import torchgeometry as tgm
import numpy as np

import sys
import os

# Adds the parent directory to the search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from degradation import Degradation

class TestInit:
    def test_default_construction(self):
        n = 20
        d = Degradation(num_timesteps=n)
        assert d.degradation_type == "gaussian_blur"
        assert d.num_timesteps == n
        assert len(d.kernels) == n
        for layer in d.kernels:
            assert isinstance(layer, nn.Conv2d)

class TestForward:
    # Test output shape matches input shape
    def test_forward_shape(self):
        test_img = torch.rand(1, 3, 128, 128)
        d = Degradation(num_timesteps=3)
        out = d(test_img)
        print(type(out))
        assert isinstance(out, torch.Tensor)
        assert out.shape == test_img.shape

    # Test output shape matches input shape with input kernel
    def test_forward_shape_with_larger_kernel(self):
        test_img = torch.rand(1, 3, 128, 128)
        d = Degradation(num_timesteps=3, kernel_size=5)
        assert d(test_img).shape == test_img.shape

    # Test output with batched input
    def test_forward_batch(self):
        test_img = torch.rand(4, 3, 128, 128)
        d = Degradation(num_timesteps=3)
        out = d(test_img)
        assert out.shape == test_img.shape

    # Test output shape matches with grayscale input
    def test_forward_grayscale(self):
        test_img = torch.rand(1, 1, 128, 128)
        d = Degradation(num_timesteps=3, image_channels=1)
        out = d(test_img)
        assert out.shape == test_img.shape

    # Test sum remains constant after blurring
    def test_blurred_total_sum(self):
        d = Degradation(num_timesteps=5, kernel_std=1.0)
        x = torch.rand(1, 3, 128, 128)
        out = d(x)
        total_intensity = out.sum().item()
        assert abs(total_intensity - x.sum().item()) < 1e-2


class TestConvProperties:
    # Test initialization of conv layers
    def test_kernel_params(self):
        ks = 5
        d = Degradation(num_timesteps=3, kernel_size=ks)
        for layer in d.kernels:
            assert layer.kernel_size == (ks, ks)
            assert (layer.weight >= 0).all()

    # Test kernel std changes linearly in incremental mode
    def test_incremental_std_increases(self):
        kernel_std = 0.5
        d = Degradation(num_timesteps=5, kernel_std=kernel_std, blur_routine="Incremental")
        for i, layer in enumerate(d.kernels):
            expected_std = kernel_std * (i + 1)
            expected_kernel = d.get_conv(expected_std)
            total_difference = torch.abs(layer.weight - expected_kernel.weight).sum().item()
            assert total_difference < 1e-5


    # Test kernel std increases exponentially in exponential mode
    def test_exponential_std_increases(self):
        kernel_std = 0.5
        d = Degradation(num_timesteps=5, kernel_std=kernel_std, blur_routine="Exponential")
        for i, layer in enumerate(d.kernels):
            expected_std = np.exp(kernel_std * i)
            expected_kernel = d.get_conv(expected_std)
            total_difference = torch.abs(layer.weight - expected_kernel.weight).sum().item()
            assert total_difference < 1e-5

    def test_weights_sum_to_one(self):
        d = Degradation(num_timesteps=5)
        for layer in d.kernels:
            weight_sum = layer.weight.sum(dim=[-1, -2])
            assert (weight_sum - 1).sum() < 1e-5
