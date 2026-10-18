import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isSameMonth, isToday } from 'date-fns';
import { getStatusStyle, parseHour, fmtTime12, fmtHour, fmtMDY } from '../tokens';

/* ============================================================================
   ReservationCalendar — day/week time grid with untimed lane.
   ============================================================================ */
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [];
for (let h = 6; h < 22; h++) HOURS.push(h);

export function ReservationCalendar({ view, sel, visible, viewMonth, viewYear, clickedDay, onPick, onPickDay, onClearDay }) {
  const isWeek = view === 'week';
  const days = isWeek
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(sel, { weekStartsOn: 1 }), i))
    : [sel];
  const cols = days.length;

  const buckets = new Map();
  days.forEach((d) => buckets.set(format(d, 'yyyy-MM-dd'), { d, untimed: [], rows: new Map() }));
  visible.forEach((b) => {
    const k = format(b.date, 'yyyy-MM-dd');
    if (!buckets.has(k)) return;
    const bucket = buckets.get(k);
    const h = parseHour(b.time);
    if (h === null) { bucket.untimed.push(b); return; }
    const row = Math.max(6, Math.min(21, Math.floor(h)));
    if (!bucket.rows.has(row)) bucket.rows.set(row, []);
    bucket.rows.get(row).push(b);
  });

  const untimedAll = days.flatMap((d) => buckets.get(format(d, 'yyyy-MM-dd')).untimed);
  const total = visible.length;

  const headCols = days.map((d) => {
    const cls = `cb-grid-day-head ${isToday(d) ? 'today' : ''} ${isSameDay(d, sel) ? 'sel' : ''} ${!isSameMonth(d, new Date(viewYear, viewMonth, 1)) ? 'other' : ''}`;
    return (
      <div
        key={format(d, 'yyyy-MM-dd')}
        className={cls}
        onClick={() => onPickDay(d)}
        title={`Jump to ${format(d, 'MMMM d, yyyy')}`}
      >
        <span className="dow">{DOW_SHORT[d.getDay()]}</span>
        <span className="dom">{d.getDate()}</span>
      </div>
    );
  }).join('');

  const colsStyle = { '--cols': cols };

  const renderChip = (b) => {
    const st = getStatusStyle(b);
    return (
      <button
        key={b.id}
        className="cb-chip"
        style={{ '--chip-c': st.color }}
        onClick={() => onPick(b)}
        title={`${b.clientName} · ${st.label}`}
      >
        {b.time ? <span className="t">{fmtTime12(b.time)}</span> : null}
        <span className="n">{b.clientName}</span>
        <span className="m">{b.coffinType}</span>
      </button>
    );
  };

  let body;
  if (total === 0) {
    body = (
      <div className="cb-grid-empty">
        No coffin reservations for {isWeek ? 'this week' : fmtMDY(sel)}.
      </div>
    );
  } else {
    const rows = [];
    if (untimedAll.length > 0) {
      rows.push(
        <div key="untimed-time" className="cb-time-cell" style={{ height: 'auto', padding: '9px 7px 0 0' }} />
      );
      rows.push(
        <div key="untimed-wrap" className="cb-untimed-wrap">
          <span className="cb-untimed-label">No time</span>
          {untimedAll.map(renderChip)}
        </div>
      );
    }
    HOURS.forEach((h) => {
      rows.push(<div key={`t-${h}`} className="cb-time-cell">{fmtHour(h)}</div>);
      days.forEach((d) => {
        const bucket = buckets.get(format(d, 'yyyy-MM-dd'));
        const hits = bucket.rows.get(h) || [];
        rows.push(
          <div key={`${format(d, 'yyyy-MM-dd')}-${h}`} className="cb-day-cell">
            {hits.map(renderChip)}
          </div>
        );
      });
    });
    body = rows;
  }

  return (
    <>
      {clickedDay ? (
        <div className="cb-df">
          <span>Showing: {fmtMDY(clickedDay)}</span>
          <button onClick={onClearDay}>Clear</button>
        </div>
      ) : null}
      <div className="cb-grid-frame">
        <div className="cb-grid-head" style={colsStyle}>
          <div className="cb-grid-head-corner">{isWeek ? '' : 'Time'}</div>
          {days.map((d) => {
            const cls = `cb-grid-day-head ${isToday(d) ? 'today' : ''} ${isSameDay(d, sel) ? 'sel' : ''} ${!isSameMonth(d, new Date(viewYear, viewMonth, 1)) ? 'other' : ''}`;
            return (
              <div
                key={format(d, 'yyyy-MM-dd')}
                className={cls}
                onClick={() => onPickDay(d)}
                title={`Jump to ${format(d, 'EEEE d MMMM yyyy')}`}
              >
                <span className="dow">{DOW_SHORT[d.getDay()]}</span>
                <span className="dom">{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <div className="cb-grid-body" style={colsStyle}>{body}</div>
      </div>
    </>
  );
}

export default ReservationCalendar;
