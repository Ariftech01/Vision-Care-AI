import React, { useState } from "react";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  Zap,
  Building2,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Network,
  Activity,
  Sliders
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export const DeploymentPage: React.FC = () => {
  const [centers, setCenters] = useState<number>(12);
  const [camerasPerCenter, setCamerasPerCenter] = useState<number>(4);
  const [acquisitionRate, setAcquisitionRate] = useState<number>(30); // images/hour/camera

  // Derived calculations mirroring simulink/screening_workflow.m
  const totalCameras = centers * camerasPerCenter;
  const imagesPerHour = totalCameras * acquisitionRate;
  const imagesPerDay = imagesPerHour * 8; // 8 work hours
  const aiCapacityPerDay = Math.floor((8 * 3600) / 8 * centers); // 8s per image
  const reviewCapacityPerDay = 50 * centers; // 50 reviews per day per center specialist pool

  const throughputData = [
    { name: "Camera Capture", capacity: imagesPerDay, color: "#2563eb" },
    { name: "AI Edge Inference", capacity: aiCapacityPerDay, color: "#10b981" },
    { name: "Specialist Review (Raw)", capacity: reviewCapacityPerDay, color: "#ef4444" },
    { name: "AI-Triaged Review (15%)", capacity: Math.floor(imagesPerDay * 0.15), color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Simulation & Scalability (SIH26038)
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Simulink & District Deployment Model
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Mathematical queuing & hardware capacity simulation for district-scale screening of 100,000+ patients/year.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[11px] font-bold text-amber-800">
          <Zap size={14} /> MATLAB / Simulink Connected Model
        </div>
      </div>

      {/* District Parameters Interactive Sliders */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[16px] font-extrabold text-[#0f2d4a] mb-4">
          Interactive Simulink District Parameters
        </h3>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="flex justify-between text-[12px] font-bold text-[#0f2d4a]">
              <span>Screening Centres (PHCs / CHCs):</span>
              <span className="font-mono text-[#2563eb]">{centers}</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              value={centers}
              onChange={(e) => setCenters(Number(e.target.value))}
              className="mt-2 w-full accent-[#2563eb]"
            />
            <span className="text-[10px] text-[#64748b]">Simulates block-level distribution</span>
          </div>

          <div>
            <div className="flex justify-between text-[12px] font-bold text-[#0f2d4a]">
              <span>Cameras per Centre:</span>
              <span className="font-mono text-[#2563eb]">{camerasPerCenter}</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={camerasPerCenter}
              onChange={(e) => setCamerasPerCenter(Number(e.target.value))}
              className="mt-2 w-full accent-[#2563eb]"
            />
            <span className="text-[10px] text-[#64748b]">Non-mydriatic fundus cameras</span>
          </div>

          <div>
            <div className="flex justify-between text-[12px] font-bold text-[#0f2d4a]">
              <span>Acquisition Rate (images/hr/camera):</span>
              <span className="font-mono text-[#2563eb]">{acquisitionRate}</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={acquisitionRate}
              onChange={(e) => setAcquisitionRate(Number(e.target.value))}
              className="mt-2 w-full accent-[#2563eb]"
            />
            <span className="text-[10px] text-[#64748b]">Frontline operator capture velocity</span>
          </div>
        </div>
      </div>

      {/* Simulink Output Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#64748b]">Active Camera Units</span>
          <div className="mt-2 text-[30px] font-extrabold text-[#0f2d4a]">{totalCameras}</div>
          <div className="text-[11px] text-[#64748b]">Across {centers} screening blocks</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#64748b]">Daily Image Capture</span>
          <div className="mt-2 text-[30px] font-extrabold text-[#2563eb]">
            {imagesPerDay.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748b]">8-hour standard operational shift</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#64748b]">Ophthalmologist Bottleneck</span>
          <div className="mt-2 text-[30px] font-extrabold text-[#ea580c]">
            {(imagesPerDay / reviewCapacityPerDay).toFixed(1)}×
          </div>
          <div className="text-[11px] text-[#64748b]">Specialist review overload without AI</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#64748b]">AI Triaged Review Queue</span>
          <div className="mt-2 text-[30px] font-extrabold text-emerald-600">
            {Math.floor(imagesPerDay * 0.15).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748b]">Only referable cases escalated (~15%)</div>
        </div>
      </div>

      {/* Simulink Throughput Bottleneck Comparison Chart */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
          Daily Throughput & Specialist Bottleneck Relief
        </h3>
        <p className="text-[12px] text-[#64748b] mb-6">
          Demonstrates how Vision Care AI filters out 85% of normal/mild cases, making specialist review achievable within human capacity.
        </p>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="capacity" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Planned Edge Hardware Deployment Specs */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
          Hardware & Deployment Topology
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 text-[12px]">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <strong className="block text-[#0f2d4a] font-bold mb-1">Local PHC Laptop (Edge)</strong>
            <p className="text-[11px] text-[#64748b] leading-relaxed">
              Runs lightweight INT8 quantized ONNX runtime for sub-2s image quality checks and preliminary grading without reliable internet connectivity.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <strong className="block text-[#0f2d4a] font-bold mb-1">Local Store & Forward Cache</strong>
            <p className="text-[11px] text-[#64748b] leading-relaxed">
              Secure SQLite local storage holds captured images when village cellular connectivity is down, batch-syncing when bandwidth recovers.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <strong className="block text-[#0f2d4a] font-bold mb-1">District Hospital Server</strong>
            <p className="text-[11px] text-[#64748b] leading-relaxed">
              Consolidates referable cases into a prioritized tele-ophthalmology reading queue where certified ophthalmologists render final decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
