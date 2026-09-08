#!/usr/bin/env python3
"""Validation-Only Referable DR Threshold Analysis for Fine-Tuned Model.

Strictly analyzes the 549-image validation split to optimize the decision threshold
for referable diabetic retinopathy:
    P(referable) = P(Grade 2) + P(Grade 3) + P(Grade 4) >= threshold

The 550-image held-out test split is strictly isolated and NEVER accessed here.
"""
import argparse
import json
import os
import sys
from typing import Dict, List, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import torch
import yaml
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt

from src.utils.common import load_config, get_device, load_checkpoint, ensure_dir
from src.grading.model import DRGradingModel
from src.datasets.dataset import FundusDataset, get_val_transforms, get_stratified_splits


def collect_validation_probabilities(model, val_loader, device) -> Tuple[np.ndarray, np.ndarray]:
    """Run model inference on validation set and extract softmax probabilities."""
    model.eval()
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for batch in val_loader:
            images = batch["image"].to(device)
            labels = batch["label"]
            logits = model(images)
            probs = torch.softmax(logits, dim=1)
            all_probs.append(probs.cpu().numpy())
            all_labels.append(labels.numpy())

    all_probs = np.concatenate(all_probs, axis=0)
    all_labels = np.concatenate(all_labels, axis=0)
    return all_probs, all_labels


def sweep_thresholds(
    probs: np.ndarray,
    labels: np.ndarray,
    threshold_range: Tuple[float, float] = (0.10, 0.90),
    step: float = 0.02
) -> List[Dict]:
    """Sweep decision threshold on P(referable) = P(2) + P(3) + P(4).

    Referable: Grades 2, 3, 4 (target = 1)
    Non-referable: Grades 0, 1 (target = 0)
    """
    # Sum probabilities of moderate (2), severe (3), and proliferative (4)
    p_referable = probs[:, 2:].sum(axis=1)
    y_true = (labels >= 2).astype(int)

    total_samples = len(y_true)
    total_pos = int(y_true.sum())
    total_neg = total_samples - total_pos

    results = []
    thresholds = np.arange(threshold_range[0], threshold_range[1] + 1e-5, step)

    for thresh in thresholds:
        thresh = round(float(thresh), 4)
        y_pred = (p_referable >= thresh).astype(int)

        tp = int(((y_pred == 1) & (y_true == 1)).sum())
        fp = int(((y_pred == 1) & (y_true == 0)).sum())
        tn = int(((y_pred == 0) & (y_true == 0)).sum())
        fn = int(((y_pred == 0) & (y_true == 1)).sum())

        sensitivity = tp / max(1, total_pos)
        specificity = tn / max(1, total_neg)
        precision = tp / max(1, (tp + fp))
        f1 = (2 * precision * sensitivity) / max(1e-8, (precision + sensitivity))
        fpr = fp / max(1, total_neg)
        accuracy = (tp + tn) / total_samples

        results.append({
            "threshold": thresh,
            "sensitivity": float(sensitivity),
            "specificity": float(specificity),
            "precision": float(precision),
            "f1": float(f1),
            "accuracy": float(accuracy),
            "fpr": float(fpr),
            "tp": tp,
            "fp": fp,
            "tn": tn,
            "fn": fn,
        })

    return results


