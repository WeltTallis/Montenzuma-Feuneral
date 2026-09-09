import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { MODULES, DASH_NAV } from "./config";
import ModuleDashboard from "./ModuleDashboard";
import DashboardNav from "./DashboardNav";
import ReservationDashboard from "../components/coffins/ReservationDashboard";

/* ─── Design tokens (matches workshop palette) ─────────────────── */
const T = {
  bg: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  border: "rgba(15,23,42,0.08)",
  borderSubtle: "rgba(15,23,42,0.04)",
  text: "#0F172A",
  textSec: "#64748B",
  textMuted: "#475569",
  accent: "#6366f1",
  accentBg: "rgba(99,102,241,0.14)",
  accentBorder: "rgba(99,102,241,0.3)",
  shadow: "0 1px 0 rgba(15,23,42,0.05), 0 8px 32px rgba(15,23,42,0.08)",
  font: "'DM Sans','Inter',system-ui,sans-serif",
};

/* ─── Activity log feed ─────────────────────────────────────────── */
const SAMPLE_ACTIVITY = [
  { id: 1, msg: "New hearse booking received", time: "Just now", dot: "#6366f1" },
  { id: 2, msg: "Booking #RP-318 status → In Transit", time: "3m ago", dot: "#f59e0b" },
  { id: 3, msg: "Deceased intake completed", time: "9m ago", dot: "#34d399" },
  { id: 4, msg: "Coffin order #CF-441 dispatched", time: "18m ago", dot: "#fb923c" },
  { id: 5, msg: "Booking #RP-284 cancelled", time: "30m ago", dot: "#64748b" },
  { id: 6, msg: "New flower booking received", time: "42m ago", dot: "#f472b6" },
];

