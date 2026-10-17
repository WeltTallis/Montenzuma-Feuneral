import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  DollarSign,
  Clock,
  Users,
  ShieldAlert,
} from "lucide-react";

import "./dashboard.css";
import "./shell/shell.css";
import "./florist/flowers.css";
import "./metis-design.css";
import "./dashboard-redesign.css";

import { useCaseData } from "./useCaseData";
import { schedulePeriod } from "./schedulePeriod";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

import {
  DOWF, DOWM, MO, TYPE_C, addDays, baseList, buildCases, calcStats, eventsOf,
  initials, isReleased, matchPill, nowClock, pad, pillsFor, searchMatch,
  todayKey,
} from "./opsData";
import { TipBox, useTooltip } from "./opsBits";
import { Ic } from "./opsIcons";
import { OperationsView, RegisterView } from "./opsViews";
import { AnalyticsView } from "./opsAnalytics";
import { CaseDrawer, ModalHost } from "./opsPanels";
import WorkshopPanel from "./WorkshopPanel";
import StoreSection from "./StoreSection";
import FlowerAnalytics from "./florist/FlowerAnalytics";
import SimpleCoffinInventory from "./SimpleCoffinInventory";
import DeceasedScheduleCalendar, { MOCK_EVENTS } from "./HearseCalendar";
import DashSidebar, { NAV_ITEMS } from "./shell/DashSidebar";

/* Sidebar view → the ops section it lands on. */
const VIEW_SECTION = { home: "command", deceased: "intake" };

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

/* Calendar chip / row styling per event type (mirrors the flowbite palette). */
const CAL_TYPE = {
  intake: { label: "Body Intake", status: "confirmed", color: "#2563eb", bg: "#eff6ff", icon: <Users size={12} /> },
  release: { label: "Body Release", status: "completed", color: "#047857", bg: "#ecfdf5", icon: <ShieldAlert size={12} /> },
  pm: { label: "Postmortem Exam", status: "scheduled", color: "#E36414", bg: "#fffbeb", icon: <Activity size={12} /> },
  funeral: { label: "Funeral Service", status: "scheduled", color: "#7c3aed", bg: "#faf5ff", icon: <Calendar size={12} /> },
  transfer: { label: "Hearse Transfer", status: "in_transit", color: "#2563eb", bg: "#eff6ff", icon: <Clock size={12} /> },
};

const DARK_KEY = "rpd-ops-dark";
const NAV_COLLAPSE_KEY = "rpd-nav-collapsed";
const NAV_VIEW_KEY = "rpd-nav-view";

/* The ops sub-section nav inside the Home/Deceased pages. Short labels: this
   row shares the toolbar with search, branch, schedule and avatar. */
const NAV = [
  { id: "command", label: "Operations", icon: "cal", full: "Operations" },
  { id: "intake", label: "Intake", icon: "bed", full: "Intake Register" },
  { id: "release", label: "Release", icon: "heart", full: "Releases & Transfers" },
  { id: "pm", label: "PM", icon: "vial", full: "Postmortem Requests" },
  { id: "analytics", label: "Analytics", icon: "grid", full: "Analytics" },
];

const DONUT_COLORS = ["#2563eb", "#E36414", "#5F0F40", "#047857"];

