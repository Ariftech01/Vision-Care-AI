"""Fundus Image Preprocessing Pipeline.

Preserves original image, applies reproducible preprocessing steps,
and saves intermediate outputs for demonstration/debugging.
"""
import os
import cv2
import numpy as np
from typing import Dict, Tuple, Optional, List
from pathlib import Path


class Preprocessor:
    """Reproducible fundus image preprocessing."""

    def __init__(self, config: Dict):
        self.config = config.get("preprocessing", {})
        self.target_size = tuple(self.config.get("resize", [512, 512]))
        self.preserve_original = self.config.get("preserve_original", True)
        self.save_intermediates = self.config.get("save_intermediates", True)
        self.normalize = self.config.get("normalize", True)
        self.mean = np.array(config.get("image", {}).get("mean", [0.485, 0.456, 0.406]))
        self.std = np.array(config.get("image", {}).get("std", [0.229, 0.224, 0.225]))

    def process(self, image: np.ndarray, save_dir: Optional[str] = None, case_id: str = "case") -> Dict:
        """Run full preprocessing pipeline.

        Args:
            image: Input image (RGB, uint8)
            save_dir: Directory to save intermediate outputs
            case_id: Identifier for the case

        Returns:
            Dictionary with original, processed, and intermediate images
        """
        results = {
            "original": image.copy(),
            "processed": None,
            "intermediates": {},
            "metadata": {
                "input_shape": image.shape,
                "target_size": self.target_size,
                "normalization": self.normalize,
            }
        }

        current = image.copy()

        # Step 1: Resize
        current = self._resize(current)
        results["intermediates"]["resized"] = current.copy()

        # Step 2: Extract retinal region (circular mask)
        if self.config.get("extract_retinal_region", True):
            current, mask = self._extract_retinal_region(current)
            results["intermediates"]["retinal_mask"] = mask
            results["intermediates"]["retinal_extracted"] = current.copy()

        # Step 3: CLAHE
        if self.config.get("clahe", {}).get("enabled", True):
            current = self._apply_clahe(current)
            results["intermediates"]["clahe"] = current.copy()

        # Step 4: Illumination normalization
        if self.config.get("illumination_norm", {}).get("enabled", True):
            current = self._normalize_illumination(current)
            results["intermediates"]["illumination_norm"] = current.copy()

        # Step 5: Denoising
        if self.config.get("denoising", {}).get("enabled", True):
            current = self._denoise(current)
            results["intermediates"]["denoised"] = current.copy()

        # Final normalization for model input
        if self.normalize:
            current_norm = current.astype(np.float32) / 255.0
            current_norm = (current_norm - self.mean) / self.std
        else:
            current_norm = current.astype(np.float32) / 255.0

        results["processed"] = current_norm
        results["processed_uint8"] = current
        results["metadata"]["output_shape"] = current_norm.shape

        # Save intermediates if requested
        if self.save_intermediates and save_dir:
            self._save_intermediates(results, save_dir, case_id)

        return results

    def _resize(self, image: np.ndarray) -> np.ndarray:
        """Resize image to target size."""
        return cv2.resize(image, self.target_size, interpolation=cv2.INTER_AREA)

    def _extract_retinal_region(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Extract circular retinal region and mask out background."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        h, w = gray.shape
        center = (w // 2, h // 2)
        radius = min(w, h) // 2 - 5

        # Create circular mask
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(mask, center, radius, 255, -1)

        # Apply mask
        masked = cv2.bitwise_and(image, image, mask=mask)
        return masked, mask

    def _apply_clahe(self, image: np.ndarray) -> np.ndarray:
        """Apply CLAHE to L channel in LAB color space."""
        clahe_cfg = self.config.get("clahe", {})
        clip_limit = clahe_cfg.get("clip_limit", 2.0)
        grid_size = tuple(clahe_cfg.get("tile_grid_size", [8, 8]))

        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    def _normalize_illumination(self, image: np.ndarray) -> np.ndarray:
        """Normalize uneven illumination."""
        method = self.config.get("illumination_norm", {}).get("method", "subtraction")
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (51, 51), 0)

        if method == "subtraction":
            normalized = gray.astype(np.float32) - blurred.astype(np.float32) + 128
        else:  # division
            normalized = (gray.astype(np.float32) / (blurred.astype(np.float32) + 1e-6)) * 128

        normalized = np.clip(normalized, 0, 255).astype(np.uint8)

        # Apply ratio to all channels
        ratio = normalized.astype(np.float32) / (gray.astype(np.float32) + 1e-6)
        result = np.clip(image.astype(np.float32) * ratio[:, :, None], 0, 255).astype(np.uint8)
        return result

    def _denoise(self, image: np.ndarray) -> np.ndarray:
        """Apply denoising."""
        denoise_cfg = self.config.get("denoising", {})
        method = denoise_cfg.get("method", "gaussian")
        kernel_size = denoise_cfg.get("kernel_size", 5)

        if method == "gaussian":
            return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        elif method == "median":
            return cv2.medianBlur(image, kernel_size)
        elif method == "nlmeans":
            return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
        else:
            return image

    def _save_intermediates(self, results: Dict, save_dir: str, case_id: str):
        """Save intermediate processing outputs."""
        out_dir = os.path.join(save_dir, "preprocessing", case_id)
        os.makedirs(out_dir, exist_ok=True)

        cv2.imwrite(os.path.join(out_dir, "01_original.png"),
                    cv2.cvtColor(results["original"], cv2.COLOR_RGB2BGR))

        for name, img in results["intermediates"].items():
            if len(img.shape) == 2:
                cv2.imwrite(os.path.join(out_dir, f"02_{name}.png"), img)
            else:
                cv2.imwrite(os.path.join(out_dir, f"02_{name}.png"),
                            cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

        cv2.imwrite(os.path.join(out_dir, "03_final.png"),
                    cv2.cvtColor(results["processed_uint8"], cv2.COLOR_RGB2BGR))
