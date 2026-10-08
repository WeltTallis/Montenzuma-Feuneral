// WorkshopAnalytics.jsx
// Production analytics for the dashboard's Workshop module: per-worker output,
// live stage breakdown, and a multi-worker monthly trend line chart.
// Self-contained — it takes `orders` + `workers` as props so the dashboard
// panel owns the single fetch.

import { useMemo, useState } from "react";

/* status palette (matches the reference) */
const C = {
  navy: "#00296B", navyBg: "#EFF6FF",
  orange: "#E36414", orangeBg: "#FFEDD5",
  plum: "#5F0F40", plumBg: "#FCE7F3",
  green: "#132A13", greenBg: "#E8F5E9",
  amber: "#D97706", amberBg: "#FFFBEB",
  red: "#DD2D4A", redBg: "#FEE2E2",
  ink: "#0C0B0F",
};

/* "YYYY-MM" for a date — the key format every month bucket in this file uses
   (targets, production report, worker cards). */
const monthKeyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/* One colour per worker, cycled in a fixed order so a worker's line keeps the
   same colour across every chart and chip. */
const PALETTE = [C.navy, C.orange, C.plum, C.amber, C.green, "#7C3AED", "#0D9488", "#B45309"];

const STAGES = [
  { name: "Building", color: C.navy },
  { name: "Waiting Bay", color: C.amber },
  { name: "Painting", color: C.orange },
  { name: "Interior", color: C.plum },
  { name: "Store", color: C.green },
];

const STATUS_TO_STAGE = {
  pending: 0, building: 0, design: 0,
  waiting_bay: 1, waiting: 1, inspection: 1,
  painting: 2,
  interior: 3, upholstery: 3,
  completed: 4, delivered: 4, store: 4,
};

// A coffin counts as PRODUCED once it reaches the Store stage.
//
// "store" is deliberately in this list. It maps to stage 4 below (the final
// stage, alongside completed/delivered) but was MISSING here, so every coffin a
// worker had moved up to Store — the normal end of the workshop pipeline — was
// treated as still-in-progress. The result: "Coffins per Worker", the per-month
// counts and the totals all read 0, which is why the dashboard analytics showed
// nothing at all. `cancelled` is kept for completeness: it is not real output,
// so it is excluded from the per-worker totals below.
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

/* "YYYY-MM" -> the workshop's shared monthly target.
 *
 *  There is ONE number now — every worker is measured against the same figure
 *  for a given month — so the map is keyed by month only, not by worker. A
 *  month with no target is simply absent, which callers read as "no target"
 *  rather than "target of zero". */
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
 *
 *  `production` is the source of truth for anything measuring FINISHED work
 *  (coffins made, per-month counts, totals). It comes from
 *  GET /workshop/reports/worker-production, which aggregates finished orders in
 *  SQL.
 *
 *  WHY IT CANNOT COME FROM `orders` ANY MORE: the live board deliberately
 *  excludes completed/delivered orders (workshopService.getActiveOrders), so
 *  every `done` branch below was structurally unreachable — which left
 *  "Coffins per Worker" and the whole trend chart permanently blank no matter
 *  how much the florists actually produced. `orders` is still the right source
 *  for IN-PROGRESS work (the in-progress list and the live counts), so it is
 *  kept for those.
 */
