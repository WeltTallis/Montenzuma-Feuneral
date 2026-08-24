import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format, addDays, addMonths, subMonths,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
} from "date-fns";

import api from "../api/axios";
import { extractArray, matchesDay } from "./utils";

import FilterSidebar from "./views/FilterSidebar";
import MonthView from "./views/MonthView";
import WeekView from "./views/WeekView";
import DayView from "./views/DayView";
import ChartsPanel from "./views/ChartsPanel";
import DetailPanel from "./views/DetailPanel";
import DayEventsPanel from "./views/DayEventsPanel";
import MiniActivityCalendar from "./views/MiniCalendar";
import HearseBookings from "../components/hearse/hearseBookings";
import StoreTab from "../components/workshop/pages/StoreTab";
import { Ctx } from "../components/workshop/pages/WorkshopDashboard";
import Toasts from "../components/workshop/pages/Toasts";

/*  Tokens  */
const T = {
  bg: "#F4F6F8",
  toolbar: "#FFFFFF",
  surface: "#FFFFFF",
  border: "rgba(15,23,42,0.08)",
  borderSubtle: "rgba(15,23,42,0.04)",
  text: "#0F172A",
  textSec: "#64748B",
  textMuted: "#475569",
  font: "'DM Sans','Inter',system-ui,sans-serif",
};

/* ─── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, color, Icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      borderRadius: 14,
      background: color,
      boxShadow: `0 4px 14px ${color}40`,
      flex: "1 1 0",
      minWidth: 148,
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      cursor: "default",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 10px 22px ${color}55`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 14px ${color}40`;
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} color="#FFFFFF" />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, fontFamily: "monospace" }}>
          {value}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ─── View Toggle Button ──────────────────────────────────────── */
function ViewBtn({ id, label, icon: Icon, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "6px 10px", borderRadius: 9, cursor: "pointer",
      fontSize: 11, fontWeight: 600,
      transition: "all 0.15s ease",
      border: active ? `1px solid ${accent}30` : "1px solid transparent",
      background: active
        ? `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`
        : "transparent",
      color: active ? accent : T.textMuted,
      boxShadow: active ? `0 0 12px ${accent}15` : "none",
    }}>
      {Icon && <Icon size={11} />}
      <span>{label}</span>
    </button>
  );
}

/* ─── Icon-like button ────────────────────────────────────────── */
function ToolBtn({ onClick, title, active, accent, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 12px", borderRadius: 10, cursor: "pointer",
        fontSize: 11, fontWeight: 600,
        border: active ? `1px solid ${accent || "rgba(99,102,241,0.4)"}` : `1px solid ${T.border}`,
        background: active
          ? `linear-gradient(135deg, ${accent || "#6366f1"}22 0%, ${accent || "#6366f1"}08 100%)`
          : "rgba(255,255,255,0.03)",
        color: active ? (accent || "#6366f1") : T.textSec,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = T.text;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.color = T.textSec;
        }
      }}
    >
      {children}
    </button>
  );
}

/* ─── Hearse booking status colours (mirror of hearseBookings STATUS_CONFIG) ── */
const HEARSE_STATUS_COLORS = {
  pending: "#f59e0b",
  booked: "#3b82f6",
  in_transit: "#ec4899",
  completed: "#10b981",
  cancelled: "#ef4444",
  postponed: "#f59e0b",
  maintenance: "#8b5cf6",
};

/* ─── View config ─────────────────────────────────────────────── */
const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

