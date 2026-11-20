import React from 'react';

// ─── Solid stat cards (matches Coffin Inventory "Modern SaaS" look) ───
const StatCard = ({ label, value, icon, color = '#1E40AF', sub }) => (
  <div style={{
    background: color,
    borderRadius: 12,
    padding: '20px',
    height: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255, 255, 255, 0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        <i className={`fas ${icon}`} />
      </div>
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
  </div>
);

export default StatCard;