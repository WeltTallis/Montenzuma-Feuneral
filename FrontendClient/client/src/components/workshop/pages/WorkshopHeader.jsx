import React, { useContext } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  primary: '#1E40AF',
};

const WorkshopHeader = ({ connected, onRefresh }) => (
  <div style={{
    background: T.surface, borderBottom: `1px solid ${T.bdr}`,
    padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 12
  }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fas fa-industry" style={{ color: T.primary }} />
        Workshop Dashboard
      </h1>
      <p style={{ fontSize: 13, color: T.textSec, margin: '4px 0 0' }}>Coffin production pipeline, team analytics & material tracking</p>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
  </div>
);

export default WorkshopHeader;