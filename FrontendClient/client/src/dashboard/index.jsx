import { useCallback, useEffect, useMemo, useState } from "react";

import "./dashboard.css";

import { fetchAllBranchDeceased } from "../api/dashboardDataApi";
import { fetchReleasesFeed, fetchPostmortemsFeed } from "../api/dashboardFeedApi";

import {
  DOWF, DOWM, MO, TYPE_C, addDays, baseList, buildCases, calcStats, eventsOf, fmtK, initials, isReleased,
  matchPill, nowClock, pad, pillsFor, searchMatch, todayKey,
} from "./opsData";
import { TipBox, tipProps, useTooltip } from "./opsBits";
import { Ic } from "./opsIcons";
import { OperationsView, RegisterView } from "./opsViews";
import { AnalyticsView, Donut } from "./opsAnalytics";
import { CaseDrawer, ModalHost } from "./opsPanels";

/* ══════════════════════════════════════════════════════════════════════════
   Operations dashboard — the single shell.

   Toolbar (sections · search · branch · view · theme)
     ├─ sidebar  calendar + status pills + at-a-glance analytics
     └─ main     Operations · Intake Register · Releases · Postmortems ·
                 Analytics, plus the drill-down modal and the case drawer

   Data comes from the real feeds: the multi-branch deceased register, the
   body-release feed and the postmortem-request feed.
   ══════════════════════════════════════════════════════════════════════════ */

const NAV = [
  { id: "command", label: "Operations", icon: "cal" },
  { id: "intake", label: "Intake Register", icon: "bed" },
  { id: "release", label: "Releases & Transfers", icon: "heart" },
  { id: "pm", label: "Postmortem Requests", icon: "vial" },
  { id: "analytics", label: "Analytics", icon: "grid" },
];

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const DARK_KEY = "rpd-ops-dark";

