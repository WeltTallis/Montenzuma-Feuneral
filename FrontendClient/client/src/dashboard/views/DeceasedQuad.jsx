import React, { useMemo, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { fetchReleasesFeed, fetchPostmortemsFeed } from "../../api/dashboardFeedApi";
import { fetchAllBranchDeceased } from "../../api/dashboardDataApi";
Chart.register(...registerables);
const ChartJS = Chart;

/* ════════════════════════════════════════════════════════════════
   Deceased dashboard quad — "Funeral Home Dashboard · Branch View".

   Same props contract as before (events, loading, dateKey, deceased,
   onPickDate, onSelect) so ModuleDashboard wiring & the existing
   DeceasedSidePanel (untouched) keep working. Rows open the side
   panel via onSelect with the same id conventions
   (in-<adm_no> / rel-<adm_no> / pm-<adm_no> / pm-req-*).

   Visual = the branch-view reference: Merriweather + Source Sans 3,
   ink & paper palette with the brand status colors, stat cards with
   colored icon tiles, a horizontal dot-calendar strip and the 2x2
   quad grid — Analytics (Chart.js) · Deceased Intake · Releases &
   Transfers · Postmortem Requests.
   ════════════════════════════════════════════════════════════════ */

/* ── constants & helpers ── */
const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOWS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const PM_RE = /(postmortem|post-mortem|autopsy)/i;
const RELEASED_RE = /(released|dispatched|completed|buried)/i;

const keyOf = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
};
const todayKeyVal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const admKeyOf = (r) => keyOf(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);

