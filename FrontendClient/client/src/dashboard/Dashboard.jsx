import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Activity,
  Clock,
  Users,
  ShieldAlert,
} from "lucide-react";

import "./design-tokens.css";
import "./dashboard.css";
import "./shell/shell.css";
import "./florist/flowers.css";
import "./metis-design.css";
import "./dashboard-redesign.css";

import { useCaseData } from "./useCaseData";
import { schedulePeriod } from "./schedulePeriod";
import { Header } from "./Header";

import {
  DOWF, DOWM, MO, TYPE_C, addDays, baseList, buildCases, calcStats, eventsOf,
  initials, isReleased, matchPill, nowClock, pad, pillsFor, searchMatch,
  todayKey,
} from "./opsData";
import { TipBox, useTooltip } from "./opsBits";
import { Ic } from "./opsIcons";
import { RegisterView } from "./opsViews";
import { CaseDrawer, ModalHost } from "./opsPanels";
import StoreSection from "./StoreSection";
import FlowerAnalytics from "./florist/FlowerAnalytics";
import SimpleCoffinInventory from "./SimpleCoffinInventory";
import DeceasedScheduleCalendar from "./HearseCalendar";
import DashboardOverview from "./DashboardOverview";
import DashSidebar, { NAV_ITEMS } from "./shell/DashSidebar";
const FleetDashboard = lazy(() => import("../components/hearse/FleetDashboard"));

/* Sidebar view → the ops section it lands on. */
const VIEW_SECTION = { overview: "command", "release-calendar": "command", fleet: "command" };

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

/* Calendar chip / row styling per event type (mirrors the flowbite palette). */
const CAL_TYPE = {
  intake: { label: "Body Intake", status: "confirmed", color: "#1d4ed8", bg: "#eff6ff", icon: <Users size={12} /> },
  release: { label: "Body Release", status: "completed", color: "#059669", bg: "#ecfdf5", icon: <ShieldAlert size={12} /> },
  pm: { label: "Postmortem Exam", status: "scheduled", color: "#d97706", bg: "#fffbeb", icon: <Activity size={12} /> },
  funeral: { label: "Funeral Service", status: "scheduled", color: "#0284c7", bg: "#f0f9ff", icon: <Calendar size={12} /> },
  transfer: { label: "Hearse Transfer", status: "in_transit", color: "#1d4ed8", bg: "#eff6ff", icon: <Clock size={12} /> },
};

const DARK_KEY = "rpd-ops-dark";
const NAV_COLLAPSE_KEY = "rpd-nav-collapsed";
const NAV_VIEW_KEY = "rpd-nav-view";

/* The ops sub-section nav inside the dashboard. Short labels: this
   row shares the toolbar with search, branch, schedule and avatar. */
const NAV = [
  { id: "command", label: "Operations", icon: "cal", full: "Operations" },
  { id: "pm", label: "PM", icon: "vial", full: "Postmortem Requests" },
];

