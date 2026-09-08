"""Image Quality Assessment for Fundus Images.

Assesses focus/sharpness, illumination/exposure, and field-of-view/retinal coverage.
Produces individual scores and an overall gradeability score.
"""
import cv2
import numpy as np
from typing import Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class QualityResult:
    sharpness_score: float
    illumination_score: float
    fov_score: float
    overall_score: float
    is_gradeable: bool
    failure_reasons: list
    enhancement_applied: bool
    recapture_guidance: str


class QualityAssessor:
    """Assess fundus image quality for diabetic retinopathy screening."""

    def __init__(self, config: Dict):
        self.config = config.get("quality", {})
        self.thresholds = self.config.get("thresholds", {})
        self.enhancement_config = self.config.get("enhancement", {})
        self.guidance = self.config.get("recapture_guidance", {})

    def assess(self, image: np.ndarray, apply_enhancement: bool = True) -> Tuple[QualityResult, Optional[np.ndarray]]:
        """Assess image quality and optionally enhance borderline images.

        Args:
            image: Input BGR or RGB image (H, W, C)
            apply_enhancement: Whether to attempt enhancement on borderline images

        Returns:
            (QualityResult, enhanced_image or None)
        """
        if image is None or image.size == 0:
            return self._make_failure_result(["Invalid or empty image"]), None

        # Ensure RGB
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        elif image.shape[2] == 3 and self._is_bgr(image):
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        mask, coverage = self._get_retinal_mask(gray)

        # Compute individual quality metrics
        sharpness = self._assess_sharpness(image, mask)
        illumination = self._assess_illumination(image, mask)
        fov = self._assess_fov(coverage)

        # Weighted overall score
        overall = 0.40 * sharpness + 0.35 * illumination + 0.25 * fov

        # Determine gradeability thresholds
        th_sharpness = self.thresholds.get("sharpness", 0.18)
        th_illumination = self.thresholds.get("illumination", 0.30)
        th_fov = self.thresholds.get("field_of_view", 0.50)
        th_overall = self.thresholds.get("overall", 0.40)

        failure_reasons = []
        if sharpness < th_sharpness:
            failure_reasons.append("sharpness")
        if illumination < th_illumination:
            failure_reasons.append("illumination")
        if fov < th_fov:
            failure_reasons.append("field_of_view")

        # An image is gradeable iff all individual quality gates pass and overall score meets threshold
        is_gradeable = (len(failure_reasons) == 0) and (overall >= th_overall)

        enhanced = None
        enhancement_applied = False

        # Try enhancement only for borderline images (single slight defect, not severe low light or unreadable)
        enhancement_enabled = self.enhancement_config.get("enabled", False)
        if not is_gradeable and apply_enhancement and enhancement_enabled and len(failure_reasons) == 1:
            # Severe low-light (illumination < 0.22) cannot be synthesized with CLAHE without severe noise
            if "illumination" not in failure_reasons or illumination >= 0.22:
                enhanced = self._enhance_image(image)
                gray_e = cv2.cvtColor(enhanced, cv2.COLOR_RGB2GRAY)
                mask_e, cov_e = self._get_retinal_mask(gray_e)

                sharpness_e = self._assess_sharpness(enhanced, mask_e)
                illumination_e = self._assess_illumination(enhanced, mask_e)
                fov_e = self._assess_fov(cov_e)
                overall_e = 0.40 * sharpness_e + 0.35 * illumination_e + 0.25 * fov_e

                failures_e = []
                if sharpness_e < th_sharpness:
                    failures_e.append("sharpness")
                if illumination_e < th_illumination:
                    failures_e.append("illumination")
                if fov_e < th_fov:
                    failures_e.append("field_of_view")

                if len(failures_e) == 0 and overall_e >= th_overall:
                    is_gradeable = True
                    overall = overall_e
                    sharpness = sharpness_e
                    illumination = illumination_e
                    fov = fov_e
                    failure_reasons = []
                    enhancement_applied = True

        guidance = self._build_guidance(failure_reasons)

        result = QualityResult(
            sharpness_score=float(sharpness),
            illumination_score=float(illumination),
            fov_score=float(fov),
            overall_score=float(overall),
            is_gradeable=is_gradeable,
            failure_reasons=failure_reasons,
            enhancement_applied=enhancement_applied,
            recapture_guidance=guidance,
        )

        return result, enhanced if enhancement_applied else None

    def _is_bgr(self, image: np.ndarray) -> bool:
        """Heuristic to detect BGR vs RGB."""
        r, g, b = image[:, :, 0], image[:, :, 1], image[:, :, 2]
        return np.mean(r) > np.mean(b) + 10  # BGR: blue is channel 0

    def _get_retinal_mask(self, gray: np.ndarray) -> Tuple[np.ndarray, float]:
        """Segment retinal disc foreground from the camera outer black border.

        Returns:
            (mask: uint8 array with 255 on retina and 0 elsewhere, coverage: float ratio)
        """
        h, w = gray.shape
        _, binary = cv2.threshold(gray, 12, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        mask = np.zeros_like(gray)
        if contours:
            largest = max(contours, key=cv2.contourArea)
            cv2.drawContours(mask, [largest], -1, 255, -1)
            coverage = float(cv2.contourArea(largest) / (h * w))
        else:
            coverage = float(np.mean(gray > 12))
            mask = (gray > 12).astype(np.uint8) * 255
        return mask, coverage

    def _assess_sharpness(self, image: np.ndarray, mask: Optional[np.ndarray] = None) -> float:
        """Assess focus/sharpness using normalized Laplacian variance on retinal tissue."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        if mask is None:
            mask, _ = self._get_retinal_mask(gray)

        # Standardize evaluation resolution to 512x512 to avoid pixel-count gradient scaling differences
        gray_512 = cv2.resize(gray, (512, 512), interpolation=cv2.INTER_AREA)
        mask_512 = cv2.resize(mask, (512, 512), interpolation=cv2.INTER_NEAREST)

        # Erode mask slightly to eliminate outer circular high-contrast edge step
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        eroded = cv2.erode(mask_512, kernel)

        lap = cv2.Laplacian(gray_512, cv2.CV_64F)
        if np.any(eroded > 0):
            lvar = float(lap[eroded > 0].var())
        else:
            lvar = float(lap.var())

        # Typical retinal Laplacian variance at 512x512: 25-100+ for clear, <15 for blurred/dark
        score = min(lvar / 60.0, 1.0)
        return float(max(0.0, score))

    def _assess_illumination(self, image: np.ndarray, mask: Optional[np.ndarray] = None) -> float:
        """Assess illumination/exposure using histogram analysis strictly within the retinal tissue."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        if mask is None:
            mask, _ = self._get_retinal_mask(gray)

        retina = gray[mask > 0] if np.any(mask > 0) else gray[gray > 12]
        if retina.size == 0:
            return 0.0

        ret_mean = float(np.mean(retina))
        ret_std = float(np.std(retina))
        dark_35 = float(np.mean(retina < 35))
        dark_45 = float(np.mean(retina < 45))
        bright_245 = float(np.mean(retina > 245))

        # 1. Retinal mean score (ideal clinical illumination: 60 - 140)
        if ret_mean < 40:
            # Severe low-light / underexposed
            mean_sc = max(0.0, (ret_mean - 15) / 25.0) * 0.2
        elif ret_mean < 55:
            # Low-light / underexposed
            mean_sc = 0.2 + (ret_mean - 40) / 15.0 * 0.35
        elif ret_mean <= 140:
            # Optimal illumination range
            mean_sc = 0.55 + 0.45 * min(1.0, (ret_mean - 55) / 25.0)
        else:
            # Overexposed / washed out
            mean_sc = max(0.0, 1.0 - (ret_mean - 140) / 80.0)

        # 2. Dynamic range / contrast score
        std_sc = min(ret_std / 35.0, 1.0)

        # 3. Penalties for underexposed shadows and saturated pixels in the retinal field
        exp_pen = max(0.0, 1.0 - (dark_35 * 2.0 + dark_45 * 1.0 + bright_245 * 2.5))

        score = 0.45 * mean_sc + 0.25 * std_sc + 0.30 * exp_pen
        return float(max(0.0, min(1.0, score)))

    def _assess_fov(self, coverage: float) -> float:
        """Assess field-of-view/retinal coverage based on circular mask area ratio."""
        # Normal fundus coverage is 60-90%. Below 40-50% indicates heavy decentering or pupil cut-off.
        if coverage < 0.40:
            fov_score = (coverage / 0.40) * 0.30
        elif coverage < 0.60:
            fov_score = 0.30 + ((coverage - 0.40) / 0.20) * 0.40
        elif coverage <= 0.95:
            fov_score = 0.70 + ((coverage - 0.60) / 0.35) * 0.30
        else:
            fov_score = 0.90
        return float(max(0.0, min(1.0, fov_score)))

    def _enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Enhance borderline images using CLAHE, illumination normalization, and denoising."""
        enhanced = image.copy().astype(np.float32) / 255.0

        # CLAHE
        clip_limit = self.enhancement_config.get("clahe_clip_limit", 2.0)
        grid_size = tuple(self.enhancement_config.get("clahe_grid_size", [8, 8]))
        lab = cv2.cvtColor((enhanced * 255).astype(np.uint8), cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB).astype(np.float32) / 255.0

        # Illumination normalization
        gray = cv2.cvtColor((enhanced * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (51, 51), 0)
        normalized = gray.astype(np.float32) - blurred.astype(np.float32) + 128
        normalized = np.clip(normalized, 0, 255).astype(np.uint8)
        # Apply to each channel
        ratio = normalized.astype(np.float32) / (gray.astype(np.float32) + 1e-6)
        enhanced = np.clip(enhanced * ratio[:, :, None], 0, 1)

        # Denoising
        denoise_strength = self.enhancement_config.get("denoise_strength", 10)
        enhanced = cv2.fastNlMeansDenoisingColored(
            (enhanced * 255).astype(np.uint8), None,
            h=denoise_strength, hColor=denoise_strength,
            templateWindowSize=7, searchWindowSize=21
        )

        return enhanced

    def _build_guidance(self, failure_reasons: list) -> str:
        """Build recapture guidance message."""
        if not failure_reasons:
            return "Image quality is acceptable for grading."
        messages = []
        for reason in failure_reasons:
            key = f"{reason}_fail"
            if key in self.guidance:
                messages.append(self.guidance[key])
        if not messages:
            messages.append(self.guidance.get("overall_fail", "Please recapture the image with better quality."))
        return " ".join(messages)

    def _make_failure_result(self, failure_reasons: list) -> QualityResult:
        """Create a default failure result for invalid or ungradeable images."""
        guidance = self._build_guidance(failure_reasons)
        return QualityResult(
            sharpness_score=0.0,
            illumination_score=0.0,
            fov_score=0.0,
            overall_score=0.0,
            is_gradeable=False,
            failure_reasons=failure_reasons,
            enhancement_applied=False,
            recapture_guidance=guidance,
        )
