import React, { useState } from "react";
import { Link } from "wouter";
import { SAMPLE_CASES, FundusCase, DR_GRADES_INFO } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useScreening } from "@/contexts/ScreeningContext";
import {
  Upload,
  Sparkles,
  ShieldCheck,
  Activity,
  ArrowRight,
  FileText,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Info,
  Layers,
  FileDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const ScreeningPage: React.FC = () => {
  const {
    currentCase,
    setCurrentCase,
    isAnalyzing,
    analysisStep,
    analysisHistory,
    serverStatus,
    analyzeImage,
    loadPresetCase,
  } = useScreening();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"original" | "gradcam">("original");
  const [gradcamOpacity, setGradcamOpacity] = useState<number>(85);

  // Patient metadata form state
  const [patientId, setPatientId] = useState<string>(currentCase.patientId);
  const [patientName, setPatientName] = useState<string>(currentCase.name);
  const [patientAge, setPatientAge] = useState<number>(currentCase.age);
  const [patientGender, setPatientGender] = useState<string>(currentCase.gender);
  const [phcLocation, setPhcLocation] = useState<string>(currentCase.phcLocation);

  const handleSelectPreset = (c: FundusCase) => {
    loadPresetCase(c);
    setSelectedFile(null);
    setLocalPreview(null);
    setPreviewMode(c.gradcamImage && c.isGradeable ? "gradcam" : "original");
    setPatientId(c.patientId);
    setPatientName(c.name);
    setPatientAge(c.age);
    setPatientGender(c.gender);
    setPhcLocation(c.phcLocation);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);
      setPreviewMode("original");
      toast.success("Retinal photograph selected. Click 'Analyze Retinal Image' to run inference.");
    }
  };

  const handleRunAnalysis = async () => {
    if (selectedFile) {
      const analyzedCase = await analyzeImage(selectedFile, {
        patientId,
        patientName,
        patientAge,
        patientGender,
        phcLocation,
      });
      setSelectedFile(null);
      setLocalPreview(null);
      if (analyzedCase?.gradcamImage && analyzedCase.isGradeable) {
        setPreviewMode("gradcam");
      }
    } else {
      // Re-run or run on current image
      try {
        const imageUrl = currentCase.originalImage;
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], `${currentCase.id}.png`, { type: "image/png" });
        const analyzedCase = await analyzeImage(file, {
          patientId,
          patientName,
          patientAge,
          patientGender,
          phcLocation,
        });
        setSelectedFile(null);
        setLocalPreview(null);
        if (analyzedCase?.gradcamImage && analyzedCase.isGradeable) {
          setPreviewMode("gradcam");
        }
      } catch (e: any) {
        toast.info("Please browse a new retinal photograph or choose a sample case.");
      }
    }
  };

  const displayedImage = localPreview || currentCase.originalImage;
  const referableProb =
    currentCase.grading.referableProbability ??
    currentCase.grading.probabilities.slice(2).reduce((a, b) => a + b, 0);
  const referableThreshold = currentCase.grading.referableThreshold ?? 0.24;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
              Operational Workflow
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <span className={`h-1.5 w-1.5 rounded-full ${serverStatus.online ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {serverStatus.online
                ? `Engine: ${(serverStatus.device || "CUDA").toUpperCase()} (${serverStatus.architecture || "EfficientNet-B0"})`
                : "Engine Connecting..."}
            </span>
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Screening & Inference Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Upload or inspect retinal fundus images for quality gating, 5-class severity grading, and Grad-CAM explainability.
          </p>
        </div>

        {/* Quick Demo Case Switcher */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-2">
          <span className="text-[11px] font-bold text-[#475569] pl-2">Sample Presets:</span>
          {analysisHistory.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectPreset(c)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                currentCase.id === c.id
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-white text-[#334155] border border-[#e2e8f0] hover:bg-[#eff6ff]"
              }`}
            >
              {c.id} ({c.grading.gradeName.split("·")[0].replace("Grade ", "G").trim()})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Image Upload, Preview & Patient Metadata */}
        <div className="space-y-6">
          {/* Fundus Image Upload Stage */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0f2d4a]">1. Retinal Fundus Photograph</h2>
                <div className="text-[11px] text-[#64748b]">Macula & Disc 45° Field-of-View (PNG / JPEG)</div>
              </div>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-bold text-[#475569]">
                Case: {currentCase.id}
              </span>
            </div>

            {/* Image Preview & Upload Dropzone */}
            <div className="mt-5 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-950">
                {/* View Switcher Overlay (Fundus vs Grad-CAM Heatmap) */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-xl border border-white/20 bg-black/75 p-1 backdrop-blur-md shadow-md">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("original")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      previewMode === "original"
                        ? "bg-white text-[#0f2d4a] shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Eye size={12} />
                    Original Fundus
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("gradcam")}
                    disabled={!currentCase.gradcamImage || !currentCase.isGradeable}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      previewMode === "gradcam"
                        ? "bg-[#2563eb] text-white shadow-xs"
                        : "text-slate-300 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                    }`}
                  >
                    <Sparkles size={12} />
                    Grad-CAM Heatmap
                  </button>
                </div>

                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/30 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md hover:bg-black/80 transition-colors shadow-xs">
                    <Upload size={13} />
                    Browse New Image
                    <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
                  </label>
                </div>

                {/* Base Fundus Image */}
                <img
                  src={displayedImage}
                  alt="Fundus Target"
                  className="h-[300px] sm:h-[360px] w-full object-contain"
                />

                {/* Grad-CAM Attention Heatmap Overlay */}
                {previewMode === "gradcam" && currentCase.gradcamImage && currentCase.isGradeable && (
                  <img
                    src={currentCase.gradcamImage}
                    alt="Grad-CAM Attention Heatmap"
                    className="absolute inset-0 h-[300px] sm:h-[360px] w-full object-contain transition-opacity duration-150"
                    style={{ opacity: gradcamOpacity / 100 }}
                  />
                )}

                {/* Bottom Status Badges */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-mono text-white backdrop-blur-xs">
                    Camera: {currentCase.cameraModel}
                  </div>
                  {currentCase.gradcamImage && currentCase.isGradeable && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <Sparkles size={10} /> features[8] Active
                    </span>
                  )}
                </div>

                {/* Attention Heatmap Legend (visible in Grad-CAM mode) */}
                {previewMode === "gradcam" && currentCase.gradcamImage && currentCase.isGradeable && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-black/80 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-md border border-white/10">
                    <span>Low</span>
                    <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#2563eb] via-[#10b981] via-[#facc15] to-[#ef4444]" />
                    <span className="text-[#ef4444]">High Attention</span>
                  </div>
                )}
              </div>

              {/* Heatmap Blend Controls & Deep Inspection Link */}
              {previewMode === "gradcam" && currentCase.gradcamImage && currentCase.isGradeable && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0f2d4a]">Heatmap Opacity:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={gradcamOpacity}
                      onChange={(e) => setGradcamOpacity(Number(e.target.value))}
                      className="h-1.5 w-28 cursor-pointer accent-[#2563eb]"
                    />
                    <span className="font-mono font-bold text-[#2563eb]">{gradcamOpacity}%</span>
                  </div>
                  <Link href="/explainability">
                    <span className="cursor-pointer font-bold text-[#2563eb] hover:underline flex items-center gap-1">
                      Open in Explainability Workbench &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Patient Metadata Form */}
            <div className="mt-6 border-t border-[#f1f5f9] pt-5">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[#64748b] mb-3">
                Patient & Session Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#475569]">Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[12px] font-bold text-[#0f2d4a] outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#475569]">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[12px] font-bold text-[#0f2d4a] outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#475569]">Age / Gender</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(Number(e.target.value))}
                      className="w-16 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-2 text-[12px] font-bold text-[#0f2d4a] outline-none"
                    />
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="flex-1 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-2 text-[12px] font-bold text-[#0f2d4a] outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-[#475569]">PHC Health Centre</label>
                <input
                  type="text"
                  value={phcLocation}
                  onChange={(e) => setPhcLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[12px] font-semibold text-[#0f2d4a] outline-none"
                />
              </div>
            </div>

            {/* Run Analysis Action Button */}
            <div className="mt-6">
              <Button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="h-12 w-full rounded-xl bg-[#2563eb] text-[13px] font-bold text-white shadow-md hover:bg-[#1d4ed8] disabled:bg-slate-300"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {analysisStep || "Running inference..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles size={16} /> Analyze Retinal Image (EfficientNet-B0)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Automated Screening Findings & Triage */}
        <div className="space-y-6">
          {/* Quality Assessment Gate Card */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#0f2d4a]">Quality Gate Assessment</h3>
                  <div className="text-[11px] text-[#64748b]">Automated pre-inference integrity check</div>
                </div>
              </div>
              <StatusBadge type="quality" value={currentCase.isGradeable} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-[#64748b]">Sharpness</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#0f2d4a]">
                  {currentCase.quality.sharpness}
                  <span className="text-[11px] text-[#94a3b8]">/100</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-[#64748b]">Illumination</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#0f2d4a]">
                  {currentCase.quality.illumination}
                  <span className="text-[11px] text-[#94a3b8]">/100</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-[#64748b]">FOV Coverage</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#0f2d4a]">
                  {currentCase.quality.fov}
                  <span className="text-[11px] text-[#94a3b8]">/100</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[#64748b] leading-relaxed">
              <strong>Guidance:</strong> {currentCase.quality.recaptureGuidance}
            </p>
          </div>

          {/* AI Severity Grading Card */}
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#0f2d4a]">Diabetic Retinopathy Grade</h3>
                  <div className="text-[11px] text-[#64748b]">EfficientNet-B0 · 5-Class Categorization</div>
                </div>
              </div>
              {currentCase.isGradeable && (
                <StatusBadge type="referable" value={currentCase.grading.isReferable} />
              )}
            </div>

            {currentCase.isGradeable ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-[#f8fafc] to-[#eff6ff]/50 p-4 border border-[#e2e8f0]">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                      Severity Diagnosis
                    </div>
                    <div className="mt-1 text-[22px] font-extrabold text-[#0f2d4a]">
                      {currentCase.grading.gradeName}
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Model Confidence: <strong>{(currentCase.grading.confidence * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                  <StatusBadge type="grade" value={currentCase.grading.predictedGrade} size="lg" />
                </div>

                {/* Referable Triage Threshold Card */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Referable Metric: P(Grade ≥ 2)
                      </span>
                      <div className="text-[16px] font-extrabold text-[#0f2d4a]">
                        {(referableProb * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Referral Decision (τ = 0.24)
                      </span>
                      <div>
                        {referableProb >= referableThreshold ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                            REFERABLE (≥ 24%)
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            NON-REFERABLE (&lt; 24%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Class Probability Bar Distribution */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
                    Class Probability Distribution (Softmax Logits)
                  </div>
                  <div className="space-y-2">
                    {DR_GRADES_INFO.map((g, idx) => {
                      const prob = currentCase.grading.probabilities[idx] || 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-[#475569]">
                            <span>Grade {g.grade}: {g.shortName}</span>
                            <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(prob * 100, 2)}%`,
                                backgroundColor: g.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Recommendation Box */}
                <div className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 text-[12px] text-[#9a3412]">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle size={14} className="text-[#ea580c]" />
                    Recommended Clinical Referral Action:
                  </div>
                  <p className="leading-relaxed">{currentCase.grading.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                <div className="text-[14px] font-bold text-red-700">Inference Suppressed Due to Quality Rejection</div>
                <p className="mt-2 text-[11px] text-red-600">
                  The image failed the quality threshold. Grading suppressed to avoid false negative/positive risks. Follow recapture checklist on the Quality Assessment page.
                </p>
                <Link href="/quality">
                  <Button variant="outline" className="mt-3 border-red-300 text-red-700 hover:bg-red-100 text-[11px]">
                    Open Recapture Guidance
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Handoff Action Toolbar */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/explainability">
              <Button variant="outline" className="h-11 w-full rounded-xl border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff] text-[12px] font-bold">
                <Sparkles size={15} className="mr-1.5" /> Explainable AI View
              </Button>
            </Link>
            <Link href="/report">
              <Button className="h-11 w-full rounded-xl bg-[#0f2d4a] text-white hover:bg-[#1e3a5f] text-[12px] font-bold">
                <FileText size={15} className="mr-1.5" /> Screening Report
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
