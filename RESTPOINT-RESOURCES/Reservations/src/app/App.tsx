import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  CalendarDays,
  Phone,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  isToday,
} from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type Status = "confirmed" | "pending" | "completed" | "cancelled";

interface Booking {
  id: string;
  clientName: string;
  phone: string;
  coffinType: string;
  date: Date;
  time: string;
  status: Status;
  price: number;
  notes: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COFFIN_TYPES = [
  "Oak Classic",
  "Mahogany Deluxe",
  "Pine Heritage",
  "Walnut Premium",
  "White Chapel",
  "Willow Wicker",
  "Metal Bronze",
  "Eco Cardboard",
];

const PRICES: Record<string, number> = {
  "Oak Classic": 1800,
  "Mahogany Deluxe": 3200,
  "Pine Heritage": 1200,
  "Walnut Premium": 2800,
  "White Chapel": 2200,
  "Willow Wicker": 950,
  "Metal Bronze": 2600,
  "Eco Cardboard": 800,
};

const STATUS_CFG: Record<
  Status,
  { label: string; lightCls: string; darkCls: string; dot: string; icon: React.ReactNode }
> = {
  confirmed: {
    label: "Confirmed",
    lightCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    darkCls: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending: {
    label: "Pending",
    lightCls: "bg-amber-50 text-amber-700 border-amber-200",
    darkCls: "bg-amber-900/30 text-amber-400 border-amber-800",
    dot: "bg-amber-500",
    icon: <Clock className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    lightCls: "bg-slate-100 text-slate-600 border-slate-200",
    darkCls: "bg-slate-800 text-slate-400 border-slate-700",
    dot: "bg-slate-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    lightCls: "bg-red-50 text-red-600 border-red-200",
    darkCls: "bg-red-900/30 text-red-400 border-red-800",
    dot: "bg-red-400",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#94a3b8", "#f87171"];

const FIRST_NAMES = [
  "Margaret", "Robert", "Eleanor", "James", "Dorothy", "William",
  "Florence", "Charles", "Edith", "Henry", "Mildred", "George",
  "Beatrice", "Thomas", "Violet", "Arthur", "Constance", "Harold",
  "Lillian", "Albert", "Catherine", "Edward", "Frances", "Walter",
];
const LAST_NAMES = [
  "Thompson", "Williams", "Johnson", "Davies", "Evans", "Smith",
  "Brown", "Taylor", "Jones", "Wilson", "Harris", "Martin",
  "Clark", "Lewis", "Robinson", "Walker", "White", "Hall",
  "Young", "King",
];
const NOTES_POOL = [
  "Family requests specific flower arrangement.",
  "Graveside service included.",
  "Transport from hospital required.",
  "Out-of-town family — confirm by phone.",
  "", "", "", "", "",
];

// ─── Data Generation ────────────────────────────────────────────────────────

function makeLCG(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function generateBookings(): Booking[] {
  const r = makeLCG(7331);
  const pick = <T>(arr: T[]): T => arr[Math.floor(r() * arr.length)];
  const today = new Date();

  const offsets = [
    -22, -21, -19, -18, -18, -17, -16, -15, -14, -14, -13, -12, -12,
    -11, -11, -10, -9, -9, -8, -8, -7, -7, -6, -6, -6, -5, -5, -4,
    -4, -3, -3, -3, -2, -2, -1, -1, -1, 0, 0, 0, 1, 1, 2, 2, 3, 3,
    4, 4, 5, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 22,
    25, 28, 30,
  ];

  return offsets
    .map((offset, i) => {
      const date = addDays(today, offset);
      const type = pick(COFFIN_TYPES);
      const hour = 8 + Math.floor(r() * 9);
      const mins = r() > 0.5 ? "30" : "00";
      const isPast = offset < 0;
      const isNear = offset >= 0 && offset <= 3;

      let status: Status;
      if (isPast) {
        status = r() > 0.13 ? "completed" : "cancelled";
      } else if (isNear) {
        const v = r();
        status = v < 0.55 ? "confirmed" : v < 0.85 ? "pending" : "confirmed";
      } else {
        const v = r();
        status =
          v < 0.45 ? "confirmed" : v < 0.72 ? "pending" : v < 0.9 ? "confirmed" : "cancelled";
      }

      const ac = String(Math.floor(r() * 900) + 100);
      const px = String(Math.floor(r() * 900) + 100);
      const ln = String(Math.floor(r() * 9000) + 1000);

      return {
        id: `BK-${String(i + 1).padStart(4, "0")}`,
        clientName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `+1 (${ac}) ${px}-${ln}`,
        coffinType: type,
        date,
        time: `${String(hour).padStart(2, "0")}:${mins}`,
        status,
        price: PRICES[type],
        notes: pick(NOTES_POOL),
      };
    })
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time)
    );
}

const ALL_BOOKINGS: Booking[] = generateBookings();

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Dark-mode shorthands ────────────────────────────────────────────────
  const dk = isDark;
  const bg0 = dk ? "bg-slate-950" : "bg-slate-50";
  const surf = dk ? "bg-slate-900" : "bg-white";
  const brd = dk ? "border-slate-800" : "border-slate-200";
  const hov = dk ? "hover:bg-slate-800" : "hover:bg-slate-100";
  const txt = dk ? "text-slate-100" : "text-slate-900";
  const muted = dk ? "text-slate-400" : "text-slate-500";
  const chip = dk ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600";

  const tooltipStyle: React.CSSProperties = {
    background: dk ? "#0f172a" : "#ffffff",
    border: `1px solid ${dk ? "#1e293b" : "#e2e8f0"}`,
    borderRadius: "8px",
    fontSize: "11px",
    color: dk ? "#e2e8f0" : "#0f172a",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    if (view === "day") setSelectedDate((d) => addDays(d, dir * 7));
    else if (view === "week")
      setSelectedDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else
      setSelectedDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  }

  // ── Calendar strip days ─────────────────────────────────────────────────
  const calendarDays = useMemo<Date[]>(() => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      });
    }
    if (view === "month") {
      return eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      });
    }
    return eachDayOfInterval({
      start: subDays(selectedDate, 10),
      end: addDays(selectedDate, 20),
    });
  }, [view, selectedDate]);

  // ── Visible bookings ────────────────────────────────────────────────────
  const visibleBookings = useMemo<Booking[]>(() => {
    return ALL_BOOKINGS.filter((b) => {
      if (view === "day") return isSameDay(b.date, selectedDate);
      if (view === "week")
        return isSameWeek(b.date, selectedDate, { weekStartsOn: 1 });
      return isSameMonth(b.date, selectedDate);
    });
  }, [view, selectedDate]);

  // ── Labels ──────────────────────────────────────────────────────────────
  const periodLabel = useMemo<string>(() => {
    if (view === "day") return format(selectedDate, "EEEE, MMMM d, yyyy");
    if (view === "week") {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  }, [view, selectedDate]);

  const stripLabel = useMemo<string>(() => {
    if (view === "week") {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return `Week of ${format(s, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  }, [view, selectedDate]);

  // ── Booking count per day ───────────────────────────────────────────────
  const bookingsPerDay = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    ALL_BOOKINGS.forEach((b) => {
      const key = format(b.date, "yyyy-MM-dd");
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, []);

  // ── Stats (current month) ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = ALL_BOOKINGS.filter((b) => isSameMonth(b.date, now));
    return {
      total: thisMonth.length,
      pending: ALL_BOOKINGS.filter((b) => b.status === "pending").length,
      revenue: thisMonth
        .filter((b) => b.status === "completed")
        .reduce((s, b) => s + b.price, 0),
      today: ALL_BOOKINGS.filter((b) => isToday(b.date)).length,
    };
  }, []);

  // ── Chart data ──────────────────────────────────────────────────────────
  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_BOOKINGS.forEach((b) => {
      counts[b.coffinType] = (counts[b.coffinType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.split(" ")[0], full: name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const statusChartData = useMemo(() => {
    const counts: Record<Status, number> = {
      confirmed: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };
    ALL_BOOKINGS.forEach((b) => counts[b.status]++);
    return (["confirmed", "pending", "completed", "cancelled"] as Status[]).map(
      (s, i) => ({
        name: STATUS_CFG[s].label,
        value: counts[s],
        color: PIE_COLORS[i],
      })
    );
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`size-full ${dk ? "dark" : ""}`}>
      <div
        className={`size-full flex flex-col overflow-hidden font-sans
          ${dk ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
      >

        {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
        <header
          className={`flex-shrink-0 flex items-center justify-between
            px-5 py-3 border-b ${brd} ${surf}`}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center
                ${dk ? "bg-indigo-500/20" : "bg-indigo-100"}`}
            >
              <CalendarDays
                className={`w-5 h-5 ${dk ? "text-indigo-400" : "text-indigo-600"}`}
              />
            </div>
            <div>
              <p className={`text-sm font-bold leading-none ${txt}`}>CoffinBook</p>
              <p className={`text-[11px] leading-none mt-0.5 ${muted}`}>
                Arrangement Manager
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div
            className={`flex items-center rounded-xl p-1
              ${dk ? "bg-slate-800" : "bg-slate-100"}`}
          >
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  view === v
                    ? `${surf} ${txt} shadow-sm`
                    : `${muted} ${hov}`
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                ${brd} ${muted} ${hov}`}
            >
              Today
            </button>
            <button
              onClick={() => setIsDark((p) => !p)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors
                ${brd} ${muted} ${hov}`}
            >
              {dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* ═══ HORIZONTAL CALENDAR ════════════════════════════════════════ */}
        <section className={`flex-shrink-0 border-b ${brd} ${surf}`}>
          {/* Strip header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.12em] ${muted}`}
            >
              {stripLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => navigate(-1)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hov} ${muted}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(1)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hov} ${muted}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable day strip */}
          <div
            className={`flex pb-3 px-4 gap-1
              ${view === "week" ? "" : "overflow-x-auto"}`}
            style={{ scrollbarWidth: "none" }}
          >
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const count = bookingsPerDay[key] || 0;
              const isSel = isSameDay(day, selectedDate);
              const isT = isToday(day);
              const inRange =
                !isSel &&
                (view === "week"
                  ? isSameWeek(day, selectedDate, { weekStartsOn: 1 })
                  : view === "month"
                  ? isSameMonth(day, selectedDate)
                  : false);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    flex-shrink-0 flex flex-col items-center rounded-xl
                    px-2.5 py-2 transition-all
                    ${view === "week" ? "flex-1" : "min-w-[50px]"}
                    ${
                      isSel
                        ? "bg-indigo-600 text-white shadow-md"
                        : inRange
                        ? dk
                          ? "bg-slate-800"
                          : "bg-indigo-50"
                        : isT
                        ? dk
                          ? "bg-indigo-950/70 text-indigo-300"
                          : "bg-indigo-50 text-indigo-700"
                        : `${hov} ${dk ? "text-slate-300" : "text-slate-700"}`
                    }
                  `}
                >
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
                      isSel ? "text-indigo-200" : muted
                    }`}
                  >
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-sm font-extrabold leading-none ${
                      isSel
                        ? "text-white"
                        : isT
                        ? dk
                          ? "text-indigo-400"
                          : "text-indigo-600"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="h-4 mt-1 flex items-center justify-center">
                    {count > 0 ? (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSel
                            ? "bg-white/25 text-white"
                            : dk
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    ) : isT && !isSel ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          dk ? "bg-indigo-500" : "bg-indigo-400"
                        }`}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ MAIN CONTENT ════════════════════════════════════════════════ */}
        <div className={`flex-1 flex overflow-hidden ${bg0}`}>

          {/* ── Bookings Panel (left) ─────────────────────────────────── */}
          <div className={`w-[56%] flex flex-col border-r ${brd}`}>
            {/* Panel header */}
            <div
              className={`flex-shrink-0 flex items-center justify-between
                px-5 py-3 border-b ${brd} ${surf}`}
            >
              <div>
                <p className={`font-bold text-sm ${txt}`}>{periodLabel}</p>
                <p className={`text-xs ${muted} mt-0.5`}>
                  {visibleBookings.length}{" "}
                  {visibleBookings.length === 1 ? "booking" : "bookings"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(["confirmed", "pending", "completed", "cancelled"] as Status[]).map(
                  (s) => {
                    const n = visibleBookings.filter((b) => b.status === s).length;
                    if (!n) return null;
                    const c = STATUS_CFG[s];
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                        <span className={`text-xs font-semibold ${muted}`}>{n}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Booking list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {visibleBookings.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center h-48 gap-3 ${muted}`}
                >
                  <CalendarDays className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No bookings for this period</p>
                </div>
              ) : (
                visibleBookings.map((b) => {
                  const cfg = STATUS_CFG[b.status];
                  return (
                    <div
                      key={b.id}
                      className={`${surf} rounded-xl border ${brd} p-4
                        transition-shadow hover:shadow-md`}
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-3">
                        {/* Left: info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${chip}`}
                            >
                              {b.id}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1
                                text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  dk ? cfg.darkCls : cfg.lightCls
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className={`font-bold text-sm leading-snug ${txt}`}>
                            {b.clientName}
                          </p>
                          <p className={`text-xs ${muted} mt-0.5`}>{b.coffinType}</p>
                        </div>

                        {/* Right: price + datetime */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-extrabold ${txt}`}>
                            ${b.price.toLocaleString()}
                          </p>
                          <p className={`text-xs ${muted} mt-0.5`}>
                            {format(b.date, "MMM d")} &middot; {b.time}
                          </p>
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div
                        className={`mt-3 pt-3 border-t ${brd}
                          flex items-center gap-4 flex-wrap`}
                      >
                        <span className={`flex items-center gap-1.5 text-xs ${muted}`}>
                          <Phone className="w-3 h-3" />
                          {b.phone}
                        </span>
                        {b.notes && (
                          <span
                            className={`text-xs italic ${muted} truncate max-w-[220px]`}
                          >
                            {b.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Analytics Panel (right) ───────────────────────────────── */}
          <div className="w-[44%] overflow-y-auto p-4 space-y-4">

            {/* Stat cards 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "This Month",
                  value: stats.total,
                  sub: "bookings total",
                  icon: <Users className="w-4 h-4" />,
                  color: dk ? "text-indigo-400" : "text-indigo-600",
                  iconBg: dk ? "bg-indigo-900/40" : "bg-indigo-100",
                },
                {
                  label: "Pending",
                  value: stats.pending,
                  sub: "require action",
                  icon: <AlertCircle className="w-4 h-4" />,
                  color: dk ? "text-amber-400" : "text-amber-600",
                  iconBg: dk ? "bg-amber-900/40" : "bg-amber-100",
                },
                {
                  label: "Revenue",
                  value: `$${(stats.revenue / 1000).toFixed(1)}k`,
                  sub: "from completed",
                  icon: <DollarSign className="w-4 h-4" />,
                  color: dk ? "text-emerald-400" : "text-emerald-600",
                  iconBg: dk ? "bg-emerald-900/40" : "bg-emerald-100",
                },
                {
                  label: "Today",
                  value: stats.today,
                  sub: "scheduled",
                  icon: <TrendingUp className="w-4 h-4" />,
                  color: dk ? "text-sky-400" : "text-sky-600",
                  iconBg: dk ? "bg-sky-900/40" : "bg-sky-100",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${surf} rounded-xl border ${brd} p-4`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium ${muted}`}>{s.label}</span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.iconBg}`}
                    >
                      <span className={s.color}>{s.icon}</span>
                    </div>
                  </div>
                  <p className={`text-2xl font-extrabold leading-none ${txt}`}>
                    {s.value}
                  </p>
                  <p className={`text-xs ${muted} mt-1.5`}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Bar chart — coffin type */}
            <div className={`${surf} rounded-xl border ${brd} p-4`}>
              <p className={`text-sm font-bold ${txt} mb-4`}>
                Bookings by Coffin Type
              </p>
              <ResponsiveContainer width="100%" height={156}>
                <BarChart
                  data={typeChartData}
                  margin={{ top: 0, right: 4, bottom: 0, left: -28 }}
                  barSize={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={dk ? "#1e293b" : "#f1f5f9"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: dk ? "#94a3b8" : "#64748b",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: dk ? "#94a3b8" : "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, props) => [
                      value,
                      (props.payload as { full?: string }).full ?? _name,
                    ]}
                    cursor={{
                      fill: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={dk ? "#6366f1" : "#4f46e5"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart — status breakdown */}
            <div className={`${surf} rounded-xl border ${brd} p-4`}>
              <p className={`text-sm font-bold ${txt} mb-4`}>Status Breakdown</p>
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={54}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={2}
                      >
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5">
                  {statusChartData.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className={`text-xs ${muted}`}>{s.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${txt}`}>{s.value}</span>
                    </div>
                  ))}
                  <div
                    className={`pt-2.5 mt-1 border-t ${brd} flex justify-between items-center`}
                  >
                    <span className={`text-xs font-medium ${muted}`}>Total</span>
                    <span className={`text-sm font-extrabold ${txt}`}>
                      {ALL_BOOKINGS.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
