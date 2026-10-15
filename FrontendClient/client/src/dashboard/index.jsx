import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./dashboard.css";

import { fetchAllBranchDeceased, DECEASED_CHANGED_EVENT } from "../api/dashboardDataApi";
import { fetchReleasesFeed, fetchPostmortemsFeed } from "../api/dashboardFeedApi";
import { useSocket } from "../utils/context/socketContext";

import {
  DOWF, DOWM, MO, TYPE_C, addDays, baseList, buildCases, calcStats, eventsOf, initials, isReleased,
  matchPill, nowClock, pad, pillsFor, searchMatch, todayKey,
} from "./opsData";
import { TipBox, tipProps, useTooltip } from "./opsBits";
import { Ic } from "./opsIcons";
import { OperationsView, RegisterView } from "./opsViews";
import { AnalyticsView, Donut } from "./opsAnalytics";
import { CaseDrawer, ModalHost } from "./opsPanels";
import WorkshopPanel from "./WorkshopPanel";

/* ══════════════════════════════════════════════════════════════════════════
   Operations dashboard — the single shell.

   Toolbar (sections · search · branch · view · theme)
     ├─ sidebar  calendar + status pills + at-a-glance analytics
     └─ main     Operations · Intake Register · Releases · Postmortems ·
                 Analytics, plus the drill-down modal and the case drawer

   Data comes from the real feeds: the multi-branch deceased register, the
   body-release feed and the postmortem-request feed.
   ══════════════════════════════════════════════════════════════════════════ */

/* The section nav. Labels are deliberately short: this row shares the toolbar
   with the module switch, search, branch, schedule and avatar, and the long
   forms pushed that right-hand cluster off screen. Every entry keeps its full
   wording in `full`, which becomes the hover title and the accessible name —
   so the abbreviations cost nothing in clarity. */
const NAV = [
  { id: "command", label: "Operations", icon: "cal", full: "Operations" },
  { id: "intake", label: "Intake", icon: "bed", full: "Intake Register" },
  { id: "release", label: "Release", icon: "heart", full: "Releases & Transfers" },
  { id: "pm", label: "PM", icon: "vial", full: "Postmortem Requests" },
  { id: "analytics", label: "Analytics", icon: "grid", full: "Analytics" },
];



const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

/* The dashboard's top-level modules. "Operations" is the mortuary register
   that has always lived here; "Workshop" swaps the main column for the
   workshop store + production analytics. Rendered as a segmented switch (not a
   dropdown) so both destinations — and the way back — stay one click away. */
const MODULES = [
  { id: "operations", label: "Operations", icon: "cal" },
  { id: "workshop", label: "Workshop", icon: "hammer" },
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
    : view === "month"
      ? MO[start.getMonth()]
      : `${DOWF[start.getDay()]}, ${MO[start.getMonth()]} ${start.getDate()}`;

  return { title, year: end.getFullYear(), startKey };
}

/* ── data ───────────────────────────────────────────────────────────────── */

