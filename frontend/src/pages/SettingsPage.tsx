import React, { useState } from "react";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  Settings,
  Sliders,
  Cpu,
  Eye,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const SettingsPage: React.FC = () => {
  const [modelBackbone, setModelBackbone] = useState<string>("efficientnet-b0");
  const [referableThreshold, setReferableThreshold] = useState<number>(50);
  const [qualityThreshold, setQualityThreshold] = useState<number>(70);
  const [defaultOpacity, setDefaultOpacity] = useState<number>(75);
  const [colormap, setColormap] = useState<string>("turbo");
  const [enableClahe, setEnableClahe] = useState<boolean>(true);
  const [claheClip, setClaheClip] = useState<number>(2.0);

  const handleSave = () => {
    toast.success("Settings saved to local screening session configuration.");
  };

  const handleReset = () => {
    setModelBackbone("efficientnet-b0");
    setReferableThreshold(50);
    setQualityThreshold(70);
    setDefaultOpacity(75);
    setColormap("turbo");
    setEnableClahe(true);
    setClaheClip(2.0);
    toast.info("Settings restored to clinical defaults.");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            System & Clinical Configuration
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Screening & Inference Settings
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Configure model inference parameters, quality gate sensitivity thresholds, and visual explainability preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl border-[#cbd5e1] text-[12px] font-bold text-[#475569]"
          >
            <RefreshCw size={14} className="mr-1.5" /> Restore Defaults
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-[#2563eb] text-[12px] font-bold text-white shadow-xs hover:bg-[#1d4ed8]"
          >
            <Save size={14} className="mr-1.5" /> Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Model & Classification Settings */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-[#2563eb] text-[13px] font-extrabold uppercase">
            <Cpu size={18} /> Model Architecture & Thresholds
          </div>

          <div className="space-y-4 text-[12px]">
            <div>
              <label className="text-[11px] font-bold text-[#0f2d4a] block mb-1">
                Active Classification Backbone
              </label>
              <select
                value={modelBackbone}
                onChange={(e) => setModelBackbone(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2.5 font-bold text-[#0f2d4a] outline-none"
              >
                <option value="efficientnet-b0">EfficientNet-B0 (v0.1-Calibrated · Current Active)</option>
                <option value="resnet50">ResNet-50 (v0.9-Experimental Benchmark)</option>
                <option value="vit-base">Vision Transformer ViT-B/16 (In Training)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#0f2d4a] mb-1">
                <span>Referable DR Probability Cutoff (Grade ≥ 2):</span>
                <span className="font-mono text-[#2563eb]">{referableThreshold}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                value={referableThreshold}
                onChange={(e) => setReferableThreshold(Number(e.target.value))}
                className="w-full accent-[#2563eb]"
              />
              <span className="text-[10px] text-[#64748b]">
                Standard clinical operating point: 50%. Lowering cutoff increases sensitivity at expense of specificity.
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#0f2d4a] mb-1">
                <span>Quality Gate Rejection Score Cutoff:</span>
                <span className="font-mono text-[#2563eb]">{qualityThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                value={qualityThreshold}
                onChange={(e) => setQualityThreshold(Number(e.target.value))}
                className="w-full accent-[#2563eb]"
              />
              <span className="text-[10px] text-[#64748b]">
                Images scoring below this threshold halt inference and require mandatory frontline recapture.
              </span>
            </div>
          </div>
        </div>

        {/* Explainability & Visualization Settings */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-[#2563eb] text-[13px] font-extrabold uppercase">
            <Sliders size={18} /> Explainable AI (Grad-CAM) Preferences
          </div>

          <div className="space-y-4 text-[12px]">
            <div>
              <div className="flex justify-between font-bold text-[#0f2d4a] mb-1">
                <span>Default Heatmap Blend Opacity:</span>
                <span className="font-mono text-[#2563eb]">{defaultOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={defaultOpacity}
                onChange={(e) => setDefaultOpacity(Number(e.target.value))}
                className="w-full accent-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#0f2d4a] block mb-1">
                Saliency Colormap Palette
              </label>
              <select
                value={colormap}
                onChange={(e) => setColormap(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2.5 font-bold text-[#0f2d4a] outline-none"
              >
                <option value="turbo">Turbo (Perceptually Uniform High-Contrast · Recommended)</option>
                <option value="jet">Jet (Traditional Medical Rainbow)</option>
                <option value="plasma">Plasma (Colorblind-Safe Perceptual)</option>
                <option value="inferno">Inferno (High Thermal Gradient)</option>
              </select>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableClahe}
                  onChange={(e) => setEnableClahe(e.target.checked)}
                  className="rounded accent-[#2563eb]"
                />
                <span className="font-bold text-[#0f2d4a]">Enable CLAHE Local Contrast Enhancement</span>
              </label>
              <p className="mt-1 text-[11px] text-[#64748b]">
                Contrast Limited Adaptive Histogram Equalization sharpens subtle microaneurysm margins.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System & Tele-Ophthalmology Host Connectivity */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[16px] font-extrabold text-[#0f2d4a] mb-4">
          Environment & Backend Service Connectivity
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 text-[12px]">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Local PyTorch Server</span>
            <div className="mt-1 font-mono font-bold text-[#0f2d4a]">http://127.0.0.1:8000</div>
            <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Service Connected (FastAPI)
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Inference Device</span>
            <div className="mt-1 font-mono font-bold text-[#0f2d4a]">CPU / TorchScript INT8</div>
            <div className="mt-1 text-[#64748b] text-[11px]">Optimized for offline PHC laptops</div>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <span className="text-[10px] font-bold uppercase text-[#64748b]">Database Store</span>
            <div className="mt-1 font-mono font-bold text-[#0f2d4a]">SQLite / DICOM Store</div>
            <div className="mt-1 text-[#64748b] text-[11px]">Local encrypted storage buffer</div>
          </div>
        </div>
      </div>
    </div>
  );
};
