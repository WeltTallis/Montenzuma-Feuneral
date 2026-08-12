import React, { useContext, useMemo, useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { Ctx } from './WorkshopDashboard';

Chart.register(...registerables);

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  warning: '#D97706', warningBg: '#FFFBEB',
  danger: '#DC2626', dangerBg: '#FEF2F2',
};

const PALETTE = ['#1E40AF', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777', '#EA580C', '#0D9488'];

// An order counts for a worker through its `assignedToName` (the last worker
// assigned to it, exposed by the orders endpoint). These stats are computed
// from REAL order data - no random/fake numbers.
const isFinishedStatus = (status) =>
  ['completed', 'delivered', 'cancelled', 'dispatched', 'collected'].includes(
    String(status || '').toLowerCase()
  );

const computeWorkerStats = (worker, orders) => {
  const wName = String(worker?.name || '').trim().toLowerCase();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const linked = (Array.isArray(orders) ? orders : []).filter(
    (o) => o && wName && String(o.assignedToName || '').trim().toLowerCase() === wName
  );

  return {
    allTime: linked.length,
    month: linked.filter((o) => o.createdAt && now - new Date(o.createdAt).getTime() <= 30 * DAY).length,
    week: linked.filter((o) => o.createdAt && now - new Date(o.createdAt).getTime() <= 7 * DAY).length,
    active: linked.filter((o) => !isFinishedStatus(o.status)).length,
  };
};

const WorkerAnalytics = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { workers = [], orders = [], setModal, deleteWorker } = ctx;

  const chartRef = useRef(null);

  const rows = useMemo(
    () =>
      (Array.isArray(workers) ? workers : []).map((w, i) => ({
        ...w,
        color: w.color || PALETTE[i % PALETTE.length],
        stats: computeWorkerStats(w, orders),
      })),
    [workers, orders]
  );

  useEffect(() => {
    const el = chartRef.current;
    if (!el || rows.length === 0) return undefined;
    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.name),
        datasets: [
          { label: 'All Time', data: rows.map((r) => r.stats.allTime), backgroundColor: 'rgba(30,64,175,0.75)', borderRadius: 4 },
          { label: '30 Days', data: rows.map((r) => r.stats.month), backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 },
          { label: '7 Days', data: rows.map((r) => r.stats.week), backgroundColor: 'rgba(217,119,6,0.75)', borderRadius: 4 },
          { label: 'Active Now', data: rows.map((r) => r.stats.active), backgroundColor: 'rgba(220,38,38,0.75)', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 14, font: { size: 11 }, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${c.parsed.y}`,
              title: (items) => items[0]?.label || '',
            },
          },
        },
        scales: {
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0, font: { size: 11 } },
            title: { display: true, text: 'Coffins / assignments', font: { size: 12, weight: '600' } },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [rows]);

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.bdr}`,
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-users-gear" style={{ color: T.primary, marginRight: 6 }} />
            Worker Analytics
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            {rows.length} worker{rows.length === 1 ? '' : 's'} · real output from orders
          </div>
        </div>
        <button
          onClick={() => setModal('createWorker')}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontWeight: 700 }}
        >
          <i className="fas fa-user-plus" style={{ fontSize: 11 }} /> Add New Worker
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: T.textMuted, border: `1px dashed ${T.bdr}`, borderRadius: 10 }}>
          <i className="fas fa-users" style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>No workers yet</div>
          <div style={{ fontSize: 12, marginBottom: 16 }}>Add your first worker to start tracking their output.</div>
          <button onClick={() => setModal('createWorker')} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
            <i className="fas fa-user-plus" style={{ fontSize: 11 }} /> Add New Worker
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 300, width: '100%', marginBottom: 18 }}>
            <canvas ref={chartRef} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {rows.map((worker) => (
              <div
                key={worker.id}
                style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 16, transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: '50%', background: worker.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0,
                    }}
                  >
                    {(worker.name || 'W').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{worker.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{worker.role}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    { label: 'All Time', value: worker.stats.allTime, color: T.primary },
                    { label: 'Month', value: worker.stats.month, color: T.success },
                    { label: 'Week', value: worker.stats.week, color: T.warning },
                    { label: 'Active', value: worker.stats.active, color: T.danger },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: 'center', padding: '10px 4px', background: T.bg, borderRadius: 7 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => deleteWorker(worker.id)}
                  style={{
                    width: '100%', padding: '7px', borderRadius: 6, border: `1px solid ${T.danger}`, background: T.dangerBg,
                    color: T.danger, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  }}
                >
                  <i className="fas fa-trash" style={{ fontSize: 9, marginRight: 4 }} /> Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkerAnalytics;

