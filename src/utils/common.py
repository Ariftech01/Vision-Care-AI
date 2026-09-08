"""Common utilities for SIH26038."""
import os
import random
import logging
import yaml
import numpy as np
import torch
from pathlib import Path
from typing import Dict, Any, Optional


def setup_logging(log_dir: str = "./outputs/logs", level: int = logging.INFO) -> logging.Logger:
    """Setup logging with file and console handlers."""
    os.makedirs(log_dir, exist_ok=True)
    logger = logging.getLogger("sih26038")
    logger.setLevel(level)
    if not logger.handlers:
        fh = logging.FileHandler(os.path.join(log_dir, "pipeline.log"))
        fh.setLevel(level)
        ch = logging.StreamHandler()
        ch.setLevel(level)
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        logger.addHandler(fh)
        logger.addHandler(ch)
    return logger


def load_config(config_path: str = "configs/default.yaml") -> Dict[str, Any]:
    """Load YAML configuration."""
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    return config


def set_seed(seed: int = 42):
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def get_device(config_device: str = "auto") -> torch.device:
    """Get torch device."""
    if config_device == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(config_device)


def ensure_dir(path: str):
    """Ensure directory exists."""
    os.makedirs(path, exist_ok=True)


def save_checkpoint(model, optimizer, epoch, metrics, path: str, metadata: Optional[Dict] = None):
    """Save model checkpoint with optional experiment/reproducibility metadata."""
    ensure_dir(os.path.dirname(path))
    payload = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict() if optimizer is not None else None,
        "metrics": metrics,
    }
    if metadata is not None:
        payload["metadata"] = metadata
    torch.save(payload, path)



def load_checkpoint(model, path: str, optimizer=None, strict: bool = True):
    """Load model checkpoint safely supporting both dict checkpoints and raw state dicts."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Checkpoint not found: {path}")
    checkpoint = torch.load(path, map_location="cpu")
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint
    model.load_state_dict(state_dict, strict=strict)
    if optimizer is not None and isinstance(checkpoint, dict) and "optimizer_state_dict" in checkpoint:
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    return checkpoint


def get_grade_name(grade: int, class_names: list) -> str:
    """Get human-readable grade name."""
    if 0 <= grade < len(class_names):
        return class_names[grade]
    return "Unknown"


def is_referable(grade: int, threshold: int = 2) -> bool:
    """Check if grade is referable DR."""
    return grade >= threshold