function useWorkerStats(orders, workers, production) {
  return useMemo(() => {
    const now = new Date();
    const monthKey = monthKeyOf(now);
    const weekAgo = now.getTime() - 7 * 86400000;
    const lastMonthKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    // Server-side per-worker production, indexed by the same stable user id.
    const prodById = new Map();
    (Array.isArray(production?.workers) ? production.workers : []).forEach((p) => {
      prodById.set(String(p.worker_id), p);
    });

    const rows = (Array.isArray(workers) ? workers : []).map((w, i) => {
      const mine = (Array.isArray(orders) ? orders : []).filter((o) => ownsOrder(w, o));
      const perMonth = {};
      let completed = 0, active = 0, hours = 0, month = 0, week = 0, lastMonth = 0;
      const inProgress = [];

      // ── FINISHED work: prefer the SQL aggregation ──
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
          // Only count locally when the SQL aggregate is unavailable (the
          // endpoint failed), otherwise the same coffin would be counted twice.
          if (!prod) {
            // A cancelled order is finished but is NOT output — counting it as a
            // coffin made would inflate every worker's numbers.
            const isReal = String(o.status || '').toLowerCase() !== 'cancelled';
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
            // "This week" is a rolling window the month buckets cannot express.
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


/* ── Multi-worker trend line chart ──────────────────────────────────────
   Hand-rolled SVG rather than a chart library: the reference needs exact
   control over per-series colours, an area fill only in single-worker mode,
   and dots/labels that stop at the last month that actually happened. */
function TrendChart({ rows }) {
  const now = new Date();
  const [selWorker, setSelWorker] = useState("All Workers");
  const [selYear, setSelYear] = useState(String(now.getFullYear()));

  // Years that actually have data, newest first. Keeps the chip row honest
  // instead of offering years with no orders at all.
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

  // Months that have actually happened — future months are not plotted.
  const lastMonth = activeYear === String(now.getFullYear()) ? now.getMonth() : 11;

  const W = 760, H = 280, padL = 40, padR = 20, padT = 24, padB = 34;
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (i) => padL + (i * iw) / 11;
  const rawMax = Math.max(4, ...series.flatMap((s) => s.values));
  const yMax = rawMax % 2 === 0 ? rawMax : rawMax + 1;
  const y = (v) => padT + ih - (v / yMax) * ih;

  const gridLines = [];
  for (let g = 0; g <= yMax; g += 2) gridLines.push(g);

  const summary = useMemo(() => {
    const totals = MONTHS.map((_, i) =>
      series.reduce((s, ser) => s + (i <= lastMonth ? ser.values[i] : 0), 0)
    );
    const grand = totals.reduce((a, b) => a + b, 0);
    const bestI = totals.indexOf(Math.max(...totals));
    const activeMonths = totals.filter((v) => v > 0).length;
    return {
      grand,
      best: { label: MONTHS[bestI], value: totals[bestI] },
      avg: activeMonths ? (grand / activeMonths).toFixed(1) : "0",
      lines: series.length,
    };
  }, [series, lastMonth]);


  return (
    <div className="wa-trend">
      <div className="wa-trend-head">
        <div>
          <h2>Production Trend</h2>
          <div className="wa-sub">
            Coffins made per month · All Workers shows every worker as its own
            line — click a worker to isolate
          </div>
        </div>
      </div>

      {/* selectors double as the legend */}
      <div className="wa-pickers">
        <div className="wa-chips">
          <span className="wa-chips-label">Worker</span>
          <button className={`wa-chip${isAll ? " active" : ""}`} onClick={() => setSelWorker("All Workers")}>
            All Workers
          </button>
          {rows.map((r) => (
            <button
              key={r.id}
              className={`wa-chip${!isAll && selWorker === r.name ? " active" : ""}`}
              onClick={() => setSelWorker(r.name)}
            >
              <span className="wa-cdot" style={{ background: r.color }} />
              {r.name}
            </button>
          ))}
        </div>
        {years.length > 1 && (
          <div className="wa-chips">
            <span className="wa-chips-label">Year</span>
            {years.map((y) => (
              <button
                key={y}
                className={`wa-chip wa-chip--year${activeYear === y ? " active" : ""}`}
                onClick={() => setSelYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="wa-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Coffins made per month line chart">
          {gridLines.map((g) => (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)}
                stroke={g === 0 ? "#D1D5DB" : "#F3F4F6"} strokeWidth="1" />
              <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{g}</text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#9CA3AF">{m}</text>
          ))}

          {series.map((s) => {
            /* Only the months that have actually happened get plotted. Drawing a
               curve out to December when it is only February would invent a
               decline that never occurred, and a smoothed curve exaggerates
               that kind of fiction far more than a straight line does — so the
               series is cut at the last real month first, then smoothed. */
            const drawn = s.values.slice(0, lastMonth + 1);
            const pts = drawn.map((v, i) => [x(i), y(v)]);
            const linePath = smoothPath(pts);

            return (
              <g key={s.name}>
                {/* area fill only when a single worker is isolated */}
                {!isAll && linePath && (
                  <path
                    /* Closed along the baseline rather than following the curve
                       back, so the fill hugs the floor instead of bowing under it. */
                    d={`${linePath} L ${x(drawn.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`}
                    fill={s.color}
                    opacity="0.07"
                  />
                )}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isAll ? 2 : 2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={isAll ? 0.9 : 1}
                  />
                )}
                {s.values.map((v, i) => {
                  if (i > lastMonth) return null;
                  return (
                    <g key={i}>
                      <circle cx={x(i)} cy={y(v)} r={isAll ? 3 : 4} fill="#fff" stroke={s.color} strokeWidth="2">
                        <title>{`${MONTHS[i]} ${activeYear} · ${s.name}: ${v} coffin${v === 1 ? "" : "s"}`}</title>
                      </circle>
                      {!isAll && (
                        <text x={x(i)} y={y(v) - 10} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#111827">
                          {v}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="wa-trend-summary">
        <div><span className="k">View</span><b>{isAll ? "All Workers" : selWorker}</b></div>
        <div><span className="k">{activeYear} total</span><b>{summary.grand} coffins</b></div>
        <div><span className="k">Best month</span><b>{summary.best.label} · {summary.best.value}</b></div>
        <div><span className="k">Avg / active month</span><b>{summary.avg}</b></div>
        <div><span className="k">Lines shown</span><b>{summary.lines}</b></div>
      </div>
    </div>
  );
}

/* ── Smooth curve for the trend line ───────────────────────────────────────
   Turns a list of points into a cubic Bézier path that passes exactly through
   every one of them (Catmull-Rom converted to Bézier).

   Why not just a <polyline> or a chain of "L" commands: those draw hard
   angular corners, so a month where production dipped read as a cliff and a
   recovery read as a spike. Monthly coffin counts are small integers and the
   shape between two real months is interpolation, not data — a smooth curve
   makes that honest instead of implying a sharp change that never happened.

   Catmull-Rom specifically because it is INTERPOLATING: the curve is
   guaranteed to pass through the real data points rather than near them, so no
   month is visually distorted by the smoothing. A plain Bézier through the
   points would pull them off and understate a genuine peak.

   `tension` is the 0.5 Catmull-Rom constant, which is what keeps the curve
   from overshooting. Raising it makes the line balloon between a high and a
   low month — bad for integer counts, because it can dip below zero and draw a
   "negative" month that is not in the data. */
function smoothPath(pts, tension = 0.5) {
  if (!pts.length) return "";
  if (pts.length < 3) {
    // Two points have no interior tangent to blend, so a curve would add
    // nothing and could look skewed. A straight line is the honest shape.
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  }

  let d = `M ${pts[0][0]} ${pts[0][1]}`;

  for (let i = 0; i < pts.length - 1; i += 1) {
    // p0/p3 are the neighbours that set the tangent at each end of this
    // segment; p1/p2 are the two points being joined. They are clamped at the
    // ends so the first and last segments do not invent a phantom point.
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

/* Monthly attainment strip: one column per month, showing how many coffins were
   made against the month's target, with the months that were hit called out.

   This is the "who crossed the target" view at workshop level. It sits above the
   per-worker grid because the question is asked at two levels: did the workshop
   hit its number, and then which worker carried it.

   A month with NO target set is deliberately not shown as a miss. There was
   nothing to hit, so it is simply left unmarked — painting an unset month red
   would report a failure that was never in question. */
function TargetAttainment({ targets }) {
  const months = Array.isArray(targets?.months) ? targets.months : [];
  const scored = months.filter((m) => Number(m.target) > 0);
  if (!scored.length) return null;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const met = scored.filter((m) => m.produced >= m.target);

  return (
    <div className="wa-panel">
      <h2>
        Monthly Target
        {met.length > 0 && (
          <span className="wa-month-chip">{met.length} of {scored.length} hit</span>
        )}
      </h2>
      <div className="wa-sub">
        Coffins finished against the number the workshop aimed for that month
      </div>

      <div className="wa-target-strip">
        {scored.map((m) => {
          const hit = m.produced >= m.target;
          const pct = Math.min(100, Math.round((m.produced / m.target) * 100));
          const isNow = m.month === currentMonth;
          return (
            <div
              key={m.month}
              className={`wa-target-col${hit ? " hit" : ""}${isNow ? " now" : ""}`}
              title={
                `${m.month}: ${m.produced} of ${m.target} coffins` +
                `${isNow ? " (current month)" : ""}`
              }
            >
              <div className="wa-target-bar">
                <span style={{ height: `${Math.max(4, pct)}%` }} />
              </div>
              <div className="wa-target-pct">{pct}%</div>
              <div className="wa-target-n">{m.produced}/{m.target}</div>
              <div className="wa-target-m">{m.month.slice(5)}</div>
              {hit ? <i className="fas fa-check" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Month header. A month the workshop HIT its target gets a tick and a green tint,
   so a manager reading down the column can see at a glance which months were
   good ones without cross-referencing the attainment strip above. */
function MonthHead({ keyStr, hit }) {
  const [y, m] = String(keyStr).split("-").map(Number);
  return (
    <th className={`wa-pm-cell${hit ? " hit" : ""}`}>
      {y && m ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : keyStr}
      {hit ? <i className="fas fa-check" aria-hidden="true" /> : null}
    </th>
  );
}

/* ── Production per worker per month ────────────────────────────────────────
   The explicit "how many has each worker produced each month" grid.

   The rest of this file derives its numbers from the LIVE order payload, which
   by design no longer contains finished orders — so every derived figure reads
   0. This grid is driven by GET /workshop/reports/worker-production instead,
   which aggregates finished orders in SQL, and is the authoritative answer. */
function ProductionGrid({ production, targets }) {
  const months = Array.isArray(production?.months) ? production.months : [];
  const rows = Array.isArray(production?.workers) ? production.workers : [];

  // The month heading is now rendered by <MonthHead>, which also carries the
  // "target hit" tick, so the old local monthLabel formatter is no longer used.

  // The highest single cell decides the heat scale, so one busy month does not
  // wash every other month out to zero colour.
  const peak = Math.max(1, ...rows.flatMap((r) => months.map((m) => Number(r.monthly?.[m]) || 0)));
  const grand = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);

  /* Months where every worker crossed the shared target, keyed "YYYY-MM" so the
     month header can mark them inline. Months with no target — or where at least
     one worker fell short — are absent from this set and left unmarked rather
     than being shown as a miss. */
  const tMap = monthTargetMap(targets);
  const hitMonths = new Set(
    rows.filter((r) => r.monthly).flatMap(() => []) // placeholder no-op, real logic below
  );
  hitMonths.clear();
  if (rows.length > 0) {
    for (const [mk, t] of tMap) {
      if (rows.every((r) => (Number(r.monthly?.[mk]) || 0) >= t)) hitMonths.add(mk);
    }
  }

  /* The shared figure each cell is judged against: "did this worker finish the
     workshop's number for that month?" — the same number for everybody, from
     the single Set Target dialog. */
  const sharedTargetOf = (monthKey) => tMap.get(String(monthKey)) || 0;

  if (!rows.length) {
    return (
      <div className="wa-panel">
        <h2>Production per Worker, per Month</h2>
        <div className="wa-sub">Coffins finished, credited to the month they were completed</div>
        <div className="wa-empty">No workers registered yet.</div>
      </div>
    );
  }

  return (
    <div className="wa-panel wa-pm-panel">
      <h2>
        Production per Worker, per Month
        {grand > 0 && <span className="wa-month-chip">{grand} total</span>}
      </h2>
      <div className="wa-sub">
        Coffins finished, credited to the month they were completed — not the month they were ordered
      </div>

      {/* Horizontally scrollable so a 12-month window stays readable on a phone
          instead of being crushed into unreadable 3-character columns. */}
      <div className="wa-pm-scroll">
        <table className="wa-pm">
          <thead>
            <tr>
              <th className="wa-pm-name">Worker</th>
              {months.map((m) => (
                <MonthHead key={m} keyStr={m} hit={hitMonths.has(m)} />
              ))}
              <th className="wa-pm-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.worker_id}>
                <th scope="row" className="wa-pm-name">
                  <span className="wa-avatar">{initials(r.name)}</span>
                  <span className="wa-pm-who">
                    <b>{r.name}</b>
                    <small>{r.role}</small>
                  </span>
                </th>
                {months.map((m) => {
                  const v = Number(r.monthly?.[m]) || 0;
                  const t = sharedTargetOf(m);
                  // Met only when a target was actually set for that worker+month,
                  // so an unset month is never painted as a success.
                  const hit = t > 0 && v >= t;
                  const intensity = v / peak;
                  return (
                    <td
                      key={m}
                      className={`wa-pm-cell${v === 0 ? " zero" : ""}${hit ? " met" : ""}`}
                      title={t > 0 ? `${r.name} · ${m}: ${v} of ${t} coffins${hit ? " — target met" : ""}` : undefined}
                    >
                      {/* Opacity ramps with the value so the eye lands on the
                          productive months without needing a colour scale. */}
                      <span style={v ? { background: `rgba(95, 15, 64, ${0.12 + intensity * 0.55})` } : undefined}>
                        {v}
                      </span>
                      {hit ? <i className="fas fa-check" aria-hidden="true" /> : null}
                    </td>
                  );
                })}
                <td className="wa-pm-total">{r.total || 0}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="wa-pm-name">All workers</th>
              {months.map((m) => (
                <td key={m} className="wa-pm-cell">
                  {rows.reduce((s, r) => s + (Number(r.monthly?.[m]) || 0), 0)}
                </td>
              ))}
              <td className="wa-pm-total">{grand}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Production mix: what was actually made ──────────────────────────────
   Coffin type + colour, straight from the SQL aggregate.

   This exists because "2 workers on carrier caskets" is ambiguous on a
   spreadsheet of totals: it could be one shared job or two separate coffins.
   It is two. Grouping by type AND colour makes that visible — the same type in
   two colours shows up as two rows, which is exactly the physical reality on
   the floor. */
function ProductionMix({ byType }) {
  const rows = Array.isArray(byType) ? byType.filter((r) => Number(r.produced) > 0) : [];
  const total = rows.reduce((s, r) => s + Number(r.produced || 0), 0);

  if (!rows.length) {
    return (
      <div className="wa-panel">
        <h2>What Was Produced</h2>
        <div className="wa-sub">Completed coffins by type and colour</div>
        <div className="wa-empty">No completed coffins for this year yet.</div>
      </div>
    );
  }

  return (
    <div className="wa-panel">
      <h2>
        What Was Produced
        {total > 0 && <span className="wa-month-chip">{total} total</span>}
      </h2>
      <div className="wa-sub">
        Each finished coffin counted once — the same type in two colours is two coffins
      </div>

      <div className="wa-mix">
        {rows.map((r, i) => (
          <div className="wa-mix-row" key={`${r.coffin_type}-${r.color}-${i}`}>
            <div className="wa-mix-name">
              <b>{r.coffin_type}</b>
              <small>{r.color}</small>
            </div>
            <div className="wa-mix-bar">
              <span style={{ width: `${(Number(r.produced) / total) * 100}%` }} />
            </div>
            <div className="wa-mix-num">
              {r.produced}
              {Number(r.workers) > 1 && <small>{r.workers} workers</small>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main view ─────────────────────────────────────────────────────────── */
export default function WorkshopAnalytics({ orders = [], workers = [], production = null, targets = null, onRemoveWorker }) {
  const { rows, totals, monthKey } = useWorkerStats(orders, workers, production);

  /* The workshop's shared monthly target (one number for every worker), keyed
     "YYYY-MM". Read by the worker cards to colour everyone who crossed it and
     by the leaderboard to flag the workers who exceeded it. */
  const tMap = useMemo(() => monthTargetMap(targets), [targets]);
  const sharedTargetOf = (monthKey) => tMap.get(String(monthKey)) || 0;

  const currentMonthKey = monthKeyOf(new Date());
  const tMap = useMemo(() => monthTargetMap(targets), [targets]);
  /* Exceeding the target is worth celebrating outright: a star on the rank row
     so a worker who BEAT the number stands out from one who merely matched it. */
  const sharedTarget = tMap.get(currentMonthKey) || 0;
  const maxBar = Math.max(1, ...rows.map((r) => r.completed + r.active));
  // Top producers: this month only, matching the reference's "Sep 2025" chip.
  const monthly = useMemo(
    () => [...rows].filter((r) => r.month > 0).sort((a, b) => b.month - a.month),
    [rows]
  );
  const monthLabel = (() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  })();

  // The headline figures must come from the SQL aggregation, not from the live
  // order payload: the live payload deliberately excludes finished orders, so
  // every derived total there is structurally 0. `production` is the fallback
  // for the one case the endpoint cannot cover — no workers registered at all.
  const made = production?.totals?.produced ?? totals.made;
  const madeThisMonth = production?.totals?.thisMonth ?? totals.month;
  const workerCount = production?.totals?.workers ?? totals.workers;

  // With no workers there is nothing else to show; the grid handles its own empty state.
  if (rows.length === 0 && !production) {
    return (
      <div className="wa-panel">
        <div className="wa-empty">No workers registered yet.</div>
      </div>
    );
  }

  return (
    <div className="wa">
      {/* The module header (back-to-Operations, title, live status and
          refresh) now lives in WorkshopPanel. A second <h1> here used to
          leave the Analytics tab looking completely different from the
          Store tab, which had no header at all. */}

      {/* ── the answer, first: what each worker produced each month ── */}
      <TargetAttainment targets={targets} />
      <ProductionMix byType={production?.by_type} />
      <ProductionGrid production={production} targets={targets} />

      {/* ── stats ── */}
      <div className="wa-stats">
        <div className="wa-stat">
          <div className="wa-label">Workers</div>
          <div className="wa-num">{workerCount}</div>
        </div>
        <div className="wa-stat wa-stat--plum">
          <div className="wa-label">Coffins Made</div>
          <div className="wa-num">{made}</div>
          <span className={`wa-delta${madeThisMonth - totals.lastMonth > 0 ? "" : " flat"}`}>
            <i className={`fas ${madeThisMonth - totals.lastMonth > 0 ? "fa-arrow-up" : "fa-minus"}`} />
            {" "}{madeThisMonth - totals.lastMonth > 0 ? `+${madeThisMonth - totals.lastMonth} this month` : "no change"}
          </span>
        </div>
        <div className="wa-stat">
          <div className="wa-label">In Progress</div>
          <div className="wa-num">{totals.inProgress}</div>
        </div>
        <div className="wa-stat wa-stat--navy">
          <div className="wa-label">Labor Hours</div>
          <div className="wa-num">{totals.hours.toFixed(1)}<small>h</small></div>
        </div>
      </div>

      {/* ── bars + this-month leaderboard ── */}
      <div className="wa-duo">
        <div className="wa-panel">
          <h2>Coffins per Worker</h2>
          <div className="wa-sub">Completed (plum) + in progress (amber), all time</div>

          {rows.map((r) => {
            const done = (r.completed / maxBar) * 100;
            const act = (r.active / maxBar) * 100;
            return (
              <div className="wa-bar-row" key={r.id}>
                <div className="wa-bar-top">
                  <span className="wa-bar-name">{r.name}</span>
                  <span className="wa-bar-count"><b>{r.completed}</b> made · {r.active} active</span>
                </div>
                <div className="wa-bar-track">
                  <span className="wa-bar-fill" style={{ width: `${done}%`, background: C.plum }} />
                  <span className="wa-bar-fill wa-bar-fill--active" style={{ width: `${act}%`, background: C.amberBg }} />
                </div>
              </div>
            );
          })}

          <div className="wa-legend">
            <span><i style={{ background: C.plum }} /> Completed</span>
            <span><i style={{ background: C.amberBg, border: "1px solid #FDE68A" }} /> In progress</span>
          </div>
        </div>

        <div className="wa-panel">
          <h2>Top Producers <span className="wa-month-chip">{monthLabel}</span></h2>
          <div className="wa-sub">Ranked by coffins completed this month</div>

          {monthly.length === 0 && <div className="wa-empty">No completions yet this month.</div>}

          {monthly.map((r, i) => (
            <div className="wa-rank-row" key={r.id}>
              <span className="wa-rank">{i + 1}</span>
              <span className="wa-avatar">{initials(r.name)}</span>
              <div className="wa-rank-info">
                <div className="wa-rank-name">{r.name}</div>
                <div className="wa-rank-role">{r.role}</div>
              </div>
              <div className="wa-rank-made">
                <b>{r.month}</b><span>made</span>
                <div className="wa-rank-all">{r.completed} all-time</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── worker cards ── */}
      <div className="wa-workers">
        {rows.map((r) => {
          // 6-month spark from the same perMonth data the trend chart uses.
          const now = new Date();
          const spark = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return r.perMonth[monthKeyOf(d)] || 0;
          });
          const sparkMax = Math.max(1, ...spark);
          {/* This month's shared number — the same target for every card. Only
              rendered when one has been set, so cards without a target keep
              their old shape instead of showing an empty 0/0 bar. */}
          const mt = sharedTargetOf(monthKey);
          const mtPct = mt > 0 ? Math.min(100, Math.round((r.month / mt) * 100)) : 0;
          const mtMet = mt > 0 && r.month >= mt;
          return (
            <div className={`wa-wcard${mtMet ? " wa-wcard--met" : ""}`} key={r.id}>
              <div className="wa-wcard-top">
                <span className="wa-avatar wa-avatar--lg">{initials(r.name)}</span>
                <div>
                  <div className="wa-wname">{r.name}</div>
                  <div className="wa-wrole">{r.role}</div>
                </div>
              </div>

              <div className="wa-wmade">
                <b style={{ color: C.plum }}>{r.completed}</b>
                <span className="wa-cap">coffins<br />made</span>
                <div className="wa-spark">
                  {spark.map((v, i) => (
                    <i
                      key={i}
                      style={{
                        height: `${Math.max(8, Math.round((v / sparkMax) * 100))}%`,
                        background: i === spark.length - 1 ? C.navy : C.navyBg,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* This worker's own monthly number. Only rendered when a target
                  has actually been set, so cards without one keep their old
                  shape instead of showing an empty 0/0 bar. */}
              {mt > 0 && (
                <div className={`wa-mt${mtMet ? " met" : ""}`}>
                  <div className="wa-mt-top">
                    <span className="wa-mt-label">{monthLabel} target</span>
                    <span className="wa-mt-val">
                      {mtMet ? <i className="fas fa-check" aria-hidden="true" /> : null}
                      {r.month} / {mt}
                      {mtMet && r.month > mt ? <span className="wa-mt-over">+{r.month - mt} over</span> : null}
                    </span>
                  </div>
                  <div className="wa-mt-track">
                    <span style={{ width: `${Math.max(4, mtPct)}%` }} />
                  </div>
                </div>
              )}

              <div className="wa-wmini">
                <div><b>{r.active}</b><span>active</span></div>
                <div><b>{r.hours.toFixed(1)}</b><span>hours</span></div>
                <div><b>{r.month}</b><span>this mo</span></div>
              </div>

              <div className="wa-ip">
                <div className="wa-ip-head">
                  <span className="wa-ip-title">In Progress</span>
                  <span className={`wa-ip-count${r.active === 0 ? " zero" : ""}`}>{r.active}</span>
                </div>
                {r.inProgress.length === 0 && (
                  <div className="wa-ip-empty">Nothing in progress right now</div>
                )}
                {r.inProgress.map((it, i) => (
                  <div className="wa-ip-row" key={`${it.name}-${i}`}>
                    <span className="wa-ip-dot" style={{ background: it.color }} />
                    <span className="wa-ip-name">{it.name}</span>
                    <span className="wa-ip-meta">
                      <span className="wa-ip-stage">{it.stage}</span>
                      {it.days > 5 ? <span className="wa-ip-late"> · {it.days}d ⚠</span> : ` · ${it.days}d`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="wa-wcard-foot">
                <span className="wa-wperiod"><b>{r.week}</b> this week</span>
                {onRemoveWorker && (
                  <button className="wa-link-btn" onClick={() => onRemoveWorker(r.id)}>
                    <i className="fas fa-trash" style={{ fontSize: 9 }} /> Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── trend lines ── */}
      <div className="wa-panel wa-trend-panel">
        <TrendChart rows={rows} />
      </div>
    </div>
  );
}
