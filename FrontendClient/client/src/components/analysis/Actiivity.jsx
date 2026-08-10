import React, { useState,     useEffect, useMemo } from 'react';




const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

/* ─── Activity types with color mapping ─── */
const TYPE_CFG = {
  'admit': { color: 'var(--color-green)', bg: 'var(--color-green-light)', icon: <Ic size={11} sw={2.5}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></Ic> },
  'release': { color: 'var(--color-blue)', bg: 'var(--color-blue-light)', icon: <Ic size={11} sw={2.5}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" /></Ic> },
  'dispatch': { color: 'var(--color-green)', bg: 'var(--color-green-light)', icon: <Ic size={11} sw={2.5}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Ic> },
  'return': { color: 'var(--color-blue)', bg: 'var(--color-blue-light)', icon: <Ic size={11} sw={2.5}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Ic> },
  'stock-low': { color: 'var(--color-orange)', bg: 'var(--color-orange-light)', icon: <Ic size={11} sw={2.5}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4m0 4h.01" /></Ic> },
  'request-approve': { color: 'var(--color-green)', bg: 'var(--color-green-light)', icon: <Ic size={11} sw={2.5}><path d="M20 6L9 17l-5-5" /></Ic> },
  'request-decline': { color: 'var(--color-red)', bg: 'var(--color-red-light)', icon: <Ic size={11} sw={2.5}><path d="M18 6L6 18M6 6l12 12" /></Ic> },
  'payment': { color: 'var(--color-green)', bg: 'var(--color-green-light)', icon: <Ic size={11} sw={2.5}><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></Ic> },
  'delay': { color: 'var(--color-red)', bg: 'var(--color-red-light)', icon: <Ic size={11} sw={2.5}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Ic> },
  'maintenance': { color: 'var(--color-amber)', bg: 'var(--color-amber-light)', icon: <Ic size={11} sw={2.5}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Ic> },
  'transfer': { color: 'var(--color-orange)', bg: 'var(--color-orange-light)', icon: <Ic size={11} sw={2.5}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></Ic> },
  'schedule': { color: 'var(--color-amber)', bg: 'var(--color-amber-light)', icon: <Ic size={11} sw={2.5}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Ic> },
};

const ACTIVITIES = [
  { type: 'admit', title: 'Deceased admitted', detail: 'John Mwangi — Nairobi HQ, Ward 3B', time: '6 min ago', branch: 'Nairobi HQ' },
  { type: 'dispatch', title: 'Hearse dispatched', detail: 'HR-002 to Holy Cross Burial Ground', time: '18 min ago', branch: 'Nairobi HQ' },
  { type: 'stock-low', title: 'Coffin stock low', detail: 'Pine Economy at Kisumu — 3 remaining', time: '42 min ago', branch: 'Kisumu' },
  { type: 'request-approve', title: 'Branch request approved', detail: 'REQ-4080 — 6× Oak Standard to Kisumu', time: '1 hr ago', branch: 'Nairobi HQ' },
  { type: 'delay', title: 'Hearse delayed', detail: 'HR-004 stuck in traffic — Mombasa Rd', time: '1.5 hrs ago', branch: 'Mombasa Rd' },
  { type: 'payment', title: 'Payment received', detail: 'KES 45,000 — Mahogany Premium, Nairobi', time: '2 hrs ago', branch: 'Nairobi HQ' },
  { type: 'release', title: 'Deceased released', detail: 'Mary Akinyi — collected by family', time: '2.5 hrs ago', branch: 'Nakuru' },
  { type: 'return', title: 'Hearse returned', detail: 'HR-003 back at Nairobi HQ depot', time: '3 hrs ago', branch: 'Nairobi HQ' },
  { type: 'transfer', title: 'Stock transfer initiated', detail: '10× Pine Economy — Nakuru → Mombasa', time: '4 hrs ago', branch: 'Nakuru' },
  { type: 'request-decline', title: 'Branch request declined', detail: 'REQ-4077 — Wicker Natural insufficient stock', time: '5 hrs ago', branch: 'Kisumu' },
  { type: 'maintenance', title: 'Vehicle maintenance started', detail: 'HR-006 — brake pad replacement', time: '6 hrs ago', branch: 'Nairobi HQ' },
  { type: 'schedule', title: 'Burial rescheduled', detail: 'Wanjiku Kamau moved to Aug 23 — family request', time: '8 hrs ago', branch: 'Nairobi HQ' },
  { type: 'admit', title: 'Deceased admitted', detail: 'Hassan Abdi — Mombasa branch, Ward 1', time: '9 hrs ago', branch: 'Mombasa' },
  { type: 'stock-low', title: 'Coffin stock critical', detail: 'Wicker Natural at Nakuru — 0 remaining', time: '10 hrs ago', branch: 'Nakuru' },
  { type: 'payment', title: 'Payment received', detail: 'KES 62,000 — Hardwood Deluxe, Mombasa', time: '11 hrs ago', branch: 'Mombasa' },
  { type: 'dispatch', title: 'Hearse dispatched', detail: 'HR-001 to Langata Cemetery', time: '12 hrs ago', branch: 'Nairobi HQ' },
];

const TIME_FILTERS = ['6h', '12h'];

function ActivityItem({ item, isLast }) {
  const cfg = TYPE_CFG[item.type];

  return (
    <div style={{
      display: 'flex', gap: 12,
      position: 'relative',
      paddingBottom: isLast ? 0 : 12,
    }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
        {/* Dot */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: cfg.bg, border: `2px solid ${cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cfg.color, position: 'relative', zIndex: 1,
          flexShrink: 0,
        }}>
          {cfg.icon}
        </div>
        {/* Line */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 8,
            background: 'var(--color-border)',
            marginTop: 2,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, minWidth: 0,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${cfg.color}`,
        transition: 'box-shadow .15s',
        cursor: 'pointer',
        marginBottom: isLast ? 0 : 0,
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 2, lineHeight: 1.3 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.detail}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{item.time}</span>
            <span style={{
              fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 3,
              background: 'var(--color-background)', color: 'var(--color-muted-foreground)',
              border: '1px solid var(--color-border)', whiteSpace: 'nowrap'
            }}>
              {item.branch}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySummary({ items }) {
  const stats = useMemo(() => {
    const s = { green: 0, red: 0, orange: 0, amber: 0, blue: 0 };
    items.forEach(a => {
      const c = TYPE_CFG[a.type]?.color;
      if (c === 'var(--color-green)') s.green++;
      else if (c === 'var(--color-red)') s.red++;
      else if (c === 'var(--color-orange)') s.orange++;
      else if (c === 'var(--color-amber)') s.amber++;
      else if (c === 'var(--color-blue)') s.blue++;
    });
    return s;
  }, [items]);

  const dots = [
    { count: stats.green, color: 'var(--color-green)', label: 'Completed' },
    { count: stats.red, color: 'var(--color-red)', label: 'Issues' },
    { count: stats.orange, color: 'var(--color-orange)', label: 'Warnings' },
    { count: stats.amber, color: 'var(--color-amber)', label: 'Pending' },
    { count: stats.blue, color: 'var(--color-blue)', label: 'Transit' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {dots.filter(d => d.count > 0).map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
          <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>
            <strong style={{ color: d.color, fontWeight: 700 }}>{d.count}</strong> {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RecentActivity() {
  const [timeFilter, setTimeFilter] = useState('12h');
  const [items, setItems] = useState(ACTIVITIES);
  const [tick, setTick] = useState(0);

  /* Simulate new activity appearing */
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (tick > 0) {
      const newItems = [
        { type: 'admit', title: 'Deceased admitted', detail: 'Peter Otieno — Mombasa, Ward 2A', time: 'Just now', branch: 'Mombasa' },
        { type: 'stock-low', title: 'Coffin stock low', detail: 'Oak Standard at Machakos — 2 remaining', time: 'Just now', branch: 'Machakos' },
        { type: 'dispatch', title: 'Hearse dispatched', detail: 'HR-005 to Langata Cemetery', time: 'Just now', branch: 'Nairobi HQ' },
        { type: 'payment', title: 'Payment received', detail: 'KES 12,000 — Pine Economy, Kisumu', time: 'Just now', branch: 'Kisumu' },
        { type: 'delay', title: 'Schedule conflict detected', detail: 'Two burials at same venue — Aug 23 10AM', time: 'Just now', branch: 'Nairobi HQ' },
      ];
      const pick = newItems[Math.floor(Math.random() * newItems.length)];
      setItems(prev => [pick, ...prev.slice(0, 19)]);
    }
  }, [tick]);

  const filtered = useMemo(() => {
    const hrs = timeFilter === '6h' ? 6 : 12;
    const hrMap = {
      'Just now': 0, '6 min ago': 0.1, '18 min ago': 0.3, '42 min ago': 0.7,
      '1 hr ago': 1, '1.5 hrs ago': 1.5, '2 hrs ago': 2, '2.5 hrs ago': 2.5,
      '3 hrs ago': 3, '4 hrs ago': 4, '5 hrs ago': 5, '6 hrs ago': 6,
      '8 hrs ago': 8, '9 hrs ago': 9, '10 hrs ago': 10, '11 hrs ago': 11, '12 hrs ago': 12,
    };
    return items.filter(a => (hrMap[a.time] ?? 99) <= hrs);
  }, [timeFilter, items]);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
      fontFamily: 'var(--font-body)',
      maxHeight: 520,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 3 }}>Recent Activity</div>
          <ActivitySummary items={filtered} />
        </div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {TIME_FILTERS.map(tf => (
            <button key={tf} onClick={() => setTimeFilter(tf)}
              style={{
                padding: '4px 12px', border: 'none',
                background: timeFilter === tf ? 'var(--color-primary)' : 'var(--color-surface)',
                color: timeFilter === tf ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                fontSize: 11, fontWeight: timeFilter === tf ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              Last {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Timeline list */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        paddingRight: 4,
      }}>
        {filtered.map((a, i) => (
          <ActivityItem key={`${a.title}-${a.time}-${i}`} item={a} isLast={i === filtered.length - 1} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)', fontWeight: 500 }}>No activity in this window</div>
          </div>
        )}
      </div>
    </div>
  );
}