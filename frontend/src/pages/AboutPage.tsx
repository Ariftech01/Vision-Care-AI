import React from "react";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  HeartPulse,
  Award,
  Users,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Code2,
  BookOpen,
  Building2,
  Stethoscope
} from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Motivation & Methodology
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            About Vision Care AI & Research Objectives
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            An Explainable AI screening ecosystem engineered for early diabetic retinopathy detection in primary care settings.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-bold text-[#1d4ed8]">
          <Award size={15} /> SIH Medical AI Prototype
        </div>
      </div>

      {/* Problem & Motivation Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#2563eb] text-[13px] font-extrabold uppercase">
            <Eye size={18} /> The Rural Vision Crisis
          </div>
          <h2 className="text-[20px] font-extrabold text-[#0f2d4a]">
            Preventable Blindness at the Grassroots Level
          </h2>
          <p className="text-[13px] leading-relaxed text-[#475569]">
            Over 77 million adults in India live with diabetes, of whom nearly 20% develop Diabetic Retinopathy (DR). When identified early, 95% of severe vision loss can be prevented with timely laser photocoagulation or anti-VEGF injections.
          </p>
          <p className="text-[13px] leading-relaxed text-[#475569]">
            However, rural districts face an acute deficit: while over 70% of the population resides in rural areas, over 80% of ophthalmologists practice in tier-1/tier-2 urban centres. By the time a rural patient notices blurriness, disease is often already at an irreversible proliferative or macular edema stage.
          </p>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#2563eb] text-[13px] font-extrabold uppercase">
            <ShieldCheck size={18} /> Our Explainable AI Approach
          </div>
          <h2 className="text-[20px] font-extrabold text-[#0f2d4a]">
            Transparency Over Black-Box Autonomy
          </h2>
          <p className="text-[13px] leading-relaxed text-[#475569]">
            Clinical adoption of medical AI often stalls because doctors cannot trust opaque "black box" prediction probabilities without visual justification.
          </p>
          <p className="text-[13px] leading-relaxed text-[#475569]">
            Vision Care AI couples an <strong>Image Quality Gate</strong> (to eliminate blurred false positives) with <strong>Grad-CAM saliency mapping</strong> and <strong>LLaMA natural-language clinical synthesis</strong>. Frontline nursing staff get clear triage flags, while remote ophthalmologists can immediately inspect where the model is looking before signing off.
          </p>
        </div>
      </div>

      {/* Human-in-the-Loop Core Philosophy */}
      <div className="rounded-3xl border border-[#cbd5e1] bg-gradient-to-br from-[#0f2d4a] to-[#1e3a5f] p-8 sm:p-12 text-white">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#38bdf8] backdrop-blur-md">
            <Stethoscope size={14} /> Human-In-The-Loop Design Tenet
          </div>
          <h2 className="text-[24px] sm:text-[30px] font-extrabold leading-tight">
            The Algorithm Suggests · The Clinician Decides
          </h2>
          <p className="text-[13px] leading-relaxed text-slate-300">
            Vision Care AI is explicitly designed as a frontline screening aid, not an autonomous diagnostic device. It optimizes specialist bandwidth by triaging negative/normal screens and surfacing high-risk cases with visual saliency evidence, ensuring that patient care remains under licensed medical supervision.
          </p>
        </div>
      </div>

      {/* Technical Stack Architecture */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[17px] font-extrabold text-[#0f2d4a] mb-4">
          Technical Stack & Engineering Components
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-[12px]">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">AI & Deep Learning</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">PyTorch & Torchvision</div>
            <p className="mt-1 text-[11px] text-[#64748b]">EfficientNet-B0, Focal Loss, Temperature Scaling</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Computer Vision & XAI</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">OpenCV & Grad-CAM</div>
            <p className="mt-1 text-[11px] text-[#64748b]">CLAHE normalization, Laplacian focus gate</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">LLM Explanation Layer</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">LLaMA-3-Med / Gemma</div>
            <p className="mt-1 text-[11px] text-[#64748b]">Natural language clinical rationale synthesis</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Frontend Application</span>
            <div className="mt-1 font-bold text-[#0f2d4a]">React, TypeScript, Tailwind</div>
            <p className="mt-1 text-[11px] text-[#64748b]">Clinical design system with printable report engine</p>
          </div>
        </div>
      </div>

      <ClinicalDisclaimer variant="card" />
    </div>
  );
};
