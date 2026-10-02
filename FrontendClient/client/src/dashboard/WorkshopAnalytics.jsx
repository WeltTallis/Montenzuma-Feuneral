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

const FINISHED = ["completed", "delivered", "cancelled", "dispatched", "collected"];

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
            completed += 1;
            if (createdMs) {
              const k = monthKeyOf(new Date(createdMs));
              perMonth[k] = (perMonth[k] || 0) + 1;
              if (k === monthKey) month += 1;
              if (k === lastMonthKey) lastMonth += 1;
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

          {series.map((s) => (
            <g key={s.name}>
              {/* area fill only when a single worker is isolated */}
              {!isAll && (
                <path
                  d={`M ${x(0)} ${y(0)} ` + s.values.map((v, i) => `L ${x(i)} ${y(v)}`).join(" ") + ` L ${x(11)} ${y(0)} Z`}
                  fill={s.color}
                  opacity="0.07"
                />
              )}
              <path
                d={s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={isAll ? 2 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={isAll ? 0.9 : 1}
              />
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
          ))}
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

/* ── Production per worker per month ────────────────────────────────────────
   The explicit "how many has each worker produced each month" grid.

   The rest of this file derives its numbers from the LIVE order payload, which
   by design no longer contains finished orders — so every derived figure reads
   0. This grid is driven by GET /workshop/reports/worker-production instead,
   which aggregates finished orders in SQL, and is the authoritative answer. */
function ProductionGrid({ production }) {
  const months = Array.isArray(production?.months) ? production.months : [];
  const rows = Array.isArray(production?.workers) ? production.workers : [];

  const monthLabel = (key) => {
    const [y, m] = String(key).split("-").map(Number);
    if (!y || !m) return key;
    return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
  };

  // The highest single cell decides the heat scale, so one busy month does not
  // wash every other month out to zero colour.
  const peak = Math.max(1, ...rows.flatMap((r) => months.map((m) => Number(r.monthly?.[m]) || 0)));
  const grand = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);

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
                <th key={m} className="wa-pm-cell">{monthLabel(m)}</th>
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
                  const intensity = v / peak;
                  return (
                    <td key={m} className={`wa-pm-cell${v === 0 ? " zero" : ""}`}>
                      {/* Opacity ramps with the value so the eye lands on the
                          productive months without needing a colour scale. */}
                      <span style={v ? { background: `rgba(95, 15, 64, ${0.12 + intensity * 0.55})` } : undefined}>
                        {v}
                      </span>
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

/* ── Main view ─────────────────────────────────────────────────────────── */
export default function WorkshopAnalytics({ orders = [], workers = [], production = null, onRemoveWorker }) {
  const { rows, totals } = useWorkerStats(orders, workers, production);

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
      <ProductionGrid production={production} />

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
          return (
            <div className="wa-wcard" key={r.id}>
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
