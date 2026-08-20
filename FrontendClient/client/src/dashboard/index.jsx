/**
 * RestPoint â€” Unified Operations Dashboard
 * Design reference: hersebokings/src/app/App.tsx
 * Tabs: Hearse Â· Coffin Â· Flower Bookings Â· Deceased
 */

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, eachDayOfInterval,
  isToday, addWeeks, subWeeks,
} from "date-fns";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { BG0, BG1, BG2, BG3, BDR, BDR2, TEXT1, TEXT2, TEXT3, TEXT4, CARD_GRAD, CARD_SHADOW, PANEL_SHADOW, ACCENT, ACCENT_SOFT, FOCUS, TODAY_FILL } from "./theme.js";

//  Icons (inline SVG)
const Ico = ({ size = 16, stroke = "currentColor", sw = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IcoTruck      = p => <Ico {...p}><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>;
const IcoBox        = p => <Ico {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>;
const IcoFlower     = p => <Ico {...p}><path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/><circle cx="12" cy="8" r="2"/><path d="M12 10v12"/></Ico>;
const IcoUser       = p => <Ico {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>;
const IcoCheck      = p => <Ico {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoChevL      = p => <Ico {...p}><polyline points="15 18 9 12 15 6"/></Ico>;
const IcoChevR      = p => <Ico {...p}><polyline points="9 18 15 12 9 6"/></Ico>;
const IcoX          = p => <Ico {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const IcoCalendar   = p => <Ico {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>;
const IcoColumns    = p => <Ico {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="10" y1="3" x2="10" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/></Ico>;
const IcoCharts     = p => <Ico {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ico>;

//  Design tokens imported from ./theme.js (single source of theme)

// â”€â”€â”€ Module config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MODULES = [
  {
    id: "hearse",
    label: "Hearse Bookings",
    icon: IcoTruck,
    accent: "#818cf8",
    apiEndpoint: "/hearse-bookings",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      confirmed: { label: "Confirmed", color: "#8b5cf6" },
      booked: { label: "Booked", color: "#3b82f6" },
      scheduled: { label: "Scheduled", color: "#8b5cf6" },
      in_transit: { label: "In Transit", color: "#f59e0b" },
      in_progress: { label: "In Progress", color: "#f59e0b" },
      postponed: { label: "Postponed", color: "#f59e0b" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.booking_dates || b?.booking_date || b?.created_at,
    clientField: "client_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending", label: "Pending", Icon: IcoCalendar },
      { key: "in_transit", label: "In Transit", Icon: IcoTruck },
      { key: "completed", label: "Completed", Icon: IcoCheck },
      { key: "cancelled", label: "Cancelled", Icon: IcoX },
    ],
  },
  {
    id: "coffin",
    label: "Coffin Bookings",
    icon: IcoBox,
    accent: "#fb923c",
    apiEndpoint: "/coffins/orders",
    statusMap: {
      active: { label: "Active", color: "#3b82f6" },
      pending: { label: "Pending", color: "#3b82f6" },
      reserved: { label: "Reserved", color: "#8b5cf6" },
      booked: { label: "Booked", color: "#8b5cf6" },
      ready: { label: "Ready", color: "#f59e0b" },
      delivered: { label: "Delivered", color: "#22c55e" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.service_date || b?.booking_date || b?.created_at,
    clientField: "deceased_name",
    idField: "order_id",
    kpiFields: [
      { key: "active", label: "Active", Icon: IcoBox },
      { key: "booked", label: "Booked", Icon: IcoCalendar },
      { key: "completed", label: "Completed", Icon: IcoCheck },
      { key: "cancelled", label: "Cancelled", Icon: IcoX },
    ],
  },
  {
    id: "flower",
    label: "Flower Bookings",
    icon: IcoFlower,
    accent: "#34d399",
    apiEndpoint: "/florist/bookings",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      confirmed: { label: "Confirmed", color: "#8b5cf6" },
      preparing: { label: "Preparing", color: "#f59e0b" },
      delivering: { label: "Delivering", color: "#f59e0b" },
      delivered: { label: "Delivered", color: "#22c55e" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.delivery_date || b?.date || b?.created_at,
    clientField: "deceased_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending", label: "Pending", Icon: IcoCalendar },
      { key: "delivering", label: "Delivering", Icon: IcoTruck },
      { key: "delivered", label: "Delivered", Icon: IcoCheck },
      { key: "cancelled", label: "Cancelled", Icon: IcoX },
    ],
  },
  {
    id: "deceased",
    label: "Deceased Register",
    icon: IcoUser,
    accent: "#f472b6",
    apiEndpoint: "/deceased/deceased-all",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      admitted: { label: "Admitted", color: "#3b82f6" },
      embalming: { label: "Embalming", color: "#8b5cf6" },
      ready: { label: "Ready", color: "#f59e0b" },
      released: { label: "Released", color: "#22c55e" },
      buried: { label: "Buried", color: "#64748b" },
      dispatched: { label: "Dispatched", color: "#64748b" },
      completed: { label: "Completed", color: "#22c55e" },
      transferred: { label: "Transferred", color: "#64748b" },
    },
    dateField: (b) => b?.date_admitted || b?.adm_date || b?.created_at,
    clientField: "full_name",
    idField: "admission_number",
    kpiFields: [
      { key: "admitted", label: "Admitted", Icon: IcoUser },
      { key: "released", label: "Released", Icon: IcoCheck },
      { key: "buried", label: "Buried", Icon: IcoTruck },
    ],
  },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const DAY_START = 6;
const DAY_TOTAL = 16;
const HOUR_PX = 80;

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Format a date-ish value to 'yyyy-MM-dd'. Backend dates are Kenya-local naive
// strings ('YYYY-MM-DD' / 'YYYY-MM-DD HH:mm:ss'); we only ever slice the string prefix,
// and for real Date objects we use LOCAL components (never UTC, which would shift the calendar day).
const normDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "string") return val.slice(0, 10);
  return null;
};

const datesOf = (booking, mod) => {
  if (!booking) return [];
  const f = mod.dateField;
  const raw = typeof f === "function" ? f(booking) : booking?.[f];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normDate).filter(Boolean);
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normDate).filter(Boolean);
      const single = normDate(parsed);
      return single ? [single] : [];
    } catch { /* fall through */ }
  }
  const single = normDate(raw);
  return single ? [single] : [];
};

const matchesDay = (booking, mod, dayStr) => datesOf(booking, mod).some((d) => d === dayStr);

const extractArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.bookings)) return d.bookings;
  if (Array.isArray(d?.orders)) return d.orders;
  if (Array.isArray(d?.hearses)) return d.hearses;
  return [];
};

