import sys
import math
import numpy as np
import torch
from PIL import Image, ImageDraw
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from degradation import Degradation


def load_image(path):
    """Load a PNG as a (1, C, H, W) float tensor in [0, 1], resized to 128x128."""
    img = Image.open(path).convert("RGB")
    if img.size != (128, 128):
        img = img.resize((128, 128), Image.LANCZOS)
    arr = np.array(img).astype(np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)


def tensor_to_pil(t):
    """Convert (1, C, H, W) float tensor to PIL Image."""
    arr = t.squeeze(0).detach().cpu().clamp(0, 1).permute(1, 2, 0).numpy()
    return Image.fromarray((arr * 255).astype(np.uint8))


if __name__ == "__main__":
    image_path = sys.argv[1]
    num_timesteps = 20
    kernel_size = 3
    kernel_std = 0.1
    blur_routine = "Exponential"

    
    filename_with_path = image_path.rsplit(".", 1)[0]
    filename = os.path.basename(filename_with_path)
    x = load_image(image_path)

    model = Degradation(
        degradation_type="gaussian_blur",
        blur_routine=blur_routine,
        kernel_size=kernel_size,
        kernel_std=kernel_std,
        image_channels=x.shape[1],
        num_timesteps=num_timesteps,
    )
    model.eval()

    blur_steps = model.forward(x, show_all_timesteps=True)
    viewable_imgs = []
    for tensor in blur_steps:
        viewable_imgs.append(tensor_to_pil(tensor))
    for i, img in enumerate(viewable_imgs):
        dir_name = f"test_data/output/{filename}_{blur_routine}"
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
        out_path = os.path.join(dir_name, f"{i}_timestep.png")
        img.save(out_path)