
import { toDateKey, formatTimeAmPm } from '../../utils/dates/parseDates';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import styled from 'styled-components';
import { getBranches } from '../../utils/globalAuth';
import { Calendar, CheckCircle, Truck, Clock, Check, BarChart3, MapPin, Home, Car, Phone, Building } from '../../utils/icons/icons';
import { STATUS_CONFIG } from './statusColors';

// ===== SHARED CONSTANTS =====
// STATUS_CONFIG below is imported from ./statusColors — the exact status →
// colour map used by the Day Timeline, so the monthly/weekly/day calendar
// views render every status with the same colour.
export { STATUS_CONFIG };

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

//  HELPER: Get booking dates safely 
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
    color: #6b7280 !important;
    cursor: pointer !important;
    padding: 1px 4px !important;
    border-radius: 4px !important;
    margin-top: 2px !important;
  }

  .fc .fc-daygrid-more-link:hover {
    background: #F3F4F6 !important;
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

  /* Week/Day view event card overflow fix */
  .fc .fc-timegrid-event,
  .fc .fc-timegrid-all-day-event {
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-main,
  .fc .fc-timegrid-all-day-event .fc-event-main {
    min-width: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-content,
  .fc .fc-timegrid-all-day-event .fc-event-content {
    min-width: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-title,
  .fc .fc-timegrid-all-day-event .fc-event-title {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    min-width: 0 !important;
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
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: #FFFFFF;
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid #E8ECEF;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`;

const StatCard = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px 5px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color || '#111827'};
  background: ${props => (props.tint || props.color || '#F3F4F6')};
  border: 1px solid ${props => props.border || 'transparent'};
  white-space: nowrap;
`;

const StatIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: #FFFFFF;
  background: ${props => props.color || '#111827'};
  flex-shrink: 0;
`;

// ===== MAIN CALENDAR COMPONENT =====
const HearseCalendar = ({ bookings = [], onItemClick, onCreateBooking, selectedDate, onDateSelect, onDateClick }) => {
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [selectedMultiDay, setSelectedMultiDay] = useState(null);
  const calendarRef = useRef(null);

  // Build a branch lookup map from cached branches to resolve branch_id → branch_name
  // Also maps branch_slug → branchName for slug-based lookups
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
        // Also map slug → name for partial slug matches
        if (slug && name) map.set(`slug:${slug}`, name);
      });
      return map;
    } catch (e) {
      return new Map();
    }
  }, []);

  // Extract a readable branch name from a slug like "org-home-machakos" → "Machakos"
  const slugToReadableName = (slug) => {
    if (!slug) return '';
    const parts = slug.split('-');
    // Take the last meaningful part (e.g., "machakos" from "org-home-machakos")
    const lastPart = parts[parts.length - 1];
    // Capitalize first letter
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  const resolveBranchName = (branchId, branchSlug, bookingBranchName) => {
    // Skip generic fallback names like "Main Branch", "Main", "Default"
    const GENERIC = new Set(['main branch', 'main', 'default', 'unknown', 'n/a', '—', '']);
    const name = (bookingBranchName || '').trim();
    if (name && !GENERIC.has(name.toLowerCase())) {
      return name;
    }
    // Lookup by branch ID
    if (branchId) {
      const byId = branchLookup.get(`id:${String(branchId)}`);
      if (byId) return byId;
    }
    // Lookup by branch slug (complete slug like "org-home-machakos")
    if (branchSlug) {
      const bySlug = branchLookup.get(`slug:${branchSlug}`);
      if (bySlug) return bySlug;
      // Try the global BRANCH_SLUG_TO_NAME map
      if (BRANCH_SLUG_TO_NAME[branchSlug]) return BRANCH_SLUG_TO_NAME[branchSlug];
      // Extract readable name from slug (last segment after dash)
      return slugToReadableName(branchSlug);
    }
    // If we have a generic name, try the legacy BR lookup
    if (name && BR[name.toLowerCase()]) return BR[name.toLowerCase()].name;
    // Last resort
    return name || 'Unknown';
  };

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

        // Detect multi-day bookings
        const bookingDates = getBookingDates(b);
        const isMultiDay = bookingDates.length > 1 || (() => {
          if (bookingDates.length === 1) {
            const d = new Date(bookingDates[0]);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            // Check if booking spans past midnight
            return b.end_date && new Date(b.end_date).toDateString() !== d.toDateString();
          }
          return false;
        })();

        return {
          id: b.booking_id || b.id || `booking-${Math.random()}`,
          bookingId: readableId,
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
            branchName: resolvedBranchName,
            isMultiDay,
            multiDayDates: bookingDates,
            phone: b.client_phone || b.phone || '',
            clientName: clientName,
            startTime,
            endTime,
            bookingCode: readableId,
            hearseName,
          }
        };
      })
      .filter(e => e !== null && e.start);
  }, [bookings, branchLookup]);

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

  // Handle event click - show multi-day overlay for multi-day bookings
  const handleEventClick = useCallback((info) => {
    const booking = info.event.extendedProps;
    if (booking.isMultiDay) {
      setSelectedMultiDay(booking);
    }
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

    const isMultiDay = props.isMultiDay;
    const multiDayStyle = isMultiDay ? {
      background: `repeating-linear-gradient(45deg, ${status.color}, ${status.color} 4px, ${status.color}dd 4px, ${status.color}dd 8px)`,
      border: `2px solid ${status.color}`,
    } : {};

    // Week/Day view - show full card with all details
    return (
      <div style={{
        padding: isAllDay ? '3px 6px' : '4px 8px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        gap: '1px',
        boxSizing: 'border-box',
        ...multiDayStyle
      }}>
        {isMultiDay && (
          <div style={{ fontSize: '7px', fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Multi-Day
          </div>
        )}
        <div style={{
          fontSize: isAllDay ? '9px' : '9px',
          fontWeight: 600,
          opacity: 0.85,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <Clock size={9} /> {props.startTime}{props.endTime ? ` - ${props.endTime}` : ''}
        </div>

        <div style={{
          fontWeight: 700,
          fontSize: isAllDay ? '11px' : '11px',
          lineHeight: 1.2,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          minWidth: 0
        }}>
          <span style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '55%',
            flex: 1,
            minWidth: 0
          }}>{props.clientName}</span>
          {props.statusLabel && (
            <span style={{
              fontSize: '7px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '3px',
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
            fontSize: isAllDay ? '8px' : '8px',
            opacity: 0.8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <MapPin size={8} /> {props.dest}
          </div>
        )}
        {props.branchName && (
          <div style={{
            fontSize: '8px',
            opacity: 0.75,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Building size={8} /> {props.branchName}
          </div>
        )}
        {!isAllDay && props.bookingCode && (
          <div style={{
            fontSize: '7px',
            opacity: 0.6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'monospace'
          }}>
            {props.bookingCode}
          </div>
        )}
        {props.from && props.from !== '—' && !isAllDay && (
          <div style={{
            fontSize: isAllDay ? '7px' : '7px',
            opacity: 0.65,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Home size={8} /> {props.from}
          </div>
        )}
        {props.plate && props.plate !== '—' && (
          <div style={{
            fontSize: isAllDay ? '7px' : '7px',
            opacity: 0.6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Car size={8} /> {props.plate}
          </div>
        )}
        {props.phone && props.phone !== '—' && !isAllDay && (
          <div style={{
            fontSize: '7px',
            opacity: 0.55,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Phone size={8} /> {props.phone}
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

    // Highlight booked dates with a subtle neutral tint (matches the
    // day-timeline status colours instead of a loud red wash)
    if (dayEvents.length > 0) {
      info.el.style.setProperty('background-color', 'rgba(17, 24, 39, 0.05)', 'important');
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
      <MultiDayOverlay booking={selectedMultiDay} onClose={() => setSelectedMultiDay(null)} />
    </Shell>
  );
};

// ===== MULTI-DAY BOOKING OVERLAY =====
const MULTI_DAY_PALETTE = ['#7C3AED', '#DB2777', '#0891B2', '#CA8A04', '#4F46E5', '#059669', '#DC2626', '#EA580C'];
const getMultiDayColor = (id) => {
  const hash = String(id || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MULTI_DAY_PALETTE[hash % MULTI_DAY_PALETTE.length];
};

const MultiDayOverlay = ({ booking, onClose }) => {
  if (!booking) return null;
  const dates = booking.multiDayDates || [];
  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  // Use a distinct multi-day color based on booking ID (not the status color)
  const multiDayColor = getMultiDayColor(booking.bookingId || booking.id);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', background: multiDayColor, borderRadius: '16px 16px 0 0', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Multi-Day Booking</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{booking.clientName || 'Unknown'}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: sc.bg || sc.color + '20', color: sc.color }}>{sc.label || booking.status}</span>
            {booking.branchName && <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>📍 {booking.branchName}</span>}
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '8px' }}>Booking Period</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {dates.length > 1 ? `${new Date(dates[0]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — ${new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : new Date(dates[0]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{dates.length} day{dates.length > 1 ? 's' : ''} total</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {booking.dest && booking.dest !== '—' && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Destination</div><div style={{ fontSize: '14px', color: '#111827' }}>{booking.dest}</div></div>}
            {booking.from && booking.from !== '—' && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>From</div><div style={{ fontSize: '14px', color: '#111827' }}>{booking.from}</div></div>}
            {booking.plate && booking.plate !== '—' && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Vehicle</div><div style={{ fontSize: '14px', color: '#111827' }}>{booking.plate}</div></div>}
            {booking.hearseName && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Hearse</div><div style={{ fontSize: '14px', color: '#111827' }}>{booking.hearseName}</div></div>}
            {booking.phone && booking.phone !== '—' && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Phone</div><div style={{ fontSize: '14px', color: '#111827' }}>{booking.phone}</div></div>}
            {booking.bookingCode && <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '4px' }}>Code</div><div style={{ fontSize: '14px', color: '#111827', fontFamily: 'monospace' }}>{booking.bookingCode}</div></div>}
          </div>
          {dates.length > 1 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '8px' }}>Daily Breakdown</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dates.map((d, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: i === 0 ? multiDayColor : i === dates.length - 1 ? multiDayColor + 'cc' : multiDayColor + '22', color: i === 0 || i === dates.length - 1 ? '#fff' : multiDayColor, fontSize: '11px', fontWeight: 600, border: `1px solid ${multiDayColor}44` }}>
                    Day {i + 1}: {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};