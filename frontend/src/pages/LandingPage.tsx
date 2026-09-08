import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Activity,
  Sparkles,
  FileText,
  Stethoscope,
  Image as ImageIcon,
  CheckCircle2,
  Users,
  Building2,
  Clock,
  Layers,
  Award,
  ChevronRight
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const workflowSteps = [
    { num: "01", icon: ImageIcon, title: "Fundus Capture", desc: "Non-mydriatic camera" },
    { num: "02", icon: ShieldCheck, title: "Quality Gate", desc: "Sharpness & FOV check" },
    { num: "03", icon: BrainCircuit, title: "AI Analysis", desc: "EfficientNet-B0 inference" },
    { num: "04", icon: Activity, title: "DR Grade 0–4", desc: "Referable threshold ≥ 2" },
    { num: "05", icon: Sparkles, title: "Explainability", desc: "Grad-CAM attention map" },
    { num: "06", icon: FileText, title: "Screening Report", desc: "A4 printable summary" },
    { num: "07", icon: Stethoscope, title: "Ophthalmologist", desc: "Final clinical diagnosis" },
  ];

  const capabilities = [
    {
      icon: ShieldCheck,
      title: "Quality-Aware Screening Gate",
      desc: "Rejects blurred, dark, or off-center images before analysis to prevent false positives and provides frontline recapture instructions.",
      tag: "Fail-Safe",
    },
    {
      icon: BrainCircuit,
      title: "5-Class International Severity",
      desc: "Grades diabetic retinopathy from Grade 0 (None) to Grade 4 (Proliferative) with calibrated probability confidence across all classes.",
      tag: "ICD-10 Aligned",
    },
    {
      icon: Sparkles,
      title: "Explainable by Design (Grad-CAM)",
      desc: "Directly visualizes which retinal regions influenced the neural network prediction, preventing black-box diagnostic uncertainty.",
      tag: "Transparent AI",
    },
    {
      icon: Stethoscope,
      title: "Human-In-The-Loop Workflow",
      desc: "Engineered specifically as a clinical triage tool for primary health workers to escalate referable cases to eye specialists.",
      tag: "Ophthalmologist Led",
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Top Clinical Prototype Banner */}
      <ClinicalDisclaimer variant="banner" />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-[#dce9f0] bg-gradient-to-b from-[#f0f9ff]/70 via-[#f8fafc] to-white p-6 sm:p-10 lg:p-14 shadow-xs">
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-bold text-[#1d4ed8]">
              <Sparkles size={14} className="text-[#2563eb]" />
              Explainable AI for Diabetic Retinopathy Screening
            </div>

            <h1 className="text-[38px] sm:text-[48px] lg:text-[54px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0f2d4a]">
              Transparent Retinal Triage for{" "}
              <span className="bg-gradient-to-r from-[#2563eb] to-[#0284c7] bg-clip-text text-transparent">
                Primary Healthcare
              </span>
            </h1>

            <p className="max-w-[540px] text-[15px] leading-relaxed text-[#475569]">
              Vision Care AI bridges the rural specialist gap by combining quality-aware fundus image assessment, 5-class severity grading, and Grad-CAM explainability into a rapid screening report for ophthalmologist review.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/screening">
                <Button className="h-12 rounded-xl bg-[#2563eb] px-6 text-[13px] font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8]">
                  Start Screening Session <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
              <Link href="/explainability">
                <Button variant="outline" className="h-12 rounded-xl border-[#cbd5e1] bg-white px-5 text-[13px] font-bold text-[#334155] hover:bg-[#f8fafc]">
                  Explore Explainability (Grad-CAM)
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-[#e2e8f0] pt-6">
              <div>
                <div className="text-[20px] font-extrabold text-[#0f2d4a]">94.2%</div>
                <div className="text-[11px] text-[#64748b]">Referable Sensitivity</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold text-[#0f2d4a]">&lt; 1.8s</div>
                <div className="text-[11px] text-[#64748b]">Edge CPU Latency</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold text-[#0f2d4a]">5-Class</div>
                <div className="text-[11px] text-[#64748b]">Grade 0 to Grade 4</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Card with Real Fundus & Heatmap */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border-4 border-white bg-slate-900 shadow-2xl">
              <img
                src="/images/dr_case_gradcam.png"
                alt="Retinal Fundus with Grad-CAM"
                className="h-[340px] sm:h-[400px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <span className="inline-block rounded bg-[#ea580c] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                    Grade 2 · Referable
                  </span>
                  <div className="mt-1 text-[16px] font-bold">Model Gradient Evidence</div>
                  <div className="text-[11px] text-slate-300">Posterior arcade vascular bed focus</div>
                </div>
                <Link href="/explainability">
                  <div className="rounded-xl bg-white/20 px-3 py-2 text-right backdrop-blur-md hover:bg-white/30 transition-colors">
                    <div className="text-[9px] uppercase tracking-wider text-slate-200">Inspect Heatmap</div>
                    <div className="text-[12px] font-bold flex items-center gap-1">
                      View XAI <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Floating Quality Pass Chip */}
            <div className="absolute -left-5 top-8 hidden sm:flex items-center gap-2.5 rounded-2xl border border-[#bbf7d0] bg-white p-3.5 shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#16a34a]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#15803d]">Quality Gate Passed</div>
                <div className="text-[10px] text-[#64748b]">Sharpness 88 · FOV 91%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step Screening Workflow Section */}
      <section className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563eb]">
            Standardized Tele-Ophthalmology Flow
          </div>
          <h2 className="mt-2 text-[26px] sm:text-[32px] font-extrabold tracking-tight text-[#0f2d4a]">
            From Rural Fundus Camera to Specialist Review
          </h2>
          <p className="mt-2 text-[13px] text-[#64748b]">
            Every screening adheres to a clinical governance chain that ensures quality before running inference.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col items-center text-center p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] hover:border-[#93c5fd] hover:bg-[#eff6ff]/50 transition-all"
              >
                <div className="absolute top-2 right-2 text-[10px] font-bold text-[#94a3b8]">
                  {step.num}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-xs mb-3">
                  <Icon size={20} />
                </div>
                <div className="text-[12px] font-extrabold text-[#0f2d4a]">{step.title}</div>
                <div className="mt-1 text-[10px] text-[#64748b] leading-tight">{step.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563eb]">
            Core Clinical System Capabilities
          </div>
          <h2 className="mt-1 text-[26px] sm:text-[30px] font-extrabold text-[#0f2d4a]">
            Engineered for High-Trust Medical Deployment
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-[#dce9f0] bg-white p-6 shadow-xs hover:border-[#93c5fd] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                      <Icon size={20} />
                    </div>
                    <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[9px] font-bold uppercase text-[#475569]">
                      {cap.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-extrabold text-[#0f2d4a]">{cap.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#64748b]">{cap.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rural Healthcare Use Case Feature */}
      <section className="overflow-hidden rounded-3xl border border-[#cbd5e1] bg-gradient-to-br from-[#0f2d4a] to-[#1e3a5f] p-8 sm:p-12 text-white">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#38bdf8] backdrop-blur-md">
              <Building2 size={14} /> Rural Primary Health Centre (PHC) Scenario
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-extrabold leading-tight">
              Bridging the 1:100,000 Specialist Shortage in Rural Districts
            </h2>
            <p className="text-[13px] leading-relaxed text-slate-300">
              In developing healthcare networks, over 80% of diabetic retinopathy cases are diagnosed too late due to a lack of trained retina specialists at the block level. Vision Care AI runs on low-cost edge laptops, allowing general nursing staff (ANMs/ASHAs) to capture images, verify sharpness locally, and generate actionable tele-ophthalmology referrals.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-[12px] text-slate-200">
                <CheckCircle2 size={16} className="text-[#38bdf8]" /> Works on battery-powered field laptops
              </div>
              <div className="flex items-center gap-2 text-[12px] text-slate-200">
                <CheckCircle2 size={16} className="text-[#38bdf8]" /> Offline edge inference support
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#38bdf8]">
              Primary Health Centre Trial Protocol
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
                <div className="text-[13px] font-bold text-[#38bdf8]">1</div>
                <div className="text-[12px]">
                  <strong className="block text-white">Patient Walk-in & Registration</strong>
                  Frontline health worker enters Patient ID, age, and diabetes duration.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
                <div className="text-[13px] font-bold text-[#38bdf8]">2</div>
                <div className="text-[12px]">
                  <strong className="block text-white">Instant Quality Confirmation</strong>
                  Prevents patients leaving clinic before an ungradable image is flagged.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
                <div className="text-[13px] font-bold text-[#38bdf8]">3</div>
                <div className="text-[12px]">
                  <strong className="block text-white">Triaged Specialist Queue</strong>
                  Grade ≥ 2 cases automatically sync to the district hospital ophthalmology desk.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer Box */}
      <ClinicalDisclaimer variant="card" />
    </div>
  );
};
