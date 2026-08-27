import { matchesDay, safeName } from "../utils";
import { WEEKDAYS } from "../config";
import {
  format, startOfMonth, endOfMonth, startOfWeek,
  endOfWeek, eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
const T = {
  bg: "#F4F6F8",
  surface: "#FFFFFF",
  border: "rgba(15,23,42,0.08)",
  borderSubtle: "rgba(15,23,42,0.04)",
  text: "#0F172A",
  textSec: "#64748B",
  textMuted: "#475569",
  font: "'DM Sans','Inter',system-ui,sans-serif",
};

/* ── Deceased 4-quadrant view ────────────────────────────────── */
function DeceasedView({ currentDate, bookings, mod, onSelect, onShowDay }) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const SM = mod.statusMap;
  const today = format(new Date(), "yyyy-MM-dd");

  const intake = bookings.filter(b => ["admitted", "admitting", "pending"].includes(b.status));
  const release = bookings.filter(b => ["released", "completed", "dispatched"].includes(b.status));
  const postmortem = bookings.filter(b => ["transferred", "ready"].includes(b.status));

  /* ── Flower-style card tints (mirror of FlowerBookingsNew STATUS_CARD_STYLES) ──
     Every status tier gets its own glanceable tint. Released-tier records reuse
     the EXACT soft-red (#FFCCD5) that flower COMPLETED/CANCELLED orders use. */
  const DECEASED_CARD_TINTS = {
    pending:     { bg: "#EFF1F3", border: "#E3E0D9" },
    admitted:    { bg: "#EFF1F3", border: "#E3E0D9" },
    admitting:   { bg: "#FDF4E3", border: "#F0DDB0" },
    ready:       { bg: "#FDF4E3", border: "#F0DDB0" },
    transferred: { bg: "#FDF4E3", border: "#F0DDB0" },
    released:    { bg: "#FFCCD5", border: "#F0CDCB" },
    dispatched:  { bg: "#FFCCD5", border: "#F0CDCB" },
    buried:      { bg: "#FFCCD5", border: "#F0CDCB" },
    completed:   { bg: "#FFCCD5", border: "#F0CDCB" },
  };

  const fmtAdmDate = (bk) => {
    const raw = bk.date_admitted || bk.adm_date || bk.date_key || bk.created_at;
    if (!raw) return "";
    const d = new Date(raw);
    return isNaN(d.getTime()) ? "" : format(d, "MMM d, yyyy");
  };

  const initialsOf = (bk) =>
    String(safeName(bk, mod)).trim().split(/\s+/).slice(0, 2)
      .map(w => w.charAt(0).toUpperCase()).join("") || "?";


  const renderList = (title, items, dotColor, icon) => (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)",
      border: `1px solid ${T.border}`,
      borderRadius: 18, overflow: "hidden",
      boxShadow: "0 8px 32px rgba(15,23,42,0.07)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${T.border}`,
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</span>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 99,
          background: `${dotColor}18`, border: `1px solid ${dotColor}30`,
          fontSize: 11, fontWeight: 700, color: dotColor,
          fontFamily: "monospace",
        }}>{items.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 320px)", minHeight: 160, padding: "12px 14px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: T.textMuted, fontSize: 12, padding: "24px 0" }}>
            No {title.toLowerCase()} records
          </div>
        ) : items.map(bk => {
          const stCfg = SM[bk.status];
          const stColor = stCfg?.color || dotColor;
          const tint = DECEASED_CARD_TINTS[bk.status]
            || { bg: "#FFFFFF", border: "#EAE7E2" };
          const admDate = fmtAdmDate(bk);
          return (
            <div key={bk[mod.idField] || bk.id}
              onClick={() => onSelect(bk)}
              style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "11px 13px", marginBottom: 10,
                borderRadius: 20, cursor: "pointer",
                background: tint.bg,
                border: `1px solid ${tint.border}`,
                boxShadow: "0 1px 3px rgba(28,26,23,0.04)",
                transition: "all .25s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(28,26,23,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(28,26,23,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* Initials thumb — mirrors the flower card's media thumbnail */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "#1C1A17",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, fontWeight: 700, color: "#B08D57",
                }}>
                  {initialsOf(bk)}
                </span>
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 15, fontWeight: 600, color: "#1C1A17",
                  marginBottom: 3,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {safeName(bk, mod)}
                </div>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "2px 12px",
                  fontSize: 11, fontWeight: 600, color: "#574F47",
                }}>
                  <span>{bk[mod.idField] ? `№ ${bk[mod.idField]}` : "No ID"}</span>
                  {admDate && <span>Admitted {admDate}</span>}
                </div>
              </div>

              {/* Status pill */}
              <span style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 99,
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: `${stColor}18`,
                border: `1px solid ${stColor}30`,
                color: stColor,
              }}>
                {stCfg?.label || bk.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 16,
      alignItems: "start",
    }}>
      {/* Mini calendar */}
      <div style={{
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)",
        border: `1px solid ${T.border}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 8px 32px rgba(15,23,42,0.07)",
      }}>
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
          background: "rgba(255,255,255,0.02)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
            {format(currentDate, "MMMM yyyy")} Overview
          </span>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            marginBottom: 8,
          }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{
                textAlign: "center", fontSize: 9, fontWeight: 700,
                color: T.textMuted, textTransform: "uppercase",
                padding: "4px 0",
              }}>{d[0]}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {days.map((day, i) => {
              const ds = format(day, "yyyy-MM-dd");
              const hasEvents = bookings.some(b => matchesDay(b, mod, ds));
              const tod = isToday(day);
              return (
                <div key={i} onClick={() => onShowDay(day)}
                  style={{
                    aspectRatio: "1", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 500,
                    transition: "all 0.12s ease",
                    opacity: isSameMonth(day, currentDate) ? 1 : 0.25,
                    background: tod ? mod.accent
                      : hasEvents ? `${mod.accent}18`
                        : "transparent",
                    color: tod ? "#fff"
                      : hasEvents ? mod.accent
                        : T.textSec,
                    border: hasEvents && !tod ? `1px solid ${mod.accent}28` : "1px solid transparent",
                    boxShadow: tod ? `0 0 12px ${mod.accent}50` : "none",
                  }}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
          {/* Today's schedule */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, marginBottom: 8 }}>
              Today
            </div>
            {bookings.filter(b => matchesDay(b, mod, today)).slice(0, 4).map(bk => (
              <div key={bk[mod.idField] || bk.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 0", borderBottom: `1px solid ${T.borderSubtle}`,
              }}>
                <span style={{ fontSize: 12, color: "#334155", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {safeName(bk, mod)}
                </span>
                <span style={{
                  fontSize: 9, padding: "2px 6px", borderRadius: 99, fontWeight: 600,
                  background: `${mod.statusMap[bk.status]?.color}18`,
                  color: mod.statusMap[bk.status]?.color || T.textSec,
                }}>
                  {mod.statusMap[bk.status]?.label || bk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renderList("Deceased Intake", intake, "#f97316", "⬇")}
      {renderList("Deceased Release", release, "#22c55e", "⬆")}
      {renderList("Postmortem Requests", postmortem, "#ef4444", "🔬")}
    </div>
  );
}

/* ── Standard Month Calendar ─────────────────────────────────── */
export default function MonthView({ currentDate, bookings, mod, onSelect, onShowDay }) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const SM = mod.statusMap;

  if (mod.id === "deceased") {
    return <DeceasedView currentDate={currentDate} bookings={bookings} mod={mod}
      onSelect={onSelect} onShowDay={onShowDay} />;
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)",
      border: `1px solid ${T.border}`,
      borderRadius: 18, overflow: "hidden",
      boxShadow: "0 8px 32px rgba(15,23,42,0.07)",
      height: "100%", minHeight: 520,
    }}>
      {/* Weekday header */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: `1px solid ${T.border}`,
        background: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            padding: "10px 0",
            textAlign: "center", fontSize: 9, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.12em",
            color: T.textMuted,
          }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1 }}>
        {days.map((day, i) => {
          const ds = format(day, "yyyy-MM-dd");
          const db = bookings.filter(b => matchesDay(b, mod, ds));
          const inMonth = isSameMonth(day, currentDate);
          const tod = isToday(day);
          return (
            <div key={i} onClick={() => onShowDay(day)}
              style={{
                borderRight: `1px solid ${T.borderSubtle}`,
                borderBottom: `1px solid ${T.borderSubtle}`,
                padding: "8px 8px 10px",
                cursor: "pointer",
                minHeight: 110,
                opacity: inMonth ? 1 : 0.35,
                background: tod ? `linear-gradient(180deg, ${mod.accent}10, transparent)` : "transparent",
                outline: tod ? `1px solid ${mod.accent}25` : "none",
                outlineOffset: "-1px",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={e => {
                if (!tod) e.currentTarget.style.background = "rgba(255,255,255,0.025)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = tod ? `linear-gradient(180deg, ${mod.accent}10, transparent)` : "transparent";
              }}
            >
              {/* Day number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  ...(tod ? {
                    background: mod.accent,
                    color: "#fff",
                    boxShadow: `0 0 12px ${mod.accent}60`,
                  } : { color: T.textSec }),
                }}>
                  {format(day, "d")}
                </div>
                {db.length > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 99, padding: "0 5px",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800,
                    color: mod.accent, background: `${mod.accent}18`,
                    border: `1px solid ${mod.accent}28`,
                  }}>{db.length}</span>
                )}
              </div>

              {/* Event chips */}
              {db.slice(0, 4).map(bk => {
                const cfg = SM[bk.status] || { color: "#64748B" };
                return (
                  <button key={bk[mod.idField] || bk.id}
                    className="rp-event-chip"
                    onClick={e => { e.stopPropagation(); onSelect(bk); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      width: "100%", textAlign: "left",
                      padding: "3px 6px", borderRadius: 6,
                      marginBottom: 2, cursor: "pointer",
                      background: `${cfg.color}14`,
                      border: `1px solid ${cfg.color}22`,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: cfg.color }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: cfg.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {safeName(bk, mod).split(" ").slice(0, 2).join(" ")}
                    </span>
                  </button>
                );
              })}
              {db.length > 4 && (
                <button onClick={e => { e.stopPropagation(); onShowDay(day); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 9, fontWeight: 700, color: T.textMuted, padding: "2px 6px",
                  }}>
                  +{db.length - 4} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}