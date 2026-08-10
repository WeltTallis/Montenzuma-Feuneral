import React, { useRef, useEffect, useState, useContext } from 'react';
import { Chart, registerables } from 'chart.js';
import { Ctx } from './WorkshopDashboard';
import StatCard from './StatCard';
Chart.register(...registerables);

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
  cyan: '#0891B2', cyanBg: '#ECFEFF',
};

const PALETTE = ['#1E40AF', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777', '#EA580C', '#0D9488', '#4F46E5', '#BE185D'];

const fmtMonth = (m) => {
  if (!m) return '';
  const p = m.split('-');
  return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

const AnalyticsTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { orders = [], workers = [], reports } = ctx;

  const prodRef = useRef(null);
  const leadRef = useRef(null);
  const durRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState('all');

  // ─── Aggregate per-worker production from completed assignments ─────
  const workerMap = {};
  workers.forEach(w => {
    workerMap[w.id] = { id: w.id, name: w.name || `Worker #${w.id}`, role: w.role || '', color: w.color || '#94A3B8', monthly: {}, total: 0, hours: 0, stages: {} };
  });
  orders.forEach(o => {
    (o.assignments || []).forEach(a => {
      const wid = a.user_id ?? a.userId ?? a.worker_id;
      const done = a.completed_at || a.completedAt;
      if (wid == null || !done) return;
      const d = new Date(done);
      if (isNaN(d.getTime())) return;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!workerMap[wid]) workerMap[wid] = { id: wid, name: `Worker #${wid}`, role: '', color: '#94A3B8', monthly: {}, total: 0, hours: 0, stages: {} };
      const w = workerMap[wid];
      w.monthly[month] = (w.monthly[month] || 0) + 1;
      w.total += 1;
      w.hours += parseFloat(a.hours_worked) || 0;
      const stage = a.stage || 'General';
      w.stages[stage] = (w.stages[stage] || 0) + 1;
    });
  });

  const stats = Object.values(workerMap)
    .map((w, i) => ({
      id: w.id,
      name: w.name,
      role: w.role,
      color: w.color === '#94A3B8' ? PALETTE[i % PALETTE.length] : w.color,
      monthly: w.monthly,
      total: w.total,
      hours: w.hours,
      avg: w.total > 0 ? w.hours / w.total : 0,
      stages: w.stages,
    }))
    .sort((a, b) => b.total - a.total || a.avg - b.avg);

  const allMonths = [...new Set(stats.flatMap(w => Object.keys(w.monthly)))].sort();
  const maxTotal = stats.length ? Math.max(...stats.map(w => w.total), 1) : 1;
  const totalProduced = stats.reduce((s, w) => s + w.total, 0);
  const topWorker = stats.length ? stats[0] : null;
  const teamAvg = totalProduced > 0 ? stats.reduce((s, w) => s + w.hours, 0) / totalProduced : 0;
  // Chart 1 — coffins produced per worker per month
  useEffect(() => {
    if (!prodRef.current) return;
    let chart;
    if (selectedMonth === 'all') {
      if (allMonths.length === 0) return;
      chart = new Chart(prodRef.current, {
        type: 'line',
        data: {
          labels: allMonths.map(fmtMonth),
          datasets: stats.map(w => ({
            label: w.name,
            data: allMonths.map(m => w.monthly[m] || 0),
            borderColor: w.color,
            backgroundColor: w.color,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
            tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y} coffin(s)` } },
          },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
        },
      });
    } else {
      chart = new Chart(prodRef.current, {
        type: 'bar',
        data: {
          labels: stats.map(w => w.name),
          datasets: [{
            label: `Coffins produced · ${fmtMonth(selectedMonth)}`,
            data: stats.map(w => w.monthly[selectedMonth] || 0),
            backgroundColor: stats.map(w => w.color),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => `${c.parsed.x} coffin(s)` } },
          },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
        },
      });
    }
    return () => chart && chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, orders, workers]);

  // Chart 2 — leaderboard doughnut (top 8 by total produced)
  useEffect(() => {
    if (!leadRef.current) return;
    const top = stats.slice(0, 8);
    if (top.length === 0 || top.every(w => w.total === 0)) return;
    const chart = new Chart(leadRef.current, {
      type: 'doughnut',
      data: {
        labels: top.map(w => w.name),
        datasets: [{
          data: top.map(w => w.total),
          backgroundColor: top.map(w => w.color),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed} coffin(s)` } },
        },
      },
    });
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, workers]);

  // Chart 3 — average duration (hours per coffin) per worker
  useEffect(() => {
    if (!durRef.current) return;
    const list = stats.filter(w => w.total > 0).slice(0, 10);
    if (list.length === 0) return;
    const chart = new Chart(durRef.current, {
      type: 'bar',
      data: {
        labels: list.map(w => w.name),
        datasets: [{
          label: 'Avg hours / coffin',
          data: list.map(w => +w.avg.toFixed(1)),
          backgroundColor: list.map(w => w.color),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.parsed.x} hrs / coffin` } },
        },
        scales: { x: { beginAtZero: true } },
      },
    });
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, workers]);

  // ─── Small reusable chart panel ──────────────────────────────────────
  const Card = ({ title, icon, hint, children }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primaryBg, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            <i className={`fas ${icon}`} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{title}</div>
            {hint && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{hint}</div>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header + month filter */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 14, padding: '16px 20px',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>
            <i className="fas fa-chart-line" style={{ color: T.primary, marginRight: 10 }} />Production Analytics
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            Coffin production performance across the workshop
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec }}>Month</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px 12px', border: `1px solid ${T.bdr}`, borderRadius: 8,
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: T.surface,
              color: T.text, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">All time</option>
            {allMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
          </select>
        </div>
      </div>

      {/* KPI stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatCard label="Total Produced" value={totalProduced} icon="fa-boxes-stacked" color="#1E40AF" sub={`Across ${stats.length} worker${stats.length === 1 ? '' : 's'}`} />
        <StatCard label="Top Worker" value={topWorker ? topWorker.name : '—'} icon="fa-trophy" color="#7C3AED" sub={topWorker ? `${topWorker.total} coffin${topWorker.total === 1 ? '' : 's'}` : 'No data yet'} />
        <StatCard label="Avg Hours / Coffin" value={isFinite(teamAvg) ? teamAvg.toFixed(1) : '—'} icon="fa-clock" color="#0891B2" sub="Team average" />
        <StatCard label="Coffins / Worker" value={stats.length ? Math.round(totalProduced / stats.length) : 0} icon="fa-users" color="#059669" sub="Overall average" />
      </div>

      {totalProduced === 0 ? (
        <div style={{
          background: T.surface, border: `1px dashed ${T.bdr}`, borderRadius: 14,
          padding: '48px 20px', textAlign: 'center', color: T.textMuted,
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>No production data yet</div>
          <div style={{ fontSize: 13 }}>Completed assignments will appear here once workers finish coffins.</div>
        </div>
      ) : (
        <>
          {/* Chart 1 (production trend/distribution) + Chart 2 (leaderboard) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <Card
              title={selectedMonth === 'all' ? 'Coffins produced per worker' : `Coffins produced · ${fmtMonth(selectedMonth)}`}
              icon="fa-chart-line"
              hint={selectedMonth === 'all' ? 'Trend of completed coffins, per worker, per month' : 'Distribution of completed coffins in the selected month'}
            >
              <div ref={prodRef} style={{ height: 300, width: '100%' }} />
            </Card>
            <Card title="Leaderboard" icon="fa-ranking-star" hint="Top 8 workers by total output">
              <div ref={leadRef} style={{ height: 300, width: '100%' }} />
            </Card>
          </div>

          {/* Chart 3 (Average time per coffin) */}
          <Card title="Average time per coffin" icon="fa-hourglass-half" hint="Avg hours per coffin, per worker (top 10 by output)">
            <div ref={durRef} style={{ height: 280, width: '100%' }} />
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;