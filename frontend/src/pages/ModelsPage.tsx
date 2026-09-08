import React from "react";
import { MODEL_SPECS, CONFUSION_MATRIX } from "@/lib/mockData";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import { TermTooltip } from "@/components/shared/TermTooltip";
import {
  BrainCircuit,
  Cpu,
  Layers,
  CheckCircle2,
  Sliders,
  Sparkles,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  FileCode,
  Info
} from "lucide-react";

export const ModelsPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Neural Network Architecture
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Model & AI Engineering Center
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Convolutional backbone, data augmentation, temperature calibration, and benchmark validation details.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-bold text-[#1d4ed8]">
          <Cpu size={14} /> EfficientNet-B0 (PyTorch 2.3)
        </div>
      </div>

      {/* Model Performance Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Overall 5-Class Accuracy
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#0f2d4a]">
            {MODEL_SPECS.metrics.accuracy}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Macro F1-Score: {MODEL_SPECS.metrics.macroF1}</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Referable DR Sensitivity
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-emerald-600">
            {MODEL_SPECS.metrics.referableSensitivity}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">True positive detection rate (Grade ≥ 2)</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Referable DR Specificity
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-emerald-600">
            {MODEL_SPECS.metrics.referableSpecificity}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Minimizes unnecessary tertiary referrals</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            AUROC Diagnostic Index
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#2563eb]">
            {MODEL_SPECS.metrics.auroc}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Multi-threshold discrimination curve</div>
        </div>
      </div>

      {/* 5x5 Confusion Matrix & Calibration */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Interactive 5x5 Confusion Matrix */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
            <div>
              <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
                5×5 Multi-Class Confusion Matrix
              </h3>
              <div className="text-[11px] text-[#64748b]">
                Validation split (N = 1,248 test eyes) across clinical grades.
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Rows: Actual · Cols: Predicted
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-center text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-[#64748b]">
                  <th className="pb-2 text-left">Ground Truth</th>
                  <th className="pb-2 text-emerald-700">Pred G0</th>
                  <th className="pb-2 text-cyan-700">Pred G1</th>
                  <th className="pb-2 text-amber-700">Pred G2</th>
                  <th className="pb-2 text-orange-700">Pred G3</th>
                  <th className="pb-2 text-red-700">Pred G4</th>
                  <th className="pb-2 text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CONFUSION_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 text-left font-bold text-[#0f2d4a]">{row.actual}</td>
                    <td className={`py-2.5 font-mono ${idx === 0 ? "bg-emerald-100/70 font-bold text-emerald-800 rounded" : "text-slate-600"}`}>
                      {row.g0}
                    </td>
                    <td className={`py-2.5 font-mono ${idx === 1 ? "bg-cyan-100/70 font-bold text-cyan-800 rounded" : "text-slate-600"}`}>
                      {row.g1}
                    </td>
                    <td className={`py-2.5 font-mono ${idx === 2 ? "bg-amber-100/70 font-bold text-amber-800 rounded" : "text-slate-600"}`}>
                      {row.g2}
                    </td>
                    <td className={`py-2.5 font-mono ${idx === 3 ? "bg-orange-100/70 font-bold text-orange-800 rounded" : "text-slate-600"}`}>
                      {row.g3}
                    </td>
                    <td className={`py-2.5 font-mono ${idx === 4 ? "bg-red-100/70 font-bold text-red-800 rounded" : "text-slate-600"}`}>
                      {row.g4}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-400">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-[#64748b]">
            <span>Diagonal cells denote correct predictions.</span>
            <span className="font-semibold text-emerald-700">Heavy diagonal concentration confirms high clinical concordance.</span>
          </div>
        </div>

        {/* Temperature Calibration & Reliability */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
            Temperature Scaling & Probability Calibration
          </h3>
          <p className="text-[12px] leading-relaxed text-[#475569]">
            Modern deep neural networks often suffer from overconfidence. We implement post-hoc Temperature Scaling on the validation set logits:
          </p>

          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-[12px] space-y-2">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Optimal Temperature (T):</span>
              <strong className="font-mono text-[#2563eb]">1.24</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Raw Expected Calibration Error (ECE):</span>
              <span className="font-mono text-red-600 font-semibold">0.082</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Calibrated ECE:</span>
              <span className="font-mono text-emerald-600 font-semibold">0.021 (74% improvement)</span>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-[#64748b]">
            Calibrated probabilities prevent clinicians from receiving falsely overconfident 99% scores on borderline Grade 1 vs Grade 2 cases.
          </div>
        </div>
      </div>

      {/* Technical Specifications Card */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[17px] font-extrabold text-[#0f2d4a] mb-4">
          Engineering & Hyperparameter Registry
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-[12px]">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Neural Backbone</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.architecture}</div>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Input Resolution</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.inputDimensions}</div>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Preprocessing Pipeline</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.preprocessing}</div>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Loss Objective</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.lossFunction}</div>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Optimizer & Schedule</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.optimizer}</div>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Explainability Hook</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">{MODEL_SPECS.explainabilityMethod}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
