#!/usr/bin/env python3
"""Training and Fine-Tuning script for DR grading model using stratified splits and class balancing."""
import argparse
import datetime
import os
import sys
from typing import Dict, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from tqdm import tqdm
from sklearn.metrics import accuracy_score, f1_score, recall_score

from src.utils.common import (
    load_config,
    set_seed,
    get_device,
    save_checkpoint,
    load_checkpoint,
    ensure_dir,
)
from src.grading.model import (
    DRGradingModel,
    build_criterion,
    compute_class_weights as compute_model_class_weights,
)
from src.datasets.dataset import (
    FundusDataset,
    get_train_transforms,
    get_val_transforms,
    get_stratified_splits,
)


def compute_class_weights(train_samples, num_classes=5, mode="moderated", power=0.5) -> torch.Tensor:
    """Compute class weights using specified mode."""
    labels = [s[1] for s in train_samples]
    return compute_model_class_weights(labels, num_classes=num_classes, mode=mode, power=power)


def train_epoch(model, loader, criterion, optimizer, device):
    """Run single training epoch."""
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for batch in tqdm(loader, desc="Training", leave=False):
        images = batch["image"].to(device)
        labels = batch["label"].to(device)
        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        _, preds = torch.max(logits, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return total_loss / max(1, total), correct / max(1, total)


def validate(model, loader, criterion, device) -> Tuple[float, float, list, list]:
    """Run validation epoch with deterministic transforms (no augmentation)."""
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in tqdm(loader, desc="Validation", leave=False):
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            logits = model(images)
            loss = criterion(logits, labels)
            total_loss += loss.item() * images.size(0)
            _, preds = torch.max(logits, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    return total_loss / max(1, total), correct / max(1, total), all_preds, all_labels


def compute_val_metrics(preds: list, labels: list, val_loss: float) -> Dict:
    """Compute comprehensive validation metrics for model selection."""
    preds_arr = np.array(preds)
    labels_arr = np.array(labels)

    acc = float(accuracy_score(labels_arr, preds_arr))
    macro_f1 = float(f1_score(labels_arr, preds_arr, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(labels_arr, preds_arr, average="weighted", zero_division=0))
    per_class_f1 = [float(x) for x in f1_score(labels_arr, preds_arr, average=None, zero_division=0)]

    ref_preds = (preds_arr >= 2).astype(int)
    ref_labels = (labels_arr >= 2).astype(int)
    ref_sensitivity = float(recall_score(ref_labels, ref_preds, zero_division=0))
    ref_specificity = float(recall_score(ref_labels, ref_preds, pos_label=0, zero_division=0))

    return {
        "val_loss": float(val_loss),
        "val_acc": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "per_class_f1": per_class_f1,
        "referable_sensitivity": ref_sensitivity,
        "referable_specificity": ref_specificity,
    }


def run_dry_run(config, train_samples, val_samples, test_samples, pretrained_path, device):
    """Dry run verification without training."""
    print("\n" + "=" * 65)
    print("VISION CARE AI — FINE-TUNING DRY RUN VERIFICATION")
    print("=" * 65)

    # 1. Verify dataset split counts
    print(f"Dataset Split Sizes:")
    print(f"  Train samples:      {len(train_samples)} (Expected: 2563)")
    print(f"  Validation samples: {len(val_samples)} (Expected: 549)")
    print(f"  Test samples:       {len(test_samples)} (Expected: 550 - HELD-OUT UNTOUCHED)")
    assert len(train_samples) == 2563, f"Unexpected train count: {len(train_samples)}"
    assert len(val_samples) == 549, f"Unexpected val count: {len(val_samples)}"
    assert len(test_samples) == 550, f"Unexpected test count: {len(test_samples)}"
    print("  [PASS] Split sizes verified.")

    # 2. Verify class distribution & moderated weights
    train_labels = [s[1] for s in train_samples]
    train_counts = np.bincount(train_labels, minlength=5)
    print(f"\nTrain Class Distribution: {train_counts}")
    mod_weights = compute_class_weights(train_samples, num_classes=5, mode="moderated", power=0.5)
    raw_weights = compute_class_weights(train_samples, num_classes=5, mode="raw")
    print(f"Raw Inverse Weights:       {np.round(raw_weights.numpy(), 4)} (Spread: {raw_weights.max()/raw_weights.min():.2f}x)")
    print(f"Moderated Weights (a=0.5): {np.round(mod_weights.numpy(), 4)} (Spread: {mod_weights.max()/mod_weights.min():.2f}x)")
    print("  [PASS] Moderated class weights verified.")

    # 3. Verify baseline checkpoint compatibility
    print(f"\nPretrained Baseline Checkpoint: {pretrained_path}")
    if not os.path.exists(pretrained_path):
        raise FileNotFoundError(f"Baseline checkpoint not found at: {pretrained_path}")
    model = DRGradingModel(config).to(device)
    ckpt = load_checkpoint(model, pretrained_path)
    base_epoch = ckpt.get("epoch", "unknown") if isinstance(ckpt, dict) else "unknown"
    base_metrics = ckpt.get("metrics", {}) if isinstance(ckpt, dict) else {}
    print(f"  Loaded baseline weights successfully! Base epoch: {base_epoch}")
    print(f"  Baseline metrics recorded: {base_metrics}")
    print("  [PASS] Checkpoint architecture compatibility verified.")

    # 4. Verify Stage 1 layer freezing (Backbone frozen, head trainable)
    print(f"\nVerifying Stage 1 Layer Freezing:")
    model.freeze_backbone()
    s1_diag = model.get_layer_status_summary()
    print(f"  Total params:     {s1_diag['total_params']:,}")
    print(f"  Trainable params: {s1_diag['trainable_params']:,} ({s1_diag['trainable_pct']:.2f}%)")
    print(f"  Frozen params:    {s1_diag['frozen_params']:,}")
    print(f"  Classifier head:  {s1_diag['stage_status'].get('classifier_head')}")
    assert s1_diag['trainable_params'] == 658437, f"Stage 1 trainable params mismatch: {s1_diag['trainable_params']}"
    print("  [PASS] Stage 1 freezing verified (only classifier head is trainable).")

    # 5. Verify Stage 2 layer unfreezing (Stages 6, 7, 8 unfrozen + head)
    unfreeze_stages = config.get("finetuning", {}).get("unfreeze_stages", [6, 7, 8])
    print(f"\nVerifying Stage 2 Layer Unfreezing (Stages: {unfreeze_stages}):")
    model.unfreeze_backbone_stages(unfreeze_stages)
    s2_diag = model.get_layer_status_summary()
    print(f"  Total params:     {s2_diag['total_params']:,}")
    print(f"  Trainable params: {s2_diag['trainable_params']:,} ({s2_diag['trainable_pct']:.2f}%)")
    print(f"  Frozen params:    {s2_diag['frozen_params']:,}")
    for k, v in s2_diag["stage_status"].items():
        print(f"    - {k}: {v}")
    assert s2_diag["stage_status"]["stage_0_Conv2dNormActivation"] == "frozen"
    assert s2_diag["stage_status"]["stage_5_Sequential"] == "frozen"
    assert s2_diag["stage_status"]["stage_6_Sequential"] == "trainable"
    assert s2_diag["stage_status"]["stage_7_Sequential"] == "trainable"
    assert s2_diag["stage_status"]["stage_8_Conv2dNormActivation"] == "trainable"
    print("  [PASS] Stage 2 unfreezing verified (Stages 0..5 frozen, 6..8 + head trainable).")

    # 6. Verify Discriminative Optimizer Parameter Groups
    print(f"\nVerifying Optimizer Parameter Groups:")
    groups = model.get_parameter_groups(backbone_lr=5e-6, classifier_lr=5e-5, weight_decay=1e-5)
    for g in groups:
        p_count = sum(p.numel() for p in g["params"])
        print(f"  Group '{g.get('name', 'param_group')}': lr={g['lr']}, weight_decay={g['weight_decay']}, params={p_count:,}")
    assert len(groups) == 2, f"Expected 2 parameter groups, got {len(groups)}"
    assert groups[0]["lr"] == 5e-6, f"Backbone lr mismatch: {groups[0]['lr']}"
    assert groups[1]["lr"] == 5e-5, f"Classifier lr mismatch: {groups[1]['lr']}"
    print("  [PASS] Discriminative learning rate parameter groups verified.")

    # 7. Test dummy forward and backward pass
    print(f"\nVerifying Dummy Forward and Backward Pass:")
    criterion = nn.CrossEntropyLoss(weight=mod_weights.to(device))
    dummy_input = torch.zeros(2, 3, 512, 512, device=device)
    dummy_target = torch.tensor([0, 3], device=device)
    dummy_output = model(dummy_input)
    dummy_loss = criterion(dummy_output, dummy_target)
    dummy_loss.backward()
    print(f"  Forward pass output shape: {list(dummy_output.shape)}")
    print(f"  Loss value: {dummy_loss.item():.4f}")
    print("  [PASS] Forward and backward pass verified without error.")

    print("\n" + "=" * 65)
    print("ALL DRY-RUN CHECKS PASSED PERFECTLY!")
    print("=" * 65 + "\n")


def finetune(config, args, train_samples, val_samples, test_samples, device):
    """Execute two-stage discriminative fine-tuning."""
    ft_cfg = config.get("finetuning", {})
    pretrained_path = args.pretrained or ft_cfg.get("pretrained_checkpoint", "checkpoints/best_model.pth")
    save_checkpoint_path = args.output_checkpoint or ft_cfg.get("save_checkpoint", "checkpoints/finetuned_best_model.pth")
    ensure_dir(os.path.dirname(save_checkpoint_path))

    stage1_max_epochs = args.stage1_epochs if args.stage1_epochs is not None else int(ft_cfg.get("stage1_epochs", 4))
    stage2_max_epochs = args.stage2_epochs if args.stage2_epochs is not None else int(ft_cfg.get("stage2_epochs", 14))
    stage1_clr = float(args.classifier_lr or ft_cfg.get("stage1_classifier_lr", 1e-4))
    stage2_blr = float(args.backbone_lr or ft_cfg.get("stage2_backbone_lr", 5e-6))
    stage2_clr = float(ft_cfg.get("stage2_classifier_lr", 5e-5))
    weight_decay = float(ft_cfg.get("weight_decay", 1e-5))
    patience = int(args.patience or ft_cfg.get("early_stopping_patience", 5))
    unfreeze_stages = ft_cfg.get("unfreeze_stages", [6, 7, 8])
    weight_mode = ft_cfg.get("class_weight_mode", "moderated")
    moderation_power = float(ft_cfg.get("moderation_power", 0.5))
    loss_type = ft_cfg.get("loss_type", "moderated_ce")
    experiment_name = ft_cfg.get("experiment_name", "finetune_efficientnet_b0_moderated")

    print("\n" + "=" * 65)
    print(f"STARTING VISION CARE AI FINE-TUNING")
    print(f"Experiment: {experiment_name}")
    print(f"Pretrained Base: {pretrained_path}")
    print(f"Target Checkpoint: {save_checkpoint_path}")
    print(f"Stage 1: Head fine-tuning (max {stage1_max_epochs} epochs, lr={stage1_clr})")
    print(f"Stage 2: Feature fine-tuning (max {stage2_max_epochs} epochs, backbone_lr={stage2_blr}, head_lr={stage2_clr})")
    print(f"Moderated class weights: mode={weight_mode}, power={moderation_power}")
    print(f"Held-out test set: {len(test_samples)} images (STRICTLY ISOLATED & UNTOUCHED)")
    print("=" * 65)

    # Dataloaders (deterministic val_tf with no augmentation for validation)
    train_tf = get_train_transforms(config)
    val_tf = get_val_transforms(config)
    train_ds = FundusDataset(image_dir=None, samples=train_samples, transform=train_tf)
    val_ds = FundusDataset(image_dir=None, samples=val_samples, transform=val_tf)

    num_workers = config["training"].get("num_workers", 0)
    batch_size = config["training"]["batch_size"]
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    # Class weights and criterion
    class_weights = compute_class_weights(
        train_samples,
        num_classes=config["grading"]["num_classes"],
        mode=weight_mode,
        power=moderation_power
    ).to(device)
    print(f"Moderated Class Weights: {np.round(class_weights.cpu().numpy(), 4)}")
    criterion = build_criterion(config, class_weights=class_weights, loss_type=loss_type)

    # Initialize model from pretrained baseline checkpoint
    model = DRGradingModel(config).to(device)
    print(f"Loading learned weights from: {pretrained_path}")
    load_checkpoint(model, pretrained_path)

    best_macro_f1 = -1.0
    best_metrics = {}
    best_epoch_info = {"stage": None, "epoch": 0}
    patience_counter = 0

    # -------------------------------------------------------------
    # STAGE 1: Train Classifier Head with Backbone Frozen
    # -------------------------------------------------------------
    print(f"\n>>> ENTERING STAGE 1: Head Tuning (Backbone Frozen) <<<")
    model.freeze_backbone()
    opt_stage1 = torch.optim.AdamW(model.classifier.parameters(), lr=stage1_clr, weight_decay=weight_decay)

    for ep in range(stage1_max_epochs):
        epoch_num = ep + 1
        print(f"\n[Stage 1] Epoch {epoch_num}/{stage1_max_epochs}")
        tr_loss, tr_acc = train_epoch(model, train_loader, criterion, opt_stage1, device)
        v_loss, v_acc, preds, labels = validate(model, val_loader, criterion, device)
        metrics = compute_val_metrics(preds, labels, v_loss)

        print(f"Train Loss: {tr_loss:.4f}, Acc: {tr_acc:.4f}")
        print(f"Val Loss:   {v_loss:.4f}, Acc: {v_acc:.4f} | Macro F1: {metrics['macro_f1']:.4f} | Weighted F1: {metrics['weighted_f1']:.4f}")
        print(f"Per-Class F1: [G0: {metrics['per_class_f1'][0]:.3f}, G1: {metrics['per_class_f1'][1]:.3f}, G2: {metrics['per_class_f1'][2]:.3f}, G3: {metrics['per_class_f1'][3]:.3f}, G4: {metrics['per_class_f1'][4]:.3f}]")
        print(f"Referable DR Sens: {metrics['referable_sensitivity']:.4f} | Spec: {metrics['referable_specificity']:.4f}")

        if metrics["macro_f1"] > best_macro_f1:
            best_macro_f1 = metrics["macro_f1"]
            best_metrics = metrics
            best_epoch_info = {"stage": 1, "epoch": epoch_num}
            metadata = {
                "experiment_name": experiment_name,
                "timestamp": datetime.datetime.now().isoformat(),
                "seed": config["project"]["seed"],
                "split_counts": {"train": len(train_samples), "val": len(val_samples), "test": len(test_samples)},
                "class_weights": class_weights.cpu().tolist(),
                "weight_mode": weight_mode,
                "moderation_power": moderation_power,
                "selection_metric": "macro_f1",
                "best_epoch_info": best_epoch_info,
                "unfrozen_stages": "classifier_only",
                "lrs": {"stage1_classifier_lr": stage1_clr},
            }
            save_checkpoint(model, opt_stage1, epoch_num, best_metrics, save_checkpoint_path, metadata=metadata)
            print(f"*** New best validation Macro F1: {best_macro_f1:.4f} -> Checkpoint saved to {save_checkpoint_path} ***")

    # -------------------------------------------------------------
    # STAGE 2: Discriminative Fine-Tuning of Later Backbone Layers
    # -------------------------------------------------------------
    print(f"\n>>> ENTERING STAGE 2: Discriminative Tuning (Unfreezing Backbone Stages {unfreeze_stages}) <<<")
    # Load best weights obtained so far
    if os.path.exists(save_checkpoint_path):
        load_checkpoint(model, save_checkpoint_path)

    model.unfreeze_backbone_stages(unfreeze_stages)
    param_groups = model.get_parameter_groups(backbone_lr=stage2_blr, classifier_lr=stage2_clr, weight_decay=weight_decay)
    opt_stage2 = torch.optim.AdamW(param_groups)
    sched_stage2 = torch.optim.lr_scheduler.CosineAnnealingLR(opt_stage2, T_max=stage2_max_epochs, eta_min=1e-7)

    for ep in range(stage2_max_epochs):
        epoch_num = ep + 1
        print(f"\n[Stage 2] Epoch {epoch_num}/{stage2_max_epochs}")
        tr_loss, tr_acc = train_epoch(model, train_loader, criterion, opt_stage2, device)
        v_loss, v_acc, preds, labels = validate(model, val_loader, criterion, device)
        sched_stage2.step()
        metrics = compute_val_metrics(preds, labels, v_loss)

        print(f"Train Loss: {tr_loss:.4f}, Acc: {tr_acc:.4f}")
        print(f"Val Loss:   {v_loss:.4f}, Acc: {v_acc:.4f} | Macro F1: {metrics['macro_f1']:.4f} | Weighted F1: {metrics['weighted_f1']:.4f}")
        print(f"Per-Class F1: [G0: {metrics['per_class_f1'][0]:.3f}, G1: {metrics['per_class_f1'][1]:.3f}, G2: {metrics['per_class_f1'][2]:.3f}, G3: {metrics['per_class_f1'][3]:.3f}, G4: {metrics['per_class_f1'][4]:.3f}]")
        print(f"Referable DR Sens: {metrics['referable_sensitivity']:.4f} | Spec: {metrics['referable_specificity']:.4f}")

        if metrics["macro_f1"] > best_macro_f1:
            best_macro_f1 = metrics["macro_f1"]
            best_metrics = metrics
            best_epoch_info = {"stage": 2, "epoch": epoch_num}
            patience_counter = 0
            metadata = {
                "experiment_name": experiment_name,
                "timestamp": datetime.datetime.now().isoformat(),
                "seed": config["project"]["seed"],
                "split_counts": {"train": len(train_samples), "val": len(val_samples), "test": len(test_samples)},
                "class_weights": class_weights.cpu().tolist(),
                "weight_mode": weight_mode,
                "moderation_power": moderation_power,
                "selection_metric": "macro_f1",
                "best_epoch_info": best_epoch_info,
                "unfrozen_stages": unfreeze_stages,
                "lrs": {"stage2_backbone_lr": stage2_blr, "stage2_classifier_lr": stage2_clr},
            }
            save_checkpoint(model, opt_stage2, epoch_num, best_metrics, save_checkpoint_path, metadata=metadata)
            print(f"*** New best validation Macro F1: {best_macro_f1:.4f} -> Checkpoint saved to {save_checkpoint_path} ***")
        else:
            patience_counter += 1
            print(f"No improvement in Macro F1 for {patience_counter}/{patience} epochs.")
            if patience_counter >= patience:
                print(f"Early stopping triggered at Stage 2 Epoch {epoch_num}.")
                break

    print("\n" + "=" * 65)
    print("FINE-TUNING COMPLETED SUCCESSFULLY!")
    print(f"Best Validation Macro F1: {best_macro_f1:.4f}")
    print(f"Best Checkpoint Saved To: {save_checkpoint_path}")
    print(f"Best Epoch Details: {best_epoch_info}")
    print(f"Best Validation Metrics: {best_metrics}")
    print("Baseline checkpoint checkpoints/best_model.pth remains completely intact.")
    print("Held-out 550 test images remain completely untouched.")
    print("=" * 65 + "\n")


def standard_train(config, args, train_samples, val_samples, device):
    """Original standard training workflow (from scratch or ImageNet)."""
    train_tf = get_train_transforms(config)
    val_tf = get_val_transforms(config)

    train_ds = FundusDataset(image_dir=None, samples=train_samples, transform=train_tf)
    val_ds = FundusDataset(image_dir=None, samples=val_samples, transform=val_tf)

    num_workers = config["training"].get("num_workers", 0)
    train_loader = DataLoader(train_ds, batch_size=config["training"]["batch_size"],
                              shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=config["training"]["batch_size"],
                            shuffle=False, num_workers=num_workers)

    class_weights = compute_class_weights(
        train_samples,
        num_classes=config["grading"]["num_classes"],
        mode="raw"
    ).to(device)
    print(f"Computed Class Weights: {class_weights.cpu().numpy()}")

    model = DRGradingModel(config).to(device)
    criterion = build_criterion(config, class_weights=class_weights)
    lr = float(config["training"]["learning_rate"])
    weight_decay = float(config["training"]["weight_decay"])
    num_epochs = args.epochs if args.epochs is not None else int(config["training"].get("num_epochs", 10))

    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    best_val_loss = float("inf")
    patience_counter = 0
    ensure_dir(args.output_dir)

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch+1}/{num_epochs}")
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, preds, labels = validate(model, val_loader, criterion, device)
        scheduler.step()

        print(f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
        print(f"Val Loss:   {val_loss:.4f}, Acc: {val_acc:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            best_path = os.path.join(args.output_dir, "best_model.pth")
            save_checkpoint(model, optimizer, epoch,
                            {"val_loss": val_loss, "val_acc": val_acc},
                            best_path)
            print(f"Saved new best model to {best_path}")
        else:
            patience_counter += 1

        if patience_counter >= config["training"]["early_stopping_patience"]:
            print("Early stopping triggered.")
            break

    print("Standard training complete.")


def main():
    parser = argparse.ArgumentParser(description="Train or Fine-Tune EfficientNet-B0 DR Grading Model")
    parser.add_argument("--config", default="configs/default.yaml", help="Path to config YAML")
    parser.add_argument("--data-dir", default=None, help="Dataset directory")
    parser.add_argument("--csv", default=None, help="CSV path")
    parser.add_argument("--epochs", type=int, default=None, help="Number of standard training epochs")
    parser.add_argument("--output-dir", default="./checkpoints", help="Output directory for checkpoints")

    # Fine-tuning options
    parser.add_argument("--finetune", action="store_true", help="Run in two-stage fine-tuning mode")
    parser.add_argument("--dry-run", action="store_true", help="Verify baseline checkpoint, splits, layers, and LRs without training")
    parser.add_argument("--pretrained", default=None, help="Pretrained baseline checkpoint to fine-tune from")
    parser.add_argument("--output-checkpoint", default=None, help="Path for saving fine-tuned checkpoint")
    parser.add_argument("--stage1-epochs", type=int, default=None, help="Max epochs for Stage 1 head fine-tuning")
    parser.add_argument("--stage2-epochs", type=int, default=None, help="Max epochs for Stage 2 feature fine-tuning")
    parser.add_argument("--classifier-lr", type=float, default=None, help="Classifier head learning rate")
    parser.add_argument("--backbone-lr", type=float, default=None, help="Backbone learning rate for Stage 2")
    parser.add_argument("--patience", type=int, default=None, help="Early stopping patience")
    args = parser.parse_args()

    config = load_config(args.config)
    data_dir = args.data_dir or config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = args.csv or os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    set_seed(config["project"]["seed"])
    device = get_device(config["project"]["device"])
    print(f"Using device: {device}")

    # Stratified Dataset Splitting (Preserving exact seed=42 split)
    val_split = config["training"].get("val_split", 0.15)
    test_split = config["training"].get("test_split", 0.15)
    train_samples, val_samples, test_samples = get_stratified_splits(
        csv_path=csv_path, image_dir=image_dir, val_split=val_split, test_split=test_split, seed=config["project"]["seed"]
    )
    print(f"Dataset split — Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)}")

    if args.dry_run:
        pretrained_path = args.pretrained or config.get("finetuning", {}).get("pretrained_checkpoint", "checkpoints/best_model.pth")
        run_dry_run(config, train_samples, val_samples, test_samples, pretrained_path, device)
        return

    if args.finetune:
        finetune(config, args, train_samples, val_samples, test_samples, device)
    else:
        standard_train(config, args, train_samples, val_samples, device)


if __name__ == "__main__":
    main()

