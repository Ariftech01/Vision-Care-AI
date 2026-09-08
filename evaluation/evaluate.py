#!/usr/bin/env python3
"""Evaluation script for DR grading model on labeled held-out test split."""
import argparse
import os
import sys
from typing import Dict, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report)
import matplotlib.pyplot as plt
import seaborn as sns

from src.utils.common import load_config, get_device, load_checkpoint
from src.grading.model import DRGradingModel
from src.datasets.dataset import FundusDataset, get_val_transforms, get_stratified_splits


def evaluate_checkpoint(
    model,
    loader,
    device,
    class_names,
    referable_threshold=2,
    referable_prob_threshold=None
) -> Dict:
    """Run model inference on evaluation loader and compute all metrics.

    If referable_prob_threshold is provided:
        ref_preds = (P(class 2) + P(class 3) + P(class 4) >= referable_prob_threshold)
    Else:
        ref_preds = (argmax_class >= referable_threshold)
    """
    model.eval()
    all_preds, all_labels, all_probs = [], [], []

    with torch.no_grad():
        for batch in loader:
            images = batch["image"].to(device)
            labels = batch["label"]
            logits = model(images)
            probs = torch.softmax(logits, dim=1)
            _, preds = torch.max(logits, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    acc = float(accuracy_score(all_labels, all_preds))
    prec = float(precision_score(all_labels, all_preds, average="weighted", zero_division=0))
    rec = float(recall_score(all_labels, all_preds, average="weighted", zero_division=0))
    weighted_f1 = float(f1_score(all_labels, all_preds, average="weighted", zero_division=0))
    macro_f1 = float(f1_score(all_labels, all_preds, average="macro", zero_division=0))
    per_class_f1 = [float(x) for x in f1_score(all_labels, all_preds, average=None, zero_division=0)]

    ref_labels = (all_labels >= referable_threshold).astype(int)
    if referable_prob_threshold is not None:
        p_ref = all_probs[:, 2:].sum(axis=1)
        ref_preds = (p_ref >= referable_prob_threshold).astype(int)
        rule_desc = f"P(Grade >= 2) >= {referable_prob_threshold:.2f}"
    else:
        ref_preds = (all_preds >= referable_threshold).astype(int)
        rule_desc = f"Argmax Class >= {referable_threshold}"

    ref_sensitivity = float(recall_score(ref_labels, ref_preds, zero_division=0))
    ref_specificity = float(recall_score(ref_labels, ref_preds, pos_label=0, zero_division=0))

    cm = confusion_matrix(all_labels, all_preds)
    report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)

    return {
        "num_samples": len(all_labels),
        "accuracy": acc,
        "precision_weighted": prec,
        "recall_weighted": rec,
        "weighted_f1": weighted_f1,
        "macro_f1": macro_f1,
        "per_class_f1": per_class_f1,
        "referable_rule": rule_desc,
        "referable_sensitivity": ref_sensitivity,
        "referable_specificity": ref_specificity,
        "confusion_matrix": cm,
        "classification_report": report,
        "preds": all_preds,
        "labels": all_labels,
    }



