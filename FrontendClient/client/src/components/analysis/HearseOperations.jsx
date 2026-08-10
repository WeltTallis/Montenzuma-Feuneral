import React, { useState, useMemo, useEffect } from 'react';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

const STATUS = {
  'en-route': { label: 'En Route', color: 'var(--color-green)', bg: 'var(--color-green-light)', dot: 'live-dot-green' },
  'returning': { label: 'Returning', color: 'var(--color-blue)', bg: 'var(--color-blue-light)', dot: 'live-dot-green' },
  'idle': { label: 'Idle', color: 'var(--color-muted-foreground)', bg: 'var(--color-muted)', dot: '' },
  'maintenance': { label: 'Maintenance', color: 'var(--color-amber)', bg: 'var(--color-amber-light)', dot: 'live-dot-amber' },
  'delayed': { label: 'Delayed', color: 'var(--color-red)', bg: 'var(--color-red-light)', dot: 'live-dot-amber' },
};

const HEARSES = [
  { id: 'HR-001', plate: 'KBA 287J', driver: 'James Ochieng', ini: 'JO', status: 'en-route', progress: 68, from: 'Kenyatta NHIF Mortuary', to: 'Langata Cemetery', dep: '08:30 AM', eta: '09:45 AM', deceased: 'Wanjiku Kamau', caseId: 'CS-2024-1847', branch: 'Nairobi HQ', fuel: 72, dist: '14.2 km', phone: '+254 712 345 678' },
  { id: 'HR-002', plate: 'KCC 514M', driver: 'Peter Mwangi', ini: 'PM', status: 'en-route', progress: 34, from: 'Mama Lucy Hospital', to: 'Holy Cross Burial Ground', dep: '09:15 AM', eta: '10:30 AM', deceased: 'Otieno Odhiambo', caseId: 'CS-2024-1851', branch: 'Nairobi HQ', fuel: 55, dist: '22.8 km', phone: '+254 723 456 789' },
  { id: 'HR-003', plate: 'KDD 892K', driver: 'Samuel Kariuki', ini: 'SK', status: 'returning', progress: 85, from: '—', to: 'Nairobi HQ Depot', dep: '07:50 AM', eta: '09:10 AM', deceased: '—', caseId: 'CS-2024-1839', branch: 'Nairobi HQ', fuel: 38, dist: '8.5 km', phone: '+254 734 567 890' },
  { id: 'HR-004', plate: 'KBA 103L', driver: 'David Njoroge', ini: 'DN', status: 'delayed', progress: 22, from: 'Matter Hospital', to: 'Nairobi Memorial Park', dep: '08:00 AM', eta: 'Delayed +45min', deceased: 'Amina Hassan', caseId: 'CS-2024-1844', branch: 'Mombasa Rd', fuel: 61, dist: '19.6 km', phone: '+254 745 678 901', note: 'Heavy traffic on Mombasa Road' },
  { id: 'HR-005', plate: 'KEE 667N', driver: 'Grace Wambui', ini: 'GW', status: 'idle', progress: 0, from: '—', to: '—', dep: '—', eta: '—', deceased: '—', caseId: '—', branch: 'Nairobi HQ', fuel: 90, dist: '—', phone: '+254 756 789 012' },
  { id: 'HR-006', plate: 'KFF 321P', driver: 'Unassigned', ini: '—', status: 'maintenance', progress: 0, from: '—', to: '—', dep: '—', eta: '—', deceased: '—', caseId: '—', branch: 'Nairobi HQ', fuel: 45, dist: '—', phone: '—', note: 'Brake pad replacement – est. completion 2:00 PM' },
];

const FILTERS = ['all', 'en-route', 'returning', 'idle', 'delayed', 'maintenance'];
const isLive = (s) => s === 'en-route' || s === 'returning' || s === 'delayed';

function FuelGauge({ level }) {
  const c = level > 60 ? 'var(--color-green)' : level > 30 ? 'var(--color-amber)' : 'var(--color-red)';
  const filled = Math.round((level / 100) * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width: 4, height: 8 + i * 3, borderRadius: 1, background: i < filled ? c : 'var(--color-border)', transition: 'background .3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)', fontWeight: 500, minWidth: 28 }}>{level}%</span>
    </div>
  );
}

