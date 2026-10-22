import { toDateKey, formatTimeAmPm } from '../../utils/dates/parseDates';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import styled from 'styled-components';
import { getBranches } from '../../utils/globalAuth';
import { Calendar, CheckCircle, Truck, Clock, Check, BarChart3, MapPin, Home, Car, Phone, Building } from '../../utils/icons/icons';
import { STATUS_CONFIG } from './statusColors';
import { BR, BRANCH_SLUG_TO_NAME } from './viewerShared';

export { STATUS_CONFIG };

export const COLORS = {
  textSecondary: '#6b7280', successLight: '#d1fae5', primaryLight: '#2c8ac9',
  primaryDark: '#134b5f', borderLight: '#e5e7eb',
  white: '#FFFFFF', surface: '#ffffff', primary: '#1a5f7a', border: '#d1d5db',
  text: '#111827', bg: '#f5f7fa',
  textMuted: '#9ca3af', success: '#10b981', successDark: '#059669',
  warningLight: '#fef3c7', warningDark: '#d97706', warning: '#f59e0b',
  danger: '#ef4444', dangerLight: '#fee2e2', dangerDark: '#dc2626',
  info: '#3b82f6', infoLight: '#dbeafe', infoDark: '#2563eb',
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const START_HOUR = 6, END_HOUR = 22;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
export const HOUR_H = 60, TIME_W = 65;

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

const getBookingDates = (b) => {
  if (b.booking_dates) {
    try {
      const dates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates;
      if (Array.isArray(dates) && dates.length) return dates;
    } catch (x) { }
  }
  const date = b.booking_date || b.estimated_departure_time || b.date || b.start_date;
  return date ? [date] : [];
};

const Shell = styled.div`
  background: #FFFFFF;
  border-radius: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
  min-height: 700px;
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  overflow: visible;
  position: relative;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 12px 10px;
    min-height: 600px;
  }

  .fc {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .fc table { width: 100% !important; }

  .fc .fc-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px !important;
  }

  .fc .fc-toolbar-title { font-size: 18px; font-weight: 700; color: #000000; }

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
  .fc .fc-button:hover { background: #000000; color: #FFFFFF; border-color: #000000; }
  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active { background: #000000; color: #FFFFFF; border-color: #000000; }
  .fc .fc-button-primary:focus { box-shadow: none; }

  .fc .fc-daygrid-day {
    cursor: pointer;
    transition: background .15s ease;
    min-height: 240px !important;
    height: auto !important;
    vertical-align: top !important;
    overflow: visible !important;
  }
  .fc .fc-daygrid-day:hover { background: #F9FAFB; }

  .fc .fc-daygrid-day-frame {
    padding: 4px !important;
    min-height: 240px !important;
    height: auto !important;
    box-sizing: border-box !important;
    display: block !important;
    overflow: visible !important;
  }

  .fc .fc-daygrid-day-top {
    display: flex !important;
    flex-direction: row-reverse !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 2px 4px !important;
    margin-bottom: 4px !important;
  }
  .fc .fc-daygrid-day-number {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #111827 !important;
    padding: 2px 6px !important;
    border-radius: 4px;
    text-decoration: none !important;
    display: inline-block !important;
  }
  .fc .fc-day-today .fc-daygrid-day-number {
    background: #2E7D32 !important;
    color: #FFFFFF !important;
    border-radius: 50% !important;
    min-width: 26px !important;
    text-align: center !important;
  }
  .fc .fc-daygrid-day.fc-day-today { background: #E8F5E9 !important; }
  .fc .fc-daygrid-day-other .fc-daygrid-day-number { opacity: 0.35 !important; }

  .fc .fc-daygrid-day-events {
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    position: relative !important;
    min-height: 200px !important;
    height: auto !important;
    overflow: visible !important;
  }

  .fc .fc-daygrid-event-harness {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    display: block !important;
    width: 100% !important;
    min-height: 62px !important;
    height: auto !important;
    margin: 0 0 6px 0 !important;
    overflow: visible !important;
  }
  .fc .fc-daygrid-event-harness:last-child { margin-bottom: 0 !important; }

  /* IMPORTANT: no background override here — the inline backgroundColor
     from FC (status.color, the RICH saturated colour) must paint the
     wrapper. This is the OUTER safety layer; the inner card below paints
     the same colour on top. */
  .fc .fc-daygrid-event {
    display: block !important;
    width: 100% !important;
    min-height: 62px !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    overflow: visible !important;
    cursor: pointer !important;
    color: #FFFFFF !important;
  }

  /* FC's inner wrapper must be transparent so the card paints through. */
  .fc .fc-daygrid-event .fc-event-main,
  .fc .fc-daygrid-event .fc-event-main-frame {
    display: block !important;
    width: 100% !important;
    min-height: 62px !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    background: transparent !important;
    color: #FFFFFF !important;
  }

  .fc .fc-daygrid-more-link {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #00296B !important;
    cursor: pointer !important;
    padding: 3px 6px !important;
    border-radius: 4px !important;
    margin-top: 4px !important;
    display: inline-block !important;
    background: #EFF6FF !important;
  }
  .fc .fc-daygrid-more-link:hover { background: #DBEAFE !important; }

  .fc .fc-timegrid-axis {
    width: 56px !important;
    background: #FAFAFA !important;
    border-right: 1px solid #EEEEEE !important;
  }
  .fc .fc-timegrid-slot { height: 1.5em !important; }
  .fc .fc-timegrid-axis-cushion,
  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px !important; font-weight: 600 !important;
    color: #999999 !important;
    padding: 0 8px 0 0 !important;
    text-align: right !important;
  }
  .fc .fc-timegrid-slot { border-bottom: 1px solid transparent !important; }
  .fc .fc-timegrid-slot-minor { border-top-style: dotted !important; border-top-color: #F3F4F6 !important; }
  .fc .fc-timegrid-col { border-right: 1px solid #EEEEEE !important; background: #FFFFFF; }
  .fc .fc-timegrid-col:last-child { border-right: 0 !important; }
  .fc .fc-timegrid-col.fc-day-today { background: #FAFAFA !important; }

  .fc .fc-col-header-cell {
    background: #FFFFFF !important;
    border-bottom: 1px solid #EEEEEE !important;
    border-top: 2px solid transparent !important;
    padding: 0 !important;
    vertical-align: middle !important;
  }
  .fc .fc-col-header-cell.fc-day-today { border-top-color: #2E7D32 !important; }
  .fc .fc-col-header-cell-cushion {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 1px !important;
    padding: 8px 4px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #000000 !important;
    text-decoration: none !important;
    width: 100% !important;
  }
  .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion { color: #2E7D32 !important; }

  .fc .fc-timegrid-event {
    border-radius: 6px !important;
    border: none !important;
    cursor: pointer !important;
    transition: box-shadow .15s ease !important;
    padding: 0 !important;
    margin: 1px 3px 1px 4px !important;
    overflow: hidden !important;
    box-shadow: 0 1px 2px rgba(0,0,0,.08) !important;
    min-height: 26px !important;
  }
  .fc .fc-timegrid-event:hover { box-shadow: 0 4px 12px rgba(0,0,0,.16) !important; z-index: 10 !important; }
  .fc .fc-timegrid-event-harness > .fc-timegrid-event { border-left: 3px solid transparent !important; }
  .fc .fc-timegrid-event .fc-event-main {
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    gap: 1px !important;
    padding: 4px 6px !important;
    height: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .fc .fc-timegrid-event .fc-event-time {
    font-size: 9px !important; font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: .3px !important; text-transform: uppercase !important;
    opacity: .75 !important;
    white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
  }
  .fc .fc-timegrid-event .fc-event-title {
    font-weight: 700 !important; font-size: 12px !important;
    line-height: 1.25 !important;
    white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
  }
  .fc .fc-timegrid-event .fc-event-destination {
    font-size: 10px !important; font-weight: 500 !important;
    opacity: .85 !important;
    white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
  }
  .fc .fc-timegrid-event .fc-event-from,
  .fc .fc-timegrid-event .fc-event-plate {
    font-size: 9px !important; opacity: .7 !important;
    white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
  }
  .fc .fc-timegrid-event .fc-event-status {
    font-size: 9px !important; font-weight: 700 !important;
    letter-spacing: .2px !important;
    display: inline-flex !important; align-items: center !important; gap: 4px !important;
    align-self: flex-start !important;
    padding: 0 !important; border-radius: 0 !important;
  }
  .fc .fc-timegrid-now-indicator-line { border-color: #D32F2F !important; border-width: 2px !important; }
  .fc .fc-timegrid-now-indicator-arrow { border-color: #D32F2F !important; border-width: 5px !important; top: -5px !important; }
  .fc .fc-timegrid-axis-frame { background: #FAFAFA !important; }
  .fc .fc-timegrid-axis-frame .fc-timegrid-axis-cushion {
    font-size: 9px !important; font-weight: 700 !important;
    color: #999999 !important; text-transform: uppercase !important;
  }
  .fc .fc-timegrid-all-day-events { min-height: 35px !important; background: #FFFFFF !important; padding: 2px !important; }
  .fc .fc-timegrid-all-day-event {
    border-radius: 6px !important; border: none !important;
    padding: 4px 8px !important;
    margin: 2px 3px !important;
    font-size: 12px !important; font-weight: 600 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
    min-height: 28px !important;
    display: flex !important; align-items: center !important;
  }
  .fc .fc-timegrid-all-day-event .fc-event-title { font-weight: 700 !important; font-size: 12px !important; }
  .fc .fc-timegrid-event, .fc .fc-timegrid-all-day-event { min-width: 0 !important; overflow: hidden !important; }

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
  .fc .fc-popover-title { font-size: 13px !important; font-weight: 700 !important; color: #000000 !important; }
  .fc .fc-popover-body { padding: 6px 10px !important; }
  .fc .fc-popover-body .fc-event { border-radius: 6px !important; padding: 6px 10px !important; margin: 3px 0 !important; min-height: 30px !important; }
  .fc .fc-popover-body .fc-event .fc-event-title { font-weight: 600 !important; font-size: 12px !important; }

  @media (max-width: 768px) {
    .fc .fc-col-header-cell-cushion { font-size: 10px !important; }
    .fc .fc-timegrid-event .fc-event-title { font-size: 11px !important; }
    .fc .fc-timegrid-event .fc-event-time { font-size: 9px !important; }
    .fc .fc-timegrid-axis { width: 35px !important; }
    .fc .fc-timegrid-axis-cushion { font-size: 9px !important; }
    .fc .fc-timegrid-slot-label { height: 40px !important; }
    .fc .fc-daygrid-day { min-height: 200px !important; }
    .fc .fc-daygrid-day-frame { min-height: 200px !important; }
    .fc .fc-timegrid-event { padding: 4px 6px !important; min-height: 32px !important; }
    .fc .fc-timegrid-all-day-event { font-size: 10px !important; padding: 2px 6px !important; min-height: 22px !important; }
  }

  @media (max-width: 640px) {
    .fc .fc-toolbar { flex-direction: column; gap: 8px; }
    .fc .fc-toolbar-chunk { display: flex; justify-content: center; width: 100%; }
    .fc .fc-daygrid-day-number { font-size: 12px !important; padding: 1px 4px !important; }
    .fc .fc-daygrid-day-frame { min-height: 160px !important; padding: 2px !important; }
    .fc .fc-col-header-cell { padding: 4px 0 !important; }
    .fc .fc-col-header-cell-cushion { font-size: 9px !important; }
    .fc .fc-timegrid-event { padding: 3px 4px !important; min-height: 28px !important; }
    .fc .fc-timegrid-event .fc-event-title { font-size: 10px !important; }
    .fc .fc-timegrid-event .fc-event-time { font-size: 8px !important; }
    .fc .fc-timegrid-now-indicator-line::before { display: none !important; }
    .fc .fc-daygrid-day { min-height: 160px !important; }
    .fc .fc-timegrid-all-day-event { font-size: 9px !important; padding: 2px 4px !important; min-height: 20px !important; }
  }
`;

const CalendarWrapper = styled.div`
  flex: 1;
  min-height: 600px;
  position: relative;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
`;

const StatsBar = styled.div`
  display: flex; gap: 8px; padding: 8px 12px;
  margin-bottom: 10px; background: #FFFFFF;
  border-radius: 10px; flex-wrap: wrap;
  border: 1px solid #E8ECEF; flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`;

const StatCard = styled.div`
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 12px 5px 6px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  color: ${p => p.color || '#111827'};
  background: ${p => (p.tint || p.color || '#F3F4F6')};
  border: 1px solid ${p => p.border || 'transparent'};
  white-space: nowrap;
`;

const StatIcon = styled.span`
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 6px;
  color: #FFFFFF; background: ${p => p.color || '#111827'};
  flex-shrink: 0;
`;

const HearseCalendar = ({ bookings = [], onItemClick, onCreateBooking, selectedDate, onDateSelect, onDateClick, month, onMonthChange }) => {
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const calendarRef = useRef(null);
  const wrapperRef = useRef(null);
  const lastReportedMonth = useRef(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (!api || !month) return;
    const current = api.getDate();
    if (current.getFullYear() === month.getFullYear() && current.getMonth() === month.getMonth()) return;
    api.gotoDate(month);
  }, [month]);

  const handleDatesSet = useCallback((arg) => {
    if (!onMonthChange) return;
    const view = arg?.view || {};
    const api = calendarRef.current?.getApi?.();
    const cursor = api && typeof api.getDate === 'function' ? api.getDate() : null;
    const d = cursor ? new Date(cursor)
      : view.currentStart ? new Date(view.currentStart)
        : view.currentEnd ? new Date(view.currentEnd)
          : new Date();
    const m = d.getMonth(), y = d.getFullYear();
    const key = `${y}-${m}`;
    if (lastReportedMonth.current === key) return;
    lastReportedMonth.current = key;
    onMonthChange(m, y);
  }, [onMonthChange]);

  const branchLookup = useMemo(() => {
    try {
      const branches = getBranches();
      const map = new Map();
      branches.forEach((b) => {
        const id = b.branchId || b.branch_id || b.id;
        const slug = b.branchSlug || b.branch_slug || '';
        const name = b.branchName || b.branch_name || b.name || '';
        if (id && name) map.set(`id:${String(id)}`, name);
        if (slug && name) map.set(`slug:${slug}`, name);
      });
      return map;
    } catch (e) { return new Map(); }
  }, []);

  const slugToReadableName = (slug) => {
    if (!slug) return '';
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  const resolveBranchName = (branchId, branchSlug, bookingBranchName) => {
    const GENERIC = new Set(['main branch', 'main', 'default', 'unknown', 'n/a', '—', '']);
    const name = (bookingBranchName || '').trim();
    if (name && !GENERIC.has(name.toLowerCase())) return name;
    if (branchId) {
      const byId = branchLookup.get(`id:${String(branchId)}`);
      if (byId) return byId;
    }
    if (branchSlug) {
      const bySlug = branchLookup.get(`slug:${branchSlug}`);
      if (bySlug) return bySlug;
      if (BRANCH_SLUG_TO_NAME[branchSlug]) return BRANCH_SLUG_TO_NAME[branchSlug];
      return slugToReadableName(branchSlug);
    }
    if (name && BR[name.toLowerCase()]) return BR[name.toLowerCase()].name;
    return name || 'Unknown';
  };

  const events = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.map((b) => {
      const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
      const bookingDates = getBookingDates(b);
      const startDate = bookingDates[0];
      if (!startDate) return null;

      const isAllDay = !String(startDate).includes('T') && !String(startDate).includes(':');
      let fcEnd = undefined;
      if (isAllDay) {
        if (bookingDates.length > 1) {
          const last = new Date(bookingDates[bookingDates.length - 1] + 'T00:00:00');
          last.setDate(last.getDate() + 1);
          fcEnd = toDateKey(last);
        }
      } else {
        const rawEnd = bookingDates[1] || b.end_date || b.estimated_arrival_time;
        fcEnd = rawEnd && rawEnd !== startDate ? rawEnd : undefined;
      }

      let startTime = '', endTime = '';
      try {
        const sd = new Date(startDate);
        if (!isNaN(sd.getTime())) startTime = sd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const ed = new Date(fcEnd || startDate);
        if (!isNaN(ed.getTime()) && fcEnd) endTime = ed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } catch (e) { }

      const hearseName = b.hearse_name || b.hearse_plate || b.plate_number || 'H';
      const clientName = (b.client_name || b.client || 'client').toString();
      const datePart = startDate ? String(startDate).split('T')[0]?.replace(/[-]/g, '') : 'nodate';
      const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const readableId = `BK-${hearseName}-${clientName}-${datePart}-${randPart}`;
      const resolvedBranchName = resolveBranchName(
        b.branch_id,
        b.booking_branch_slug || b.branch_slug || b.branchSlug,
        b.branch_name || b.branchName || b.hearse_branch_name || b.branch
      );

      const isMultiDay = bookingDates.length > 1 || (() => {
        if (bookingDates.length === 1) {
          const d = new Date(bookingDates[0]);
          return b.end_date && new Date(b.end_date).toDateString() !== d.toDateString();
        }
        return false;
      })();

      return {
        id: b.booking_id || b.id || `booking-${Math.random()}`,
        bookingId: readableId,
        title: b.client_name || b.client || 'Unknown Client',
        start: startDate,
        end: fcEnd,
        allDay: isAllDay,
        /* RICH saturated status colour — solid background (blue / orange /
           green / pink-red etc). Both FC's outer wrapper (this backgroundColor)
           AND the inner card (statusColor) use the same saturated hex, so the
           whole card fills with the rich colour. */
        backgroundColor: status.color,
        borderColor: status.color,
        textColor: '#FFFFFF',
        extendedProps: {
          ...b,
          status: b.status,
          statusLabel: status.label,
          statusColor: status.color,
          statusBg: status.bg,
          statusTextColor: status.textColor,
          dest: b.destination || b.to_location || '—',
          from: b.from_location || b.origin || '—',
          plate: b.plate_number || b.hearse_plate || b.number_plate || '—',
          branchName: resolvedBranchName,
          isMultiDay,
          multiDayDates: bookingDates,
          phone: b.client_phone || b.phone || '',
          clientName,
          startTime,
          endTime,
          bookingCode: readableId,
          hearseName,
        }
      };
    }).filter(e => e !== null && e.start);
  }, [bookings, branchLookup]);

  const getDailyStats = useCallback(() => {
    if (!selectedDate) return { total: 0, booked: 0, transit: 0, pending: 0, completed: 0 };
    const dateStr = selectedDate.split('T')[0];
    const dayBookings = bookings.filter((b) => {
      const dates = getBookingDates(b);
      return dates.some(d => d && String(d).split('T')[0] === dateStr);
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

  const handleDateClick = useCallback((info) => {
    const dateStr = info.dateStr.split('T')[0];
    if (onDateSelect) onDateSelect(dateStr);
    if (onDateClick) onDateClick(dateStr);
  }, [onDateSelect, onDateClick]);

  const handleEventClick = useCallback((info) => {
    if (onItemClick) onItemClick(info.event.extendedProps);
  }, [onItemClick]);

  const updateCalendarSize = useCallback(() => {
    const api = calendarRef.current?.getApi?.();
    if (api && typeof api.updateSize === 'function') {
      try { api.updateSize(); } catch (e) { }
    }
  }, []);

  const handleViewChange = useCallback((view) => {
    setCalendarView(view.type);
    requestAnimationFrame(updateCalendarSize);
    setTimeout(updateCalendarSize, 60);
    setTimeout(updateCalendarSize, 200);
  }, [updateCalendarSize]);

  useEffect(() => {
    updateCalendarSize();
    const frame = requestAnimationFrame(updateCalendarSize);
    const timers = [
      setTimeout(updateCalendarSize, 50),
      setTimeout(updateCalendarSize, 120),
      setTimeout(updateCalendarSize, 250),
      setTimeout(updateCalendarSize, 500),
      setTimeout(updateCalendarSize, 850),
      setTimeout(updateCalendarSize, 1200),
    ];
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      ro = new ResizeObserver(() => { requestAnimationFrame(updateCalendarSize); });
      ro.observe(wrapperRef.current);
    }
    window.addEventListener('resize', updateCalendarSize);
    window.addEventListener('orientationchange', updateCalendarSize);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateCalendarSize);
      window.removeEventListener('orientationchange', updateCalendarSize);
    };
  }, [updateCalendarSize]);

  useEffect(() => {
    updateCalendarSize();
    const t = setTimeout(updateCalendarSize, 100);
    return () => clearTimeout(t);
  }, [events, updateCalendarSize]);

  // ── Renderer ──────────────────────────────────────────────────────────────
  //
  // MONTH: SOLID RICH status colour fills the entire card, white text on top.
  //   • background = status.color (the RICH saturated hex — #00296B, #E36414,
  //     #132A13, #5F0F40, #DD2D4A, #d97706, #0c0b0f, #03071E)
  //   • color = #FFFFFF
  //   • same colour on the FC wrapper (via backgroundColor on the event object)
  //     AND the inner card (this renderer), so if either layer fails the other
  //     still paints — belt and suspenders.
  //
  // WEEK/DAY: unchanged multi-line detail card.
  const renderEventContent = useCallback((eventInfo) => {
    const isMonthView = calendarView === 'dayGridMonth';
    const props = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    const itemColor = props.statusColor || '#00296B';   // rich saturated hex

    if (isMonthView) {
      return (
        <div
          style={{
            width: '100%',
            minHeight: '62px',
            height: '100%',
            /* Solid rich status colour — no tint, no gradient, no shorthand
               trickery. `backgroundColor` alone is the most reliable way to
               paint and cannot be swallowed by FC's CSS. */
            backgroundColor: itemColor,
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '3px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
          title={`${props.clientName || 'Booking'} · ${props.hearseName || ''} (${props.statusLabel || ''})`}
        >
          {/* Line 1 — time (white, slightly muted) */}
          <span style={{
            fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {props.startTime || 'All Day'}{props.endTime ? ` – ${props.endTime}` : ''}
          </span>

          {/* Line 2 — client name (white, bold, headline) */}
          <span style={{
            fontSize: '14px', fontWeight: 700, color: '#FFFFFF',
            lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {props.clientName || 'Booking'}
          </span>

          {/* Line 3 — status + plate (white, bold uppercase) */}
          <span style={{
            fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.95)',
            textTransform: 'uppercase', letterSpacing: '0.4px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {props.statusLabel || ''}
            {props.plate && props.plate !== '—' ? ` · ${props.plate}` : ''}
          </span>
        </div>
      );
    }

    // ── Week / Day card (unchanged) ─────────────────────────────────────
    const isMultiDay = props.isMultiDay;
    const multiDayStyle = isMultiDay ? {
      background: `repeating-linear-gradient(45deg, ${itemColor}, ${itemColor} 4px, ${itemColor}dd 4px, ${itemColor}dd 8px)`,
      border: `2px solid ${itemColor}`,
    } : {};

    return (
      <div style={{
        padding: isAllDay ? '3px 6px' : '4px 6px',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start',
        overflow: 'hidden', gap: '1px',
        boxSizing: 'border-box',
        ...multiDayStyle
      }}>
        {isMultiDay && (
          <div style={{ fontSize: '7px', fontWeight: 700, color: itemColor, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Multi-Day
          </div>
        )}
        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '.3px',
          textTransform: 'uppercase', opacity: .75,
          display: 'flex', alignItems: 'center', gap: '3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          <Clock size={9} /> {props.startTime}{props.endTime ? ` – ${props.endTime}` : ''}
        </div>
        <div style={{
          fontWeight: 700, fontSize: '12px', lineHeight: 1.25,
          display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0
        }}>
          {props.statusLabel && (
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: itemColor, flexShrink: 0, display: 'inline-block'
            }} />
          )}
          <span style={{
            display: 'block', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, minWidth: 0
          }}>{props.clientName}</span>
        </div>
        {props.dest && props.dest !== '—' && (
          <div style={{
            fontSize: '10px', fontWeight: 500, opacity: .85,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: '3px'
          }}>
            <MapPin size={8} /> {props.dest}
          </div>
        )}
        {props.branchName && (
          <div style={{
            fontSize: '9px', opacity: .75,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: '3px'
          }}>
            <Building size={8} /> {props.branchName}
          </div>
        )}
        {!isAllDay && props.bookingCode && (
          <div style={{ fontSize: '7px', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
            {props.bookingCode}
          </div>
        )}
        {props.plate && props.plate !== '—' && (
          <div style={{
            fontSize: '7px', opacity: 0.6,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: '3px'
          }}>
            <Car size={8} /> {props.plate}
          </div>
        )}
      </div>
    );
  }, [calendarView]);

  const renderDayCell = useCallback((info) => {
    if (calendarView !== 'dayGridMonth') return;
    const dateStr = fmtDS(info.date);
    const hasEvents = bookings.some((b) => {
      const dates = getBookingDates(b);
      return dates.some(d => d && String(d).split('T')[0] === dateStr);
    });
    if (hasEvents) {
      info.el.style.setProperty('background-color', 'rgba(17, 24, 39, 0.02)', 'important');
      info.el.style.setProperty('border-radius', '6px', 'important');
    }
  }, [bookings, calendarView]);

  return (
    <Shell>
      {calendarView === 'timeGridDay' && selectedDate && dailyStats.total > 0 && (
        <StatsBar>
          <StatCard color="#00296B" tint="#EFF6FF" border="#DBEAFE">
            <StatIcon color="#00296B"><BarChart3 size={13} /></StatIcon>
            {dailyStats.total} Bookings
          </StatCard>
          {dailyStats.booked > 0 && (
            <StatCard color="#00296B" tint="#EFF6FF" border="#DBEAFE">
              <StatIcon color="#00296B"><CheckCircle size={13} /></StatIcon>
              {dailyStats.booked} Booked
            </StatCard>
          )}
          {dailyStats.transit > 0 && (
            <StatCard color="#E36414" tint="#FFEDD5" border="#FBD6B4">
              <StatIcon color="#E36414"><Truck size={13} /></StatIcon>
              {dailyStats.transit} In Transit
            </StatCard>
          )}
          {dailyStats.pending > 0 && (
            <StatCard color="#d97706" tint="#FFFBEB" border="#FDE68A">
              <StatIcon color="#d97706"><Clock size={13} /></StatIcon>
              {dailyStats.pending} Pending
            </StatCard>
          )}
          {dailyStats.completed > 0 && (
            <StatCard color="#5F0F40" tint="#FCE7F3" border="#E9B8D1">
              <StatIcon color="#5F0F40"><Check size={13} /></StatIcon>
              {dailyStats.completed} Completed
            </StatCard>
          )}
        </StatsBar>
      )}

      <CalendarWrapper ref={wrapperRef}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={month || undefined}
          datesSet={handleDatesSet}
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
              slotLabelInterval: '01:00:00',
              scrollTime: '06:00:00',
              expandRows: true,
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
              slotLabelInterval: '01:00:00',
              scrollTime: '06:00:00',
              expandRows: true,
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
          height={calendarView === 'dayGridMonth' ? 'auto' : 750}
          contentHeight={calendarView === 'dayGridMonth' ? 'auto' : 700}
          firstDay={0}
          weekends={true}
          nowIndicator={true}
          selectable={true}
          unselectAuto={true}
          dayMaxEvents={3}
          moreLinkText="+%d more"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          slotLabelInterval="01:00"
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
          eventMinHeight={62}
          eventMaxStack={10}
          slotEventOverlap={true}
          expandRows={false}
          stickyHeaderDates={true}
          weekNumbers={false}
          displayEventTime={false}
          displayEventEnd={false}
          forceEventDuration={true}
        />
      </CalendarWrapper>
    </Shell>
  );
};
export default HearseCalendar;