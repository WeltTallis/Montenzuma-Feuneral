// WorkshopAnalytics.jsx
// Production analytics for the dashboard's Workshop module — clean white layout,
// minimal on-screen wording (explanations live in hover tooltips).
// Self-contained: takes `orders` + `workers` + `production` + `targets` as props.

import { useMemo, useState } from "react";
import styled from "styled-components";

/* status palette — remapped to the CRM (insurance) monochrome design tokens:
   black/gray chrome, Source Sans body, Merriweather values, 4px corners.
   The original keys are kept so every reference in the file still resolves. */
const C = {
  navy: "#0a0a0a", navyBg: "#f1f5f9",
  orange: "#d97706", orangeBg: "#fffbeb",
  plum: "#1a1a1a", plumBg: "#f9fafb",
  green: "#16a34a",
  amber: "#d97706", amberBg: "#fffbeb",
  teal: "#0284c7", tealBg: "#eff6ff",
  ok: "#16a34a", okBg: "#f0fdf4",
  red: "#dc2626",
  ink: "#1a1a1a", muted: "#777777", faint: "#777777",
  line: "#e0e0e0", bg: "#f7f7f5", card: "#ffffff",
  section: "#f9fafb", field: "#f7f7f5",
};

/* One colour per worker, cycled in a fixed order so a worker's line keeps the
   same colour across every chart and chip. Muted categorical set that sits
   cleanly on white (matches the CRM doughnut/bar palette). */
const PALETTE = ["#0a0a0a", "#0284c7", "#d97706", "#7c3aed", "#16a34a", "#0f766e", "#b45309", "#be185d"];

const STAGES = [
  { name: "Building", color: "#0a0a0a" },
  { name: "Waiting Bay", color: "#0284c7" },
  { name: "Painting", color: "#d97706" },
  { name: "Interior", color: "#7c3aed" },
  { name: "Store", color: "#16a34a" },
];

const STATUS_TO_STAGE = {
  pending: 0, building: 0, design: 0,
  waiting_bay: 1, waiting: 1, inspection: 1,
  painting: 2,
  interior: 3, upholstery: 3,
  completed: 4, delivered: 4, store: 4,
};

