import React from "react";
import { CheckCircle2, XCircle, AlertCircle, AlertTriangle, Clock } from "lucide-react";

interface StatusBadgeProps {
  type: "grade" | "referable" | "quality" | "status";
  value: string | number | boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-[11px]",
    lg: "px-3.5 py-1.5 text-[13px]",
  };

  if (type === "quality") {
    const isPass = Boolean(value);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${
          isPass
            ? "border border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
            : "border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
        } ${sizeClasses[size]} ${className}`}
      >
        {isPass ? (
          <>
            <CheckCircle2 size={size === "sm" ? 12 : 14} className="text-[#16a34a]" />
            Quality Gate: PASS
          </>
        ) : (
          <>
            <XCircle size={size === "sm" ? 12 : 14} className="text-[#dc2626]" />
            Quality Gate: REJECT
          </>
        )}
      </span>
    );
  }

  if (type === "referable") {
    const isReferable = Boolean(value);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${
          isReferable
            ? "border border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
            : "border border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
        } ${sizeClasses[size]} ${className}`}
      >
        {isReferable ? (
          <>
            <AlertTriangle size={size === "sm" ? 12 : 14} className="text-[#ea580c]" />
            Referable DR (Grade ≥ 2)
          </>
        ) : (
          <>
            <CheckCircle2 size={size === "sm" ? 12 : 14} className="text-[#16a34a]" />
            Non-Referable (Grade &lt; 2)
          </>
        )}
      </span>
    );
  }

  if (type === "grade") {
    const gradeNum = Number(value);
    const gradeConfig: Record<number, { label: string; style: string }> = {
      0: { label: "Grade 0 · No DR", style: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]" },
      1: { label: "Grade 1 · Mild", style: "border-[#a5f3fc] bg-[#ecfeff] text-[#0e7490]" },
      2: { label: "Grade 2 · Moderate", style: "border-[#fde68a] bg-[#fffbeb] text-[#b45309]" },
      3: { label: "Grade 3 · Severe", style: "border-[#fdba74] bg-[#fff7ed] text-[#c2410c]" },
      4: { label: "Grade 4 · Proliferative", style: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]" },
    };

    const current = gradeConfig[gradeNum] || {
      label: `Grade ${gradeNum}`,
      style: "border-slate-200 bg-slate-50 text-slate-700",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${current.style} ${sizeClasses[size]} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {current.label}
      </span>
    );
  }

  // Generic status
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-medium text-slate-700 ${sizeClasses[size]} ${className}`}
    >
      <Clock size={12} className="text-slate-400" />
      {String(value)}
    </span>
  );
};
