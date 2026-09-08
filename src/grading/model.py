"""DR Severity Grading Model.

Transfer learning with configurable CNN backbones (EfficientNet, ResNet, ConvNeXt).
Implements ICDR severity grading: 0=No DR, 1=Mild NPDR, 2=Moderate NPDR,
3=Severe NPDR, 4=Proliferative DR.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from typing import Optional, Dict


class FocalLoss(nn.Module):
    """Focal Loss for handling class imbalance."""
    def __init__(self, num_classes: int, gamma: float = 2.0, alpha: Optional[torch.Tensor] = None, reduction: str = "mean"):
        super().__init__()
        self.num_classes = num_classes
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction
        self.ce = nn.CrossEntropyLoss(weight=alpha, reduction="none")

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = self.ce(inputs, targets)
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        if self.reduction == "mean":
            return focal_loss.mean()
        elif self.reduction == "sum":
            return focal_loss.sum()
        return focal_loss


class DRGradingModel(nn.Module):
    """Diabetic Retinopathy severity grading model."""

    def __init__(self, config: Dict):
        super().__init__()
        self.config = config.get("grading", {})
        self.num_classes = self.config.get("num_classes", 5)
        self.backbone_name = self.config.get("backbone", "efficientnet_b0")
        self.dropout = self.config.get("dropout", 0.3)

        # Build backbone
        self.features, self.feature_dim = self._build_backbone()

        # Classifier head
        self.classifier = nn.Sequential(
            nn.Dropout(self.dropout),
            nn.Linear(self.feature_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(self.dropout / 2),
            nn.Linear(512, self.num_classes)
        )

        self._init_weights()

    def _build_backbone(self):
        """Build feature extraction backbone."""
        if self.backbone_name == "efficientnet_b0":
            weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1
            model = models.efficientnet_b0(weights=weights)
            feature_dim = model.classifier[1].in_features
            model.classifier = nn.Identity()
            return model, feature_dim
        elif self.backbone_name == "resnet50":
            weights = models.ResNet50_Weights.IMAGENET1K_V2
            model = models.resnet50(weights=weights)
            feature_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, feature_dim
        elif self.backbone_name == "convnext_tiny":
            weights = models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1
            model = models.convnext_tiny(weights=weights)
            feature_dim = model.classifier[2].in_features
            model.classifier = nn.Identity()
            return model, feature_dim
        else:
            raise ValueError(f"Unsupported backbone: {self.backbone_name}")

    def _init_weights(self):
        """Initialize classifier weights."""
        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        features = self.features(x)
        if len(features.shape) > 2:
            features = F.adaptive_avg_pool2d(features, (1, 1)).flatten(1)
        logits = self.classifier(features)
        return logits

    def get_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract features before classifier."""
        features = self.features(x)
        if len(features.shape) > 2:
            features = F.adaptive_avg_pool2d(features, (1, 1)).flatten(1)
        return features

    def predict(self, x: torch.Tensor) -> Dict:
        """Predict with probabilities and confidence."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = F.softmax(logits, dim=1)
            confidences, predictions = torch.max(probs, dim=1)
        return {
            "logits": logits,
            "probabilities": probs,
            "predicted_grade": predictions,
            "confidence": confidences,
        }

    def freeze_backbone(self):
        """Freeze entire feature extraction backbone (Stage 1 fine-tuning)."""
        for param in self.features.parameters():
            param.requires_grad = False
        for param in self.classifier.parameters():
            param.requires_grad = True

    def unfreeze_backbone_stages(self, stage_indices: list):
        """Unfreeze specific feature stages of backbone (Stage 2 fine-tuning).

        For EfficientNet-B0, self.features is the torchvision EfficientNet model,
        where self.features.features contains stages 0 through 8:
          - Stage 0..5: Low-to-mid level retinal features (kept frozen)
          - Stage 6..8: High-level lesion semantics and 1x1 projection conv
        """
        # First freeze entire backbone
        for param in self.features.parameters():
            param.requires_grad = False

        # Unfreeze selected stages inside self.features.features
        if hasattr(self.features, "features"):
            num_stages = len(self.features.features)
            for idx in stage_indices:
                if 0 <= idx < num_stages:
                    for param in self.features.features[idx].parameters():
                        param.requires_grad = True
                else:
                    raise ValueError(f"Stage index {idx} out of range (0..{num_stages-1})")

        # Head remains trainable
        for param in self.classifier.parameters():
            param.requires_grad = True

    def get_parameter_groups(self, backbone_lr: float, classifier_lr: float, weight_decay: float = 1e-5):
        """Create parameter groups for discriminative learning rates."""
        backbone_params = [p for p in self.features.parameters() if p.requires_grad]
        classifier_params = [p for p in self.classifier.parameters() if p.requires_grad]
        groups = []
        if backbone_params:
            groups.append({"params": backbone_params, "lr": backbone_lr, "weight_decay": weight_decay, "name": "backbone"})
        if classifier_params:
            groups.append({"params": classifier_params, "lr": classifier_lr, "weight_decay": weight_decay, "name": "classifier"})
        return groups

    def get_layer_status_summary(self) -> Dict:
        """Return diagnostic summary of frozen and trainable parameters."""
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        frozen_params = total_params - trainable_params

        stage_status = {}
        if hasattr(self.features, "features"):
            for i, block in enumerate(self.features.features):
                is_trainable = any(p.requires_grad for p in block.parameters())
                stage_status[f"stage_{i}_{type(block).__name__}"] = "trainable" if is_trainable else "frozen"

        classifier_trainable = any(p.requires_grad for p in self.classifier.parameters())
        stage_status["classifier_head"] = "trainable" if classifier_trainable else "frozen"

        return {
            "total_params": total_params,
            "trainable_params": trainable_params,
            "frozen_params": frozen_params,
            "trainable_pct": (trainable_params / max(1, total_params)) * 100.0,
            "stage_status": stage_status,
        }


def compute_class_weights(
    labels: list,
    num_classes: int = 5,
    mode: str = "moderated",
    power: float = 0.5,
    beta: float = 0.999
) -> torch.Tensor:
    """Compute class weights for balanced training.

    Modes:
      - 'moderated': (total / (C * count))^power, normalized to mean 1.0 (default power=0.5).
      - 'class_balanced': Cui et al. (1 - beta) / (1 - beta^n_c), normalized to mean 1.0.
      - 'raw': standard inverse frequency total / (C * count).
      - 'none': uniform weights (all 1.0).
    """
    import numpy as np
    counts = np.bincount(labels, minlength=num_classes).astype(np.float32)
    counts = np.maximum(counts, 1.0)
    total = float(len(labels))

    if mode == "moderated":
        raw = total / (num_classes * counts)
        weights = raw ** power
        # Normalize so mean weight across classes is 1.0
        weights = weights * (num_classes / np.sum(weights))
    elif mode == "class_balanced":
        effective_num = 1.0 - np.power(beta, counts)
        weights = (1.0 - beta) / np.maximum(effective_num, 1e-8)
        weights = weights * (num_classes / np.sum(weights))
    elif mode == "raw":
        weights = total / (num_classes * counts)
    elif mode == "none":
        weights = np.ones(num_classes, dtype=np.float32)
    else:
        raise ValueError(f"Unknown class weight mode: {mode}")

    return torch.tensor(weights, dtype=torch.float32)


def build_criterion(
    config: Dict,
    class_weights: Optional[torch.Tensor] = None,
    loss_type: Optional[str] = None
):
    """Build loss function.

    If loss_type is specified:
      - 'moderated_ce' or 'cross_entropy': nn.CrossEntropyLoss(weight=class_weights)
      - 'focal': FocalLoss(gamma=..., alpha=class_weights)
    Otherwise falls back to config['grading']['use_focal_loss'].
    """
    grading_cfg = config.get("grading", {})
    ft_cfg = config.get("finetuning", {})

    chosen_loss = loss_type or ft_cfg.get("loss_type")
    if chosen_loss in ["moderated_ce", "cross_entropy", "ce"]:
        return nn.CrossEntropyLoss(weight=class_weights)
    elif chosen_loss == "focal":
        return FocalLoss(
            num_classes=grading_cfg.get("num_classes", 5),
            gamma=grading_cfg.get("focal_gamma", 2.0),
            alpha=class_weights,
        )

    # Legacy default fallback
    if grading_cfg.get("use_focal_loss", True):
        return FocalLoss(
            num_classes=grading_cfg.get("num_classes", 5),
            gamma=grading_cfg.get("focal_gamma", 2.0),
            alpha=class_weights,
        )
    return nn.CrossEntropyLoss(weight=class_weights)

