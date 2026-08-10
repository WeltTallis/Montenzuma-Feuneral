import React, { useEffect, useState } from 'react';
import { fetchKpiCardsData } from '../../api/dashboardDataApi';

const Ic = ({ children, size = 17, color = "currentColor", sw = 2.8 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

// Visual template per card (icon, colours). Values/sub/footer come from the API.
const CARD_META = [
  {
    key: 'deceased', badge: null, badgeBg: null, badgeColor: null,
    iconBg: 'var(--color-blue)', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: 'var(--color-info-border)',
    icon: <Ic><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></Ic>,
  },
  {
    key: 'postmortem', badge: null, badgeBg: null, badgeColor: null,
    iconBg: 'var(--color-orange)', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: 'var(--color-warning-border)',
    icon: <Ic><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></Ic>,
  },
  {
    key: 'released', badge: null, badgeBg: null, badgeColor: null,
    iconBg: 'var(--color-green)', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    border: 'var(--color-success-border)',
    icon: <Ic><path d="m16 17 5-5-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></Ic>,
  },
  {
    key: 'hearses', badge: null, badgeBg: null, badgeColor: null,
    iconBg: '#0d9488', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    border: '#99f6e4',
    icon: <Ic size={16} sw={2.5}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Ic>,
  },
  {
    key: 'coffins', badge: null, badgeBg: null, badgeColor: null,
    iconBg: 'var(--color-red)', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: 'var(--color-danger-border)',
    icon: <Ic size={16} sw={2.5}><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12M3.29 7L12 12l8.71-5M7.5 4.27l9 5.15" /></Ic>,
  },
  {
    key: 'branches', badge: null, badgeBg: null, badgeColor: null,
    iconBg: 'var(--color-purple)', iconColor: '#FFFFFF',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    border: 'var(--color-purple-border)',
    icon: <Ic size={16} sw={2.5}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></Ic>,
  },
];
function KpiCard({ c }) {
  const isWarning = /critical/i.test(c.sub || '');
  const isOnline = /online/i.test(c.sub || '');

  return (
    <button style={{
      background: c.bg || 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      width: '100%', textAlign: 'left',
      border: `1px solid ${c.border || 'var(--color-border)'}`,
      cursor: 'pointer', fontFamily: 'var(--font-body)',
      transition: 'box-shadow .15s ease, border-color .15s ease, transform .1s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.10)';
        e.currentTarget.style.borderColor = c.border || 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = c.border || 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top: icon + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.iconColor,
        }}>
          {c.icon}
        </div>
        {c.badge && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: c.badgeBg, color: c.badgeColor, fontWeight: 500,
            lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {c.badge}
          </span>
        )}
      </div>

      {/* Value + Label */}
      <div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: 'var(--color-foreground)',
          fontFamily: 'var(--font-headings)', lineHeight: 1, letterSpacing: '-0.5px',
        }}>
          {c.value ?? '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', marginTop: 3 }}>
          {c.label}
        </div>
        {c.sub && (
          <div style={{
            fontSize: 11, color: isWarning ? 'var(--color-red)' : isOnline ? 'var(--color-green)' : 'var(--color-muted-foreground)',
            marginTop: 2, fontWeight: isWarning || isOnline ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.liveDot && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)',
                display: 'inline-block',
              }} />
            )}
            {c.onlineDot && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)',
                display: 'inline-block', boxShadow: '0 0 0 2px var(--color-green-light)',
              }} />
            )}
            {c.sub}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}>
        {c.footer}
      </div>
    </button>
  );
}

export default function KpiCards({ date }) {
  const [cards, setCards] = useState(null);

  // Independent KPI fetch for this component (date-driven).
  useEffect(() => {
    let mounted = true;
    fetchKpiCardsData(date)
      .then((data) => { if (mounted) setCards(data.cards || []); })
      .catch(() => { if (mounted) setCards([]); });
    return () => { mounted = false; };
  }, [date]);

  const rendered = CARD_META.map((meta) => {
    const value = (cards || []).find((v) => v.key === meta.key) || {};
    return { ...meta, value: value.value, label: value.label, sub: value.sub, footer: value.footer };
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 16,
      fontFamily: 'var(--font-body)',
      width: '100%',
    }}>
      {rendered.map((c, i) => (
        <KpiCard key={i} c={c} />
      ))}
    </div>
  );
}