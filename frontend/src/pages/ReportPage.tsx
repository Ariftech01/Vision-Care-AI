import React, { useState } from "react";
import { SAMPLE_CASES, FundusCase, DR_GRADES_INFO } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Logo } from "@/components/shared/Logo";
import { useScreening } from "@/contexts/ScreeningContext";
import {
  Printer,
  FileCheck,
  Building2,
  Calendar,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Stethoscope,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReportPage: React.FC = () => {
  const { currentCase, loadPresetCase, analysisHistory } = useScreening();
  const [selectedCase, setSelectedCase] = useState<FundusCase>(
    currentCase.isGradeable ? currentCase : SAMPLE_CASES[0]
  );

  React.useEffect(() => {
    if (currentCase.isGradeable) {
      setSelectedCase(currentCase);
    }
  }, [currentCase]);

  const handlePrint = () => {
    window.print();
  };

  const referableProb =
    selectedCase.grading.referableProbability ??
    selectedCase.grading.probabilities.slice(2).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-4 sm:p-6 shadow-xs print:hidden">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#0f2d4a]">
            Printable Medical-AI Screening Report
          </h1>
          <p className="text-[12px] text-[#64748b]">
            Standardized tele-ophthalmology handoff document formatted for A4 printing and EHR integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCase.id}
            onChange={(e) => {
              const found = analysisHistory.find((c) => c.id === e.target.value);
              if (found) {
                setSelectedCase(found);
                loadPresetCase(found);
              }
            }}
            className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[12px] font-bold text-[#0f2d4a] outline-none"
          >
            {analysisHistory.filter((c) => c.isGradeable).map((c) => (
              <option key={c.id} value={c.id}>
                Report for {c.name} ({c.id})
              </option>
            ))}
          </select>

          {selectedCase.reportUrl && (
            <a
              href={selectedCase.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <FileDown size={15} /> Download Signed PDF
            </a>
          )}

          <Button
            onClick={handlePrint}
            className="rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-[12px] font-bold shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#cbd5e1] bg-white p-8 sm:p-12 shadow-md print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-wrap items-start justify-between border-b-2 border-[#0f2d4a] pb-6">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
          </div>

          <div className="text-right">
            <div className="text-[14px] font-black uppercase tracking-wider text-[#0f2d4a]">
              Medical Screening Triage Report
            </div>
            <div className="mt-1 text-[11px] font-mono text-[#475569]">
              Report ID: VC-REP-{selectedCase.id.replace("VC-", "")}-2026
            </div>
            <div className="text-[11px] text-[#64748b]">Issued: {selectedCase.captureDate}</div>
          </div>
        </div>

        {/* Patient & Facility Information */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-[#f8fafc] p-4 border border-[#e2e8f0] text-[12px]">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Patient Name</span>
            <div className="font-extrabold text-[#0f2d4a] text-[14px]">{selectedCase.name}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Patient ID / MRN</span>
            <div className="font-bold text-[#0f2d4a]">{selectedCase.patientId}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Age / Gender</span>
            <div className="font-bold text-[#0f2d4a]">
              {selectedCase.age} Yrs / {selectedCase.gender}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Screening PHC Facility</span>
            <div className="font-bold text-[#0f2d4a] truncate">{selectedCase.phcLocation}</div>
          </div>
        </div>

        {/* DR Severity Classification Banner */}
        <div className="mt-6 rounded-2xl border-2 border-[#bfdbfe] bg-[#eff6ff] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1d4ed8]">
                Automated Retinopathy Classification
              </span>
              <div className="text-[24px] font-black text-[#0f2d4a]">
                {selectedCase.grading.gradeName}
              </div>
              <div className="text-[12px] text-[#475569]">
                Model Confidence: <strong>{(selectedCase.grading.confidence * 100).toFixed(1)}%</strong> · Referable Probability: <strong>{(referableProb * 100).toFixed(1)}%</strong> (Threshold: 24.0%)
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <StatusBadge type="referable" value={selectedCase.grading.isReferable} size="lg" />
              <span className="text-[10px] text-[#64748b]">
                {selectedCase.grading.isReferable
                  ? "Referral recommended to eye specialist"
                  : "Routine annual surveillance at PHC"}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Images: Fundus + Grad-CAM Heatmap */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#cbd5e1] overflow-hidden bg-black">
            <div className="bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white flex justify-between">
              <span>Original Retinal Photograph</span>
              <span className="text-slate-400 font-mono text-[10px]">45° Field-of-View</span>
            </div>
            <img
              src={selectedCase.originalImage}
              alt="Fundus"
              className="h-[240px] w-full object-contain p-1"
            />
          </div>

          <div className="rounded-2xl border border-[#cbd5e1] overflow-hidden bg-black">
            <div className="bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-[#fdba74] flex justify-between">
              <span>Grad-CAM Explainability Overlay</span>
              <span className="text-slate-400 font-mono text-[10px]">features[8]</span>
            </div>
            <img
              src={selectedCase.gradcamImage || selectedCase.originalImage}
              alt="Grad-CAM"
              className="h-[240px] w-full object-contain p-1"
            />
          </div>
        </div>

        {/* Quality Assessment & Evidence Summary */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {/* Quality check summary */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-[12px]">
            <div className="text-[11px] font-bold uppercase text-[#64748b] mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#16a34a]" /> Image Quality Gate Confirmation
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Sharpness</span>
                <strong className="text-[13px]">{selectedCase.quality.sharpness}/100</strong>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Illumination</span>
                <strong className="text-[13px]">{selectedCase.quality.illumination}/100</strong>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">FOV Coverage</span>
                <strong className="text-[13px]">{selectedCase.quality.fov}/100</strong>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#64748b]">
              Status: <strong>PASSED (Score: {selectedCase.quality.overall}/100)</strong> · High diagnostic readability.
            </p>
          </div>

          {/* Model Evidence Summary */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-[12px]">
            <div className="text-[11px] font-bold uppercase text-[#64748b] mb-2">
              Visual Features & Model Attention Findings
            </div>
            <ul className="space-y-1.5 text-[#334155]">
              {selectedCase.grading.clinicalFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#2563eb] font-bold">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Clinical Recommendation */}
        <div className="mt-6 rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 text-[12px] text-[#9a3412]">
          <strong className="block font-bold text-[13px] mb-1">
            Clinical Recommendation & Handoff Directive:
          </strong>
          {selectedCase.grading.recommendation}
        </div>

        {/* Ophthalmologist Sign-Off Box */}
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[#cbd5e1] p-6">
          <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#0f2d4a] mb-4">
            <Stethoscope size={18} className="text-[#2563eb]" />
            Tele-Ophthalmologist Clinical Evaluation & Sign-Off
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-[12px]">
            <div>
              <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                Clinical Decision
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded accent-[#2563eb]" />
                  <span>Concur with Grade {selectedCase.grading.predictedGrade}</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" />
                  <span>Modify Grade</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" />
                  <span>Request In-Person Dilated Exam</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                Reviewing Ophthalmologist
              </label>
              <div className="border-b border-slate-300 pb-1 font-bold text-[#0f2d4a]">
                ARIF AFZAL S, MD (Retina)
              </div>
              <div className="text-[10px] text-[#64748b] mt-1">Medical Reg: MCI-2018-77129</div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                Clinician Signature & Date
              </label>
              <div className="border-b border-slate-300 pb-1 italic font-serif text-[14px] text-slate-700">
                Arif Afzal S, M.D.
              </div>
              <div className="text-[10px] text-[#64748b] mt-1">Date: 2026-09-05 11:20 IST</div>
            </div>
          </div>
        </div>

        {/* Strong Mandatory Medical Disclaimer Footer */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] leading-relaxed text-[#64748b]">
          <strong>LEGAL & REGULATORY NOTICE:</strong> Vision Care AI is an AI-assisted research prototype designed strictly for clinical triage support in rural primary healthcare settings. It does not provide an autonomous medical diagnosis. All clinical and therapeutic decisions must be rendered by a certified medical doctor.
        </div>
      </div>
    </div>
  );
};
