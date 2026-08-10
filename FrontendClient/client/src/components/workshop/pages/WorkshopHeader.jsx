import React from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
};

const WorkshopHeader = ({ connected, onRefresh }) => (
  <div style={{
    background: T.surface, borderBottom: `1px solid ${T.bdr}`,
    padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end',
    alignItems: 'center', gap: 12
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 8, background: connected ? T.successBg : T.dangerBg,
      color: connected ? T.success : T.danger, fontSize: 12, fontWeight: 600
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: connected ? T.success : T.danger,
        animation: connected ? 'pulse 2s infinite' : 'none'
      }} />
      {connected ? 'Connected' : 'Disconnected'}
    </div>
    <button onClick={onRefresh} className="btn" style={{ padding: '8px 16px' }}>
      <i className="fas fa-sync-alt" style={{ fontSize: 12 }} /> Refresh
    </button>
  </div>
);

export default WorkshopHeader;