export default function Dashboard({ tenantSlug = "", tenantData } = {}) {
  const { cases, loading, reload } = useCaseData();
  const navigate = useNavigate();
  const location = useLocation();

  const [section, setSection] = useState("command");
  const [navView, setNavView] = useState(() => {
    try {
      const v = localStorage.getItem(NAV_VIEW_KEY);
      const legacyViews = { dashboard: "overview", home: "overview", deceased: "release-calendar", schedule: "release-calendar" };
      const restored = legacyViews[v] || v;
      return NAV_ITEMS.some((n) => n.id === restored) ? restored : "overview";
    } catch { return "overview"; }
  });


  const isModuleView =
    navView === "store" || navView === "flowers" || navView === "coffin-store" || navView === "fleet";
  const isOverviewView = navView === "overview";
  const isReleaseCalendarView = navView === "release-calendar";
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
  const overviewCalc = useMemo(() => calcStats(scoped, scoped, calM, calY), [scoped, calM, calY]);

  /* ── calendar events from real case data (demo data when empty) ───────── */
  const calendarEvents = useMemo(() => {
    const raw = eventsOf(cases);
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
          recordId: p.raw?.id || p.raw?.deceased_id || p.raw?.deceasedId || "",
          admissionNumber: p.adm,
          name: p.name || "Unknown",
          age: p.age != null ? p.age : "",
          branch: p.branch || "",
          sex: p.sex || "",
          hearse: p.hearse || "",
        },
        officer: p.officer || "",
        receivedFrom: p.receivedFrom || "",
        raw: p.raw || null,
      };
    });
  }, [cases]);
  const releaseEvents = useMemo(
    () => calendarEvents.filter((event) => event.type === "release"),
    [calendarEvents]
  );

  /* ── currency formatting ── */
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
  const isBoardPeriod = section === "command" && (view === "day" || view === "week");
  const scheduleWindow = schedulePeriod(view, selDate);
  const scheduleEventCount = useMemo(() => {
    if (view !== "day" && view !== "week") return 0;
    const dayKeys = view === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(scheduleWindow.startKey, index))
      : [scheduleWindow.startKey];
    const daySet = new Set(dayKeys);
    return eventsOf(searched).filter((event) => daySet.has(event.date)).length;
  }, [scheduleWindow.startKey, searched, view]);

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === navView) || NAV_ITEMS[0];
  const showOpsToolbar = !isModuleView && !isOverviewView && !isReleaseCalendarView;
  const headerNav = NAV;
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
    setSection(VIEW_SECTION[navView] || "command");
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
    setSection("command");
    setView("day");
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

  /* Sidebar destination picker: Home opens operations; module destinations
     replace the main column. Closes the mobile drawer after selection. */
  const onNavView = (id) => {
    const nextSection = VIEW_SECTION[id] || "command";
    setSection(nextSection);
    setFilters([]);
    setTodayMode(false);
    if (id === "release-calendar") {
      setView("month");
      setClickedDay(null);
      setDayTab("all");
    }
    setNavView(id);
    setNavOpen(false);
  };
  const openIntakeRegistration = () => {
    navigate(tenantSlug ? `/${tenantSlug}/deceased/register` : "/deceased/register");
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
    <div className={`rpd${dark ? " dark" : ""}${isReleaseCalendarView ? " no-side" : ""}${navOpen ? " rpd-nav-open" : ""}${isOverviewView ? " rpd-home" : ""}`}>
      <div className="app">
        <DashSidebar
          active={navView}
          collapsed={navCollapsed}
          onNavigate={onNavView}
          onToggleCollapse={() => setNavCollapsed((c) => !c)}
          onCloseMobile={() => setNavOpen(false)}
          tenantSlug={tenantSlug}
          itemBadges={{
            intake: badges.intake,
            "release-calendar": cases.filter((item) => !isReleased(item) && item.release?.date >= today).length,
          }}
        />
        <div className="rpd-body">
          <div className="rpd-main">
            <Header
              activeNavMeta={activeNavMeta}
              showOpsToolbar={showOpsToolbar}
              section={section}
              view={view}
              isBoardPeriod={isBoardPeriod}
              scheduleWindow={scheduleWindow}
              scheduleEventCount={scheduleEventCount}
              badges={badges}
              NAV={headerNav}
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
              setFilters={setFilters}
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
            <div className="rpd-scroll" ref={contentScrollRef}>
      <div className="shell">
        <main className={`mains${isBoardPeriod ? " schedule-mode" : ""}`}>
          {navView === "store" ? (
            <StoreSection />
          ) : navView === "flowers" ? (
            <FlowerAnalytics />
          ) : navView === "coffin-store" ? (
            <SimpleCoffinInventory />
          ) : navView === "fleet" ? (
            <Suspense fallback={<div className="empty" style={{ padding: 90 }}>Loading hearse fleet…</div>}>
              <FleetDashboard embedded />
            </Suspense>
          ) : isOverviewView ? (
            <DashboardOverview
              cases={scoped}
              calc={overviewCalc}
              loading={loading}
              today={today}
              onNavigate={onNavView}
              onOpenIntake={openIntakeRegistration}
              onOpenCase={openCase}
              onOpenFleet={() => onNavView("fleet")}
            />
          ) : isReleaseCalendarView ? (
            <DeceasedScheduleCalendar
              events={releaseEvents}
              branch={branch}
              loading={loading}
              onCreateIntake={openIntakeRegistration}
              onEventSelect={({ event }) => event?.uid && openCase(event.uid, event.type)}
            />
          ) : loading && !cases.length ? (
            <div className="empty" style={{ padding: 90 }}>
              <span className="spin" style={{ color: "var(--acc)" }}>
                <Ic n="sync" s={22} />
              </span>
              <span style={{ fontSize: 12 }}>Loading operations…</span>
            </div>
          ) : section === "command" ? (
            <DeceasedScheduleCalendar events={calendarEvents} loading={loading} onCreateIntake={openIntakeRegistration} onEventSelect={({ event }) => event?.uid && openCase(event.uid, event.type)} />
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
