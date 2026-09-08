import React, { useState, useEffect } from "react";
import { SAMPLE_CASES, FundusCase } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import { TermTooltip } from "@/components/shared/TermTooltip";
import { useScreening } from "@/contexts/ScreeningContext";
import {
  Gauge,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SunMedium,
  Focus,
  Eye,
  Camera,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const QualityPage: React.FC = () => {
  const { currentCase, loadPresetCase, analysisHistory } = useScreening();
  const [selectedCase, setSelectedCase] = useState<FundusCase>(currentCase);

  useEffect(() => {
    setSelectedCase(currentCase);
  }, [currentCase]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Pre-Inference Safeguard
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Image Quality Assessment Gate
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Automated quality evaluation preventing diagnostic misclassification on blurred, dark, or off-center fundus images.
          </p>
        </div>

        {/* Case Switcher */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-2">
          <span className="text-[11px] font-bold text-[#475569] pl-2">Select Test Sample:</span>
          {analysisHistory.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCase(c);
                loadPresetCase(c);
              }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                selectedCase.id === c.id
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-white text-[#334155] border border-[#e2e8f0] hover:bg-[#eff6ff]"
              }`}
            >
              {c.id} ({c.isGradeable ? "PASS" : "REJECT"})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Image Inspection with Quality Overlays */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0f2d4a]">Retinal Photograph Under Inspection</h2>
                <div className="text-[11px] text-[#64748b]">{selectedCase.name} · {selectedCase.cameraModel}</div>
              </div>
              <StatusBadge type="quality" value={selectedCase.isGradeable} />
            </div>

            <div className="mt-5 relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-black">
              <img
                src={selectedCase.originalImage}
                alt="Fundus Quality Scan"
                className="h-[320px] sm:h-[400px] w-full object-contain"
              />

              {/* Quality overlay indicators */}
              {!selectedCase.isGradeable && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 backdrop-blur-[1px] p-6 text-center">
                  <div className="max-w-xs rounded-2xl border border-red-400 bg-red-900/90 p-4 text-white shadow-2xl backdrop-blur-md">
                    <XCircle size={32} className="mx-auto text-red-400 mb-2" />
                    <div className="text-[14px] font-extrabold">Quality Threshold Failed</div>
                    <div className="mt-1 text-[11px] text-red-200">
                      Severe motion blur & insufficient optical contrast detect. Grading blocked.
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] text-white">
                FOV Mode: 45° Non-Mydriatic
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-[#64748b]">
              <span>Session: <strong>{selectedCase.id}</strong></span>
              <span>Overall Quality Score: <strong className={selectedCase.isGradeable ? "text-emerald-600" : "text-red-600"}>{selectedCase.quality.overall} / 100</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Deep Quality Metrics & Recapture Checklist */}
        <div className="space-y-6">
          {/* Detailed Metric Gauges */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <h3 className="text-[15px] font-extrabold text-[#0f2d4a] mb-4">
              Diagnostic Quality Metric Breakdown
            </h3>

            <div className="space-y-4">
              {/* Sharpness & Focus */}
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-[#0f2d4a]">
                  <div className="flex items-center gap-2">
                    <Focus size={16} className="text-[#2563eb]" />
                    <span>
                      <TermTooltip term="Retinal Sharpness & Focus" definition="Measures high-frequency gradient variance across the fovea and main vessel trunks using a modified Laplacian operator." />
                    </span>
                  </div>
                  <span className={selectedCase.quality.sharpness >= 70 ? "text-emerald-600 font-extrabold" : "text-red-600 font-extrabold"}>
                    {selectedCase.quality.sharpness} / 100
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCase.quality.sharpness >= 70 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${selectedCase.quality.sharpness}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[#64748b]">
                  <span>Threshold: 70 min</span>
                  <span>{selectedCase.quality.sharpness >= 70 ? "Optimal vessel sharpness" : "Unsharp: motion/refraction error"}</span>
                </div>
              </div>

              {/* Illumination */}
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-[#0f2d4a]">
                  <div className="flex items-center gap-2">
                    <SunMedium size={16} className="text-[#2563eb]" />
                    <span>
                      <TermTooltip term="Illumination & Contrast Uniformity" definition="Assesses luminance histogram entropy to detect overexposed flash glare or underexposed peripheral shadowing." />
                    </span>
                  </div>
                  <span className={selectedCase.quality.illumination >= 70 ? "text-emerald-600 font-extrabold" : "text-red-600 font-extrabold"}>
                    {selectedCase.quality.illumination} / 100
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCase.quality.illumination >= 70 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${selectedCase.quality.illumination}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[#64748b]">
                  <span>Threshold: 70 min</span>
                  <span>{selectedCase.quality.illumination >= 70 ? "Even retinal illumination" : "Uneven: dark periphery or glare artifact"}</span>
                </div>
              </div>

              {/* Field of View Coverage */}
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between text-[12px] font-bold text-[#0f2d4a]">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-[#2563eb]" />
                    <span>
                      <TermTooltip term="Retinal Field-of-View (FOV)" definition="Evaluates whether the circular fundus mask covers both the optic disc and macula lutea with at least 2 disc diameters margin." />
                    </span>
                  </div>
                  <span className={selectedCase.quality.fov >= 75 ? "text-emerald-600 font-extrabold" : "text-red-600 font-extrabold"}>
                    {selectedCase.quality.fov} / 100
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCase.quality.fov >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${selectedCase.quality.fov}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[#64748b]">
                  <span>Threshold: 75 min</span>
                  <span>{selectedCase.quality.fov >= 75 ? "Macula & disc fully framed" : "Partial occlusion or clipped margin"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recapture Protocol Guidance */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={18} className="text-[#2563eb]" />
              <h3 className="text-[15px] font-extrabold text-[#0f2d4a]">
                Frontline Health Worker Recapture Protocol
              </h3>
            </div>

            <div className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 text-[12px] text-[#9a3412] leading-relaxed mb-4">
              <strong className="block font-bold mb-1">Standard Operating Procedure for Quality Rejections:</strong>
              {selectedCase.quality.recaptureGuidance}
            </div>

            <div className="space-y-2.5 text-[12px] text-[#475569]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#2563eb] mt-0.5 shrink-0" />
                <span><strong>Dark Room Adjustment:</strong> Have the patient sit in a dimly lit booth for 3–5 minutes for natural dark adaptation and pupil dilation.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#2563eb] mt-0.5 shrink-0" />
                <span><strong>Chin Rest Stability:</strong> Firmly position patient's forehead against the head-strap to eliminate handheld tremor.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#2563eb] mt-0.5 shrink-0" />
                <span><strong>Fixation Target:</strong> Direct the patient's gaze toward the internal green fixation cross to ensure macula centering.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
