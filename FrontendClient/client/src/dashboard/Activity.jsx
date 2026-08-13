import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, ArrowUpRight, Truck, RotateCcw, PackageX, CheckCircle2, XCircle, CreditCard, Clock, Wrench, Repeat, CalendarClock, Radio } from "lucide-react";

const ICONS = {
  admit: UserPlus, release: ArrowUpRight, dispatch: Truck, return: RotateCcw,
  "stock-low": PackageX, "request-approve": CheckCircle2, "request-decline": XCircle,
  payment: CreditCard, delay: Clock, maintenance: Wrench, transfer: Repeat, schedule: CalendarClock,
};

const TYPE_COLOR = {
  admit: "#059669", release: "#2563eb", dispatch: "#059669", return: "#2563eb",
  "stock-low": "#d97706", "request-approve": "#059669", "request-decline": "#dc2626",
  payment: "#059669", delay: "#dc2626", maintenance: "#b45309", transfer: "#d97706", schedule: "#b45309",
};

const INITIAL = [
  { type: "admit", title: "Deceased admitted", detail: "John Mwangi — Nairobi HQ, Ward 3B", time: 0.1, branch: "nairobi" },
  { type: "dispatch", title: "Hearse dispatched", detail: "KDA 220H to Holy Cross Burial Ground", time: 0.3, branch: "nairobi" },
  { type: "stock-low", title: "Coffin stock low", detail: "Pine Economy at Machakos — 3 remaining", time: 0.7, branch: "machakos" },
  { type: "request-approve", title: "Branch request approved", detail: "REQ-4080 — 6× Oak Standard to Thika", time: 1, branch: "thika" },
  { type: "delay", title: "Hearse delayed", detail: "KCN 640T stuck in traffic — Mombasa Rd", time: 1.5, branch: "nairobi" },
  { type: "payment", title: "Payment received", detail: "KES 12,000 — Pine Economy, Machakos", time: 2, branch: "machakos" },
  { type: "maintenance", title: "Hearse in maintenance", detail: "KDG 901L — brake service due", time: 3, branch: "machakos" },
  { type: "schedule", title: "Chapel service scheduled", detail: "Nairobi Chapel A — 10:30 AM funeral", time: 4, branch: "nairobi" },
  { type: "transfer", title: "Remains transferred", detail: "Thika → Nairobi HQ cold chain", time: 5, branch: "thika" },
  { type: "release", title: "Body released to family", detail: "Achieng Odhiambo — Langata Cemetery", time: 8, branch: "nairobi" },
];

const LIVE_COMPOSE = [
  { type: "admit", title: "Deceased admitted", detail: "Peter Otieno — Mombasa, Ward 2A" },
  { type: "stock-low", title: "Coffin stock low", detail: "Oak Standard at Machakos — 2 remaining" },
  { type: "dispatch", title: "Hearse dispatched", detail: "KCX 455F to Langata Cemetery" },
  { type: "payment", title: "Payment received", detail: "KES 12,000 — Pine Economy, Kisumu" },
  { type: "delay", title: "Schedule conflict detected", detail: "Two burials at same venue — 10AM" },
];

/** Activity — recent operations timeline across branches, filtered by window, live. */
export default function Activity() {
  const [items, setItems] = useState(INITIAL);
  const [timeFilter, setTimeFilter] = useState("6h");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (tick > 0) {
      const pick = LIVE_COMPOSE[Math.floor(Math.random() * LIVE_COMPOSE.length)];
      const br = ["nairobi", "nairobi", "machakos", "thika"][Math.floor(Math.random() * 4)];
      setItems((prev) => [
        { type: pick.type, title: pick.title, detail: pick.detail, time: 0, branch: br },
        ...prev.slice(0, 24),
      ]);
    }
  }, [tick]);

  const filtered = useMemo(() => {
    const hrs = timeFilter === "6h" ? 6 : 12;
    return items.filter((a) => a.time <= hrs);
  }, [items, timeFilter]);

  const timeStr = (h) => {
    if (h < 0.1) return "Just now";
    if (h < 0.25) return "4 min ago";
    if (h < 0.5) return "15 min ago";
    if (h < 1) return "30 min ago";
    return `${Math.round(h)}h ago`;
  };
  const branchName = { nairobi: "Nairobi", machakos: "Machakos", thika: "Thika" };
  const brColor = { nairobi: "var(--d-branch-nairobi)", machakos: "var(--d-branch-machakos)", thika: "var(--d-branch-thika)" };
  return (
    <section className="dash-section" style={{ display: "flex", flexDirection: "column", maxHeight: 560 }}>
      <div className="dash-section-head" style={{ flexWrap: "wrap" }}>
        <div className="dash-brand" style={{ gap: 10 }}>
          <span className="dash-ico" style={{ width: 32, height: 32, backgroundColor: "rgba(5,150,105,.14)", color: "#059669" }}>
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <h2>Recent Activity</h2>
            <span className="sub">All branches · operations stream</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--d-border)" }}>
          {["6h", "12h"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              style={{
                padding: "4px 12px", border: "none", cursor: "pointer", fontFamily: "inherit",
                background: timeFilter === tf ? "var(--d-primary)" : "var(--d-card)",
                color: timeFilter === tf ? "var(--d-primary-fg)" : "var(--d-card-fg)",
                fontSize: 11, fontWeight: timeFilter === tf ? 600 : 400,
              }}
            >
              Last {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        <ul className="dash-list" style={{ padding: 4 }}>
          {filtered.map((a, i) => {
            const Icon = ICONS[a.type] || Clock;
            const color = TYPE_COLOR[a.type] || "#b45309";
            const bg = `color-mix(in srgb, ${color} 14%, transparent)`;
            return (
              <li key={`${a.title}-${a.time}-${i}`} className="dash-rowitem">
                <span className="dash-ico" style={{ backgroundColor: bg, color }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="dash-rowbody">
                  <div className="dash-rowtitle" style={{ gap: 6 }}>
                    <p>{a.title}</p>
                    <span className="dash-branch-pill" style={{ color: brColor[a.branch] || "var(--d-muted-fg)" }}>
                      <span className="dash-dot" style={{ background: brColor[a.branch] || "var(--d-muted-fg)" }} />
                      {branchName[a.branch] || a.branch}
                    </span>
                  </div>
                  <p className="dash-rowsub">{a.detail}</p>
                </div>
                <span style={{ fontSize: 11, color: "var(--d-muted-fg)", minWidth: 64, textAlign: "right", flexShrink: 0 }}>
                  {timeStr(a.time)}
                </span>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <div className="dash-empty">
              <p>No activity in this window.</p>
            </div>
          )}
        </ul>
      </div>
    </section>
  );
}