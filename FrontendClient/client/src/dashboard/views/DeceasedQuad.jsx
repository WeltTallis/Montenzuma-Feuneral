import { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HorizontalCalendar from "../../components/views/horizontalCalender";
import DayBreakdownPanel from "./DayBreakdownPanel";
import { fetchReleasesFeed, fetchPostmortemsFeed } from "../../api/dashboardFeedApi";
import { fetchAllBranchDeceased } from "../../api/dashboardDataApi";

/* ════════════════════════════════════════════════════════════════
   Deceased dashboard — "Havenwood" style.

   Same props contract as before (events, loading, dateKey, deceased,
   onPickDate, onSelect) so ModuleDashboard wiring & the existing
   DeceasedSidePanel (untouched) keep working. Rows open the side
   panel via onSelect.

   Visual = Havenwood reference: glow KPI tiles + a 2x2 card grid with
   a smooth multi-branch SVG trend, per-branch bar charts, filter
   chips and a clean ledger.
   ════════════════════════════════════════════════════════════════ */

/* ── constants & helpers ── */
const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOWS = ["S", "M", "T", "W", "T", "F", "S"];
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
const isReleased = (r) => RELEASED_RE.test(String(r?.status || r?.admission_status || "").toLowerCase());

const pmMetaOf = (r) => {
  const pm = r?.postmortem || null;
  const bodyStr = `${r?.body_status || ""} ${r?.admission_status || ""}`.toLowerCase();
  const requested = r?.postmortem_requested === true || r?.postmortem_requested === 1 || Boolean(pm?.requested_at || pm?.created_at) || PM_RE.test(bodyStr);
  if (!requested) return null;
  const completed = r?.postmortem_completed === true || r?.postmortem_completed === 1 || pm?.status === "completed" || /done|complete/i.test(String(r?.postmortem_report || ""));
  return { key: keyOf(pm?.requested_at || pm?.created_at || r?.postmortem_date || r?.date_admitted || r?.created_at), completed };
};

const prettyDate = (k) => { const [y, m, d] = String(k).split("-").map(Number); if (!y || !m || !d) return { day: "", short: "" }; const dt = new Date(y, m - 1, d); return { day: WD[dt.getDay()], short: `${d} ${MO[m - 1]}` }; };
const initialOf = (name) => { const s = String(name || "").trim(); if (!s) return "?"; const tail = s.includes("\u00b7") ? s.split("\u00b7").pop() : s; return (tail.trim().charAt(0) || "?").toUpperCase(); };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PALETTE = ["#22C55E", "#F97316", "#EF4444", "#8B5CF6", "#0EA5E9", "#F59E0B"];

/* branch present in the data */
const branchOf = (r) => (r?.branch_name || r?.branch || "Main") || "Main";

/* ═══════ Havenwood design tokens + CSS ═══════ */

const CSS = `
.hw *{box-sizing:border-box;margin:0;padding:0}
.hw{--page:#F0F2F7;--card:#fff;--line:#E5E8EF;--line2:#D6DBE4;--ink:#111827;--sub:#6B7280;--faint:#9CA3AF;--soft:#F7F8FB;--blue:#2563EB;--blue-d:#1D4ED8;--blue-s:#EFF6FF;--green:#16A34A;--green-s:#F0FDF4;--amber:#D97706;--amber-s:#FFFBEB;--red:#DC2626;--red-s:#FEF2F2;--violet:#7C3AED;--violet-s:#F5F3FF;--sh:0 1px 2px rgba(17,24,39,.04),0 8px 24px -12px rgba(17,24,39,.14);color:var(--ink);font-family:'Inter',system-ui,sans-serif;min-height:100%;-webkit-font-smoothing:antialiased}
.hw .mono{font-family:'IBM Plex Mono',monospace}
.hw ::-webkit-scrollbar{width:7px;height:7px}
.hw ::-webkit-scrollbar-thumb{background:#CBD2DD;border-radius:8px}
.hw button{cursor:pointer;font-family:inherit}
.hw-back{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 14px;cursor:pointer;color:var(--blue-d);font:600 12px 'Inter',sans-serif;box-shadow:0 1px 2px rgba(17,24,39,.05);margin-bottom:14px;transition:background .15s,box-shadow .15s}
.hw-back:hover{background:var(--blue-s);box-shadow:0 2px 6px rgba(29,78,216,.15)}
.hw-back .hw-arr{font-size:15px;line-height:1;flex:none}
.hw .hw-top{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}
.hw-tiles{display:flex;gap:12px;flex:1;flex-wrap:wrap;justify-content:space-between}
.hw-tile{position:relative;overflow:hidden;color:#fff;border-radius:18px;padding:15px 17px 14px;flex:1;min-width:186px;max-width:320px;display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s}
.hw-tile:hover{transform:translateY(-3px)}
.hw-tb{background:linear-gradient(135deg,#3B82F6,#8B5CF6);box-shadow:0 10px 24px -10px rgba(99,102,241,.6)}
.hw-tg{background:linear-gradient(135deg,#10B981,#22C55E);box-shadow:0 10px 24px -10px rgba(34,197,94,.55)}
.hw-to{background:linear-gradient(135deg,#F97316,#EF4444);box-shadow:0 10px 24px -10px rgba(239,68,68,.55)}
.hw-td2{background:#0F172A;box-shadow:0 10px 24px -10px rgba(15,23,42,.45)}
.hw-t-top{display:flex;align-items:center;gap:8px;position:relative}
.hw-t-ic{width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,.2);display:grid;place-items:center;flex:none}
.hw-t-label{font:600 9px 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.9}
.hw-t-mid{display:flex;align-items:center;gap:12px;margin-top:9px;position:relative}
.hw-t-num{font-size:31px;font-weight:800;letter-spacing:-.03em;line-height:1;flex:1;position:relative}
.hw-gauge{flex:none;position:relative;filter:drop-shadow(0 2px 6px rgba(15,23,42,.22))}
.hw-gauge text{font:600 9px 'IBM Plex Mono',monospace;fill:#fff}
.hw-t-sub{font:500 10px 'Inter',sans-serif;opacity:.85;margin-top:8px;position:relative}
.hw-latest{font-size:16.5px;font-weight:800;letter-spacing:-.01em;line-height:1.25;flex:1;position:relative;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hw-tile.hw-tclick{cursor:pointer}
.hw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:stretch}
.hw-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh);display:flex;flex-direction:column;overflow:hidden;min-width:0}
.hw-p-head{display:flex;align-items:center;gap:11px;padding:15px 18px 13px;border-bottom:1px solid var(--line)}
.hw-p-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none}
.hw-i-blue{background:var(--blue-s);color:var(--blue)}
.hw-i-violet{background:var(--violet-s);color:var(--violet)}
.hw-i-green{background:var(--green-s);color:var(--green)}
.hw-i-amber{background:var(--amber-s);color:var(--amber)}
.hw-p-title{font-size:15px;font-weight:700;letter-spacing:-.01em}
.hw-p-title small{display:block;font:600 9.5px 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin-top:2px}
.hw-p-meta{margin-left:auto;font:600 10.5px 'IBM Plex Mono',monospace;color:var(--faint);white-space:nowrap}
.hw-p-meta b{color:var(--ink)}
.hw-p-body{padding:16px 18px 18px;flex:1;display:flex;flex-direction:column;min-height:0;min-width:0}
.hw-empty{color:var(--faint);font-style:italic;font-size:12.5px;padding:12px 2px}
.hw-col label{color:var(--faint)}
.hw .mac{max-width:100%;width:100%}
@media(max-width:900px){.hw-grid{grid-template-columns:1fr}}
`;
const CSS4 = `
.hw-analytics{border:1px solid var(--line);border-radius:12px;padding:13px 14px 12px;margin-top:12px;background:linear-gradient(180deg,#fff,var(--soft))}
.hw-ana-head{display:flex;align-items:center;gap:7px;font:700 11px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);margin-bottom:12px}
.hw-ana-head .pulse{width:7px;height:7px;border-radius:50%;background:var(--violet);box-shadow:0 0 8px -1px var(--violet)}
.hw-ana-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.hw-ana-card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:9px 11px 8px;min-width:0}
.hw-ana-title{font:600 9px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);display:flex;align-items:center;justify-content:space-between}
.hw-ana-title b{color:var(--ink);font-weight:800}
.hw-ana-bars{position:relative;height:62px;margin-top:6px;border-bottom:1px solid var(--line)}
.hw-ana-x{display:flex;gap:10px;margin-top:5px;font:500 8px 'IBM Plex Mono',monospace;color:var(--faint)}
.hw-ana-x span{display:inline-flex;align-items:center;gap:4px}
.hw-ana-x i{width:7px;height:7px;border-radius:2px}
.hw-seg{display:flex;height:12px;border-radius:6px;overflow:hidden;margin-top:8px;background:var(--line)}
.hw-seg b{display:block;height:100%;min-width:2px}
.hw-seg-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px}
.hw-seg-legend span{display:inline-flex;align-items:center;gap:4px;font:500 8px 'IBM Plex Mono',monospace;color:var(--sub)}
.hw-seg-legend i{width:7px;height:7px;border-radius:50%}
.hw-ana-pm{display:flex;flex-direction:column;gap:7px;margin-top:8px}
.hw-ana-pm .row{display:flex;align-items:center;gap:6px;font:600 8px 'IBM Plex Mono',monospace;color:var(--sub)}
.hw-ana-pm .row .bar{flex:1;height:7px;border-radius:4px;background:var(--line);overflow:hidden}
.hw-ana-pm .row .bar i{display:block;height:100%;border-radius:4px}
.hw-ana-pm .row .bar i.pend{background:var(--amber)}
.hw-ana-pm .row .bar i.done{background:var(--green)}
.hw-ana-pm .row b{color:var(--ink);min-width:16px;text-align:right}
.hw-ana-donut{display:flex;align-items:center;gap:10px;margin-top:6px}
.hw-ana-donut svg{flex:none}
.hw-ana-donut .dl{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.hw-ana-donut .dl span{display:flex;align-items:center;gap:5px;font:500 8px 'IBM Plex Mono',monospace;color:var(--sub)}
.hw-ana-donut .dl i{width:7px;height:7px;border-radius:50%;flex:none}
.hw-ana-donut .dl b{margin-left:auto;color:var(--ink)}
@media(max-width:560px){.hw-ana-grid{grid-template-columns:1fr}}
`;
const CSS2 = `
.hw-trend{border:1px solid var(--line);border-radius:12px;padding:11px 13px 8px;margin-bottom:12px}
.hw-trend-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;flex-wrap:wrap}
.hw-trend-title{font-size:12.5px;font-weight:700}
.hw-trend-legend{margin-left:auto;display:flex;gap:12px;flex-wrap:wrap}
.hw-trend-legend span{display:inline-flex;align-items:center;gap:6px;font:500 9.5px 'IBM Plex Mono',monospace;color:var(--sub)}
.hw-trend-legend i{width:8px;height:8px;border-radius:50%}
.hw-trend-svg{height:112px;width:100%}
.hw-trend-svg svg{display:block;width:100%;height:100%}
.hw-trend-x{display:flex;padding:2px 4px 0;font:500 8.5px 'IBM Plex Mono',monospace;color:var(--faint)}
.hw-trend-x span{flex:1;text-align:center}
.hw-trend-x span.today{color:var(--ink);font-weight:700}
.hw-charts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:4px}
.hw-chart-wrap{border:1px solid var(--line);border-radius:12px;padding:11px 11px 7px;transition:opacity .25s;min-width:0}
.hw-chart-wrap.dim{opacity:.35}
.hw-chart-top{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.hw-chart-branch{background:none;border:none;padding:0;color:var(--ink);font:700 12px 'Inter',sans-serif;display:inline-flex;align-items:center;gap:7px;cursor:pointer;flex:1;min-width:0}
.hw-chart-branch:hover{text-decoration:underline;text-underline-offset:3px}
.hw-cdot{width:8px;height:8px;border-radius:50%;background:var(--c);flex:none;box-shadow:0 0 8px -1px var(--c)}
.hw-chart-week{font:500 9.5px 'IBM Plex Mono',monospace;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hw-chart-body{position:relative;height:72px;border-bottom:1px solid var(--line)}
.hw-gridline{position:absolute;left:0;right:0;border-top:1px dashed var(--line);pointer-events:none}
.hw-g1{top:33%}.hw-g2{top:66%}
.hw-bars{position:absolute;inset:0;display:flex;align-items:flex-end;gap:6px;padding:0 2px}
.hw-bar{flex:1;position:relative;opacity:.5;border-radius:4px 4px 0 0;height:0;transition:height .8s cubic-bezier(.22,1,.36,1);min-width:0}
.hw-bar:hover{opacity:.8}
.hw-bar.today{opacity:1;box-shadow:0 0 14px -3px var(--c)}
.hw-bar.zero{background:var(--line)!important;opacity:1}
.hw-bar .v{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font:600 10px 'IBM Plex Mono',monospace;color:var(--ink);opacity:0;transition:opacity .15s;pointer-events:none}
.hw-bar:hover .v{opacity:1}
.hw-chart-x{display:flex;gap:6px;padding:4px 2px 0}
.hw-chart-x span{flex:1;text-align:center;font:500 8.5px 'IBM Plex Mono',monospace;color:var(--faint)}
.hw-chart-x span.today{color:var(--c);font-weight:600}
`;
const CSS3 = `
.hw-trend{border:1px solid var(--line);border-radius:12px;padding:11px 13px 8px;margin-bottom:12px}
.hw-trend-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px;flex-wrap:wrap}
.hw-trend-title{font-size:12.5px;font-weight:700}
.hw-trend-legend{margin-left:auto;display:flex;gap:12px;flex-wrap:wrap}
.hw-trend-legend span{display:inline-flex;align-items:center;gap:6px;font:500 9.5px 'IBM Plex Mono',monospace;color:var(--sub)}
.hw-trend-legend i{width:8px;height:8px;border-radius:50%}
.hw-filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center}
.hw-chip{font:600 10px 'IBM Plex Mono',monospace;letter-spacing:.04em;padding:5px 12px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--sub);transition:all .15s}
.hw-chip:hover{border-color:var(--ink);color:var(--ink)}
.hw-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}
.hw-chip .n{opacity:.55;margin-left:4px}
.hw-hint{margin-left:auto;font:500 10px 'IBM Plex Mono',monospace;color:var(--faint)}
.hw-list{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.hw-lhead{display:grid;grid-template-columns:minmax(0,1fr) 132px 74px 96px 18px;gap:12px;align-items:center;padding:9px 14px;background:var(--soft);border-bottom:1px solid var(--line);font:600 9px 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.hw-lhead span:last-child{width:18px}
.hw-l_scroll{max-height:320px;overflow:auto}
.hw-lrow{display:grid;grid-template-columns:minmax(0,1fr) 132px 74px 96px 18px;gap:12px;align-items:center;padding:11px 14px;border-bottom:1px solid var(--soft);cursor:pointer;transition:background .12s}
.hw-lrow:last-child{border-bottom:none}
.hw-lrow:hover{background:var(--blue-s)}
.hw-lwho{display:flex;align-items:center;gap:11px;min-width:0}
.hw-ava{width:36px;height:36px;border-radius:10px;color:#fff;font:700 13px 'Inter',sans-serif;display:grid;place-items:center;flex:none;box-shadow:0 2px 6px -2px rgba(17,24,39,.3)}
.hw-lmain{min-width:0}
.hw-lmain .nm{font-weight:700;font-size:13.5px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hw-lmain .sb{font:500 10px 'IBM Plex Mono',monospace;color:var(--sub);margin-top:2px}
.hw-adm{font:600 11px 'IBM Plex Mono',monospace;color:var(--ink);background:var(--soft);border:1px solid var(--line);border-radius:7px;padding:4px 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hw-ltime{font:600 11.5px 'IBM Plex Mono',monospace;color:var(--blue-d);white-space:nowrap}
.hw-badge{font:600 9.5px 'IBM Plex Mono',monospace;padding:3px 9px;border-radius:99px;flex:none;white-space:nowrap;justify-self:start}
.hw-badge i{width:5px;height:5px;border-radius:50%;background:currentColor;margin-right:6px}
.hw-b-care{background:var(--blue-s);color:var(--blue-d)}
.hw-b-pm{background:var(--amber-s);color:#B45309}
.hw-b-rel{background:var(--green-s);color:#15803D}
.hw-chev{color:#C3C9D4;flex:none}
@media(max-width:640px){.hw-lhead,.hw-lrow{grid-template-columns:minmax(0,1fr) 96px 18px}.hw-lhead .hw-h-adm,.hw-lhead .hw-h-time,.hw-lrow .hw-adm,.hw-lrow .hw-ltime{display:none}}
.hw-r-stats{display:flex;gap:22px;padding:0 2px 12px;flex-wrap:wrap}
.hw-rs .k{display:block;font:600 9px 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:2px}
.hw-rs .v{font-size:20px;font-weight:800;letter-spacing:-.02em}
.hw-item{position:relative;display:flex;gap:11px;align-items:center;padding:11px 2px;border-top:1px solid var(--line);cursor:pointer;transition:background .12s;border-radius:8px}
.hw-item:hover{background:var(--soft)}
.hw-item:first-child{border-top:none}
.hw-item .im{flex:1;min-width:0}
.hw-item .nm{font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hw-item .sb{font:500 10px 'IBM Plex Mono',monospace;color:var(--sub);margin-top:2px}
.hw-item .when{font:600 10px 'IBM Plex Mono',monospace;color:var(--blue-d);white-space:nowrap}
.hw-tag{font:600 9.5px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:99px;flex:none;white-space:nowrap}
.hw-text-scroll{overflow:auto;flex:1;min-height:0;display:flex;flex-direction:column}
.hw-empty{color:var(--faint);font-style:italic;font-size:12.5px;padding:12px 2px}
@media(max-width:560px){.hw-charts{grid-template-columns:1fr}}
`;
/* ── inline SVGs ── */
const Ic = ({ d, s = 15, sw = 2, className, children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d ? <path d={d} /> : null}
    {children}
  </svg>
);
const ICO = {
  care: { d: "M5.5 20v-7.5a6.5 6.5 0 0 1 13 0V20" },
  check: { d: "M9 12l2 2 4-5" },
  warn: { d: "M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
  clock: { d: "M12 22a10 10 0 1 0 0-20 10 10 0 1 0 0 20z" },
  calIco: { d: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  intake: { d: "M21 12h-2l-3-8H8l-3 8H3" },
  shield: { d: "M12 3l7 4v5c0 4.5-3 8.5-7 9-4-.5-7-4.5-7-9V7z" },
  doc: { d: "M8 7h8M8 11h8M8 15h5" },
  chev: { d: "M9 6l6 6-6 6" },
};
/* ── radial gauge for KPI tiles ── */
const Gauge = ({ pct, size = 50, track = "rgba(255,255,255,.28)", col = "#fff" }) => {
  const r = (size - 9) / 2, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <svg className="hw-gauge" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(p)} percent`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="4.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={`${(p / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .9s cubic-bezier(.22,1,.36,1)" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">{Math.round(p)}%</text>
    </svg>
  );
};

/* ── animated number (counts up when value changes) ── */
const useCountUp = (v) => {
  const [n, setN] = useState(v);
  useEffect(() => {
    const from = n, to = v, t0 = performance.now(), dur = 550;
    if (from === to) return undefined;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return n;
};

const smoothPath = (pts) => {
  if (pts.length < 2) return "M" + pts.map((p) => p.x + "," + p.y).join(" L");
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
};

/* ── main component (props contract unchanged) ── */
export default function DeceasedQuad({ events = {}, loading = false, dateKey = null, deceased = [], onPickDate, onSelect }) {
  const activeKey = dateKey || todayKeyVal();
  const pd = prettyDate(activeKey);
  const onPick = typeof onPickDate === "function" ? onPickDate : () => {};
  const onOpen = typeof onSelect === "function" ? onSelect : () => {};

  /* back to the normal All-Deceased list page (/tenant/:slug/deceased) */
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const dashSlug = urlSlug || localStorage.getItem("tenantSlug") || "";
  const backToAllDeceased = () => navigate(`/tenant/${dashSlug}/deceased`);

  /* ── Real postmortem REQUESTS (deceased-service tracker table) ──
     Same feed the deceased profile's Postmortem tab renders. The legacy
     embedded-field derivation below only ever matched rows carrying a
     `postmortem` object, so this panel showed nothing for real requests. */
  const [pmRequests, setPmRequests] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchPostmortemsFeed()
      .then((rows) => { if (alive) setPmRequests(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* feed optional — legacy derivation still applies */ });
    return () => { alive = false; };
  }, []);

  /* ── Real RELEASES (body-checkout body_releases feed) ──
     The authoritative list of handovers. Legacy derivation below only matches
     register rows flagged released (status / dispatch_date / release_date),
     but released bodies are stored in the body_releases table — so without
     this feed the Releases panel and the "Released today" KPI stayed empty. */
  const [releaseFeed, setReleaseFeed] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchReleasesFeed()
      .then((rows) => { if (alive) setReleaseFeed(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* feed optional — legacy derivation still applies */ });
    return () => { alive = false; };
  }, []);

  /* Org-wide deceased across ALL branches — powers the multi-branch trend.
     The `deceased` prop is branch-scoped; the trend needs every branch. */
  const [allBranchDeceased, setAllBranchDeceased] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchAllBranchDeceased()
      .then((rows) => { if (alive) setAllBranchDeceased(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* keep previous */ });
    return () => { alive = false; };
  }, []);

  /* register index for deceased_id → record joins (name / branch / ADM no) */
  const dIndex = useMemo(() => {
    const m = new Map();
    deceased.forEach((r) => {
      if (r?.deceased_id != null) m.set(String(r.deceased_id), r);
      if (r?.id != null) m.set(String(r.id), r);
      if (r?.admission_number) m.set(String(r.admission_number), r);
    });
    return m;
  }, [deceased]);

  /* tracked requests → rich rows: ref · requester · authority · reason · status.
     exam_status comes from the official postmortem table (joined by the API) —
     a request whose exam has been completed must show Completed, not Awaiting. */
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
      /* raw tracker payload — the side panel renders the full request
         (authority, reason, requester, dates) from this */
      pm_request: {
        id: q?.id,
        request_ref: q?.request_ref,
        reason: q?.reason,
        requesting_authority: q?.requesting_authority,
        requested_by: q?.requested_by,
        status: q?.status || "initiated",
        created_at: q?.created_at,
        sent_at: q?.sent_at,
        exam_status: q?.exam_status || null,
        exam_completed_at: q?.exam_completed_at || null,
      },
    };
  }), [pmRequests, dIndex]);

  const pmReqNums = useMemo(() => new Set(pmReqItems.map((p) => String(p.meta)).filter(Boolean)), [pmReqItems]);

  /* release feed → dashboard row shape (id `rel-<admission>` keeps the
     ModuleDashboard onSelect lookup working) + admission-number dedupe index */
  const relFeedItems = useMemo(() => releaseFeed.map((q) => {
    const adm = q?.admission_number || q?.admission_no || "";
    return {
      id: adm ? `rel-${adm}` : `rel-feed-${q?.release_id || q?.id}`,
      name: q?.name_of_deceased || q?.deceased_name || q?.full_name || q?.received_by || "Unknown",
      meta: adm,
      sub: q?.next_kin || q?.received_by || q?.mode_of_transport || "",
      tag: "Released",
      tagColor: "#10B981",
      when: q?.time_of_removal || "",
      branch: branchOf(q),
      _key: keyOf(q?.date_of_removal || q?.release_date || q?.created_at),
      ...(q || {}),
    };
  }), [releaseFeed]);
  const relFeedNums = useMemo(() => new Set(relFeedItems.map((r) => String(r.meta)).filter(Boolean)), [relFeedItems]);

  /* The `deceased` prop is already branch-scoped by ModuleDashboard's branch
     filter; keep the release feed in the same scope so a single-branch view
     doesn't show other branches' handovers. */
  const scopeBranch = useMemo(() => {
    const set = [...new Set(deceased.map((r) => branchOf(r)))].filter(Boolean);
    return set.length === 1 ? set[0] : "";
  }, [deceased]);
  const relFeedScoped = useMemo(
    () => (scopeBranch ? relFeedItems.filter((r) => branchOf(r) === scopeBranch) : relFeedItems),
    [relFeedItems, scopeBranch]
  );

  /* latest admission (most recent by date + time) */
  const latestIntake = useMemo(() => {
    const cands = deceased.filter((r) => admKeyOf(r));
    if (!cands.length) return null;
    return cands.slice().sort((a, b) => `${admKeyOf(b)} ${timeOf(b)}`.localeCompare(`${admKeyOf(a)} ${timeOf(a)}`))[0];
  }, [deceased]);
  const latestItem = latestIntake ? { ...latestIntake, id: `in-${latestIntake?.admission_number ?? latestIntake?.id ?? 0}` } : null;
  const latestWhen = latestIntake
    ? (admKeyOf(latestIntake) === todayKeyVal()
        ? (timeOf(latestIntake) || "today")
        : `${prettyDate(admKeyOf(latestIntake)).short}${timeOf(latestIntake) ? ` · ${timeOf(latestIntake)}` : ""}`)
    : "";

  /* items for the selected day */
  const items = useMemo(() => {
    const intakes = deceased.filter((r) => admKeyOf(r) === activeKey).map((r, i) => ({
      id: `in-${r?.admission_number ?? r?.id ?? i}`, name: r?.full_name || "Unknown",
      meta: r?.admission_number || "", sub: branchOf(r), tag: String(r?.status || r?.admission_status || "Admitted"), branch: branchOf(r),
    }));
    const releases = [
      /* real handovers from the body-checkout feed first (authoritative) */
      ...relFeedScoped.filter((r) => r._key === activeKey).map(({ _key, ...rest }) => rest),
      /* legacy derived rows (only where no feed row covers them) */
      ...deceased
        .filter((r) => isReleased(r) && relKeyOf(r) === activeKey && !relFeedNums.has(String(r?.admission_number || "")))
        .map((r, i) => ({
          id: `rel-${r?.admission_number ?? r?.id ?? i}`, name: r?.full_name || "Unknown",
          meta: r?.admission_number || "", sub: r?.destination || r?.release_to || r?.next_kin || "",
          tag: String(r?.status || r?.admission_status || "Released"), when: esc(r?.release_date || r?.dispatch_date || ""),
        })),
    ];
    const postmortems = [
      /* real tracked requests first — the authoritative feed */
      ...pmReqItems.filter((p) => p._key === activeKey).map(({ _key, ...rest }) => rest),
      /* legacy derived rows (only where no tracked request covers them) */
      ...deceased
        .map((r, i) => ({ r, i, pm: pmMetaOf(r) }))
        .filter(({ r, pm }) => pm && pm.key === activeKey && !pmReqNums.has(String(r?.admission_number || "")))
        .map(({ r, i, pm }) => ({
          id: `pm-${r?.admission_number ?? r?.id ?? i}`, name: r?.full_name || "Unknown",
          meta: r?.admission_number || "", sub: r?.cause_of_death || r?.body_status || "",
          tag: pm.completed ? "Completed" : "Pending", tagColor: pm.completed ? "#16A34A" : "#D97706", when: pm.completed ? "Completed" : "Requested",
        })),
    ];
    return { intakes, releases, postmortems };
  }, [deceased, activeKey, pmReqItems, pmReqNums, relFeedScoped, relFeedNums]);

  const inCare = deceased.filter((r) => !isReleased(r)).length;
  const relToday =
    relFeedScoped.filter((r) => r._key === todayKeyVal()).length +
    deceased.filter((r) => isReleased(r) && relKeyOf(r) === todayKeyVal()).length;
  const pmPendingCount =
    pmReqItems.filter((p) => p.tag !== "Cancelled").length +
    deceased.filter((r) => { const pm = pmMetaOf(r); return pm && !pm.completed && !pmReqNums.has(String(r?.admission_number || "")); }).length;

  /* last 7 days */
  const last7 = useMemo(() => {
    const a = []; const t = new Date(); t.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) { const d = new Date(t); d.setDate(t.getDate() - i); a.push(d); }
    return a;
  }, []);

  /* ── gauge metrics for the top cards ── */
  const total = deceased.length;
  const inCarePct = total ? (inCare / total) * 100 : 0;
  const relWeek =
    relFeedScoped.filter((r) => { const k = r?._key; return k && last7.some((d) => dk(d) === k); }).length +
    deceased.filter((r) => {
      if (!isReleased(r)) return false;
      const k = relKeyOf(r);
      return k && last7.some((d) => dk(d) === k);
    }).length;
  const relPct = relWeek ? (relToday / relWeek) * 100 : relToday > 0 ? 100 : 0;
  const pmTotal = pmReqItems.length + deceased.filter((r) => pmMetaOf(r) && !pmReqNums.has(String(r?.admission_number || ""))).length;
  const pmPct = pmTotal ? (pmPendingCount / pmTotal) * 100 : 0;
  const tToday = deceased.filter((r) => admKeyOf(r) === todayKeyVal()).length;
  const tWeek = last7.reduce((acc, d) => acc + deceased.filter((r) => admKeyOf(r) === dk(d)).length, 0);
  const tPct = tWeek ? (tToday / tWeek) * 100 : tToday > 0 ? 100 : 0;
  const nInCare = useCountUp(inCare);
  const nRelToday = useCountUp(relToday);
  const nPM = useCountUp(pmPendingCount);

  /* distinct branches present in admissions (cap at 3) — from org-wide data */
  const branches = useMemo(() => {
    const set = [];
    allBranchDeceased.forEach((r) => { const b = branchOf(r); if (!set.includes(b)) set.push(b); });
    if (set.length === 0) set.push("Main");
    return set.slice(0, 3);
  }, [allBranchDeceased]);
  const series = useMemo(() => branches.map((b) => last7.map((d) => allBranchDeceased.filter((r) => branchOf(r) === b && admKeyOf(r) === dk(d)).length)), [allBranchDeceased, last7, branches]);
  const seriesAll = useMemo(() => last7.map((d) => allBranchDeceased.filter((r) => admKeyOf(r) === dk(d)).length), [allBranchDeceased, last7]);
  const trendMax = Math.max(1, ...seriesAll, ...series.flat());
  const [fbranch, setFbranch] = useState("ALL");
  const branchColor = (b, i) => PALETTE[(i === undefined ? branches.indexOf(b) : i) % PALETTE.length];

  const click = (e, item) => { e.stopPropagation(); onOpen(item); };

  /* SVG trend builder — same geometry as the reference HTML */
  const buildTrend = () => {
    const W = 320, H = 112, L = 30, R = 8, T = 12, B = 8;
    const niceMax = trendMax <= 4 ? 4 : trendMax <= 6 ? 6 : trendMax <= 8 ? 8 : Math.ceil(trendMax / 2) * 2;
    const x = (i) => L + (i * (W - L - R)) / 6;
    const y = (v) => T + (1 - v / niceMax) * (H - T - B);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">`;
    [niceMax, niceMax / 2, 0].forEach((gv) => {
      const solid = gv === 0;
      s += `<line x1="${L}" y1="${y(gv)}" x2="${W - R}" y2="${y(gv)}" stroke="${solid ? "#E5E8EF" : "#EEF1F6"}" ${solid ? "" : 'stroke-dasharray="4 4"'} vector-effect="non-scaling-stroke"/>`;
      s += `<text x="${L - 7}" y="${y(gv) + 3}" text-anchor="end" font-size="9" fill="#9CA3AF" font-family="IBM Plex Mono">${gv}</text>`;
    });
    branches.forEach((b, bi) => {
      const col = branchColor(b, bi);
      const pts = series[bi].map((v, i) => ({ x: x(i), y: y(v) }));
      s += `<path d="${smoothPath(pts)}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" style="filter:drop-shadow(0 2px 4px rgba(17,24,39,.15))" vector-effect="non-scaling-stroke"/>`;
      pts.forEach((p, i) => { s += `<circle cx="${p.x}" cy="${p.y}" r="3.4" fill="${col}" stroke="#fff" stroke-width="1.6" vector-effect="non-scaling-stroke"><title>${b} · ${WD[last7[i].getDay()]} ${last7[i].getDate()} — ${series[bi][i]}</title></circle>`; });
    });
    s += "</svg>";
    return s;
  };

  /* ── horizontal calendar ─────────────────────────────────────────────
     DeceasedQuad receives `events` as a { 'YYYY-MM-DD': [{n,t,c}] } map
     (Mini-calendar shape). The HorizontalCalendar widget wants an array of
     { id, date (Date), title, color }. We convert here so the existing
     ModuleDashboard wiring (miniEvents → events) keeps working unchanged. */
  const CAL_FILLS = { red: "#7d3b3b", blue: "#a9762d", green: "#4f6b52", orange: "#a9762d", purple: "#7d3b3b" };
  const hCalEvents = useMemo(() => {
    const arr = [];
    Object.entries(events || {}).forEach(([k, list]) => {
      if (!Array.isArray(list)) return;
      const [y, m, d] = String(k).split("-").map(Number);
      if (!y || !m || !d) return;
      list.forEach((ev, i) => arr.push({
        id: `${k}-${i}`,
        date: new Date(y, m - 1, d),
        title: ev?.n || "Event",
        color: CAL_FILLS[ev?.c] || "#2563EB",
      }));
    });
    return arr;
  }, [events]);

  /* selected day as a Date (the HorizontalCalendar highlights it) */
  const selDate = useMemo(() => {
    const [y, m, d] = String(activeKey).split("-").map(Number);
    return y && m && d ? new Date(y, m - 1, d) : new Date();
  }, [activeKey]);

  const onHorizPick = (date) => {
    if (!date || typeof onPick !== "function") return;
    onPick(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  };

  /* ── compact analytics block (fills the space under the horizontal strip) ── */
  const admSeries7 = useMemo(
    () => last7.map((d) => deceased.filter((r) => admKeyOf(r) === dk(d)).length),
    [deceased, last7]
  );
  const relSeries7 = useMemo(() => last7.map((d) => {
    const k = dk(d);
    return relFeedScoped.filter((r) => r._key === k).length
      + deceased.filter((r) => isReleased(r) && relKeyOf(r) === k && !relFeedNums.has(String(r?.admission_number || ""))).length;
  }), [deceased, last7, relFeedScoped, relFeedNums]);
  const anaMax = Math.max(1, ...admSeries7, ...relSeries7);

  const bodySeg = useMemo(() => {
    let care = 0, pmHold = 0, rel = 0;
    deceased.forEach((r) => {
      if (isReleased(r)) { rel++; return; }
      const pm = pmMetaOf(r);
      if (pm && !pm.completed && !pmReqNums.has(String(r?.admission_number || ""))) pmHold++;
      else care++;
    });
    return { care, pmHold, rel };
  }, [deceased, pmReqNums]);
  const bodyTotal = Math.max(1, bodySeg.care + bodySeg.pmHold + bodySeg.rel);

  const pmDone = Math.max(0, pmTotal - pmPendingCount);
  const pmTotalSafe = Math.max(1, pmTotal);
  const pmDonePct = (pmDone / pmTotalSafe) * 100;
  const pmPendPct = (pmPendingCount / pmTotalSafe) * 100;

  const genderStats = useMemo(() => {
    let m = 0, f = 0, o = 0;
    deceased.forEach((r) => {
      const g = String(r?.sex || r?.gender || "").toLowerCase();
      if (g.indexOf("m") === 0) m++;
      else if (g.indexOf("f") === 0) f++;
      else o++;
    });
    return { m, f, o };
  }, [deceased]);

  /* 7-day grouped bars (Admissions blue · Releases green) */
  const buildAnaBars = () => {
    const W = 250, H = 62, n = Math.min(7, admSeries7.length);
    const slot = (W - 8) / n, bw = Math.min(6, Math.max(3, slot / 2 - 2));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">`;
    for (let i = 0; i < n; i++) {
      const cx = 4 + i * slot + slot / 2;
      const a = admSeries7[i], r = relSeries7[i];
      const ah = Math.max(2, (a / anaMax) * (H - 8));
      const rh = Math.max(2, (r / anaMax) * (H - 8));
      s += `<rect x="${cx - bw - 1}" y="${H - 4 - ah}" width="${bw}" height="${ah}" rx="1.5" fill="#2563EB" opacity=".85"><title>Admissions ${a}</title></rect>`;
      s += `<rect x="${cx + 1}" y="${H - 4 - rh}" width="${bw}" height="${rh}" rx="1.5" fill="#10B981" opacity=".85"><title>Releases ${r}</title></rect>`;
    }
    s += "</svg>";
    return s;
  };

  /* Gender donut SVG */
  const buildGenderDonut = () => {
    const R = 20, C = 2 * Math.PI * R;
    const gt = Math.max(1, genderStats.m + genderStats.f + genderStats.o);
    const md = (genderStats.m / gt) * C, fd = (genderStats.f / gt) * C;
    const od = Math.max(0, C - md - fd);
    let off = 0;
    const parts = [];
    [[genderStats.m, "#2563EB", md], [genderStats.f, "#EC4899", fd], [genderStats.o, "#94A3B8", od]].forEach(([v, col, len]) => {
      if (len <= 0) return;
      parts.push(`<circle cx="22" cy="22" r="${R}" fill="none" stroke="${col}" stroke-width="7" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" stroke-linecap="round"><title>${v}</title></circle>`);
      off += len;
    });
    return `<svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label="Gender breakdown">${parts.join("")}</svg>`;
  };

  return (
    <div className="hw" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{CSS + CSS2 + CSS3 + CSS4}</style>

      <button className="hw-back" type="button" onClick={backToAllDeceased} title="Go to All Deceased">
        <span className="hw-arr" aria-hidden="true">‹</span>
        <span>All Deceased</span>
      </button>

      <div className="hw-panel" style={{ overflow: "hidden" }}>
        <div className="hw-p-head" style={{ borderBottom: "1px solid var(--line)" }}>
          <span className="hw-p-ic hw-i-blue"><Ic d={ICO.calIco.d} s={15} /></span>
          <div className="hw-p-title">Deceased Calendar<small>click a date to view its events</small></div>
          <span className="hw-p-meta">{pd.day} <b>{pd.short}</b></span>
        </div>
        <div className="hw-p-body" style={{ paddingTop: 14, paddingBottom: 16 }}>
          <HorizontalCalendar
            eventsData={hCalEvents}
            selectedDate={selDate}
            onDateSelect={onHorizPick}
          />
        </div>
      </div>

      <div style={{ minHeight: 320 }}>
        <DayBreakdownPanel
          dateKey={activeKey}
          sources={{ deceased, coffins: [] }}
          loading={loading}
          onSelect={onOpen}
        />
      </div>
    </div>
  );
}