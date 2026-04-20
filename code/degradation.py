import torch
from torch import nn
import numpy as np
import torchgeometry as tgm

class Degradation(nn.Module):
    """
    Wraps the degradation process of an image. Applies sequential convolutional layers with Gaussian blur kernels.

    Args:
        degradation_type (str): noise vs blur (normal vs 'cold' degradation).
        blur_routine (str): how the parameters of the convolution layers change.
        kernel_size (int): gaussian blur kernel dim.
        kernel_std (float): gaussian blur kernel std.
        image_channels (int): input channels.
        num_timesteps (int): number of timesteps / gaussian blur layers to apply.
    """
    def __init__(self, degradation_type="gaussian_blur", blur_routine = "Exponential", padding_mode = "circular", kernel_size = 3, kernel_std = 0.1, image_channels = 3, num_timesteps = 1000):
        super().__init__()

        self.degradation_type = degradation_type
        self.blur_routine = blur_routine
        self.padding_mode = padding_mode
        self.kernel_size = kernel_size
        self.kernel_std = kernel_std
        self.image_channels = image_channels
        self.num_timesteps = num_timesteps

        self.kernels = self.get_kernels()
    def blur_kernel(self, dim, std):
        return tgm.image.get_gaussian_kernel2d((dim, dim), (std, std))
    def get_conv(self, std, kernel_size = None, padding_mode = "circular"):
        if kernel_size is None:
            kernel_size = self.kernel_size
        if self.degradation_type == 'gaussian_noise':
            raise NotImplementedError
        elif self.degradation_type == 'gaussian_blur':
            padding = (kernel_size - 1) // 2
            conv_layer = nn.Conv2d(self.image_channels, self.image_channels, kernel_size=kernel_size, padding=padding,
                             groups=self.image_channels, bias=False, padding_mode=padding_mode) # Look into these params
        with torch.no_grad():
            kernel = self.blur_kernel(kernel_size, std)
            kernel = torch.unsqueeze(kernel, 0)
            kernel = torch.unsqueeze(kernel, 0)
            kernel = kernel.repeat(self.image_channels, 1, 1, 1)
            conv_layer.weight.data = kernel
        return conv_layer
    def get_kernels(self):
        kernels = []
        for i in range(self.num_timesteps):
            if self.blur_routine == "Incremental":
                kernels.append(self.get_conv(self.kernel_std * (i+1)))
            elif self.blur_routine == "Exponential":
                exp_std = np.exp(self.kernel_std * i)
                kernels.append(self.get_conv(exp_std))
            elif self.blur_routine == "Exponential_Reflect":
                exp_std = np.exp(self.kernel_std * i)
                kernels.append(self.get_conv(exp_std, padding_mode="reflect"))
            elif self.blur_routine == "Constant":
                kernels.append(self.get_conv(self.kernel_std))
            elif self.blur_routine == "Special6":
                kernel_size = 11
                kernel_std = i/100 + 0.35
                kernels.append(self.get_conv(std=kernel_std, kernel_size=kernel_size, padding_mode="reflect"))
        return kernels
    def forward(self, x, show_all_timesteps = False):
        """
        Applies degradation to an input image for self.num_timesteps timesteps.

        Args:
            x (torch.Tensor): input image tensor of shape (B, C, H, W).
            show_all_timesteps (bool): If True, returns a list of tensors representing the output at each timestep. Otherwise, returns only final degraded image.
        """
        if show_all_timesteps:
            timesteps = []
            timesteps.append(x)
        degrade_layers = self.kernels
        for i in range(len(degrade_layers)):
            conv_layer = degrade_layers[i]
            x = conv_layer(x)
            if show_all_timesteps:
                timesteps.append(x)
        if show_all_timesteps:
            return timesteps
        return x
    def forward_to_step(self, x, t):
        """
        Applies degradation to an input image for t timesteps.

        Args:
            x (torch.Tensor): input image tensor of shape (B, C, H, W).
        """
        for i in range(t):
            x = self.kernels[i](x)
        return x
    
    def __str__(self):
        return f"{self.degradation_type} with {self.blur_routine} routine"