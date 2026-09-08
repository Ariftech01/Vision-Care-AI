#!/usr/bin/env python3
"""Select demo images from APTOS dataset for Vision Care AI demonstration."""
import os
import sys
import shutil
import cv2
import pandas as pd

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.common import load_config
from src.quality.quality_assessor import QualityAssessor
from src.datasets.dataset import resolve_image_path


def main():
    config = load_config("configs/default.yaml")
    data_dir = config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    if not os.path.exists(csv_path):
        print(f"Error: CSV path not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)
    assessor = QualityAssessor(config)

    demo_dir = os.path.abspath(os.path.dirname(__file__))
    os.makedirs(demo_dir, exist_ok=True)

    print("Scanning APTOS dataset to select demo images...")

    normal_path, normal_id, normal_q = None, None, None
    dr_path, dr_id, dr_q = None, None, None
    poor_path, poor_id, poor_q = None, None, None

    selected_ids = set()

    for _, row in df.iterrows():
        id_code = str(row["id_code"])
        diagnosis = int(row["diagnosis"])
        resolved_path = resolve_image_path(image_dir, id_code)

        if not resolved_path or not os.path.exists(resolved_path):
            continue

        image_bgr = cv2.imread(resolved_path)
        if image_bgr is None:
            continue
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        q_result, _ = assessor.assess(image_rgb)

        # Look for poor quality image (fails quality gate)
        if poor_path is None and not q_result.is_gradeable and id_code not in selected_ids:
            poor_path = resolved_path
            poor_id = id_code
            poor_q = q_result
            selected_ids.add(id_code)

        # Look for Grade 0 (No DR) passing quality gate
        elif normal_path is None and diagnosis == 0 and q_result.is_gradeable and id_code not in selected_ids:
            normal_path = resolved_path
            normal_id = id_code
            normal_q = q_result
            selected_ids.add(id_code)

        # Look for Grade 2 (Moderate NPDR) passing quality gate
        elif dr_path is None and diagnosis == 2 and q_result.is_gradeable and id_code not in selected_ids:
            dr_path = resolved_path
            dr_id = id_code
            dr_q = q_result
            selected_ids.add(id_code)

        if normal_path and dr_path and poor_path:
            break

    print("\n" + "=" * 64)
    print("DEMO IMAGES SELECTION SUMMARY")
    print("=" * 64)

    if normal_path:
        dest = os.path.join(demo_dir, "normal.png")
        shutil.copy(normal_path, dest)
        print(f"\n[1] Normal Fundus Image -> demo/normal.png")
        print(f"    Source ID:       {normal_id}")
        print(f"    Ground Diagnosis: 0 (No DR)")
        print(f"    Quality Pass:     YES (Overall Score: {normal_q.overall_score:.3f})")

    if dr_path:
        dest = os.path.join(demo_dir, "dr_case.png")
        shutil.copy(dr_path, dest)
        print(f"\n[2] Diabetic Retinopathy Case -> demo/dr_case.png")
        print(f"    Source ID:       {dr_id}")
        print(f"    Ground Diagnosis: 2 (Moderate NPDR — Referable DR)")
        print(f"    Quality Pass:     YES (Overall Score: {dr_q.overall_score:.3f})")

    if poor_path:
        dest = os.path.join(demo_dir, "poor_quality.png")
        shutil.copy(poor_path, dest)
        poor_diag = df[df["id_code"] == poor_id]["diagnosis"].values[0]
        print(f"\n[3] Poor-Quality Fundus Image -> demo/poor_quality.png")
        print(f"    Source ID:       {poor_id}")
        print(f"    Ground Diagnosis: {poor_diag}")
        print(f"    Quality Pass:     NO (Overall Score: {poor_q.overall_score:.3f})")
        print(f"    Failure Reasons:  {', '.join(poor_q.failure_reasons)}")
        print(f"    Guidance:         {poor_q.recapture_guidance}")

    print("=" * 64)
    print(f"All demo images saved in: {demo_dir}")


if __name__ == "__main__":
    main()