const timeOf = (r) => {
  const s = String(r?.time_key || r?.time_admitted || r?.adm_time || r?.created_at || "");
  if (!/:\d{2}/.test(s)) return "";
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${String(Math.min(23, +m[1])).padStart(2, "0")}:${m[2]}`;
};

const relKeyOf = (r) => keyOf(r?.dispatch_date || r?.release_date || r?.date_released);
/* Every status signal the register carries, joined. `status` is a legacy
   column that stays 'active' forever, so it must never be read FIRST — it
   masks body_status / admission_status, the fields that actually flip when a
   body is released (the "status not changing" bug on the dashboard). */
const statusSignalOf = (r) =>
  [r?.body_status, r?.admission_status, r?.release_status, r?.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
const isReleased = (r) => RELEASED_RE.test(statusSignalOf(r));

const pmMetaOf = (r) => {
  const pm = r?.postmortem || null;
  const bodyStr = `${r?.body_status || ""} ${r?.admission_status || ""}`.toLowerCase();
  const requested = r?.postmortem_requested === true || r?.postmortem_requested === 1 || Boolean(pm?.requested_at || pm?.created_at) || PM_RE.test(bodyStr);
  if (!requested) return null;
  const completed = r?.postmortem_completed === true || r?.postmortem_completed === 1 || pm?.status === "completed" || /done|complete/i.test(String(r?.postmortem_report || ""));
  return { key: keyOf(pm?.requested_at || pm?.created_at || r?.postmortem_date || r?.date_admitted || r?.created_at), completed };
};

const initialsOf = (name) => String(name || "?").trim().split(/\s+/).map((n) => n.charAt(0)).join("").slice(0, 2).toUpperCase() || "?";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* branch present in the data */
const branchOf = (r) => (r?.branch_name || r?.branch || "Main") || "Main";

/* ── design status config (Funeral Home Branch View) ── */
const STATUS_CFG = {
  active:      { label: "Active / In Morgue", color: "#00296B", bg: "rgba(0, 41, 107, 0.1)" },
  pmReq:       { label: "PM Requested",       color: "#E36414", bg: "rgba(227, 100, 20, 0.1)" },
  pmDone:      { label: "PM Done",            color: "#5F0F40", bg: "rgba(95, 15, 64, 0.1)" },
  released:    { label: "Released",           color: "#03071E", bg: "rgba(3, 7, 30, 0.1)" },
  transferred: { label: "Transferred",        color: "#03071E", bg: "rgba(3, 7, 30, 0.1)" },
};
const statusKeyOf = (r) => {
  const st = statusSignalOf(r);
  if (isReleased(r)) return /transfer/.test(st) ? "transferred" : "released";
  const pm = pmMetaOf(r);
  if (pm?.completed) return "pmDone";
  if (pm || r?.body_status === "Pending Autopsy") return "pmReq";
  return "active";
};
const dotColorOf = (r) => ({ active: "#00296B", pmReq: "#E36414", pmDone: "#5F0F40", released: "#03071E", transferred: "#03071E" }[statusKeyOf(r)] || "#cccccc");

const fmtDate = (k) => {
  const [y, m, d] = String(k || "").split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const daysSince = (k) => {
  const [y, m, d] = String(k || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.ceil(Math.abs(new Date() - new Date(y, m - 1, d)) / 86400000);
};

/* ═══════ Funeral Home Dashboard · Branch View — design tokens + CSS ═══════ */

const CSS = `
.fhq *{box-sizing:border-box;margin:0;padding:0}
.fhq{
  --black:#0a0a0a;--dark:#1a1a1a;--mid:#444444;--gray:#777777;--lightGray:#aaaaaa;
  --border:#e0e0e0;--borderLight:#efefef;--bgField:#f7f7f5;--bgSection:#fafaf9;--bgApp:#ececec;
  --exportBtn:#0F3040;--success:#047857;--successBg:#ecfdf5;--warning:#b45309;--warningBg:#fffbeb;
  --danger:#dc2626;--dangerBg:#fef2f2;--info:#1e3a8a;--infoBg:#e0e7ff;
  --cBlue:#00296B;--cOrange:#E36414;--cPurple:#5F0F40;--cPink:#DD2D4A;--cNavy:#03071E;--accent:#DD2D4A;
  background:var(--bgApp);border-radius:14px;padding:24px;color:var(--dark);
  font-family:'Source Sans 3',-apple-system,sans-serif;font-size:14px;line-height:1.5;min-height:200px;
  animation:fhqFadeIn .25s ease-out;
}
.fhq *::before,.fhq *::after{box-sizing:border-box}
.fhq ::-webkit-scrollbar{width:6px;height:6px}
.fhq ::-webkit-scrollbar-thumb{background:#dddddd;border-radius:4px}
.fhq ::-webkit-scrollbar-track{background:transparent}
.fhq button{cursor:pointer;font-family:'Source Sans 3',sans-serif}
@keyframes fhqFadeIn{from{opacity:0}to{opacity:1}}
@keyframes fhqSpin{to{transform:rotate(360deg)}}
@keyframes fhqPulse{0%,100%{opacity:1}50%{opacity:.3}}
/* ── Header ── */
.fhq .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:16px}
.fhq .page-header h1{font-family:'Merriweather',serif;font-size:28px;color:var(--black);font-weight:900;margin:0}
.fhq .page-header p{color:var(--gray);font-size:15px;margin-top:4px}
.fhq .header-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.fhq .filter-wrapper{position:relative;display:flex;align-items:center;min-width:220px}
.fhq .filter-select{height:42px;width:100%;border-radius:10px;border:1px solid var(--border);background:var(--bgField);padding:0 36px 0 16px;font-size:14px;font-weight:600;font-family:'Source Sans 3',sans-serif;color:var(--dark);transition:all .25s ease;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer}
.fhq .filter-select:focus{background:#fff;border-color:var(--accent);box-shadow:0 0 0 4px rgba(221,45,74,.1)}
.fhq .icon-right{position:absolute;right:14px;color:var(--gray);pointer-events:none;font-size:12px;display:flex}
/* ── Buttons ── */
.fhq .btn{height:42px;padding:0 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;border:1px solid transparent;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Source Sans 3',sans-serif;white-space:nowrap}
.fhq .btn-danger{background:var(--danger);color:#fff;box-shadow:0 4px 12px rgba(220,38,38,.2);border:none}
.fhq .btn-danger:hover{background:#b91c1c;transform:translateY(-1px)}
.fhq .btn-primary{background:var(--black);color:#fff;border:none}
.fhq .btn-primary:hover{background:var(--dark)}
.fhq .btn-sm{height:32px;padding:0 16px;font-size:13px;border-radius:8px}
.fhq .spin{display:inline-flex;animation:fhqSpin .8s linear infinite}
/* ── Stats Grid ── */
.fhq .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px}
.fhq .stat-card{background:#fff;border:1px solid var(--borderLight);border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 12px rgba(0,0,0,.03)}
.fhq .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0}
.fhq .stat-info h3{margin:0;font-size:24px;font-weight:800;color:var(--black);font-family:'Source Sans 3',sans-serif;line-height:1.1}
.fhq .stat-info span{font-size:13px;color:var(--gray);font-weight:500}
/* ── Banners ── */
.fhq .fhq-banner{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;margin-bottom:20px}
.fhq .fhq-banner.info{background:var(--infoBg);color:var(--info)}
.fhq .fhq-banner.error{background:var(--dangerBg);color:var(--danger)}
/* ── Horizontal Calendar (CoffinBook style) ── */
.fhq .calendar-container{background:#fff;border:1px solid var(--borderLight);border-radius:16px;padding:20px 24px;margin-bottom:24px;box-shadow:0 4px 15px rgba(0,0,0,.04)}
.fhq .cal-nav{display:flex;align-items:center;justify-content:space-between;padding:0 0 16px;border-bottom:1px solid var(--borderLight);margin-bottom:16px;flex-wrap:wrap;gap:8px}
.fhq .cal-title{font-family:'Merriweather',serif;font-size:18px;font-weight:700;color:var(--black);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fhq .day-chip{display:inline-flex;align-items:center;gap:6px;font-family:'Source Sans 3',sans-serif;font-size:11px;font-weight:700;color:#fff;background:var(--accent);border:none;border-radius:20px;padding:4px 10px;cursor:pointer}
.fhq .day-chip:hover{background:#b92039}
.fhq .cal-nav-actions{display:flex;gap:8px}
.fhq .cal-nav-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:var(--bgField);color:var(--mid);cursor:pointer;font-size:12px;line-height:1;transition:all .15s;flex-shrink:0}
.fhq .cal-nav-btn:hover{background:var(--bgSection);border-color:var(--gray);color:var(--black)}
.fhq .cal-strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}
.fhq .cal-day{flex:1 0 50px;min-width:50px;padding:8px 4px;border-radius:10px;border:1px solid transparent;background:var(--bgField);text-align:center;cursor:pointer;transition:all .15s ease;display:flex;flex-direction:column;align-items:center;gap:4px}
.fhq .cal-day:hover{background:#fff;border-color:var(--border);box-shadow:0 2px 4px rgba(0,0,0,.05)}
.fhq .cal-day.today{border:1px solid var(--danger)}
.fhq .cal-day.selected{background:var(--danger);color:#fff;transform:scale(1.05);box-shadow:0 4px 12px rgba(220,38,38,.3)}
.fhq .cal-day-name{font-size:9px;font-weight:700;text-transform:uppercase;color:var(--gray);letter-spacing:.05em}
.fhq .cal-day.selected .cal-day-name{color:rgba(255,255,255,.8)}
.fhq .cal-day-num{font-size:16px;font-weight:700;color:var(--dark);font-family:'Merriweather',serif}
.fhq .cal-day.selected .cal-day-num{color:#fff}
.fhq .cal-dots{display:flex;gap:2px;height:5px;align-items:center}
.fhq .cal-dot{width:5px;height:5px;border-radius:50%}
.fhq .cal-day.loading{opacity:.55;pointer-events:none}
/* ── 2x2 Quad Grid ── */
.fhq .quad-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;align-items:stretch}
@media(max-width:1100px){.fhq .quad-grid{grid-template-columns:minmax(0,1fr)}}
/* ── List Card & Table ── */
/* Card height is viewport-relative so the quad scales with the screen:
   big monitors get taller cards (no cramped 520px cap), while the cards
   still never exceed the visible area. */
.fhq .list-card{background:#fff;border:1px solid var(--borderLight);border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.03);display:flex;flex-direction:column;max-height:min(520px,62vh)}
@media(min-width:1600px){.fhq .list-card{max-height:min(680px,72vh)}}
.fhq .list-header{background:var(--bgSection);padding:20px 24px;border-bottom:1px solid var(--borderLight);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.fhq .list-header h2{font-family:'Merriweather',serif;font-size:18px;font-weight:700;color:var(--black);margin:0}
.fhq .badge-count{background:var(--black);color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;white-space:nowrap}
.fhq .table-wrap{width:100%;overflow-y:auto;overflow-x:auto;flex:1}
.fhq table{width:100%;border-collapse:collapse;min-width:420px}
.fhq thead th{text-align:left;padding:14px 24px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--gray);border-bottom:1px solid var(--borderLight);background:var(--bgSection);white-space:nowrap;position:sticky;top:0;z-index:10}
.fhq thead th:last-child{text-align:right}
.fhq tbody tr{border-bottom:1px solid var(--borderLight);cursor:pointer;transition:background .15s}
.fhq tbody tr:last-child{border-bottom:none}
.fhq tbody tr:hover{background:var(--bgField)}
.fhq td{padding:16px 24px;font-size:14px;color:var(--dark);vertical-align:middle}
.fhq td:last-child{text-align:right}
.fhq .name-cell{display:flex;align-items:center;gap:12px}
.fhq .avatar{width:38px;height:38px;border-radius:50%;background:var(--black);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
.fhq .avatar.female{background:var(--cPurple)}
.fhq .meta{font-size:12px;color:var(--gray);margin-top:2px}
.fhq .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:5px;font-size:12px;font-weight:700;text-transform:capitalize;white-space:nowrap}
.fhq .status-badge::before{content:'';width:6px;height:6px;background:currentColor;border-radius:50%}
.fhq .empty-row{text-align:center;padding:40px;color:var(--gray);font-style:italic}
/* ── Analytics Charts Container ── */
.fhq .charts-container{padding:24px;display:grid;grid-template-columns:1fr 1.5fr;gap:24px;height:100%;min-height:0}
@media(max-width:1400px){.fhq .charts-container{grid-template-columns:minmax(0,1fr)}}
/* Analytics card body must scroll when the stacked charts exceed the card
   height (charts stack to 2 columns below 1400px) — the wrapper keeps the
   .table-wrap overflow-y:auto behaviour inherited from the quad cards. */
.fhq .charts-container .chart-box{display:flex;flex-direction:column;min-width:0;min-height:0}
.fhq .chart-title{font-family:'Merriweather',serif;font-size:14px;font-weight:700;color:var(--dark);margin-bottom:16px}
.fhq .chart-canvas-wrap{flex:1;position:relative;min-height:180px;max-height:min(300px,38vh)}
/* Chart.js responsive sizing needs the canvas to fill its wrapper. */
.fhq .chart-canvas-wrap canvas{width:100%!important;height:100%!important;display:block}
`;

/* ── inline SVG icons (Font Awesome stand-ins from the reference design) ── */
const Ic = ({ d, s = 16, sw = 2, className, children, style }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {d ? <path d={d} /> : null}
    {children}
  </svg>
);
const ICO = {
  bed: { children: <><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 17h20" /></> },
  vial: { children: <><path d="M14 2v6a2 2 0 0 0 .24.96l5.5 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.74-2.96l5.5-10.08A2 2 0 0 0 10 8V2" /><path d="M6.5 2h7" /><path d="M7 16h10" /></> },
  clip: { children: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></> },
  heart: { children: <><path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" /><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 15 6 6" /></> },
  sync: { s: 14, children: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></> },
  chevDown: { s: 12, children: <polyline points="6 9 12 15 18 9" /> },
  chevLeft: { s: 12, children: <polyline points="15 18 9 12 15 6" /> },
  chevRight: { s: 12, children: <polyline points="9 18 15 12 9 6" /> },
  calDay: { s: 12, children: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><circle cx="12" cy="16" r="2" fill="currentColor" stroke="none" /></> },
  chev: { d: "M9 6l6 6-6 6", s: 14, sw: 2.4 },
};

/* ── Chart.js hook (renders into a canvas ref, re-runs on deps) ── */
function useChart(ref, fn, deps) {
  const cr = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    if (cr.current) { cr.current.destroy(); cr.current = null; }
    ChartJS.defaults.color = "#777777";
    ChartJS.defaults.borderColor = "#efefef";
    ChartJS.defaults.font.family = "'Source Sans 3',-apple-system,sans-serif";
    ChartJS.defaults.font.size = 11;
    cr.current = new ChartJS(ref.current, fn());
    return () => { if (cr.current) { cr.current.destroy(); cr.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return cr;
}
/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function DeceasedQuad({ events = {}, loading = false, dateKey = null, deceased = [], onPickDate, onSelect }) {
  const activeKey = dateKey || todayKeyVal();
  const onPick = typeof onPickDate === "function" ? onPickDate : () => {};
  const onOpen = typeof onSelect === "function" ? onSelect : () => {};

  /* back to the normal All-Deceased list page (/tenant/:slug/deceased) */
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const dashSlug = urlSlug || localStorage.getItem("tenantSlug") || "";
  const backToAllDeceased = () => navigate(`/tenant/${dashSlug}/deceased`);

  /* ── Real postmortem REQUESTS (deceased-service tracker table) ── */
  const [pmRequests, setPmRequests] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchPostmortemsFeed()
      .then((rows) => { if (alive) setPmRequests(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* feed optional — legacy derivation still applies */ });
    return () => { alive = false; };
  }, []);

  /* ── Real RELEASES (body-checkout body_releases feed) ── */
  const [releaseFeed, setReleaseFeed] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchReleasesFeed()
      .then((rows) => { if (alive) setReleaseFeed(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* feed optional — legacy derivation still applies */ });
    return () => { alive = false; };
  }, []);

  /* Org-wide deceased across ALL branches — powers the branch filter */
  const [allBranchDeceased, setAllBranchDeceased] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchAllBranchDeceased()
      .then((rows) => { if (alive) setAllBranchDeceased(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* keep previous */ });
    return () => { alive = false; };
  }, []);

  /* refresh button — spins then refetches the multi-branch feed */
  const [refreshing, setRefreshing] = useState(false);
  const refreshData = () => {
    setRefreshing(true);
    fetchAllBranchDeceased(true)
      .then((rows) => setAllBranchDeceased(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  /* ── Branch filter (command-centre style, instant client-side scoping) ── */
  const branchOptions = useMemo(() => {
    const set = [];
    allBranchDeceased.forEach((r) => { const b = branchOf(r); if (b && !set.includes(b)) set.push(b); });
    deceased.forEach((r) => { const b = branchOf(r); if (b && !set.includes(b)) set.push(b); });
    return set;
  }, [allBranchDeceased, deceased]);
  const [branchFilter, setBranchFilter] = useState("");
  /* the `deceased` prop is already scoped by ModuleDashboard's selector;
     this filter narrows further (or widens to all branches when "All") */
  const viewData = useMemo(() => {
    if (!branchFilter) return deceased;
    const scoped = allBranchDeceased.filter((r) => branchOf(r) === branchFilter);
    return scoped.length ? scoped : deceased.filter((r) => branchOf(r) === branchFilter);
  }, [branchFilter, deceased, allBranchDeceased]);

  /* register index for deceased_id → record joins (name / ADM no) */
  const dIndex = useMemo(() => {
    const m = new Map();
    deceased.forEach((r) => {
      if (r?.deceased_id != null) m.set(String(r.deceased_id), r);
      if (r?.id != null) m.set(String(r.id), r);
      if (r?.admission_number) m.set(String(r.admission_number), r);
    });
    return m;
  }, [deceased]);

  /* tracked requests → rich rows (same shape the old quad produced) */
  const pmReqItems = useMemo(() => pmRequests.map((q) => {
    const rec = dIndex.get(String(q?.deceased_id)) || null;
    const num = rec?.admission_number || "";
    const status = String(q?.status || "initiated").toLowerCase();
    const exam = String(q?.exam_status || "").toLowerCase();
    const completed = exam === "completed";
    const cancelled = status === "cancelled";
    const sent = status === "sent";
    return {
      id: num ? `pm-${num}` : `pm-req-${q?.id}`,
      name: rec?.full_name || q?.requested_by || "Unknown",
      meta: num || q?.request_ref || "",
      sub: [q?.reason, q?.requesting_authority].filter(Boolean).join(" · ") || `Requested by ${q?.requested_by || "—"}`,
      tag: cancelled ? "Cancelled" : completed ? "Completed" : sent ? "Awaiting Exam" : "Requested",
      tagColor: cancelled ? "#6B7280" : completed ? "#0F766E" : sent ? "#2563EB" : "#D97706",
      when: cancelled ? "Cancelled" : completed ? "Completed" : sent ? "Sent" : "Requested",
      branch: rec ? branchOf(rec) : "",
      _key: keyOf(q?.created_at || q?.updated_at),
      _rec: rec,
      _completed: completed,
      _cancelled: cancelled,
      /* raw tracker payload — the side panel renders the full request from this */
      pm_request: {
        id: q?.id, request_ref: q?.request_ref, reason: q?.reason,
        requesting_authority: q?.requesting_authority, requested_by: q?.requested_by,
        status: q?.status || "initiated", created_at: q?.created_at, sent_at: q?.sent_at,
        exam_status: q?.exam_status || null, exam_completed_at: q?.exam_completed_at || null,
      },
    };
  }), [pmRequests, dIndex]);
  const pmReqNums = useMemo(() => new Set(pmReqItems.map((p) => String(p.meta)).filter(Boolean)), [pmReqItems]);

  /* release feed → dashboard row shape (id `rel-<admission>` keeps the
     ModuleDashboard onSelect lookup working) */
  const relFeedItems = useMemo(() => releaseFeed.map((q) => {
    const adm = q?.admission_number || q?.admission_no || "";
    const rk = keyOf(q?.date_of_removal || q?.release_date || q?.created_at);
    return {
      id: adm ? `rel-${adm}` : `rel-feed-${q?.release_id || q?.id}`,
      name: q?.name_of_deceased || q?.deceased_name || q?.full_name || q?.received_by || "Unknown",
      meta: adm,
      sub: q?.next_kin || q?.received_by || q?.mode_of_transport || "",
      dest: q?.destination || q?.release_to || q?.next_kin || "",
      tag: "Released", tagColor: "#10B981",
      when: q?.time_of_removal || "",
      branch: branchOf(q),
      _key: rk,
      _date: rk,
      ...(q || {}),
    };
  }), [releaseFeed]);
  const relFeedNums = useMemo(() => new Set(relFeedItems.map((r) => String(r.meta)).filter(Boolean)), [relFeedItems]);

  /* keep the release feed in the same branch scope as the register rows */
  const scopeBranch = useMemo(() => {
    const set = [...new Set(deceased.map((r) => branchOf(r)))].filter(Boolean);
    return set.length === 1 ? set[0] : "";
  }, [deceased]);
  const relFeedScoped = useMemo(
    () => (scopeBranch && !branchFilter ? relFeedItems.filter((r) => branchOf(r) === scopeBranch) : relFeedItems),
    [relFeedItems, scopeBranch, branchFilter]
  );

  /* ── stat-card numbers (Active Intake · PM Requested · PM Done · Released) ── */
  /* tracked PM requests are deduped against register rows that already carry
     postmortem flags, so a body is never counted twice */
  const viewPmFlagged = useMemo(() => {
    const set = new Set();
    viewData.forEach((r) => { if (pmMetaOf(r)) set.add(String(r?.admission_number || "")); });
    return set;
  }, [viewData]);
  const stats = useMemo(() => {
    let active = 0, pmRequested = 0, pmDone = 0, released = 0;
    viewData.forEach((r) => {
      const k = statusKeyOf(r);
      if (k === "active") active += 1;
      else if (k === "pmReq") pmRequested += 1;
      else if (k === "pmDone") { pmDone += 1; pmRequested += 1; }
      else released += 1;
    });
    pmReqItems.forEach((p) => {
      if (p._cancelled || viewPmFlagged.has(String(p.meta))) return;
      if (p._completed) pmDone += 1; else pmRequested += 1;
    });
    const relFromFeed = relFeedScoped.filter((r) => {
      const adm = String(r.meta || "");
      return !adm || !viewData.some((v) => String(v?.admission_number || "") === adm && isReleased(v));
    }).length;
    released += relFromFeed;
    return { total: viewData.length + relFromFeed, active, pmRequested, pmDone, released };
  }, [viewData, pmReqItems, relFeedScoped, viewPmFlagged]);

  /* ── last 7 days ── */
  const last7 = useMemo(() => {
    const a = []; const t = new Date(); t.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) { const d = new Date(t); d.setDate(t.getDate() - i); a.push(d); }
    return a;
  }, []);
  const admSeries7 = useMemo(() => last7.map((d) => viewData.filter((r) => admKeyOf(r) === dk(d)).length), [viewData, last7]);
  const relSeries7 = useMemo(() => last7.map((d) => {
    const k = dk(d);
    return relFeedScoped.filter((r) => r._key === k).length
      + viewData.filter((r) => isReleased(r) && relKeyOf(r) === k && !relFeedNums.has(String(r?.admission_number || ""))).length;
  }), [viewData, last7, relFeedScoped, relFeedNums]);

  /* status breakdown for the doughnut (same dedupe as the stat cards) */
  const statusSeg = useMemo(() => {
    let care = 0, pm = 0, rel = 0;
    viewData.forEach((r) => {
      const k = statusKeyOf(r);
      if (k === "active") care += 1;
      else if (k === "pmReq" || k === "pmDone") pm += 1;
      else rel += 1;
    });
    pmReqItems.forEach((p) => { if (!p._cancelled && !viewPmFlagged.has(String(p.meta))) pm += 1; });
    return { care, pm, rel };
  }, [viewData, pmReqItems, viewPmFlagged]);

  /* ── calendar state (horizontal strip) ── */
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartMonth = useMemo(() => {
    const [y, m] = String(activeKey).split("-").map(Number);
    return (y && m) ? m - 1 : new Date().getMonth();
  }, [activeKey]);
  const calStartYear = useMemo(() => {
    const [y] = String(activeKey).split("-").map(Number);
    return y || new Date().getFullYear();
  }, [activeKey]);
  /* the strip jumps to the picked day's month when it changes via the mini calendar */
  useEffect(() => {
    if (calMonth !== calStartMonth || calYear !== calStartYear) { setCalMonth(calStartMonth); setCalYear(calStartYear); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const changeMonth = (dir) => {
    let m = calMonth + dir, y = calYear;
    if (m > 11) { m = 0; y += 1; }
    if (m < 0) { m = 11; y -= 1; }
    setCalMonth(m); setCalYear(y);
  };
  const goToday = () => {
    const t = new Date();
    setCalYear(t.getFullYear()); setCalMonth(t.getMonth());
    onPick(todayKeyVal());
  };
  const pickDay = (y, m, d) => onPick(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  /* ── events map for calendar dots: { 'YYYY-MM-DD': [colors, …] } ──
     merges the ModuleDashboard miniEvents feed (class colors) with the
     deceased register + release feed (status colors) */
  const CAL_CLASS_COLOR = { red: "#DC2626", blue: "#00296B", green: "#047857", orange: "#E36414", purple: "#5F0F40" };
  const calDots = useMemo(() => {
    const map = {};
    const add = (k, color) => {
      if (!k || map[k]?.length >= 3) return;
      if (!map[k]) map[k] = [];
      if (!map[k].includes(color)) map[k].push(color);
    };
    Object.entries(events || {}).forEach(([k, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach((ev) => add(k, CAL_CLASS_COLOR[ev?.c] || "#00296B"));
    });
    viewData.forEach((r) => { add(admKeyOf(r), dotColorOf(r)); });
    relFeedScoped.forEach((r) => { if (r._key) add(r._key, "#03071E"); });
    return map;
  }, [events, viewData, relFeedScoped]);

  /* ── Chart.js — Status Breakdown doughnut ── */
  const statusRef = useRef(null);
  useChart(statusRef, () => ({
    type: "doughnut",
    data: {
      labels: ["In Care", "Postmortem", "Released"],
      datasets: [{
        data: [statusSeg.care, statusSeg.pm, statusSeg.rel],
        backgroundColor: ["#00296B", "#E36414", "#03071E"],
        borderWidth: 0, hoverOffset: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "55%",
      plugins: { legend: { position: "bottom", labels: { font: { family: "'Source Sans 3',sans-serif", size: 12 }, color: "#1a1a1a", boxWidth: 15, padding: 15 } } },
    },
  }), [statusSeg.care, statusSeg.pm, statusSeg.rel]);

  /* ── Chart.js — 7-Day Activity (Intake vs Releases) ── */
  const activityRef = useRef(null);
  useChart(activityRef, () => ({
    type: "bar",
    data: {
      labels: last7.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d.getDay()]),
      datasets: [
        { label: "Intake", data: admSeries7, backgroundColor: "#00296B", borderRadius: 4, barPercentage: 0.6 },
        { label: "Releases", data: relSeries7, backgroundColor: "#DD2D4A", borderRadius: 4, barPercentage: 0.6 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { font: { family: "'Source Sans 3',sans-serif", size: 12 }, color: "#1a1a1a", boxWidth: 15, padding: 15 } } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: "#777777", font: { family: "'Source Sans 3',sans-serif" } }, grid: { color: "#efefef" } },
        x: { ticks: { color: "#777777", font: { family: "'Source Sans 3',sans-serif" } }, grid: { display: false } },
      },
    },
  }), [admSeries7, relSeries7]);

  /* ── Quad table lists ── */
  /* 02 · Deceased Intake — bodies currently in the morgue (newest first) */
  const intakeList = useMemo(
    () => viewData
      .filter((r) => admKeyOf(r) && !isReleased(r))
      .slice()
      .sort((a, b) => String(admKeyOf(b)).localeCompare(String(admKeyOf(a))))
      .slice(0, 100),
    [viewData]
  );
  /* 03 · Releases & Transfers — real handovers first, then legacy derivations */
  const releaseList = useMemo(() => {
    const rows = [
      ...relFeedScoped.map((r) => ({
        id: r.id, name: r.name, meta: r.meta, branch: r.branch,
        date: r._date, dest: r.dest || r.sub || "",
        status: "Released",
        raw: r,
      })),
      ...viewData
        .filter((r) => isReleased(r) && !relFeedNums.has(String(r?.admission_number || "")))
        .map((r, i) => ({
          id: `rel-${r?.admission_number ?? r?.id ?? i}`, name: r?.full_name || "Unknown",
          meta: r?.admission_number || "", branch: branchOf(r),
          date: relKeyOf(r) || admKeyOf(r), dest: r?.destination || r?.release_to || r?.next_kin || r?.dispatched_to || "",
          status: /transfer/i.test(statusSignalOf(r)) ? "Transferred" : "Released",
          raw: r,
        })),
    ];
    return rows
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 100);
  }, [relFeedScoped, relFeedNums, viewData]);
  /* 04 · Postmortem Requests — tracked requests first, then legacy derivations */
  const pmList = useMemo(() => {
    const rows = [
      ...pmReqItems.map((p) => ({
        id: p.id, name: p.name, meta: p.meta, branch: p.branch,
        date: p._key, status: p._cancelled ? "Cancelled" : p._completed ? "PM Done" : "Requested",
        sub: p.sub, pm_request: p.pm_request,
      })),
      ...viewData
        .map((r, i) => ({ r, i, pm: pmMetaOf(r) }))
        .filter(({ r, pm }) => pm && !pmReqNums.has(String(r?.admission_number || "")))
        .map(({ r, i, pm }) => ({
          id: `pm-${r?.admission_number ?? r?.id ?? i}`, name: r?.full_name || "Unknown",
          meta: r?.admission_number || "", branch: branchOf(r),
          date: pm.key, status: pm.completed ? "PM Done" : "Requested",
          sub: r?.cause_of_death || "", 
        })),
    ];
    return rows
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 100);
  }, [pmReqItems, pmReqNums, viewData]);

  const click = (e, item) => { e.stopPropagation(); onOpen(item); };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="fhq">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header className="page-header">
        <div>
          <h1>Funeral Home Dashboard</h1>
          <p>Select a branch to view isolated intake, releases, and postmortem requests.</p>
        </div>
        <div className="header-actions">
          {branchOptions.length > 0 && (
            <div className="filter-wrapper" style={{ maxWidth: 260 }}>
              <select className="filter-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} aria-label="Branch filter">
                <option value="">All Branches</option>
                {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <span className="icon-right"><Ic {...ICO.chevDown} /></span>
            </div>
          )}
          <button className="btn btn-danger" onClick={refreshData} title="Refresh data">
            <span className={refreshing ? "spin" : ""}><Ic {...ICO.sync} /></span> Refresh
          </button>
        </div>
      </header>

      {/* ── Quick Stats Dashboard ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#00296B" }}><Ic {...ICO.bed} /></div>
          <div className="stat-info"><h3>{stats.active}</h3><span>Active Intake (Branch)</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#E36414" }}><Ic {...ICO.vial} /></div>
          <div className="stat-info"><h3>{stats.pmRequested}</h3><span>Postmortem Requested</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#5F0F40" }}><Ic {...ICO.clip} /></div>
          <div className="stat-info"><h3>{stats.pmDone}</h3><span>Postmortem Completed</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#03071E" }}><Ic {...ICO.heart} /></div>
          <div className="stat-info"><h3>{stats.released}</h3><span>Released / Transferred</span></div>
        </div>
      </div>

      {loading && (
        <div className="fhq-banner info"><Ic {...ICO.sync} /> <span>Fetching live deceased records from the backend…</span></div>
      )}

      {/* ── Horizontal Calendar (CoffinBook style with dots) ── */}
      <div className="calendar-container">
        <div className="cal-nav">
          <span className="cal-title">
            {MO[calMonth]} {calYear}
            {activeKey !== todayKeyVal() && (
              <button className="day-chip" onClick={goToday} title="Back to today">✕ {fmtDate(activeKey)}</button>
            )}
          </span>
          <div className="cal-nav-actions">
            <button className="cal-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month"><Ic {...ICO.chevLeft} /></button>
            <button className="cal-nav-btn" onClick={goToday} aria-label="Go to today" title="Today"><Ic {...ICO.calDay} /></button>
            <button className="cal-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month"><Ic {...ICO.chevRight} /></button>
          </div>
        </div>
        <div className="cal-strip">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dObj = new Date(calYear, calMonth, day);
            const isToday = key === todayKeyVal();
            const isSelected = key === activeKey;
            const dots = calDots[key] || [];
            return (
              <div
                key={day}
                className={`cal-day${isToday ? " today" : ""}${isSelected ? " selected" : ""}${loading ? " loading" : ""}`}
                onClick={() => pickDay(calYear, calMonth, day)}
                title={dots.length ? `${day} ${MO[calMonth]} — ${dots.length} event type${dots.length > 1 ? "s" : ""}` : undefined}
              >
                <div className="cal-day-name">{DOWS[dObj.getDay()]}</div>
                <div className="cal-day-num">{day}</div>
                <div className="cal-dots">
                  {dots.map((c, i) => (
                    <span key={i} className="cal-dot" style={{ background: isSelected ? "rgba(255,255,255,0.8)" : c }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2x2 Quad Grid ── */}
      <div className="quad-grid">

        {/* 1 · Analytics & Summary (WITH CHARTS) */}
        <div className="list-card">
          <div className="list-header">
            <h2>Branch Analytics</h2>
            <span className="badge-count" style={{ background: "#00296B" }}>Live Metrics</span>
          </div>
          {/* overflow-y comes from .table-wrap — the stacked charts must be
              scrollable inside the card, never clipped. */}
          <div className="table-wrap">
            <div className="charts-container">
              <div className="chart-box">
                <div className="chart-title">Status Breakdown</div>
                <div className="chart-canvas-wrap"><canvas ref={statusRef} /></div>
              </div>
              <div className="chart-box">
                <div className="chart-title">7-Day Activity (Intake vs Releases)</div>
                <div className="chart-canvas-wrap"><canvas ref={activityRef} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 · Deceased Intake */}
        <div className="list-card">
          <div className="list-header">
            <h2>Deceased Intake</h2>
            <span className="badge-count">{intakeList.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Deceased Name</th><th>Date Admitted</th><th>Days in Morgue</th><th>Action</th></tr>
              </thead>
              <tbody>
                {intakeList.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">No active intake records for this branch</td></tr>
                ) : intakeList.map((r, i) => {
                  const female = String(r?.sex || r?.gender || "").toLowerCase().indexOf("f") === 0;
                  const days = daysSince(admKeyOf(r));
                  const item = { ...r, id: `in-${r?.admission_number ?? r?.id ?? i}`, full_name: r?.full_name || "Unknown" };
                  return (
                    <tr key={item.id} onClick={() => onOpen(item)}>
                      <td>
                        <div className="name-cell">
                          <div className={`avatar${female ? " female" : ""}`}>{initialsOf(r?.full_name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{esc(r?.full_name || "Unknown")}</div>
                            <div className="meta">{esc(branchOf(r))} · {esc(r?.admission_number || "—")}</div>
                          </div>
                        </div>
                      </td>
                      <td>{fmtDate(admKeyOf(r))}{timeOf(r) ? <div className="meta">{timeOf(r)}</div> : null}</td>
                      <td>{days != null ? `${days} days` : "—"}</td>
                      <td><button className="btn btn-sm btn-primary" onClick={(e) => click(e, item)}>View Profile</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 · Releases & Transfers */}
        <div className="list-card">
          <div className="list-header">
            <h2>Releases &amp; Transfers</h2>
            <span className="badge-count" style={{ background: "#03071E" }}>{releaseList.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Deceased Name</th><th>Release Date</th><th>Destination</th><th>Action</th></tr>
              </thead>
              <tbody>
                {releaseList.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">No releases or transfers logged</td></tr>
                ) : releaseList.map((r) => {
                  const item = { ...(r.raw || {}), id: r.id, name: r.name, meta: r.meta, admission_number: r.meta, full_name: r.name };
                  const badge = r.status === "Transferred" ? STATUS_CFG.transferred : STATUS_CFG.released;
                  return (
                    <tr key={r.id} onClick={() => onOpen(item)}>
                      <td>
                        <div className="name-cell">
                          <div className="avatar">{initialsOf(r.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{esc(r.name)}</div>
                            <div className="meta">{esc(r.meta || "—")}{r.branch ? ` · ${esc(r.branch)}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>{fmtDate(r.date)}</td>
                      <td>
                        <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        <div className="meta" style={{ marginTop: 4 }}>{esc(r.dest || "N/A")}</div>
                      </td>
                      <td><button className="btn btn-sm btn-primary" onClick={(e) => click(e, item)}>View Profile</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4 · Postmortem Requests */}
        <div className="list-card">
          <div className="list-header">
            <h2>Postmortem Requests</h2>
            <span className="badge-count" style={{ background: "#E36414" }}>{pmList.filter((p) => p.status !== "PM Done" && p.status !== "Cancelled").length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Deceased Name</th><th>Date Requested</th><th>Current Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pmList.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">No postmortem requests for this branch</td></tr>
                ) : pmList.map((p) => {
                  const badge = p.status === "PM Done" ? STATUS_CFG.pmDone : p.status === "Cancelled" ? { label: "Cancelled", color: "#6B7280", bg: "rgba(107,114,128,.12)" } : STATUS_CFG.pmReq;
                  const item = p.pm_request
                    ? { id: p.id, name: p.name, meta: p.meta, pm_request: p.pm_request }
                    : { id: p.id, name: p.name, meta: p.meta };
                  return (
                    <tr key={p.id} onClick={() => onOpen(item)}>
                      <td>
                        <div className="name-cell">
                          <div className="avatar" style={{ background: "#E36414" }}>{initialsOf(p.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{esc(p.name)}</div>
                            <div className="meta">{esc(p.meta || "—")}{p.branch ? ` · ${esc(p.branch)}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>{fmtDate(p.date)}</td>
                      <td>
                        <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        {p.sub ? <div className="meta" style={{ marginTop: 4, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{esc(p.sub)}</div> : null}
                      </td>
                      <td><button className="btn btn-sm btn-primary" onClick={(e) => click(e, item)}>View Request</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
