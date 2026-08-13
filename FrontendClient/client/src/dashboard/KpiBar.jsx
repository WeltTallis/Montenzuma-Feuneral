import React, { useEffect, useState } from "react";
import { fetchFinanceStripData } from "../api/dashboardDataApi";
import { analyticsApi } from "../api/analyticsApi";
import { formatKes, tint } from "./data";

/** Fallback today metrics (demo). Replace with real API shape when ready. */
const FALLBACK = [
  { icon: "Day revenue", value: "KSh —", sub: "demo", color: "var(--d-ev-intake)" },
  { icon: "Payments received", value: "KSh —", sub: "demo", color: "var(--d-ev-release)" },
  { icon: "Outstanding balance", value: "KSh —", sub: "demo", color: "var(--d-danger)" },
  { icon: "Active cases", value: "—", sub: "demo", color: "var(--d-warn)" },
];

/** KpiBar — top financial / operational strip, date-driven, live with fallback. */
export default function KpiBar({ date }) {
  const [metrics, setMetrics] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fs, comp] = await Promise.all([
          fetchFinanceStripData(date).catch(() => null),
          analyticsApi.getComprehensiveDashboard().catch(() => null),
        ]);
        if (!mounted) return;
        const merged = [];
        if (fs && Array.isArray(fs.metrics) && fs.metrics.length) {
          fs.metrics.forEach((m) => merged.push({
            icon: m.label, value: m.value, sub: m.subValue,
            color: colorFor(m.color),
          }));
        }
        const compData = comp?.data || comp || {};
        const derived = deriveFromComprehensive(compData);
        const result = merged.length ? merged : derived;
        setMetrics(result.length ? result : FALLBACK);
      } catch {
        if (mounted) setMetrics(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [date]);

  const show = loading && metrics === FALLBACK ? FALLBACK : metrics;

  return (
    <div
      className="dash-stats"
      style={{
        "--tw-gap": "14px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
      }}
    >
      {show.map((m, i) => (
        <div key={i} className="dash-stat" style={{ padding: 14 }}>
          <div className="dash-stat-top">
            <span
              className="dash-stat-ico"
              style={{ backgroundColor: tint(m.color, 14), color: m.color }}
            >
              {dotIcon(m.color)}
            </span>
            <span className="dash-stat-val dash-num" style={{ fontSize: 18 }}>{m.value}</span>
          </div>
          <p className="dash-stat-txt">{m.icon}</p>
          <p className="dash-stat-txt" style={{ fontSize: 11 }}>{m.sub}</p>
        </div>
      ))}
    </div>
  );
}

const COLOR_MAP = {
  success: "var(--d-ev-release)", warning: "var(--d-warn)",
  danger: "var(--d-danger)", primary: "var(--d-ring)",
  info: "var(--d-ev-intake)",
};
function colorFor(key) { return COLOR_MAP[key] || "var(--d-primary)"; }

function dotIcon(color) {
  return <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: color }} />;
}

/** Derive 4 headline metrics from the comprehensive aggregate response. */
function deriveFromComprehensive(comp) {
  const k = comp || {};
  const fmt = (n) => (n == null ? "KSh —" : formatKes(Number(n)));
  return [
    { icon: "Day revenue", value: fmt(k.todayRevenue ?? k.dayRevenue), sub: "Live data", color: "var(--d-ev-intake)" },
    { icon: "Payments received", value: fmt(k.payments ?? k.paymentsReceived), sub: "Today", color: "var(--d-ev-release)" },
    { icon: "Outstanding balance", value: fmt(k.outstanding), sub: "Needs follow-up", color: "var(--d-danger)" },
    { icon: "Active cases", value: String(k.activeCases ?? k.active_deceased ?? "—"), sub: "In care", color: "var(--d-warn)" },
  ];
}
