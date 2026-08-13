import React from "react";
import { DoorOpen, FlaskConical, Building2, Truck, Warehouse, Users } from "lucide-react";

const ICONS = {
  "door-open": DoorOpen, "flask-conical": FlaskConical, building: Building2,
  truck: Truck, warehouse: Warehouse, user: Users,
};

const RESOURCES = [
  { icon: "door-open", name: "Viewing Rooms", percentage: 70, used: 7, total: 10, color: "warning" },
  { icon: "flask-conical", name: "Prep Rooms", percentage: 67, used: 4, total: 6, color: "primary" },
  { icon: "building", name: "Chapel", percentage: 75, used: 3, total: 4, color: "warning" },
  { icon: "truck", name: "Hearses", percentage: 67, used: 8, total: 12, color: "primary" },
  { icon: "warehouse", name: "Storage", percentage: 60, used: 18, total: 30, color: "success" },
  { icon: "user", name: "Drivers", percentage: 75, used: 6, total: 8, color: "warning" },
];

const TONE = {
  danger: { color: "#dc2626", bg: "rgba(220,38,38,.10)" },
  warning: { color: "#b45309", bg: "rgba(217,119,6,.12)" },
  ok: { color: "#047857", bg: "rgba(5,150,105,.10)" },
};
function freeTone(res) {
  const ratio = res.total ? (res.total - res.used) / res.total : 0;
  if (ratio <= 0.2) return "danger";
  if (ratio <= 0.4) return "warning";
  return "ok";
}
const freeLabel = { danger: "Low availability", warning: "Getting full", ok: "Good availability" };
const barColor = { warning: "#d97706", primary: "var(--d-ring)", success: "#059669" };

/** ResourceCapacity — how full each shared facility is right now. */
export default function ResourceCapacity() {
  const totalUsed = RESOURCES.reduce((a, r) => a + r.used, 0);
  const totalFree = RESOURCES.reduce((a, r) => a + (r.total - r.used), 0);
  const overall = Math.round((totalUsed / (totalUsed + totalFree)) * 100) || 0;

  const RADIUS = 40;
  const CIRC = 2 * Math.PI * RADIUS;
  const donutOffset = CIRC - (overall / 100) * CIRC;

  return (
    <section className="dash-section">
      <div className="dash-section-head">
        <div className="dash-brand" style={{ gap: 10 }}>
          <span className="dash-ico" style={{ width: 32, height: 32, backgroundColor: "rgba(44,138,201,.14)", color: "#2c8ac9" }}>
            <Warehouse className="h-4 w-4" />
          </span>
          <div>
            <h2>Resource Capacity</h2>
            <span className="sub">Nairobi HQ · live utilization</span>
          </div>
        </div>
        <span className="dash-tag" style={{ backgroundColor: "rgba(5,150,105,.12)", color: "#047857" }}>Live</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 92, height: 92 }}>
            <svg width={92} height={92} viewBox="0 0 84 84">
              <circle cx="42" cy="42" r={RADIUS} fill="none" stroke="var(--d-muted)" strokeWidth="9" />
              <circle
                cx="42" cy="42" r={RADIUS} fill="none"
                stroke="#2c8ac9" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={donutOffset}
                transform="rotate(-90 42 42)"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <strong className="dash-num" style={{ fontSize: 18, lineHeight: 1 }}>{overall}%</strong>
              <span style={{ fontSize: 9, color: "var(--d-muted-fg)" }}>Utilized</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div><span className="dash-num" style={{ fontSize: 18, fontWeight: 700 }}>{totalUsed}</span> <span style={{ fontSize: 11, color: "var(--d-muted-fg)" }}>In use</span></div>
            <div><span className="dash-num" style={{ fontSize: 18, fontWeight: 700, color: "#047857" }}>{totalFree}</span> <span style={{ fontSize: 11, color: "var(--d-muted-fg)" }}>Available</span></div>
            <div><span className="dash-num" style={{ fontSize: 18, fontWeight: 700 }}>{RESOURCES.length}</span> <span style={{ fontSize: 11, color: "var(--d-muted-fg)" }}>Tracked</span></div>
          </div>
        </div>
<div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}>
          {RESOURCES.map((res, idx) => {
            const Icon = ICONS[res.icon];
            const tone = freeTone(res);
            const toneMeta = TONE[tone];
            const fill = barColor[res.color] || "var(--d-ring)";
            return (
              <div key={idx}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="dash-ico" style={{ width: 26, height: 26, backgroundColor: toneMeta.bg, color: toneMeta.color }}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{res.name}</span>
                      <span className="dash-num" style={{ fontSize: 12, fontWeight: 700 }}>{res.percentage}%</span>
                    </div>
                    <div style={{ marginTop: 4, height: 6, borderRadius: 4, background: "var(--d-muted)", overflow: "hidden" }}>
                      <div style={{ width: `${res.percentage}%`, height: "100%", borderRadius: 4, background: fill }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: "var(--d-muted-fg)" }}>
                      <span style={{ color: toneMeta.color, fontWeight: 600 }}>{freeLabel[tone]}</span>
                      <span>{res.used} / {res.total} in use</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