// A coffin counts as PRODUCED once it reaches the Store stage. `cancelled` is
// finished but is NOT output, so it is excluded from per-worker totals.
const FINISHED = ["completed", "delivered", "store", "dispatched", "collected"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const stageIndexOf = (status) => {
  const v = STATUS_TO_STAGE[String(status || "pending").toLowerCase()];
  return v === undefined ? 0 : v;
};

const isFinished = (status) => FINISHED.includes(String(status || "").toLowerCase());

const initials = (name) =>
  String(name || "W").split(/\s+/).filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const monthKeyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/* "2025-10" -> "Oct" — month names instead of raw numbers in labels */
const monthShort = (key) => {
  const m = Number(String(key).split("-")[1]);
  return MONTHS[m - 1] || String(key);
};

/** Which orders belong to a worker — matches on the raw assignment rows, the
    order's own assigned_to, and (as a fallback) the name, because older rows
    were written before assignments were recorded. */
function ownsOrder(w, o) {
  const id = String(w.user_id || w.id);
  if (Array.isArray(o.assignments) && o.assignments.some((a) => String(a.user_id) === id)) return true;
  if (o.assigned_to != null && String(o.assigned_to) === id) return true;
  const name = String(w.full_name || `${w.first_name || ""} ${w.last_name || ""}`.trim()).trim().toLowerCase();
  return !!name && String(o.assigned_to_name || "").trim().toLowerCase() === name;
}

/* "YYYY-MM" -> the workshop's shared monthly target (one number for everyone). */
function monthTargetMap(targets) {
  const byMonth = new Map();
  (Array.isArray(targets?.months) ? targets.months : []).forEach((t) => {
    if (!t || !t.month) return;
    const qty = Number(t.target) || 0;
    if (qty > 0) byMonth.set(String(t.month), qty);
  });
  return byMonth;
}

/** Build every derived number the view needs, once.
 *  `production` (GET /workshop/reports/worker-production) is the source of truth
 *  for FINISHED work; `orders` (live board, excludes finished) is the source for
 *  IN-PROGRESS work. */
function useWorkerStats(orders, workers, production) {
  return useMemo(() => {
    const now = new Date();
    const monthKey = monthKeyOf(now);
    const weekAgo = now.getTime() - 7 * 86400000;
    const lastMonthKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const prodById = new Map();
    (Array.isArray(production?.workers) ? production.workers : []).forEach((p) => {
      prodById.set(String(p.worker_id), p);
    });

    const rows = (Array.isArray(workers) ? workers : []).map((w, i) => {
      const mine = (Array.isArray(orders) ? orders : []).filter((o) => ownsOrder(w, o));
      const perMonth = {};
      let completed = 0, active = 0, hours = 0, month = 0, week = 0, lastMonth = 0;
      const inProgress = [];

      const prod = prodById.get(String(w.user_id ?? w.id));
      if (prod) {
        completed = Number(prod.total) || 0;
        Object.entries(prod.monthly || {}).forEach(([k, v]) => { perMonth[k] = Number(v) || 0; });
        month = Number((prod.monthly || {})[monthKey]) || 0;
        lastMonth = Number((prod.monthly || {})[lastMonthKey]) || 0;
      }

      mine.forEach((o) => {
        const created = o.order_date || o.created_at || o.createdAt || null;
        const createdMs = created ? new Date(created).getTime() : null;
        const done = isFinished(o.status);

        if (done) {
          // Only count locally when the SQL aggregate is unavailable, otherwise
          // the same coffin would be counted twice.
          if (!prod) {
            const isReal = String(o.status || "").toLowerCase() !== "cancelled";
            if (isReal) completed += 1;
            if (createdMs) {
              const k = monthKeyOf(new Date(createdMs));
              if (isReal) {
                perMonth[k] = (perMonth[k] || 0) + 1;
                if (k === monthKey) month += 1;
                if (k === lastMonthKey) lastMonth += 1;
              }
              if (createdMs >= weekAgo) week += 1;
            }
          } else if (createdMs && createdMs >= weekAgo) {
            week += 1;
          }
        } else {
          active += 1;
          inProgress.push({
            name: o.coffin_name || o.name || "Coffin",
            stage: STAGES[stageIndexOf(o.status)].name,
            color: STAGES[stageIndexOf(o.status)].color,
            days: createdMs ? Math.max(0, Math.floor((now.getTime() - createdMs) / 86400000)) : 0,
          });
        }
        (Array.isArray(o.assignments) ? o.assignments : []).forEach((a) => {
          if (String(a.user_id) === String(w.user_id || w.id)) hours += Number(a.hours_worked) || 0;
        });
      });

      inProgress.sort((a, b) => b.days - a.days);

      return {
        id: w.user_id || w.id,
        name: String(w.full_name || `${w.first_name || ""} ${w.last_name || ""}`.trim() || "Unknown"),
        role: w.role || "Worker",
        color: PALETTE[i % PALETTE.length],
        completed, active, hours, month, week, lastMonth, perMonth, inProgress,
      };
    });

    rows.sort((a, b) => b.completed - a.completed || b.active - a.active);

    const totals = {
      workers: rows.length,
      made: rows.reduce((s, r) => s + r.completed, 0),
      inProgress: rows.reduce((s, r) => s + r.active, 0),
      hours: rows.reduce((s, r) => s + r.hours, 0),
      month: rows.reduce((s, r) => s + r.month, 0),
      lastMonth: rows.reduce((s, r) => s + r.lastMonth, 0),
      week: rows.reduce((s, r) => s + r.week, 0),
    };

    return { rows, totals, monthKey };
  }, [orders, workers, production]);
}

/* ── Catmull-Rom → cubic Bézier. Interpolating: the curve passes exactly
   through every real data point, so no month is visually distorted. ── */
function smoothPath(pts, tension = 0.5) {
  if (!pts.length) return "";
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ── inline icons (no Font Awesome dependency) ── */
const Svg = ({ children, size = 15, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IBox = () => <Svg><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></Svg>;
const IUsers = () => <Svg><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c.7-3 3.2-4.6 6.2-4.6s5.5 1.6 6.2 4.6" /><circle cx="17.5" cy="9" r="2.4" /><path d="M16.5 14.6c2.4.2 4.2 1.6 4.7 4.1" /></Svg>;
const IPulse = () => <Svg><path d="M3 12h4l2.5-7 4 14L16 12h5" /></Svg>;
const IClock = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Svg>;
const ICheck = ({ size = 10 }) => <Svg size={size} sw={3}><path d="M20 6L9 17l-5-5" /></Svg>;
const IX = ({ size = 11 }) => <Svg size={size} sw={2.4}><path d="M18 6L6 18M6 6l12 12" /></Svg>;

/* ══════════════════════════ STYLES ══════════════════════════ */
const Root = styled.div`
  display:flex;flex-direction:column;gap:24px;color:${C.ink};
  font-family:'Source Sans 3',sans-serif;
  font-variant-numeric:tabular-nums;min-width:0;
`;
const Card = styled.div`
  background:${C.card};border:1px solid ${C.line};border-radius:4px;
  min-width:0;overflow:hidden;
`;
const CardHead = styled.div`
  padding:16px 24px;border-bottom:1px solid ${C.line};background:${C.section};
  display:flex;justify-content:space-between;align-items:center;
  h2{font-family:'Merriweather',serif;font-size:16px;font-weight:700;color:#0a0a0a;
     letter-spacing:0;margin:0;cursor:default;}
`;
const CardBody = styled.div`padding:24px;min-width:0;`;

const Kpis = styled.div`
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;
  @media(max-width:980px){grid-template-columns:repeat(2,minmax(0,1fr));}
  @media(max-width:520px){grid-template-columns:1fr;}
`;
const Kpi = styled(Card)`padding:20px;`;
const KpiTop = styled.div`display:flex;align-items:center;gap:.6rem;margin-bottom:14px;`;
const KpiIc = styled.span`
  width:32px;height:32px;border-radius:4px;display:grid;place-items:center;flex-shrink:0;
  background:${C.field};color:${C.ink};
`;
const KpiLabel = styled.span`
  font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};
`;
const KpiNum = styled.div`
  font-family:'Merriweather',serif;font-size:32px;font-weight:700;color:#0a0a0a;
  letter-spacing:-.02em;line-height:1;
`;
const KpiFoot = styled.div`margin-top:12px;font-size:12px;font-weight:500;color:${C.muted};`;
const Delta = styled.span`
  display:inline-flex;align-items:center;gap:.25rem;font-weight:600;
  color:${p => (p.$up ? C.ok : C.muted)};
`;

const Main = styled.div`
  display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;
  @media(max-width:980px){grid-template-columns:1fr;}
`;

/* trend chips — quiet text buttons */
const ChipRow = styled.div`display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;`;
const ChipLbl = styled.span`
  font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  color:${C.muted};margin-right:.2rem;
`;
const Chip = styled.button`
  display:inline-flex;align-items:center;gap:8px;padding:6px 14px;
  border:1px solid ${p => (p.$on ? C.ink : C.line)};border-radius:4px;
  background:${p => (p.$on ? C.ink : "#fff")};color:${p => (p.$on ? "#fff" : C.muted)};
  font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:'Source Sans 3',sans-serif;
  &:hover{border-color:${C.ink};color:${p => (p.$on ? "#fff" : C.ink)};}
`;
const Cdot = styled.span`width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${p => p.$c};`;

const ChartBox = styled.div`svg{width:100%;height:auto;display:block;}`;

/* target ring */
const RingRow = styled.div`display:flex;align-items:center;gap:18px;min-width:0;`;
const Ring = styled.div`
  position:relative;width:100px;height:100px;flex-shrink:0;cursor:default;
  svg{transform:rotate(-90deg);display:block;}
`;
const RingVal = styled.div`
  position:absolute;inset:0;display:grid;place-items:center;text-align:center;
  b{font-family:'Merriweather',serif;font-size:22px;font-weight:700;color:#0a0a0a;
     letter-spacing:-.02em;line-height:1;display:block;}
  small{font-size:10px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:.1em;}
`;
const RingInfo = styled.div`
  min-width:0;
  .big{font-family:'Merriweather',serif;font-size:16px;font-weight:700;color:#0a0a0a;}
  .ratio{font-size:12px;font-weight:500;color:${C.muted};margin-top:2px;}
`;
const Strip = styled.div`
  display:flex;gap:6px;margin-top:16px;padding-top:16px;border-top:1px solid ${C.line};
`;
const TCol = styled.div`
  flex:1;min-width:0;cursor:default;border-radius:2px;
  ${p => (p.$now ? `outline:2px solid ${C.ink};outline-offset:2px;` : "")}
`;
const TBar = styled.div`
  height:42px;display:flex;align-items:flex-end;justify-content:center;
  span{display:block;width:100%;max-width:15px;border-radius:2px 2px 0 0;
    background:${p => (p.$hit ? C.ok : C.line)};}
`;
const TM = styled.div`
  margin-top:6px;font-size:11px;font-weight:600;color:${p => (p.$hit ? C.ok : C.muted)};
  display:flex;align-items:center;justify-content:center;gap:3px;
`;
const TStats = styled.div`
  display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;padding-top:16px;
  border-top:1px solid ${C.line};
`;
const TStat = styled.div`
  background:${C.field};border:1px solid ${C.line};border-radius:4px;padding:12px;
  .k{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};}
  .v{font-family:'Merriweather',serif;font-size:15px;font-weight:700;color:#0a0a0a;margin-top:4px;}
`;

/* worker table */
const TableWrap = styled.div`
  padding:0 6px 6px;overflow-x:auto;
`;
const WTable = styled.table`
  width:100%;border-collapse:collapse;min-width:640px;
  th{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};
     text-align:left;padding:12px 16px;border-bottom:1px solid ${C.line};}
  th.num,td.num{text-align:right;}
  td{padding:13px 16px;border-bottom:1px solid ${C.line};font-size:14px;vertical-align:middle;color:${C.ink};}
  tbody tr:last-child td{border-bottom:none;}
`;
const WRow = styled.tr`
  transition:background .12s;
  &:hover{background:${C.field};}
  /* remove button is revealed on row hover — plain selector, no interpolation */
  &:hover .rm-btn{opacity:1;pointer-events:auto;}
`;
const Who = styled.div`display:flex;align-items:center;gap:.6rem;min-width:0;`;
const Ava = styled.span`
  width:32px;height:32px;border-radius:4px;color:#fff;font-weight:700;font-size:12px;
  font-family:'Source Sans 3',sans-serif;
  display:grid;place-items:center;flex-shrink:0;background:${p => p.$c};
`;
const WhoTxt = styled.span`min-width:0;
  b{display:block;font-size:14px;font-weight:600;line-height:1.2;color:${C.ink};
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  small{font-size:12px;color:${C.muted};}
`;
const Rm = styled.button`
  opacity:0;pointer-events:none;transition:.15s;margin-left:.4rem;flex-shrink:0;
  width:20px;height:20px;border:none;border-radius:4px;background:transparent;color:${C.muted};
  display:inline-grid;place-items:center;cursor:pointer;
  &:hover{background:${C.field};color:${C.red};}
`;
const MiniTrack = styled.span`
  width:78px;height:6px;border-radius:3px;background:${C.line};overflow:hidden;
  display:inline-block;vertical-align:middle;flex-shrink:0;
  span{display:block;height:100%;border-radius:3px;background:${p => (p.$met ? C.ok : C.ink)};}
`;
const TgtCell = styled.div`
  display:flex;align-items:center;gap:.5rem;justify-content:flex-end;cursor:default;min-width:0;
  em{font-style:normal;font-size:13px;font-weight:600;color:${C.muted};min-width:46px;text-align:right;}
  em.met{color:${C.ok};}
`;
const Spark = styled.div`
  display:flex;align-items:flex-end;gap:2px;height:24px;cursor:default;
  i{width:5px;border-radius:1px;background:${C.line};}
  i:last-child{background:${C.ink};}
`;
const Share = styled.span`
  display:inline-flex;align-items:center;gap:.4rem;font-size:13px;font-weight:600;color:${C.muted};cursor:default;
  .bar{width:46px;height:5px;border-radius:3px;background:${C.line};overflow:hidden;flex-shrink:0;}
  .bar span{display:block;height:100%;border-radius:3px;background:${C.ink};}
`;

/* floor pipeline */
const Floor = styled.div`
  display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;
  @media(max-width:980px){grid-template-columns:repeat(2,minmax(0,1fr));}
  @media(max-width:520px){grid-template-columns:1fr;}
`;
const Stage = styled.div`
  border:1px solid ${C.line};border-top:3px solid ${p => p.$c};border-radius:4px;
  padding:16px 14px;background:${C.section};min-width:0;
`;
const StageTop = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:.4rem;
  b{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .n{min-width:20px;height:20px;padding:0 6px;border-radius:3px;background:${p => p.$c};color:#fff;
     font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
`;
const StageItem = styled.div`
  display:flex;justify-content:space-between;gap:.5rem;font-size:13px;padding:6px 0;cursor:default;color:${C.ink};
  span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  em{font-style:normal;color:${C.muted};font-weight:500;flex-shrink:0;}
  em.late{color:${C.red};}
`;
const StageEmpty = styled.div`font-size:12px;color:${C.muted};font-style:italic;padding:4px 0 2px;`;

const Empty = styled(Card)`padding:40px;text-align:center;font-size:14px;color:${C.muted};`;

/* ══════════════════════════ COMPONENT ══════════════════════════ */
export default function WorkshopAnalytics({ orders = [], workers = [], production = null, targets = null, onRemoveWorker }) {
  const { rows, totals, monthKey } = useWorkerStats(orders, workers, production);

  const tMap = useMemo(() => monthTargetMap(targets), [targets]);
  const currentMonthKey = monthKeyOf(new Date());

  /* headline figures — SQL aggregation first, local derivation as fallback */
  const made = production?.totals?.produced ?? totals.made;
  const madeThisMonth = production?.totals?.thisMonth ?? totals.month;
  const workerCount = production?.totals?.workers ?? totals.workers;

  /* previous month short name for the KPI delta ("vs Sep") */
  const prevMonthLabel = monthShort(monthKeyOf(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));

  /* shared-target months for the strip + ring (months with no target are never
     shown as a miss — they are simply unmarked) */
  const scoredMonths = useMemo(
    () => (Array.isArray(targets?.months) ? targets.months : []).filter((m) => Number(m.target) > 0),
    [targets]
  );
  const thisMonthRow = scoredMonths.find((m) => m.month === currentMonthKey);
  const ringProd = thisMonthRow ? Number(thisMonthRow.produced) || 0 : madeThisMonth;
  const ringTarget = thisMonthRow ? Number(thisMonthRow.target) || 0 : (tMap.get(currentMonthKey) || 0);
  const hasTarget = ringTarget > 0;
  const ringMet = hasTarget && ringProd >= ringTarget;
  const pctRaw = hasTarget ? Math.round((ringProd / ringTarget) * 100) : 0;
  const pctArc = Math.min(100, pctRaw);
  const monthsHit = scoredMonths.filter((m) => (Number(m.produced) || 0) >= Number(m.target)).length;

  /* strip stats */
  const stripVals = scoredMonths.map((m) => Number(m.produced) || 0);
  const stripGrand = stripVals.reduce((a, b) => a + b, 0);
  const bestI = stripVals.length ? stripVals.indexOf(Math.max(...stripVals)) : -1;
  const activeMonths = stripVals.filter((v) => v > 0).length;
  const stripAvg = activeMonths ? (stripGrand / activeMonths).toFixed(1) : "0";

  /* live floor pipeline — group in-progress orders by stage */
  const floor = useMemo(() => {
    const cols = STAGES.map((s) => ({ ...s, items: [] }));
    (Array.isArray(orders) ? orders : []).forEach((o) => {
      if (isFinished(o.status)) return;
      const created = o.order_date || o.created_at || o.createdAt || null;
      const ms = created ? new Date(created).getTime() : null;
      const days = ms ? Math.max(0, Math.floor((Date.now() - ms) / 86400000)) : 0;
      cols[stageIndexOf(o.status)].items.push({ name: o.coffin_name || o.name || "Coffin", days });
    });
    cols.forEach((c) => c.items.sort((a, b) => b.days - a.days));
    return cols;
  }, [orders]);

  /* table helpers */
  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.month - a.month || b.completed - a.completed),
    [rows]
  );
  const shareDenom = made || 1;
  const last6Keys = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) =>
      monthKeyOf(new Date(now.getFullYear(), now.getMonth() - (5 - i), 1))
    );
  }, []);
  const thisMonthTarget = tMap.get(monthKey) || 0;

  if (rows.length === 0 && !production) {
    return <Empty>No workers registered yet.</Empty>;
  }

  return (
    <Root>
      {/* ── KPIs ── */}
      <Kpis>
        <Kpi>
          <KpiTop><KpiIc $bg={C.plumBg} $fg={C.plum}><IBox /></KpiIc><KpiLabel>Coffins Made</KpiLabel></KpiTop>
          <KpiNum>{made}</KpiNum>
          <KpiFoot>
            <Delta $up={madeThisMonth - totals.lastMonth > 0}>
              {madeThisMonth - totals.lastMonth > 0
                ? `▲ +${madeThisMonth - totals.lastMonth}`
                : "— flat"}
            </Delta>{" "}vs {prevMonthLabel}
          </KpiFoot>
        </Kpi>
        <Kpi>
          <KpiTop><KpiIc $bg={C.navyBg} $fg={C.navy}><IUsers /></KpiIc><KpiLabel>Workers</KpiLabel></KpiTop>
          <KpiNum>{workerCount}</KpiNum>
          <KpiFoot>across {floor.length} stages</KpiFoot>
        </Kpi>
        <Kpi>
          <KpiTop><KpiIc $bg={C.orangeBg} $fg={C.orange}><IPulse /></KpiIc><KpiLabel>In Progress</KpiLabel></KpiTop>
          <KpiNum>{totals.inProgress}</KpiNum>
          <KpiFoot>on the floor now</KpiFoot>
        </Kpi>
        <Kpi>
          <KpiTop><KpiIc $bg={C.tealBg} $fg={C.teal}><IClock /></KpiIc><KpiLabel>Labor Hours</KpiLabel></KpiTop>
          <KpiNum>
            {totals.hours.toFixed(1)}
            <small style={{ fontSize: ".85rem", fontWeight: 700, color: C.faint }}>h</small>
          </KpiNum>
          <KpiFoot>{made > 0 ? `${(totals.hours / made).toFixed(1)}h per coffin` : "—"}</KpiFoot>
        </Kpi>
      </Kpis>

      <Main>
        {/* ── trend ── */}
        <Card>
          <CardHead>
            <h2 title="Coffins finished per month. Click a worker to isolate their line.">Production Trend</h2>
          </CardHead>
          <CardBody>
            <TrendPanel rows={rows} />
          </CardBody>
        </Card>

        {/* ── target ── */}
        <Card>
          <CardHead>
            <h2 title={`Shared monthly goal. ${monthsHit} of ${scoredMonths.length || 0} months hit this year.`}>
              Monthly Target
            </h2>
          </CardHead>
          <CardBody>
            <RingRow
              title={
                !hasTarget
                  ? "No target set for this month."
                  : ringMet
                    ? `Target hit — +${ringProd - ringTarget} over. ${monthsHit} of ${scoredMonths.length} months hit this year.`
                    : `${ringTarget - ringProd} more to hit the goal. ${monthsHit} of ${scoredMonths.length} months hit this year.`
              }
            >
              <Ring>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e0e0" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={!hasTarget ? "#cbd5e1" : ringMet ? C.ok : C.orange}
                    strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${(pctArc / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
                </svg>
                <RingVal>
                  <div>
                    <b>{hasTarget ? `${pctRaw}%` : "—"}</b>
                    <small>{hasTarget ? (ringMet ? "hit" : "of target") : "no target"}</small>
                  </div>
                </RingVal>
              </Ring>
              <RingInfo>
                <div className="big">{ringProd} / {hasTarget ? ringTarget : "—"}</div>
                <div className="ratio">{MONTHS[new Date().getMonth()]} coffins</div>
              </RingInfo>
            </RingRow>

            {scoredMonths.length > 0 && (
              <Strip>
                {scoredMonths.map((m) => {
                  const hit = (Number(m.produced) || 0) >= Number(m.target);
                  const pct = Math.min(100, Math.round(((Number(m.produced) || 0) / Number(m.target)) * 100));
                  const isNow = m.month === currentMonthKey;
                  return (
                    <TCol key={m.month} $now={isNow}
                      title={`${m.month}: ${m.produced || 0} of ${m.target} coffins${hit ? " — target hit" : ""}${isNow ? " (current month)" : ""}`}>
                      <TBar $hit={hit}>
                        <span style={{ height: `${Math.max(5, pct)}%` }} />
                      </TBar>
                      <TM $hit={hit}>
                        {monthShort(m.month)}{hit ? <ICheck size={8} /> : null}
                      </TM>
                    </TCol>
                  );
                })}
              </Strip>
            )}

            {scoredMonths.length > 0 && (
              <TStats>
                <TStat>
                  <div className="k">Best</div>
                  <div className="v">{bestI >= 0 ? `${monthShort(scoredMonths[bestI].month)} · ${stripVals[bestI]}` : "—"}</div>
                </TStat>
                <TStat>
                  <div className="k">Avg / month</div>
                  <div className="v">{stripAvg}</div>
                </TStat>
              </TStats>
            )}
          </CardBody>
        </Card>
      </Main>

      {/* ── worker performance ── */}
      <Card>
        <CardHead>
          <h2 title="Ranked by this month. Hover a row for the remove option; bars compare against the shared monthly target.">
            Worker Performance
          </h2>
        </CardHead>
        <TableWrap>
          <WTable>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Worker</th>
                <th className="num" title="Coffins finished this month">Month</th>
                <th className="num" title="Against the shared monthly target">Target</th>
                <th title="Last 6 months">Trend</th>
                <th className="num">Total</th>
                <th className="num">Share</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const mo = r.month;
                const met = thisMonthTarget > 0 && mo >= thisMonthTarget;
                const spark = last6Keys.map((k) => r.perMonth[k] || 0);
                const sMax = Math.max(1, ...spark);
                return (
                  <WRow key={r.id}>
                    <td style={{ color: C.faint, fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <Who>
                        <Ava $c={r.color}>{initials(r.name)}</Ava>
                        <WhoTxt><b>{r.name}</b><small>{r.role}</small></WhoTxt>
                        {onRemoveWorker && (
                          <Rm className="rm-btn" type="button" title="Remove worker"
                            onClick={() => onRemoveWorker(r.id)}>
                            <IX />
                          </Rm>
                        )}
                      </Who>
                    </td>
                    <td className="num" style={{ fontSize: ".92rem", fontWeight: 800 }}>{mo}</td>
                    <td>
                      {thisMonthTarget > 0 ? (
                        <TgtCell title={`${mo} of ${thisMonthTarget} this month${met ? " — target met" : ""}`}>
                          <em className={met ? "met" : ""}>{mo}/{thisMonthTarget}{met ? " ✓" : ""}</em>
                          <MiniTrack $met={met}>
                            <span style={{ width: `${Math.min(100, Math.round((mo / thisMonthTarget) * 100))}%` }} />
                          </MiniTrack>
                        </TgtCell>
                      ) : <span style={{ color: C.faint }}>—</span>}
                    </td>
                    <td>
                      <Spark title={last6Keys.map((k, idx) => `${monthShort(k)}: ${spark[idx]}`).join(" · ")}>
                        {spark.map((v, idx) => (
                          <i key={idx} style={{ height: `${Math.max(3, Math.round((v / sMax) * 24))}px` }} />
                        ))}
                      </Spark>
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>{r.completed}</td>
                    <td className="num">
                      <Share title={`${r.completed} of ${made} all-time coffins`}>
                        {Math.round((r.completed / shareDenom) * 100)}%
                        <span className="bar"><span style={{ width: `${((r.completed / shareDenom) * 100).toFixed(1)}%` }} /></span>
                      </Share>
                    </td>
                  </WRow>
                );
              })}
            </tbody>
          </WTable>
        </TableWrap>
      </Card>

      {/* ── live floor ── */}
      <Card>
        <CardHead>
          <h2 title="Live stage pipeline. ⚠ = waiting more than 5 days.">On the Floor</h2>
        </CardHead>
        <CardBody>
          <Floor>
            {floor.map((st) => (
              <Stage key={st.name} $c={st.color}>
                <StageTop $c={st.color}>
                  <b>{st.name}</b>
                  <span className="n">{st.items.length}</span>
                </StageTop>
                {st.items.length === 0 && <StageEmpty>Empty</StageEmpty>}
                {st.items.map((it, i) => (
                  <StageItem key={`${it.name}-${i}`}
                    title={`${it.name} · ${st.name} · ${it.days} day${it.days === 1 ? "" : "s"}${it.days > 5 ? " — waiting long" : ""}`}>
                    <span>{it.name}</span>
                    <em className={it.days > 5 ? "late" : ""}>{it.days}d{it.days > 5 ? " ⚠" : ""}</em>
                  </StageItem>
                ))}
              </Stage>
            ))}
          </Floor>
        </CardBody>
      </Card>
    </Root>
  );
}

/* ── Trend panel (chart + worker chips) ─────────────────────────────── */
function TrendPanel({ rows }) {
  const now = new Date();
  const [selWorker, setSelWorker] = useState("All Workers");
  const [selYear, setSelYear] = useState(String(now.getFullYear()));

  const years = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => Object.keys(r.perMonth).forEach((k) => set.add(k.slice(0, 4))));
    set.add(String(now.getFullYear()));
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [rows]);

  const activeYear = years.includes(selYear) ? selYear : String(now.getFullYear());
  const isAll = selWorker === "All Workers";

  const series = useMemo(() => {
    const build = (r) => ({
      name: r.name,
      color: r.color,
      values: MONTHS.map((_, m) => r.perMonth[`${activeYear}-${String(m + 1).padStart(2, "0")}`] || 0),
    });
    return isAll ? rows.map(build) : rows.filter((r) => r.name === selWorker).map(build);
  }, [rows, isAll, selWorker, activeYear]);

  // Future months are never plotted — no invented declines.
  const lastMonth = activeYear === String(now.getFullYear()) ? now.getMonth() : 11;

  const W = 760, H = 270, padL = 36, padR = 14, padT = 16, padB = 28;
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (i) => padL + (i * iw) / 11;
  const rawMax = Math.max(4, ...series.flatMap((s) => s.values));
  const yMax = rawMax % 2 === 0 ? rawMax : rawMax + 1;
  const y = (v) => padT + ih - (v / yMax) * ih;

  /* gridline step adapts to the scale — a busy month no longer draws 25+ lines */
  const step = yMax <= 8 ? 2 : yMax <= 20 ? 5 : 10;
  const gridLines = [];
  for (let g = 0; g <= yMax; g += step) gridLines.push(g);

  return (
    <>
      <ChipRow>
        <ChipLbl>Worker</ChipLbl>
        <Chip type="button" $on={isAll} onClick={() => setSelWorker("All Workers")}>All</Chip>
        {rows.map((r) => (
          <Chip key={r.id} type="button" $on={!isAll && selWorker === r.name}
            onClick={() => setSelWorker(r.name)}
            title={`Show only ${r.name}`}>
            <Cdot $c={r.color} />{r.name.split(" ")[0]}
          </Chip>
        ))}
        {years.length > 1 && (
          <>
            <ChipLbl style={{ marginLeft: ".5rem" }}>Year</ChipLbl>
            {years.map((yr) => (
              <Chip key={yr} type="button" $on={activeYear === yr} onClick={() => setSelYear(yr)}>{yr}</Chip>
            ))}
          </>
        )}
      </ChipRow>

      <ChartBox>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Coffins made per month">
          {gridLines.map((g) => (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)}
                stroke={g === 0 ? "#e0e0e0" : "#f1f5f9"} strokeWidth="1" />
              <text x={padL - 7} y={y(g) + 3.5} textAnchor="end" fontSize="10" fill={C.muted}>{g}</text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10"
              fontWeight={i === lastMonth ? 600 : 400}
              fill={i > lastMonth ? "#cbd5e1" : i === lastMonth ? C.ink : C.muted}>{m}</text>
          ))}

          {series.map((s) => {
            const drawn = s.values.slice(0, lastMonth + 1);
            const pts = drawn.map((v, i) => [x(i), y(v)]);
            const linePath = smoothPath(pts);
            return (
              <g key={s.name}>
                {!isAll && linePath && (
                  <path d={`${linePath} L ${x(drawn.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`}
                    fill={s.color} opacity="0.07" />
                )}
                {linePath && (
                  <path d={linePath} fill="none" stroke={s.color}
                    strokeWidth={isAll ? 2 : 2.5} strokeLinejoin="round" strokeLinecap="round"
                    opacity={isAll ? 0.9 : 1} />
                )}
                {s.values.map((v, i) => {
                  if (i > lastMonth) return null;
                  return (
                    <g key={i}>
                      <circle cx={x(i)} cy={y(v)} r={isAll ? 3 : 4} fill="#fff" stroke={s.color} strokeWidth="2"
                        style={{ cursor: "default" }}>
                        <title>{`${MONTHS[i]} ${activeYear} · ${s.name}: ${v} coffin${v === 1 ? "" : "s"}`}</title>
                      </circle>
                      {!isAll && (
                        <text x={x(i)} y={y(v) - 9} textAnchor="middle" fontSize="10"
                          fontWeight="700" fill={C.ink}>{v}</text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </ChartBox>
    </>
  );
}