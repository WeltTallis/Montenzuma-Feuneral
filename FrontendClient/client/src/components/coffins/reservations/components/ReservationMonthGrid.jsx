import React from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';

/* Payment states — must match ReservationDashboard's ST so chips, dots,
   filters and the detail panel all agree.
   The backend keeps every coffin booking at status='active' and records the
   money in paid/amount/deposit, so bookings are coloured by WHO HAS PAID:
   Paid = green, Deposited = amber, Unpaid = red. */
const statusStyles = {
  paid: { color: '#16a34a', label: 'Paid', mark: 'PAID' },
  deposited: { color: '#d97706', label: 'Deposited', mark: 'DEPOSIT' },
  unpaid: { color: '#dc2626', label: 'Unpaid', mark: 'UNPAID' },
};

function formatTime(time) {
  const match = String(time || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

export function ReservationMonthGrid({ visibleMonthDate, visible, clickedDay, onDayClick, onPick }) {
  const start = startOfWeek(startOfMonth(visibleMonthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(visibleMonthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const byDate = new Map();

  visible.forEach((booking) => {
    const key = format(booking.date, 'yyyy-MM-dd');
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(booking);
  });

  return (
    <div className="fc-frame">
      <div className="fc-head">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="fc-head-cell">{day}</div>
        ))}
      </div>
      <div className="fc-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = (byDate.get(key) || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          const selected = clickedDay && isSameDay(day, clickedDay);
          const classes = [
            'fc-day',
            isToday(day) && 'today',
            !isSameMonth(day, visibleMonthDate) && 'other',
            selected && 'selected',
          ].filter(Boolean).join(' ');

          return (
            <div key={key} className={classes} onClick={() => onDayClick(day)}>
              <div className="fc-day-num">{day.getDate()}</div>
              <div className="fc-day-chips">
                {dayBookings.slice(0, 4).map((booking) => {
                  const status = statusStyles[booking.status] || statusStyles.pending;
                  const formattedTime = formatTime(booking.time);
                  const time = formattedTime ? `${formattedTime.replace(/:00 /, ' ')} ` : '';
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      className="fc-chip"
                      style={{ '--chip-c': status.color }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onPick(booking);
                      }}
                      title={`${booking.clientName} - ${status.label}${formattedTime ? ` - ${formattedTime}` : ''}`}
                    >
                      {time}{booking.clientName}
                      <span
                        style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.3px' }}
                        title={status.label}
                      >
                        {status.mark}
                      </span>
                    </button>
                  );
                })}
                {dayBookings.length > 4 && <div className="fc-more">+{dayBookings.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReservationMonthGrid;
