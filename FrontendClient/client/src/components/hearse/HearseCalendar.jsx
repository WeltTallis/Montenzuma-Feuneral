import React, { useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';

/* ============================================================================ *
 * HearseCalendar v3 — DIAGNOSTIC BUILD.
 *
 * This version logs to the console on mount so you can verify in DevTools
 * that the new file is actually loaded (not the old FullCalendar version).
 *
 * The colored card is a PLAIN <div> with inline
 *   style={{ backgroundColor: status.color }}
 * — inline styles CANNOT be overridden by stylesheet rules UNLESS those
 * rules use `!important`. If colors still don't show, the only possible
 * cause is a global `!important` CSS rule (search your project for
 * `background.*!important`).
 *
 * STATUS_CONFIG is INLINED here using the EXACT hex values from your
 * ./statusColors file, so there is zero import-dependency risk.
 * ============================================================================ */

// ── EXACT mirror of your ./statusColors STATUS_CONFIG ───────────────────────
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#d97706' },
  booked: { label: 'Booked', color: '#00296B' },
  confirmed: { label: 'Confirmed', color: '#00296B' },
  scheduled: { label: 'Scheduled', color: '#E36414' },
  in_transit: { label: 'In Transit', color: '#E36414' },
  in_progress: { label: 'In Progress', color: '#0c0b0f' },
  postponed: { label: 'Postponed', color: '#d97706' },
  completed: { label: 'Completed', color: '#5F0F40' },
  delivered: { label: 'Delivered', color: '#132A13' },
  cancelled: { label: 'Cancelled', color: '#DD2D4A' },
  maintenance: { label: 'Maintenance', color: '#03071E' },
};
const FALLBACK_COLOR = '#00296B';

const normalizeStatus = (s) => String(s || '').toLowerCase().replace(/[\s\-]+/g, '_');
const getStatus = (s) => {
  const key = normalizeStatus(s);
  return STATUS_CONFIG[key] || { label: s || 'Unknown', color: FALLBACK_COLOR };
};

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const getBookingDates = (b) => {
  if (!b) return [];
  if (b.booking_dates != null) {
    let dates = b.booking_dates;
    if (typeof dates === 'string') {
      try { dates = JSON.parse(dates); }
      catch { dates = [dates]; }
    }
    if (Array.isArray(dates) && dates.length) {
      return dates.map((d) => String(d).slice(0, 10)).filter(Boolean);
    }
  }
  const fallback = b.booking_date || b.estimated_departure_time || b.date
    || b.start_date || b.from_timestamp || b.estimated_arrival_time || b.end_date;
  return fallback ? [String(fallback).slice(0, 10)] : [];
};

const getRoute = (b) => ({
  from: b.from_location || b.from || b.pickup_location || '',
  to: b.to_location || b.to || b.destination || b.dropoff_location || '',
});

