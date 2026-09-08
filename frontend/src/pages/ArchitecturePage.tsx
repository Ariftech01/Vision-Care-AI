import React, { useState } from "react";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  Camera,
  ShieldCheck,
  Cpu,
  Activity,
  Sparkles,
  MessageSquare,
  FileText,
  Stethoscope,
  ArrowRight,
  ChevronDown,
  Layers,
  Database,
  Cloud,
  CheckCircle2
} from "lucide-react";

export const ArchitecturePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const pipelineStages = [
    {
      step: 1,
      title: "Fundus Image Acquisition",
      badge: "Edge Hardware",
      icon: Camera,
      shortDesc: "Capture via 45° Non-Mydriatic Fundus Camera (USB/DICOM/File).",
      details: "Compatible with handheld cameras (e.g. Remidio NM-FOP, Forus 3nethra). Acquired at minimum 1024×1024 resolution in ambient dark room.",
      latency: "Local Acquisition",
      inputs: "Raw Sensor RGB Bayer or TIFF/PNG",
      outputs: "Standardized 24-bit sRGB Image Stream",
    },
    {
      step: 2,
      title: "Image Quality Gate",
      badge: "Pre-Inference Filter",
      icon: ShieldCheck,
      shortDesc: "Evaluates Sharpness, Illumination Uniformity & FOV coverage.",
      details: "Modified Laplacian focus assessment and luminance entropy analysis. If overall quality < 70, inference is automatically halted and recapture guidance is triggered.",
      latency: "45 ms",
      inputs: "High-Res Fundus Image",
      outputs: "Quality Metrics Vector (Pass/Fail Flag)",
    },
    {
      step: 3,
      title: "Preprocessing & CLAHE",
      badge: "Normalization",
      icon: Layers,
      shortDesc: "Aspect-ratio preserved cropping, circular masking & contrast equalization.",
      details: "Extracts circular retinal region of interest (ROI), eliminates background camera sensor artifacts, and resizes to 512×512 using bicubic interpolation.",
      latency: "28 ms",
      inputs: "Raw Passed Fundus",
      outputs: "Tensor [1, 3, 512, 512] Normalized (μ, σ)",
    },
    {
      step: 4,
      title: "DR Severity Classification",
      badge: "Core Neural Network",
      icon: Cpu,
      shortDesc: "EfficientNet-B0 backbone fine-tuned for 5-class severity grading.",
      details: "Extracts deep hierarchical retinal features. Linear projection head produces 5 logits corresponding to Grade 0 (No DR) through Grade 4 (PDR).",
      latency: "68 ms (GPU) / 1.2s (Edge CPU)",
      inputs: "Normalized 512×512 Tensor",
      outputs: "5-Class Softmax Probability Vector",
    },
    {
      step: 5,
      title: "Referable DR Evaluation",
      badge: "Clinical Triage Logic",
      icon: Activity,
      shortDesc: "Applies clinical triage threshold (Grade ≥ 2) with temperature scaling.",
      details: "Applies calibrated decision boundary (T=1.24). Binary referable flag triggers automated specialist referral priority queuing in tele-medicine records.",
      latency: "< 2 ms",
      inputs: "5-Class Softmax Vector",
      outputs: "Referable Status (Boolean) + Calibrated Confidence",
    },
    {
      step: 6,
      title: "Explainable AI (Grad-CAM)",
      badge: "Attribution Engine",
      icon: Sparkles,
      shortDesc: "Gradient-weighted class activation mapping on top conv layer.",
      details: "Backpropagates gradients from top predicted class back to features[8]. Generates heatmaps highlighting vascular arcades and micro-lesion clusters.",
      latency: "52 ms",
      inputs: "Conv Feature Maps + Target Logit Gradient",
      outputs: "512×512 Spatial Saliency Heatmap Mask",
    },
    {
      step: 7,
      title: "LLM Explanation Assistant",
      badge: "Natural Language Layer",
      icon: MessageSquare,
      shortDesc: "LLaMA-3-Med fine-tuned layer translating heatmaps into clinical text.",
      details: "Converts numerical logits, quality scores, and localized ROI coordinates into plain-language clinical summaries for community health workers and patients.",
      latency: "Streaming (~1.1s)",
      inputs: "Structured Inference JSON + Grad-CAM ROIs",
      outputs: "Formatted Clinical Summary Paragraphs",
    },
    {
      step: 8,
      title: "Screening Report Generation",
      badge: "Document Engine",
      icon: FileText,
      shortDesc: "Generates standardized A4 medical screening triage record.",
      details: "Assembles patient demographics, side-by-side fundus and Grad-CAM images, 5-class probability chart, and recommendation into an EHR-compliant PDF.",
      latency: "120 ms",
      inputs: "Complete Screening Session Payload",
      outputs: "Printable / Exportable Medical PDF",
    },
    {
      step: 9,
      title: "Ophthalmologist Review",
      badge: "Human-In-The-Loop",
      icon: Stethoscope,
      shortDesc: "Licensed eye specialist conducts final diagnostic verification.",
      details: "Specialist reviews the high-resolution fundus image with visual attention cues, verifies or overrides the AI suggestion, and signs off on therapeutic protocol.",
      latency: "Asynchronous Tele-Review",
      inputs: "Screening Report + Full-Res DICOM",
      outputs: "Clinician Signature & Final Treatment Plan",
    },
  ];

  const current = pipelineStages[activeStep];
  const StepIcon = current.icon;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Pipeline Architecture
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            End-to-End System Architecture
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Multi-stage clinical pipeline from non-mydriatic hardware capture to certified ophthalmologist tele-triage.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-bold text-emerald-800">
          <CheckCircle2 size={15} /> 9 Operational Pipeline Stages
        </div>
      </div>

      {/* Horizontal Pipeline Steps Stepper */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs overflow-x-auto">
        <div className="flex min-w-[860px] items-center justify-between gap-2">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStep === idx;
            return (
              <React.Fragment key={stage.step}>
                <button
                  onClick={() => setActiveStep(idx)}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#eff6ff] text-[#2563eb] ring-2 ring-[#2563eb] shadow-xs"
                      : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f2d4a]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive ? "bg-[#2563eb] text-white shadow-sm" : "bg-[#f1f5f9] text-[#475569]"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="mt-2 text-[11px] font-bold text-center w-20 truncate">
                    {stage.title.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">0{stage.step}</span>
                </button>
                {idx < pipelineStages.length - 1 && (
                  <ArrowRight size={14} className="text-[#cbd5e1] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Active Stage Deep-Dive Card */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
              <StepIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#2563eb]">Stage {current.step} of 9</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {current.badge}
                </span>
              </div>
              <h2 className="text-[20px] font-extrabold text-[#0f2d4a]">{current.title}</h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Execution Budget</div>
            <div className="text-[14px] font-extrabold text-[#0f2d4a] font-mono">{current.latency}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-[13px] font-extrabold text-[#0f2d4a] mb-2">Functional Description</h3>
            <p className="text-[13px] leading-relaxed text-[#475569]">{current.details}</p>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <span className="text-[10px] font-bold uppercase text-[#64748b] block">Input Contract</span>
              <strong className="text-[#0f2d4a] font-mono text-[11px]">{current.inputs}</strong>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <span className="text-[10px] font-bold uppercase text-[#64748b] block">Output Contract</span>
              <strong className="text-[#2563eb] font-mono text-[11px]">{current.outputs}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Future Extensions Roadmap Card */}
      <div className="rounded-3xl border border-[#cbd5e1] bg-gradient-to-br from-[#f8fafc] to-[#eff6ff]/30 p-6 sm:p-8 shadow-xs">
        <h3 className="text-[16px] font-extrabold text-[#0f2d4a] mb-3">
          Future Planned Modules & Extensions
        </h3>
        <div className="grid gap-4 sm:grid-cols-3 text-[12px]">
          <div className="rounded-2xl border border-white bg-white p-4 shadow-xs">
            <strong className="block text-[#0f2d4a] font-bold mb-1">UNet Vessel Segmentation</strong>
            <p className="text-[11px] text-[#64748b]">
              Precise arteriovenous ratio (AVR) calculation for hypertensive retinopathy overlap detection.
            </p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-4 shadow-xs">
            <strong className="block text-[#0f2d4a] font-bold mb-1">Macular Edema (CSME) Detector</strong>
            <p className="text-[11px] text-[#64748b]">
              Identifies hard exudates within 500 microns of the foveal center requiring emergency anti-VEGF.
            </p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-4 shadow-xs">
            <strong className="block text-[#0f2d4a] font-bold mb-1">Tele-Ophthalmology Webhook Sync</strong>
            <p className="text-[11px] text-[#64748b]">
              Automatic FHIR-compliant push to state health hospital management information systems (HMIS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
