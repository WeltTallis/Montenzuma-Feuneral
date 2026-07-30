import React, { useContext } from 'react';

const T = {
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  surface: '#FFFFFF', bdr: '#E2E8F0', text: '#0F172A',
};

const Toasts = ({ toasts }) => {
  if (!toasts || !toasts.length) return null;

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const colors = { success: T.success, error: T.danger, info: T.primary };
  const bgs = { success: T.successBg, error: T.dangerBg, info: T.primaryBg };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px', borderRadius: 9, background: bgs[t.type] || T.surface,
          border: `1px solid ${colors[t.type] || T.bdr}`, color: colors[t.type] || T.text,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideIn 0.3s ease-out', fontSize: 13, fontWeight: 600
        }}>
          <i className={`fas ${icons[t.type] || 'fa-info-circle'}`} style={{ fontSize: 16 }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
};

export default Toasts;