/** Human-readable period heading used by the Analytics Day/Week toolbar. */
function schedulePeriod(view, selDate) {
  const [year, month, date] = selDate.split("-").map(Number);
  const start = new Date(year, month - 1, date);
  if (view === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  if (view === "week") end.setDate(start.getDate() + 6);

  const startKey = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const title = view === "week"
    ? (start.getMonth() === end.getMonth()
      ? `${MO[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
      : `${MO[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MO[end.getMonth()].slice(0, 3)} ${end.getDate()}`)
    : `${DOWF[start.getDay()]}, ${MO[start.getMonth()]} ${start.getDate()}`;

  return { title, year: end.getFullYear(), startKey };
}

/* ── data ───────────────────────────────────────────────────────────────── */

/** Pulls the three feeds and merges them into the dashboard's case list. */
function useCaseData() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const [deceased, releases, postmortems] = await Promise.all([
        fetchAllBranchDeceased(force).catch(() => []),
        fetchReleasesFeed().catch(() => []),
        fetchPostmortemsFeed().catch(() => []),
      ]);
      setCases(buildCases(
        Array.isArray(deceased) ? deceased : [],
        Array.isArray(releases) ? releases : [],
        Array.isArray(postmortems) ? postmortems : []
      ));
    } catch (e) {
      console.warn("[Operations dashboard] feed load failed:", e?.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { cases, loading, reload: load };
}

/* ── sidebar ────────────────────────────────────────────────────────────── */

function Sidebar({
  calc, scoped, section, filters, onTogglePill, onOpenModal,
  calY, calM, onMonthNav, calendarDots, selDay, today, onPickDay, view, onViewChange,
}) {
  const dim = new Date(calY, calM + 1, 0).getDate();
  const firstDow = (new Date(calY, calM, 1).getDay() + 6) % 7;
  const prevDim = new Date(calY, calM, 0).getDate();

  const cells = [];
  DOWM.forEach((d) => cells.push(<div className="smc-dow" key={`dow-${d}`}>{d}</div>));
  for (let i = firstDow - 1; i >= 0; i -= 1) {
    cells.push(<div className="smc-day other" key={`p${i}`}>{prevDim - i}</div>);
  }
  for (let dn = 1; dn <= dim; dn += 1) {
    const key = `${calY}-${pad(calM + 1)}-${pad(dn)}`;
    const types = calendarDots[key] || [];
    let cls = "smc-day";
    if (key === today) cls += " today";
    if (key === selDay) cls += " sel";
    cells.push(
      <div
        className={cls}
        key={key}
        onClick={() => onPickDay(key)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onPickDay(key); }}
      >
        {dn}
        <span className="smc-dots">
          {types.slice(0, 3).map((t) => (
            <span className="smc-dot" key={t} style={{ background: TYPE_C[t] }} />
          ))}
        </span>
      </div>
    );
  }
  const trail = (7 - ((firstDow + dim) % 7)) % 7;
  for (let t = 1; t <= trail; t += 1) {
    cells.push(<div className="smc-day other" key={`t${t}`}>{t}</div>);
  }

  const base = baseList(section, scoped);
  const segs = [
    { k: "in-care", c: "var(--blue)", v: calc.care.inCare, l: "In Care" },
    { k: "pm-req", c: "var(--orange)", v: calc.care.pmReq, l: "PM Requested" },
    { k: "pm-done", c: "var(--plum)", v: calc.care.pmDone, l: "PM Done" },
    { k: "released", c: "var(--teal)", v: calc.care.released, l: "Released" },
  ];
  const bMax = Math.max(...calc.bmix.map((b) => b.n), 1);

  return (
    <>
      <div className="smc">
        <div className="smc-h">
          <div>
            <span className="smc-t">{MO[calM]} {calY}</span>
            <span className="smc-sub">Select a day to open the schedule</span>
          </div>
          <div className="smc-nav">
            <button onClick={() => onMonthNav(-1)} aria-label="Previous month"><Ic n="chevL" s={12} /></button>
            <button onClick={() => onMonthNav(1)} aria-label="Next month"><Ic n="chevR" s={12} /></button>
          </div>
        </div>
        <div className="smc-views">
          {[
            ["day", "Day"],
            ["week", "Week"],
            ["month", "Month"],
          ].map(([key, label]) => (
            <button
              className={view === key ? "on" : ""}
              key={key}
              onClick={() => onViewChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="smc-g">{cells}</div>
      </div>

      <div className="sfilters">
        {pillsFor(section).map(([key, label, color]) => {
          const n = base.filter((p) => matchPill(p, section, key)).length;
          const on = filters.includes(key);
          return (
            <div
              className={`fc${on ? " on" : ""}`}
              key={key}
              onClick={() => onTogglePill(key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onTogglePill(key); }}
            >
              <span className="fc-dot" style={{ background: color }} />{label}
              <span className="fc-ct">{n}</span>
            </div>
          );
        })}
      </div>

      <div className="san">
        <div className="san-t"><Ic n="grid" s={11} /> Analytics</div>

        <div className="san-card">
          <div className="san-t" style={{ marginBottom: 9 }}>Status Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <Donut segs={segs} size={104} stroke={16} onOpenModal={onOpenModal} />
            <div className="san-leg" style={{ flex: 1 }}>
              {segs.map((s) => {
                const pct = Math.round((s.v / (calc.total || 1)) * 100);
                return (
                  <div
                    className="san-lr"
                    key={s.k}
                    onClick={() => onOpenModal(`status:${s.k}`)}
                    {...tipProps(s.l, `${s.v} cases · ${pct}%`, "Click for the case list")}
                  >
                    <span className="san-ld" style={{ background: s.c }} />
                    <span className="san-ll">{s.l}</span>
                    <span className="san-lv">{s.v}</span>
                    <span className="san-lp">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="san-card">
          <div className="san-t" style={{ marginBottom: 9 }}>Load by Branch</div>
          {calc.bmix.length ? calc.bmix.map((b, i) => (
            <div
              className="hb"
              key={b.b}
              onClick={() => onOpenModal(`branch:${b.b}`)}
              {...tipProps(b.b, `${b.n} cases`, "Click for the branch breakdown")}
            >
              <span className="hl">{b.b}</span>
              <div className="ht">
                <div
                  className="hf"
                  style={{
                    width: `${Math.max(3, (b.n / bMax) * 100)}%`,
                    background: "var(--acc)",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="hn">{b.n}</span>
            </div>
          )) : <div className="bigsub">No branch data.</div>}
        </div>

        <div className="san-card">
          <div className="san-t" style={{ marginBottom: 6 }}>Storage Accrual</div>
          <div className="bigpct">{fmtK(calc.accrual)}</div>
          <div className="bigsub">Holding fees · {calc.inCare} bodies in care</div>
        </div>
      </div>
    </>
  );
}

/* ── shell ──────────────────────────────────────────────────────────────── */

export default function Dashboard({ tenantSlug = "", tenantData } = {}) {
  const { cases, loading, reload } = useCaseData();

  const [section, setSection] = useState("command");
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
  const [sorts, setSorts] = useState({
    intake: { f: "date", d: 1 },
    release: { f: "date", d: 1 },
    pm: { f: "date", d: 1 },
  });
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(nowClock());

  const tooltip = useTooltip();
  const today = todayKey();

  /* ── derived data ─────────────────────────────────────────────────────── */
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
  const calc = useMemo(() => calcStats(scoped, searched, calM, calY), [scoped, searched, calM, calY]);

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

  const drawerCase = useMemo(
    () => (drawer ? cases.find((c) => c.adm === drawer.adm) || null : null),
    [drawer, cases]
  );

  /* ── effects ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    try { localStorage.setItem(DARK_KEY, dark ? "1" : "0"); } catch { /* storage blocked */ }
  }, [dark]);

  useEffect(() => {
    const id = setInterval(() => setNow(nowClock()), 30000);
    return () => clearInterval(id);
  }, []);

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

  /* ── handlers ─────────────────────────────────────────────────────────── */
  const openCase = useCallback((adm, ctx) => setDrawer({ adm, ctx: ctx || "intake" }), []);
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

  const onSort = (field) =>
    setSorts((prev) => {
      const s = prev[section] || { f: "date", d: 1 };
      return { ...prev, [section]: s.f === field ? { f: field, d: s.d * -1 } : { f: field, d: 1 } };
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

  /* badge counts mirror the reference's toolbar pill badges */
  const badges = {
    intake: cases.filter((c) => !isReleased(c) && c.admDate && c.admDate <= today).length,
    release: cases.filter(isReleased).length,
    pm: cases.filter((c) => c.pm).length,
  };

  const avatarText = initials(tenantData?.name || tenantData?.tenant_name || tenantSlug || "RestPoint");
  const isAnalyticsPeriod = section === "analytics" && (view === "day" || view === "week");
  /* The Operations section's own Day / Week schedule — what the sidebar
     calendar's buttons open. Gets the same period heading + event counter. */
  const isBoardPeriod = section === "command" && (view === "day" || view === "week");
  const analyticsPeriod = schedulePeriod(view, selDate);
  const analyticsPeriodEventCount = useMemo(() => {
    if (!isAnalyticsPeriod && !isBoardPeriod) return 0;
    const dayKeys = view === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(analyticsPeriod.startKey, index))
      : [analyticsPeriod.startKey];
    const daySet = new Set(dayKeys);
    return eventsOf(searched).filter((event) => daySet.has(event.date)).length;
  }, [analyticsPeriod.startKey, isAnalyticsPeriod, isBoardPeriod, searched, view]);

  return (
    <div className={`rpd${dark ? " dark" : ""}`}>
      {/* ── toolbar ─────────────────────────────────────────────────── */}
      <header className={`tbar${isBoardPeriod ? " sched-mode" : ""}`}>
        <div className="tb-left">
          <div className="nvp">
            {NAV.map((n) => {
              const b = badges[n.id];
              return (
                <button
                  key={n.id}
                  className={section === n.id ? "on" : ""}
                  onClick={() => onNav(n.id)}
                >
                  <Ic n={n.icon} s={13} />{n.label}
                  {b > 0 ? <span className="nvb">{b}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="tb-right">
          <div className="searchbox">
            <Ic n="search" s={13} />
            <input
              id="rpd-search"
              type="text"
              placeholder="Search…"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button className="clearx" onClick={() => setSearch("")} aria-label="Clear search">
                <Ic n="x" s={12} />
              </button>
            ) : null}
          </div>

          <div className="selwrap">
            <select
              aria-label="Branch"
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setFilters([]); }}
            >
              <option value="">All Branches ({cases.length})</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b} ({cases.filter((c) => c.branch === b).length})
                </option>
              ))}
            </select>
          </div>

          <div className="divider" />

          <button className="tb-btn today-hot" onClick={goToday}>Today</button>
          <div className="navpair" aria-label="Change schedule period">
            <button className="tb-btn sq" onClick={() => stepPeriod(-1)} title="Previous period" aria-label="Previous period">‹</button>
            <button className="tb-btn sq" onClick={() => stepPeriod(1)} title="Next period" aria-label="Next period">›</button>
          </div>
          {isAnalyticsPeriod || isBoardPeriod ? (
            <div className="tb-period" aria-live="polite">
              <b>{analyticsPeriod.title}</b>
              <span>{analyticsPeriod.year}</span>
            </div>
          ) : null}
          {isAnalyticsPeriod || isBoardPeriod ? (
            <div className="tb-period-count">
              <b>{analyticsPeriodEventCount}</b>
              <span>{analyticsPeriodEventCount === 1 ? "event" : "events"} {view === "week" ? "this week" : "today"}</span>
            </div>
          ) : null}
          <div className="views">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={view === v.id ? "on" : ""}
                onClick={() => setV(v.id)}
                aria-pressed={view === v.id}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            className="tb-btn sq"
            title="Toggle theme"
            onClick={() => setDark((d) => !d)}
          >
            <Ic n={dark ? "sun" : "moon"} s={14} />
          </button>

          <button className="tb-btn sq" title="Refresh" onClick={doRefresh}>
            <span className={refreshing ? "spin" : ""}><Ic n="sync" s={13} /></span>
          </button>

          <div className="avatar">{avatarText}</div>
        </div>
      </header>

      {/* ── sidebar + main ──────────────────────────────────────────── */}
      <div className="shell">
        {section !== "analytics" ? (
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
              onMonthNav={onMonthNav}
              calendarDots={calendarDots}
              selDay={selDate}
              today={today}
              onPickDay={pickDay}
              view={view}
              onViewChange={setV}
            />
          </aside>
        ) : null}

        <main className={`mains${isAnalyticsPeriod ? " analytics-period" : ""}${isBoardPeriod ? " schedule-mode" : ""}`}>
          {loading && !cases.length ? (
            <div className="empty" style={{ padding: 90 }}>
              <span className="spin" style={{ color: "var(--acc)" }}><Ic n="sync" s={22} /></span>
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
              onPickDay={(key) => { setView("day"); setSelDate(key); setClickedDay(null); setDayTab("all"); setTodayMode(false); }}
              onDayTabChange={setDayTab}
            />
          ) : section === "command" ? (
            <OperationsView
              searched={searched}
              calc={calc}
              state={{ view, selDate, clickedDay, todayMode, filters, calM, calY, dayTab }}
              now={now}
              today={today}
              onOpenCase={openCase}
              onClearDay={() => setClickedDay(null)}
              onPickDay={(key) => { setView("day"); setSelDate(key); setClickedDay(null); setDayTab("all"); setTodayMode(false); }}
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

      {/* ── overlays ────────────────────────────────────────────────── */}
      <ModalHost
        modalKey={modal}
        people={searched}
        calc={calc}
        onClose={() => setModal(null)}
        onOpenCase={(adm) => { setModal(null); openCase(adm, "intake"); }}
        onOpenModal={openModal}
      />

      <CaseDrawer record={drawerCase} ctx={drawer?.ctx} onClose={() => setDrawer(null)} />

      <div className={`te${toast ? " show" : ""}`}>{toast}</div>
      <TipBox tip={tooltip} />
    </div>
  );
}
