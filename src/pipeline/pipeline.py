"""End-to-end DR Screening Pipeline."""
import os
import cv2
import numpy as np
import torch
from typing import Dict, Optional

from src.utils.common import load_config, get_device, ensure_dir, load_checkpoint
from src.quality.quality_assessor import QualityAssessor
from src.preprocessing.preprocessor import Preprocessor
from src.segmentation.baseline_modules import LesionAnalyzer
from src.grading.model import DRGradingModel
from src.calibration.temperature_scaling import CalibratedPredictor, TemperatureScaling
from src.explainability.gradcam import GradCAM
from src.reporting.report_generator import ReportGenerator


class DRScreeningPipeline:
    """Complete quality-aware, explainable DR screening pipeline."""

    def __init__(self, config_path: str = "configs/default.yaml",
                 checkpoint_path: Optional[str] = None,
                 calibrator_path: Optional[str] = None):
        self.config = load_config(config_path)
        self.device = get_device(self.config.get("project", {}).get("device", "auto"))

        self.quality_assessor = QualityAssessor(self.config)
        self.preprocessor = Preprocessor(self.config)
        self.lesion_analyzer = LesionAnalyzer(self.config)

        self.grading_model = DRGradingModel(self.config).to(self.device)
        if checkpoint_path and os.path.exists(checkpoint_path):
            load_checkpoint(self.grading_model, checkpoint_path)
        self.grading_model.eval()

        self.calibrator = None
        if calibrator_path and os.path.exists(calibrator_path):
            self.calibrator = TemperatureScaling()
            calib_ckpt = torch.load(calibrator_path, map_location="cpu")
            if isinstance(calib_ckpt, dict) and "state_dict" in calib_ckpt:
                self.calibrator.load_state_dict(calib_ckpt["state_dict"])
            elif isinstance(calib_ckpt, dict):
                self.calibrator.load_state_dict(calib_ckpt)

        self.predictor = CalibratedPredictor(self.grading_model, self.calibrator)

        target_layer = self.config.get("explainability", {}).get("target_layer", "features")
        self.gradcam = GradCAM(self.grading_model, target_layer)
        self.report_generator = ReportGenerator(self.config)

    def run(self, image_path: str, save_dir: str = "./outputs",
            case_id: Optional[str] = None) -> Dict:
        case_id = case_id or os.path.splitext(os.path.basename(image_path))[0]
        ensure_dir(save_dir)

        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            raise ValueError(f"Cannot load image: {image_path}")
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        quality_result, enhanced = self.quality_assessor.assess(image_rgb)

        if not quality_result.is_gradeable:
            results = {
                "quality": quality_result.__dict__,
                "grading": {}, "calibration": {}, "explainability": {},
                "lesions": {}, "preprocessing": {},
            }
            report_path = self.report_generator.generate(case_id, results, save_dir)
            return {
                "case_id": case_id, "quality_pass": False,
                "report_path": report_path, "results": results,
            }

        working_image = enhanced if enhanced is not None else image_rgb
        preproc_results = self.preprocessor.process(
            working_image, save_dir=save_dir, case_id=case_id)
        lesion_results = self.lesion_analyzer.analyze(preproc_results["processed_uint8"])

        tensor = torch.from_numpy(preproc_results["processed"]).permute(2, 0, 1).unsqueeze(0)
        tensor = tensor.float().to(self.device)
        grading = self.predictor.predict(tensor)

        predicted_grade = grading["predicted_grade"].item()
        gradcam_result = self.gradcam.generate(tensor, target_class=predicted_grade)
        gradcam_path = os.path.join(save_dir, f"{case_id}_gradcam.png")
        cv2.imwrite(gradcam_path, cv2.cvtColor(gradcam_result["overlay"], cv2.COLOR_RGB2BGR))
        heatmap_path = os.path.join(save_dir, f"{case_id}_heatmap.png")
        cv2.imwrite(heatmap_path, cv2.cvtColor(gradcam_result["heatmap_color"], cv2.COLOR_RGB2BGR))

        probs = grading["probabilities"][0].cpu().numpy()
        confidence = float(grading["confidence"].item())

        # Frozen Referable DR Decision Rule:
        # P(referable) = P(Grade 2) + P(Grade 3) + P(Grade 4) >= 0.24
        referable_prob = float(probs[2:].sum())
        referable_threshold = float(self.config.get("referable_thresholding", {}).get("optimal_threshold", 0.24))
        referable = bool(referable_prob >= referable_threshold)

        results = {
            "quality": quality_result.__dict__,
            "preprocessing": {
                "input_shape": preproc_results["metadata"]["input_shape"],
                "target_size": preproc_results["metadata"]["target_size"],
            },
            "lesions": {k: v.detected for k, v in lesion_results.items()},
            "grading": {
                "predicted_grade": predicted_grade,
                "probabilities": probs.tolist(),
                "confidence": confidence,
                "referable_probability": referable_prob,
                "referable_threshold": referable_threshold,
                "is_referable": referable,
            },
            "calibration": {
                "confidence": confidence,
                "calibrated": grading.get("calibrated", False),
            },
            "explainability": {
                "overlay_path": gradcam_path,
                "heatmap_path": heatmap_path,
                "target_class": gradcam_result["target_class"],
            },
        }

        report_path = self.report_generator.generate(case_id, results, save_dir)
        return {
            "case_id": case_id,
            "quality_pass": True,
            "predicted_grade": predicted_grade,
            "confidence": confidence,
            "referable": referable,
            "referable_probability": referable_prob,
            "referable_threshold": referable_threshold,
            "report_path": report_path,
            "gradcam_path": gradcam_path,
            "heatmap_path": heatmap_path,
            "results": results,
        }

