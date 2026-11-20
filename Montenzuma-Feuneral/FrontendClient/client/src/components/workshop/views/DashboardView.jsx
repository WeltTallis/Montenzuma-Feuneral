import React, { useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { OrderCard } from '../components/OrderCard';
import { StageProgress } from '../components/StageProgress';
import { SearchBar } from '../components/SearchBar';
import { Users, Clock, ShieldAlert, DollarSign, PieChart as PieChartIcon } from 'lucide-react';

/* ============================================================================
   DashboardView — main dashboard with KPI stats + recent orders.
   ============================================================================ */
const DashboardView = ({ orders = [], workers = [], onOrderSelect, onOrderStatusChange, setOrderCardDeps }) => {
  // Initialize OrderCard deps
  useMemo(() => {
    if (setOrderCardDeps) setOrderCardDeps([], workers);
  }, [workers, setOrderCardDeps]);

  const totalCases = orders.length;
  const inCare = orders.filter((o) => o.stage !== 'store').length;
  const pmPending = orders.filter((o) => o.priority === 'rush').length;
  const storageAccrued = orders.reduce((sum, o) => sum + (o.progress || 0), 0);
  const occupancy = orders.length > 0 ? Math.round((inCare / orders.length) * 100) : 0;

  const kpis = [
    { icon: Users, label: 'Total Cases', value: totalCases, sub: 'All orders', color: '#1d4ed8', trend: 12, trendLabel: 'vs last week' },
    { icon: Clock, label: 'In Care', value: inCare, sub: 'Awaiting release', color: '#059669', trend: -5, trendLabel: 'vs last week' },
    { icon: ShieldAlert, label: 'PM Pending', value: pmPending, sub: 'Rush orders', color: '#d97706', trend: 8, trendLabel: 'vs last week' },
    { icon: DollarSign, label: 'Storage Accrued', value: storageAccrued.toFixed(0), sub: '% total progress', color: '#0284c7', trend: 18, trendLabel: 'vs last week' },
    { icon: PieChartIcon, label: 'Coffin Occupancy', value: occupancy + '%', sub: `${inCare} / ${orders.length}`, color: '#1e3a8a', trend: 3, trendLabel: 'vs last week' },
  ];

  const recentOrders = orders.slice(0, 4).map((o) => ({
    ...o,
    workers: o.workers || [],
    material: o.material || 'Wood',
    startedAt: o.startedAt || '—',
    elapsed: o.elapsed || '—',
    deadline: o.deadline || '—',
    progress: o.progress || 0,
  }));

  return (
    <div className="ec-dashboard-view">
      <div className="ec-dashboard-header">
        <div>
          <div className="ec-greeting-top">Hello, Workshop Manager!</div>
          <h1 className="ec-greeting-headline">
            You have <span className="ec-num">{totalCases}</span> coffin orders to be made today
          </h1>
        </div>
      </div>

      {/* KPI Band */}
      <div className="ec-kpi-band">
        <div className="ec-kpi-band-grid">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>
      </div>

      {/* Orders Section */}
      <div className="ec-orders-section">
        <div className="ec-orders-header">
          <h2 className="ec-orders-title">Recent Tasks</h2>
          <div className="ec-orders-tabs">
            <div className="ec-tab active" data-filter="all">Recently</div>
            <div className="ec-tab" data-filter="today">Today</div>
            <div className="ec-tab" data-filter="progress">In progress</div>
            <div className="ec-tab" data-filter="urgent">Urgent</div>
            <div className="ec-tab" data-filter="delivered">Delivered</div>
          </div>
        </div>
        <div className="ec-order-grid">
          {recentOrders.map((o) => (
            <OrderCard key={o.id} order={o} onSelect={onOrderSelect} onStatusChange={onOrderStatusChange} />
          ))}
          {recentOrders.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#999' }}>
              No orders to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
