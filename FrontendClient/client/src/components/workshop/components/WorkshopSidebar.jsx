// WorkshopSidebar.jsx
// Independent, self-contained side panel for the Workshop module.
// It does NOT depend on the global ModernSidebar — any page can render it
// and it toggles open/closed on its own. Nav items are gated by workshop
// role level (see utils/workshopRole.js):
//   - workshop / carpenter / workshop_technician → floor views (Orders, Materials)
//   - workshop_manager / admin / manager           → floor + Store + Workers
//
// Usage:
//   import WorkshopSidebar from './WorkshopSidebar';
//   <WorkshopSidebar open={open} onToggle={setOpen} role={userRole} />
import React, { useState, useCallback } from 'react';
import { isWorkshopManager, canAccessWorkshop } from '../../../utils/workshopRole';

// ─── Design tokens (mirrors WorkshopDashboard so the panel feels like one app) ──
const S = {
  panel: '#FFFFFF',
  bg: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  primary: '#1d4ed8',
  primaryBg: '#EFF6FF',
  danger: '#dc2626',
  shadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const WIDTH = 260;

// Icon → FontAwesome class (same icon set the rest of the workshop uses)
const ICONS = {
  orders: 'fa-clipboard-list',
  materials: 'fa-boxes-stacked',
  store: 'fa-warehouse',
  workers: 'fa-users',
  settings: 'fa-sliders',
};

const NAV_ITEMS = [
  { id: 'orders', label: 'Orders', icon: ICONS.orders, roles: ['workshop', 'carpenter', 'workshop_technician', 'workshop_manager', 'admin', 'manager'] },
  { id: 'materials', label: 'Materials', icon: ICONS.materials, roles: ['workshop', 'carpenter', 'workshop_technician', 'workshop_manager', 'admin', 'manager'] },
  { id: 'store', label: 'Store', icon: ICONS.store, roles: ['workshop_manager', 'admin', 'manager'] },
  { id: 'workers', label: 'Workers', icon: ICONS.workers, roles: ['workshop_manager', 'admin', 'manager'] },
  { id: 'settings', label: 'Settings', icon: ICONS.settings, roles: ['workshop_manager', 'admin', 'manager'] },
];

const itemStyle = (active, open) => ({
  display: 'flex',
  alignItems: 'center',
  gap: open ? 12 : 0,
  padding: open ? '10px 16px' : '12px',
  borderRadius: 10,
  background: active ? S.primaryBg : 'transparent',
  color: active ? S.primary : '#334155',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: S.font,
  cursor: 'pointer',
  border: 'none',
  textAlign: open ? 'left' : 'center',
  justifyContent: open ? 'flex-start' : 'center',
  width: open ? 'auto' : '100%',
  marginBottom: 6,
  transition: 'all 0.15s ease',
});

const WorkshopSidebar = ({ open = true, onToggle, role }) => {
  const [isOpen, setIsOpen] = useState(open);
  const userRole = (role || '').toLowerCase();
  const canEnter = canAccessWorkshop(userRole);
  const isManager = isWorkshopManager(userRole);

  const items = useCallback(() => {
    // Every nav item already lists 'admin' and 'manager' in its roles array, so
    // a single includes() check correctly admits floor staff to floor items and
    // managers/admins to everything (store, workers, settings).
    return NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof onToggle === 'function') onToggle(next);
      return next;
    });
  }, [onToggle]);

  // If the current user cannot access the workshop at all there is nothing to show.
  if (!canEnter) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: WIDTH,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: S.shadow,
        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOpen ? 'translateX(0)' : `translateX(-${WIDTH}px)`,
        fontFamily: S.font,
      }}
    >
      {/* Panel surface */}
      <aside
        style={{
          width: WIDTH,
          height: '100%',
          background: S.panel,
          borderRight: `1px solid ${S.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 56,
            borderBottom: `1px solid ${S.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'space-between' : 'center',
            padding: isOpen ? '0 16px' : 0,
            gap: 8,
          }}
        >
          <button
            onClick={handleToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              background: '#fff',
              cursor: 'pointer',
              color: '#334155',
              flexShrink: 0,
            }}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <i className={isOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'} style={{ fontSize: 14 }} />
          </button>
          {isOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Workshop</div>
              <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{userRole.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Staff'}</div>
            </div>
          )}
          {isOpen && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                borderRadius: 12,
                background: isManager ? '#ECFDF5' : '#EFF6FF',
                color: isManager ? '#059669' : '#1d4ed8',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <i className={isManager ? 'fa-shield-halved' : 'fa-hammer'} style={{ fontSize: 10 }} />
              {isManager ? 'Manager' : 'Floor'}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {items().map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (typeof onToggle === 'function') onToggle(false);
                window.dispatchEvent(new CustomEvent('ws:navigate', { detail: { tab: item.id } }));
              }}
              style={itemStyle(false, isOpen)}
              title={item.label}
            >
              {!isOpen && <i className={`fas ${item.icon}`} style={{ fontSize: 14 }} />}
              {isOpen && (
                <>
                  <i className={`fas ${item.icon}`} style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${S.border}`,
            marginTop: 'auto',
          }}
        >
          <button
            onClick={handleToggle}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              background: '#fff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: S.font,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: isOpen ? 10 : 0,
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ fontSize: 13, flexShrink: 0 }} />
            {isOpen && <span style={{ whiteSpace: 'nowrap' }}>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Scrim so the panel feels independent when opened over content */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            left: WIDTH,
            top: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.12)',
            zIndex: 55,
            backdropFilter: 'blur(2px)',
          }}
          onClick={handleToggle}
        />
      )}
    </div>
  );
};

export default WorkshopSidebar;
