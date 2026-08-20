/**
 * CoffinBook — Coffin Reservation Dashboard
 * Visual design ported from the "CoffinBook" reference (DM Sans + Instrument Serif,
 * paper/ink palette, day-strip calendar, 60/40 list/analytics split, detail modal).
 * Data is LIVE: /coffins/orders + /coffins/all-branches, auto-refresh every 15s.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameWeek, isSameMonth, addWeeks, subWeeks, addMonths, subMonths,
  addDays, subDays, isToday,
} from "date-fns";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "../../api/axios";
import { getParentTenantSlug, getTenantId } from "../../utils/globalAuth";

// ─── CoffinBook design tokens ─────────────────────────────────────────────────
const C = {
  bg: "#f4f4f3",
  panel: "#ffffff",
  ink: "#18181b",
  ink2: "#52525b",
  gray: "#a1a1aa",
  faint: "#71717a",
  line: "#e8e6e5",
  lineSoft: "#f4f4f3",
  mutedBg: "#fafaf9",
  dark: "#18181b",
  darkH: "#27272a",
  liveBg: "#f0fdf4",
  liveBd: "#bbf7d0",
  liveTx: "#16a34a",
  pauseBg: "#fefce8",
  pauseBd: "#fef08a",
  pauseTx: "#ca8a04",
  todayBg: "#f0eeeb",
  todayTx: "#57534e",
};

const STATUS = {
  confirmed: { label: "Confirmed", color: "#2563eb", bg: "#eff6ff", bar: "#3b82f6" },
  pending:   { label: "Pending",   color: "#d97706", bg: "#fffbeb", bar: "#f59e0b" },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5", bar: "#10b981" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", bar: "#ef4444" },
};
const STATUS_ORDER = ["confirmed", "pending", "completed", "cancelled"];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ size = 12, sw = 2, children }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IC = {
  cal: <Ico size={14}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Ico>,
  ph:  <Ico size={10}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Ico>,
  us:  <Ico size={10}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>,
  al:  <Ico size={13}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Ico>,
  dl:  <Ico size={13}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Ico>,
  tr:  <Ico size={13}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Ico>,
  cl:  <Ico size={13} sw={2.5}><polyline points="15 18 9 12 15 6" /></Ico>,
  cr:  <Ico size={13} sw={2.5}><polyline points="9 18 15 12 9 6" /></Ico>,
  pl:  <Ico size={11} sw={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Ico>,
  rf:  <Ico size={12}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Ico>,
  x:   <Ico size={15}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>,
  ar:  <Ico size={10} sw={2.5}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Ico>,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, "0");

const mapStatus = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "booked" || v === "approved" || v === "confirmed") return "confirmed";
  if (v === "completed" || v === "delivered" || v === "done") return "completed";
  if (v === "cancelled" || v === "rejected" || v === "canceled") return "cancelled";
  return "pending";
};

const parseServiceDate = (raw) => {
  if (!raw) return null;
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const extractTime = (raw) => {
  if (!raw) return "";
  const m = String(raw).match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  if (/^\d{1,2}:\d{2}/.test(String(raw))) return String(raw).slice(0, 5);
  return "";
};

const usd = (n) => `$${Number(n || 0).toLocaleString()}`;
const REFRESH_MS = 15000;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReservationDashboard({
  bookings = [],
  coffins = [],
  branches = [],
  formatPrice,
  onNewReservation,
  onViewBooking,
}) {
  const [view, setView] = useState("week");
  const [sel, setSel] = useState(new Date());
  const [live, setLive] = useState(true);
  const [liveBookings, setLiveBookings] = useState(bookings);
  const [liveCoffins, setLiveCoffins] = useState(coffins);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalBk, setModalBk] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastOut, setToastOut] = useState(false);
  const [clock, setClock] = useState(new Date());
  const inFlight = useRef(false);
  const toastTimer = useRef(null);

  useEffect(() => setLiveBookings(bookings), [bookings]);
  useEffect(() => setLiveCoffins(coffins), [coffins]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = useCallback((msg) => {
    window.clearTimeout(toastTimer.current);
    setToastOut(false);
    setToastMsg(msg);
    toastTimer.current = window.setTimeout(() => {
      setToastOut(true);
      toastTimer.current = window.setTimeout(() => setToastMsg(null), 220);
    }, 2600);
  }, []);

  // Robustly pull an array out of ANY of the shapes the coffin APIs can return:
  //   { success:true, data:[...] }, { data:[...] }, { orders:[...] },
  //   { bookings:[...] }, { results:[...] } or a bare array.
  const arr = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.data)) return v.data;
      if (Array.isArray(v.orders)) return v.orders;
      if (Array.isArray(v.bookings)) return v.bookings;
      if (Array.isArray(v.hearses)) return v.hearses;
      if (Array.isArray(v.results)) return v.results;
    }
    return [];
  };

  const fetchOrders = async () => {
    for (const ep of ["/coffins/orders", "/coffins/orders/list"]) {
      try {
        const r = await api.get(ep);
        const list = arr(r?.data);
        if (list.length > 0 || r?.data?.success) return list;
      } catch (e) { /* try next endpoint */ }
    }
    return [];
  };

  const fetchCoffins = async () => {
    const parentSlug = getParentTenantSlug();
    const tenantId = getTenantId();
    const params = { parent_slug: parentSlug || undefined, tenant_id: tenantId || undefined };
    for (const ep of ["/coffins/all-branches", "/coffins/list"]) {
      try {
        const r = await api.get(ep, { params });
        const list = arr(r?.data);
        if (list.length > 0 || r?.data?.success) return list;
      } catch (e) { /* try next endpoint */ }
    }
    return [];
  };

  const fetchLive = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const [orders, coffins] = await Promise.all([fetchOrders(), fetchCoffins()]);
      if (orders.length) setLiveBookings(orders);
      if (coffins.length) setLiveCoffins(coffins);
      setLastUpdated(new Date());
      setLiveError(null);
    } catch (err) {
      setLiveError(err?.response?.data?.message || err?.message || "Live refresh failed");
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const t = setInterval(() => { if (live) fetchLive(); }, REFRESH_MS);
    const onVis = () => { if (document.visibilityState === "visible") fetchLive(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchLive, live]);

  const money = typeof formatPrice === "function" ? formatPrice : usd;
  const isLive = live && !liveError;

  // ── Derived data ─────────────────────────────────────────────────────────────
  const mapped = useMemo(() => {
    return (liveBookings || [])
      .map((b) => {
        const date = parseServiceDate(b.service_date);
        const cn = String(b.coffin_name || "").toLowerCase();
        const c =
          (liveCoffins || []).find((x) => (x.coffin_id || x.id) == b.coffin_id) ||
          (liveCoffins || []).find((x) => x.name && cn && String(x.name).toLowerCase() === cn);
        return {
          id: b.id,
          clientName: b.client_name || "—",
          deceasedName: b.deceased_name || "",
          phone: b.client_phone || b.phone || "—",
          coffinType: (c && c.name) || b.coffin_name || "—",
          date: date || new Date(),
          time: extractTime(b.service_time || b.time || b.service_date),
          status: mapStatus(b.status),
          price: Number(b.coffin_price || b.price || (c ? c.exact_price || c.price : 0) || 0),
          paid: !!b.paid,
          notes: b.notes || "",
        };
      })
      .sort((a, b2) => a.date.getTime() - b2.date.getTime());
  }, [liveBookings, liveCoffins]);

  const calendarDays = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({ start: startOfWeek(sel, { weekStartsOn: 1 }), end: endOfWeek(sel, { weekStartsOn: 1 }) });
    }
    if (view === "month") {
      return eachDayOfInterval({ start: startOfMonth(sel), end: endOfMonth(sel) });
    }
    return eachDayOfInterval({ start: subDays(sel, 10), end: addDays(sel, 20) });
  }, [view, sel]);

  const visible = useMemo(() => {
    return mapped.filter((b) => {
      if (view === "day") return isSameDay(b.date, sel);
      if (view === "week") return isSameWeek(b.date, sel, { weekStartsOn: 1 });
      return isSameMonth(b.date, sel);
    });
  }, [view, sel, mapped]);

  const perDay = useMemo(() => {
    const map = {};
    mapped.forEach((b) => { const k = format(b.date, "yyyy-MM-dd"); map[k] = (map[k] || 0) + 1; });
    return map;
  }, [mapped]);

  const stats = useMemo(() => {
    const now = new Date();
    const month = mapped.filter((b) => isSameMonth(b.date, now));
    return {
      total: month.length,
      pending: mapped.filter((b) => b.status === "pending").length,
      revenue: month.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0),
      today: mapped.filter((b) => isToday(b.date)).length,
    };
  }, [mapped]);

  const byType = useMemo(() => {
    const counts = {};
    mapped.forEach((b) => { const k = b.coffinType || "Other"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts)
      .map(([full, value]) => ({ name: full.split(" ")[0], full, value }))
      .sort((a, b2) => b2.value - a.value);
  }, [mapped]);

  const statusData = useMemo(() => {
    const counts = { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    mapped.forEach((b) => { counts[b.status]++; });
    return STATUS_ORDER.map((s) => ({ key: s, label: STATUS[s].label, value: counts[s], color: STATUS[s].bar }));
  }, [mapped]);

  // ── Labels / actions ─────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (view === "day") return format(sel, "MMM d, yyyy");
    if (view === "week") {
      const s = startOfWeek(sel, { weekStartsOn: 1 });
      const e = endOfWeek(sel, { weekStartsOn: 1 });
      return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
    }
    return format(sel, "MMMM yyyy");
  }, [view, sel]);

  const stripLabel = useMemo(() => {
    if (view === "week") return `Week of ${format(startOfWeek(sel, { weekStartsOn: 1 }), "MMM d, yyyy")}`;
    return format(sel, "MMMM yyyy");
  }, [view, sel]);

  const navigate = (dir) => {
    if (view === "day") setSel((d) => addDays(d, dir * 7));
    else if (view === "week") setSel((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else setSel((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const refresh = () => {
    setRefreshing(true);
    fetchLive().finally(() => { setRefreshing(false); showToast("Refreshed"); });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setModalBk(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (liveError && !liveBookings.length) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.gray, fontFamily: "'DM Sans', sans-serif", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 13 }}>{liveError}</span>
        <button onClick={fetchLive} style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: C.dark, color: "#fafafa", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  const timeStr = `${pad2(clock.getHours())}:${pad2(clock.getMinutes())}:${pad2(clock.getSeconds())}`;

  return (
    <div
      className="cb-app"
      style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: C.bg, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* CoffinBook styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif&display=swap');
        .cb-app *{box-sizing:border-box}
        .cb-app ::-webkit-scrollbar{width:4px;height:3px}
        .cb-app ::-webkit-scrollbar-track{background:transparent}
        .cb-app ::-webkit-scrollbar-thumb{background:#d4d4d4;border-radius:10px}
        .cb-app ::-webkit-scrollbar-thumb:hover{background:#a3a3a3}
        @keyframes cbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.72)}}
        @keyframes cbFade{from{opacity:0}to{opacity:1}}
        @keyframes cbSlide{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cbTIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cbTOut{to{opacity:0;transform:translateY(6px)}}
        .cb-ldot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:cbPulse 1.5s ease-in-out infinite;flex-shrink:0}
        .cb-ldot.sp{background:#4ade80;animation:cbPulse .5s ease-in-out infinite}
        .cb-vb{padding:4px 14px;border-radius:7px;font-size:10.5px;font-weight:600;text-transform:capitalize;border:none;transition:all .12s;background:transparent;color:#a1a1aa;cursor:pointer}
        .cb-vb:hover:not(.on){background:#eeecea;color:#52525b}
        .cb-vb.on{background:#fff;color:#18181b;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .cb-dp{min-width:38px;height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:none;border-radius:8px;background:transparent;color:#a1a1aa;cursor:pointer;transition:all .15s;flex:1;max-width:56px}
        .cb-dp:hover:not(.sl):not(.td){background:#eeecea}
        .cb-dp.td{background:#f0eeeb;color:#57534e}
        .cb-dp.sl{background:#18181b;color:#fafafa;box-shadow:0 2px 8px rgba(0,0,0,.12)}
        .cb-dl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;opacity:.45}
        .cb-dp.sl .cb-dl{opacity:.65}
        .cb-dn{font-size:13px;font-weight:700;line-height:1}
        .cb-dt{width:4px;height:4px;border-radius:50%;background:currentColor;opacity:.35;margin-top:2px}
        .cb-dp.sl .cb-dt{opacity:.5}
        .cb-r{display:grid;grid-template-columns:4px 1fr 1.2fr 1fr .65fr .65fr;align-items:center;gap:0;padding:9px 12px 9px 0;cursor:pointer;transition:background .12s;border-bottom:1px solid #f4f4f3;min-height:48px}
        .cb-r:hover{background:#fafaf9}
        .cb-bar{width:4px;min-height:24px;border-radius:4px;align-self:stretch}
        .cb-cell{padding:0 8px;overflow:hidden;min-width:0}
        .cb-nm{font-size:12.5px;font-weight:600;color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cb-sb{font-size:10.5px;color:#a1a1aa;display:flex;align-items:center;gap:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cb-sb span{margin-top:1px}
        .cb-cn{font-size:10.5px;color:#52525b;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cb-mt{font-size:10.5px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cb-pr{font-size:12.5px;font-weight:700;color:#18181b;text-align:right;white-space:nowrap}
        .cb-bg{font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:5px;white-space:nowrap;display:inline-block;line-height:1.5}
        .cb-card{background:#fff;border:1px solid #e8e6e5;border-radius:10px;padding:12px 14px;transition:box-shadow .2s}
        .cb-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.04)}
        .cb-ib{height:28px;padding:0 9px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid #e8e6e5;background:#fff;color:#a1a1aa;font-size:10.5px;font-weight:500;cursor:pointer;transition:all .12s;white-space:nowrap}
        .cb-ib:hover{background:#f4f4f3;color:#52525b;border-color:#d4d4d4}
        .cb-ib.sq{width:28px;padding:0}
        .cb-nb{display:inline-flex;align-items:center;gap:4px;padding:5px 14px;border-radius:7px;font-size:10.5px;font-weight:700;border:none;background:#18181b;color:#fafafa;cursor:pointer;transition:all .15s;box-shadow:0 2px 6px rgba(0,0,0,.1)}
        .cb-nb:hover{background:#27272a;box-shadow:0 4px 10px rgba(0,0,0,.16)}
        .cb-te{position:fixed;bottom:20px;right:20px;padding:8px 16px;border-radius:8px;background:#18181b;color:#fafafa;font-size:11px;font-weight:500;box-shadow:0 6px 20px rgba(0,0,0,.18);z-index:2000;animation:cbTIn .25s ease;display:flex;align-items:center;gap:7px}
        .cb-te.out{animation:cbTOut .2s ease forwards}
        .cb-mo{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:1050;backdrop-filter:blur(5px);animation:cbFade .15s}
        .cb-mb{background:#fff;border-radius:14px;max-width:460px;width:90%;max-height:80vh;overflow-y:auto;padding:24px 28px;box-shadow:0 24px 48px rgba(0,0,0,.18);animation:cbSlide .25s ease}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
        @media(max-width:900px){.cb-ms{flex-direction:column!important}.cb-ms>div{width:100%!important;max-height:50vh}}
      `}</style>

      {/* ─────── HEADER ─────── */}
      <header style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 18px", background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, color: "#fafafa" }}>{IC.cal}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: "Instrument Serif, Georgia, serif", letterSpacing: "-0.3px" }}>CoffinBook</div>
            <div style={{ fontSize: 9, color: C.gray, fontWeight: 500, marginTop: -2 }}>Arrangements</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, padding: 2, background: C.bg, borderRadius: 8, border: `1px solid ${C.line}` }}>
          {["day", "week", "month"].map((v) => (
            <button key={v} className={`cb-vb${view === v ? " on" : ""}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, border: `1px solid ${isLive ? C.liveBd : C.pauseBd}`, background: isLive ? C.liveBg : C.pauseBg, fontSize: "9.5px", fontWeight: 600, color: isLive ? C.liveTx : C.pauseTx }}>
            <span className={`cb-ldot${refreshing ? " sp" : ""}`} /> {isLive ? "Live" : "Paused"} · {timeStr}
          </div>
          <button className="cb-ib" style={{ borderColor: isLive ? C.liveBd : C.pauseBd, background: isLive ? C.liveBg : C.pauseBg, color: isLive ? C.liveTx : C.pauseTx }} onClick={() => { setLive((v) => !v); showToast(!live ? "Live sync on" : "Paused"); }}>{isLive ? "Live" : "Paused"}</button>
          <button className="cb-ib sq" onClick={refresh}>{IC.rf}</button>
          <button className="cb-ib" onClick={() => setSel(new Date())}>Today</button>
          <button className="cb-nb" onClick={() => { if (onNewReservation) onNewReservation(); else showToast("New reservation form"); }}>{IC.pl} New</button>
        </div>
      </header>

      {/* ─────── CALENDAR STRIP ─────── */}
      <div style={{ flexShrink: 0, background: C.panel, borderBottom: `1px solid ${C.line}`, padding: "6px 0 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px 4px" }}>
          <span style={{ fontSize: "9.5px", fontWeight: 600, color: C.gray, letterSpacing: ".3px", textTransform: "uppercase" }}>{stripLabel}</span>
          <div style={{ display: "flex", gap: 2 }}>
            <button className="cb-ib sq" onClick={() => navigate(-1)}>{IC.cl}</button>
            <button className="cb-ib sq" onClick={() => navigate(1)}>{IC.cr}</button>
          </div>
        </div>
        <div style={{ display: "flex", padding: "0 14px", gap: 3, overflowX: "auto" }}>
          {calendarDays.map((day) => {
            const k = format(day, "yyyy-MM-dd");
            const cnt = perDay[k] || 0;
            const isSl = isSameDay(day, sel);
            const isTd = isToday(day);
            const cls = isSl ? "cb-dp sl" : (isTd ? "cb-dp td" : "cb-dp");
            return (
              <button key={k} className={cls} onClick={() => setSel(day)}>
                <span className="cb-dl">{format(day, "EEE")}</span>
                <span className="cb-dn">{format(day, "d")}</span>
                {cnt > 0 && <span className="cb-dt" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────── MAIN ─────── */}
      <div className="cb-ms" style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* LEFT — bookings list (60%) */}
        <div style={{ width: "60%", minWidth: 0, display: "flex", flexDirection: "column", background: C.panel, borderRight: `1px solid ${C.line}` }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: `1px solid ${C.lineSoft}` }}>
            <div>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: C.ink }}>{periodLabel}</span>
              <span style={{ fontSize: "10.5px", color: C.gray, marginLeft: 6 }}>{visible.length} {visible.length === 1 ? "booking" : "bookings"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {STATUS_ORDER.filter((s) => visible.some((b) => b.status === s)).map((s) => (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: C.gray }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS[s].bar }} />
                  {visible.filter((b) => b.status === s).length}
                </span>
              ))}
            </div>
          </div>

          <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "4px 1fr 1.2fr 1fr .65fr .65fr", padding: "5px 12px 5px 0", borderBottom: `1px solid ${C.line}`, background: C.mutedBg, alignItems: "center" }}>
            <div />
            {["Client", "Coffin", "Schedule", "Status", "Amount"].map((h, i) => (
              <div key={h} style={{ paddingLeft: i === 0 ? 10 : 8, fontSize: "8.5px", fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: ".4px", textAlign: i === 4 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {visible.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.gray, fontSize: 11 }}>No bookings for this period</div>
            ) : (
              visible.map((b) => {
                const cf = STATUS[b.status];
                return (
                  <div key={b.id} className="cb-r" onClick={() => setModalBk(b)}>
                    <div className="cb-bar" style={{ background: cf.bar }} />
                    <div className="cb-cell">
                      <div className="cb-nm">{b.clientName}</div>
                      {b.deceasedName && <div className="cb-sb"><span>{IC.us}</span> {b.deceasedName}</div>}
                    </div>
                    <div className="cb-cell">
                      <div className="cb-cn">{b.coffinType}</div>
                      <div className="cb-sb"><span>{IC.ph}</span> {b.phone}</div>
                    </div>
                    <div className="cb-cell">
                      <div className="cb-mt">{format(b.date, "MMM d, yyyy")}</div>
                      <div className="cb-sb"><span>{b.time || "—"}</span></div>
                    </div>
                    <div className="cb-cell" style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
                      <span className="cb-bg" style={{ background: cf.bg, color: cf.color }}>{cf.label}</span>
                      <span className="cb-bg" style={{ background: b.paid ? "#ecfdf5" : "#fef2f2", color: b.paid ? "#059669" : "#dc2626" }}>{b.paid ? "Paid" : "Unpaid"}</span>
                    </div>
                    <div className="cb-cell" style={{ textAlign: "right" }}>
                      <div className="cb-pr">{money(b.price)}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, fontSize: "10.5px", color: C.gray }}>details {IC.ar}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — analytics (40%) */}
        <div style={{ width: "40%", minWidth: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: C.bg }}>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: "This Month", v: stats.total, s: "bookings", ic: IC.us, c: "#2563eb" },
              { l: "Pending", v: stats.pending, s: "need action", ic: IC.al, c: "#d97706" },
              { l: "Revenue", v: money(stats.revenue), s: "completed", ic: IC.dl, c: "#059669" },
              { l: "Today", v: stats.today, s: "scheduled", ic: IC.tr, c: "#dc2626" },
            ].map((x) => (
              <div key={x.l} className="cb-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "9.5px", fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: ".3px" }}>{x.l}</span>
                  <span style={{ color: x.c, opacity: 0.4, display: "inline-flex", lineHeight: 0 }}>{x.ic}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{x.v}</div>
                <div style={{ fontSize: "9.5px", color: C.gray, marginTop: 1 }}>{x.s}</div>
              </div>
            ))}
          </div>

          {/* By Coffin Type */}
          <div className="cb-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 8 }}>By Coffin Type</div>
            <div style={{ height: 110 }}>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={byType} barCategoryGap="32%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lineSoft} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.gray, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: C.gray }} axisLine={false} tickLine={false} width={14} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(24,24,27,0.04)" }}
                    contentStyle={{ backgroundColor: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 10, color: C.ink2, padding: "6px 10px" }}
                    labelStyle={{ color: C.ink, fontWeight: 700, fontSize: 11 }}
                    labelFormatter={(label) => { const it = byType.find((x) => x.name === label); return it ? it.full : label; }}
                  />
                  <Bar dataKey="value" fill={C.dark} radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="cb-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Status Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flexShrink: 0, width: 90, height: 90 }}>
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={26} outerRadius={40} paddingAngle={2} stroke="none" cornerRadius={2}>
                      {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 10, color: C.ink2, padding: "6px 10px" }}
                      labelStyle={{ color: C.ink, fontWeight: 700, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {statusData.map((d) => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: "10.5px", color: C.faint }}>{d.label}</span>
                    </div>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: C.ink }}>{d.value}</span>
                  </div>
                ))}
                <div style={{ paddingTop: 5, marginTop: 3, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10.5px", color: C.gray }}>Total</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{mapped.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────── BOOKING DETAIL MODAL ─────── */}
      {modalBk && (
        <div className="cb-mo" onClick={(e) => { if (e.target === e.currentTarget) setModalBk(null); }}>
          <div className="cb-mb">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, fontFamily: "Instrument Serif, Georgia, serif" }}>Booking Details</span>
              <button onClick={() => setModalBk(null)} style={{ background: C.bg, border: "none", color: C.gray, width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{IC.x}</button>
            </div>

            {[
              ["Booking ID", `#${modalBk.id}`],
              ["Client", modalBk.clientName],
              ["Phone", modalBk.phone],
              ["Coffin", modalBk.coffinType],
              ["Date", format(modalBk.date, "MMMM d, yyyy")],
              ["Time", modalBk.time || "—"],
              ["Status", <span key="st" className="cb-bg" style={{ background: STATUS[modalBk.status].bg, color: STATUS[modalBk.status].color }}>{STATUS[modalBk.status].label}</span>],
              ["Price", money(modalBk.price)],
              ["Payment", <span key="pay" className="cb-bg" style={{ background: modalBk.paid ? "#ecfdf5" : "#fef2f2", color: modalBk.paid ? "#059669" : "#dc2626" }}>{modalBk.paid ? "Paid" : "Unpaid"}</span>],
              ...(modalBk.notes ? [["Notes", modalBk.notes]] : []),
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "7px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <span style={{ flexShrink: 0, color: C.gray, fontSize: "11.5px", fontWeight: 500 }}>{label}</span>
                <span style={{ textAlign: "right", color: C.ink, fontSize: "11.5px", fontWeight: 600, overflowWrap: "break-word" }}>{value}</span>
              </div>
            ))}

            <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button onClick={() => setModalBk(null)} style={{ padding: "6px 16px", borderRadius: 7, border: `1px solid ${C.line}`, background: C.bg, color: C.faint, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Close</button>
              <button onClick={() => { setModalBk(null); if (onViewBooking) onViewBooking(modalBk.id); showToast("Opening full view..."); }} style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: C.dark, color: "#fafafa", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View Full</button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── TOAST ─────── */}
      {toastMsg && (
        <div className={`cb-te${toastOut ? " out" : ""}`}>{toastMsg}</div>
      )}
    </div>
  );
}