/** Pulls the three feeds and merges them into the dashboard's case list. */
function useCaseData() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  // Timestamp of the last successful load — used to decide whether a tab that
  // just regained focus really needs another network round trip.
  const lastLoadRef = useRef(0);
  // Guards against overlapping loads: several feeds + several branches can be
  // in flight at once, and a slower earlier response must never overwrite a
  // newer one.
  const inflightRef = useRef(0);
  const { socket } = useSocket();

  const load = useCallback(async (force = false) => {
    const ticket = ++inflightRef.current;
    setLoading(true);
    try {
      const [deceased, releases, postmortems] = await Promise.all([
        fetchAllBranchDeceased(force).catch(() => []),
        fetchReleasesFeed().catch(() => []),
        fetchPostmortemsFeed().catch(() => []),
      ]);
      // A newer load started while this one was in flight — drop this result.
      if (ticket !== inflightRef.current) return;
      setCases(buildCases(
        Array.isArray(deceased) ? deceased : [],
        Array.isArray(releases) ? releases : [],
        Array.isArray(postmortems) ? postmortems : []
      ));
      lastLoadRef.current = Date.now();
    } catch (e) {
      console.warn("[Operations dashboard] feed load failed:", e?.message);
      if (ticket === inflightRef.current) setCases([]);
    } finally {
      if (ticket === inflightRef.current) setLoading(false);
    }
  }, []);

  // ALWAYS force the first load: opening the dashboard must show the register
  // exactly as it is now, never a cached snapshot from a page view ago (that
  // cache is what hid a just-registered deceased body).
  useEffect(() => { load(true); }, [load]);

  // A record registered/released anywhere in the app fires this event, so the
  // dashboard repaints with fresh data even while it stays mounted.
  useEffect(() => {
    const refresh = () => { load(true); };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Coming back to the tab: refresh only when the numbers are aging.
      if (Date.now() - lastLoadRef.current > 60 * 1000) load(true);
    };
    window.addEventListener(DECEASED_CHANGED_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(DECEASED_CHANGED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  /* Live updates. The in-app event above only fires in the tab that performed
     the write, so a body registered by a colleague (or in another tab) used to
     leave the dashboard stale until it was reloaded. The backend already emits
     these on every register / release / postmortem write, so subscribe to them
     and refresh. Bursts are coalesced into one load so a bulk import does not
     fire a request per row. */
  useEffect(() => {
    if (!socket) return undefined;
    let timer = null;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; load(true); }, 400);
    };
    const EVENTS = [
      "notification:deceased-admitted", "deceased-admitted",
      "notification:deceased-removed", "deceased-removed",
      "notification:deceased-updated", "deceased-updated",
      "notification:body-released", "body-released",
      "notification:postmortem-request", "postmortem-request",
      "notification:postmortem-update", "postmortem-update",
    ];
    EVENTS.forEach((e) => socket.on(e, schedule));
    return () => {
      if (timer) clearTimeout(timer);
      EVENTS.forEach((e) => socket.off(e, schedule));
    };
  }, [socket, load]);

  return { cases, loading, reload: load };
}

/* ── sidebar ────────────────────────────────────────────────────────────── */