const safeName = (booking, mod) => {
  return booking[mod.clientField] || booking.client_name || booking.name || booking.id || "—";
};

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status, mod }) {
  const cfg = mod.statusMap[status] || { label: status, color: TEXT3 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      backgroundColor: `${cfg.color}1a`, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// MonthView 
function MonthView({ currentDate, bookings, mod, onSelect, onShowDay }) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const SM = mod.statusMap;

  return (
    <div style={{
      borderRadius: 18, border: `1px solid ${BDR}`, background: CARD_GRAD,
      height: "auto", minHeight: "100%", width: "100%",
      display: "flex", flexDirection: "column",
      overflow: "visible",
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${BDR}`, position: "sticky", top: 0, background: "rgba(15,23,42,0.92)", backdropFilter: "blur(10px)", zIndex: 5 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ padding: "10px 0 8px", textAlign: "center", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT4 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(118px, auto)" }}>
        {days.map((day, i) => {
          const ds = format(day, "yyyy-MM-dd");
          const db = bookings.filter(b => matchesDay(b, mod, ds));
          const inMonth = isSameMonth(day, currentDate);
          const tod = isToday(day);
          return (
            <div key={i} className="rp-day-cell"
              onClick={() => onShowDay(day)}
              title={`View all events for ${format(day, "EEE d MMM yyyy")}`}
              style={{
                borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`,
                padding: "7px 7px 8px", overflow: "hidden", cursor: "pointer", minHeight: 118,
                opacity: inMonth ? 1 : 0.35,
                background: tod ? `linear-gradient(180deg, ${TODAY_FILL}, ${BG2})` : BG2,
                transition: "all 0.15s ease",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...(tod ? { backgroundColor: mod.accent, color: "#fff", boxShadow: `0 8px 18px ${mod.accent}55` } : { color: TEXT3 }),
                }}>
                  {format(day, "d")}
                </div>
                {db.length > 0 && (
                  <span style={{
                    minWidth: 19, height: 19, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0 6px", fontSize: 10, fontWeight: 800, color: mod.accent, backgroundColor: `${mod.accent}12`, border: `1px solid ${mod.accent}22`
                  }}>{db.length}</span>
                )}
              </div>
              {db.slice(0, 5).map(bk => {
                const cfg = SM[bk.status] || { color: TEXT3 };
                return (
                  <button key={bk[mod.idField] || bk.id || i}
                    className="rp-event-chip"
                    onClick={(e) => { e.stopPropagation(); onSelect(bk); }}
                    title={`${safeName(bk, mod)} · ${cfg.label || bk.status}`}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "3px 6px 3px 7px", borderRadius: 8, fontSize: 10, marginBottom: 3,
                      background: `linear-gradient(135deg, ${cfg.color}16, ${cfg.color}08)`, color: cfg.color,
                      border: `1px solid ${cfg.color}2d`, cursor: "pointer",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}>
                    {safeName(bk, mod).split(" ")[0]}
                  </button>
                );
              })}
              {db.length > 5 ? (
                <button className="rp-event-chip" onClick={(e) => { e.stopPropagation(); onShowDay(day); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "2px 6px", borderRadius: 6, fontSize: 9, marginTop: 2, border: "none", background: "transparent", color: TEXT4, fontWeight: 700, cursor: "pointer" }}>
                  +{db.length - 5} more · see all
                </button>
              ) : db.length > 0 ? (
                <button onClick={(e) => { e.stopPropagation(); onShowDay(day); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "2px 6px", borderRadius: 6, fontSize: 9, marginTop: 2, border: "none", background: "transparent", color: mod.accent, fontWeight: 700, cursor: "pointer" }}>
                  View {db.length}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// WeekView 
function WeekView({ currentDate, bookings, mod, onSelect, onShowDay }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const SM = mod.statusMap;

  const hourOf = (bk) => {
    let h = bk.start_hour ?? bk.pickup_hour;
    if (typeof h === "string") {
      const n = parseInt(h, 10);
      if (!Number.isNaN(n)) return n;
    } else if (typeof h === "number") {
      return h;
    }
    return 8;
  };

  return (
    <div style={{
      borderRadius: 18, border: `1px solid ${BDR}`, background: CARD_GRAD,
      height: "auto", minHeight: "100%", minWidth: 900, width: "100%",
      display: "flex", flexDirection: "column", overflow: "visible",
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: `1px solid ${BDR}`, flexShrink: 0, background: "rgba(15,23,42,0.92)" }}>
        <div style={{ borderRight: `1px solid ${BDR2}` }} />
        {days.map((day, i) => {
          const tod = isToday(day);
          return (
            <button key={i} onClick={() => onShowDay(day)} title={`View all events for ${format(day, "EEE d MMM")}`}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "10px 0 8px", textAlign: "center", borderRight: `1px solid ${BDR2}`, backgroundColor: tod ? "rgba(79,70,229,0.06)" : undefined }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3 }}>{format(day, "EEE")}</div>
              <div style={{
                fontSize: 17, fontWeight: 700, margin: "4px auto 0", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%",
                ...(tod ? { backgroundColor: mod.accent, color: "#fff", boxShadow: `0 8px 18px ${mod.accent}55` } : { color: TEXT2 }),
              }}>{format(day, "d")}</div>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", minWidth: 900 }}>
          {WEEK_HOURS.map(hour => (
            <Fragment key={hour}>
              <div style={{ borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`, padding: "10px 8px 10px 0", textAlign: "right", background: "rgba(15,23,42,0.55)" }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: TEXT4 }}>{String(hour).padStart(2, "0")}:00</span>
              </div>
              {days.map((day, di) => {
                const ds = format(day, "yyyy-MM-dd");
                const tod = isToday(day);
                const hourBks = bookings.filter(b => matchesDay(b, mod, ds) && hourOf(b) === hour);
                return (
                  <div key={di} onClick={() => onShowDay(day)} title={`All events for ${format(day, "EEE d MMM")}`}
                    style={{
                      borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`,
                      padding: 4, minHeight: 64, cursor: "pointer",
                      backgroundColor: tod ? "rgba(129,140,248,0.08)" : "#10192a",
                    }}>
                    {hourBks.map(bk => {
                      const cfg = SM[bk.status] || { color: TEXT3 };
                      return (
                        <button key={bk[mod.idField] || bk.id} className="rp-event-chip"
                          onClick={(e) => { e.stopPropagation(); onSelect(bk); }}
                          style={{
                            display: "block", width: "100%", textAlign: "left", padding: "6px 7px", borderRadius: 7,
                            fontSize: 10, marginBottom: 2, cursor: "pointer",
                            background: `linear-gradient(135deg, ${cfg.color}18, ${cfg.color}09)`, border: `1px solid ${cfg.color}30`,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          }}>
                          <div style={{ fontWeight: 700, color: cfg.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {safeName(bk, mod).split(" ")[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// DayView (Gantt)
function DayView({ currentDate, bookings, mod, onSelect }) {
  const ds = format(currentDate, "yyyy-MM-dd");
  const dayBks = bookings.filter(b => matchesDay(b, mod, ds));
  const SM = mod.statusMap;
  const timelineW = DAY_TOTAL * HOUR_PX;

  // Group by some category (branch for hearse, type for others)
  const groups = {};
  dayBks.forEach(bk => {
    const key = bk.branch || bk.coffin_type || bk.arrangement_type || bk.branch_name || "General";
    if (!groups[key]) groups[key] = [];
    groups[key].push(bk);
  });
  const allGroups = Object.entries(groups);
  if (allGroups.length === 0) allGroups.push(["â€”", []]);

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${BDR}`, backgroundColor: BG2, height: "100%", minHeight: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Sticky header */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: `1px solid ${BDR}`, position: "sticky", top: 0, zIndex: 10, backgroundColor: BG2 }}>
        <div style={{ width: 144, flexShrink: 0, borderRight: `1px solid ${BDR2}`, padding: 12, display: "flex", alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT4 }}>
            {mod.label} Â· {format(currentDate, "d MMM")}
          </span>
        </div>
        <div style={{ width: timelineW, position: "relative", height: 44 }}>
          {Array.from({ length: DAY_TOTAL + 1 }, (_, i) => i + DAY_START).map(h => (
            <div key={h} style={{ position: "absolute", left: (h - DAY_START) * HOUR_PX, top: 0, bottom: 0, display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, backgroundColor: BDR2 }} />
              <span style={{ fontSize: 10, fontFamily: "monospace", paddingLeft: 6, color: TEXT4 }}>{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
      </div>
      {/* Groups */}
      {allGroups.map(([grpName, grpBks]) => (
        <div key={grpName} style={{ display: "flex", borderBottom: `1px solid ${BDR2}`, minHeight: 96 }}>
          <div style={{ width: 144, flexShrink: 0, borderRight: `1px solid ${BDR2}`, padding: 12, position: "sticky", left: 0, backgroundColor: BG2, zIndex: 5 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: mod.accent }}>{grpName}</div>
            <div style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>{grpBks.length} booking{grpBks.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ width: timelineW, position: "relative", minHeight: 96 }}>
            {Array.from({ length: DAY_TOTAL }, (_, i) => (
              <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: (i + 1) * HOUR_PX, width: 1, backgroundColor: "rgba(148,163,184,0.04)" }} />
            ))}
            {grpBks.map((bk, bi) => {
              const cfg = SM[bk.status] || { color: TEXT3, label: bk.status };
              const startH = bk.start_hour || bk.pickup_hour || 8;
              const dur = bk.duration || bk.duration_hours || 2;
              const left = (startH - DAY_START) * HOUR_PX + 2;
              const width = Math.max(dur * HOUR_PX - 4, 40);
              return (
                <button key={bk[mod.idField] || bi} onClick={() => onSelect(bk)}
                  style={{
                    position: "absolute", top: 8, height: "calc(100% - 16px)",
                    left, width, borderRadius: 8, padding: "4px 8px",
                    backgroundColor: `${cfg.color}1a`, border: `1px solid ${cfg.color}40`,
                    cursor: "pointer", textAlign: "left", overflow: "hidden",
                  }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: cfg.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.label}</div>
                  <div style={{ fontSize: 10, color: TEXT2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{safeName(bk, mod).split(" ")[0]}</div>
                </button>
              );
            })}
            {grpBks.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px" }}>
                <span style={{ fontSize: 11, color: TEXT3 }}>Free today</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Detail
function DetailPanel({ booking, mod, onClose }) {
  const SM = mod.statusMap;
  const cfg = SM[booking.status] || { label: booking.status, color: TEXT3 };
  const fields = Object.entries(booking).filter(([k]) => !["id", mod.idField].includes(k) && typeof booking[k] !== "object");

  return (
    <div style={{
      position: "fixed", inset: "0 0 0 auto", zIndex: 200,
      width: 380, display: "flex", flexDirection: "column",
      backgroundColor: "#0f172a", borderLeft: `1px solid ${BDR}`,
      boxShadow: "-18px 0 50px rgba(0, 0, 0, 0.5)",
    }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: TEXT4, marginBottom: 4 }}>
            {booking[mod.idField] || booking.id}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT1, marginBottom: 8 }}>
            {safeName(booking, mod)}
          </div>
          <StatusPill status={booking.status} mod={mod} />
        </div>
        <button onClick={onClose} style={{
          padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3,
        }}>
          <IcoX size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Icon card */}
        <div style={{ backgroundColor: BG3, borderRadius: 12, padding: 16, border: `1px solid ${BDR2}`, display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${mod.accent}18` }}>
            <mod.icon size={18} stroke={mod.accent} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT2 }}>{mod.label}</div>
            <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{booking.branch || booking.branch_name || "â€”"}</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, backgroundColor: BG3, borderRadius: 12, padding: 16, border: `1px solid ${BDR2}` }}>
          {fields.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                {k.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2 }}>{String(v || "â€”")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Day events panel ─────────────────────────────────────────────────────────
// Opened when the user clicks a calendar day — lists ALL events of that day,
// each one opens the full DetailPanel on click.
function DayEventsPanel({ date, bookings, mod, onSelect, onClose }) {
  const ds = format(date, "yyyy-MM-dd");
  const SM = mod.statusMap;
  const dayBks = bookings
    .filter(b => matchesDay(b, mod, ds))
    .sort((a, b) => {
      const ha = a.start_hour || a.pickup_hour || 0;
      const hb = b.start_hour || b.pickup_hour || 0;
      if (ha !== hb) return (ha - hb) || 0;
      return String(safeName(a, mod)).localeCompare(String(safeName(b, mod)));
    });

  return (
    <div style={{
      position: "fixed", inset: "0 0 0 auto", zIndex: 190,
      width: 420, maxWidth: "100vw", display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)", borderLeft: `1px solid rgba(148,163,184,0.18)`,
      boxShadow: "-18px 0 50px rgba(15,23,42,0.25)",
    }}>
      {/* Header */}
      <div style={{ padding: 20, borderBottom: `1px solid rgba(148,163,184,0.14)`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", marginBottom: 4 }}>
            {ds} · {mod.label}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>
            {format(date, "EEEE, d MMMM yyyy")}
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700, fontFamily: "monospace" }}>
            {dayBks.length} event{dayBks.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={onClose} style={{ padding: 8, borderRadius: 8, border: "none", background: "rgba(148,163,184,0.08)", cursor: "pointer", color: "#cbd5e1" }} aria-label="Close day events">
          <IcoX size={16} />
        </button>
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, background: "rgba(15,23,42,0.28)" }}>
        {dayBks.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No events on this day
          </div>
        ) : (
          dayBks.map((bk) => {
            const cfg = SM[bk.status] || { label: bk.status, color: TEXT3 };
            const sub = bk.branch || bk.branch_name || bk.coffin_type || bk.arrangement_type;
            return (
              <button key={bk[mod.idField] || bk.id} className="rp-event-chip" onClick={() => onSelect(bk)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 14px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  background: `linear-gradient(135deg, ${cfg.color}1f, rgba(15,23,42,0.22))`, border: `1px solid ${cfg.color}4d`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: cfg.color, flexShrink: 0, boxShadow: `0 0 12px ${cfg.color}` }} />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#f8fafc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {safeName(bk, mod)}
                  </span>
                  <StatusPill status={bk.status} mod={mod} />
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1", fontFamily: "monospace" }}>
                  {bk[mod.idField] || bk.id}
                </div>
                {sub && <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>{sub}</div>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

//  Module Dashboard 
function ModuleDashboard({ mod }) {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeStatuses, setActiveStatuses] = useState(() => Object.keys(mod.statusMap));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dayEvents, setDayEvents] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const SM = mod.statusMap;

  const load = useCallback(async () => {
    try {
      const first = await api.get(mod.apiEndpoint, { params: { limit: 100 } });
      let items = extractArray(first);
      const totalPages = first?.data?.pagination?.totalPages;
      if (totalPages && totalPages > 1) {
        for (let p = 2; p <= totalPages; p++) {
          const r = await api.get(mod.apiEndpoint, { params: { limit: 100, page: p } });
          items = items.concat(extractArray(r));
        }
      }
      setBookings(items);
    } catch (e) {
      console.warn("[Dashboard] " + mod.label + " load failed:", e?.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [mod.apiEndpoint, mod.label]);

  useEffect(() => { load(); }, [load]);

  const allOn = activeStatuses.length === Object.keys(SM).length;
  const filtered = useMemo(
    () => bookings.filter((b) => allOn || activeStatuses.includes(b.status)),
    [bookings, activeStatuses, allOn, SM]
  );

  const navigate = (dir) => {
    if (view === "month") setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === "week") setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => addDays(d, dir));
  };

  const calTitle = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d MMM")} â€“ ${format(we, "d MMM yyyy")}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy");
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBks = filtered.filter(b => matchesDay(b, mod, todayStr));

  const stats = useMemo(() => {
    const s = {};
    Object.keys(SM).forEach(k => { s[k] = filtered.filter(b => b.status === k).length; });
    s.total = filtered.length;
    return s;
  }, [filtered, SM]);

  const pieData = Object.entries(SM)
    .map(([k, v]) => ({ name: v.label, value: stats[k] || 0, color: v.color }))
    .filter(d => d.value > 0);

  const toggleStatus = (st) =>
    setActiveStatuses(p => p.includes(st) ? p.filter(x => x !== st) : [...p, st]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: TEXT3 }}>
        <div style={{ textAlign: "center" }}>
          <mod.icon size={32} stroke={mod.accent} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Loading {mod.label}â€¦</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Sidebar (view + filters) */}
      {sidebarOpen && (
      <aside style={{ width: 200, flexShrink: 0, backgroundColor: "#0f172a", borderRight: `1px solid rgba(255,255,255,0.08)`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* View switcher */}
        <div style={{ padding: 12, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>View</div>
          {["month", "week", "day"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8,
                fontSize: 13, marginBottom: 4, border: "1px solid transparent", cursor: "pointer",
                ...(view === v ? {
                  backgroundColor: `${mod.accent}2e`, color: mod.accent, border: `1px solid ${mod.accent}55`,
                } : { color: "#cbd5e1", background: "transparent" }),
              }}>
              {v.charAt(0).toUpperCase() + v.slice(1)} View
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ padding: 12, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>Filter</div>
          {Object.entries(SM).map(([k, v]) => (
            <button key={k} onClick={() => toggleStatus(k)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "6px 12px", borderRadius: 8, fontSize: 11, marginBottom: 2, border: "none", cursor: "pointer",
                background: "transparent", color: activeStatuses.includes(k) ? "#e2e8f0" : "#cbd5e1",
              }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: activeStatuses.includes(k) ? v.color : "#cbd5e1" }} />
              {v.label}
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: activeStatuses.includes(k) ? v.color : "#cbd5e1" }}>
                {stats[k] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Today summary */}
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>
            Today · {format(new Date(), "d MMM")}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: mod.accent, fontFamily: "monospace" }}>{todayBks.length}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>bookings today</div>
          {Object.entries(SM).map(([k, v]) => {
            const cnt = todayBks.filter(b => b.status === k).length;
            if (!cnt) return null;
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: v.color }} />
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>{v.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: v.color }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Calendar toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${BDR}`, background: "rgba(11,18,32,0.9)", flexShrink: 0, boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.4)" }}>
          <button onClick={() => setCurrentDate(new Date())}
            style={{ padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: BG3, color: TEXT2, border: "1px solid rgba(148,163,184,0.18)", cursor: "pointer", boxShadow: "0 8px 18px rgba(0,0,0,0.3)" }}>
            Today
          </button>
          <div style={{ display: "flex", alignItems: "center", background: BG3, borderRadius: 10, border: `1px solid ${BDR2}`, overflow: "hidden" }}>
            <button onClick={() => navigate(-1)} style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3 }}><IcoChevL size={16} /></button>
            <button onClick={() => navigate(1)}  style={{ padding: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3 }}><IcoChevR size={16} /></button>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT1, margin: 0 }}>{calTitle()}</h2>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, fontFamily: "monospace", color: TEXT4, background: BG3, border: `1px solid ${BDR2}`, borderRadius: 999, padding: "6px 10px" }}>
            {filtered.length} total · {stats.completed || 0} completed · {stats.cancelled || 0} cancelled
          </div>
          <button className="rp-tool-btn" title={chartsOpen ? "Hide charts" : "Show charts"} onClick={() => setChartsOpen(o => !o)}>
            <IcoCharts size={14} />
          </button>
          <button className="rp-tool-btn" title={sidebarOpen ? "Hide filters panel" : "Show filters panel"} onClick={() => setSidebarOpen(o => !o)}>
            <IcoColumns size={14} />
          </button>
          <button className="rp-tool-btn" title="Refresh data" onClick={load}>
            <IcoCalendar size={14} />
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
          {mod.kpiFields.map(({ key, label, Icon }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: CARD_GRAD, borderRadius: 14, border: `1px solid ${BDR2}`, boxShadow: PANEL_SHADOW }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${SM[key]?.color || mod.accent}1f`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)` }}>
                <Icon size={15} stroke={SM[key]?.color || mod.accent} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: SM[key]?.color || mod.accent, lineHeight: 1, fontFamily: "monospace" }}>{stats[key] || 0}</div>
                <div style={{ fontSize: 11, color: TEXT3, marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, overflow: "auto", padding: "clamp(6px, 1.5vw, 16px)", minWidth: 0, minHeight: 0 }}>
          {filtered.length === 0 ? (
            <div style={{
              border: `1px solid ${BDR}`, borderRadius: 16, backgroundColor: BG1, padding: "26px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: PANEL_SHADOW,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: ACCENT_SOFT,
              }}>
                <mod.icon size={20} stroke={mod.accent} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: TEXT1 }}>Nothing scheduled yet</div>
              <div style={{ fontSize: 12, color: TEXT3, textAlign: "center", maxWidth: 420 }}>
                No {mod.label.toLowerCase()} fall within this period. New bookings will appear on the calendar automatically.
              </div>
            </div>
          ) : (
            <> 
              {view === "month" && <MonthView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} onShowDay={setDayEvents} />}
              {view === "week" && <WeekView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} onShowDay={setDayEvents} />}
              {view === "day" && <DayView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} />}
            </> 
          )}
        </div>

        {/* Charts footer */}
        {chartsOpen && (
        <div style={{ flexShrink: 0, backgroundColor: BG1, borderTop: `1px solid ${BDR}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex" }}>
          <div style={{ flex: 1, padding: "12px 16px", borderRight: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: TEXT1, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><IcoCharts size={13} stroke={mod.accent} /> Bookings by Status</div>
            {pieData.length === 0 ? (
              <div style={{ padding: "44px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT3 }}>No data yet</div>
                <div style={{ fontSize: 10, color: TEXT4, marginTop: 4 }}>New records will visualise here</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={pieData.map(d => ({ name: d.name, count: d.value, color: d.color }))} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: TEXT3, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT3, fontSize: 9 }} axisLine={false} tickLine={false} width={18} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: BG3, border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 10, color: TEXT2 }} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ width: 200, padding: "12px 16px", borderRight: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT4, marginBottom: 6 }}>Status Mix</div>
            {pieData.length === 0 ? (
              <div style={{ padding: "54px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3 }}>No mix to show</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={148}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="54%" innerRadius={34} outerRadius={54} paddingAngle={4} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: BG3, border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 10, color: TEXT2 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ flex: 1, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT4, marginBottom: 12 }}>Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
              {Object.entries(SM).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: v.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: TEXT3 }}>{v.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: v.color }}>{stats[k] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </main>

      {/* Day events panel */}
      {dayEvents && (
        <DayEventsPanel
          date={dayEvents}
          bookings={filtered}
          mod={mod}
          onSelect={setSelected}
          onClose={() => setDayEvents(null)}
        />
      )}

      {/* Detail panel */}
      {selected && <DetailPanel booking={selected} mod={mod} onClose={() => setSelected(null)} />}
    </div>
  );
}
// ─── Standalone app navigation (actual app sections) ─────────────────────────
const DASH_NAV = [
  {
    section: "Operations",
    items: [
      { i: "H", label: "Hearse", path: "hearse" },
      { i: "D", label: "Deceased", path: "deceased" },
      { i: "C", label: "Coffins", path: "coffins" },
      { i: "W", label: "Workshop", path: "workshop" },
      { i: "F", label: "Flower Bookings", path: "flowers" },
      { i: "S", label: "Mini Store", path: "mini-store" },
    ],
  },
  {
    section: "Analytics & Admin",
    items: [
      { i: "Ch", label: "Chemical Analytics", path: "chemicals/analytics" },
      { i: "De", label: "Deceased Analytics", path: "deceased/analytics" },
      { i: "L", label: "Leaves Dashboard", path: "leaves" },
      { i: "A", label: "Apply Leave", path: "leaves/apply" },
      { i: "St", label: "Settings", path: "settings" },
      { i: "Su", label: "Support", path: "support" },
    ],
  },
];


export default function Dashboard({ tenantSlug = "", tenantData }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("deceased");
  const [navOpen, setNavOpen] = useState(false);
  const mod = MODULES.find(m => m.id === activeTab);

  const go = (path) => {
    setNavOpen(false);
    navigate(`/tenant/${tenantSlug}/${path}`);
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ backgroundColor: BG0, color: TEXT1, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Top app bar */}
      <header className="flex shrink-0 items-center gap-1.5 border-b border-white/10 bg-[#0b1220] px-3 h-14 shadow-[0_12px_30px_rgba(0,0,0,0.35)]" style={{ backgroundColor: BG0 }}>
        {/* Menu / nav toggle */}
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          title="Open navigation"
          className="text-slate-300 rounded-lg border border-white/15 p-2 hover:bg-white/5 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/70 to-blue-600/20 border border-indigo-300/40">
            <IcoCalendar size={14} stroke="#c7d2fe" />
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-extrabold tracking-tight text-white">RestPoint</div>
            <div className="text-[10px] text-slate-400">Operations Calendar</div>
          </div>
        </div>

        <div style={{ width: 1, height: 20 }} className="bg-slate-500/20" />

        {/* Module tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border whitespace-nowrap ${
                activeTab === m.id
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <m.icon size={13} stroke={activeTab === m.id ? m.accent : "#94a3b8"} />
              <span>{m.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Live dot */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.75)]" />
          Live
        </div>
      </header>

      {/* Navigation drawer — overlay only, dashboard keeps full width */}
      {navOpen && (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col overflow-y-auto border-r border-white/10 shadow-2xl" style={{ backgroundColor: BG0 }}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/70 to-blue-600/20">
                  <IcoCalendar size={13} stroke="#c7d2fe" />
                </div>
                <span className="text-sm font-extrabold text-white">RestPoint</span>
              </div>
              <button onClick={() => setNavOpen(false)} aria-label="Close navigation" className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18 18 6M6 6 18 18" /></svg>
              </button>
            </div>

            <nav className="flex flex-col gap-0.5 overflow-y-auto p-2">
              {DASH_NAV.map(group => (
                <div key={group.section}>
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.section}</div>
                  {group.items.map(it => (
                    <button
                      key={it.path}
                      onClick={() => go(it.path)}
                      className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-left text-[13px] font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-500/15 text-[11px] font-bold text-indigo-300">{it.i}</span>
                      {it.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.14); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.28); }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid rgba(99,102,241,0.6); outline-offset: 2px; }

        .rp-event-chip {
          transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
        }
        .rp-event-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
          filter: brightness(1.1);
        }
        .rp-day-cell {
          transition: box-shadow .12s ease, background-color .12s ease, transform .12s ease;
        }
        .rp-day-cell:hover {
          box-shadow: inset 0 0 0 2px rgba(129,140,248,0.5);
          transform: translateY(-1px);
        }
        .rp-tool-btn {
          padding: 7px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.66);
          cursor: pointer; color: #94a3b8; box-shadow: 0 6px 14px rgba(0,0,0,0.28);
          transition: background-color .12s ease, color .12s ease, transform .12s ease;
        }
        .rp-tool-btn:hover {
          background-color: rgba(148,163,184,0.1); color: #e2e8f0; transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