/* ── stat card ── */
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rpd-stat">
      <div className="rpd-stat-wrap" style={{ borderColor: color }}>
        <div className="rpd-stat-ic" style={{ background: `${color}1a`, color }}>
          <Icon size={16} />
        </div>
        <div className="rpd-stat-body">
          <div className="rpd-stat-lbl">{label}</div>
          <div className="rpd-stat-val">{value}</div>
          {sub != null && <div className="rpd-stat-sub">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── KPI cards + charts band shown at the top of the main column ── */
function StatsBand({ calc, money, ccy, onNavView }) {
  const care = calc.care || {};
  const charges = calc.charges || {};
  const nowYear = new Date().getFullYear();

  const totalInCare = care.inCare || 0;
  const totalReleased = care.released || 0;
  const storageCap = charges.storageCapacity || 40;
  const occupancy = storageCap > 0 ? Math.round((totalInCare / storageCap) * 100) : 0;

  const kpis = [
    { icon: Users, label: "Total Cases", value: calc.total, sub: "All branches", color: "#2563eb" },
    { icon: Clock, label: "In Care", value: totalInCare, sub: "Awaiting release", color: "#047857" },
    { icon: ShieldAlert, label: "PM Pending", value: care.pmReq, sub: "Postmortem requests", color: "#E36414" },
    { icon: DollarSign, label: "Storage Accrued", value: money(charges.accrued), sub: ccy, color: "#7c3aed" },
    { icon: PieChartIcon, label: "Coffin Occupancy", value: `${occupancy}%`, sub: `${totalInCare} / ${storageCap}`, color: "#5F0F40" },
  ];

  const donutData = [
    { name: "In care", value: totalInCare },
    { name: "PM pending", value: care.pmReq },
    { name: "PM done", value: care.pmDone },
    { name: "Released", value: totalReleased },
  ].filter((d) => d.value > 0);

  const barData = [
    { month: "Jan", stored: 12, released: 5 },
    { month: "Feb", stored: 15, released: 8 },
    { month: "Mar", stored: 11, released: 12 },
    { month: "Apr", stored: 18, released: 9 },
    { month: "May", stored: 14, released: 14 },
    { month: "Jun", stored: 17, released: 11 },
  ];

  const quickActions = [
    { label: "Coffin Store", icon: <PieChartIcon size={14} />, color: "#5F0F40", onClick: () => onNavView && onNavView("coffin-store") },
    { label: "Hearse Calendar", icon: <Calendar size={14} />, color: "#2563eb", onClick: () => onNavView && onNavView("calendar") },
    { label: "Workshop", icon: <Activity size={14} />, color: "#047857", onClick: () => onNavView && onNavView("workshop") },
    { label: "Flowers", icon: <TrendingUp size={14} />, color: "#7c3aed", onClick: () => onNavView && onNavView("flowers") },
  ];

  return (
    <section className="rpd-band">
      <div className="rpd-band-grid">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="rpd-band-actions">
        {quickActions.map((a) => (
          <button
            key={a.label}
            className="rpd-action-btn"
            style={{ borderColor: a.color, color: a.color }}
            onClick={a.onClick}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      <div className="rpd-band-charts">
        <div className="rpd-chart">
          <div className="rpd-chart-head">
            <div className="rpd-chart-title"><TrendingUp size={14} /> Monthly flow</div>
            <div className="rpd-chart-sub">Intake vs releases · {nowYear}</div>
          </div>
          <div className="rpd-chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={calc.flow || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="adm" name="Intakes" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rel" name="Releases" stroke="#047857" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rpd-chart">
          <div className="rpd-chart-head">
            <div className="rpd-chart-title"><PieChartIcon size={14} /> Case status</div>
            <div className="rpd-chart-sub">Bodies currently in care</div>
          </div>
          <div className="rpd-chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={98}
                  startAngle={0}
                  endAngle={360}
                  labelLine={false}
                >
                  {DONUT_COLORS.map((fill, i) => (
                    <Cell key={i} fill={fill} />
                  ))}
                  <Tooltip />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rpd-chart">
          <div className="rpd-chart-head">
            <div className="rpd-chart-title"><BarChartIcon size={14} /> Coffin storage</div>
            <div className="rpd-chart-sub">Stored vs released by month</div>
          </div>
          <div className="rpd-chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stored" name="Stored" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="released" name="Released" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard({ tenantSlug = "", tenantData } = {}) {
  const { cases, loading, reload } = useCaseData();
  const navigate = useNavigate();
  const location = useLocation();

  const [section, setSection] = useState("command");
  const [navView, setNavView] = useState(() => {
    try {
      const v = localStorage.getItem(NAV_VIEW_KEY);
      return NAV_ITEMS.some((n) => n.id === v) ? v : "home";
    } catch { return "home"; }
  });


  const isModuleView =
    navView === "store" || navView === "workshop" || navView === "flowers" || navView === "coffin-store" || navView === "calendar";
  const [view, setView] = useState("month");
  const [selDate, setSelDate] = useState(todayKey());
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  const [clickedDay, setClickedDay] = useState(null);
  const [todayMode, setTodayMode] = useState(false);
  const [dayTab, setDayTab] = useState("all");
  const [filters, setFilters] = useState([]);
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === "1"; } catch { return false; }
  });



  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Newest FIRST. `sortRegisters` multiplies by `dir`, so d:1 was ascending —
  // the record just registered sank to the BOTTOM of the register and the
  // oldest body sat on top. Every register section is a "what just happened" log,
  // so the default has to read newest → oldest.
  const [sorts, setSorts] = useState({
    intake: { f: "date", d: -1 },
    release: { f: "date", d: -1 },
    pm: { f: "date", d: -1 },
  });
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(nowClock());
  const contentScrollRef = useRef(null);

  const tooltip = useTooltip();
  const today = todayKey();
  /* derived data */
  const branchOptions = useMemo(() => {
    const out = [];
    cases.forEach((c) => { if (c.branch && !out.includes(c.branch)) out.push(c.branch); });
    return out;
  }, [cases]);

  const scoped = useMemo(
    () => (branch ? cases.filter((c) => c.branch === branch) : cases),
    [cases, branch]
  );
  const searched = useMemo(() => scoped.filter((c) => searchMatch(c, search)), [scoped, search]);
  const calc = useMemo(() => calcStats(scoped, searched, calM, calY), [
    scoped,
    searched,
    calM,
    calY,
  ]);

  /* ── calendar events from real case data (demo data when empty) ───────── */
  const calendarEvents = useMemo(() => {
    const raw = eventsOf(scoped);
    if (!raw.length) return MOCK_EVENTS;
    return raw.map((e, i) => {
      const p = e.p;
      const m = CAL_TYPE[e.t] || CAL_TYPE.intake;
      const released = p.release || {};
      return {
        id: `evt-${p.uid}-${e.t}-${e.date}-${i}`,
        uid: p.uid,
        type: e.t,
        date: e.date,
        time: e.time,
        title: m.label,
        status: e.t === "release" ? (released.status || m.status) : m.status,
        note:
          e.t === "release"
            ? `Released → ${released.dest || "—"}`
            : `${m.label} · ${p.branch || "—"}`,
        branch: p.branch || "",
        deceased: {
          id: p.uid,
          name: p.name || "Unknown",
          age: p.age != null ? p.age : "",
          branch: p.branch || "",
          sex: p.sex || "",
          hearse: p.hearse || "",
        },
      };
    });
  }, [scoped]);

  /* ── currency formatting ── */
  const ccy = calc.charges?.currency || "KES";
  const money = (n) => {
    const v = Number(n) || 0;
    return v > 0 ? `${ccy} ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "—";
  };

  /* calendar dots — branch-scoped, one dot per event type per day */
  const calendarDots = useMemo(() => {
    const map = {};
    eventsOf(scoped).forEach((e) => {
      if (!e.date) return;
      if (!map[e.date]) map[e.date] = [];
      if (!map[e.date].includes(e.t)) map[e.date].push(e.t);
    });
    return map;
  }, [scoped]);

  /* The drawer is keyed on the branch-scoped `uid`, not the admission number —
     two branches can legitimately hold the same admission number, and matching
     on the bare number opened whichever row happened to come first. */
  const drawerCase = useMemo(
    () => (drawer ? cases.find((c) => c.uid === drawer.uid) || null : null),
    [drawer, cases]
  );

  /* badge counts mirror the reference's toolbar pill badges */
  const badges = {
    intake: cases.filter((c) => !isReleased(c) && c.admDate && c.admDate <= today).length,
    release: cases.filter(isReleased).length,
    pm: cases.filter((c) => c.pm).length,
  };

  const avatarText = initials(tenantData?.name || tenantData?.tenant_name || tenantSlug || "RestPoint");
  const isAnalyticsPeriod = section === "analytics" && (view === "day" || view === "week");
  const isBoardPeriod = section === "command" && (view === "day" || view === "week");
  const analyticsPeriod = schedulePeriod(view, selDate);
  const analyticsPeriodEventCount = useMemo(() => {
    if (view !== "day" && view !== "week") return 0;
    const dayKeys = view === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(analyticsPeriod.startKey, index))
      : [analyticsPeriod.startKey];
    const daySet = new Set(dayKeys);
    return eventsOf(searched).filter((event) => daySet.has(event.date)).length;
  }, [analyticsPeriod.startKey, searched, view]);

  const shellUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);
  const activeNavMeta = NAV_ITEMS.find((n) => n.id === navView) || NAV_ITEMS[0];
  const showOpsToolbar = !isModuleView;
  /* effects */
  useEffect(() => {
    try { localStorage.setItem(DARK_KEY, dark ? "1" : "0"); } catch { /* storage blocked */ }
  }, [dark]);

  /* Sidebar collapse + last destination persist across reloads. */
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try { return localStorage.getItem(NAV_COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(NAV_COLLAPSE_KEY, navCollapsed ? "1" : "0"); } catch { /* storage blocked */ }
  }, [navCollapsed]);
  useEffect(() => {
    try { localStorage.setItem(NAV_VIEW_KEY, navView); } catch { /* storage blocked */ }
  }, [navView]);
  useEffect(() => {
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  }, [navView, section]);
  useEffect(() => {
    const id = setInterval(() => setNow(nowClock()), 30000);
    return () => clearInterval(id);
  }, []);

  /* Keep the schedule on *today* when the dashboard is left open across
     midnight: if the day changes and the view was sitting on yesterday's
     "today", roll the selection (and the sidebar calendar) forward. */
  const lastToday = useRef(today);
  useEffect(() => {
    if (lastToday.current === today) return;
    const wasOnToday = selDate === lastToday.current;
    lastToday.current = today;
    if (!wasOnToday) return;
    setSelDate(today);
    setCalY(Number(today.slice(0, 4)));
    setCalM(Number(today.slice(5, 7)) - 1);
  }, [today, selDate]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setModal(null); setDrawer(null); }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("rpd-search")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  /* handlers */
  const openCase = useCallback((uid, ctx) => {
    const selectedCase = cases.find((item) => item.uid === uid);
    const profileId =
      selectedCase?.id ||
      selectedCase?.raw?.id ||
      selectedCase?.raw?.deceased_id ||
      selectedCase?.raw?.deceasedId;
    const profileBranchSlug = selectedCase?.raw?._branchSlug || tenantSlug;
    const profileTenantSlug =
      tenantSlug || localStorage.getItem("tenantSlug") || localStorage.getItem("tenant_slug");

    if (profileId && profileTenantSlug && profileBranchSlug) {
      navigate(
        `/${profileTenantSlug}/deceased?id=${encodeURIComponent(profileId)}&branch=${encodeURIComponent(profileBranchSlug)}`,
        {
          state: {
            from: `${location.pathname}${location.search}`,
            profileBranchSlug,
          },
        }
      );
      return;
    }
    setDrawer({ uid, ctx: ctx || "intake" });
  }, [cases, location.pathname, location.search, navigate, tenantSlug]);
  const openModal = useCallback((key) => setModal(key), []);

  const pickDay = useCallback((key) => {
    setClickedDay(key);
    setSelDate(key);
    setDayTab("all");
    setTodayMode(false);
  }, []);

  const onMonthNav = (dir) => {
    let m = calM + dir;
    let y = calY;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalM(m);
    setCalY(y);
    setSelDate(`${y}-${pad(m + 1)}-01`);
    setClickedDay(null);
    setDayTab("all");
  };

  const goToday = () => {
    setTodayMode(false);
    setSelDate(today);
    setClickedDay(null);
    setDayTab("all");
    if (section !== "analytics") {
      setSection("command");
      setView("day");
    }
    setCalY(Number(today.slice(0, 4)));
    setCalM(Number(today.slice(5, 7)) - 1);
  };

  const togglePill = (key) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  // Clicking a NEW column starts it in the order people expect from that column:
  // a date column reads newest-first (the same default the register opens with),
  // while name and status read A→Z. Clicking the column that is already active
  // simply flips the direction.
  const onSort = (field) =>
    setSorts((prev) => {
      const s = prev[section] || { f: "date", d: -1 };
      return {
        ...prev,
        [section]: s.f === field ? { f: field, d: s.d * -1 } : { f: field, d: field === "date" ? -1 : 1 },
      };
    });

  const doRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
    setToast("Refreshed");
  };

  const onNav = (id) => {
    setSection(id);
    setFilters([]);
    setTodayMode(false);
  };

  /* Sidebar destination picker: home/deceased stay in the ops pages (Home is
     the main operations board, Deceased lands on the intake register);
     store/workshop/flowers swap the main column. Closes the mobile drawer. */
  const onNavView = (id) => {
    if (VIEW_SECTION[id]) {
      setSection(VIEW_SECTION[id]);
      setFilters([]);
      setTodayMode(false);
    } else if (id !== "home" && id !== "deceased") {
      setSection("command");
      setFilters([]);
      setTodayMode(false);
    }
    setNavView(id);
    setNavOpen(false);
  };

  const setV = (id) => {
    setView(id);
    setClickedDay(null);
    setDayTab("all");
    setTodayMode(false);
  };

  const stepPeriod = (dir) => {
    if (view === "month") {
      onMonthNav(dir);
      return;
    }
    const next = addDays(selDate, (view === "week" ? 7 : 1) * dir);
    setSelDate(next);
    setCalY(Number(next.slice(0, 4)));
    setCalM(Number(next.slice(5, 7)) - 1);
    setClickedDay(null);
    setDayTab("all");
    setTodayMode(false);
  };
  return (
    <div className={`rpd${dark ? " dark" : ""}${section === "analytics" ? " no-side" : ""}${navOpen ? " rpd-nav-open" : ""}`}>
      <div className="app">
        <DashSidebar
          active={navView}
          collapsed={navCollapsed}
          onNavigate={onNavView}
          onToggleCollapse={() => setNavCollapsed((c) => !c)}
          onCloseMobile={() => setNavOpen(false)}
          user={shellUser}
          tenantSlug={tenantSlug}
        />
        <div className="rpd-body">
          <div className="rpd-main">
            <Header
              activeNavMeta={activeNavMeta}
              showOpsToolbar={showOpsToolbar}
              section={section}
              view={view}
              isBoardPeriod={isBoardPeriod}
              isAnalyticsPeriod={isAnalyticsPeriod}
              analyticsPeriod={analyticsPeriod}
              analyticsPeriodEventCount={analyticsPeriodEventCount}
              badges={badges}
              NAV={NAV}
              VIEWS={VIEWS}
              search={search}
              branch={branch}
              branchOptions={branchOptions}
              cases={cases}
              today={today}
              now={now}
              dark={dark}
              refreshing={refreshing}
              navOpen={navOpen}
              setNavOpen={setNavOpen}
              setDark={setDark}
              doRefresh={doRefresh}
              setSearch={setSearch}
              setBranch={setBranch}
              setView={setView}
              setSection={setSection}
              setTodayMode={setTodayMode}
              setCalY={setCalY}
              setCalM={setCalM}
              setSelDate={setSelDate}
              setClickedDay={setClickedDay}
              setDayTab={setDayTab}
              goToday={goToday}
              stepPeriod={stepPeriod}
              onNav={onNav}
              togglePill={togglePill}
              setV={setV}
              avatarText={avatarText}
            />
            {navView === "home" ? (
              <StatsBand calc={calc} money={money} ccy={ccy} onNavView={onNavView} />
            ) : null}
            <div className="rpd-scroll" ref={contentScrollRef}>
      {/* ops sidebar + main */}
      <div className="shell">
        {showOpsToolbar && section !== "analytics" ? (
          <aside className="side">
            <Sidebar
              calc={calc}
              scoped={scoped}
              section={section}
              filters={filters}
              onTogglePill={togglePill}
              onOpenModal={openModal}
              calY={calY}
              calM={calM}
              calendarDots={calendarDots}
              selDay={selDate}
              today={today}
              onPickDay={pickDay}
              view={view}
              onViewChange={setV}
              period={analyticsPeriod}
              eventCount={analyticsPeriodEventCount}
              onToday={goToday}
              onStep={stepPeriod}
            />
          </aside>
        ) : null}

        <main className={`mains${isAnalyticsPeriod ? " analytics-period" : ""}${isBoardPeriod ? " schedule-mode" : ""}`}>
          {navView === "store" ? (
            <StoreSection />
          ) : navView === "workshop" ? (
            <WorkshopPanel onExit={() => onNavView("home")} />
          ) : navView === "flowers" ? (
            <FlowerAnalytics />
          ) : navView === "coffin-store" ? (
            <SimpleCoffinInventory />
          ) : navView === "calendar" ? (
            <DeceasedScheduleCalendar events={calendarEvents} onEventSelect={(e) => {}} />
          ) : loading && !cases.length ? (
            <div className="empty" style={{ padding: 90 }}>
              <span className="spin" style={{ color: "var(--acc)" }}>
                <Ic n="sync" s={22} />
              </span>
              <span style={{ fontSize: 12 }}>Loading operations…</span>
            </div>
          ) : section === "analytics" ? (
            <AnalyticsView
              calc={calc}
              people={searched}
              branch={branch}
              calY={calY}
              view={view}
              selDate={selDate}
              dayTab={dayTab}
              now={now}
              today={today}
              onOpenModal={openModal}
              onOpenCase={openCase}
              onPickDay={(key) => {
                setView("day");
                setSelDate(key);
                setClickedDay(null);
                setDayTab("all");
                setTodayMode(false);
              }}
              onDayTabChange={setDayTab}
            />
          ) : section === "command" ? (
            <OperationsView
              searched={searched}
              calc={calc}
              state={{
                view,
                selDate,
                clickedDay,
                todayMode,
                filters,
                calM,
                calY,
                dayTab,
              }}
              now={now}
              today={today}
              onOpenCase={openCase}
              onClearDay={() => setClickedDay(null)}
              onPickDay={(key) => {
                setView("day");
                setSelDate(key);
                setClickedDay(null);
                setDayTab("all");
                setTodayMode(false);
              }}
              onDayTabChange={setDayTab}
            />
          ) : (
            <RegisterView
              section={section}
              people={scoped}
              searched={searched}
              filters={filters}
              sort={sorts[section]}
              onSort={onSort}
              onOpenCase={openCase}
            />
          )}
        </main>
      </div>
      {/* overlays */}
      <ModalHost
        modalKey={modal}
        people={searched}
        calc={calc}
        onClose={() => setModal(null)}
        onOpenCase={(uid) => { setModal(null); openCase(uid, "intake"); }}
        onOpenModal={openModal}
      />

      <CaseDrawer record={drawerCase} ctx={drawer?.ctx} onClose={() => setDrawer(null)} />

      <div className={`te${toast ? " show" : ""}`}>{toast}</div>
      <TipBox tip={tooltip} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
