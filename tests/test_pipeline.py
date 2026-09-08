"""Unit and smoke tests for RetinoSage AI modules."""
import unittest
import os
import tempfile
import cv2
import numpy as np
import torch

from src.utils.common import load_config
from src.quality.quality_assessor import QualityAssessor
from src.preprocessing.preprocessor import Preprocessor
from src.segmentation.baseline_modules import LesionAnalyzer
from src.grading.model import DRGradingModel
from src.calibration.temperature_scaling import TemperatureScaling, CalibratedPredictor
from src.explainability.gradcam import GradCAM
from src.reporting.report_generator import ReportGenerator
from src.datasets.dataset import FundusDataset
from src.pipeline.pipeline import DRScreeningPipeline


class TestQualityAssessor(unittest.TestCase):
    def setUp(self):
        self.config = {
            "quality": {
                "thresholds": {"sharpness": 0.35, "illumination": 0.30, "field_of_view": 0.40, "overall": 0.45},
                "enhancement": {"clahe_clip_limit": 2.0, "clahe_grid_size": [8, 8], "denoise_strength": 10},
                "recapture_guidance": {}
            }
        }
        self.assessor = QualityAssessor(self.config)

    def test_valid_image(self):
        img = np.random.randint(50, 200, (512, 512, 3), dtype=np.uint8)
        result, _ = self.assessor.assess(img)
        self.assertIsNotNone(result)
        self.assertTrue(0 <= result.overall_score <= 1)

    def test_empty_image(self):
        result, _ = self.assessor.assess(None)
        self.assertFalse(result.is_gradeable)

    def test_low_light_image_rejected(self):
        # A dark/underexposed image with low mean brightness should fail illumination
        img = np.random.randint(5, 30, (512, 512, 3), dtype=np.uint8)
        result, _ = self.assessor.assess(img, apply_enhancement=False)
        self.assertFalse(result.is_gradeable)
        self.assertIn("illumination", result.failure_reasons)


class TestPreprocessor(unittest.TestCase):
    def setUp(self):
        self.config = {
            "preprocessing": {
                "resize": [512, 512], "preserve_original": True,
                "clahe": {"enabled": True, "clip_limit": 2.0, "tile_grid_size": [8, 8]},
                "illumination_norm": {"enabled": True, "method": "subtraction"},
                "denoising": {"enabled": True, "method": "gaussian", "kernel_size": 5},
                "extract_retinal_region": True,
                "save_intermediates": False
            },
            "image": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}
        }
        self.preprocessor = Preprocessor(self.config)

    def test_preprocess(self):
        img = np.random.randint(0, 255, (600, 600, 3), dtype=np.uint8)
        result = self.preprocessor.process(img, case_id="test")
        self.assertEqual(result["processed"].shape, (512, 512, 3))


class TestLesionAnalyzer(unittest.TestCase):
    def setUp(self):
        self.config = {
            "segmentation": {
                "optic_disc": {"enabled": True}, "fovea": {"enabled": True},
                "vessels": {"enabled": True}, "microaneurysms": {"enabled": True},
                "exudates": {"enabled": True}, "hemorrhages": {"enabled": True},
                "neovascularization": {"enabled": True}
            }
        }
        self.analyzer = LesionAnalyzer(self.config)

    def test_analysis(self):
        img = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
        results = self.analyzer.analyze(img)
        self.assertIn("optic_disc", results)
        self.assertIn("fovea", results)
        self.assertIn("microaneurysms", results)


class TestGradingModel(unittest.TestCase):
    def setUp(self):
        self.config = {
            "grading": {"num_classes": 5, "backbone": "efficientnet_b0", "dropout": 0.3}
        }
        self.model = DRGradingModel(self.config)

    def test_forward_output_shape(self):
        x = torch.randn(2, 3, 512, 512)
        out = self.model(x)
        self.assertEqual(out.shape, (2, 5))

    def test_predict(self):
        x = torch.randn(1, 3, 512, 512)
        result = self.model.predict(x)
        self.assertIn("probabilities", result)
        self.assertIn("predicted_grade", result)
        self.assertEqual(result["probabilities"].shape[1], 5)


class TestTemperatureScaling(unittest.TestCase):
    def test_fit_and_calibrate(self):
        logits = torch.randn(20, 5)
        labels = torch.randint(0, 5, (20,))
        scaler = TemperatureScaling()
        metrics = scaler.fit(logits, labels, max_iter=5)
        self.assertIn("temperature", metrics)
        self.assertIn("ece", metrics)


class TestGradCAM(unittest.TestCase):
    def setUp(self):
        self.config = {"grading": {"num_classes": 5, "backbone": "efficientnet_b0", "dropout": 0.3}}
        self.model = DRGradingModel(self.config)
        self.gradcam = GradCAM(self.model, target_layer="features")

    def test_generate(self):
        x = torch.randn(1, 3, 512, 512)
        result = self.gradcam.generate(x, target_class=0)
        self.assertIn("heatmap", result)
        self.assertIn("overlay", result)
        self.assertEqual(result["overlay"].shape, (512, 512, 3))


class TestReportGenerator(unittest.TestCase):
    def setUp(self):
        self.config = {
            "reporting": {"disclaimer": "Test disclaimer"},
            "grading": {"class_names": ["No DR", "Mild", "Moderate", "Severe", "PDR"], "referable_threshold": 2}
        }
        self.generator = ReportGenerator(self.config)

    def test_generate(self):
        results = {
            "quality": {"is_gradeable": True, "overall_score": 0.8, "sharpness_score": 0.8, "illumination_score": 0.8, "fov_score": 0.8},
            "grading": {"predicted_grade": 2, "confidence": 0.9, "probabilities": [0.05, 0.05, 0.8, 0.05, 0.05]},
            "calibration": {"calibrated": True},
            "explainability": {"overlay_path": "test_overlay.png"}
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            path = self.generator.generate("CASE_TEST", results, tmpdir)
            self.assertTrue(os.path.exists(path))


class TestDRScreeningPipeline(unittest.TestCase):
    def test_full_pipeline(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            img_path = os.path.join(tmpdir, "sample.png")
            img = np.random.randint(50, 200, (512, 512, 3), dtype=np.uint8)
            cv2.imwrite(img_path, img)

            pipeline = DRScreeningPipeline(config_path="configs/default.yaml")
            res = pipeline.run(img_path, save_dir=tmpdir, case_id="test_case")
            self.assertIn("case_id", res)
            self.assertIn("quality_pass", res)


if __name__ == "__main__":
    unittest.main()