def find_candidate_thresholds(sweep_results: List[Dict]) -> Dict:
    """Identify candidate thresholds that meet screening criteria:

    1. Achieve or approach >90% sensitivity
    2. Maintain specificity comfortably above 85%
    3. Do not create an excessive false-positive rate
    """
    candidates = []
    for res in sweep_results:
        if 0.20 <= res["threshold"] <= 0.80:
            if res["sensitivity"] >= 0.88 and res["specificity"] >= 0.85:
                candidates.append(res)

    if not candidates:
        for res in sweep_results:
            if 0.20 <= res["threshold"] <= 0.80:
                if res["sensitivity"] >= 0.85 and res["specificity"] >= 0.80:
                    candidates.append(res)

    high_sens_candidates = [c for c in sweep_results if c["sensitivity"] >= 0.90 and c["specificity"] >= 0.85]
    if high_sens_candidates:
        recommended = max(high_sens_candidates, key=lambda x: (x["specificity"], x["f1"]))
    elif candidates:
        def score_fn(r):
            sens_penalty = max(0.0, 0.90 - r["sensitivity"]) * 2.0
            return (0.6 * r["sensitivity"] + 0.4 * r["specificity"]) - sens_penalty
        recommended = max(candidates, key=score_fn)
    else:
        recommended = next((r for r in sweep_results if abs(r["threshold"] - 0.50) < 1e-4), sweep_results[len(sweep_results)//2])

    return {
        "all_candidates": candidates,
        "recommended": recommended,
    }


def plot_threshold_curves(sweep_results: List[Dict], recommended: Dict, output_path: str):
    """Plot Sensitivity, Specificity, Precision, and F1 vs Threshold."""
    thresholds = [r["threshold"] for r in sweep_results]
    sensitivities = [r["sensitivity"] * 100 for r in sweep_results]
    specificities = [r["specificity"] * 100 for r in sweep_results]
    f1s = [r["f1"] * 100 for r in sweep_results]
    precisions = [r["precision"] * 100 for r in sweep_results]

    plt.figure(figsize=(10, 6))
    plt.plot(thresholds, sensitivities, label="Sensitivity (Recall)", color="blue", linewidth=2.2)
    plt.plot(thresholds, specificities, label="Specificity", color="green", linewidth=2.2)
    plt.plot(thresholds, f1s, label="F1 Score", color="orange", linestyle="--", linewidth=1.8)
    plt.plot(thresholds, precisions, label="Precision (PPV)", color="purple", linestyle=":", linewidth=1.8)

    rec_t = recommended["threshold"]
    plt.axvline(x=rec_t, color="red", linestyle="-.", linewidth=1.5, label=f"Recommended: {rec_t:.2f}")
    plt.scatter([rec_t], [recommended["sensitivity"] * 100], color="red", zorder=5)
    plt.scatter([rec_t], [recommended["specificity"] * 100], color="red", zorder=5)

    plt.title("Referable DR Threshold Sweep — Validation Set (549 Images)", fontsize=13, pad=12)
    plt.xlabel("Referable Decision Threshold: P(Grade >= 2)", fontsize=11)
    plt.ylabel("Metric (%)", fontsize=11)
    plt.xlim(0.15, 0.85)
    plt.ylim(50, 100)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(loc="lower left", fontsize=10)
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def main():
    parser = argparse.ArgumentParser(description="Referable DR Validation Threshold Analysis")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--checkpoint", default="checkpoints/finetuned_best_model.pth")
    parser.add_argument("--data-dir", default=None)
    parser.add_argument("--csv", default=None)
    parser.add_argument("--output-dir", default="./outputs/evaluation")
    args = parser.parse_args()

    ensure_dir(args.output_dir)
    config = load_config(args.config)
    data_dir = args.data_dir or config.get("paths", {}).get("data_dir", "./data/Aptos")
    csv_path = args.csv or os.path.join(data_dir, "train.csv")
    image_dir = os.path.join(data_dir, "train_images") if os.path.exists(os.path.join(data_dir, "train_images")) else data_dir

    device = get_device(config["project"]["device"])
    val_tf = get_val_transforms(config)

    # 1. STRICT ISOLATION: Load ONLY the validation split
    val_split = config["training"].get("val_split", 0.15)
    test_split = config["training"].get("test_split", 0.15)
    _, val_samples, test_samples = get_stratified_splits(
        csv_path=csv_path, image_dir=image_dir, val_split=val_split, test_split=test_split, seed=config["project"]["seed"]
    )

    print("\n" + "=" * 70)
    print("REFERABLE DR VALIDATION THRESHOLD AUDIT & OPTIMIZATION")
    print("=" * 70)
    print(f"Checkpoint: {args.checkpoint}")
    print(f"Validation Samples: {len(val_samples)} (STRICTLY VALIDATION ONLY)")
    print(f"Held-Out Test Set:  {len(test_samples)} (HELD-OUT & COMPLETELY UNTOUCHED)")

    val_dataset = FundusDataset(image_dir=image_dir, samples=val_samples, transform=val_tf)
    val_loader = DataLoader(val_dataset, batch_size=config["training"]["batch_size"], shuffle=False, num_workers=0)

    # 2. Load model
    model = DRGradingModel(config).to(device)
    load_checkpoint(model, args.checkpoint)

    # 3. Collect probabilities on validation set
    print("Extracting validation softmax probabilities...")
    probs, labels = collect_validation_probabilities(model, val_loader, device)

    # 4. Sweep thresholds from 0.10 to 0.90
    print("Performing threshold sweep over range [0.10, 0.90] (step 0.02)...")
    sweep_results = sweep_thresholds(probs, labels, threshold_range=(0.10, 0.90), step=0.02)

    # 5. Filter and identify candidate thresholds
    selection = find_candidate_thresholds(sweep_results)
    recommended = selection["recommended"]

    # 6. Save plot and metadata
    curve_plot_path = os.path.join(args.output_dir, "val_referable_threshold_curves.png")
    plot_threshold_curves(sweep_results, recommended, curve_plot_path)
    print(f"Threshold curves plot saved to: {curve_plot_path}")

    # Save complete JSON analysis
    summary = {
        "checkpoint": args.checkpoint,
        "dataset": "Aptos-Validation-Split",
        "num_val_samples": len(val_samples),
        "val_distribution": {
            "grade_0": int((labels == 0).sum()),
            "grade_1": int((labels == 1).sum()),
            "grade_2": int((labels == 2).sum()),
            "grade_3": int((labels == 3).sum()),
            "grade_4": int((labels == 4).sum()),
            "non_referable_total": int((labels < 2).sum()),
            "referable_total": int((labels >= 2).sum()),
        },
        "recommended_threshold": recommended["threshold"],
        "recommended_metrics": recommended,
        "candidate_thresholds": selection["all_candidates"],
        "sweep_results": sweep_results,
    }
    json_path = os.path.join(args.output_dir, "val_referable_threshold_analysis.json")
    with open(json_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Validation threshold analysis saved to: {json_path}")

    # Update configs/default.yaml or save dedicated threshold config
    cfg_update = {
        "referable_thresholding": {
            "enabled": True,
            "method": "probability_sum",
            "classes": [2, 3, 4],
            "optimal_threshold": recommended["threshold"],
            "validation_metrics": {
                "sensitivity": recommended["sensitivity"],
                "specificity": recommended["specificity"],
                "precision": recommended["precision"],
                "f1": recommended["f1"],
                "fpr": recommended["fpr"],
            }
        }
    }
    config_thresh_path = os.path.join("configs", "referable_threshold.yaml")
    with open(config_thresh_path, "w") as f:
        yaml.dump(cfg_update, f, default_flow_style=False)
    print(f"Referable threshold configuration saved to: {config_thresh_path}")

    # 7. Print formatted table for [0.20, 0.80]
    print("\n" + "=" * 90)
    print("VALIDATION REFERABLE-DR THRESHOLD SWEEP TABLE (P(referable) = P(2) + P(3) + P(4))")
    print("=" * 90)
    print(f"{'Threshold':<10} | {'Sensitivity':<12} | {'Specificity':<12} | {'Precision':<10} | {'F1 Score':<10} | {'TP':<5} {'FP':<5} {'TN':<5} {'FN':<5} | {'Notes'}")
    print("-" * 90)

    displayed_thresholds = [0.20, 0.25, 0.30, 0.35, 0.38, 0.40, 0.42, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]
    if recommended["threshold"] not in displayed_thresholds:
        displayed_thresholds.append(recommended["threshold"])
    displayed_thresholds.sort()

    for r in sweep_results:
        t = r["threshold"]
        if any(abs(t - dt) < 1e-4 for dt in displayed_thresholds):
            notes = ""
            if abs(t - recommended["threshold"]) < 1e-4:
                notes = "<-- RECOMMENDED"
            elif r["sensitivity"] >= 0.90 and r["specificity"] >= 0.85:
                notes = "Candidate (Sens >= 90%, Spec >= 85%)"
            elif abs(t - 0.50) < 1e-4:
                notes = "Default (0.50)"
            
            print(f"{r['threshold']:<10.2f} | {r['sensitivity']*100:<11.2f}% | {r['specificity']*100:<11.2f}% | {r['precision']*100:<9.2f}% | {r['f1']*100:<9.2f}% | {r['tp']:<5} {r['fp']:<5} {r['tn']:<5} {r['fn']:<5} | {notes}")

    print("=" * 90)
    print(f"\nRECOMMENDED FROZEN THRESHOLD: {recommended['threshold']:.2f}")
    print(f"Validation Sensitivity:       {recommended['sensitivity']*100:.2f}% ({recommended['tp']}/{recommended['tp']+recommended['fn']})")
    print(f"Validation Specificity:       {recommended['specificity']*100:.2f}% ({recommended['tn']}/{recommended['tn']+recommended['fp']})")
    print(f"Validation Precision:         {recommended['precision']*100:.2f}%")
    print(f"Validation F1 Score:          {recommended['f1']*100:.2f}%")
    print(f"Validation False Positive Rate: {recommended['fpr']*100:.2f}% ({recommended['fp']} non-referable cases flagged)")
    print(f"Validation False Negative Rate: {(1.0-recommended['sensitivity'])*100:.2f}% ({recommended['fn']} referable cases missed)")
    print("=" * 90 + "\n")


if __name__ == "__main__":
    main()
