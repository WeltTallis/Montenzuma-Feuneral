import React, { useState, useMemo } from 'react';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const MONTHLY = [
  { admitted: 32, released: 28, pending: 4 },
  { admitted: 29, released: 31, pending: 3 },
  { admitted: 38, released: 35, pending: 5 },
  { admitted: 41, released: 37, pending: 6 },
  { admitted: 36, released: 40, pending: 4 },
  { admitted: 44, released: 39, pending: 7 },
  { admitted: 39, released: 42, pending: 5 },
  { admitted: 22, released: 18, pending: 4 },
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const TIME_SLOTS = ['8A', '10A', '12P', '2P', '4P', '6P'];

const HEATMAP = [
  [2, 3, 4, 3, 2, 1],
  [1, 2, 3, 4, 3, 2],
  [3, 4, 4, 2, 1, 0],
  [2, 3, 4, 4, 3, 2],
  [4, 4, 3, 2, 1, 0],
  [1, 1, 2, 2, 1, 0],
  [0, 0, 1, 1, 0, 0],
];

const HEAT_COLORS = ['var(--color-muted)', 'var(--color-green-light)', 'var(--color-green)', 'var(--color-amber)', 'var(--color-orange)'];

const EVENTS_TODAY = [
  { label: 'Deceased records', count: 4, color: 'var(--color-blue)', bg: 'var(--color-blue-light)', icon: <Ic size={14} color="var(--color-blue)" sw={2.2}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></Ic> },
  { label: 'Hearse bookings', count: 2, color: 'var(--color-orange)', bg: 'var(--color-orange-light)', icon: <Ic size={14} color="var(--color-orange)" sw={2.2}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Ic> },
  { label: 'Coffin orders', count: 1, color: 'var(--color-purple)', bg: 'var(--color-purple-light)', icon: <Ic size={14} color="var(--color-purple)" sw={2.2}><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12M3.29 7L12 12l8.71-5" /></Ic> },
];

const CAL_START_DAY = 3;
const CAL_DAYS = 31;

/* ─── Stacked Bar Chart ─── */
function MonthlyChart({ selectedMonth, onSelectMonth }) {
  const maxVal = useMemo(() => Math.max(...MONTHLY.map(m => m.admitted + m.released + m.pending)), []);
  const barH = 172;

  const yLabels = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps }, (_, i) => Math.round(maxVal - (maxVal / (steps - 1)) * i));
  }, [maxVal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Admitted', color: 'var(--color-blue)' },
          { label: 'Released', color: 'var(--color-green)' },
          { label: 'Pending', color: 'var(--color-amber)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-muted-foreground)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative', paddingLeft: 35, paddingBottom: 22, minWidth: 0, overflow: 'hidden' }}>
        {/* Y-axis gridlines */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 22, width: 35, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', flexShrink: 0 }}>
          {yLabels.map((v, i) => (
            <div key={i} style={{ fontSize: 9, color: 'var(--color-muted-foreground)', textAlign: 'right', lineHeight: '1', paddingRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v}
            </div>
          ))}
        </div>

        {/* Grid lines + bars area */}
        <div style={{ flex: 1, position: 'relative', height: barH, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          {/* Horizontal grid lines */}
          {yLabels.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'var(--color-border)', top: `${(i / (yLabels.length - 1)) * 100}%`, pointerEvents: 'none' }} />
          ))}

          {/* Bars row */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 4, height: '100%', alignItems: 'flex-end', minWidth: 0 }}>
            {MONTHLY.map((m, i) => {
              const hAdmitted = (m.admitted / maxVal) * barH;
              const hReleased = (m.released / maxVal) * barH;
              const hPending = (m.pending / maxVal) * barH;
              const isSel = selectedMonth === i;

              return (
                <div
                  key={i}
                  onClick={() => onSelectMonth(i)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer', position: 'relative', height: '100%', justifyContent: 'flex-end', minWidth: 0
                  }}
                >
                  {/* Tooltip */}
                  {isSel && (
                    <div style={{
                      position: 'absolute', bottom: '100%', marginBottom: 8, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--color-foreground)', color: 'var(--color-surface)', padding: '8px 12px',
                      borderRadius: 'var(--radius-md)', fontSize: 10, whiteSpace: 'nowrap', zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 11 }}>{MONTHS[i]} 2024</div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                        <span>{m.admitted} admitted</span>
                        <span>{m.released} released</span>
                        <span>{m.pending} pending</span>
                      </div>
                      <div style={{
                        position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                        width: 8, height: 8, background: 'var(--color-foreground)'
                      }} />
                    </div>
                  )}

                  {/* Stacked bar container */}
                  <div style={{
                    width: '100%', maxWidth: 40, minWidth: 16, borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', transition: 'opacity .15s',
                    opacity: isSel ? 1 : 0.6,
                    border: isSel ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                    background: 'var(--color-surface)',
                    alignSelf: 'flex-end',
                  }}>
                    <div style={{ height: hPending, background: 'var(--color-amber)', transition: 'height .4s ease' }} />
                    <div style={{ height: hReleased, background: 'var(--color-green)', transition: 'height .4s ease' }} />
                    <div style={{ height: hAdmitted, background: 'var(--color-blue)', transition: 'height .4s ease' }} />
                  </div>

                  {/* Month label */}
                  <div style={{
                    fontSize: 10, color: isSel ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                    fontWeight: isSel ? 600 : 400, marginTop: 6, transition: 'color .15s', flexShrink: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
                  }}>
                    {MONTHS[i]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar ─── */
function Calendar() {
  const today = 21;
  const eventDays = [3, 7, 12, 15, 18, 21, 24, 28];

  const cells = [];
  for (let i = 0; i < CAL_START_DAY; i++) cells.push(null);
  for (let d = 1; d <= CAL_DAYS; d++) cells.push(d);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', whiteSpace: 'nowrap' }}>August 2024</span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-muted-foreground)', flexShrink: 0 }}>
            <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}><path d="m15 18-6-6 6-6" /></Ic>
          </button>
          <button style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-muted-foreground)', flexShrink: 0 }}>
            <Ic size={12} color="var(--color-muted-foreground)" sw={2.5}><path d="m9 18 6-6-6-6" /></Ic>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 2 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--color-muted-foreground)', padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.3px', overflow: 'hidden' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {cells.map((day, i) => {
          const isToday = day === today;
          const hasEvent = day && eventDays.includes(day);
          const isWeekend = (i % 7 === 5) || (i % 7 === 6);

          let bg = 'transparent';
          if (isToday) bg = 'var(--color-primary)';
          else if (hasEvent) bg = 'var(--color-blue-light)';

          return (
            <div key={i} style={{
              height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', fontSize: 10, cursor: day ? 'pointer' : 'default',
              color: isToday ? 'var(--color-primary-foreground)' : isWeekend ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
              fontWeight: isToday ? 700 : 400,
              position: 'relative', transition: 'background .12s',
              background: bg,
              border: hasEvent && !isToday ? '1px solid var(--color-border)' : '1px solid transparent',
              overflow: 'hidden'
            }}>
              {day || ''}
              {hasEvent && !isToday && (
                <div style={{
                  position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%', background: 'var(--color-blue)'
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Events Today ─── */
function EventsToday() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {EVENTS_TODAY.map(e => (
        <div key={e.label} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s'
        }}
          onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; ev.currentTarget.style.borderColor = 'var(--color-primary)'; }}
          onMouseLeave={ev => { ev.currentTarget.style.boxShadow = 'none'; ev.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: e.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {e.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-foreground)' }}>{e.label}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: e.color, fontFamily: "'Inter', sans-serif" }}>
            {e.count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Weekly Activity Heatmap ─── */
function WeeklyActivity() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Time slot headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(6, 1fr)', gap: 2, marginBottom: 4 }}>
        <div />
        {TIME_SLOTS.map(t => (
          <div key={t} style={{ textAlign: 'center', fontSize: 9, fontWeight: 500, color: 'var(--color-muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t}
          </div>
        ))}
      </div>

      {/* Heatmap rows */}
      {HEATMAP.map((row, di) => (
        <div key={di} style={{ display: 'grid', gridTemplateColumns: '24px repeat(6, 1fr)', gap: 2, marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'var(--color-muted-foreground)', overflow: 'hidden' }}>
            {DAY_LABELS[di]}
          </div>
          {row.map((val, ti) => (
            <div key={ti} style={{
              height: 24, borderRadius: 'var(--radius-sm)',
              background: HEAT_COLORS[val],
              transition: 'transform .1s, box-shadow .1s',
              cursor: 'pointer',
              border: '1px solid transparent',
              minWidth: 0
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 2; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 0; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
              title={`${DAY_LABELS[di]} ${TIME_SLOTS[ti]} — ${['None', 'Low', 'Medium', 'High', 'Peak'][val]} activity`}
            />
          ))}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: 'var(--color-muted-foreground)', marginRight: 3 }}>Low</span>
        {HEAT_COLORS.map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid var(--color-border)', flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--color-muted-foreground)', marginLeft: 3 }}>High</span>
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, subtitle, children, style }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column',
      ...style
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: subtitle ? 2 : 0, fontFamily: 'var(--font-headings)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── Main Export ─── */
export default function DeceasedIntakeRelease() {
  const [selectedMonth, setSelectedMonth] = useState(7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-body)' }}>
      {/* Top row: Chart + Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <SectionCard
          title="Monthly overview — click a bar to see records"
          style={{ minHeight: 280, minWidth: 0 }}
        >
          <MonthlyChart selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
        </SectionCard>

        <SectionCard title="August 2024" style={{ minWidth: 0 }}>
          <Calendar />
        </SectionCard>
      </div>

      {/* Bottom row: Events + Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <SectionCard
          title="Events today"
          subtitle="4 deceased records · 2 hearse bookings · 1 coffin order"
          style={{ minWidth: 0 }}
        >
          <EventsToday />
        </SectionCard>

        <SectionCard
          title="Weekly Activity"
          subtitle="All events, this week"
          style={{ minWidth: 0 }}
        >
          <WeeklyActivity />
        </SectionCard>
      </div>
    </div>
  );
}