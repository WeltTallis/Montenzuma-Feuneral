import React from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-table-cells-large' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'floor', label: 'Production Floor', icon: 'fa-warehouse' },
  { id: 'store', label: 'Store', icon: 'fa-boxes-stacked' },
  { id: 'materials', label: 'Materials', icon: 'fa-cubes' },
  { id: 'deliveries', label: 'Deliveries', icon: 'fa-truck' },
  { id: 'reports', label: 'Reports', icon: 'fa-chart-line' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const WorkshopSidebar = ({ activeView, onSelect, isOpen, onClose, ordersCount = 0 }) => (
  <>
    {isOpen && (
      <button
        type="button"
        className="workshop-sidebar-backdrop"
        aria-label="Close workshop navigation"
        onClick={onClose}
      />
    )}
    <aside className={`workshop-sidebar${isOpen ? ' is-open' : ''}`} aria-label="Workshop navigation">
      <div className="workshop-brand">
        <span className="workshop-brand-mark">EC</span>
        <span className="workshop-brand-copy">
          <strong>Eternal Craft</strong>
          <small>Workshop</small>
        </span>
      </div>

      <nav className="workshop-nav">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button
            type="button"
            key={id}
            className={`workshop-nav-item${activeView === id ? ' is-active' : ''}`}
            aria-current={activeView === id ? 'page' : undefined}
            onClick={() => {
              onSelect(id);
              onClose();
            }}
          >
            <i className={`fas ${icon}`} aria-hidden="true" />
            <span>{label}</span>
            {id === 'orders' && ordersCount > 0 && (
              <span className="workshop-nav-badge">{ordersCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="workshop-sidebar-footer">
        <div className="workshop-workspace-label">WORKSPACE</div>
        <div className="workshop-workspace-card">
          <span className="workshop-workspace-avatar">EC</span>
          <span className="workshop-workspace-copy">
            <strong>Workshop</strong>
            <small>Production team</small>
          </span>
        </div>
      </div>
    </aside>
  </>
);

export { NAV_ITEMS };
export default WorkshopSidebar;
