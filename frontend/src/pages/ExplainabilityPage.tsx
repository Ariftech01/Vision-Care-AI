import React, { useState } from "react";
import { SAMPLE_CASES, FundusCase } from "@/lib/mockData";
import { HeatmapViewer } from "@/components/explainability/HeatmapViewer";
import { LLMAssistant } from "@/components/explainability/LLMAssistant";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useScreening } from "@/contexts/ScreeningContext";
import {
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Stethoscope,
  Microscope,
  FileSpreadsheet
} from "lucide-react";

export const ExplainabilityPage: React.FC = () => {
  const { currentCase, loadPresetCase, analysisHistory } = useScreening();
  const [selectedCase, setSelectedCase] = useState<FundusCase>(
    currentCase.isGradeable ? currentCase : SAMPLE_CASES[0]
  );

  // Sync if currentCase changed and is gradeable
  React.useEffect(() => {
    if (currentCase.isGradeable) {
      setSelectedCase(currentCase);
    }
  }, [currentCase]);

  const activeCase = selectedCase.isGradeable ? selectedCase : SAMPLE_CASES[0];
  const referableProb =
    activeCase.grading.referableProbability ??
    activeCase.grading.probabilities.slice(2).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner Notice */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-white to-[#f0f9ff] p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
            <Sparkles size={12} /> Core Explainability Module
          </div>
          <h1 className="mt-2 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Explainable AI (XAI) Visual Workbench
          </h1>
          <p className="mt-1 text-[13px] text-[#475569]">
            Transparent Gradient-Weighted Class Activation Mapping (Grad-CAM) illuminating convolutional feature attribution.
          </p>
        </div>

        {/* Case Switcher */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbd5e1] bg-white p-2 shadow-xs">
          <span className="text-[11px] font-bold text-[#475569] pl-2">Session:</span>
          {analysisHistory.filter((c) => c.isGradeable).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCase(c);
                loadPresetCase(c);
              }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                activeCase.id === c.id
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-white text-[#334155] border border-[#e2e8f0] hover:bg-[#eff6ff]"
              }`}
            >
              {c.id} ({c.grading.gradeName.split("·")[0].replace("Grade ", "G").trim()})
            </button>
          ))}
        </div>
      </div>

      {/* Critical Medical Distinction Notice */}
      <div className="rounded-2xl border border-[#fed7aa] bg-[#fffbeb] p-4 text-[12px] text-[#92400e] flex items-start gap-3 shadow-xs">
        <ShieldAlert size={18} className="text-[#d97706] mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="font-bold block text-[#78350f]">
            Crucial Clinical Distinction: Model Attention vs. Confirmed Lesions
          </strong>
          Grad-CAM heatmaps highlight pixels where the neural network's convolutional filters experienced the highest gradient magnitude when calculating the classification score. <span className="underline font-semibold">High attention does NOT constitute a confirmed histopathological lesion.</span> An ophthalmologist must inspect the raw high-resolution fundus photograph to confirm clinical signs such as microaneurysms or neovascular complexes.
        </div>
      </div>

      {/* Main Grid: Interactive Heatmap Viewer & Evidence Analysis */}
      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Interactive Heatmap Viewer */}
        <div className="space-y-6">
          <HeatmapViewer
            originalImage={activeCase.originalImage}
            gradcamImage={activeCase.gradcamImage || activeCase.originalImage}
            heatmapImage={activeCase.heatmapImage}
          />

          {/* Saliency & Evidence Attribution Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#dce9f0] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase text-[#2563eb]">
                <Microscope size={16} /> Visual Evidence Detected
              </div>
              <ul className="mt-3 space-y-2 text-[12px] text-[#475569]">
                {activeCase.grading.clinicalFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#16a34a] mt-0.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#dce9f0] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase text-[#2563eb]">
                <FileSpreadsheet size={16} /> Clinical Criteria Correlation
              </div>
              <div className="mt-3 space-y-2 text-[12px] text-[#475569]">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Target Class:</span>
                  <strong className="text-[#0f2d4a]">Grade {activeCase.grading.predictedGrade}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Target Layer:</span>
                  <span className="font-mono text-[#2563eb]">features[8]</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Backprop Method:</span>
                  <span>Guided Grad-CAM</span>
                </div>
                <div className="flex justify-between">
                  <span>Referable Probability:</span>
                  <span className="text-[#2563eb] font-semibold">
                    {(referableProb * 100).toFixed(1)}% (Threshold: 24%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Natural Language AI Assistant + Detailed FAQ */}
        <div className="space-y-6">
          {/* LLaMA / Gemma Chat Assistant */}
          <div className="h-[520px]">
            <LLMAssistant />
          </div>

          {/* "Why did the model predict this?" Explainability Panel */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-[15px] font-extrabold text-[#0f2d4a]">
              Clinical Reasoning Breakdown
            </h3>

            <div className="space-y-3 text-[12px] leading-relaxed text-[#475569]">
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
                <strong className="block font-bold text-[#0f2d4a] mb-1">
                  Why did the model predict Grade {activeCase.grading.predictedGrade} ({activeCase.grading.gradeName.split("·")[1]?.trim() || activeCase.grading.gradeName})?
                </strong>
                {activeCase.grading.predictedGrade === 0
                  ? "The feature extraction layers identified crisp vascular margins, intact foveal avascular zone, and complete absence of microaneurysms, hemorrhages, or exudates."
                  : activeCase.grading.predictedGrade === 1
                  ? "The feature extraction layers identified isolated microaneurysms without significant hemorrhages or hard exudates."
                  : activeCase.grading.predictedGrade === 2
                  ? "The feature extraction layers identified localized microaneurysms and flame hemorrhages across multiple octants, exceeding solitary microaneurysms but without diffuse 4-quadrant involvement."
                  : "The convolutional filters detected marked vascular abnormalities, multiple blot hemorrhages, or neovascularization requiring urgent ophthalmologic intervention."}
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
                <strong className="block font-bold text-[#0f2d4a] mb-1">
                  What evidence triggered the referable triage signal?
                </strong>
                The cumulative probability for Grade ≥ 2 is{" "}
                <strong className="text-[#c2410c]">
                  {(referableProb * 100).toFixed(1)}%
                </strong>
                , evaluated against the calibrated clinical referral threshold of 24.0% (τ = 0.24).
                {referableProb >= 0.24
                  ? " Because P(referable) ≥ 0.24, an automated referral recommendation was generated."
                  : " Because P(referable) < 0.24, annual surveillance is recommended."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
