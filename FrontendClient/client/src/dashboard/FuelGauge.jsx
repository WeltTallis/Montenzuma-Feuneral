import React from "react";

const COLOR = (v) => (v > 50 ? "#059669" : v > 20 ? "#d97706" : "#dc2626");

/** FuelGauge — compact circular ring showing a percentage. */
export default function FuelGauge({ value, size = 52 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const col = COLOR(pct);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }} aria-hidden="true">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(44,62,80,.12)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <span
        style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: size * 0.24, fontWeight: 700, color: "var(--d-card-fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pct}
      </span>
    </div>
  );
}
