import React, { useState } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

// Analytics is NOT a workshop tab any more — it lives inside the Operations
// dashboard (dashboard/ -> Workshop module). The workshop keeps the hands-on
// tabs only.
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'materials', label: 'Materials', icon: 'fa-boxes-stacked' },
  { id: 'store', label: 'Store', icon: 'fa-warehouse' },
];

const WorkshopTabs = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      display: 'flex', gap: 3, background: T.surface, border: `1px solid ${T.bdr}`,
      borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 16
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onTabChange(t.id)} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', border: 'none', background: activeTab === t.id ? T.primary : 'transparent',
          color: activeTab === t.id ? '#fff' : T.textSec, display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s', fontFamily: 'inherit'
        }}>
          <i className={`fas ${t.icon}`} style={{ fontSize: 12 }} />
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default WorkshopTabs;