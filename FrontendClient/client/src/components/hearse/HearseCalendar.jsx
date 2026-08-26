
import { toDateKey, formatTimeAmPm } from '../../utils/dates/parseDates';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import styled from 'styled-components';

// ===== SHARED CONSTANTS =====
export const COLORS = {
  textSecondary: '#6b7280',
  successLight: '#d1fae5',
  primaryLight: '#2c8ac9',
  primaryDark: '#134b5f',
  borderLight: '#e5e7eb',

  white: '#FFFFFF',
  surface: '#ffffff',
  primary: '#1a5f7a',
  border: '#d1d5db',
  text: '#111827',
  bg: '#f5f7fa',



  textMuted: '#9ca3af',
  success: '#10b981',

  successDark: '#059669',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  warning: '#f59e0b',

  danger: '#ef4444',
  dangerLight: '#fee2e2',
  dangerDark: '#dc2626',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', textColor: '#92400E' },
  booked: { label: 'Booked', color: '#2563EB', bg: '#EFF6FF', textColor: '#1E40AF' },
  in_transit: { label: 'In Transit', color: '#D32F2F', bg: '#FFEBEE', textColor: '#B71C1C' },
  completed: { label: 'Completed', color: '#2E7D32', bg: '#E8F5E9', textColor: '#1B5E20' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', textColor: '#991B1B' },
  confirmed: { label: 'Confirmed', color: '#2563EB', bg: '#EFF6FF', textColor: '#1E40AF' },
};

export const START_HOUR = 6;
export const END_HOUR = 22;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
export const HOUR_H = 60;
export const TIME_W = 65;

// ===== SHARED HELPERS =====
export const pad = n => String(n).padStart(2, '0');
export const fmtDS = toDateKey;
export const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
export const getInitials = n => { if (!n) return '?'; const p = n.split(' '); return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase(); };
export const fmtHour = h => h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h - 12) + ' PM';

export const getTimeInfo = b => {
  let s = '', e = '';
  if (b.booking_dates) { try { const d = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates; if (Array.isArray(d) && d.length) { s = d[0]; if (d.length > 1) e = d[1]; } } catch (x) { } }
  if (!s) s = b.booking_date || b.estimated_departure_time || b.date || '';
  if (!e) e = b.end_date || b.estimated_arrival_time || '';
  let sd = null, ed = null, allDay = false;
  if (s) { try { sd = new Date(s); if (isNaN(sd.getTime())) throw 0; if (sd.getHours() === 0 && sd.getMinutes() === 0 && !s.includes('T') && !s.includes(':')) allDay = true; } catch (x) { allDay = true; } } else allDay = true;
  if (e) { try { ed = new Date(e); if (isNaN(ed.getTime())) ed = null; } catch (x) { ed = null; } }
  let dur = 60; if (sd && ed) dur = Math.max(15, (ed - sd) / 60000);
  let sm = 0; if (sd && !allDay) sm = sd.getHours() * 60 + sd.getMinutes();
  const fs = formatTimeAmPm(s), fe = formatTimeAmPm(e);
  return { sd, ed, allDay, sm, dur, fs, fe, range: allDay ? 'All Day' : (fe ? fs + ' – ' + fe : fs) };
};

// ===== HELPER: Get booking dates safely =====
const getBookingDates = (b) => {
  if (b.booking_dates) {
    try {
      const dates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates;
      if (Array.isArray(dates) && dates.length) return dates;
    } catch (x) { /* fall through */ }
  }
  const date = b.booking_date || b.estimated_departure_time || b.date || b.start_date;
  return date ? [date] : [];
};

