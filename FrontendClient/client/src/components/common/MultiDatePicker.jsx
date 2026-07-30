import React, { useState, useMemo, useCallback } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

const MultiDatePicker = ({
  selectedDates = [],
  onDatesChange,
  minDate = null,
  maxDate = null,
  allowPast = false,
  allowOutsideMonth = false,
  showSelectedChips = true,
  height = 'auto',
}) => {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const todayStr = fmtDateStr(new Date());

  const navigateMonth = useCallback((dir) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setViewDate(new Date());
  }, []);

  const toggleDate = useCallback((dateStr) => {
    if (!onDatesChange) return;
    const isSelected = selectedDates.includes(dateStr);
    if (isSelected) {
      onDatesChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onDatesChange([...selectedDates, dateStr].sort());
    }
  }, [selectedDates, onDatesChange]);

  const isDateDisabled = useCallback((dateStr) => {
    const d = new Date(dateStr);
    if (!allowPast && dateStr < todayStr) return true;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  }, [allowPast, minDate, maxDate, todayStr]);

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(gridStart, i));
    }
    return days;
  }, [year, month]);

  return (
    <div style={styles.container}>
      {/* Selected Dates Info */}
      {showSelectedChips && (
        <div style={styles.selectedInfo}>
          <div style={styles.selectedCount}>
            {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
          </div>
          {selectedDates.length > 0 && (
            <div style={styles.selectedChips}>
              {selectedDates.map(dateStr => {
                const date = parseDate(dateStr);
                return (
                  <span key={dateStr} style={styles.chip}>
                    {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <button
                      style={styles.chipRemove}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDate(dateStr);
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Month Navigation */}
      <div style={styles.nav}>
        <button style={styles.navBtn} onClick={() => navigateMonth(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div style={styles.navTitle}>
          {MONTHS[month]} {year}
        </div>
        <button style={styles.navBtn} onClick={() => navigateMonth(1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Today Button */}
      <div style={styles.todayRow}>
        <button style={styles.todayBtn} onClick={goToToday}>Today</button>
      </div>

      {/* Weekday Headers */}
      <div style={styles.weekdays}>
        {WEEKDAYS.map(w => (
          <div key={w} style={styles.weekday}>{w}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div style={styles.daysGrid}>
        {calendarDays.map(day => {
          const dateStr = fmtDateStr(day);
          const outside = day.getMonth() !== month;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDates.includes(dateStr);
          const disabled = isDateDisabled(dateStr);

          if (outside && !allowOutsideMonth) {
            return <div key={dateStr} style={styles.emptyDay} />;
          }

          return (
            <div
              key={dateStr}
              style={styles.dayCell({
                outside,
                isToday,
                isSelected,
                disabled,
              })}
              onClick={() => {
                if (!disabled) {
                  if (outside && !allowOutsideMonth) return;
                  toggleDate(dateStr);
                }
              }}
            >
              <div style={styles.dayNum({ isToday, isSelected, disabled })}>
                {day.getDate()}
              </div>
              {isSelected && <div style={styles.checkmark}>✓</div>}
            </div>
          );
        })}
      </div>

      {/* Quick Select Row */}
      <div style={styles.quickRow}>
        <button
          style={styles.quickBtn}
          onClick={() => {
            if (!onDatesChange) return;
            const today = new Date();
            const str = fmtDateStr(today);
            if (!selectedDates.includes(str)) {
              onDatesChange([...selectedDates, str].sort());
            }
          }}
        >
          Today
        </button>
        <button
          style={styles.quickBtn}
          onClick={() => {
            if (!onDatesChange) return;
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const str = fmtDateStr(tomorrow);
            if (!selectedDates.includes(str)) {
              onDatesChange([...selectedDates, str].sort());
            }
          }}
        >
          Tomorrow
        </button>
        <button
          style={styles.quickBtn}
          onClick={() => {
            if (!onDatesChange) return;
            const mon = new Date();
            const dow = (mon.getDay() + 6) % 7;
            mon.setDate(mon.getDate() - dow);
            const dates = [];
            for (let i = 0; i < 7; i++) {
              const d = new Date(mon);
              d.setDate(d.getDate() + i);
              dates.push(fmtDateStr(d));
            }
            onDatesChange(dates);
          }}
        >
          This Week
        </button>
        <button
          style={styles.quickBtn}
          onClick={() => {
            if (!onDatesChange) return;
            const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
            const dates = [];
            for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
              dates.push(fmtDateStr(d));
            }
            onDatesChange(dates);
          }}
        >
          All Month
        </button>
        <button
          style={{ ...styles.quickBtn, color: '#ef4444' }}
          onClick={() => {
            if (onDatesChange) onDatesChange([]);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    color: '#0f172a',
    userSelect: 'none',
  },
  selectedInfo: {
    marginBottom: '16px',
    padding: '12px 16px',
    background: '#f1f5f9',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  selectedCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  selectedChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: '#ffffff',
    border: '1px solid #2E7D32',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2E7D32',
  },
  chipRemove: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: 'none',
    background: '#2E7D32',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  navBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  navTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a',
  },
  todayRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  todayBtn: {
    padding: '4px 14px',
    borderRadius: '8px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '11px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '8px',
  },
  weekday: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    padding: '6px 0',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  emptyDay: {
    aspectRatio: '1',
  },
  dayCell: ({ outside, isToday, isSelected, disabled }) => ({
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: isSelected
      ? '#2E7D32'
      : isToday
        ? 'rgba(46,125,50,.08)'
        : 'transparent',
    border: `1px solid ${
      isSelected ? '#2E7D32' : isToday ? '#2E7D32' : 'transparent'
    }`,
    opacity: disabled ? 0.3 : outside ? 0.4 : 1,
    transition: 'all .15s ease',
    position: 'relative',
  }),
  dayNum: ({ isToday, isSelected, disabled }) => ({
    fontSize: '14px',
    fontWeight: isSelected ? 700 : 600,
    color: isSelected ? '#ffffff' : disabled ? '#cbd5e1' : '#0f172a',
    position: 'relative',
  }),
  checkmark: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#ffffff',
    color: '#2E7D32',
    fontSize: '9px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #2E7D32',
  },
  quickRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  quickBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '11px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
};

export default MultiDatePicker;