const formatPickupTime = (startDate) => {
  if (!startDate) return '';
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  if (minutes === 0) return `${displayHours} ${period}`;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const MAX_EVENTS_PER_CELL = 3;
const FULLY_BOOKED_THRESHOLD = 4;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Styled layout components ─────────────────────────────────────────────────
const Shell = styled.div`
  background: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
  min-height: 700px;
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  overflow: hidden;
  @media (max-width: 640px) { padding: 12px 10px; min-height: 600px; }
`;

const Toolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; flex-wrap: wrap; margin-bottom: 14px; padding: 0 4px;
  .toolbar-left, .toolbar-right {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .btn {
    background: #FFFFFF; border: 1px solid #EEEEEE; color: #000000;
    font-weight: 600; font-size: 12px; padding: 6px 12px; border-radius: 8px;
    cursor: pointer; transition: all .15s ease; text-transform: capitalize; font-family: inherit;
  }
  .btn:hover { background: #000000; color: #FFFFFF; border-color: #000000; }
  .btn.active { background: #000000; color: #FFFFFF; border-color: #000000; }
  .btn.dark {
    background: #101828; color: #FFFFFF; border-color: #101828;
    text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: .06em;
  }
  .btn.dark:hover { background: #1d2939; border-color: #1d2939; }
  .title { font-size: 18px; font-weight: 700; color: #000000; }
`;

const CalendarTable = styled.table`
  width: 100%; border-collapse: collapse; table-layout: fixed;
  thead th {
    background: #FFFFFF; border-bottom: 1px solid #EEEEEE;
    border-top: 2px solid transparent; padding: 8px 4px;
    font-size: 13px; font-weight: 700; color: #000000; text-align: center;
  }
  thead th.today { border-top-color: #2E7D32; color: #2E7D32; }
`;

const CalendarCell = styled.td`
  vertical-align: top; height: 130px; padding: 4px;
  border: 1px solid #F3F4F6; background: #FFFFFF;
  cursor: pointer; transition: background .15s ease; overflow: hidden;
  &:hover { background: #F9FAFB; }
  &.other-month { background: #FAFAFA; }
  &.other-month .day-number { opacity: 0.35; }
  &.today-cell { background: #E8F5E9; }
  &.has-bookings { background: rgba(17, 24, 39, 0.02); }
  &.fully-booked { background: #FECACA; }
  &.fully-booked .day-number { background: #DC2626; color: #FFFFFF; }
  .day-number {
    display: inline-block; font-size: 14px; font-weight: 700; color: #111827;
    padding: 2px 6px; border-radius: 4px; text-align: right; float: right; margin-bottom: 4px;
  }
  &.today-cell .day-number {
    background: #2E7D32; color: #FFFFFF; border-radius: 50%; min-width: 26px; text-align: center;
  }
  .events::after { content: ''; display: table; clear: both; }
  @media (max-width: 640px) { height: 100px; .day-number { font-size: 12px; padding: 1px 4px; } }
`;

const MoreLink = styled.span`
  display: inline-block; margin-top: 4px; padding: 3px 6px;
  background: #EFF6FF; color: #00296B; border-radius: 4px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  &:hover { background: #DBEAFE; }
`;

// ── THE COLORED CARD — plain <div> with INLINE style.
// Inline styles win over every stylesheet rule except `!important`.
// This is the most bulletproof way to paint a background colour in React.
const EventCard = ({ color, hearseName, plate, routeFrom, routeTo, pickupTime, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: color,         // <-- THE STATUS COLOUR, INLINE
      color: '#FFFFFF',
      borderRadius: '6px',
      padding: '6px 8px',
      margin: '2px 0',
      minHeight: '56px',
      cursor: 'pointer',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
      fontFamily: 'inherit',
      lineHeight: '1.2',
      boxSizing: 'border-box',
      display: 'block',
    }}
  >
    <div style={{
      fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '1px',
    }}>
      {hearseName}
    </div>
    {plate && plate !== '—' && (
      <div style={{
        fontSize: '10px', color: 'rgba(255,255,255,0.85)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
      }}>
        {plate}
      </div>
    )}
    {routeFrom && (
      <div style={{
        fontSize: '11px', fontWeight: 600, color: '#FFFFFF',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.25',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>From:</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', marginLeft: '3px' }}>{routeFrom}</span>
      </div>
    )}
    {routeTo && (
      <div style={{
        fontSize: '11px', fontWeight: 600, color: '#FFFFFF',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.25',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>To:</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', marginLeft: '3px' }}>{routeTo}</span>
      </div>
    )}
    {pickupTime && (
      <div style={{
        fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: '2px',
      }}>
        {pickupTime}
      </div>
    )}
  </div>
);

// ── Component ───────────────────────────────────────────────────────────────
const HearseCalendar = ({
  bookings = [],
  allBookings: _allBookings,
  hearses: _hearses,
  branches: _branches,
  drivers: _drivers,
  standbyDriverId: _standbyDriverId,
  standbyDriverName: _standbyDriverName,
  lineupLoading: _lineupLoading,
  savingStandby: _savingStandby,
  savingBookingLineup: _savingBookingLineup,
  onSaveStandby: _onSaveStandby,
  onSaveBookingLineup: _onSaveBookingLineup,
  onCreateBooking: _onCreateBooking,
  selectedDate: _selectedDate,
  onItemClick,
  onDateSelect,
  onDateClick,
  month,
  onMonthChange,
}) => {
  const visibleMonth = month || new Date();
  const todayKey = toDateKey(new Date());

  // ── DIAGNOSTIC LOG — fires on every mount + when bookings change.
  // Open browser DevTools → Console. You should see:
  //   [HearseCalendar v3] mounted. bookings=12 statuses={booked: 5, ...}
  // If you DON'T see this log, the new file is NOT loaded — your project
  // is still running the old FullCalendar version (clear Vite cache:
  //   rm -rf node_modules/.vite && npm run dev)
  useEffect(() => {
    const statusCounts = {};
    (bookings || []).forEach((b) => {
      const k = normalizeStatus(b.status);
      statusCounts[k] = (statusCounts[k] || 0) + 1;
    });
    // eslint-disable-next-line no-console
    console.log(
      `%c[HearseCalendar v3] mounted. bookings=${(bookings || []).length} statuses=`,
      'background:#00296B;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;',
      statusCounts
    );
  }, [bookings]);

  const gridDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const m = visibleMonth.getMonth();
    const startDayOfWeek = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, m, 0).getDate();
    const days = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, otherMonth: true, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, otherMonth: false, date: new Date(year, m, d) });
    }
    const trailing = 42 - days.length;
    for (let i = 1; i <= trailing; i++) {
      days.push({ day: i, otherMonth: true, date: null });
    }
    return days;
  }, [visibleMonth]);

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    (Array.isArray(bookings) ? bookings : []).forEach((b) => {
      const dates = getBookingDates(b);
      dates.forEach((d) => {
        const key = String(d).slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(b);
      });
    });
    // eslint-disable-next-line no-console
    console.log('[HearseCalendar v3] bookingsByDate =', Object.fromEntries(map));
    return map;
  }, [bookings]);

  const goToMonth = useCallback((delta) => {
    const d = new Date(visibleMonth);
    d.setMonth(d.getMonth() + delta);
    onMonthChange?.(d.getMonth(), d.getFullYear());
  }, [visibleMonth, onMonthChange]);

  const goToToday = useCallback(() => {
    const d = new Date();
    onMonthChange?.(d.getMonth(), d.getFullYear());
  }, [onMonthChange]);

  const todayDow = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() !== visibleMonth.getFullYear()
      || now.getMonth() !== visibleMonth.getMonth()) return -1;
    return now.getDay();
  }, [visibleMonth]);

  const renderEvent = (b) => {
    const status = getStatus(b.status);
    const route = getRoute(b);
    const hearseName = b.hearse_name || b.hearse?.name || b.vehicle_name || 'Hearse';
    const plate = b.plate_number || b.hearse_plate || b.number_plate || '';
    const startDate = b.from_timestamp || getBookingDates(b)[0];
    const pickupTime = formatPickupTime(startDate);

    return (
      <EventCard
        key={String(b.booking_id || b.id || Math.random())}
        color={status.color}
        hearseName={hearseName}
        plate={plate}
        routeFrom={route.from}
        routeTo={route.to}
        pickupTime={pickupTime}
        onClick={(e) => { e.stopPropagation(); onItemClick?.(b); }}
      />
    );
  };

  return (
    <Shell data-version="v3-diagnostic" data-bookings-count={(bookings || []).length}>
      <Toolbar>
        <div className="toolbar-left">
          <button className="btn" onClick={() => goToMonth(-1)} aria-label="Previous month">‹ Prev</button>
          <button className="btn dark" onClick={goToToday}>Today</button>
          <button className="btn" onClick={() => goToMonth(1)} aria-label="Next month">Next ›</button>
          <span className="title">
            {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="toolbar-right">
          <button className="btn active">Month</button>
        </div>
      </Toolbar>

      <CalendarTable>
        <thead>
          <tr>
            {WEEKDAYS.map((d, i) => (
              <th key={d} className={i === todayDow ? 'today' : ''}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, weekIdx) => (
            <tr key={weekIdx}>
              {gridDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, cellIdx) => {
                const dateKey = cell.date ? toDateKey(cell.date) : '';
                const dayBookings = cell.date ? (bookingsByDate.get(dateKey) || []) : [];
                const hasBookings = dayBookings.length > 0;
                const fullyBooked = dayBookings.length >= FULLY_BOOKED_THRESHOLD;
                const visible = dayBookings.slice(0, MAX_EVENTS_PER_CELL);
                const hidden = dayBookings.length - visible.length;

                const classes = [];
                if (cell.otherMonth) classes.push('other-month');
                if (dateKey === todayKey) classes.push('today-cell');
                if (hasBookings) classes.push('has-bookings');
                if (fullyBooked) classes.push('fully-booked');

                return (
                  <CalendarCell
                    key={cellIdx}
                    className={classes.join(' ')}
                    onClick={() => {
                      if (cell.date) {
                        onDateSelect?.(dateKey);
                        onDateClick?.(dateKey);
                      }
                    }}
                  >
                    <span className="day-number">{cell.day}</span>
                    {dayBookings.length > 0 && (
                      <div className="events">
                        {visible.map(renderEvent)}
                        {hidden > 0 && (
                          <MoreLink
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateSelect?.(dateKey);
                              onDateClick?.(dateKey);
                            }}
                          >
                            +{hidden} more
                          </MoreLink>
                        )}
                      </div>
                    )}
                  </CalendarCell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </CalendarTable>
    </Shell>
  );
};

export default HearseCalendar;
