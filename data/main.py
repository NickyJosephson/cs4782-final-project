"""Smoke test: verify each dataset loads and yields the expected shape/range.

Run from the project root:
    python data/main.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from datasets import get_loader  # noqa: E402


def smoke(name: str, expected_channels: int, expected_size: int) -> None:
    try:
        loader = get_loader(name, "train", batch_size=4, num_workers=0)
        x, _ = next(iter(loader))
    except Exception as e:
        print(f"{name:10s} FAIL: {type(e).__name__}: {e}")
        return
    c, h, w = x.shape[1:]
    ok = c == expected_channels and h == expected_size and w == expected_size
    print(
        f"{name:10s} shape={tuple(x.shape)} "
        f"range=[{x.min():.3f}, {x.max():.3f}] {'OK' if ok else 'MISMATCH'}"
    )


if __name__ == "__main__":
    smoke("mnist", 1, 28)
    smoke("cifar10", 3, 32)
    # Require manual setup — uncomment once data is in place.
    # smoke("celeba", 3, 64)
    # smoke("celeba128", 3, 128)
    # smoke("afhq", 3, 128)
