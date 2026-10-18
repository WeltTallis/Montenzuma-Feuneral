import React from 'react';

const sections = [
  { id: 'orders', label: 'Orders' },
  { id: 'materials', label: 'Materials' },
  { id: 'store', label: 'Store' },
];

const WorkshopSidebar = ({ open, onToggle, activeTab, onSelect }) => {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close workshop navigation"
        onClick={() => onToggle(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1090,
          width: '100%',
          height: '100%',
          border: 0,
          background: 'rgba(15, 23, 42, 0.35)',
        }}
      />
      <aside
        aria-label="Workshop navigation"
        style={{
          position: 'fixed',
          inset: '0 0 0 auto',
          zIndex: 1091,
          width: 'min(280px, 85vw)',
          padding: 24,
          background: '#fff',
          boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <strong>Workshop</strong>
          <button type="button" onClick={() => onToggle(false)} aria-label="Close workshop navigation">
            Close
          </button>
        </div>
        <nav aria-label="Workshop sections" style={{ display: 'grid', gap: 8 }}>
          {sections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => {
                onSelect(id);
                onToggle(false);
              }}
              style={{
                padding: '12px 14px',
                border: 0,
                borderRadius: 8,
                background: activeTab === id ? '#eff6ff' : 'transparent',
                color: '#0f172a',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default WorkshopSidebar;
