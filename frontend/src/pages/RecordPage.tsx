import React, { useState } from "react";
import { Link } from "wouter";
import { SAMPLE_CASES, FundusCase } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  UserRound,
  FileText,
  Calendar,
  Clock,
  Building2,
  Download,
  Stethoscope,
  ChevronRight,
  Shield,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useScreening } from "@/contexts/ScreeningContext";

export const RecordPage: React.FC = () => {
  const { currentCase, analysisHistory, loadPresetCase } = useScreening();
  const [selectedCase, setSelectedCase] = useState<FundusCase>(
    currentCase.isGradeable ? currentCase : SAMPLE_CASES[0]
  );
  const [reviewStatus, setReviewStatus] = useState<"Pending" | "Reviewed & Confirmed" | "Retake Requested">("Pending");

  React.useEffect(() => {
    if (currentCase.isGradeable) {
      setSelectedCase(currentCase);
    }
  }, [currentCase]);

  const longitudinalVisits = [
    {
      date: "2026-09-04",
      grade: "Grade 2 · Moderate",
      referable: true,
      quality: "Passed (90/100)",
      site: "Barabanki PHC",
      notes: "Current screening session. Moderate progression noted in temporal arcade.",
    },
    {
      date: "2025-08-12",
      grade: "Grade 1 · Mild",
      referable: false,
      quality: "Passed (88/100)",
      site: "Barabanki PHC",
      notes: "Annual diabetic checkup. Solitary microaneurysm nasal quadrant.",
    },
    {
      date: "2024-07-28",
      grade: "Grade 0 · No DR",
      referable: false,
      quality: "Passed (92/100)",
      site: "Lucknow Community Camp",
      notes: "Baseline diabetic eye examination. Retinal vasculature healthy.",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Longitudinal Screening Log
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Patient Screening Record: {selectedCase.id}
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Secure clinical archive linking image acquisition, automated quality checks, model inferences, and specialist sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/report">
            <Button className="rounded-xl bg-[#2563eb] text-[12px] font-bold text-white shadow-xs hover:bg-[#1d4ed8]">
              <FileText size={15} className="mr-2" /> View Printable Report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: Current Visit Overview */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <UserRound size={22} />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-[#0f2d4a]">{selectedCase.name}</h2>
                  <div className="text-[11px] text-[#64748b]">
                    Patient ID: {selectedCase.patientId} · {selectedCase.age} Yrs · {selectedCase.gender}
                  </div>
                </div>
              </div>
              <StatusBadge type="referable" value={selectedCase.grading.isReferable} />
            </div>

            {/* Visit Details Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <span className="text-[10px] font-bold uppercase text-[#64748b]">Screening Date</span>
                <div className="mt-1 font-semibold text-[#0f2d4a]">{selectedCase.captureDate}</div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <span className="text-[10px] font-bold uppercase text-[#64748b]">Primary Site</span>
                <div className="mt-1 font-semibold text-[#0f2d4a] truncate">{selectedCase.phcLocation}</div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <span className="text-[10px] font-bold uppercase text-[#64748b]">Quality Decision</span>
                <div className="mt-1 font-semibold text-emerald-700">Passed ({selectedCase.quality.overall}/100)</div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <span className="text-[10px] font-bold uppercase text-[#64748b]">Model Confidence</span>
                <div className="mt-1 font-semibold text-[#2563eb]">{(selectedCase.grading.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Fundus & Grad-CAM Image Pair */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                <div className="bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">Original Fundus</div>
                <img src={selectedCase.originalImage} alt="Fundus" className="h-32 w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                <div className="bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">Grad-CAM Heatmap</div>
                <img src={selectedCase.gradcamImage || "/images/dr_case_gradcam.png"} alt="GradCAM" className="h-32 w-full object-cover" />
              </div>
            </div>

            {/* Ophthalmologist Tele-Review Status Card */}
            <div className="mt-6 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#0f2d4a]">
                  <Stethoscope size={16} className="text-[#2563eb]" />
                  Tele-Ophthalmologist Review Status:
                </div>
                <span className="font-bold text-[11px] text-[#2563eb]">{reviewStatus}</span>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setReviewStatus("Reviewed & Confirmed");
                    toast.success("Case confirmed by reviewing ophthalmologist");
                  }}
                  className="flex-1 rounded-xl bg-[#16a34a] text-[11px] font-bold hover:bg-[#15803d]"
                >
                  Confirm Finding
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewStatus("Retake Requested");
                    toast.warning("Retake request sent to PHC operator");
                  }}
                  className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-bold"
                >
                  Request Retake
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Longitudinal History & Progression */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
            <h3 className="text-[16px] font-extrabold text-[#0f2d4a] mb-2">
              Longitudinal Diabetic Progression Timeline
            </h3>
            <p className="text-[12px] text-[#64748b] mb-6">
              Track the trajectory of retinopathy over annual PHC visits to identify rapid progressors.
            </p>

            <div className="relative border-l-2 border-[#e2e8f0] ml-3 pl-6 space-y-6">
              {longitudinalVisits.map((v, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-[31px] top-1 flex h-4 w-4 rounded-full border-2 border-white ${idx === 0 ? "bg-[#2563eb]" : "bg-[#94a3b8]"}`} />
                  <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#64748b]" />
                        <span className="text-[12px] font-bold text-[#0f2d4a]">{v.date}</span>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#475569] border border-slate-200">
                        {v.site}
                      </span>
                    </div>

                    <div className="mt-2 text-[13px] font-bold text-[#0f2d4a] flex items-center gap-2">
                      <span>{v.grade}</span>
                      {v.referable ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          Referable
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Stable
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-[#64748b] leading-relaxed">
                      {v.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#cbd5e1] bg-white p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#2563eb]" />
              <div>
                <div className="text-[12px] font-bold text-[#0f2d4a]">Data Privacy & Security</div>
                <div className="text-[10px] text-[#64748b]">Protected under DISHA & National Health Stack standards</div>
              </div>
            </div>
            <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-[10px] font-mono text-[#475569]">
              AES-256 Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
