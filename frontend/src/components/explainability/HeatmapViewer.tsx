import React, { useState } from "react";
import { Sliders, Eye, Layers, Split, HelpCircle, Sparkles, Flame } from "lucide-react";
import { TermTooltip } from "../shared/TermTooltip";

interface HeatmapViewerProps {
  originalImage: string;
  gradcamImage?: string;
  heatmapImage?: string;
  className?: string;
}

export const HeatmapViewer: React.FC<HeatmapViewerProps> = ({
  originalImage,
  gradcamImage = "/images/dr_case_gradcam.png",
  heatmapImage,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"overlay" | "sideBySide" | "split">("overlay");
  const [layerMode, setLayerMode] = useState<"overlay" | "thermal">("overlay");
  const [opacity, setOpacity] = useState<number>(85);
  const [activeLayer, setActiveLayer] = useState<"features[8]" | "features[7]">("features[8]");
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [splitPos, setSplitPos] = useState<number>(50);

  const activeHeatmapSrc =
    layerMode === "thermal" && heatmapImage
      ? heatmapImage
      : gradcamImage || originalImage;

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#dce9f0] bg-white shadow-sm ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers size={17} className="text-[#2563eb]" />
          <div>
            <div className="text-[13px] font-extrabold text-[#0f2d4a]">
              Grad-CAM Visual Attention Map
            </div>
            <div className="text-[10px] text-[#64748b]">
              Target Layer: <span className="font-mono font-semibold text-[#2563eb]">{activeLayer}</span> · Weight-pooled gradient backprop
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Style Selector (Blended Overlay vs Thermal Heatmap) */}
          {heatmapImage && (
            <div className="flex items-center gap-1 rounded-xl border border-[#cbd5e1] bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setLayerMode("overlay")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  layerMode === "overlay" ? "bg-[#0f2d4a] text-white shadow-xs" : "text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                <Sparkles size={12} />
                Blended
              </button>
              <button
                type="button"
                onClick={() => setLayerMode("thermal")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  layerMode === "thermal" ? "bg-[#ea580c] text-white shadow-xs" : "text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                <Flame size={12} />
                Thermal
              </button>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-[#cbd5e1] bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode("overlay")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                viewMode === "overlay" ? "bg-[#2563eb] text-white shadow-xs" : "text-[#475569] hover:bg-[#f1f5f9]"
              }`}
            >
              <Eye size={13} />
              Overlay
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                viewMode === "split" ? "bg-[#2563eb] text-white shadow-xs" : "text-[#475569] hover:bg-[#f1f5f9]"
              }`}
            >
              <Split size={13} />
              Split Slider
            </button>
            <button
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                viewMode === "sideBySide" ? "bg-[#2563eb] text-white shadow-xs" : "text-[#475569] hover:bg-[#f1f5f9]"
              }`}
            >
              <Layers size={13} />
              Side-by-Side
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative bg-[#020617] p-3">
        {viewMode === "overlay" && (
          <div className="relative mx-auto max-w-[640px] overflow-hidden rounded-xl border border-white/10">
            {/* Base Image */}
            <img
              src={originalImage}
              alt="Original Fundus"
              className="h-[360px] w-full object-contain sm:h-[440px]"
            />

            {/* Heatmap Overlay with dynamic opacity */}
            <img
              src={activeHeatmapSrc}
              alt="Grad-CAM Heatmap"
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${
                layerMode === "thermal" ? "mix-blend-screen" : ""
              }`}
              style={{ opacity: opacity / 100 }}
            />

            {/* ROI Annotations */}
            {showAnnotations && (
              <>
                <div className="absolute top-[32%] left-[48%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                  <span className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f97316] opacity-70"></span>
                    <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-[#ea580c]"></span>
                  </span>
                  <div className="absolute left-10 top-0 hidden w-48 rounded-lg border border-white/20 bg-black/90 p-2 text-[10px] text-white backdrop-blur-md group-hover:block z-20">
                    <strong className="text-[#fdba74] block">High Activation Focus (94%)</strong>
                    Superior temporal vessel bifurcation · High gradient backprop saliency.
                  </div>
                </div>

                <div className="absolute top-[64%] left-[44%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                  <span className="relative flex h-7 w-7 items-center justify-center">
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f59e0b]"></span>
                  </span>
                  <div className="absolute left-9 top-0 hidden w-44 rounded-lg border border-white/20 bg-black/90 p-2 text-[10px] text-white backdrop-blur-md group-hover:block z-20">
                    <strong className="text-[#fde68a] block">Moderate Activation (71%)</strong>
                    Inferior arcade retinal region · Salient convolutional filter attribution.
                  </div>
                </div>
              </>
            )}

            {/* Heatmap Legend Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/80 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur-md border border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                Low Attention
              </span>
              <div className="h-2 w-32 rounded-full bg-gradient-to-r from-[#2563eb] via-[#10b981] via-[#facc15] to-[#ef4444]" />
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                High DR Focus
              </span>
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <div className="relative mx-auto max-w-[640px] select-none overflow-hidden rounded-xl border border-white/10 h-[360px] sm:h-[440px]">
            {/* Background: Heatmap */}
            <img
              src={activeHeatmapSrc}
              alt="Grad-CAM Heatmap"
              className="absolute inset-0 h-full w-full object-contain"
            />
            {/* Foreground: Original (clipped by splitPos) */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-white"
              style={{ width: `${splitPos}%` }}
            >
              <img
                src={originalImage}
                alt="Original Fundus"
                className="absolute inset-0 h-[360px] sm:h-[440px] w-[640px] max-w-none object-contain"
              />
            </div>
            {/* Split Slider handle */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="absolute inset-0 h-full w-full opacity-0 cursor-ew-resize z-20"
            />
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0f2d4a] shadow-lg text-[10px] font-bold">
                ⬌
              </div>
            </div>
            <div className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
              Original Fundus
            </div>
            <div className="absolute top-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[9px] font-bold text-[#f97316] uppercase tracking-wider backdrop-blur-xs">
              Grad-CAM Heatmap
            </div>
          </div>
        )}

        {viewMode === "sideBySide" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white">
                Original Retinal Fundus (45° Macula-Centered)
              </div>
              <img
                src={originalImage}
                alt="Original Fundus"
                className="h-[280px] w-full object-contain p-2 sm:h-[340px]"
              />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-[#fdba74]">
                Model Gradient Attention (EfficientNet-B0)
              </div>
              <img
                src={activeHeatmapSrc}
                alt="Grad-CAM"
                className="h-[280px] w-full object-contain p-2 sm:h-[340px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Panel Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e2e8f0] bg-white p-4">
        {/* Opacity Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#475569]">Heatmap Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="h-1.5 w-32 cursor-pointer accent-[#2563eb]"
          />
          <span className="w-8 text-[11px] font-mono font-bold text-[#0f2d4a]">{opacity}%</span>
        </div>

        {/* Layer and ROI switches */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569] cursor-pointer">
            <input
              type="checkbox"
              checked={showAnnotations}
              onChange={(e) => setShowAnnotations(e.target.checked)}
              className="rounded accent-[#2563eb]"
            />
            Highlight Salient ROIs
          </label>

          <span className="h-4 w-px bg-[#cbd5e1]" />

          <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <span>Conv Layer:</span>
            <select
              value={activeLayer}
              onChange={(e) => setActiveLayer(e.target.value as any)}
              className="rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-2 py-1 text-[11px] font-bold text-[#0f2d4a] outline-none"
            >
              <option value="features[8]">features[8] (Final Top Layer)</option>
              <option value="features[7]">features[7] (Mid-Level Semantics)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
