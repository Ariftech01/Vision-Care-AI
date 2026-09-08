import React from "react";
import { ShieldAlert, Info, AlertTriangle } from "lucide-react";

interface ClinicalDisclaimerProps {
  variant?: "banner" | "card" | "subtle" | "inline";
  className?: string;
}

export const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({
  variant = "card",
  className = "",
}) => {
  if (variant === "banner") {
    return (
      <div
        className={`flex items-center justify-between gap-3 border-b border-[#fcd34d]/60 bg-[#fffbeb] px-4 py-2.5 text-[11px] text-[#92400e] ${className}`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0 text-[#d97706]" />
          <span>
            <strong className="font-bold">Medical AI Prototype Notice:</strong> Vision Care AI is an AI-assisted research prototype designed for primary screening triaging. It does not replace professional ophthalmologic diagnosis.
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#b45309]">
          Clinician-In-The-Loop
        </span>
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <div
        className={`flex items-start gap-2.5 rounded-xl border border-[#dbeafe] bg-[#eff6ff]/70 p-3 text-[11px] text-[#1e40af] ${className}`}
      >
        <Info size={15} className="mt-0.5 shrink-0 text-[#3b82f6]" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Clinical Decision Support:</strong> AI classifications and Grad-CAM attention overlays highlight visual regions of interest for specialist review. The ophthalmologist remains the final clinical decision-maker.
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] text-[#64748b] ${className}`}>
        <AlertTriangle size={12} className="text-[#f59e0b]" />
        AI-assisted screening prototype · Requires licensed ophthalmologist sign-off
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] p-4 text-[11px] shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 font-bold text-[#0f2d4a]">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
          <ShieldAlert size={14} />
        </div>
        Clinical Safety & Governance Standard
      </div>
      <p className="mt-2 leading-relaxed text-[#475569]">
        Vision Care AI is an AI-assisted research prototype designed to support early triaging in rural/underserved clinics. Model attention maps (Grad-CAM) indicate algorithmic focus, not confirmed histopathologic lesions. Final clinical diagnostic and treatment decisions rest entirely with a qualified ophthalmologist.
      </p>
    </div>
  );
};
