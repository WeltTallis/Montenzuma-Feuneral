/**
 * RestPoint — Unified Operations Dashboard
 * Design reference: hersebokings/src/app/App.tsx
 * Tabs: Hearse · Coffin · Flower Bookings · Deceased
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

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────
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
const IcoAlert      = p => <Ico {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico>;
const IcoCheck      = p => <Ico {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoChevL      = p => <Ico {...p}><polyline points="15 18 9 12 15 6"/></Ico>;
const IcoChevR      = p => <Ico {...p}><polyline points="9 18 15 12 9 6"/></Ico>;
const IcoX          = p => <Ico {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const IcoBell       = p => <Ico {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ico>;
const IcoMapPin     = p => <Ico {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Ico>;
const IcoCalendar   = p => <Ico {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>;
const IcoPlus       = p => <Ico {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG0 = "#0b0f1a";
const BG1 = "#0d1220";
const BG2 = "#111827";
const BG3 = "#161f2e";
const BDR = "rgba(148,163,184,0.08)";
const BDR2 = "rgba(148,163,184,0.06)";
const TEXT1 = "#f1f5f9";
const TEXT2 = "#94a3b8";
const TEXT3 = "#475569";
const TEXT4 = "#334155";

// ─── Module config ─────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: "hearse",
    label: "Hearse Bookings",
    icon: IcoTruck,
    accent: "#818cf8",
    apiEndpoint: "/hearse/bookings",
    statusMap: {
      pending:     { label: "Pending",     color: "#3b82f6" },
      confirmed:   { label: "Confirmed",   color: "#8b5cf6" },
      "in-transit":{ label: "In Transit",  color: "#f59e0b" },
      delayed:     { label: "Delayed",     color: "#ef4444" },
      completed:   { label: "Completed",   color: "#22c55e" },
      cancelled:   { label: "Cancelled",   color: "#64748b" },
    },
    dateField: "pickup_date",
    nameField: null,
    clientField: "client_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending",    label: "Pending",    Icon: IcoCalendar },
      { key: "in-transit", label: "In Transit", Icon: IcoTruck },
      { key: "delayed",    label: "Delayed",    Icon: IcoAlert },
      { key: "completed",  label: "Completed",  Icon: IcoCheck },
    ],
  },
  {
    id: "coffin",
    label: "Coffin Bookings",
    icon: IcoBox,
    accent: "#fb923c",
    apiEndpoint: "/coffin/bookings",
    statusMap: {
      pending:   { label: "Pending",   color: "#3b82f6" },
      reserved:  { label: "Reserved",  color: "#8b5cf6" },
      ready:     { label: "Ready",     color: "#f59e0b" },
      delivered: { label: "Delivered", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: "booking_date",
    clientField: "deceased_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending",   label: "Pending",   Icon: IcoCalendar },
      { key: "reserved",  label: "Reserved",  Icon: IcoBox },
      { key: "ready",     label: "Ready",     Icon: IcoAlert },
      { key: "delivered", label: "Delivered", Icon: IcoCheck },
    ],
  },
  {
    id: "flower",
    label: "Flower Bookings",
    icon: IcoFlower,
    accent: "#34d399",
    apiEndpoint: "/florist/bookings",
    statusMap: {
      pending:   { label: "Pending",   color: "#3b82f6" },
      sourced:   { label: "Sourced",   color: "#8b5cf6" },
      transit:   { label: "In Transit",color: "#f59e0b" },
      completed: { label: "Delivered", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: "delivery_date",
    clientField: "deceased_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending",   label: "Pending",   Icon: IcoCalendar },
      { key: "sourced",   label: "Sourced",   Icon: IcoFlower },
      { key: "transit",   label: "In Transit",Icon: IcoAlert },
      { key: "completed", label: "Delivered", Icon: IcoCheck },
    ],
  },
  {
    id: "deceased",
    label: "Deceased Register",
    icon: IcoUser,
    accent: "#f472b6",
    apiEndpoint: "/deceased",
    statusMap: {
      admitted:    { label: "Admitted",    color: "#3b82f6" },
      embalming:   { label: "Embalming",   color: "#8b5cf6" },
      ready:       { label: "Ready",       color: "#f59e0b" },
      released:    { label: "Released",    color: "#22c55e" },
      transferred: { label: "Transferred", color: "#64748b" },
    },
    dateField: "date_of_death",
    clientField: "deceased_name",
    idField: "deceased_id",
    kpiFields: [
      { key: "admitted",  label: "Admitted",  Icon: IcoUser },
      { key: "embalming", label: "Embalming", Icon: IcoAlert },
      { key: "ready",     label: "Ready",     Icon: IcoCalendar },
      { key: "released",  label: "Released",  Icon: IcoCheck },
    ],
  },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const DAY_START = 6;
const DAY_TOTAL = 16;
const HOUR_PX = 80;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const normDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return format(val, "yyyy-MM-dd");
  if (typeof val === "string") return val.slice(0, 10);
  return null;
};

const safeName = (booking, mod) => {
  return booking[mod.clientField] || booking.client_name || booking.name || booking.id || "—";
};

// ─── StatusPill ────────────────────────────────────────────────────────────────
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

// ─── MonthView ─────────────────────────────────────────────────────────────────
function MonthView({ currentDate, bookings, mod, onSelect }) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const SM = mod.statusMap;

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${BDR}`, backgroundColor: BG2, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${BDR}` }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT4 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1, gridAutoRows: "1fr" }}>
        {days.map((day, i) => {
          const ds = format(day, "yyyy-MM-dd");
          const db = bookings.filter(b => normDate(b[mod.dateField]) === ds);
          const inMonth = isSameMonth(day, currentDate);
          const tod = isToday(day);
          return (
            <div key={i} style={{
              borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`,
              padding: "6px", overflow: "hidden",
              opacity: inMonth ? 1 : 0.3,
              backgroundColor: tod ? "rgba(79,70,229,0.06)" : undefined,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700,
                width: 24, height: 24, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 4px",
                ...(tod ? { backgroundColor: mod.accent, color: "#fff" } : { color: TEXT3 }),
              }}>
                {format(day, "d")}
              </div>
              {db.slice(0, 3).map(bk => {
                const cfg = SM[bk.status] || { color: TEXT3 };
                return (
                  <button key={bk[mod.idField] || bk.id || i} onClick={() => onSelect(bk)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "2px 6px", borderRadius: 4, fontSize: 10, marginBottom: 2,
                      backgroundColor: `${cfg.color}18`, color: cfg.color,
                      border: `1px solid ${cfg.color}28`, cursor: "pointer",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                    {safeName(bk, mod).split(" ")[0]}
                  </button>
                );
              })}
              {db.length > 3 && <div style={{ fontSize: 10, color: TEXT4, padding: "0 4px" }}>+{db.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeekView ──────────────────────────────────────────────────────────────────
function WeekView({ currentDate, bookings, mod, onSelect }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const SM = mod.statusMap;

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${BDR}`, backgroundColor: BG2, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
        <div style={{ borderRight: `1px solid ${BDR2}` }} />
        {days.map((day, i) => {
          const tod = isToday(day);
          return (
            <div key={i} style={{ padding: "8px 0", textAlign: "center", borderRight: `1px solid ${BDR2}`, backgroundColor: tod ? "rgba(79,70,229,0.06)" : undefined }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3 }}>{format(day, "EEE")}</div>
              <div style={{
                fontSize: 17, fontWeight: 700, margin: "2px auto 0", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%",
                ...(tod ? { backgroundColor: mod.accent, color: "#fff" } : { color: TEXT2 }),
              }}>{format(day, "d")}</div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)" }}>
          {WEEK_HOURS.map(hour => (
            <Fragment key={hour}>
              <div style={{ borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`, padding: "10px 8px 10px 0", textAlign: "right" }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: TEXT4 }}>{String(hour).padStart(2, "0")}:00</span>
              </div>
              {days.map((day, di) => {
                const ds = format(day, "yyyy-MM-dd");
                const slotBks = bookings.filter(b => normDate(b[mod.dateField]) === ds);
                const tod = isToday(day);
                return (
                  <div key={di} style={{
                    borderRight: `1px solid ${BDR2}`, borderBottom: `1px solid ${BDR2}`,
                    padding: 2, minHeight: 42,
                    backgroundColor: tod ? "rgba(79,70,229,0.03)" : undefined,
                  }}>
                    {slotBks.map(bk => {
                      const cfg = SM[bk.status] || { color: TEXT3 };
                      return (
                        <button key={bk[mod.idField] || bk.id} onClick={() => onSelect(bk)}
                          style={{
                            display: "block", width: "100%", textAlign: "left", padding: 6, borderRadius: 4,
                            fontSize: 10, marginBottom: 2, cursor: "pointer",
                            backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
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

// ─── DayView (Gantt) ───────────────────────────────────────────────────────────
function DayView({ currentDate, bookings, mod, onSelect }) {
  const ds = format(currentDate, "yyyy-MM-dd");
  const dayBks = bookings.filter(b => normDate(b[mod.dateField]) === ds);
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
  if (allGroups.length === 0) allGroups.push(["—", []]);

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${BDR}`, backgroundColor: BG2, height: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Sticky header */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: `1px solid ${BDR}`, position: "sticky", top: 0, zIndex: 10, backgroundColor: BG2 }}>
        <div style={{ width: 144, flexShrink: 0, borderRight: `1px solid ${BDR2}`, padding: 12, display: "flex", alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT4 }}>
            {mod.label} · {format(currentDate, "d MMM")}
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
        <div key={grpName} style={{ display: "flex", borderBottom: `1px solid ${BDR2}`, minHeight: 60 }}>
          <div style={{ width: 144, flexShrink: 0, borderRight: `1px solid ${BDR2}`, padding: 12, position: "sticky", left: 0, backgroundColor: BG2, zIndex: 5 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: mod.accent }}>{grpName}</div>
            <div style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>{grpBks.length} booking{grpBks.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ width: timelineW, position: "relative", minHeight: 60 }}>
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
                <span style={{ fontSize: 11, color: "#1e293b" }}>Free today</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ booking, mod, onClose }) {
  const SM = mod.statusMap;
  const cfg = SM[booking.status] || { label: booking.status, color: TEXT3 };
  const fields = Object.entries(booking).filter(([k]) => !["id", mod.idField].includes(k) && typeof booking[k] !== "object");

  return (
    <div style={{
      position: "fixed", inset: "0 0 0 auto", zIndex: 200,
      width: 380, display: "flex", flexDirection: "column",
      backgroundColor: "#0d1220", borderLeft: `1px solid ${BDR}`,
      boxShadow: "0 0 40px rgba(0,0,0,0.6)",
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
            <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{booking.branch || booking.branch_name || "—"}</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, backgroundColor: BG3, borderRadius: 12, padding: 16, border: `1px solid ${BDR2}` }}>
          {fields.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                {k.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2 }}>{String(v || "—")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Module Dashboard ──────────────────────────────────────────────────────────
function ModuleDashboard({ mod }) {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeStatuses, setActiveStatuses] = useState(() => Object.keys(mod.statusMap));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const SM = mod.statusMap;

  const load = useCallback(async () => {
    try {
      const res = await api.get(mod.apiEndpoint);
      const data = res.data?.data || res.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [mod.apiEndpoint]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => bookings.filter(b => activeStatuses.includes(b.status)),
    [bookings, activeStatuses]
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
      return `${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy");
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBks = filtered.filter(b => normDate(b[mod.dateField]) === todayStr);

  const stats = useMemo(() => {
    const s = {};
    Object.keys(SM).forEach(k => { s[k] = filtered.filter(b => b.status === k).length; });
    s.total = filtered.length;
    return s;
  }, [filtered, SM]);

  const pieData = Object.entries(SM)
    .map(([k, v]) => ({ name: v.label, value: stats[k] || 0, color: v.color }))
    .filter(d => d.value > 0);

  const barData = [
    { name: "Total", ...Object.fromEntries(Object.entries(SM).map(([k, v]) => [v.label, stats[k] || 0])) }
  ];

  const toggleStatus = (st) =>
    setActiveStatuses(p => p.includes(st) ? p.filter(x => x !== st) : [...p, st]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: TEXT3 }}>
        <div style={{ textAlign: "center" }}>
          <mod.icon size={32} stroke={mod.accent} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Loading {mod.label}…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 200, flexShrink: 0, backgroundColor: BG1, borderRight: `1px solid ${BDR}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* View switcher */}
        <div style={{ padding: 12, borderBottom: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT4, marginBottom: 8 }}>View</div>
          {["month", "week", "day"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8,
                fontSize: 13, marginBottom: 4, border: "1px solid transparent", cursor: "pointer",
                ...(view === v ? {
                  backgroundColor: `${mod.accent}15`, color: mod.accent, border: `1px solid ${mod.accent}30`,
                } : { color: TEXT3, background: "transparent" }),
              }}>
              {v.charAt(0).toUpperCase() + v.slice(1)} View
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ padding: 12, borderBottom: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT4, marginBottom: 8 }}>Filter</div>
          {Object.entries(SM).map(([k, v]) => (
            <button key={k} onClick={() => toggleStatus(k)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "6px 12px", borderRadius: 8, fontSize: 11, marginBottom: 2, border: "none", cursor: "pointer",
                background: "transparent", color: activeStatuses.includes(k) ? TEXT2 : "#1e293b",
              }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: activeStatuses.includes(k) ? v.color : "#1e293b" }} />
              {v.label}
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: activeStatuses.includes(k) ? v.color : "#1e293b" }}>
                {stats[k] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Today summary */}
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: TEXT4, marginBottom: 8 }}>
            Today · {format(new Date(), "d MMM")}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: mod.accent, fontFamily: "monospace" }}>{todayBks.length}</div>
          <div style={{ fontSize: 11, color: TEXT3, marginBottom: 12 }}>bookings today</div>
          {Object.entries(SM).map(([k, v]) => {
            const cnt = todayBks.filter(b => b.status === k).length;
            if (!cnt) return null;
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: v.color }} />
                  <span style={{ fontSize: 11, color: TEXT3 }}>{v.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: v.color }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Calendar toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${BDR}`, backgroundColor: BG1, flexShrink: 0 }}>
          <button onClick={() => setCurrentDate(new Date())}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, backgroundColor: BG3, color: TEXT2, border: "none", cursor: "pointer" }}>
            Today
          </button>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => navigate(-1)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3 }}><IcoChevL size={16} /></button>
            <button onClick={() => navigate(1)}  style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3 }}><IcoChevR size={16} /></button>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT1, margin: 0 }}>{calTitle()}</h2>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, fontFamily: "monospace", color: TEXT4 }}>
            {filtered.length} total · {stats.delayed || 0} delayed · {stats["in-transit"] || stats.transit || 0} active
          </div>
          <button onClick={load} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: TEXT3 }}>
            <IcoCalendar size={14} />
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
          {mod.kpiFields.map(({ key, label, Icon }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", backgroundColor: BG2, borderRadius: 12, border: `1px solid ${BDR2}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${SM[key]?.color || mod.accent}14` }}>
                <Icon size={15} stroke={SM[key]?.color || mod.accent} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: SM[key]?.color || mod.accent, lineHeight: 1, fontFamily: "monospace" }}>{stats[key] || 0}</div>
                <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, overflow: "auto", padding: 16, minHeight: 0 }}>
          {view === "month" && <MonthView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} />}
          {view === "week" && <WeekView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} />}
          {view === "day" && <DayView currentDate={currentDate} bookings={filtered} mod={mod} onSelect={setSelected} />}
        </div>

        {/* Charts footer */}
        <div style={{ height: 192, flexShrink: 0, backgroundColor: BG1, borderTop: `1px solid ${BDR}`, display: "flex" }}>
          <div style={{ flex: 1, padding: "12px 16px", borderRight: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT4, marginBottom: 6 }}>Bookings by Status</div>
            <ResponsiveContainer width="100%" height={148}>
              <BarChart data={pieData.map(d => ({ name: d.name, count: d.value, color: d.color }))} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke={BG2} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: TEXT3, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TEXT3, fontSize: 9 }} axisLine={false} tickLine={false} width={18} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: BG3, border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 10, color: TEXT2 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: 200, padding: "12px 16px", borderRight: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT4, marginBottom: 6 }}>Status Mix</div>
            <ResponsiveContainer width="100%" height={148}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="54%" innerRadius={34} outerRadius={54} paddingAngle={4} dataKey="value">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.9} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: BG3, border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 10, color: TEXT2 }} />
              </PieChart>
            </ResponsiveContainer>
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
      </main>

      {/* Detail panel */}
      {selected && <DetailPanel booking={selected} mod={mod} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("hearse");
  const mod = MODULES.find(m => m.id === activeTab);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      backgroundColor: BG0, color: TEXT1, fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    }}>
      {/* ── Top bar ── */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 20px", height: 52, flexShrink: 0, backgroundColor: BG1, borderBottom: `1px solid ${BDR}` }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#312e81" }}>
            <IcoCalendar size={14} stroke="#a5b4fc" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: TEXT1, letterSpacing: "-0.02em" }}>RestPoint</div>
            <div style={{ fontSize: 10, color: TEXT4 }}>Operations Calendar</div>
          </div>
        </div>

        <div style={{ width: 1, height: 20, backgroundColor: BDR, margin: "0 4px" }} />

        {/* Module tabs */}
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActiveTab(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 8,
              fontSize: 12, fontWeight: 700, border: "1px solid transparent", cursor: "pointer",
              ...(activeTab === m.id ? {
                backgroundColor: `${m.accent}15`, color: m.accent, border: `1px solid ${m.accent}30`,
              } : { color: TEXT3, background: "transparent" }),
            }}>
            <m.icon size={13} stroke={activeTab === m.id ? m.accent : TEXT3} />
            {m.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Live dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", animation: "pulse 2s infinite" }} />
          Live
        </div>
      </header>

      {/* ── Module content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {mod && <ModuleDashboard key={activeTab} mod={mod} />}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.12); border-radius: 4px; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