function Sidebar({
  calc, scoped, section, filters, onTogglePill, onOpenModal,
  calY, calM, calendarDots, selDay, today, onPickDay, view, onViewChange,
  period, eventCount, onToday, onStep,
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

  const pillList = pillsFor(section);
  const activeCount = filters.length;

  /* Money for the financial panel. The currency comes from the records themselves
     (a USD home shows USD) — never a hard-coded "KES". A zero renders as a muted
     dash rather than "KES 0", so a column of untouched figures still reads as
     deliberate instead of broken. */
  const ccy = calc.charges?.currency || "KES";
  const money = (n) => {
    const v = Number(n) || 0;
    return v > 0 ? `${ccy} ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "—";
  };
  const morgue = calc.morgue || { held: 0, avg: 0, median: 0, longest: 0, top: [] };

  /* Headline counts for the "At a glance" strip. Read from `calc.care`, which is
     branch-scoped rather than search-scoped, so these four numbers stay put while
     the user types in the toolbar search — the strip answers "how are we doing"
     before anything is filtered. */
  const careTotal = Math.max(
    calc.care.inCare + calc.care.pmReq + calc.care.pmDone + calc.care.released,
    1
  );
  const kpis = [
    { id: "in-care", label: "In Care", v: calc.care.inCare, c: "var(--blue)" },
    { id: "pm-req", label: "PM Open", v: calc.care.pmReq, c: "var(--orange)" },
    { id: "pm-done", label: "PM Done", v: calc.care.pmDone, c: "var(--plum)" },
    { id: "released", label: "Released", v: calc.care.released, c: "var(--teal)" },
  ].map((k) => ({ ...k, pct: Math.round((k.v / careTotal) * 100) }));

  /* The event counter only means something once the schedule is scoped to a
     single day or week; a whole month already has its own totals on screen. */
  const isPeriod = view === "day" || view === "week";
  const stepLbl = (dir) => `${dir < 0 ? "Previous" : "Next"} ${view}`;

  return (
    <>
      {/* Each block below is its own panel card on the rail, opened by a
          `.side-h` heading — the dashboard's counterpart of the deceased
          sidebar's uppercase section headings. */}
      <div className="smc">
        <div className="side-h">
          <span className="side-h-ic"><Ic n="cal" s={12} /></span>
          <span>Schedule</span>
        </div>

        {/* The schedule controls live here, at the top of the calendar. Stepping
            the period always carries calM/calY with it, so this single ‹ › pair
            also walks the displayed month. */}
        <div className="smc-ctrl">
          <button className="smc-btn hot" onClick={onToday}>Today</button>
          <div className="smc-nav">
            <button onClick={() => onStep(-1)} aria-label={stepLbl(-1)} title={stepLbl(-1)}>
              <Ic n="chevL" s={12} />
            </button>
            <button onClick={() => onStep(1)} aria-label={stepLbl(1)} title={stepLbl(1)}>
              <Ic n="chevR" s={12} />
            </button>
          </div>
          {isPeriod ? (
            <div className="smc-count" aria-live="polite">
              <b>{eventCount}</b>
              <span>{eventCount === 1 ? "event" : "events"} {view === "week" ? "this week" : "today"}</span>
            </div>
          ) : null}
        </div>

        <div className="smc-period" aria-live="polite">
          <b>{period.title}</b>
          <span>{period.year}</span>
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
              aria-pressed={view === key}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="smc-h">
          <span className="smc-t">{MO[calM]} {calY}</span>
        </div>

        <div className="smc-g">{cells}</div>
      </div>

      {/* The pills are hidden entirely when a section has none, so an empty
          "Filters" card never appears. */}
      {pillList.length ? (
        <div className="sfilters">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clip" s={12} /></span>
            <span>Filters</span>
            <em>{activeCount ? `${activeCount} active` : `${base.length} total`}</em>
          </div>
          {pillList.map(([key, label, color]) => {
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
      ) : null}

      <div className="san">
        {/* At a glance — the four headline counts, each with the share of the
            caseload it represents, so the rail answers "how are we doing" in one
            glance instead of making the reader add the donut legend up. */}
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="grid" s={12} /></span>
            <span>At a Glance</span>
            <em>{calc.total} total</em>
          </div>
          <div className="skpis">
            {kpis.map((k) => (
              <button
                className="skpi"
                key={k.id}
                onClick={() => onOpenModal(`status:${k.id}`)}
                title={`${k.label} — ${k.v} case${k.v === 1 ? "" : "s"} (${k.pct}%)`}
              >
                <b>{k.v}</b>
                <span className="skpi-lbl">{k.label}</span>
                <span className="skpi-bar">
                  <span className="skpi-fill" style={{ width: `${k.pct}%`, background: k.c }} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="grid" s={12} /></span>
            <span>Status Breakdown</span>
            <em>{calc.total} total</em>
          </div>
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
          <div className="side-h">
            <span className="side-h-ic"><Ic n="bed" s={12} /></span>
            <span>Load by Branch</span>
            <em>{calc.bmix.length} {calc.bmix.length === 1 ? "branch" : "branches"}</em>
          </div>
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

        {/* Days in morgue — the deceased-profile sidebar's "Days in Morgue"
            row, aggregated across every body currently held. */}
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clock" s={12} /></span>
            <span>Days in Morgue</span>
            <em>{morgue.held} held</em>
          </div>
          <div className="sgrid3">
            <div className="sstat"><b>{morgue.avg}</b><span>Avg days</span></div>
            <div className="sstat"><b>{morgue.median}</b><span>Median</span></div>
            <div className="sstat"><b>{morgue.longest}</b><span>Longest</span></div>
          </div>
          {morgue.top.length ? (
            <div className="stop">
              {morgue.top.map(({ p, d }) => (
                <div className="srow" key={p.uid || p.adm} {...tipProps(p.name || "—", `${d} ${d === 1 ? "day" : "days"} in morgue`, "Click to open the case")}>
                  <span className="sn">{p.name || "—"}</span>
                  <b className={d >= morgue.avg && d > 0 ? "warn" : ""}>{d}d</b>
                </div>
              ))}
            </div>
          ) : <div className="bigsub">No bodies currently in the morgue.</div>}
        </div>

        {/* Body storage status — "In Storage" vs "Released", per the deceased
            sidebar's "Body Storage Status" row. */}
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="file" s={12} /></span>
            <span>Body Storage</span>
            <em>{morgue.held} in storage</em>
          </div>
          <div className="stop">
            {segs.map((s) => (
              <div className="srow" key={s.k} onClick={() => onOpenModal(`status:${s.k}`)} {...tipProps(s.l, `${s.v} cases`, "Click for the case list")}>
                <span className="sd" style={{ background: s.c }} />
                <span className="sn">{s.l}</span>
                <b>{s.v}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Financials — ONE card for every money figure on the rail. The old
            layout split this across "Charges" and a separate "Storage Accrual"
            card, and the two disagreed: `charges.accrued` honours each body's
            own daily rate while `calc.accrual` was a flat KES 500 estimate for
            every held body, so the rail showed two different holding costs for
            the same thing. The per-line charge breakdown (Mortuary / Extra /
            Billed to date) was removed at the request of the dashboard owners;
            only the storage accrual and the running total remain. */}
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clip" s={12} /></span>
            <span>Financials</span>
            <em>{ccy}</em>
          </div>
          <div className="stop">
            <div className="srow">
              <span className="sn">Storage accrued</span>
              <b>{money(calc.charges?.accrued)}</b>
            </div>
            <div className="srow srow-sum">
              <span className="sn">Total so far</span>
              <b className="tot">{money((calc.charges?.billed || 0) + (calc.charges?.accrued || 0))}</b>
            </div>
          </div>
          {/* Say where the storage figure comes from. Without this the number is
              indistinguishable from a real invoice, and it silently mixes
              configured rates with the standard estimate. */}
          <p className="snote">
            {calc.charges?.unbilled
              ? `${calc.charges.unbilled} held ${calc.charges.unbilled === 1 ? "body has" : "bodies have"} no daily rate — storage for ${calc.charges.unbilled === 1 ? "it is" : "them is"} estimated at the standard rate.`
              : "Every held body carries a configured daily rate."}
          </p>
        </div>
      </div>
    </>
  );
}

/* ── shell ──────────────────────────────────────────────────────────────── */

export default function Dashboard({ tenantSlug = "", tenantData } = {}) {
  const { cases, loading, reload } = useCaseData();
  const navigate = useNavigate();
  const location = useLocation();

  const [section, setSection] = useState("command");
  // Top-level module switch: "operations" (mortuary register) or "workshop"
  // (coffin store + production analytics). Choosing a module swaps the main
  // column; the Operations section nav only applies within "operations".
  const [module, setModule] = useState("operations");
  const isWorkshop = module === "workshop";
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
  // the record just registered sank to the BOTTOM of the register and the oldest
  // body sat on top. Every register section is a "what just happened" log, so the
  // default has to read newest → oldest.
  const [sorts, setSorts] = useState({
    intake: { f: "date", d: -1 },
    release: { f: "date", d: -1 },
    pm: { f: "date", d: -1 },
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

  /* The drawer is keyed on the branch-scoped `uid`, not the admission number —
     two branches can legitimately hold the same admission number, and matching
     on the bare number opened whichever row happened to come first. */
  const drawerCase = useMemo(
    () => (drawer ? cases.find((c) => c.uid === drawer.uid) || null : null),
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

  /* ── handlers ─────────────────────────────────────────────────────────── */
  const openCase = useCallback((uid, ctx) => {
    const selectedCase = cases.find((item) => item.uid === uid);
    const profileId = selectedCase?.id
      || selectedCase?.raw?.id
      || selectedCase?.raw?.deceased_id
      || selectedCase?.raw?.deceasedId;
    const profileBranchSlug = selectedCase?.raw?._branchSlug || tenantSlug;
    const profileTenantSlug = tenantSlug || localStorage.getItem("tenantSlug") || localStorage.getItem("tenant_slug");

    if (profileId && profileTenantSlug && profileBranchSlug) {
      navigate(`/${profileTenantSlug}/deceased?id=${encodeURIComponent(profileId)}&branch=${encodeURIComponent(profileBranchSlug)}`, {
        state: {
          from: `${location.pathname}${location.search}`,
          profileBranchSlug,
        },
      });
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
      return { ...prev, [section]: s.f === field ? { f: field, d: s.d * -1 } : { f: field, d: field === "date" ? -1 : 1 } };
    });

  const doRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
    setToast("Refreshed");
  };

  const onNav = (id) => {
    // Clicking a section always brings the mortuary register back — the
    // workshop module has no register sections, so the nav would be a no-op.
    if (isWorkshop) setModule("operations");
    setSection(id);
    setFilters([]);
    setTodayMode(false);
  };

  const onModule = (id) => {
    setModule(id);
    if (id === "operations") setSection("command");
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
  /* Counts the events inside the selected Day or Week. Scoped to the view, not
     to a section: the calendar's top cluster shows this in every section, so a
     section-based guard would have reported "0 events" for the registers. */
  const analyticsPeriodEventCount = useMemo(() => {
    if (view !== "day" && view !== "week") return 0;
    const dayKeys = view === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(analyticsPeriod.startKey, index))
      : [analyticsPeriod.startKey];
    const daySet = new Set(dayKeys);
    return eventsOf(searched).filter((event) => daySet.has(event.date)).length;
  }, [analyticsPeriod.startKey, searched, view]);

  return (
    <div className={`rpd${dark ? " dark" : ""}${section === "analytics" ? " no-side" : ""}`}>
      {/* ── toolbar ─────────────────────────────────────────────────── */}
      <header className={`tbar${isBoardPeriod ? " sched-mode" : ""}`}>
        <div className="tb-left">
          {/* Module switch — Operations (mortuary register) vs Workshop
              (coffin store + production analytics). A segmented control, not a
              <select>: both destinations stay labelled and clickable, so the
              way back to Operations is always visible. It is the primary
              top-level control, so the active module takes the accent fill. */}
          <div className="modtabs" role="tablist" aria-label="Dashboard module">
            {MODULES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={module === m.id}
                className={`modtab${module === m.id ? " on" : ""}`}
                onClick={() => onModule(m.id)}
              >
                <Ic n={m.icon} s={13} />
                {m.label}
              </button>
            ))}
          </div>
          {isWorkshop ? <div className="divider" /> : null}
          <div className="nvp" hidden={isWorkshop}>
            {NAV.map((n) => {
              const b = badges[n.id];
              return (
                <button
                  key={n.id}
                  className={section === n.id ? "on" : ""}
                  onClick={() => onNav(n.id)}
                  title={n.full}
                  aria-label={n.full}
                >
                  <Ic n={n.icon} s={13} />{n.label}
                  {b > 0 ? <span className="nvb">{b}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="tb-right">
          <div className="searchbox" hidden={isWorkshop}>
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

          <div className="selwrap" hidden={isWorkshop}>
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

          {/* Fallback copy of the schedule controls. The sidebar calendar owns
              them, so this is hidden while the calendar is on screen and only
              surfaces when it is not (Analytics section, or a viewport too
              narrow for the sidebar). The workshop module has no schedule at
              all, so the whole cluster steps aside there. */}
          <div className="tb-sched" hidden={isWorkshop}>
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
        {section !== "analytics" && !isWorkshop ? (
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

        <main className={`mains${isAnalyticsPeriod ? " analytics-period" : ""}${isBoardPeriod ? " schedule-mode" : ""}${isWorkshop ? " workshop-mode" : ""}`}>
          {isWorkshop ? (
            <WorkshopPanel onExit={() => onModule("operations")} />
          ) : loading && !cases.length ? (
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
        onOpenCase={(uid) => { setModal(null); openCase(uid, "intake"); }}
        onOpenModal={openModal}
      />

      <CaseDrawer record={drawerCase} ctx={drawer?.ctx} onClose={() => setDrawer(null)} />

      <div className={`te${toast ? " show" : ""}`}>{toast}</div>
      <TipBox tip={tooltip} />
    </div>
  );
}
