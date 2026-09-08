import React from "react";
import { SAMPLE_CASES } from "@/lib/mockData";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  Microscope,
  CheckCircle2,
  Clock,
  Code,
  ShieldCheck,
  Eye,
  Activity,
  Layers,
  Sparkles,
  AlertCircle
} from "lucide-react";

import { useScreening } from "@/contexts/ScreeningContext";

export const LesionsPage: React.FC = () => {
  const { currentCase } = useScreening();

  const modules = [
    {
      id: "optic-disc",
      title: "Optic Disc Localization",
      type: "Anatomical Landmark",
      status: "connected",
      confidence: "96.4%",
      details: "Detected at coordinates (X: 142, Y: 256), radius 48px. Normal disc margins.",
      model: "YOLOv8-OD-Nano (5.2MB)",
      color: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      id: "fovea",
      title: "Fovea & Macular Center Localization",
      type: "Anatomical Landmark",
      status: "connected",
      confidence: "94.1%",
      details: "Detected at coordinates (X: 312, Y: 268). Foveal avascular zone (FAZ) intact.",
      model: "ResNet18-Keypoint (11.8MB)",
      color: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      id: "vessels",
      title: "Blood Vessel Segmentation",
      type: "Structural Vascular Network",
      status: "coming-soon",
      confidence: "N/A",
      details: "UNet / Segment Anything (SAM-Med2D) vessel tree extraction pipeline planned for v1.2.",
      model: "UNet-ResNet34 (Planned)",
      color: "border-slate-200 bg-slate-50 text-slate-600",
    },
    {
      id: "microaneurysms",
      title: "Microaneurysm (MA) Detection",
      type: "Early DR Biomarker",
      status: "prototype-active",
      confidence: "88.2%",
      details: "Detected 8 candidate punctate red lesions in superior temporal arcade.",
      model: "Faster R-CNN RetinaNet (Prototype)",
      color: "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      id: "exudates",
      title: "Hard / Soft Exudate Analysis",
      type: "Lipid & Protein Extravasation",
      status: "coming-soon",
      confidence: "N/A",
      details: "Patch-based threshold classifier for circinate lipid rings and cotton-wool spots.",
      model: "Swin-Transformer (Planned)",
      color: "border-slate-200 bg-slate-50 text-slate-600",
    },
    {
      id: "hemorrhages",
      title: "Intraretinal Hemorrhage Detection",
      type: "Vascular Integrity Deficit",
      status: "prototype-active",
      confidence: "82.5%",
      details: "Detected flame and blot hemorrhages across superior and nasal quadrants.",
      model: "EfficientDet-D0 (Prototype)",
      color: "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      id: "neovascularization",
      title: "Neovascularization (NVD / NVE)",
      type: "Proliferative DR Marker",
      status: "not-connected",
      confidence: "N/A",
      details: "Detection of fragile new vessels prone to vitreous hemorrhage. Model training in progress.",
      model: "Mask2Former (In Training)",
      color: "border-slate-200 bg-slate-50 text-slate-600",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Modular Biomarker Architecture
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Lesion & Retinal Structure Analysis
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Specialized deep-learning models for anatomical landmarks, vascular architecture, and distinct diabetic lesion phenotypes.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2 text-[11px] font-bold text-[#475569]">
          <ShieldCheck size={16} className="text-[#16a34a]" />
          Explicit Integrity: Unconnected modules are transparently marked.
        </div>
      </div>

      {/* Grid of Modular Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div
            key={m.id}
            className="flex flex-col justify-between rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs hover:border-[#93c5fd] transition-all"
          >
            <div>
              {/* Header with Type & Status */}
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  {m.type}
                </span>
                {m.status === "connected" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">
                    <CheckCircle2 size={11} /> CONNECTED
                  </span>
                )}
                {m.status === "prototype-active" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-700">
                    <Activity size={11} /> ACTIVE PROTO
                  </span>
                )}
                {(m.status === "coming-soon" || m.status === "not-connected") && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                    <Clock size={11} /> MODEL NOT CONNECTED
                  </span>
                )}
              </div>

              {/* Title & Body */}
              <h3 className="mt-3 text-[16px] font-extrabold text-[#0f2d4a]">{m.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-[#475569]">{m.details}</p>

              {/* Mock/Live Visual Frame */}
              <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[11px]">
                <div className="flex justify-between text-[#64748b]">
                  <span>Model Confidence:</span>
                  <strong className="text-[#0f2d4a]">{m.confidence}</strong>
                </div>
                <div className="mt-1 flex justify-between text-[#64748b]">
                  <span>Backbone Model:</span>
                  <span className="font-mono text-[10px] text-[#2563eb]">{m.model}</span>
                </div>
              </div>
            </div>

            {/* Architecture Integration Contract Footnote */}
            <div className="mt-5 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[10px] text-[#64748b]">
              <span>REST Endpoint:</span>
              <span className="font-mono text-slate-500">/api/v1/lesions/{m.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Backend Integration Readiness Document Box */}
      <div className="rounded-3xl border border-[#cbd5e1] bg-gradient-to-br from-[#f8fafc] to-[#eff6ff]/30 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white">
            <Code size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-[#0f2d4a]">
              Modular Microservice Plug-and-Play Design
            </h3>
            <p className="text-[12px] text-[#64748b]">
              Frontend architecture is decoupled so new PyTorch PyPI models can be registered via JSON config without UI rebuilds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
