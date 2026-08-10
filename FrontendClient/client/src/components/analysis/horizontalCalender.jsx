import React, { useState, useRef, useEffect } from 'react';

const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dk(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toMonday(d) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - ((day + 6) % 7));
  return r;
}

export default function HorizontalCalendar({ eventsData = [], selectedDate, onDateSelect }) {
  const [viewStart, setViewStart] = useState(() => toMonday(new Date()));
  const stripRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(7);

  const eventCounts = React.useMemo(() => {
    const map = {};
    eventsData.forEach((ev) => {
      const key = dk(new Date(ev.date).getFullYear(), new Date(ev.date).getMonth(), new Date(ev.date).getDate());
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [eventsData]);

  const todayKey = dk(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 21; i++) {
      const d = addDays(viewStart, i);
      const key = dk(d.getFullYear(), d.getMonth(), d.getDate());
      arr.push({
        date: d,
        key,
        dayName: DOWS[(d.getDay() + 6) % 7],
        dayNum: d.getDate(),
        count: eventCounts[key] || 0,
        isToday: key === todayKey,
        isSelected: selectedDate != null && key === dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
      });
    }
    return arr;
  }, [viewStart, eventCounts, todayKey, selectedDate]);

  useEffect(() => {
    const targetKey = selectedDate
      ? dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : todayKey;
    const el = document.getElementById(`dc-${targetKey}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
    }
  }, [selectedDate, viewStart, todayKey, visibleCount]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => {
      const available = Math.max(el.clientWidth - 28, 40);
      const count = Math.max(1, Math.floor(available / 44));
      setVisibleCount(Math.min(count, 21));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const title = React.useMemo(() => {
    const s = addDays(viewStart, 0);
    const e = addDays(viewStart, 41);
    const sm = s.getMonth(), sy = s.getFullYear();
    const em = e.getMonth(), ey = e.getFullYear();
    if (sm === em && sy === ey) return `${MOS_SHORT[sm]} ${sy}`;
    if (sy === ey) return `${MOS_SHORT[sm]}–${MOS_SHORT[em]} ${sy}`;
    return `${MOS_SHORT[sm]} ${sy}–${MOS_SHORT[em]} ${ey}`;
  }, [viewStart]);

  const prevWeek = () => setViewStart((v) => addDays(v, -7));
  const nextWeek = () => setViewStart((v) => addDays(v, 7));
  const goToday = () => {
    const now = new Date();
    setViewStart(toMonday(now));
    if (onDateSelect) onDateSelect(now);
  };

  const pickDate = (date) => {
    if (onDateSelect) onDateSelect(date);
  };

  return (
    <div style={{
      background: 'transparent',
      borderRadius: 10,
      border: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      width: '100%',
      maxWidth: 2200,
      margin: '0 auto',
    }}>
      {/* Minimal Nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 10px 0',
      }}>
        <button
          onClick={prevWeek}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
          
            cursor: 'pointer',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'all 0.15s',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
        >
          ←
        </button>
        
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#111827',
          letterSpacing: '0.3px',
        }}>
          {title}
        </span>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={goToday}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
               

              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'all 0.15s',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'all 0.15s',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
          >
            →
          </button>
        </div>
      </div>

      {/* Compact Scrollable Strip */}
      <div
        ref={stripRef}
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          overflowX: 'hidden',
          overflowY: 'hidden',
          padding: '4px 0',
          gap: 4,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          minHeight: 80,
        }}
        className="ds-scroll-hide"
      >
        {days.slice(0, visibleCount).map((day) => {
          const { isToday, isSelected } = day;
          
          let bg = 'transparent';
          let border = '1.5px solid transparent';
          let shadow = 'none';
          let textColor = '#111827';
          let dayNameColor = '#9ca3af';
          let badgeBg = '#e5e7eb';
          let badgeColor = '#6b7280';

          if (isToday && !isSelected) {
            border = '1.5px solid #d80505';
            bg = 'transparent';
          }
          if (isSelected) {
            bg = 'rgb(244, 0, 0)';
    
            textColor = '#fff';
            dayNameColor = 'rgba(255,255,255,0.8)';
            badgeBg = 'rgba(255,255,255,0.2)';
            badgeColor = '#fff';
          }

          return (
            <button
              key={day.key}
              id={`dc-${day.key}`}
              onClick={() => pickDate(day.date)}
              style={{
                flex: '1 0 38px',
                padding: '6px 2px 4px',
                borderRadius: 8,
                border,
                background: bg,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: shadow,
                outline: 'none',
                position: 'relative',
                minWidth: 32,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isToday) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday ? 'transparent' : 'transparent';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <div style={{
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: dayNameColor,
                marginBottom: 2,
                opacity: isSelected ? 1 : 0.7,
              }}>
                {day.dayName}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: isSelected ? 700 : 600,
                color: textColor,
                lineHeight: 1.2,
              }}>
                {day.dayNum}
              </div>
              {day.count > 0 && (
                <div style={{
                  display: 'inline-block',
                  marginTop: 2,
                  fontSize: '7px',
                  fontWeight: 700,
                  padding: '0px 4px',
                  borderRadius: 3,
                  background: badgeBg,
                  color: badgeColor,
                  lineHeight: 1.5,
                  letterSpacing: '0.02em',
                }}>
                  {day.count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`.ds-scroll-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}