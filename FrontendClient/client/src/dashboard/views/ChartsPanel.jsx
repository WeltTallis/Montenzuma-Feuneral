import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Activity, Users, MapPin, CheckCircle2, Package, Flower2 } from "lucide-react";

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#334155",
  fontSize: "12px",
};

/* Full screen analytics view matching the Serene Care reference */
export default function ChartsPanel({ pieData, stats, SM, mod, bookings }) {
  // Compute daily trend from bookings
  const dailyTrendMap = {};
  bookings.forEach(b => {
    const d = mod.dateField(b) || b.date;
    if (!d) return;
    const dateStr = typeof d === 'string' ? d.split("T")[0] : d.toISOString().split("T")[0];
    const day = dateStr.slice(-2); // just the day number
    if (!dailyTrendMap[day]) dailyTrendMap[day] = { day };
    const status = SM[b.status]?.label || "Other";
    dailyTrendMap[day][status] = (dailyTrendMap[day][status] || 0) + 1;
  });
  const dailyTrend = Object.values(dailyTrendMap).sort((a, b) => parseInt(a.day) - parseInt(b.day));

  const kpis = mod.kpiFields.map(({ key, label, icon: Icon }) => ({
    label,
    value: stats[key] || 0,
    Icon,
    color: SM[key]?.color || mod.accent,
  }));

  const totalCompleted = stats.completed || stats.released || stats.delivered || 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-6 max-w-[1600px] mx-auto">
        {/* Analytics header */}
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-200" style={{ fontFamily: "'Playfair Display', serif" }}>
              {mod.label} Analytics
            </h2>
            <p className="text-xs text-slate-400">Current Period · All Records</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col gap-2 shadow-lg">
            <div className="flex items-center justify-between">
              <Activity className="w-4 h-4 text-slate-300" />
              <span className="text-2xl font-bold text-slate-200 font-mono">{bookings.length}</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug">Total Events</p>
          </div>
          {kpis.map(({ label, value, Icon, color }) => (
            <div key={label} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col gap-2 shadow-lg">
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="xl:col-span-2 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-lg">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Daily Activity Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Event volume over the current period</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {pieData.map((d, i) => (
                    <linearGradient key={i} id={`gradArea${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={d.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={d.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "12px" }} />
                {pieData.map((d, i) => (
                  <Area key={i} type="monotone" dataKey={d.name} stroke={d.color} strokeWidth={2} fill={`url(#gradArea${i})`} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-lg">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Status Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Current state of all bookings</p>
            </div>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[260px] text-slate-500">
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "4px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}