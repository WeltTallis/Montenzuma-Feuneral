import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./dashboard.css";
import "./shell/shell.css";
import "./florist/flowers.css";

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
import CoffinStoreTracker from "./CoffinStoreTracker";
import DashSidebar, { NAV_ITEMS } from "./shell/DashSidebar";

/* Sidebar view → the ops section it lands on. */
const VIEW_SECTION = { home: "command", deceased: "intake" };

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

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
    navView === "store" || navView === "workshop" || navView === "flowers" || navView === "coffin-store";
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
            <div className="rpd-scroll">
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
            <CoffinStoreTracker />
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