import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "../shared/Logo";
import { CLINICAL_NAV, PROGRAM_NAV } from "./Sidebar";
import {
  ChevronRight,
  Menu,
  X,
  Activity,
  UserCheck,
  Building2,
  Cpu
} from "lucide-react";
import { toast } from "sonner";

export const Topbar: React.FC = () => {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = (path: string) => {
    const allNav = [...CLINICAL_NAV, ...PROGRAM_NAV, { label: "About the Research", href: "/about" }, { label: "Settings", href: "/settings" }];
    const match = allNav.find((n) => n.href === path);
    return match ? match.label : "Diabetic Retinopathy Screening";
  };

  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#e2e8f0] bg-white/85 px-4 backdrop-blur-xl sm:px-8">
      {/* Left side: Mobile button + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#475569] hover:bg-[#f1f5f9] lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="lg:hidden">
          <Link href="/">
            <Logo compact size="sm" />
          </Link>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden items-center gap-2 text-[12px] font-medium text-[#64748b] sm:flex">
          <Link href="/">
            <span className="hover:text-[#0f172a] transition-colors">Vision Care AI</span>
          </Link>
          <ChevronRight size={13} className="text-[#94a3b8]" />
          <span className="font-semibold text-[#0f2d4a]">{getPageTitle(location)}</span>
        </div>
      </div>

      {/* Right side: Model status, PHC info, Clinician Profile */}
      <div className="flex items-center gap-3">
        {/* Hardware / Inference Status */}
        <div className="hidden items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-medium text-[#475569] xl:flex">
          <Cpu size={13} className="text-[#2563eb]" />
          <span>EfficientNet-B0 (Edge PyTorch)</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
        </div>

        {/* PHC Location Badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1.5 text-[11px] font-bold text-[#1e40af] md:flex">
          <Building2 size={13} className="text-[#2563eb]" />
          <span>Barabanki PHC Site #4</span>
        </div>

        {/* Operational Status indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[10px] font-bold text-[#15803d] sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16a34a]"></span>
          </span>
          Pipeline Ready
        </div>

        {/* Clinician Profile */}
        <button
          onClick={() => toast.info("Clinician Session: ARIF AFZAL S (Barabanki Tele-Ophthalmology Network)")}
          className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white py-1 pl-1 pr-3 text-[11px] font-bold text-[#0f2d4a] hover:border-[#94a3b8] transition-colors"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] text-white text-[11px] font-extrabold shadow-sm">
            AA
          </span>
          <span className="hidden sm:inline">ARIF AFZAL S</span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="absolute left-0 top-[70px] w-full border-b border-[#e2e8f0] bg-white p-4 shadow-2xl lg:hidden">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b]">
            Clinical Navigation
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[...CLINICAL_NAV, ...PROGRAM_NAV].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <div
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-[11px] font-bold ${
                      location === item.href
                        ? "bg-[#eff6ff] text-[#2563eb]"
                        : "bg-[#f8fafc] text-[#475569]"
                    }`}
                  >
                    <Icon size={15} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