/* ─── Main Module Dashboard ───────────────────────────────────── */
export default function ModuleDashboard({ mod }) {
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

  /* ── Data load ─────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
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
      console.warn("[Dashboard]", mod.label, "load failed:", e?.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [mod.apiEndpoint, mod.label]);

  useEffect(() => { load(); }, [load]);

  /* ── Unified calendars data — scoped per module tab ──
     Mini calendar       → coffin + deceased tabs only
     Hearse FullCalendar → hearse tab only                        */
  const showMini = mod.id === "coffin" || mod.id === "deceased";
  const showHearse = mod.id === "hearse";
  const showStore = mod.id === "workshop";
  const [miniEvents, setMiniEvents] = useState({});
  const [calLoading, setCalLoading] = useState(true);

  /* ── Workshop tab renders the store (StoreTab) — provide the
     minimal Ctx context it needs (addToast + workers). ───────── */
  const [storeToasts, setStoreToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setStoreToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(
      () => setStoreToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  }, []);
  const storeCtx = { addToast, workers: [] };

  const loadCalendars = useCallback(async () => {
    if (!showMini && !showHearse) { setCalLoading(false); return; }
    setCalLoading(true);
    try {
      const keyOf = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };

      /* Mini calendar: coffin orders + deceased records */
      if (showMini) {
        /* Coffin orders (paginated) */
        let orders = [];
        for (let p = 1; p <= 8; p++) {
          const r = await api.get("/coffins/orders", { params: { page: p, limit: 100 } }).catch(() => null);
          const chunk = extractArray(r);
          if (!chunk.length) break;
          orders = orders.concat(chunk);
          if (chunk.length < 100) break;
        }

        /* Deceased records (paginated, capped) */
        let deceased = [];
        for (let p = 1; p <= 10; p++) {
          const r = await api.get("/deceased/deceased-all", { params: { page: p, limit: 100 } }).catch(() => null);
          const chunk = extractArray(r);
          if (!chunk.length) break;
          deceased = deceased.concat(chunk);
          if (chunk.length < 100) break;
        }

        /* Mini-calendar events: coffins = blue, deceased = orange */
        const events = {};
        const push = (k, ev) => {
          if (!k) return;
          if (!events[k]) events[k] = [];
          if (events[k].length < 6) events[k].push(ev);
        };
        orders.forEach((o) => {
          push(keyOf(o?.service_date || o?.order_date || o?.created_at), {
            n: o?.deceased_name ? `Coffin · ${o.deceased_name}` : `Coffin order · ${o?.client_name || o?.coffin_name || "booking"}`,
            t: o?.service_time || "Booking",
            c: "blue",
          });
        });
        deceased.forEach((r) => {
          push(keyOf(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at), {
            n: r?.full_name || "Deceased record",
            t: "Admission",
            c: "orange",
          });
        });
        setMiniEvents(events);
      }
    } catch (e) {
      console.warn("[Dashboard] calendars load failed:", e?.message);
    } finally {
      setCalLoading(false);
    }
  }, [showMini, showHearse]);

  useEffect(() => { loadCalendars(); }, [loadCalendars]);

  /* ── Filtering ─────────────────────────────────────────────── */
  const allOn = activeStatuses.length === Object.keys(SM).length;
  const filtered = useMemo(
    () => bookings.filter((b) => allOn || activeStatuses.includes(b.status)),
    [bookings, activeStatuses, allOn]
  );

  /* ── Calendar navigation ────────────────────────────────────── */
  const navigate = (dir) => {
    if (view === "month") setCurrentDate((d) => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, dir));
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

  /* ── Stats ─────────────────────────────────────────────────── */
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBks = filtered.filter((b) => matchesDay(b, mod, todayStr));

  const stats = useMemo(() => {
    const s = {};
    Object.keys(SM).forEach((k) => { s[k] = filtered.filter((b) => b.status === k).length; });
    s.total = filtered.length;
    return s;
  }, [filtered, SM]);

  const pieData = Object.entries(SM)
    .map(([k, v]) => ({ name: v.label, value: stats[k] || 0, color: v.color }))
    .filter((d) => d.value > 0);

  const toggleStatus = (st) =>
    setActiveStatuses((p) => p.includes(st) ? p.filter((x) => x !== st) : [...p, st]);

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading && !showStore) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        flex: 1, gap: 16, background: T.bg,
        fontFamily: T.font,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: `linear-gradient(135deg, ${mod.accent}28, ${mod.accent}08)`,
          border: `1px solid ${mod.accent}28`,
          boxShadow: `0 0 40px ${mod.accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <mod.icon size={22} color={mod.accent} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
            Loading {mod.label}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            Fetching latest data…
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: mod.accent,
              animation: "bounce 1.2s ease infinite",
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-8px); opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", background: T.bg, fontFamily: T.font }}>
      {/* ── Filter sidebar ───────────────────────────────────── */}
      {sidebarOpen && (
        <FilterSidebar
          view={view} setView={setView}
          SM={SM} activeStatuses={activeStatuses} toggleStatus={toggleStatus}
          stats={stats} mod={mod} todayBks={todayBks}
        />
      )}

      <main style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* ── Toolbar ─────────────────────────────────────── */}
        {!showHearse && !showStore && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px",
          background: T.toolbar,
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          {/* Nav arrows (legacy calendar tabs only) */}
          {!(showMini || showHearse) && (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={() => navigate(-1)}
              style={{
                background: "rgba(15,23,42,0.04)", border: `1px solid ${T.border}`,
                padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                color: T.textSec, fontSize: 13, lineHeight: 1,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,23,42,0.04)"; e.currentTarget.style.color = T.textSec; }}
            >‹</button>
            <button onClick={() => setCurrentDate(new Date())}
              style={{
                background: "rgba(15,23,42,0.04)", border: `1px solid ${T.border}`,
                padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                color: T.textSec, fontSize: 11, fontWeight: 600,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,23,42,0.04)"; e.currentTarget.style.color = T.textSec; }}
            >Today</button>
            <button onClick={() => navigate(1)}
              style={{
                background: "rgba(15,23,42,0.04)", border: `1px solid ${T.border}`,
                padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                color: T.textSec, fontSize: 13, lineHeight: 1,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,23,42,0.04)"; e.currentTarget.style.color = T.textSec; }}
            >›</button>
          </div>
          )}

          {/* Title */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
              {chartsOpen ? `${mod.label} — Analytics` : calTitle()}
            </div>
            {!chartsOpen && (
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontFamily: "monospace" }}>
                {filtered.length} records · {todayBks.length} today
              </div>
            )}
          </div>

          {/* View tabs (legacy calendar tabs only) */}
          {!chartsOpen && !(showMini || showHearse) && (
            <div style={{
              display: "flex", alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${T.border}`,
              borderRadius: 11, padding: 3, gap: 2,
            }}>
              {VIEWS.map(({ id, label }) => (
                <ViewBtn
                  key={id} id={id} label={label}
                  active={view === id} accent={mod.accent}
                  onClick={() => setView(id)}
                />
              ))}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ToolBtn
              onClick={() => setChartsOpen(o => !o)}
              title={chartsOpen ? "Show Calendar" : "Show Analytics"}
              active={chartsOpen}
              accent={mod.accent}
            >
              <span style={{ fontSize: 12 }}>📊</span>
              <span>{chartsOpen ? "Calendar" : "Analytics"}</span>
            </ToolBtn>
            <ToolBtn
              onClick={() => setSidebarOpen(o => !o)}
              title="Filters"
              active={sidebarOpen}
              accent={mod.accent}
            >
              <span style={{ fontSize: 12 }}>⚙</span>
              <span>Filter</span>
            </ToolBtn>
            <button onClick={load} title="Refresh"
              style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                padding: "7px 9px", borderRadius: 10, cursor: "pointer",
                color: T.textSec, fontSize: 13, lineHeight: 1,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(15,23,42,0.08)"; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSec; }}
            >↻</button>
          </div>
        </div>
        )}

        {/* ── KPI strip ──────────────────────────────────────── */}
        {!showHearse && !showStore && (
        <div style={{
          display: "flex", alignItems: "stretch", gap: 12,
          padding: "14px 18px",
          background: T.bg,
          borderBottom: `1px solid ${T.borderSubtle}`,
          overflowX: "auto", flexShrink: 0,
          scrollbarWidth: "none",
        }}>
          <KpiCard label="Total" value={stats.total || 0} color={mod.accent} Icon={mod.icon} />
          {mod.kpiFields.map(({ key, label, icon: Icon }) => (
            <KpiCard
              key={key}
              label={label}
              value={stats[key] || 0}
              color={SM[key]?.color || mod.accent}
              Icon={Icon}
            />
          ))}
        </div>
        )}

        {/* ── Main content ──────────────────────────────────── */}
        {showStore ? (
          <>
            <Ctx.Provider value={storeCtx}>
              <StoreTab />
            </Ctx.Provider>
            <Toasts toasts={storeToasts} />
          </>
        ) : chartsOpen ? (
          <div style={{ flex: 1, overflow: "auto", background: T.bg }}>
            <ChartsPanel
              pieData={pieData} stats={stats} SM={SM} mod={mod} bookings={filtered}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: 16, background: T.bg, position: "relative" }}>
            {/* ── Scoped calendars: mini (coffins · deceased tabs) + hearse FullCalendar (hearse tab) ── */}
            {(showMini || showHearse) && (
              <>
                <style>{`
                  .unified-cal{display:flex;gap:16px;margin-bottom:16px;align-items:flex-start}
                  .unified-cal .cal-mini-card{flex:0 0 auto;width:100%;max-width:340px}
                  .unified-cal .cal-wide-card{flex:1;min-width:0}
                  @media(max-width:900px){.unified-cal{flex-direction:column}.unified-cal .cal-mini-card{max-width:none}}
                `}</style>
                <div className="unified-cal">
                  {showMini && (
                    <div className="cal-mini-card" style={{
                      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
                      padding: "14px 14px 18px", display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Coffin Bookings · Deceased</span>
                        <span style={{ display: "flex", gap: 10, fontSize: 10, fontWeight: 600, color: T.textSec }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6" }} />Coffins
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />Deceased
                          </span>
                        </span>
                      </div>
                      <MiniActivityCalendar events={miniEvents} loading={calLoading} />
                    </div>
                  )}
                  {showHearse && (
                    <div style={{ width: "100%", minWidth: 0 }}>
                      {/* The full hearse bookings dashboard — stats, analytics,
                          filter and calendar all render together from the module. */}
                      <HearseBookings />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Legacy module calendar — only on tabs without a scoped calendar ── */}
            {!(showMini || showHearse) && (
              <>
                {view === "month" && (
                  <MonthView currentDate={currentDate} bookings={filtered} mod={mod}
                    onSelect={setSelected} onShowDay={setDayEvents} />
                )}
                {view === "week" && (
                  <WeekView currentDate={currentDate} bookings={filtered} mod={mod}
                    onSelect={setSelected} onShowDay={setDayEvents} />
                )}
                {view === "day" && (
                  <DayView currentDate={currentDate} bookings={filtered} mod={mod}
                    onSelect={setSelected} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Panels */}
      {dayEvents && (
        <DayEventsPanel
          date={dayEvents} bookings={filtered} mod={mod}
          onSelect={setSelected} onClose={() => setDayEvents(null)}
        />
      )}
      {selected && (
        <DetailPanel booking={selected} mod={mod} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
