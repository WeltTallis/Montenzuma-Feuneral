// src/components/analysis/FinanceStrip.jsx
// Financial metrics strip — dark navy background, date-driven data.
import React, { useEffect, useState } from "react";
import { fetchFinanceStripData } from "../../api/dashboardDataApi";

const DEFAULT_METRICS = [
  { icon: "trending-up", label: "Day's Revenue", value: "KES —", subValue: "loading…", color: "success" },
  { icon: "clock", label: "Pending Payments", value: "KES —", subValue: "—", color: "warning" },
  { icon: "alert-circle", label: "Outstanding Balance", value: "KES —", subValue: "—", color: "danger" },
  { icon: "bar-chart-2", label: "Month to Date", value: "KES —", subValue: "—", color: "primary" },
];

const getIconColor = (color) => {
  const colors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    primary: "text-primary",
  };
  return colors[color] || "text-primary";
};

const getIcon = (name) => {
  const icons = {
    "trending-up": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M16 7h6v6"/>
        <path d="m22 7l-8.5 8.5l-5-5L2 17"/>
      </svg>
    ),
    clock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    "alert-circle": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4m0 4h.01"/>
      </svg>
    ),
    "bar-chart-2": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 21v-6m7 6V3m7 18V9"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

const FinanceStrip = ({ date }) => {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);

  // Independent financial fetch for this component (date-driven).
  useEffect(() => {
    let mounted = true;
    fetchFinanceStripData(date)
      .then((data) => {
        if (mounted && Array.isArray(data.metrics) && data.metrics.length) {
          setMetrics(data.metrics);
        }
      })
      .catch(() => { /* keep defaults */ });
    return () => { mounted = false; };
  }, [date]);

  return (
    <div className="finance-strip">
      {metrics.map((metric, idx) => (
        <div key={idx} className="finance-item">
          <div className={`finance-icon ${getIconColor(metric.color)}`}>
            {getIcon(metric.icon)}
          </div>
          <div className="finance-content">
            <div className="finance-value">{metric.value}</div>
            <div className="finance-label">{metric.label}</div>
            <div className={`finance-sub ${getIconColor(metric.color)}`}>{metric.subValue}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceStrip;