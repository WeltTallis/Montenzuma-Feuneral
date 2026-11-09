import React from 'react';
import { money } from '../tokens';

/* 
   ReservationStatStrip  colored KPI cards for month stats.
   */
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function ReservationStatStrip({ stats }) {
  const items = [
    { l: 'This Month', v: stats.total, ic: <CalIcon />, bg: '#0284c7' },
    { l: 'Pending', v: stats.pending, ic: <AlertIcon />, bg: '#dc2626' },
    { l: 'Revenue', v: money(stats.revenue), ic: <MoneyIcon />, bg: '#16a34a' },
    { l: 'Today', v: stats.today, ic: <TrendIcon />, bg: '#0f766e' },
  ];
  return (
    <div className="cb-sr">
      {items.map((si) => (
        <div key={si.l} className="cb-sr-item" style={{ background: si.bg }}>
          <div className="cb-sr-ico">{si.ic}</div>
          <div className="cb-sr-info">
            <div className="cb-sr-num">{si.v}</div>
            <div className="cb-sr-label">{si.l}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReservationStatStrip;
