#!/usr/bin/env python3
"""Standalone quality check CLI."""
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import cv2
from src.quality.quality_assessor import QualityAssessor
from src.utils.common import load_config


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--config", default="configs/default.yaml")
    args = parser.parse_args()

    config = load_config(args.config)
    assessor = QualityAssessor(config)

    image = cv2.imread(args.image)
    if image is None:
        print("Error: Cannot load image")
        return

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result, enhanced = assessor.assess(image_rgb)

    print("\n" + "=" * 50)
    print("QUALITY ASSESSMENT RESULTS")
    print("=" * 50)
    print(f"Sharpness:     {result.sharpness_score:.3f}")
    print(f"Illumination:  {result.illumination_score:.3f}")
    print(f"FOV:           {result.fov_score:.3f}")
    print(f"Overall:       {result.overall_score:.3f}")
    print(f"Gradeable:     {'YES' if result.is_gradeable else 'NO'}")
    if result.failure_reasons:
        print(f"Failures:      {', '.join(result.failure_reasons)}")
    print(f"Guidance:      {result.recapture_guidance}")
    print("=" * 50)


if __name__ == "__main__":
    main()
