import React from 'react';
import { STAGES } from '../data/stages';

/* ============================================================================
   Sidebar — left navigation rail with logo, nav items, workspace card, and CTA.
   ============================================================================ */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'floor', label: 'Production Floor', icon: 'fa-warehouse' },
  { id: 'materials', label: 'Materials', icon: 'fa-boxes-stacked' },
  { id: 'store', label: 'Store', icon: 'fa-cube' },
  { id: 'deliveries', label: 'Deliveries', icon: 'fa-truck' },
  { id: 'reports', label: 'Reports', icon: 'fa-chart-line' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const Sidebar = ({ activeView, onViewChange, user, toggleSidebar }) => {
  return (
    <div className="ec-sidebar-inner">
      {/* Logo */}
      <div className="ec-sidebar-logo">
        <div className="ec-logo-mark">EC</div>
        <div className="ec-sidebar-brand">
          <div className="ec-brand-name">Eternal Craft</div>
          <div className="ec-brand-sub">Workshop</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="ec-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`ec-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <i className={`fas ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Workspace card */}
      <div className="ec-workspace-card">
        <div className="ec-workspace-avatar">{user?.initials || 'EC'}</div>
        <div className="ec-workspace-info">
          <div className="ec-workspace-name">{user?.name || 'Eternal Craft Co.'}</div>
          <div className="ec-workspace-sub">{user?.branch || 'Main Branch'}</div>
        </div>
        <svg className="ec-workspace-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* CTA */}
      <button className="ec-visit-site" onClick={toggleSidebar}>
        Visit site
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;
