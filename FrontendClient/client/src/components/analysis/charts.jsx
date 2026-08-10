import React, { useState, useMemo } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

/* ─── Theme colors (matches memorial dashboard palette) ─── */
const C = {
  pri: "#3D4F47", priA: "rgba(61,79,71,.15)", priL: "#E8EDE9",
  suc: "#475A43", sucA: "rgba(71,90,67,.15)", sucL: "#EAF0E8",
  wrn: "#8B7355", wrnA: "rgba(139,115,85,.15)", wrnL: "#F5F0E8",
  dng: "#dc3545", dngA: "rgba(220,53,69,.15)", dngL: "#FDF2F2",
  pur: "#5B7C6B", purA: "rgba(91,124,107,.15)", purL: "#E8EDE9",
  cyn: "#52796F", cynA: "rgba(82,121,111,.15)", cynL: "#EDF3F0",
  org: "#A98A5A", orgA: "rgba(169,138,90,.15)", orgL: "#F7F1E8",
  tx: "#1a1a1a", txM: "#999", txF: "#ccc",
  bd: "#e5e5e5", bdL: "#efefef", sf: "#fff", bg: "#F5F4F1",
};

ChartJS.defaults.color = C.txM;
ChartJS.defaults.borderColor = C.bdL;
ChartJS.defaults.font = { family: "'Inter',sans-serif", size: 11 };

const MOS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BRANCHES = ["Nairobi HQ","Mombasa","Kisumu","Nakuru","Machakos"];

/* ─── Shared chart options ─── */
const BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { boxWidth: 10, usePointStyle: true, pointStyle: "circle", padding: 14, font: { size: 10, family: "'Inter',sans-serif" } } },
    tooltip: {
      backgroundColor: "rgba(26,26,26,.92)", titleColor: "#fff", bodyColor: "#e5e5e5", cornerRadius: 6,
      padding: { top: 8, bottom: 8, left: 12, right: 12 }, titleFont: { size: 11, weight: "600" },
      bodyFont: { size: 11 }, displayColors: true, boxPadding: 4, borderColor: "rgba(255,255,255,.08)", borderWidth: 1, usePointStyle: true,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, padding: 6 }, border: { display: false } },
    y: { beginAtZero: true, grid: { color: "rgba(229,229,229,.35)" }, ticks: { font: { size: 10 }, padding: 8 }, border: { display: false } },
  },
};

const NO_SCALES = { ...BASE, scales: {} };
const DOUGHNUT_OPTS = { ...NO_SCALES, cutout: "64%" };

/* ─── Mock datasets ─── */
const admTrend = [28, 32, 38, 41, 36, 44, 39, 22];
const relTrend = [24, 31, 35, 37, 40, 39, 42, 18];
const pmTrend  = [12, 18, 20, 22, 15, 25, 19, 10];

const branchAdmitted = [112, 67, 54, 31, 20];
const branchReleased = [98, 58, 47, 28, 17];
const branchPending  = [14, 9, 7, 3, 3];

const statusData = [94, 78, 18, 12, 5];
const statusLabels = ["Released","In Morgue","Postmortem","Pending","Cancelled"];
const statusColors = [C.suc, C.pri, C.wrn, C.org, C.dng];

const weeklyDow = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const weeklyVals = [8, 12, 15, 10, 18, 22, 6];

const monthIdx = new Date().getMonth();
const visMonths = MOS.slice(Math.max(0, monthIdx - 7), monthIdx + 1);

