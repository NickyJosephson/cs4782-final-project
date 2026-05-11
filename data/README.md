# Datasets

This project uses three standard image datasets. None are committed to the repo — they are downloaded on demand by the loaders in `data/datasets.py`.

## MNIST
- 28×28 grayscale handwritten digits.
- Downloaded automatically via `torchvision.datasets.MNIST` to `data/raw/` on first use.

## CIFAR-10
- 32×32 RGB natural images, 10 classes.
- Downloaded automatically via `torchvision.datasets.CIFAR10` to `data/raw/` on first use.

## CelebA (not used in final results)
- We initially planned to train on CelebA at 128×128 but omitted it due to compute constraints. The loader scaffold remains in `datasets.py` for completeness.
- If you want to run it, download from https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html and place the aligned images under `data/raw/celeba/`.

The `data/raw/` directory is gitignored.
