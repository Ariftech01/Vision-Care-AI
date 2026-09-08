#!/usr/bin/env python3
"""Dataset verification CLI for APTOS 2019 dataset."""
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.utils.common import load_config
from src.datasets.dataset import verify_dataset_files


def main():
    parser = argparse.ArgumentParser(description="Verify APTOS 2019 Dataset Files & Labels")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--data-dir", default=None)
    parser.add_argument("--csv", default=None)
    args = parser.parse_args()

    config = load_config(args.config)
    data_dir = args.data_dir or config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = args.csv or os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    print("=" * 60)
    print("DATASET VERIFICATION — APTOS 2019")
    print("=" * 60)
    print(f"Data Directory: {data_dir}")
    print(f"CSV Path:       {csv_path}")
    print(f"Image Directory: {image_dir}")

    if not os.path.exists(csv_path):
        print(f"\n[ERROR] CSV file not found: {csv_path}")
        return

    results = verify_dataset_files(image_dir, csv_path)

    print("\n--- Summary ---")
    print(f"Total CSV Records:  {results['total_records']}")
    print(f"Valid Image Files:  {results['valid_count']}")
    print(f"Missing Image Files: {results['missing_count']}")
    print(f"Corrupt Image Files: {results['corrupt_count']}")

    print("\n--- Class Distribution (0: No DR ... 4: Proliferative DR) ---")
    class_names = config.get("grading", {}).get("class_names", ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"])
    for cls in range(5):
        cnt = results['class_distribution'].get(cls, 0)
        pct = (cnt / results['valid_count'] * 100) if results['valid_count'] > 0 else 0
        name = class_names[cls] if cls < len(class_names) else f"Class {cls}"
        print(f"  Class {cls} ({name:<16}): {cnt:5d} ({pct:5.2f}%)")

    print("=" * 60)
    print("Dataset verification completed.")


if __name__ == "__main__":
    main()
