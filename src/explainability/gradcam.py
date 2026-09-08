"""Grad-CAM Explainability for DR Grading.

Generates attention heatmaps to explain model decisions.
Distinguishes model attention from true lesion segmentation.
"""
import torch
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Dict, Optional


class GradCAM:
    """Gradient-weighted Class Activation Mapping for PyTorch vision backbones."""

    def __init__(self, model: torch.nn.Module, target_layer: Optional[str] = "features"):
        self.model = model
        self.target_layer_name = target_layer
        self.gradients = None
        self.activations = None
        self.hooks = []
        self._register_hooks()

    def _register_hooks(self):
        """Register forward and backward hooks on the last convolutional layer."""
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        target_module = None
        named_modules = dict(self.model.named_modules())
        if self.target_layer_name and self.target_layer_name in named_modules:
            mod = named_modules[self.target_layer_name]
            if isinstance(mod, torch.nn.Conv2d):
                target_module = mod
            else:
                # If target is a block/sequential, find the last Conv2d inside it
                for m in mod.modules():
                    if isinstance(m, torch.nn.Conv2d):
                        target_module = m

        if target_module is None:
            target_module = self._find_last_conv_layer()

        if target_module is None:
            raise ValueError("No Convolutional layer found in model for Grad-CAM.")

        self.hooks.append(target_module.register_forward_hook(forward_hook))
        self.hooks.append(target_module.register_full_backward_hook(backward_hook))

    def _find_last_conv_layer(self) -> Optional[torch.nn.Module]:
        """Find the last Conv2d layer in the model."""
        last_conv = None
        for module in self.model.modules():
            if isinstance(module, torch.nn.Conv2d):
                last_conv = module
        return last_conv

    def generate(self, input_tensor: torch.Tensor, target_class: Optional[int] = None) -> Dict:
        """Generate Grad-CAM heatmap.

        Args:
            input_tensor: (1, C, H, W) tensor
            target_class: Target class index to highlight (optional)

        Returns:
            Dictionary with heatmap, overlay image, and metadata.
        """
        self.model.eval()
        input_tensor = input_tensor.clone().detach().requires_grad_(True)

        logits = self.model(input_tensor)
        if target_class is None:
            target_class = logits.argmax(dim=1).item()

        self.model.zero_grad()
        score = logits[0, target_class]
        score.backward()

        if self.gradients is None or self.activations is None:
            raise RuntimeError("Grad-CAM failed to capture gradients or activations.")

        gradients = self.gradients
        activations = self.activations

        if gradients.dim() == 4:
            gradients = gradients[0]
        if activations.dim() == 4:
            activations = activations[0]

        weights = gradients.mean(dim=(1, 2), keepdim=True)  # (C, 1, 1)
        cam = (weights * activations).sum(dim=0)  # (H, W)
        cam = F.relu(cam)

        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = torch.zeros_like(cam)

        cam_np = cam.cpu().numpy()
        h, w = input_tensor.shape[2], input_tensor.shape[3]
        cam_resized = cv2.resize(cam_np, (w, h))

        heatmap = np.uint8(255 * cam_resized)
        heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

        input_img = self._denormalize(input_tensor[0])
        input_img_uint8 = np.uint8(255 * input_img)
        overlay = cv2.addWeighted(input_img_uint8, 0.6, heatmap_color, 0.4, 0)

        return {
            "heatmap": heatmap,
            "heatmap_color": heatmap_color,
            "overlay": overlay,
            "target_class": target_class,
        }

    def _denormalize(self, tensor: torch.Tensor, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) -> np.ndarray:
        """Denormalize image tensor for visual overlay."""
        mean_t = torch.tensor(mean, device=tensor.device).view(3, 1, 1)
        std_t = torch.tensor(std, device=tensor.device).view(3, 1, 1)
        img = tensor * std_t + mean_t
        img = torch.clamp(img, 0, 1)
        return img.detach().permute(1, 2, 0).cpu().numpy()

    def remove_hooks(self):
        """Remove PyTorch hooks."""
        for hook in self.hooks:
            hook.remove()
        self.hooks = []

    def __del__(self):
        self.remove_hooks()
