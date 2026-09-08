"""Clinical Screening Report Generator.

Generates human-readable text and JSON screening reports for fundus image analysis.
"""
import os
import json
from datetime import datetime
from typing import Dict, Optional


class ReportGenerator:
    """Generates structured screening reports."""

    def __init__(self, config: Dict):
        self.config = config.get("reporting", {})
        self.class_names = config.get("grading", {}).get(
            "class_names", ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]
        )
        self.referable_threshold = config.get("grading", {}).get("referable_threshold", 2)
        self.disclaimer = self.config.get(
            "disclaimer",
            "This is an AI-assisted screening prototype and NOT a clinical diagnosis. Results should be reviewed by a qualified ophthalmologist."
        )

    def generate(self, case_id: str, results: Dict, save_dir: str) -> str:
        """Generate JSON and text reports.

        Args:
            case_id: Identifier for case
            results: Comprehensive results dict from pipeline
            save_dir: Target output directory

        Returns:
            Path to generated text report file
        """
        os.makedirs(save_dir, exist_ok=True)

        # Save JSON results
        json_path = os.path.join(save_dir, f"{case_id}_results.json")
        cleaned_results = self._make_json_serializable(results)
        with open(json_path, "w") as f:
            json.dump(cleaned_results, f, indent=2)

        # Build Text Report
        lines = []
        lines.append("=" * 64)
        lines.append("VISION CARE AI — DIABETIC RETINOPATHY SCREENING REPORT")
        lines.append("=" * 64)
        lines.append(f"Case ID:        {case_id}")
        lines.append(f"Date & Time:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("-" * 64)

        # Quality Section
        quality = results.get("quality", {})
        is_gradeable = quality.get("is_gradeable", False)
        lines.append("[IMAGE QUALITY ASSESSMENT]")
        lines.append(f"Overall Quality Score: {quality.get('overall_score', 0.0):.3f}")
        lines.append(f"Sharpness Score:       {quality.get('sharpness_score', 0.0):.3f}")
        lines.append(f"Illumination Score:    {quality.get('illumination_score', 0.0):.3f}")
        lines.append(f"FOV Score:             {quality.get('fov_score', 0.0):.3f}")
        lines.append(f"Quality Decision:      {'ACCEPT' if is_gradeable else 'REJECT'}")

        if not is_gradeable:
            failures = quality.get("failure_reasons", [])
            lines.append(f"Failure Reasons:       {', '.join(failures) if failures else 'Quality below threshold'}")
            lines.append(f"Recapture Guidance:    {quality.get('recapture_guidance', 'Recapture image with better quality.')}")
            lines.append("-" * 64)
            lines.append("STATUS: SCREENING HALTED DUE TO IMAGE QUALITY FAILURE")
        else:
            grading = results.get("grading", {})
            grade = grading.get("predicted_grade", 0)
            grade_name = self.class_names[grade] if 0 <= grade < len(self.class_names) else "Unknown"
            confidence = grading.get("confidence", 0.0)
            referable = grading.get("is_referable", grade >= self.referable_threshold)
            referable_prob = grading.get("referable_probability", 0.0)
            referable_thresh = grading.get("referable_threshold", 0.24)
            calibrated = results.get("calibration", {}).get("calibrated", False)

            lines.append("-" * 64)
            lines.append("[DIABETIC RETINOPATHY GRADING]")
            lines.append(f"Predicted Grade:       {grade} — {grade_name}")
            lines.append(f"Model Confidence:      {confidence:.4f} ({'Calibrated' if calibrated else 'Uncalibrated'})")
            lines.append(f"Referable Probability: {referable_prob*100:.2f}% (P(Grade 2 + 3 + 4))")
            lines.append(f"Decision Threshold:    {referable_thresh*100:.1f}%")
            lines.append(f"Referable DR Status:   {'YES — URGENT REFERRAL RECOMMENDED' if referable else 'NO — ROUTINE MONITORING'}")


            probs = grading.get("probabilities", [])
            if probs:
                lines.append("\nClass Probabilities:")
                for i, name in enumerate(self.class_names):
                    p = probs[i] if i < len(probs) else 0.0
                    lines.append(f"  Class {i} ({name:<16}): {p*100:6.2f}%")

            explain = results.get("explainability", {})
            overlay_path = explain.get("overlay_path", "N/A")
            lines.append("\n[EXPLAINABILITY & ATTENTION]")
            lines.append(f"Grad-CAM Heatmap Path: {overlay_path}")
            lines.append("Note: Grad-CAM overlay indicates model attention region, not manual lesion mask.")

            lines.append("\n[CLINICAL RECOMMENDATION]")
            if referable:
                lines.append("Refer patient to an ophthalmologist for comprehensive dilated eye examination.")
            else:
                lines.append("No referable DR detected. Continue annual DR screening schedule.")

        lines.append("-" * 64)
        lines.append("[DISCLAIMER]")
        lines.append(self.disclaimer)
        lines.append("=" * 64)

        report_txt = "\n".join(lines)
        report_path = os.path.join(save_dir, f"{case_id}_report.txt")
        with open(report_path, "w") as f:
            f.write(report_txt)

        return report_path

    def _make_json_serializable(self, obj):
        """Convert numpy types and non-serializable elements for JSON dump."""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items() if k != "processed"}
        elif isinstance(obj, list):
            return [self._make_json_serializable(v) for v in obj]
        elif hasattr(obj, "item"):
            return obj.item()
        elif hasattr(obj, "tolist"):
            return obj.tolist()
        return obj
