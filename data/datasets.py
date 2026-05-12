from pathlib import Path
from typing import Literal, Optional

import torch
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import datasets, transforms

DATA_ROOT = Path(__file__).resolve().parent / "raw"

DatasetName = Literal["mnist", "cifar10"]
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


def _cifar_transform(augment: bool):
    ts = []
    if augment:
        ts += [
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
        ]
    ts.append(transforms.ToTensor())
    return transforms.Compose(ts)


def _mnist_transform(augment:bool):
    ts = []
    if augment:
        ts += [
            transforms.Resize((35,35)),
            transforms.RandomCrop(32),
            transforms.RandomHorizontalFlip()
        ]
    else:
        ts.append(transforms.Resize((32,32)))
    ts.append(transforms.ToTensor())
    return transforms.Compose(ts)


def get_dataset(name: DatasetName, split: Split, augment: bool = False,) -> Dataset:
    root = DATA_ROOT / name
    root.mkdir(parents=True, exist_ok=True)

    if name == "mnist":
        if split == "test":
            return datasets.MNIST(str(root), train=False, download=True, transform=_mnist_transform(augment=False))
        use_augment = augment and split == "train"
        base = datasets.MNIST(str(root), train=True, download=True, transform=_mnist_transform(augment=use_augment))
        train_idx, val_idx = _carve_val_indices(len(base))
        return Subset(base, train_idx if split == "train" else val_idx)

    if name == "cifar10":
        if split == "test":
            return datasets.CIFAR10(str(root), train=False, download=True, transform=_cifar_transform(augment=False))
        use_augment = augment and split == "train"
        base = datasets.CIFAR10(str(root), train=True, download=True, transform=_cifar_transform(augment=use_augment))
        train_idx, val_idx = _carve_val_indices(len(base))
        return Subset(base, train_idx if split == "train" else val_idx)

    raise ValueError(f"unknown dataset: {name}")


def get_loader(name: DatasetName, split: Split, batch_size: int, num_workers: int = 4, data_percent = 1.0, augment: bool = False, shuffle: Optional[bool] = None) -> DataLoader:
    ds = get_dataset(name, split, augment=augment)
    if data_percent < 1:
        n = len(ds)
        k = int(n * data_percent)
        g = torch.Generator().manual_seed(0)
        indices = torch.randperm(n, generator=g)[:k].tolist()
        ds = Subset(ds, indices)
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