function ProgressBar({ pct, color, moving }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 4, borderRadius: 3, background: 'var(--color-muted)' }}>
      <div style={{ position: 'relative', height: '100%', borderRadius: 3, width: `${Math.max(pct, 0)}%`, background: color, transition: 'width .6s ease', overflow: 'hidden' }}>
        {moving && <div className="progress-shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 3 }} />}
      </div>
    </div>
  );
}

function HearseCard({ h, sel, onClick }) {
  const cfg = STATUS[h.status];
  const live = isLive(h.status);
  return (
    <div className="hearse-card" onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: `2px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)', padding: '12px 16px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, maxWidth: '100%',
        transition: 'box-shadow .2s ease, border-color .2s ease, transform .15s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {sel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-primary)' }} />}

      {/* Row 1: Vehicle icon + plate + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic size={16} color={cfg.color} sw={2.2}>
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
              <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
            </Ic>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.plate}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>{h.id}</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20,
          background: cfg.bg, fontSize: 10, fontWeight: 600, color: cfg.color, whiteSpace: 'nowrap', flexShrink: 0
        }}>
          <div className={cfg.dot} style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
          {cfg.label}
        </div>
      </div>

      {/* Row 2: Driver + Note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: h.status === 'maintenance' ? 'var(--color-muted)' : 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'var(--color-orange-foreground)', flexShrink: 0 }}>{h.ini}</div>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.driver}</span>
        {h.note && (
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: h.status === 'delayed' ? 'var(--color-red-light)' : 'var(--color-amber-light)', color: h.status === 'delayed' ? 'var(--color-red)' : 'var(--color-amber)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {h.note}
          </span>
        )}
      </div>

      {/* Row 3: Route (live only) or Status text */}
      {live ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ color: 'var(--color-muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.from}</span>
            <Ic size={10} color="var(--color-muted-foreground)" sw={2}><path d="M5 12h14m-7-7 7 7-7 7" /></Ic>
            <span style={{ color: 'var(--color-foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.to}</span>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: 'var(--color-muted-foreground)' }}>Progress</span>
              <span style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>{h.progress}%</span>
            </div>
            <ProgressBar pct={h.progress} color={cfg.color} moving={h.status !== 'delayed'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-muted-foreground)', marginTop: 2 }}>
              <span>{h.dist}</span>
              <span>{h.eta}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', padding: '4px 0', fontStyle: 'italic' }}>
          {h.status === 'idle' ? '🟢 Available for dispatch' : '🔧 Out of service'}
        </div>
      )}

      {/* Row 4: Fuel + Branch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
        <FuelGauge level={h.fuel} />
        <span style={{ fontSize: 9, color: 'var(--color-muted-foreground)' }}>{h.branch}</span>
      </div>
    </div>
  );
}

function DetailPanel({ h, onClose }) {
  if (!h) return null;
  const cfg = STATUS[h.status];
  const live = isLive(h.status);

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      border: '1px solid var(--color-border)', 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      maxHeight: '90vh'
    }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic size={16} color={cfg.color} sw={2.2}>
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
              <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
            </Ic>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{h.plate}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>{h.id}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-muted-foreground)' }}>
          <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}><path d="M18 6L6 18M6 6l12 12" /></Ic>
        </button>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 20, background: cfg.bg, fontSize: 10, fontWeight: 600, color: cfg.color }}>
          <div className={cfg.dot} style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
          {cfg.label}
        </div>

        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-orange-foreground)', flexShrink: 0 }}>{h.ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>{h.driver}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <Ic size={8} color="var(--color-muted-foreground)" sw={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Ic>
              {h.phone}
            </div>
          </div>
        </div>

        {live && (
          <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Case Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[{ l: 'Case ID', v: h.caseId, c: 'var(--color-primary)' }, { l: 'Deceased', v: h.deceased }, { l: 'Departure', v: h.dep }, { l: 'ETA', v: h.eta, c: h.status === 'delayed' ? 'var(--color-red)' : undefined }].map(x => (
                <div key={x.l}>
                  <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)', marginBottom: 1 }}>{x.l}</div>
                  <div style={{ fontSize: 11, fontWeight: x.c ? 600 : 500, color: x.c || 'var(--color-foreground)' }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {live && (
          <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Route</div>
            {[
              { icon: <Ic size={8} color="var(--color-green)" sw={3}><path d="M20 6L9 17l-5-5" /></Ic>, border: 'var(--color-green)', bg: 'var(--color-green-light)', title: 'Pickup', sub: h.from },
              { icon: <Ic size={8} color={h.progress > 50 ? 'var(--color-blue)' : 'var(--color-border)'} sw={3}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></Ic>, border: h.progress > 50 ? 'var(--color-blue)' : 'var(--color-border)', bg: h.progress > 50 ? 'var(--color-blue-light)' : 'var(--color-muted)', title: 'In Transit', sub: `${h.dist} remaining` },
              { icon: <Ic size={8} color="var(--color-border)" sw={3}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Ic>, border: 'var(--color-border)', bg: 'var(--color-muted)', title: 'Destination', sub: h.to },
            ].map((step) => (
              <div key={step.title} className="route-step" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.bg, border: `2px solid ${step.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-foreground)' }}>{step.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Info</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>Fuel Level</span>
            <FuelGauge level={h.fuel} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>Branch</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-foreground)' }}>{h.branch}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          {live && (
            <button style={{ flex: 1, padding: '7px 0', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Track Live</button>
          )}
          <button style={{ flex: 1, padding: '7px 0', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Contact Driver</button>
        </div>
      </div>
    </div>
  );
}

export default function LiveHearseOperations() {
  const [filter, setFilter] = useState('all');
  const [selId, setSelId] = useState('HR-001');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(iv);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    HEARSES.forEach(h => { c[h.status] = (c[h.status] || 0) + 1; });
    return c;
  }, []);

  const data = useMemo(() => HEARSES.map(h => {
    if (isLive(h.status) && h.progress < 98) return { ...h, progress: Math.min(h.progress + (tick % 3 === 0 ? 1 : 0), 98) };
    return h;
  }), [tick]);

  const filtered = useMemo(() => filter === 'all' ? data : data.filter(h => h.status === filter), [filter, data]);
  const selected = useMemo(() => data.find(h => h.id === selId) || null, [selId, data]);

  const summary = useMemo(() => {
    const active = data.filter(h => h.status === 'en-route' || h.status === 'returning').length;
    const delayed = data.filter(h => h.status === 'delayed').length;
    const idle = data.filter(h => h.status === 'idle').length;
    const maint = data.filter(h => h.status === 'maintenance').length;
    const lowFuel = data.filter(h => h.fuel < 40 && isLive(h.status)).length;
    return [
      { l: 'Active Trips', v: active, c: 'var(--color-green)', bg: 'var(--color-green-light)' },
      { l: 'Delayed', v: delayed, c: 'var(--color-red)', bg: 'var(--color-red-light)' },
      { l: 'Idle', v: idle, c: 'var(--color-muted-foreground)', bg: 'var(--color-muted)' },
      { l: 'Maintenance', v: maint, c: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
      { l: 'Low Fuel', v: lowFuel, c: 'var(--color-orange)', bg: 'var(--color-orange-light)' },
    ];
  }, [data]);

  return (
    <div style={{ background: 'var(--color-background)', padding: 'clamp(12px, 2vw, 24px)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', minHeight: 400, overflow: 'hidden', maxWidth: '100%', width: '100%' }}>
      {/* Summary - Horizontal */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`, gap: 10, marginBottom: 16, flexShrink: 0 }}>
        {summary.map(s => (
          <div key={s.l} style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: s.c, flexShrink: 0 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-foreground)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}>
            {f === 'all' ? 'All' : STATUS[f]?.label}
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, fontSize: 9, fontWeight: 600, background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--color-muted)', color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)', flexShrink: 0 }}>
              {f === 'all' ? data.length : (counts[f] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Hearse cards - uniform width, wrap on big screens, scroll on mobile */}
      <div className="hearse-cards-row" style={{ 
        display: 'flex',
        gap: 12,
        padding: '4px 4px 8px 4px',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {filtered.map(h => (
          <HearseCard key={h.id} h={h} sel={selId === h.id} onClick={() => setSelId(selId === h.id ? null : h.id)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ minWidth: '100%', padding: '48px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--color-muted-foreground)', fontWeight: 500 }}>No hearses matching this filter</div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {selId && selected && (
        <div onClick={() => setSelId(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 320,
            maxWidth: 400,
            maxHeight: '90vh',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            <DetailPanel h={selected} onClose={() => setSelId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}