def print_single_results(metrics: Dict, class_names: list, checkpoint_name: str):
    """Print results for a single evaluated model."""
    print("\n" + "=" * 65)
    print(f"HELD-OUT TEST SET EVALUATION: {checkpoint_name}")
    print("=" * 65)
    print(f"Evaluated Samples:               {metrics['num_samples']}")
    print(f"Accuracy:                        {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"Macro F1 Score:                  {metrics['macro_f1']:.4f} ({metrics['macro_f1']*100:.2f}%)")
    print(f"Weighted F1 Score:               {metrics['weighted_f1']:.4f} ({metrics['weighted_f1']*100:.2f}%)")
    print(f"Weighted Precision:              {metrics['precision_weighted']:.4f}")
    print(f"Weighted Recall:                 {metrics['recall_weighted']:.4f}")
    print(f"Referable DR Decision Rule:      {metrics.get('referable_rule', 'N/A')}")
    print(f"Referable DR Sensitivity (>=2): {metrics['referable_sensitivity']:.4f} ({metrics['referable_sensitivity']*100:.2f}%)")
    print(f"Referable DR Specificity (<2):  {metrics['referable_specificity']:.4f} ({metrics['referable_specificity']*100:.2f}%)")

    print("\nPer-Class F1 Breakdown:")
    for i, name in enumerate(class_names):
        print(f"  Grade {i} ({name:18s}): {metrics['per_class_f1'][i]:.4f}")

    print("\nClassification Report:")
    print(metrics["classification_report"])


def print_comparison_table(metrics_a: Dict, metrics_b: Dict, name_a: str, name_b: str, class_names: list):
    """Print comparative table between baseline and fine-tuned model."""
    print("\n" + "=" * 75)
    print(f"SIDE-BY-SIDE MODEL COMPARISON (HELD-OUT TEST SET: {metrics_a['num_samples']} IMAGES)")
    print("=" * 75)
    header = f"{'Metric':<32} | {name_a:<15} | {name_b:<15} | {'Diff':<10}"
    print(header)
    print("-" * len(header))

    rows = [
        ("Accuracy", metrics_a["accuracy"], metrics_b["accuracy"]),
        ("Macro F1", metrics_a["macro_f1"], metrics_b["macro_f1"]),
        ("Weighted F1", metrics_a["weighted_f1"], metrics_b["weighted_f1"]),
    ]
    for i, cname in enumerate(class_names):
        rows.append((f"Grade {i} F1 ({cname})", metrics_a["per_class_f1"][i], metrics_b["per_class_f1"][i]))
    rows.append(("Referable Sensitivity (>=2)", metrics_a["referable_sensitivity"], metrics_b["referable_sensitivity"]))
    rows.append(("Referable Specificity (<2)", metrics_a["referable_specificity"], metrics_b["referable_specificity"]))

    for label, val_a, val_b in rows:
        diff = val_b - val_a
        diff_str = f"{diff:+.4f}"
        print(f"{label:<32} | {val_a:<15.4f} | {val_b:<15.4f} | {diff_str:<10}")
    print("=" * 75 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Evaluate DR Grading Model on Held-Out Test Set")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--checkpoint", required=True, help="Checkpoint to evaluate")
    parser.add_argument("--compare-with", default=None, help="Optional baseline checkpoint to compare against")
    parser.add_argument("--referable-prob-threshold", type=float, default=None,
                        help="Referable probability threshold: P(2)+P(3)+P(4) >= threshold (e.g., 0.38)")
    parser.add_argument("--data-dir", default=None)
    parser.add_argument("--csv", default=None)
    parser.add_argument("--output-dir", default="./outputs/evaluation")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    config = load_config(args.config)
    data_dir = args.data_dir or config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = args.csv or os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    device = get_device(config["project"]["device"])
    val_tf = get_val_transforms(config)

    # Use exact held-out test split from stratified dataset split (seed=42)
    val_split = config["training"].get("val_split", 0.15)
    test_split = config["training"].get("test_split", 0.15)
    _, _, test_samples = get_stratified_splits(
        csv_path=csv_path, image_dir=image_dir, val_split=val_split, test_split=test_split, seed=config["project"]["seed"]
    )
    if not test_samples:
        dataset = FundusDataset(image_dir=image_dir, csv_path=csv_path, transform=val_tf)
    else:
        dataset = FundusDataset(image_dir=image_dir, samples=test_samples, transform=val_tf)

    loader = DataLoader(dataset, batch_size=config["training"]["batch_size"], shuffle=False, num_workers=0)
    class_names = config["grading"]["class_names"]
    ref_thresh = config["grading"].get("referable_threshold", 2)
    ref_prob_thresh = args.referable_prob_threshold

    # 1. Evaluate primary checkpoint
    model = DRGradingModel(config).to(device)
    load_checkpoint(model, args.checkpoint)
    metrics_primary = evaluate_checkpoint(
        model, loader, device, class_names,
        referable_threshold=ref_thresh,
        referable_prob_threshold=ref_prob_thresh
    )
    chk_name = os.path.basename(args.checkpoint)
    print_single_results(metrics_primary, class_names, chk_name)

    # Save confusion matrix
    cm_filename = f"confusion_matrix_{os.path.splitext(chk_name)[0]}.png"
    cm_path = os.path.join(args.output_dir, cm_filename)
    plt.figure(figsize=(8, 6))
    sns.heatmap(metrics_primary["confusion_matrix"], annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.title(f"Confusion Matrix — {chk_name}")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(cm_path)
    plt.close()
    print(f"Confusion matrix saved to: {cm_path}")

    # 2. If comparison requested, evaluate comparison checkpoint
    if args.compare_with:
        if not os.path.exists(args.compare_with):
            print(f"Warning: Comparison checkpoint not found: {args.compare_with}")
            return
        cmp_name = os.path.basename(args.compare_with)
        model_cmp = DRGradingModel(config).to(device)
        load_checkpoint(model_cmp, args.compare_with)
        metrics_cmp = evaluate_checkpoint(
            model_cmp, loader, device, class_names,
            referable_threshold=ref_thresh,
            referable_prob_threshold=ref_prob_thresh
        )
        print_comparison_table(metrics_cmp, metrics_primary, cmp_name, chk_name, class_names)



if __name__ == "__main__":
    main()

