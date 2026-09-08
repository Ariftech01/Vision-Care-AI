import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TermTooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
  icon?: boolean;
}

export const TermTooltip: React.FC<TermTooltipProps> = ({
  term,
  definition,
  children,
  icon = true,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 border-b border-dashed border-[#94a3b8] text-inherit">
          {children || term}
          {icon && <HelpCircle size={11} className="text-[#94a3b8] hover:text-[#2563eb]" />}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] rounded-xl border border-[#cbd5e1] bg-[#0f172a] p-3 text-[11px] leading-relaxed text-[#f8fafc] shadow-xl">
        <strong className="block text-[#38bdf8] mb-1">{term}</strong>
        {definition}
      </TooltipContent>
    </Tooltip>
  );
};
