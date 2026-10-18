import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, isSameMonth, isToday } from 'date-fns';
import { getStatusStyle, fmtTime12 } from '../tokens';

/* ============================================================================
   ReservationMonthGrid — full-month calendar with booking chips.
   ============================================================================ */
export function ReservationMonthGrid({ visibleMonthDate, visible, clickedDay, onDayClick, onPick }) {
  const start = startOfWeek(startOfMonth(visibleMonthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(visibleMonthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const byDate = new Map();
  visible.forEach((b) => {
    const k = format(b.date, 'yyyy-MM-dd');
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k).push(b);
  });

  const dowHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const headHtml = (
    <div className="fc-head">
      {dowHeaders.map((d) => (
        <div key={d} className="fc-head-cell">{d}</div>
      ))}
    </div>
  );

  const daysHtml = days.map((d) => {
    const k = format(d, 'yyyy-MM-dd');
    const dayBookings = (byDate.get(k) || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const isTd = isToday(d);
    const isOther = !isSameMonth(d, visibleMonthDate);
    const isSel = clickedDay && isSameDay(d, clickedDay);
    const cls = `fc-day${isTd ? ' today' : ''}${isOther ? ' other' : ''}${isSel ? ' selected' : ''}`;

    const chipsHtml = dayBookings.slice(0, 4).map((b) => {
      const st = getStatusStyle(b);
      const timeStr = b.time ? `${fmtTime12(b.time).replace(/:00 /, ' ')} ` : '';
      return (
        <button
          key={b.id}
          className="fc-chip"
          style={{ '--chip-c': st.color }}
          onClick={(e) => { e.stopPropagation(); onPick(b); }}
          title={`${b.clientName} · ${st.label}${b.time ? ` · ${fmtTime12(b.time)}` : ''}`}
        >
          {timeStr}{b.clientName}
        </button>
      );
    });
    const moreHtml = dayBookings.length > 4 ? (
      <div className="fc-more">+{dayBookings.length - 4} more</div>
    ) : null;

    return (
      <div key={k} className={cls} onClick={() => onDayClick(d)}>
        <div className="fc-day-num">{d.getDate()}</div>
        <div className="fc-day-chips">
          {chipsHtml}
          {moreHtml}
        </div>
      </div>
    );
  });

  return (
    <div className="fc-frame">
      {headHtml}
      <div className="fc-grid">{daysHtml}</div>
    </div>
  );
}

export default ReservationMonthGrid;
