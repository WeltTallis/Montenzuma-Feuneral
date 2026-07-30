import React, { useRef, useEffect, useContext } from 'react';
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

const STAGES = [
  { name: 'Building', icon: 'fa-hammer', color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Waiting Bay', icon: 'fa-clock', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Painting', icon: 'fa-paint-roller', color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Interior', icon: 'fa-couch', color: '#0891B2', bg: '#ECFEFF' },
  { name: 'Store', icon: 'fa-warehouse', color: '#059669', bg: '#ECFDF5' },
];

const AnalyticsTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { orders, workers, reports } = ctx;
  const canvasRef = useRef(null);
  const canvasRef2 = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !reports) return;
    const monthlyData = Array.isArray(reports.monthly_orders) ? reports.monthly_orders : [];
    if (monthlyData.length === 0) return;
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: monthlyData.map(m => `${m.month}/${m.year}`),
        datasets: [{
          label: 'Orders',
          data: monthlyData.map(m => m.total_orders),
          backgroundColor: T.primary,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
    return () => chart.destroy();
  }, [reports]);

  useEffect(() => {
    if (!canvasRef2.current || !reports) return;
    const stageData = Array.isArray(reports.stage_distribution) ? reports.stage_distribution : [];
    if (stageData.length === 0) return;
    const chart = new Chart(canvasRef2.current, {
      type: 'doughnut',
      data: {
        labels: stageData.map(s => s.stage),
        datasets: [{
          data: stageData.map(s => s.total),
          backgroundColor: STAGES.map(s => s.color),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
      },
    });
    return () => chart.destroy();
  }, [reports]);

  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon="fa-chart-line" color={T.success} bg={T.successBg} />
        <StatCard label="Total Cost" value={`KES ${totalCost.toLocaleString()}`} icon="fa-coins" color={T.danger} bg={T.dangerBg} />
        <StatCard label="Profit" value={`KES ${totalProfit.toLocaleString()}`} icon="fa-sack-dollar" color={T.purple} bg={T.purpleBg} />
        <StatCard label="Completed" value={completedOrders} icon="fa-check-circle" color={T.cyan} bg={T.cyanBg} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 16, height: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Monthly Orders</div>
          <div style={{ height: 240 }}>
            <canvas ref={canvasRef} />
          </div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 16, height: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Stage Distribution</div>
          <div style={{ height: 240 }}>
            <canvas ref={canvasRef2} />
          </div>
        </div>
      </div>

      {Array.isArray(reports?.worker_performance) && (
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Worker Performance</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.bdr}`, background: T.bg }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Worker</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Assignments</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Hours</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Avg/Job</th>
                </tr>
              </thead>
              <tbody>
                {reports.worker_performance.map(w => (
                  <tr key={w.user_id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.text }}>{w.full_name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: T.textSec }}>{w.total_assignments}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: T.textSec }}>{parseFloat(w.total_hours).toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: T.textSec }}>{parseFloat(w.avg_hours_per_task).toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