// ===== STYLED COMPONENTS =====
const Shell = styled.div`
  background: #FFFFFF;
  border-radius: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  overflow: hidden;

  @media (max-width: 640px) {
    padding: 12px 16px;
    height: 100vh;
    min-height: 100vh;
  }

  /* FullCalendar custom styles */
  .fc {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    height: 100% !important;
    flex: 1 !important;
  }

  .fc .fc-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px !important;
  }

  .fc .fc-toolbar-title {
    font-size: 18px;
    font-weight: 700;
    color: #000000;
  }

  .fc .fc-button {
    background: #FFFFFF;
    border: 1px solid #EEEEEE;
    color: #000000;
    font-weight: 600;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    text-transform: capitalize;
    height: auto !important;
  }

  .fc .fc-button:hover {
    background: #000000;
    color: #FFFFFF;
    border-color: #000000;
  }

  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background: #000000;
    color: #FFFFFF;
    border-color: #000000;
  }

  .fc .fc-button-primary:focus {
    box-shadow: none;
  }

  /* ===== MONTH VIEW STYLES ===== */
  .fc .fc-daygrid-body {
    min-height: 300px !important;
  }

  .fc .fc-daygrid-day {
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 80px !important;
  }

  .fc .fc-daygrid-day:hover {
    background: #F5F5F5;
  }

  .fc .fc-daygrid-day-frame {
    padding: 4px;
    min-height: 80px !important;
  }

  .fc .fc-daygrid-day-number {
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    padding: 4px 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fc .fc-day-today .fc-daygrid-day-number {
    background: #2E7D32;
    color: #FFFFFF;
  }

  .fc .fc-daygrid-day.fc-day-today {
    background: transparent;
  }

  .fc .fc-daygrid-day-other .fc-daygrid-day-number {
    opacity: 0.3;
  }

  .fc .fc-daygrid-day-events {
    margin-top: 2px;
    display: flex;
    gap: 2px;
    justify-content: center;
    flex-wrap: wrap;
    min-height: 8px;
  }

  .fc-daygrid-day-events .fc-event-dot-wrapper {
    display: flex;
    gap: 2px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .fc-event-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    display: inline-block;
  }

  .fc .fc-daygrid-day-bottom {
    font-size: 10px;
    font-weight: 600;
    color: #999999;
  }

  .fc .fc-daygrid-day-events .fc-daygrid-day-event {
    display: none !important;
  }

  .fc .fc-daygrid-more-link {
    font-size: 10px !important;
    font-weight: 600 !important;
    color: #2563EB !important;
    cursor: pointer !important;
    padding: 1px 4px !important;
    border-radius: 4px !important;
    margin-top: 2px !important;
  }

  .fc .fc-daygrid-more-link:hover {
    background: #EFF6FF !important;
  }

  /* ===== WEEK & DAY VIEW - FULL CARDS LIKE BEFORE ===== */
  .fc .fc-timegrid-axis-cushion,
  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px;
    font-weight: 600;
    color: #999999;
    padding: 4px 8px !important;
  }

  .fc .fc-timegrid-axis {
    background: #FAFAFA !important;
    border-right: 1px solid #EEEEEE !important;
    width: 50px !important;
  }

  .fc .fc-timegrid-slot-label {
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
    height: 50px !important;
  }

  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #999999 !important;
  }

  .fc .fc-timegrid-col {
    border-right: 1px solid #EEEEEE !important;
    background: #FFFFFF;
  }

  .fc .fc-timegrid-col.fc-day-today {
    background: #FAFAFA !important;
  }

  .fc .fc-col-header-cell {
    padding: 8px 0 !important;
    background: #FFFFFF !important;
    border-bottom: 2px solid #EEEEEE !important;
  }

  .fc .fc-col-header-cell-cushion {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #000000 !important;
    text-decoration: none !important;
  }

  .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
    color: #2E7D32 !important;
  }

  /* Event styling - Full cards like before */
  .fc .fc-timegrid-event {
    border-radius: 6px !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    padding: 6px 8px !important;
    margin: 2px 3px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    min-height: 40px !important;
  }

  .fc .fc-timegrid-event:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 10 !important;
  }

  .fc .fc-timegrid-event .fc-event-main {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    padding: 2px !important;
  }

  .fc .fc-timegrid-event .fc-event-time {
    font-size: 10px !important;
    font-weight: 600 !important;
    opacity: 0.9 !important;
    display: block !important;
  }

  .fc .fc-timegrid-event .fc-event-title {
    font-weight: 700 !important;
    font-size: 13px !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-destination {
    font-size: 10px !important;
    opacity: 0.85 !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-from {
    font-size: 9px !important;
    opacity: 0.7 !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-plate {
    font-size: 9px !important;
    opacity: 0.7 !important;
    display: inline-block !important;
  }

  .fc .fc-timegrid-event .fc-event-status {
    font-size: 9px !important;
    font-weight: 600 !important;
    display: inline-block !important;
    padding: 1px 8px !important;
    border-radius: 4px !important;
    align-self: flex-start !important;
    margin-top: 2px !important;
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: #D32F2F !important;
    border-width: 2px !important;
  }

  .fc .fc-timegrid-now-indicator-arrow {
    border-color: #D32F2F !important;
    border-width: 5px !important;
  }

  .fc .fc-timegrid-now-indicator-line::before {
    content: '● ' !important;
    color: #D32F2F !important;
    font-size: 10px !important;
    position: absolute !important;
    left: -16px !important;
    top: -5px !important;
  }

  /* All-day row styling */
  .fc .fc-timegrid-axis-frame {
    background: #FAFAFA !important;
  }

  .fc .fc-timegrid-axis-frame .fc-timegrid-axis-cushion {
    font-size: 9px !important;
    font-weight: 700 !important;
    color: #999999 !important;
    text-transform: uppercase !important;
  }

  .fc .fc-timegrid-all-day-events {
    min-height: 35px !important;
    background: #FFFFFF !important;
    padding: 2px !important;
  }

  .fc .fc-timegrid-all-day-event {
    border-radius: 6px !important;
    border: none !important;
    padding: 4px 8px !important;
    margin: 2px 3px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
    min-height: 28px !important;
    display: flex !important;
    align-items: center !important;
  }

  .fc .fc-timegrid-all-day-event .fc-event-title {
    font-weight: 700 !important;
    font-size: 12px !important;
  }

  /* Popover styling */
  .fc .fc-popover {
    border-radius: 12px !important;
    border: 1px solid #EEEEEE !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
    background: #FFFFFF !important;
  }

  .fc .fc-popover-header {
    padding: 10px 14px !important;
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
    border-radius: 12px 12px 0 0 !important;
  }

  .fc .fc-popover-title {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #000000 !important;
  }

  .fc .fc-popover-body {
    padding: 6px 10px !important;
  }

  .fc .fc-popover-body .fc-event {
    border-radius: 6px !important;
    padding: 6px 10px !important;
    margin: 3px 0 !important;
    min-height: 30px !important;
  }

  .fc .fc-popover-body .fc-event .fc-event-title {
    font-weight: 600 !important;
    font-size: 12px !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .fc .fc-col-header-cell-cushion {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 11px !important;
    }

    .fc .fc-timegrid-event .fc-event-time {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-event .fc-event-destination {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-axis {
      width: 35px !important;
    }

    .fc .fc-timegrid-axis-cushion {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-slot-label {
      height: 40px !important;
    }

    .fc .fc-daygrid-day {
      min-height: 60px !important;
    }

    .fc .fc-daygrid-day-frame {
      min-height: 60px !important;
    }

    .fc .fc-timegrid-event {
      padding: 4px 6px !important;
      min-height: 32px !important;
    }

    .fc .fc-timegrid-all-day-event {
      font-size: 10px !important;
      padding: 2px 6px !important;
      min-height: 22px !important;
    }
  }

  @media (max-width: 640px) {
    .fc .fc-toolbar {
      flex-direction: column;
      gap: 8px;
    }
    
    .fc .fc-toolbar-chunk {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    
    .fc .fc-daygrid-day-number {
      font-size: 12px;
      width: 26px;
      height: 26px;
    }

    .fc .fc-daygrid-day-frame {
      min-height: 50px !important;
      padding: 2px !important;
    }

    .fc .fc-col-header-cell {
      padding: 4px 0 !important;
    }

    .fc .fc-col-header-cell-cushion {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-event {
      padding: 3px 4px !important;
      min-height: 28px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event .fc-event-time {
      font-size: 8px !important;
    }

    .fc .fc-timegrid-now-indicator-line::before {
      display: none !important;
    }

    .fc .fc-daygrid-day {
      min-height: 50px !important;
    }

    .fc .fc-timegrid-all-day-event {
      font-size: 9px !important;
      padding: 2px 4px !important;
      min-height: 20px !important;
    }
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #FAFAFA;
  border-radius: 8px;
  flex-wrap: wrap;
  border: 1px solid #EEEEEE;
  flex-shrink: 0;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #999999;
`;

const LegendDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const CalendarWrapper = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

// ===== STATS BAR =====
const StatsBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  margin-bottom: 8px;
  background: #FAFAFA;
  border-radius: 6px;
  flex-wrap: wrap;
  border: 1px solid #EEEEEE;
  flex-shrink: 0;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.color || '#000000'};
`;

// ===== MAIN CALENDAR COMPONENT =====
const HearseCalendar = ({ bookings = [], onItemClick, onCreateBooking, selectedDate, onDateSelect, onDateClick }) => {
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const calendarRef = useRef(null);

  // Convert bookings to FullCalendar events with rich data
  const events = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    return bookings
      .map((b) => {
        const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
        const dates = getBookingDates(b);
        const startDate = dates[0];
        const endDate = dates[1] || b.end_date || b.estimated_arrival_time || startDate;

        if (!startDate) return null;

        const isAllDay = !String(startDate).includes('T') && !String(startDate).includes(':');

        let startTime = '';
        let endTime = '';
        try {
          const sd = new Date(startDate);
          if (!isNaN(sd.getTime())) {
            startTime = sd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }
          const ed = new Date(endDate);
          if (!isNaN(ed.getTime())) {
            endTime = ed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }
        } catch (e) { }

        return {
          id: b.booking_id || b.id || `booking-${Math.random()}`,
          title: b.client_name || b.client || 'Unknown Client',
          start: startDate,
          end: endDate || startDate,
          allDay: isAllDay,
          backgroundColor: status.color,
          borderColor: status.color,
          textColor: '#FFFFFF',
          extendedProps: {
            ...b,
            status: b.status,
            statusLabel: status.label,
            statusColor: status.color,
            statusBg: status.bg,
            dest: b.destination || b.to_location || '—',
            from: b.from_location || b.origin || '—',
            plate: b.plate_number || b.hearse_plate || b.number_plate || '—',
            branchName: b.branch_name || b.branch || '',
            phone: b.client_phone || b.phone || '',
            clientName: b.client_name || b.client || 'Unknown Client',
            startTime,
            endTime,
            bookingCode: b.booking_code || '',
          }
        };
      })
      .filter(e => e !== null && e.start);
  }, [bookings]);

  // Calculate daily stats for the selected date
  const getDailyStats = useCallback(() => {
    if (!selectedDate) return { total: 0, booked: 0, transit: 0, pending: 0, completed: 0 };

    const dateStr = selectedDate.split('T')[0];
    const dayBookings = bookings.filter((b) => {
      const dates = getBookingDates(b);
      return dates.some(d => {
        if (!d) return false;
        const dStr = String(d).split('T')[0];
        return dStr === dateStr;
      });
    });

    return {
      total: dayBookings.length,
      booked: dayBookings.filter(b => b.status === 'booked' || b.status === 'confirmed').length,
      transit: dayBookings.filter(b => b.status === 'in_transit' || b.status === 'transit').length,
      pending: dayBookings.filter(b => b.status === 'pending').length,
      completed: dayBookings.filter(b => b.status === 'completed').length,
    };
  }, [bookings, selectedDate]);

  const dailyStats = getDailyStats();

  // Handle date click
  const handleDateClick = useCallback((info) => {
    const dateStr = info.dateStr.split('T')[0];
    if (onDateSelect) onDateSelect(dateStr);
    if (onDateClick) onDateClick(dateStr);
  }, [onDateSelect, onDateClick]);

  // Handle event click
  const handleEventClick = useCallback((info) => {
    const booking = info.event.extendedProps;
    if (onItemClick) onItemClick(booking);
  }, [onItemClick]);

  // Handle view change
  const handleViewChange = useCallback((view) => {
    setCalendarView(view.type);
  }, []);

  // Custom event renderer - Full cards for week/day view with all details
  const renderEventContent = useCallback((eventInfo) => {
    const isMonthView = calendarView === 'dayGridMonth';
    const props = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    // Month view - hide events (show dots instead)
    if (isMonthView) {
      return null;
    }

    // Week/Day view - show full card with all details
    return (
      <div style={{
        padding: isAllDay ? '4px 8px' : '6px 8px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        gap: '2px'
      }}>
        {!isAllDay && props.startTime && (
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🕐 {props.startTime}{props.endTime ? ` - ${props.endTime}` : ''}
          </div>
        )}
        <div style={{
          fontWeight: 700,
          fontSize: isAllDay ? '13px' : '13px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {props.clientName}
          {props.statusLabel && (
            <span style={{
              fontSize: '8px',
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: '4px',
              background: props.statusBg || props.statusColor,
              color: props.statusColor || '#FFFFFF',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              {props.statusLabel}
            </span>
          )}
        </div>
        {props.dest && props.dest !== '—' && (
          <div style={{
            fontSize: '10px',
            opacity: 0.85,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📍 {props.dest}
          </div>
        )}
        {props.from && props.from !== '—' && !isAllDay && (
          <div style={{
            fontSize: '9px',
            opacity: 0.7,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🏠 {props.from}
          </div>
        )}
        {props.plate && props.plate !== '—' && (
          <div style={{
            fontSize: '9px',
            opacity: 0.7,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🚗 {props.plate}
          </div>
        )}
        {props.phone && props.phone !== '—' && !isAllDay && (
          <div style={{
            fontSize: '8px',
            opacity: 0.6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📞 {props.phone}
          </div>
        )}
      </div>
    );
  }, [calendarView]);

  // Custom day cell renderer for month view dots
  const renderDayCell = useCallback((info) => {
    if (calendarView !== 'dayGridMonth') return;

    const dateStr = info.date.toISOString().split('T')[0];

    const dayEvents = bookings.filter((b) => {
      const dates = getBookingDates(b);
      return dates.some(d => {
        if (!d) return false;
        const dStr = String(d).split('T')[0];
        return dStr === dateStr;
      });
    });

    // Highlight booked dates with a red background
    if (dayEvents.length > 0) {
      info.el.style.setProperty('background-color', 'rgba(239, 68, 68, 0.12)', 'important');
      info.el.style.setProperty('border-radius', '6px', 'important');
    }

    if (dayEvents.length === 0) return;

    const container = document.createElement('div');
    container.className = 'fc-event-dot-wrapper';
    container.style.cssText = 'display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; margin-top: 2px;';

    // Show dots for each event (max 3)
    const maxDots = Math.min(dayEvents.length, 3);
    for (let i = 0; i < maxDots; i++) {
      const status = STATUS_CONFIG[dayEvents[i].status] || STATUS_CONFIG.pending;
      const dot = document.createElement('span');
      dot.className = 'fc-event-dot';
      dot.style.cssText = `width: 5px; height: 5px; border-radius: 50%; background: ${status.color}; display: inline-block;`;
      container.appendChild(dot);
    }

    // If more than 3 events, show +N
    if (dayEvents.length > 3) {
      const more = document.createElement('span');
      more.style.cssText = 'font-size: 7px; font-weight: 600; color: #999; padding: 0 2px;';
      more.textContent = `+${dayEvents.length - 3}`;
      container.appendChild(more);
    }

    const eventsContainer = info.el.querySelector('.fc-daygrid-day-events');
    if (eventsContainer) {
      eventsContainer.innerHTML = '';
      eventsContainer.appendChild(container);
    } else {
      const newContainer = document.createElement('div');
      newContainer.className = 'fc-daygrid-day-events';
      newContainer.style.cssText = 'margin-top: 2px; display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; min-height: 8px;';
      newContainer.appendChild(container);
      info.el.appendChild(newContainer);
    }
  }, [bookings, calendarView]);

  return (
    <Shell>


      {calendarView === 'timeGridDay' && selectedDate && dailyStats.total > 0 && (
        <StatsBar>
          <StatItem color="#2563EB">
            📊 {dailyStats.total} Bookings
          </StatItem>
          {dailyStats.booked > 0 && (
            <StatItem color="#2563EB">
              ● {dailyStats.booked} Booked
            </StatItem>
          )}
          {dailyStats.transit > 0 && (
            <StatItem color="#D32F2F">
              ● {dailyStats.transit} In Transit
            </StatItem>
          )}
          {dailyStats.pending > 0 && (
            <StatItem color="#F59E0B">
              ● {dailyStats.pending} Pending
            </StatItem>
          )}
          {dailyStats.completed > 0 && (
            <StatItem color="#2E7D32">
              ● {dailyStats.completed} Completed
            </StatItem>
          )}
        </StatsBar>
      )}

      <CalendarWrapper>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayHeaderFormat: { weekday: 'short' },
              dayMaxEvents: 3,
              moreLinkText: '+%d more',
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
              dayHeaderFormat: { weekday: 'short', month: 'short', day: 'numeric' },
              slotMinTime: '05:00:00',
              slotMaxTime: '23:00:00',
              slotDuration: '00:30:00',
              allDaySlot: true,
              nowIndicator: true,
              dayMaxEvents: 10,
              moreLinkText: '+%d more',
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
              dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
              slotMinTime: '05:00:00',
              slotMaxTime: '23:00:00',
              slotDuration: '00:30:00',
              allDaySlot: true,
              nowIndicator: true,
              dayMaxEvents: 10,
              moreLinkText: '+%d more',
            }
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          viewDidMount={handleViewChange}
          eventContent={renderEventContent}
          dayCellDidMount={renderDayCell}
          height="100%"
          contentHeight="100%"
          aspectRatio={1.8}
          firstDay={0}
          weekends={true}
          nowIndicator={true}
          selectable={true}
          unselectAuto={true}
          dayMaxEvents={3}
          moreLinkText="+%d more"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotLabelInterval="01:00"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          eventMinHeight={25}
          eventMaxStack={10}
          slotEventOverlap={true}
          expandRows={true}
          stickyHeaderDates={true}
          weekNumbers={false}
          displayEventTime={true}
          displayEventEnd={true}
          forceEventDuration={true}
        />
      </CalendarWrapper>
    </Shell>
  );
};

export default HearseCalendar;