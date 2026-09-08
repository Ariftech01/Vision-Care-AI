# Vision Care AI

### Smart India Hackathon 2026 — Problem Statement SIH26038
> **"Explainable AI for Diabetic Retinopathy Screening in Rural India"**

Vision Care AI is an end-to-end, clinical-grade AI screening platform designed for primary health centres (PHCs) and rural vision camps. It provides automated pre-inference image quality gating, 5-class diabetic retinopathy (DR) severity grading, transparent Grad-CAM convolutional explainability, natural-language clinical query interpretation, and standardized tele-ophthalmology handoff reports.

---

## Key System Highlights

1. **Pre-Inference Quality Gate**:
   - Evaluates retinal sharpness (Laplacian variance), illumination uniformity, and field-of-view (FOV) coverage before inference.
   - Automatically rejects blurred or dark captures with structured recapture guidance to prevent false-negative diagnostic risks.

2. **Verified EfficientNet-B0 Classifier**:
   - Architecture: PyTorch `EfficientNet-B0` with aspect-ratio preserved circular cropping and CLAHE contrast normalization (512×512).
   - Checkpoint: `checkpoints/finetuned_best_model.pth`.

3. **Frozen Referable DR Triage Rule**:
   $$\tau = 0.24 \quad (24.0\%)$$
   $$\text{Referable Decision} = P(\text{Grade 2}) + P(\text{Grade 3}) + P(\text{Grade 4}) \ge 0.24$$
   - Rigorously tuned and frozen on the validation split ($N = 549$) to achieve high clinical sensitivity for referable retinopathy without causing excessive false alarms at tertiary eye hospitals.

4. **Verified Held-Out Test Performance (550 Images — Untouched)**:
   - **Overall Accuracy**: **$81.45\%$**
   - **Macro F1-Score**: **$66.31\%$**
   - **Weighted F1-Score**: **$81.19\%$**
   - **Referable DR Sensitivity**: **$92.83\%$** (Identifies 93 out of 100 sight-threatening cases)
   - **Referable DR Specificity**: **$93.88\%$** (Minimizes unnecessary burden on retina specialists)

5. **Explainable AI (Grad-CAM)**:
   - Guided Gradient-Weighted Class Activation Mapping on layer `features[8]`.
   - Dual-view, split-slider, and opacity overlay modes.
   - Grounded distinction: convolutional attention represents feature attribution, not a substitute for histopathological lesion confirmation.

6. **Automated Tele-Ophthalmology Reporting**:
   - Generates standardized A4 handoff reports embedding the original fundus image, Grad-CAM heatmap, 5-class distribution, and clinical recommendations.
   - One-click PDF download and browser printing.

---

## Directory Structure

```
Vision-Care-AI/
├── checkpoints/
│   ├── finetuned_best_model.pth         # Primary production model weights (49.5 MB)
│   └── archive/
│       └── best_model_baseline.pth      # Historical baseline checkpoint
├── frontend/                            # React 19 + TypeScript + Vite clinical frontend
│   ├── src/
│   │   ├── components/                  # UI components, layout, and XAI viewers
│   │   ├── contexts/                    # Global ScreeningContext & ThemeContext
│   │   ├── pages/                       # 14 dedicated clinical dashboards
│   │   └── lib/                         # Data mappers & clinical presets
│   └── public/                          # Public assets and demo resources
├── configs/
│   ├── default.yaml                     # Model hyperparams, quality thresholds, paths
│   └── referable_threshold.yaml         # Frozen optimal threshold (0.24)
├── data/
│   ├── demo_images/                     # Curated representative fundus demo cases (G0–G4 & Reject)
│   └── Aptos/
│       ├── train.csv                    # Dataset split metadata
│       └── test.csv                     # Dataset split metadata
├── evaluation/
│   ├── evaluate.py                      # Model evaluation suite
│   └── threshold_analysis.py            # Validation threshold sweep script
├── training/
│   └── train.py                         # Two-stage fine-tuning and training pipeline
├── server/
│   ├── api_server.py                    # FastAPI inference backend (port 8000)
│   └── index.ts                         # Production static file server
├── src/                                 # Core Python ML modules
│   ├── pipeline/pipeline.py             # Unified end-to-end DR screening pipeline
│   ├── quality/quality_assessor.py      # Laplacian sharpness, illumination, FOV gate
│   ├── preprocessing/preprocessor.py   # CLAHE contrast enhancement & circular crop
│   ├── grading/model.py                 # EfficientNet-B0 PyTorch model definition
│   ├── explainability/gradcam.py        # Guided Grad-CAM on features[8]
│   └── reporting/report_generator.py    # Clinical triage report builder
├── main.py                              # Standalone CLI inference tool
├── requirements.txt                     # Python backend dependencies
├── package.json                         # Frontend dependencies & build scripts
├── .env.example                         # Environment variable template
└── README.md                            # Project documentation
```

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.10+ with PyTorch
- Node.js 18+ and pnpm / npm
- CUDA-compatible GPU (optional; CPU fallback is fully supported)

### 2. Python Environment Setup
```powershell
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```powershell
# Install npm dependencies
npm install
```

---

## Running the Application

### Option A: Complete Full-Stack Web Application (Recommended)

Open two terminal windows:

#### Terminal 1 — Start the Python AI Engine
```powershell
python server/api_server.py
```
*The FastAPI backend preloads `checkpoints/finetuned_best_model.pth` and listens on `http://0.0.0.0:8000`.*

#### Terminal 2 — Start the Frontend
```powershell
npx vite --port 3000 --host
```
*Open [http://localhost:3000/](http://localhost:3000/) in your browser to access the full clinical workbench.*

---

### Option B: Standalone Command-Line Inference

Run single-image screening directly from the CLI without starting web services:

```powershell
# Normal Eye (Grade 0)
python main.py --image data/demo_images/demo_01_normal_grade0.png

# Diabetic Retinopathy Case (Grade 2, Referable)
python main.py --image data/demo_images/demo_03_moderate_grade2.png

# Poor Quality Image (Quality Gate Failure)
python main.py --image data/demo_images/demo_05_poor_quality_rejected.png
```

---

## Curated Demo Cases

The `data/demo_images/` directory contains 5 curated, representative fundus photographs:
- `demo_01_normal_grade0.png`: High-quality fundus, healthy vascular margins, Grade 0.
- `demo_02_fundus_sample1.png`: Non-referable clinical sample.
- `demo_03_moderate_grade2.png`: Punctate microaneurysms, blot hemorrhages, Grade 2 ($P(\text{Ref}) \ge 0.24$).
- `demo_04_fundus_sample2.png`: Advanced fundus sample.
- `demo_05_poor_quality_rejected.png`: Severe motion blur and optical degradation, triggering automated quality gate suppression.

---

## Automated Tests & Validation

Run the test suites to verify integrity:

```powershell
# Python syntax & bytecode compilation check
python -m compileall src server training evaluation configs

# Run Python pipeline unit tests
python -m unittest discover -s tests

# Run TypeScript type check
npm run check

# Build production bundle
npm run build
```

---

## Clinical & Regulatory Disclaimer

> **IMPORTANT CLINICAL NOTICE**: Vision Care AI is an AI-assisted research and triage prototype developed for the Smart India Hackathon 2026. It is designed to assist community health officers, frontline health workers, and tele-ophthalmologists in distributed screening workflows. It is **NOT** an autonomous diagnostic medical device. All clinical interpretations, staging confirmations, and therapeutic decisions must be rendered by a certified ophthalmologist or medical professional. Performance figures reflect the held-out APTOS evaluation split.
