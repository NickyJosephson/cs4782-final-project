import sys
import math
import numpy as np
import torch
from PIL import Image, ImageDraw

import sys
import os

# Adds the parent directory to the search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from degradation import Degradation


def load_image(path):
    """Load a PNG as a (1, C, H, W) float tensor in [0, 1], resized to 128x128."""
    img = Image.open(path).convert("RGB")
    if img.size != (128, 128):
        print(f"Resizing {img.size} to (128, 128)")
        img = img.resize((128, 128), Image.LANCZOS)
    arr = np.array(img).astype(np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)


def tensor_to_pil(t):
    """(1, C, H, W) float tensor -> PIL Image."""
    arr = t.squeeze(0).detach().cpu().clamp(0, 1).permute(1, 2, 0).numpy()
    return Image.fromarray((arr * 255).astype(np.uint8))


def make_contact_sheet(image_path, num_timesteps=20, kernel_size=3,
                       kernel_std=0.1, blur_routine="Incremental", cols=5):
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

    # collect original + each degraded step
    frames, current = [tensor_to_pil(x)], x.clone()
    with torch.no_grad():
        for t in range(num_timesteps):
            current = model.kernels[t](current)
            frames.append(tensor_to_pil(current))

    # layout
    PAD, LABEL_H = 8, 18
    cell_w = 128 + 2 * PAD
    cell_h = 128 + 2 * PAD + LABEL_H
    rows   = math.ceil(len(frames) / cols)
    sheet  = Image.new("RGB", (cols * cell_w, rows * cell_h), (30, 30, 30))
    draw   = ImageDraw.Draw(sheet)

    for i, frame in enumerate(frames):
        r, c  = divmod(i, cols)
        xo    = c * cell_w + PAD
        yo    = r * cell_h + PAD
        sheet.paste(frame, (xo, yo))
        label = "original" if i == 0 else f"t={i}"
        draw.text((xo, yo + 128 + 2), label, fill=(200, 200, 200))

    filename_with_path = image_path.rsplit(".", 1)[0]
    filename = os.path.basename(filename_with_path)
    out = os.path.join("test_data/output", f"{filename}_{blur_routine}_degradation_sheet.png")
    sheet.save(out)
    print(f"Saved -> {out}  ({cols} cols x {rows} rows, {len(frames)} frames)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python visualize_degradation.py <image.png> "
              "[num_timesteps] [kernel_size] [kernel_std] [blur_routine] [cols]")
        sys.exit(1)

    make_contact_sheet(
        image_path    = sys.argv[1],
        num_timesteps = int(sys.argv[2])   if len(sys.argv) > 2 else 20,
        kernel_size   = int(sys.argv[3])   if len(sys.argv) > 3 else 3,
        kernel_std    = float(sys.argv[4]) if len(sys.argv) > 4 else 0.1,
        blur_routine  = sys.argv[5]        if len(sys.argv) > 5 else "Incremental",
        cols          = int(sys.argv[6])   if len(sys.argv) > 6 else 5,
    )