"""Temperature Scaling for Confidence Calibration.

Calibrates model confidence using a validation/calibration split.
Never presents raw softmax probability as clinically validated confidence.
"""
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Dict, Tuple, Optional


class TemperatureScaling(nn.Module):
    """Temperature scaling for model calibration."""

    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        """Scale logits by temperature."""
        return logits / self.temperature

    def fit(self, logits: torch.Tensor, labels: torch.Tensor, lr: float = 0.01, max_iter: int = 50) -> Dict:
        """Fit temperature on validation data.

        Args:
            logits: Unscaled model logits (N, C)
            labels: True labels (N,)
            lr: Learning rate
            max_iter: Maximum optimization iterations

        Returns:
            Training metrics
        """
        self.train()
        optimizer = optim.LBFGS([self.temperature], lr=lr, max_iter=max_iter)
        criterion = nn.CrossEntropyLoss()

        def eval_loss():
            optimizer.zero_grad()
            scaled = self.forward(logits)
            loss = criterion(scaled, labels)
            loss.backward()
            return loss

        optimizer.step(eval_loss)

        # Evaluate
        self.eval()
        with torch.no_grad():
            scaled = self.forward(logits)
            loss = criterion(scaled, labels).item()
            probs = torch.softmax(scaled, dim=1)
            confidences, preds = torch.max(probs, dim=1)
            accuracy = (preds == labels).float().mean().item()
            ece = self._compute_ece(probs.numpy(), labels.numpy())

        return {
            "temperature": self.temperature.item(),
            "loss": loss,
            "accuracy": accuracy,
            "ece": ece,
        }

    def calibrate(self, logits: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Calibrate logits and return probabilities.

        Returns:
            (calibrated_probabilities, calibrated_logits)
        """
        self.eval()
        with torch.no_grad():
            scaled = self.forward(logits)
            probs = torch.softmax(scaled, dim=1)
        return probs, scaled

    @staticmethod
    def _compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> float:
        """Compute Expected Calibration Error."""
        confidences = np.max(probs, axis=1)
        predictions = np.argmax(probs, axis=1)
        accuracies = (predictions == labels).astype(float)

        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        for i in range(n_bins):
            mask = (confidences >= bin_boundaries[i]) & (confidences < bin_boundaries[i + 1])
            if mask.sum() > 0:
                bin_acc = accuracies[mask].mean()
                bin_conf = confidences[mask].mean()
                ece += mask.sum() / len(labels) * abs(bin_acc - bin_conf)
        return float(ece)


class CalibratedPredictor:
    """Wrapper for calibrated prediction."""

    def __init__(self, model: nn.Module, temperature_scaler: Optional[TemperatureScaling] = None):
        self.model = model
        self.scaler = temperature_scaler

    def predict(self, x: torch.Tensor) -> Dict:
        """Predict with calibrated confidence."""
        self.model.eval()
        with torch.no_grad():
            logits = self.model(x)
            if self.scaler is not None:
                probs, scaled_logits = self.scaler.calibrate(logits)
            else:
                probs = torch.softmax(logits, dim=1)
                scaled_logits = logits

            confidences, predictions = torch.max(probs, dim=1)
            return {
                "logits": logits,
                "scaled_logits": scaled_logits,
                "probabilities": probs,
                "predicted_grade": predictions,
                "confidence": confidences,
                "calibrated": self.scaler is not None,
            }
