import React from "react";
import { ANALYTICS_DATA, DR_GRADES_INFO } from "@/lib/mockData";
import { ClinicalDisclaimer } from "@/components/shared/ClinicalDisclaimer";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  Info,
  Calendar
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

export const AnalyticsPage: React.FC = () => {
  const { summary, monthlyVolume, phcDistribution } = ANALYTICS_DATA;

  const gradePieData = [
    { name: "Grade 0 (No DR)", value: 890, color: "#16a34a" },
    { name: "Grade 1 (Mild)", value: 246, color: "#0891b2" },
    { name: "Grade 2 (Moderate)", value: 148, color: "#f59e0b" },
    { name: "Grade 3 (Severe)", value: 48, color: "#ea580c" },
    { name: "Grade 4 (PDR)", value: 22, color: "#dc2626" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 lg:flex-row lg:items-center shadow-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">
            Program Monitoring & Epidemiology
          </div>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-extrabold text-[#0f2d4a]">
            Program Analytics & Screening Throughput
          </h1>
          <p className="mt-1 text-[13px] text-[#64748b]">
            District-wide epidemiological oversight tracking primary health centre throughput, referable case detection, and image quality metrics.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-bold text-[#1d4ed8]">
          <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
          DEMONSTRATION DATASET
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Total Screenings
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
              +14.2% MoM
            </span>
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#0f2d4a]">
            {summary.totalScreenings.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Cumulated across 5 rural PHCs</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Referable DR Detected
            </span>
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
              Grade ≥ 2
            </span>
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#ea580c]">
            {summary.referableCases}{" "}
            <span className="text-[16px] text-[#64748b] font-medium">
              ({((summary.referableCases / summary.totalScreenings) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Escalated to tele-retina clinic</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Quality Rejection Rate
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Target &lt;10%
            </span>
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#0f2d4a]">
            {((summary.rejectedQuality / summary.totalScreenings) * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">{summary.rejectedQuality} images recaptured</div>
        </div>

        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Mean Edge Latency
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
              Core i5 Edge
            </span>
          </div>
          <div className="mt-2 text-[32px] font-extrabold text-[#0f2d4a]">
            1.8s
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">142ms on GPU server</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Monthly Screening Throughput Trend Chart */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
            <div>
              <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
                Screening Volume & Referable Cases (2026)
              </h3>
              <div className="text-[11px] text-[#64748b]">
                Monthly trend showing increased detection rate with staff training.
              </div>
            </div>
          </div>

          <div className="mt-6 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="screenings" name="Total Screenings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referable" name="Referable DR (Grade ≥ 2)" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Grade Distribution Pie Chart */}
        <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
          <h3 className="text-[17px] font-extrabold text-[#0f2d4a]">
            Severity Grade Distribution (N = {summary.passedQuality})
          </h3>
          <div className="text-[11px] text-[#64748b] mb-4">
            Population prevalence among screened diabetic patients.
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {gradePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            {gradePieData.map((g) => (
              <div key={g.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-[#475569]">{g.name}:</span>
                <strong className="text-[#0f2d4a]">{g.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District / PHC Facility Table */}
      <div className="rounded-3xl border border-[#dce9f0] bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-[17px] font-extrabold text-[#0f2d4a] mb-4">
          Primary Health Centre (PHC) Performance Overview
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[11px] font-bold uppercase text-[#64748b]">
                <th className="pb-3">PHC Facility</th>
                <th className="pb-3">Screenings</th>
                <th className="pb-3">Referable Rate</th>
                <th className="pb-3">Quality Pass Rate</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {phcDistribution.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f8fafc]">
                  <td className="py-3 font-bold text-[#0f2d4a]">{row.phc}</td>
                  <td className="py-3 font-mono">{row.screenings}</td>
                  <td className="py-3 font-semibold text-orange-600">{row.referableRate}</td>
                  <td className="py-3 font-semibold text-emerald-600">{row.qualityPassRate}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 size={11} /> Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
