import React from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF', primaryLight: '#93C5FD',
  success: '#059669', successBg: '#ECFDF5', successLight: '#6EE7B7',
  warning: '#D97706', warningBg: '#FFFBEB', warningLight: '#FCD34D',
  danger: '#DC2626', dangerBg: '#FEF2F2', dangerLight: '#FCA5A5',
  purple: '#7C3AED', purpleBg: '#F5F3FF', purpleLight: '#C4B5FD',
  cyan: '#0891B2', cyanBg: '#ECFEFF', cyanLight: '#67E8F9',
};

const StatCard = ({ label, value, icon, color, bg }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
      <i className={`fas ${icon}`} />
    </div>
  </div>
);

export default StatCard;