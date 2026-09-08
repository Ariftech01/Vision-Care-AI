#!/usr/bin/env python3
"""Main CLI for SIH26038 DR Screening Pipeline."""
import argparse
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.pipeline.pipeline import DRScreeningPipeline
from src.utils.common import setup_logging


def main():
    parser = argparse.ArgumentParser(description="SIH26038 DR Screening")
    parser.add_argument("--image", required=True, help="Path to fundus image")
    parser.add_argument("--config", default="configs/default.yaml", help="Config path")
    parser.add_argument("--checkpoint", default=None, help="Model checkpoint")
    parser.add_argument("--calibrator", default=None, help="Temperature scaler checkpoint")
    parser.add_argument("--save-dir", default="./outputs", help="Output directory")
    parser.add_argument("--case-id", default=None, help="Case identifier")
    args = parser.parse_args()

    logger = setup_logging()
    logger.info("=" * 60)
    logger.info("SIH26038 - Diabetic Retinopathy Screening")
    logger.info("=" * 60)

    if not os.path.exists(args.image):
        logger.error(f"Image not found: {args.image}")
        sys.exit(1)

    pipeline = DRScreeningPipeline(
        config_path=args.config,
        checkpoint_path=args.checkpoint,
        calibrator_path=args.calibrator,
    )

    result = pipeline.run(args.image, save_dir=args.save_dir, case_id=args.case_id)

    print("\n" + "=" * 60)
    print("SCREENING RESULTS")
    print("=" * 60)
    print(f"Case ID:        {result['case_id']}")
    print(f"Quality Pass:   {result['quality_pass']}")

    if result['quality_pass']:
        grade_names = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]
        grade = result['predicted_grade']
        print(f"DR Grade:       {grade} - {grade_names[grade]}")
        print(f"Confidence:     {result['confidence']:.4f}")
        print(f"Referable DR:   {'YES - REFER' if result['referable'] else 'NO'}")
        print(f"Grad-CAM:       {result['gradcam_path']}")
    else:
        print("IMAGE QUALITY FAILURE - No DR grading performed.")
        q = result['results']['quality']
        print(f"Reasons:        {', '.join(q['failure_reasons'])}")
        print(f"Guidance:       {q['recapture_guidance']}")

    print(f"Report:         {result['report_path']}")
    print("=" * 60)
    logger.info("Pipeline completed successfully.")


if __name__ == "__main__":
    main()