function ActivityDrawer({ mod, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
        }}
      />
      {/* Panel */}
      <aside style={{
        position: "absolute", insetBlock: 0, right: 0,
        width: 320, maxWidth: "90vw",
        display: "flex", flexDirection: "column",
        background: "#FFFFFF",
        borderLeft: `1px solid ${T.border}`,
        boxShadow: "-20px 0 60px rgba(15,23,42,0.10)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: T.accentBg, border: `1px solid ${T.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>⚡</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Activity Monitor</span>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: T.textSec, fontSize: 18, padding: "4px 6px",
            borderRadius: 6,
          }}>✕</button>
        </div>
        {/* Live indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderBottom: `1px solid ${T.borderSubtle}`,
          background: "rgba(52,211,153,0.04)",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#34d399",
            boxShadow: "0 0 8px rgba(52,211,153,0.7)",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
            Live • Monitoring {mod?.label || "All Modules"}
          </span>
        </div>
        {/* Events */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {SAMPLE_ACTIVITY.map(ev => (
            <div key={ev.id} style={{
              display: "flex", gap: 12,
              padding: "12px 14px", marginBottom: 8,
              borderRadius: 12,
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${T.borderSubtle}`,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: ev.dot, flexShrink: 0, marginTop: 4,
                boxShadow: `0 0 8px ${ev.dot}70`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>{ev.msg}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>🕐 {ev.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.borderSubtle}` }}>
          <button style={{
            width: "100%", padding: "10px",
            borderRadius: 10, border: `1px solid ${T.accentBorder}`,
            background: T.accentBg, color: "#6366f1",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            View Full Activity Log →
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ─── Main Dashboard Shell ─────────────────────────────────────── */
export default function Dashboard({ tenantSlug = "", tenantData }) {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("deceased");
  const [navOpen, setNavOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const mod = MODULES.find((m) => m.id === activeTab);

  const go = (path) => {
    setNavOpen(false);
    navigate(`/tenant/${tenantSlug}/${path}`);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
      background: T.bg,
      color: T.text,
      fontFamily: T.font,
    }}>

      {/* ── Top Navigation (standalone) ─── */}
      <DashboardNav
        tabs={MODULES}
        active={activeTab}
        onSelect={setActiveTab}
        badge={3}
      />

      <div style={{ height: 0 }} />

      {/* ── Module content ─ */}

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Coffin tab: render the standalone ReservationDashboard (self-fetches
            orders/inventory) INSTEAD of the generic ModuleDashboard content. */}
        {mod && (
          activeTab === "coffin"
            ? (
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <ReservationDashboard />
              </div>
            )
            : <ModuleDashboard key={activeTab} mod={mod} />
        )}

      </div>

      {/* ── Navigation Drawer ──────────────────────────────────── */}
      {navOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
          <div
            onClick={() => setNavOpen(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          />
          <aside style={{
            position: "absolute", insetBlock: 0, left: 0,
            width: 280, maxWidth: "85vw",
            display: "flex", flexDirection: "column",
            background: "#050a14",
            borderRight: `1px solid ${T.border}`,
            boxShadow: "20px 0 60px rgba(15,23,42,0.10)",
            overflowY: "auto",
          }}>
            {/* Logo header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 16px",
              borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.65), rgba(59,130,246,0.2))",
                  border: "1px solid rgba(129,140,248,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>RestPoint</div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Operations Suite</div>
                </div>
              </div>
              <button onClick={() => setNavOpen(false)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: T.textSec, fontSize: 18, padding: "4px 6px", borderRadius: 6,
              }}>✕</button>
            </div>

            {/* Module grid */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.borderSubtle}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, marginBottom: 10, paddingLeft: 4 }}>
                Modules
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {MODULES.map(m => {
                  const Icon = m.icon;
                  const active = activeTab === m.id;
                  return (
                    <button key={m.id}
                      onClick={() => { setActiveTab(m.id); setNavOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 12px", borderRadius: 12,
                        border: active ? `1px solid ${m.accent}28` : "1px solid transparent",
                        background: active
                          ? `linear-gradient(135deg, ${m.accent}20 0%, ${m.accent}08 100%)`
                          : "rgba(255,255,255,0.025)",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `${m.accent}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon size={12} color={m.accent} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#fff" : "#64748B" }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: "12px 10px" }}>
              {DASH_NAV.map(group => (
                <div key={group.section} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: T.textMuted, padding: "6px 8px" }}>
                    {group.section}
                  </div>
                  {group.items.map(it => (
                    <button key={it.path} onClick={() => go(it.path)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "8px 10px",
                        borderRadius: 10, border: "none",
                        background: "transparent", cursor: "pointer",
                        color: "#64748B", fontSize: 12, fontWeight: 500,
                        textAlign: "left", transition: "all 0.12s ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(15,23,42,0.05)"; e.currentTarget.style.color = "#0F172A"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: 7,
                        background: "rgba(99,102,241,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#6366f1", flexShrink: 0,
                      }}>{it.i}</span>
                      {it.label}
                      <span style={{ marginLeft: "auto", color: "#334155", fontSize: 12 }}>›</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div style={{ padding: "12px 10px", borderTop: `1px solid ${T.borderSubtle}` }}>
              {[{ i: "⚙", label: "Settings", path: "settings" }, { i: "?", label: "Support", path: "support" }].map(it => (
                <button key={it.path} onClick={() => go(it.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 10px",
                    borderRadius: 10, border: "none",
                    background: "transparent", cursor: "pointer",
                    color: T.textMuted, fontSize: 12, fontWeight: 500, textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(15,23,42,0.04)"; e.currentTarget.style.color = "#64748B"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMuted; }}
                >
                  <span style={{ fontSize: 14 }}>{it.i}</span>
                  {it.label}
                </button>
              ))}
            </div>
          </aside>
        </div>

      )}

      {/* ── Activity Drawer ─── */}
      {activityOpen && (

        <ActivityDrawer mod={mod} onClose={() => setActivityOpen(false)} />

      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.12); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.22); }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid rgba(99,102,241,0.5); outline-offset: 2px; }
        .rp-event-chip { transition: transform .1s ease, opacity .1s ease; }
        .rp-event-chip:hover { transform: translateY(-1px); opacity: 0.85; }
      `}</style>
    </div>
  );
}
