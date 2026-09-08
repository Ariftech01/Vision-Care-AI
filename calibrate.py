#!/usr/bin/env python3
"""Temperature scaling calibration script."""
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import torch
from torch.utils.data import DataLoader

from src.utils.common import load_config, get_device, load_checkpoint
from src.grading.model import DRGradingModel
from src.calibration.temperature_scaling import TemperatureScaling
from src.datasets.dataset import FundusDataset, get_val_transforms, get_stratified_splits


def main():
    parser = argparse.ArgumentParser(description="Calibrate Confidence using Temperature Scaling")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--data-dir", default=None)
    parser.add_argument("--csv", default=None)
    parser.add_argument("--output", default="./checkpoints/temperature_scaler.pth")
    args = parser.parse_args()

    config = load_config(args.config)
    data_dir = args.data_dir or config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = args.csv or os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    device = get_device(config["project"]["device"])

    val_tf = get_val_transforms(config)

    # Use validation set for temperature calibration
    val_split = config["training"].get("val_split", 0.15)
    test_split = config["training"].get("test_split", 0.15)
    _, val_samples, _ = get_stratified_splits(
        csv_path=csv_path, image_dir=image_dir, val_split=val_split, test_split=test_split, seed=config["project"]["seed"]
    )
    if not val_samples:
        dataset = FundusDataset(image_dir=image_dir, csv_path=csv_path, transform=val_tf)
    else:
        dataset = FundusDataset(image_dir=image_dir, samples=val_samples, transform=val_tf)

    loader = DataLoader(dataset, batch_size=config["training"]["batch_size"],
                        shuffle=False, num_workers=0)

    model = DRGradingModel(config).to(device)
    load_checkpoint(model, args.checkpoint)
    model.eval()

    all_logits, all_labels = [], []

    with torch.no_grad():
        for batch in loader:
            images = batch["image"].to(device)
            labels = batch["label"]
            logits = model(images)
            all_logits.append(logits.cpu())
            all_labels.append(labels)

    all_logits = torch.cat(all_logits, dim=0)
    all_labels = torch.cat(all_labels, dim=0)

    scaler = TemperatureScaling()
    metrics = scaler.fit(all_logits, all_labels,
                         lr=config["calibration"]["lr"],
                         max_iter=config["calibration"]["max_iter"])

    print("\nCalibration Results:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    torch.save(scaler.state_dict(), args.output)
    print(f"\nSaved temperature scaler to {args.output}")


if __name__ == "__main__":
    main()
