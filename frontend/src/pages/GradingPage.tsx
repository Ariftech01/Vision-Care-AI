import React, { useState, useEffect } from "react";
import { DR_GRADES_INFO, SAMPLE_CASES, FundusCase } from "@/lib/mockData";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import { TermTooltip } from "@/components/shared/TermTooltip";
import { useScreening } from "@/contexts/ScreeningContext";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart2,
  FileCheck,
  Stethoscope,
  Info,
  ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export const GradingPage: React.FC = () => {
  const { currentCase, loadPresetCase, analysisHistory } = useScreening();
  const [selectedCase, setSelectedCase] = useState<FundusCase>(
    currentCase.isGradeable ? currentCase : SAMPLE_CASES[0]
  );
  const [selectedGradeTab, setSelectedGradeTab] = useState<number>(
    (currentCase.isGradeable ? currentCase : SAMPLE_CASES[0]).grading.predictedGrade
  );

  useEffect(() => {
    if (currentCase.isGradeable) {
      setSelectedCase(currentCase);
      setSelectedGradeTab(currentCase.grading.predictedGrade);
    }
  }, [currentCase]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Diagnostic Intelligence
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            AI Analysis & 5-Class Severity Grading
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Multiclass classification mapped directly to the International Clinical Diabetic Retinopathy (ICDR) scale.
          </p>
        </div>

        {/* Case Switcher */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-2">
          <span className="text-[11px] font-bold text-[#475569] pl-2">Session:</span>
          {analysisHistory.filter((c) => c.isGradeable).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCase(c);
                setSelectedGradeTab(c.grading.predictedGrade);
                loadPresetCase(c);
              }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                selectedCase.id === c.id
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-white text-[#334155] border border-[#e2e8f0] hover:bg-[#eff6ff]"
              }`}
            >
              {c.id} ({c.grading.gradeName.split("·")[0].trim()})
            </button>
          ))}
        </div>
      </div>

      {/* Primary Triage Indicator Card */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Predicted DR Severity
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-[#0f2d4a]">
            Grade {selectedCase.grading.predictedGrade}
          </div>
          <div className="mt-1">
            <StatusBadge type="grade" value={selectedCase.grading.predictedGrade} />
          </div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Referable DR Triaging
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-[#0f2d4a]">
            {selectedCase.grading.isReferable ? "REFER TO RETINA" : "NON-REFERABLE"}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <StatusBadge type="referable" value={selectedCase.grading.isReferable} />
            <span className="text-[10px] font-mono font-semibold text-slate-500">
              P(Ref): {((selectedCase.grading.referableProbability ?? selectedCase.grading.probabilities.slice(2).reduce((a,b)=>a+b,0)) * 100).toFixed(1)}% (τ=0.24)
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Model Softmax Confidence
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-[#0f2d4a]">
            {(selectedCase.grading.confidence * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Raw network probability</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Temperature Calibrated
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-[#2563eb]">
            {(selectedCase.grading.calibratedConfidence * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">
            <TermTooltip term="Temperature Scaled" definition="Post-processing calibration (T=1.24) that aligns model softmax scores with empirical true-positive rates, mitigating overconfidence." />
          </div>
        </div>
      </div>

      {/* 5-Class Probability Distribution Chart */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] pb-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#0f2d4a]">
              Full 5-Class Softmax Probability Distribution
            </h2>
            <div className="text-[11px] text-[#64748b]">
              Reflects the model's confidence distribution across all stages of diabetic retinopathy.
            </div>
          </div>
          <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-bold text-[#2563eb] border border-[#bfdbfe]">
            EfficientNet-B0 Output Vector
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {DR_GRADES_INFO.map((g, idx) => {
            const prob = selectedCase.grading.probabilities[idx] || 0;
            const isPredicted = selectedCase.grading.predictedGrade === g.grade;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-4 transition-all border ${
                  isPredicted ? "border-[#2563eb] bg-[#eff6ff]/30 shadow-xs" : "border-[#e2e8f0] bg-[#f8fafc]"
                }`}
              >
                <div className="flex items-center justify-between text-[13px] font-bold text-[#0f2d4a]">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                      style={{ backgroundColor: g.color }}
                    >
                      {g.grade}
                    </span>
                    <span>{g.name}</span>
                    {g.referable && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-700">
                        Referable
                      </span>
                    )}
                    {isPredicted && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                        Top Prediction
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[14px]">{(prob * 100).toFixed(1)}%</div>
                </div>

                {/* Bar */}
                <div className="mt-2.5 h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
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

      {/* Clinical Reference Standards & Criteria Table */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="mb-4">
          <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
            International Clinical Diabetic Retinopathy (ICDR) Severity Scale Reference
          </h3>
          <p className="text-[11px] text-[#64748b]">
            Diagnostic criteria used by ophthalmologists to validate model classifications.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DR_GRADES_INFO.map((g) => (
            <div
              key={g.grade}
              className={`rounded-2xl border p-4 flex flex-col justify-between ${
                selectedCase.grading.predictedGrade === g.grade
                  ? "border-[#2563eb] bg-[#eff6ff]/40 shadow-xs"
                  : "border-[#e2e8f0] bg-[#f8fafc]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{ backgroundColor: g.bgColor, color: g.textColor }}
                  >
                    Grade {g.grade}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748b]">{g.icd10}</span>
                </div>
                <h4 className="mt-2 text-[13px] font-extrabold text-[#0f2d4a]">{g.shortName}</h4>
                <p className="mt-2 text-[11px] leading-relaxed text-[#475569]">{g.description}</p>
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] font-bold text-[#64748b]">Clinical Hallmarks:</div>
                  {g.clinicalHallmarks.map((h, i) => (
                    <div key={i} className="text-[10px] text-[#334155] flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[#2563eb]" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-[#475569]">
                <strong>Management:</strong> {g.management}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
