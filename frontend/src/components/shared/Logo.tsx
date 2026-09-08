import React from "react";

interface LogoProps {
  compact?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({ compact = false, className = "", size = "md" }) => {
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-[14px]",
    md: "text-[16px]",
    lg: "text-[20px]",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Eye + AI Medical Symbol */}
      <div
        className={`relative flex items-center justify-center rounded-[14px] bg-gradient-to-br from-[#0284c7]/10 via-[#2563eb]/10 to-[#38bdf8]/20 ring-1 ring-[#2563eb]/20 shadow-[0_2px_8px_rgba(37,99,235,0.08)] ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-[#2563eb]"
        >
          {/* Outer Eye Contour */}
          <path
            d="M4 20C7.5 11.5 14 7 20 7C26 7 32.5 11.5 36 20C32.5 28.5 26 33 20 33C14 33 7.5 28.5 4 20Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Concentric AI Retina / Iris Network */}
          <circle cx="20" cy="20" r="7" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="3 2" />
          <circle cx="20" cy="20" r="3.5" fill="#2563eb" />
          {/* Subtle neural nodes / calibration ticks */}
          <circle cx="13" cy="20" r="1" fill="#0284c7" />
          <circle cx="27" cy="20" r="1" fill="#0284c7" />
          <circle cx="20" cy="13" r="1" fill="#0284c7" />
          <circle cx="20" cy="27" r="1" fill="#0284c7" />
          {/* Medical Plus Accent on top right */}
          <path d="M31 10H35M33 8V12" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {!compact && (
        <div>
          <div className={`font-extrabold tracking-[-0.03em] text-[#0f2d4a] ${textSizes[size]}`}>
            Vision Care <span className="text-[#2563eb]">AI</span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b8c9e]">
            Diabetic Retinopathy Screening
          </div>
        </div>
      )}
    </div>
  );
};
