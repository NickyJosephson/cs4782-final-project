import os
import urllib.request
import zipfile
from pathlib import Path
from typing import Literal, Optional

import torch
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import datasets, transforms
from torchvision.datasets import ImageFolder

DATA_ROOT = Path(__file__).resolve().parent / "raw"

AFHQ_URL = os.environ.get(
    "AFHQ_URL",
    "https://www.dropbox.com/s/t9l9o3vsx2jai3z/afhq.zip?dl=1",
)

DatasetName = Literal["mnist", "cifar10", "celeba", "celeba128", "afhq"]
Split = Literal["train", "val", "test"]

# For datasets without an official val split (MNIST, CIFAR-10), we carve this
# many images out of the training set with a fixed permutation so every
# one of us sees the same val set.
VAL_SIZE = 5000
VAL_SEED = 0


def _carve_val_indices(n_train: int):
    g = torch.Generator().manual_seed(VAL_SEED)
    perm = torch.randperm(n_train, generator=g)
    return perm[VAL_SIZE:].tolist(), perm[:VAL_SIZE].tolist()


def _celeba_transform(image_size: int):
    return transforms.Compose([
        transforms.CenterCrop(178),
        transforms.Resize(image_size),
        transforms.ToTensor(),
    ])


def _afhq_transform(image_size: int):
    return transforms.Compose([
        transforms.Resize(image_size),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
    ])


def _cifar_transform(augment: bool):
    ts = []
    if augment:
        ts += [
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
        ]
    ts.append(transforms.ToTensor())
    return transforms.Compose(ts)


def _mnist_transform():
    return transforms.ToTensor()


class _HFCelebA(Dataset):
    def __init__(self, hf_ds, transform):
        self._hf_ds = hf_ds
        self._transform = transform

    def __len__(self) -> int:
        return len(self._hf_ds)

    def __getitem__(self, i):
        return self._transform(self._hf_ds[i]["image"]), 0


def _download_with_progress(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response:
        total = int(response.headers.get("Content-Length", 0))
        downloaded = 0
        chunk = 1 << 16
        with open(dest, "wb") as f:
            while True:
                buf = response.read(chunk)
                if not buf:
                    break
                f.write(buf)
                downloaded += len(buf)
                if total:
                    pct = 100 * downloaded / total
                    print(
                        f"\r  {downloaded / 1e6:7.1f} / {total / 1e6:.1f} MB "
                        f"({pct:5.1f}%)",
                        end="",
                        flush=True,
                    )


def _download_afhq(root: Path) -> None:
    root.parent.mkdir(parents=True, exist_ok=True)
    zip_path = root.parent / "afhq.zip"
    print(f"AFHQ not found. Downloading instead")
    try:
        _download_with_progress(AFHQ_URL, zip_path)
    except Exception:
        if zip_path.exists():
            zip_path.unlink()
        raise
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(root.parent)
    zip_path.unlink()
    print("AFHQ ready.")


def get_dataset(name: DatasetName, split: Split, augment: bool = False,) -> Dataset:
    root = DATA_ROOT / name
    root.mkdir(parents=True, exist_ok=True)

    if name == "mnist":
        if split == "test":
            return datasets.MNIST(str(root), train=False, download=True, transform=_mnist_transform())
        base = datasets.MNIST(str(root), train=True, download=True, transform=_mnist_transform())
        train_idx, val_idx = _carve_val_indices(len(base))
        return Subset(base, train_idx if split == "train" else val_idx)

    if name == "cifar10":
        if split == "test":
            return datasets.CIFAR10(str(root), train=False, download=True, transform=_cifar_transform(augment=False))
        use_augment = augment and split == "train"
        base = datasets.CIFAR10(str(root), train=True, download=True, transform=_cifar_transform(augment=use_augment))
        train_idx, val_idx = _carve_val_indices(len(base))
        return Subset(base, train_idx if split == "train" else val_idx)

    if name in ("celeba", "celeba128"):
        try:
            from datasets import load_dataset as _hf_load_dataset
        except ImportError as e:
            raise ImportError(
                "CelebA loading requires the HuggingFace `datasets` package. "
                "Install with: pip install datasets"
            ) from e
        image_size = 64 if name == "celeba" else 128
        hf_split = "valid" if split == "val" else split
        hf_ds = _hf_load_dataset("flwrlabs/celeba", split=hf_split)
        return _HFCelebA(hf_ds, _celeba_transform(image_size))

    if name == "afhq":
        subdir = "train" if split == "train" else "val"
        afhq_path = root / subdir
        if not afhq_path.exists():
            _download_afhq(root)
        return ImageFolder(str(afhq_path), transform=_afhq_transform(128))

    raise ValueError(f"unknown dataset: {name}")


def get_loader(name: DatasetName, split: Split, batch_size: int, num_workers: int = 4, augment: bool = False, shuffle: Optional[bool] = None) -> DataLoader:
    ds = get_dataset(name, split, augment=augment)
    if shuffle is None:
        shuffle = split == "train"
    return DataLoader(
        ds,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=(split == "train"),
        persistent_workers=num_workers > 0,
    )
