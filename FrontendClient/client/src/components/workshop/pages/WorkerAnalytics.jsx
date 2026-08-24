import React, { useContext, useMemo, useRef, useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Ctx } from './WorkshopDashboard';

Chart.register(...registerables);

// ─── Premium design tokens (amber workshop theme) ────────────────────────────
const C = {
  bg: '#FFFFFF', bgSub: '#F8F9FB', surface: '#FFFFFF', surfaceHover: '#FAFBFC',
  border: '#E8ECF1', borderLight: '#F0F2F5',
  text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
  accent: '#D97706', accentDim: '#FEF3C7', accentGlow: 'rgba(217,119,6,0.15)',
  success: '#059669', successDim: '#D1FAE5',
  warning: '#EA580C', warningDim: '#FFEDD5',
  danger: '#DC2626', dangerDim: '#FEE2E2',
  purple: '#7C3AED', purpleDim: '#EDE9FE',
  cyan: '#0891B2', cyanDim: '#CFFAFE',
  shadowSm: '0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.06)',
  shadowLg: '0 8px 30px rgba(0,0,0,0.08)',
};

const PALETTE = ['#D97706', '#059669', '#7C3AED', '#0891B2', '#EA580C', '#026B9C', '#CA8A04', '#0D9488', '#BE185D', '#1D4ED8'];

const FINISHED = ['completed', 'delivered', 'cancelled', 'dispatched', 'collected'];
const isFinished = (status) => FINISHED.includes(String(status || '').toLowerCase());

const initials = (name) =>
  String(name || 'W').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// Animated count-up number (drives the stat + worker-card totals)
const AnimatedNumber = ({ value }) => {
  const raw = Number(value) || 0;
  const decimals = (String(value).split('.')[1] || '').length > 0 ? 1 : 0;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!raw) { setDisplay(0); return; }
    const steps = 22, inc = raw / steps;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      const next = Math.min(raw, inc * i);
      setDisplay(decimals ? parseFloat(next.toFixed(decimals)) : Math.round(next));
      if (i >= steps) { clearInterval(t); setDisplay(decimals ? parseFloat(raw.toFixed(decimals)) : raw); }
    }, 22);
    return () => clearInterval(t);
  }, [raw, decimals]);
  return <>{display}</>;
};

