import React from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "../shared/Logo";
import {
  ScanEye,
  Sparkles,
  Gauge,
  Activity,
  Microscope,
  UserRound,
  FileText,
  BarChart3,
  BrainCircuit,
  GitBranch,
  Zap,
  HeartPulse,
  Settings,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";

export const CLINICAL_NAV = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Screening Dashboard", href: "/screening", icon: ScanEye },
  { label: "Explainable AI (Grad-CAM)", href: "/explainability", icon: Sparkles, core: true },
  { label: "Image Quality Gate", href: "/quality", icon: Gauge },
  { label: "DR Severity Grading", href: "/grading", icon: Activity },
  { label: "Lesion / Retinal Structure", href: "/lesions", icon: Microscope },
  { label: "Patient Records", href: "/record", icon: UserRound },
  { label: "Screening Report", href: "/report", icon: FileText },
];

export const PROGRAM_NAV = [
  { label: "Program Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Model / AI Center", href: "/models", icon: BrainCircuit },
  { label: "System Architecture", href: "/architecture", icon: GitBranch },
  { label: "Simulink & Deployment", href: "/deployment", icon: Zap },
];

export const Sidebar: React.FC = () => {
  const [location] = useLocation();

  return (
    <aside className="hidden w-[275px] shrink-0 flex-col justify-between border-r border-[#e2e8f0] bg-white/90 px-4 py-5 backdrop-blur-md lg:flex">
      <div>
        <div className="px-3">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Screening Workspace Navigation */}
        <div className="mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#64748b]">
          Clinical Screening
        </div>
        <nav className="mt-2.5 space-y-1">
          {CLINICAL_NAV.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                    active
                      ? "bg-[#eff6ff] text-[#1d4ed8] shadow-[0_1px_3px_rgba(37,99,235,0.08)] ring-1 ring-[#bfdbfe]"
                      : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={active ? "text-[#2563eb]" : "text-[#64748b]"}
                  />
                  <span>{item.label}</span>
                  {item.core && (
                    <span className="ml-auto rounded-full bg-[#dbeafe] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#1d4ed8]">
                      Core
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Program & System Architecture Navigation */}
        <div className="mt-6 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#64748b]">
          AI & Infrastructure
        </div>
        <nav className="mt-2.5 space-y-1">
          {PROGRAM_NAV.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                    active
                      ? "bg-[#eff6ff] text-[#1d4ed8] shadow-[0_1px_3px_rgba(37,99,235,0.08)] ring-1 ring-[#bfdbfe]"
                      : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={active ? "text-[#2563eb]" : "text-[#64748b]"}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Secondary Links */}
        <div className="border-t border-[#e2e8f0] pt-4 space-y-1">
          <Link href="/about">
            <div
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                location === "/about"
                  ? "bg-[#eff6ff] text-[#1d4ed8]"
                  : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              <HeartPulse size={16} strokeWidth={1.8} className="text-[#64748b]" />
              <span>About the Research</span>
            </div>
          </Link>
          <Link href="/settings">
            <div
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                location === "/settings"
                  ? "bg-[#eff6ff] text-[#1d4ed8]"
                  : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              <Settings size={16} strokeWidth={1.8} className="text-[#64748b]" />
              <span>Model & Settings</span>
            </div>
          </Link>
        </div>

        {/* Prototype Assurance Notice */}
        <div className="mt-4 rounded-2xl border border-[#e0e7ff] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#1e40af]">
            <ShieldCheck size={15} className="text-[#2563eb]" />
            Medical Hackathon Prototype
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#64748b]">
            AI-assisted screening support. Final diagnosis by ophthalmologist.
          </p>
        </div>
      </div>
    </aside>
  );
};