/* ─── Small card wrapper ─── */
function ChartCard({ title, subtitle, children, span }) {
  return (
    <div style={{
      gridColumn: span || "auto",
      background: "var(--color-surface, #fff)",
      border: "1px solid var(--color-border, #e5e5e5)",
      borderRadius: "var(--radius-lg, 12px)",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minHeight: span === "1 / -1" ? 260 : 320,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground, #1a1a1a)", marginBottom: 2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: "var(--color-muted-foreground, #999)" }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Mini stat pill ─── */
function MiniStat({ label, value, color, bg }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 8,
      background: bg, border: `1px solid ${color}22`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "var(--color-muted-foreground, #999)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1.2, letterSpacing: "-0.5px" }}>{value}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════ */
export default function AnalyticsCharts() {
  const [timeRange, setTimeRange] = useState("8m");

  /* ── Line: Admissions Trend ── */
  const admLineData = useMemo(() => ({
    labels: visMonths,
    datasets: [
      {
        label: "Admitted",
        data: admTrend.slice(visMonths.length - 8),
        borderColor: C.pri,
        backgroundColor: C.priA,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: C.sf,
        pointBorderColor: C.pri,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: "Released",
        data: relTrend.slice(visMonths.length - 8),
        borderColor: C.suc,
        backgroundColor: C.sucA,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: C.sf,
        pointBorderColor: C.suc,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: "Postmortem",
        data: pmTrend.slice(visMonths.length - 8),
        borderColor: C.wrn,
        backgroundColor: "transparent",
        borderDash: [6, 4],
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: C.sf,
        pointBorderColor: C.wrn,
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  }), [visMonths]);

  /* ── Stacked Bar: Branch Admitted vs Released ── */
  const branchBarData = useMemo(() => ({
    labels: BRANCHES,
    datasets: [
      {
        label: "Admitted",
        data: branchAdmitted,
        backgroundColor: C.pri,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: "Released",
        data: branchReleased,
        backgroundColor: C.suc,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: "Pending",
        data: branchPending,
        backgroundColor: C.wrn,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  }), []);

  const branchBarOpts = useMemo(() => ({
    ...BASE,
    scales: {
      ...BASE.scales,
      x: { ...BASE.scales.x, stacked: true, ticks: { ...BASE.scales.x.ticks, font: { size: 9 } } },
      y: { ...BASE.scales.y, stacked: true },
    },
    plugins: { ...BASE.plugins, legend: { ...BASE.plugins.legend, position: "top" } },
  }), []);

  /* ── Doughnut: Status Distribution ── */
  const statusDoughnutData = useMemo(() => ({
    labels: statusLabels,
    datasets: [{
      data: statusData,
      backgroundColor: statusColors,
      borderColor: C.sf,
      borderWidth: 2,
      hoverOffset: 6,
    }],
  }), []);

  const statusDoughnutOpts = useMemo(() => ({
    ...DOUGHNUT_OPTS,
    plugins: {
      ...DOUGHNUT_OPTS.plugins,
      legend: { ...DOUGHNUT_OPTS.plugins.legend, position: "right", labels: { ...DOUGHNUT_OPTS.plugins.legend.labels, padding: 12, font: { size: 10 } } },
    },
  }), []);

  /* ── Bar: Weekly Pattern ── */
  const weeklyBarData = useMemo(() => ({
    labels: weeklyDow,
    datasets: [{
      label: "Admissions",
      data: weeklyVals,
      backgroundColor: weeklyVals.map(v => v >= 18 ? C.dng : v >= 14 ? C.wrn : v >= 10 ? C.pri : C.cyn),
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.55,
    }],
  }), []);

  /* ── Line: Hearse Utilization ── */
  const hearseLineData = useMemo(() => ({
    labels: visMonths,
    datasets: [
      {
        label: "Trips Completed",
        data: [45, 52, 58, 63, 55, 68, 61, 38].slice(visMonths.length - 8),
        borderColor: C.cyn,
        backgroundColor: C.cynA,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: C.sf,
        pointBorderColor: C.cyn,
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: "Delayed Trips",
        data: [5, 8, 6, 9, 4, 7, 3, 6].slice(visMonths.length - 8),
        borderColor: C.dng,
        backgroundColor: "transparent",
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: C.sf,
        pointBorderColor: C.dng,
        pointBorderWidth: 2,
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ],
  }), [visMonths]);

  /* ── Bar: Coffin Stock by Type ── */
  const coffinBarData = useMemo(() => ({
    labels: ["Mahogany\nPremium", "Oak\nStandard", "Pine\nEconomy", "Hardwood\nDeluxe", "Wicker\nNatural"],
    datasets: [
      {
        label: "In Stock",
        data: [12, 8, 3, 15, 0],
        backgroundColor: C.suc,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
      {
        label: "Booked",
        data: [3, 5, 2, 1, 0],
        backgroundColor: C.pri,
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
    ],
  }), []);

  /* ── Quick stats ── */
  const totalAdm = admTrend.reduce((a, b) => a + b, 0);
  const totalRel = relTrend.reduce((a, b) => a + b, 0);
  const avgWeekly = Math.round(weeklyVals.reduce((a, b) => a + b, 0) / 7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'Inter',sans-serif" }}>
      {/* ─── Header + Range Toggle ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.priL, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.pri} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground, #1a1a1a)" }}>Analytics Overview</div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground, #999)" }}>Trends, distributions, and patterns</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Quick stats row */}
          <div style={{ display: "flex", gap: 6, marginRight: 8 }}>
            <MiniStat label="Total Admitted" value={totalAdm} color={C.pri} bg={C.priL} />
            <MiniStat label="Total Released" value={totalRel} color={C.suc} bg={C.sucL} />
            <MiniStat label="Avg/Week" value={avgWeekly} color={C.wrn} bg={C.wrnL} />
          </div>

          {/* Range toggle */}
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${C.bd}`, flexShrink: 0 }}>
            {["6m", "8m", "12m"].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                style={{
                  padding: "5px 14px", border: "none",
                  background: timeRange === r ? C.pri : C.sf,
                  color: timeRange === r ? "#fff" : C.tx,
                  fontSize: 11, fontWeight: timeRange === r ? 600 : 400,
                  cursor: "pointer", fontFamily: "'Inter',sans-serif",
                  transition: "all .12s",
                  borderRight: r !== "12m" ? `1px solid ${C.bd}` : "none",
                }}
              >
                {r === "6m" ? "6 Months" : r === "8m" ? "8 Months" : "12 Months"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Chart Grid ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        {/* Row 1: Admission Trend (full width) */}
        <ChartCard title="Admission & Release Trend" subtitle="Monthly admissions vs releases with postmortem overlay" span="1 / -1">
          <Line data={admLineData} options={BASE} />
        </ChartCard>

        {/* Row 2: Branch Bar + Status Doughnut */}
        <ChartCard title="Branch Comparison" subtitle="Admitted, released, and pending by branch">
          <Bar data={branchBarData} options={branchBarOpts} />
        </ChartCard>

        <ChartCard title="Status Distribution" subtitle="Current status breakdown of all records">
          <Doughnut data={statusDoughnutData} options={statusDoughnutOpts} />
        </ChartCard>

        {/* Row 3: Weekly Pattern + Hearse Utilization */}
        <ChartCard title="Weekly Admission Pattern" subtitle="Average admissions by day of week — color indicates volume">
          <Bar data={weeklyBarData} options={{
            ...BASE,
            plugins: { ...BASE.plugins, legend: { display: false } },
            scales: {
              ...BASE.scales,
              y: { ...BASE.scales.y, suggestedMax: 30 },
            },
          }} />
        </ChartCard>

        <ChartCard title="Hearse Utilization" subtitle="Monthly trip completion vs delays">
          <Line data={hearseLineData} options={BASE} />
        </ChartCard>

        {/* Row 4: Coffin Stock (full width) */}
        <ChartCard title="Coffin Inventory by Type" subtitle="Current stock levels vs booked quantities" span="1 / -1">
          <Bar data={coffinBarData} options={{
            ...BASE,
            scales: {
              ...BASE.scales,
              x: { ...BASE.scales.x, ticks: { ...BASE.scales.x.ticks, font: { size: 9 }, maxRotation: 0 } },
              y: { ...BASE.scales.y, suggestedMax: 20 },
            },
          }} />
        </ChartCard>
      </div>
    </div>
  );
}