// Compute a worker's production from REAL assignment + order data.
const computeWorkerStats = (worker, orders) => {
  const id = worker?.id;
  const wName = String(worker?.name || '').trim().toLowerCase();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  let assigned = 0, completed = 0, active = 0, month = 0, week = 0, hours = 0;
  const perMonth = {};
  const perStage = {};

  (Array.isArray(orders) ? orders : []).forEach((o) => {
    const isMine =
      (Array.isArray(o.assignments) && o.assignments.some((a) => Number(a.user_id) === Number(id))) ||
      Number(o.assignedTo) === Number(id) ||
      (!!wName && !!o.assignedToName && String(o.assignedToName).trim().toLowerCase() === wName);
    if (!isMine) return;

    const created = o.createdAt ? new Date(o.createdAt).getTime() : null;
    const age = created ? now - created : Infinity;
    const finished = isFinished(o.status);

    assigned += 1;
    if (finished) completed += 1; else active += 1;
    if (created && age <= 30 * DAY) month += 1;
    if (created && age <= 7 * DAY) week += 1;

    const mk = created ? `${new Date(created).getFullYear()}-${String(new Date(created).getMonth() + 1).padStart(2, '0')}` : 'n/a';
    perMonth[mk] = (perMonth[mk] || 0) + 1;

    // Stage bucket from production_stages if present, else status
    if (Array.isArray(o.stages)) {
      o.stages.forEach((st) => { if (st?.stage) perStage[st.stage] = (perStage[st.stage] || 0) + 1; });
    } else if (o.status) {
      perStage[o.status] = (perStage[o.status] || 0) + 1;
    }

    (Array.isArray(o.assignments) ? o.assignments : []).forEach((a) => {
      if (Number(a.user_id) === Number(id)) hours += parseFloat(a.hours_worked) || 0;
    });
  });

  return { assigned, completed, active, month, week, hours, perMonth, perStage };
};
const WorkerAnalytics = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { workers = [], orders = [], setModal, deleteWorker } = ctx;

  const barRef = useRef(null);
  const trendRef = useRef(null);

  const rows = useMemo(
    () =>
      (Array.isArray(workers) ? workers : [])
        .map((w, i) => ({
          ...w,
          color: w.color || PALETTE[i % PALETTE.length],
          stats: computeWorkerStats(w, orders),
        }))
        .sort((a, b) => b.stats.completed - a.stats.completed || b.stats.assigned - a.stats.assigned || String(a.name).localeCompare(String(b.name))),
    [workers, orders]
  );

  const totals = useMemo(
    () => ({
      workers: rows.length,
      produced: rows.reduce((s, r) => s + r.stats.completed, 0),
      active: rows.reduce((s, r) => s + r.stats.active, 0),
      hours: rows.reduce((s, r) => s + r.stats.hours, 0),
    }),
    [rows]
  );

  const leader = [...rows].sort((a, b) => b.stats.assigned - a.stats.assigned).slice(0, 8);
  const topWorker = leader[0];

  const allMonths = useMemo(() => [...new Set(rows.flatMap((r) => Object.keys(r.stats.perMonth)))].sort(), [rows]);
  const fmtMonth = (m) => {
    if (!m || m === 'n/a') return m;
    const [y, mo] = String(m).split('-');
    return new Date(+y, +mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Coffins per worker — horizontal stacked bars
  useEffect(() => {
    const el = barRef.current;
    if (!el || rows.length === 0) return undefined;
    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.name),
        datasets: [
          { label: 'Completed', data: rows.map((r) => r.stats.completed), backgroundColor: '#059669DD', borderColor: '#059669', borderWidth: 1, borderRadius: 4 },
          { label: 'Active', data: rows.map((r) => r.stats.active), backgroundColor: '#EA580CBB', borderColor: '#EA580C', borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 14, font: { size: 11 }, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.x}` } } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, font: { size: 11 } }, grid: { color: '#EEF2F7' } }, y: { ticks: { font: { size: 11 } }, grid: { display: false } } },
      },
    });
    return () => chart.destroy();
  }, [rows]);

  // Production trend per worker — line
  useEffect(() => {
    const el = trendRef.current;
    if (!el || allMonths.length === 0) return undefined;
    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels: allMonths.map(fmtMonth),
        datasets: rows.slice(0, 8).map((r) => ({ label: r.name, data: allMonths.map((m) => r.stats.perMonth[m] || 0), borderColor: r.color, backgroundColor: r.color + '18', fill: false, tension: 0.35, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 })),
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 }, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}` } } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, font: { size: 11 } }, grid: { color: '#EEF2F7' } }, x: { ticks: { font: { size: 11 } }, grid: { display: false } } },
      },
    });
    return () => chart.destroy();
  }, [rows, allMonths]);

  const maxAssigned = useMemo(() => Math.max(1, ...rows.map((r) => r.stats.assigned)), [rows]);

  const STATS = [
    { label: 'Workers', value: totals.workers, icon: 'fa-users', color: C.purple, dim: C.purpleDim },
    { label: 'Coffins Completed', value: totals.produced, icon: 'fa-boxes-stacked', color: C.accent, dim: C.accentDim },
    { label: 'In Progress', value: totals.active, icon: 'fa-hammer', color: C.warning, dim: C.warningDim },
    { label: 'Labor Hours', value: totals.hours.toFixed(1), icon: 'fa-clock', color: C.cyan, dim: C.cyanDim },
  ];

  const animCss = `
    @keyframes waFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes waBar { from { width: 0; } }
    .wa-card { animation: waFade 0.45s ease both; }
    .wa-progress { animation: waBar 0.6s ease both; }
  `;
  return (
    <>
      <style>{animCss}</style>
      <div style={{ position: 'relative', minHeight: '100%', background: C.bg }}>
        {/* Decorative dot pattern + warm glow */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #E5E7EB 0.7px, transparent 0.7px)', backgroundSize: '24px 24px', opacity: 0.45 }} />
        <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(217,119,6,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto', padding: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>
                Production Analytics <span style={{ color: C.accent }}>.</span>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Coffin production performance across the workshop</div>
            </div>
            <button onClick={() => setModal('createWorker')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', boxShadow: `0 2px 8px ${C.accentGlow}`, transition: 'all 0.2s' }}>
              <i className="fas fa-user-plus" style={{ fontSize: 12 }} /> Add New Worker
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 26 }}>
            {STATS.map((s) => (
              <div key={s.label} className="wa-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 18px', boxShadow: C.shadowSm, transition: 'all 0.2s', animationDelay: `${0.05 + STATS.indexOf(s) * 0.07}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: C.textSec }}>{s.label}</span>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.dim, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                    <i className={`fas ${s.icon}`} />
                  </div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={/^-?\d+$/.test(String(s.value)) ? s.value : s.value} />
                </div>
              </div>
            ))}
          </div>
          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 18, marginBottom: 28 }}>
            <div className="wa-card" style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: '18px 18px', boxShadow: C.shadowSm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accentDim, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-ranking-star" /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Coffins per Worker</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Completed + active output</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: Math.max(220, rows.length * 44) }}>
                <canvas ref={barRef} />
              </div>
            </div>
            <div className="wa-card" style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: '18px 18px', boxShadow: C.shadowSm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.cyanDim, color: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-chart-line" /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Production Trend</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Coffins produced per worker, per month</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: Math.max(220, rows.length * 42) }}>
                <canvas ref={trendRef} />
              </div>
            </div>
          </div>
          {/* Worker cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {rows.map((worker, idx) => {
              const s = worker.stats;
              const pct = Math.round((s.assigned / maxAssigned) * 100);
              return (
                <div key={worker.id} className="wa-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: C.shadowSm, transition: 'all 0.2s', animationDelay: `${(idx + 2) * 0.06}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: worker.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0, boxShadow: `0 2px 8px ${worker.color}55` }}>
                      {initials(worker.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{worker.name}</div>
                      <div style={{ fontSize: 12, color: C.textSec }}>{worker.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: worker.color, lineHeight: 1, letterSpacing: '-0.02em' }}><AnimatedNumber value={s.assigned} /></div>
                      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginTop: 3 }}>Coffins</div>
                    </div>
                  </div>

                  <div style={{ background: C.bgSub, height: 9, borderRadius: 6, overflow: 'hidden', marginBottom: 15 }}>
                    <div className="wa-progress" style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${worker.color}, ${worker.color}88)`, borderRadius: 6 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                    {[
                      { label: 'Completed', value: s.completed, color: C.success, dim: C.successDim },
                      { label: 'Active', value: s.active, color: C.warning, dim: C.warningDim },
                      { label: 'Hours', value: s.hours.toFixed(1), color: C.purple, dim: C.purpleDim },
                    ].map((it) => (
                      <div key={it.label} style={{ textAlign: 'center', padding: '11px 4px', background: it.dim, borderRadius: 10 }}>
                        <div style={{ fontSize: 19, fontWeight: 800, color: it.color, lineHeight: 1 }}>{it.value}</div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{it.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, fontSize: 11, color: C.textSec, background: C.bgSub, border: `1px solid ${C.borderLight}`, borderRadius: 9, padding: '7px 8px', textAlign: 'center' }}>
                      <b style={{ color: C.text, fontWeight: 800 }}>{s.month}</b> this mo
                    </div>
                    <div style={{ flex: 1, fontSize: 11, color: C.textSec, background: C.bgSub, border: `1px solid ${C.borderLight}`, borderRadius: 9, padding: '7px 8px', textAlign: 'center' }}>
                      <b style={{ color: C.text, fontWeight: 800 }}>{s.week}</b> this wk
                    </div>
                  </div>

                  <button onClick={() => deleteWorker(worker.id)} style={{ width: '100%', padding: '8px', borderRadius: 9, border: `1px solid ${C.dangerDim}`, background: '#FFFBFA', color: C.danger, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <i className="fas fa-trash" style={{ fontSize: 10, marginRight: 6 }} /> Remove Worker
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkerAnalytics;
