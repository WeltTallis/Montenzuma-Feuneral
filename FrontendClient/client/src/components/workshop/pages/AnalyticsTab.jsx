import React, { useContext } from 'react';
import { Ctx } from './WorkshopDashboard';
import WorkerAnalytics from './WorkerAnalytics';

// Consolidated Production Analytics.
// A single, clean view of real per-worker output — summary stats, charts and
// per-worker count cards — computed from the actual orders/assignments. This
// replaces the old duplicated stat cards, leaderboard and avg-hours panels that
// showed inconsistent numbers.
const AnalyticsTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <WorkerAnalytics />
    </div>
  );
};

export default AnalyticsTab;
