import { toDateKey, formatTimeAmPm } from '../../utils/dates/parseDates';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import styled from 'styled-components';
import { Calendar, Clock, BarChart3, MapPin, Home, Car, Building, Users } from '../../utils/icons/icons';
import { STATUS_CONFIG } from './statusColors';
import { BR, BRANCH_SLUG_TO_NAME, getBookingRoute } from './viewerShared';

export { STATUS_CONFIG };

export const COLORS = {

  white: '#FFFFFF', surface: '#ffffff', primary: '#1a5f7a', border: '#d1d5db',
  textSecondary: '#6b7280', successLight: '#d1fae5', primaryLight: '#2c8ac9',
  warningLight: '#fef3c7', warningDark: '#d97706', warning: '#f59e0b',
  textMuted: '#9ca3af', success: '#10b981', successDark: '#059669',
  danger: '#ef4444', dangerLight: '#fee2e2', dangerDark: '#dc2626',
  info: '#3b82f6', infoLight: '#dbeafe', infoDark: '#2563eb',
  primaryDark: '#134b5f', borderLight: '#e5e7eb',
  text: '#111827', bg: '#f5f7fa',

};

// Calendar booking colors identify the branch, while the status label remains
// visible as text. This makes bookings easy to distinguish at a glance.
export const getBranchBookingColor = (branchName, status) => {
  if (String(status || '').toLowerCase() === 'cancelled') return '#DD2D4A';
  const branch = String(branchName || '').trim().toLowerCase();
  if (branch.includes('machakos')) return '#E36414';
  if (branch.includes('thika')) return '#5F0F40';
  // Nairobi/main and unknown legacy branch names use the primary blue.
  return '#00296B';
};

const LINEUP_GRID_COLUMNS = 'minmax(150px, 1.15fr) minmax(110px, .8fr) minmax(140px, 1.1fr) minmax(155px, 1.2fr) minmax(80px, .55fr) minmax(165px, 1fr)';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
export const START_HOUR = 6, END_HOUR = 22;
export const HOUR_H = 60, TIME_W = 65;


export const pad = n => String(n).padStart(2, '0');
export const fmtDS = toDateKey;
export const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

export const getInitials = n => { if (!n) return '?'; const p = n.split(' '); return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase(); };
export const fmtHour = h => h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h - 12) + ' PM';


export const getTimeInfo = b => {

  let s = '', e = '';
  if (b.booking_dates) { try { const d = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates; if (Array.isArray(d) && d.length) { s = d[0]; if (d.length > 1) e = d[1]; } } catch (x) { } }
  if (b.from_timestamp) s = b.from_timestamp;
  if (b.to_timestamp) e = b.to_timestamp;
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
    vertical-align: top !important;
    overflow: visible !important;
  }
  .fc .fc-daygrid-day:hover { background: #F9FAFB; }

  .fc .fc-daygrid-day-frame {
    padding: 4px !important;
    min-height: 120px !important;
    box-sizing: border-box !important;
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
  .fc .fc-daygrid-day.fc-day-has-bookings { background: rgba(17, 24, 39, 0.02) !important; }
  .fc .fc-daygrid-day.fc-day-fully-booked { background: #FECACA !important; }
  .fc .fc-daygrid-day.fc-day-fully-booked .fc-daygrid-day-number {
    background: #DC2626 !important;
    color: #FFFFFF !important;
  }
  .fc .fc-daygrid-day.fc-day-fully-booked.fc-day-today .fc-daygrid-day-number {
    background: #DC2626 !important;
    color: #FFFFFF !important;
  }
  .fc .fc-daygrid-day-other .fc-daygrid-day-number { opacity: 0.35 !important; }

  .fc .fc-daygrid-day-events {
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Keep FullCalendar's flex wrappers and event harness sizing intact. */
  .fc .fc-daygrid-event {
    padding: 0 !important;
    margin: 2px 0 !important;
    border: none !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    cursor: pointer !important;
    color: #FFFFFF !important;
  }

  /* Only customize paint; leave FullCalendar's event wrapper layout untouched. */
  .fc .fc-daygrid-event .fc-event-main,
  .fc .fc-daygrid-event .fc-event-main-frame {
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
    .fc .fc-timegrid-event { padding: 4px 6px !important; min-height: 32px !important; }
    .fc .fc-timegrid-all-day-event { font-size: 10px !important; padding: 2px 6px !important; min-height: 22px !important; }
  }

  @media (max-width: 640px) {
    .fc .fc-toolbar { flex-direction: column; gap: 8px; }
    .fc .fc-toolbar-chunk { display: flex; justify-content: center; width: 100%; }
    .fc .fc-daygrid-day-number { font-size: 12px !important; padding: 1px 4px !important; }
    .fc .fc-daygrid-day-frame { min-height: 100px !important; padding: 2px !important; }
    .fc .fc-col-header-cell { padding: 4px 0 !important; }
    .fc .fc-col-header-cell-cushion { font-size: 9px !important; }
    .fc .fc-timegrid-event { padding: 3px 4px !important; min-height: 28px !important; }
    .fc .fc-timegrid-event .fc-event-title { font-size: 10px !important; }
    .fc .fc-timegrid-event .fc-event-time { font-size: 8px !important; }
    .fc .fc-timegrid-now-indicator-line::before { display: none !important; }
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

const DaySchedule = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);
  align-items: start;
  gap: 18px;
  min-height: 600px;
  padding: 0 4px 20px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DailyFleetPanel = styled.section`
  min-width: 0;
  overflow: hidden;
  border: 1px solid #ece7ea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 17, 20, .03);
  display: flex;
  flex-direction: column;
`;

const DailyFleetHeader = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 15px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  h2 { margin: 0; color: #0f172a; font-size: 14px; font-weight: 800; }
  p { margin: 3px 0 0; color: #64748b; font-size: 10px; font-weight: 600; }
  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const DailyFleetCounts = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
`;

const DailyFleetCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid ${p => p.$tone === 'booked' ? '#ffe4e6' : p.$tone === 'service' ? '#fef3c7' : '#dcfce7'};
  border-radius: 6px;
  background: ${p => p.$tone === 'booked' ? '#fff1f2' : p.$tone === 'service' ? '#fffbeb' : '#f0fdf4'};
  color: ${p => p.$tone === 'booked' ? '#be123c' : p.$tone === 'service' ? '#b45309' : '#15803d'};
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
`;

const DailyFleetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
`;

const FleetSectionLabel = styled.div`
  padding: 5px 2px 1px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
`;

const DailyFleetItem = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: ${p => p.$booked ? '#f8fafc' : '#fff'};
  opacity: ${p => p.$booked ? '.92' : '1'};
`;

const DailyFleetDot = styled.span`
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-radius: 50%;
  background: ${p => p.$tone === 'booked' ? '#f43f5e' : p.$tone === 'service' ? '#fbbf24' : '#10b981'};
  box-shadow: 0 0 0 4px ${p => p.$tone === 'booked' ? '#fff1f2' : p.$tone === 'service' ? '#fffbeb' : '#ecfdf5'};
`;

const DailyFleetVehicle = styled.div`
  min-width: 0;
  flex: 1;
`;

const DailyFleetTopLine = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
`;

const DailyFleetPlate = styled.span`
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid #d97706;
  border-bottom-width: 2px;
  border-radius: 4px;
  background: #fbbf24;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .04em;
`;

const DailyFleetCapacity = styled.span`
  overflow: hidden;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

const DailyFleetName = styled.div`
  overflow: hidden;
  margin-top: 3px;
  color: ${p => p.$booked ? '#475569' : '#1e293b'};
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DailyFleetBooking = styled.div`
  overflow: hidden;
  margin-top: 3px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DailyFleetState = styled.div`
  flex: 0 0 auto;
  text-align: right;
  strong {
    display: block;
    color: ${p => p.$tone === 'booked' ? '#e11d48' : p.$tone === 'service' ? '#d97706' : '#059669'};
    font-size: 11px;
    font-weight: 800;
  }
  span { display: block; margin-top: 2px; color: #64748b; font-size: 9px; font-weight: 600; }
`;

const DailyView = styled.div`
  padding: 8px 4px 20px;
`;

const DailyHeading = styled.div`
  margin: 0 0 14px;
`;

const DailyHeadingActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 9px;
  min-width: 0;
  @media (max-width: 420px) { gap: 7px; }
`;

const StandbyControl = styled.div`
  display: flex;
  min-width: 0;
  justify-content: flex-end;
  margin-left: auto;
  @media (max-width: 420px) { width: 100%; }
`;

const StandbyEditor = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  label { color: #475569; font-size: 10px; font-weight: 800; white-space: nowrap; }
  input {
    width: 150px;
    min-width: 0;
    min-height: 30px;
    padding: 0 9px;
    border: 1px solid #d0d5dd;
    border-radius: 5px;
    background: #fff;
    color: #101828;
    font: inherit;
    font-size: 10px;
  }
  input:focus { outline: 2px solid #bfdbfe; border-color: #60a5fa; }
  @media (max-width: 420px) { width: 100%; input { flex: 1; } }
`;

const StandbyBadge = styled.div`
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 7px;
  padding: 3px 5px 3px 4px;
  border: 1px solid #86efac;
  border-radius: 999px;
  background: #f0fdf4;
  color: #166534;
  .icon {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 50%;
    background: #16a34a;
    color: #fff;
  }
  .label { color: #15803d; font-size: 8px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .name { max-width: 150px; overflow: hidden; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
  button {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    padding: 0 7px;
    border: 1px solid #bbf7d0;
    border-radius: 999px;
    background: #fff;
    color: #166534;
    font: inherit;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
  }
  button:hover { background: #dcfce7; }
`;

const ViewSwitchButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid ${p => p.$active ? '#101828' : '#d0d5dd'};
  border-radius: 5px;
  background: ${p => p.$active ? '#101828' : '#fff'};
  color: ${p => p.$active ? '#fff' : '#344054'};
  font: inherit;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: ${p => p.$active ? '#1e293b' : '#f9fafb'}; }
`;

const DateStrip = styled.div`
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #e4e7ec;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, .04), 0 8px 24px rgba(16, 24, 40, .04);
`;

const SelectedDateBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 11px;
  border: 1px solid #abefc6;
  border-radius: 5px;
  background: #ecfdf3;
  color: #054f31;
  .dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: #12b76a; box-shadow: 0 0 0 3px rgba(18, 183, 106, .12); }
  .label { color: #027a48; font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .date { font-size: 11px; font-weight: 700; white-space: nowrap; }
  @media (max-width: 560px) {
    gap: 6px;
    padding: 6px 8px;
    .date { font-size: 10px; }
    .label { display: none; }
  }
`;

const TodayButton = styled.button`
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid #101828;
  border-radius: 5px;
  background: #101828;
  color: #fff;
  font: inherit;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  &:hover { border-color: #1d2939; background: #1d2939; }
  &:disabled { cursor: not-allowed; opacity: .55; }
  @media (max-width: 560px) { min-height: 27px; padding: 0 8px; }
`;

const DateStripDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  width: 100%;
`;

const DateStripButton = styled.button`
  display: flex;
  min-width: 0;
  min-height: 74px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 3px;
  border: 0;
  border-right: 1px solid #f0f2f5;
  background: ${p => p.$fullyBooked ? '#fecaca' : p.$today ? '#12b76a' : p.$active ? '#eef2f6' : p.$weekend ? '#fcfcfd' : '#fff'};
  color: ${p => p.$fullyBooked ? '#991b1b' : p.$today ? '#fff' : '#344054'};
  cursor: pointer;
  font: inherit;
  transition: background .15s ease;
  &:last-child { border-right: 0; }
  .dow { color: ${p => p.$fullyBooked ? '#991b1b' : p.$today ? '#d1fadf' : '#98a2b3'}; font-size: 9px; font-weight: 700; letter-spacing: .06em; line-height: 1; text-transform: uppercase; }
  .day { color: ${p => p.$fullyBooked ? '#991b1b' : p.$today ? '#fff' : '#344054'}; font-size: 16px; font-weight: ${p => p.$active || p.$today ? 750 : 550}; line-height: 1.2; }
  .event-dot { width: 4px; height: 4px; border-radius: 1px; background: ${p => p.$fullyBooked ? '#dc2626' : p.$today ? '#fff' : '#475467'}; }
  .event-dot.empty { visibility: hidden; }
  .availability {
    color: ${p => p.$today ? '#e6fff0' : p.$free === 0 ? '#b91c1c' : p.$free < 3 ? '#b45309' : '#667085'};
    font-size: 8px;
    font-weight: 700;
    white-space: nowrap;
  }
  &:hover { background: ${p => p.$fullyBooked ? '#fca5a5' : p.$today ? '#0e9f5a' : p.$active ? '#e4e7ec' : '#f9fafb'}; }
  @media (max-width: 560px) { min-height: 66px; gap: 4px; padding: 7px 1px; .dow { font-size: 8px; } .day { font-size: 14px; } .availability { font-size: 7px; } }
`;

const DayPanel = styled.section`
  min-width: 0;
  overflow-x: ${p => p.$lineup ? 'auto' : 'hidden'};
  overflow-y: hidden;
  border: 1px solid #ece7ea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 17, 20, .03);
`;

const LineupTableHeader = styled.div`
  display: grid;
  grid-template-columns: ${LINEUP_GRID_COLUMNS};
  min-width: 1050px;
  padding: 0 8px;
  background: #15171A;
  color: #FAF8F4;
  span {
    padding: 14px 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
`;

const BookingToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f2f4;
  background: #fff;
  h3 { margin: 0; color: #111827; font-size: 14px; font-weight: 800; }
  span { color: #9ca3af; font-size: 11px; font-weight: 600; }
`;

const FleetAction = styled.button`
  width: calc(100% - 28px);
  min-height: 38px;
  margin: 12px 14px 14px;
  border: 1px solid #0f172a;
  border-radius: 9px;
  background: #0f172a;
  color: #fff;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #1e293b; }
`;

const DayPanelHeader = styled.div`
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid #f1f2f4;

  h2 { margin: 2px 0 0; color: #111827; font-size: 15px; font-weight: 800; }
  p { margin: 0; color: #9ca3af; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  span { color: #8a8f98; font-size: 11px; font-weight: 700; white-space: nowrap; }
`;

const BackToCalendar = styled.button`
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid #101828;
  border-radius: 5px;
  background: #101828;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background .15s ease, border-color .15s ease;
  &:hover { background: #1d2939; border-color: #1d2939; }
`;

const DayBookingRow = styled.button`
  display: ${p => p.$lineup ? 'grid' : 'block'};
  grid-template-columns: ${p => p.$lineup ? LINEUP_GRID_COLUMNS : 'none'};
  align-items: stretch;
  width: 100%;
  min-width: ${p => p.$lineup ? '1050px' : '0'};
  margin: 0;
  padding: ${p => p.$lineup ? '0 8px' : '0'};
  border: 0;
  border-bottom: 1px solid #E3DDD0;
  border-radius: 0;
  background: ${p => p.$lineup ? p.$stripe ? '#F3EFE6' : '#FAF8F4' : '#fff'};
  color: #15171A;
  cursor: pointer;
  font: inherit;
  text-align: left;
  overflow: hidden;
  transition: ${p => p.$lineup ? 'background .15s ease' : 'none'};
  &:hover { background: ${p => p.$lineup ? '#EBEFEF' : '#fff'}; }
  &:focus-visible { outline: 2px solid #3D4F47; outline-offset: -2px; }
`;

const DayBookingHeader = styled.span`
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 16px;
  background: #0f172a;
  color: #FAF8F4;
  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
`;

const LineupPlate = styled.span`
  color: #8B7355;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  white-space: nowrap;
`;

const LineupCell = styled.span`
  display: flex;
  min-width: 0;
  min-height: 58px;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border-right: 1px solid rgba(227, 221, 208, .7);
  color: #6B6862;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  &:last-child { border-right: 0; }
`;

const LineupHearseName = styled.strong`
  color: #15171A;
  font-size: 13px;
  font-weight: 600;
`;

const LineupDriver = styled.span`
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: #15171A;
  font-size: 12px;
  font-weight: 600;
  .initials {
    display: inline-grid;
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    place-items: center;
    border-radius: 50%;
    background: #3D4F47;
    color: #FAF8F4;
    font-size: 9px;
    font-weight: 600;
  }
  .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  &.unassigned { color: #6B6862; font-size: 11px; font-style: italic; font-weight: 400; }
  small { color: #6B6862; font-size: 10px; font-weight: 400; }
`;

const DayBookingVehicle = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`;

const DayBookingVehicleText = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
`;

const HearseTitle = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HearsePlateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border: 1px solid #d97706;
  border-radius: 5px;
  border-bottom-width: 2px;
  background: #fbbf24;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .06em;
  line-height: 1;
  white-space: nowrap;
`;

const DayBookingMeta = styled.span`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  @media (max-width: 520px) { width: 100%; justify-content: flex-start; }
`;

const DayBranchBadge = styled.span`
  max-width: 190px;
  overflow: hidden;
  padding: 5px 9px;
  border: 1px solid #334155;
  border-radius: 6px;
  background: #1e293b;
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DayBookingBody = styled.span`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, .85fr) minmax(0, 1fr);
  gap: 18px;
  padding: 16px;
  background: #fff;
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 13px;
    padding: 14px 12px;
  }
`;

const DayDetail = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  padding-right: 14px;
  border-right: 1px solid #f1f5f9;
  &:last-child { padding-right: 0; border-right: 0; }
  strong {
    color: #94a3b8;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  & > span {
    overflow-wrap: anywhere;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.45;
  }
  @media (max-width: 760px) {
    padding: 0;
    border: 0;
  }
`;

const DayRoute = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  & > span {
    max-width: 100%;
    padding: 4px 7px;
    border: 1px solid #e0e7ff;
    border-radius: 5px;
    background: #eef2ff;
    color: #3730a3;
    font-size: 11px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  & > b { color: #94a3b8; font-size: 13px; }
`;

const DayClient = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  & > span:first-child { color: #0f172a; font-size: 12px; font-weight: 800; }
  & > span:last-child {
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
  }
`;

const DayBookingSchedule = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  & > span:first-child { color: #0f172a; font-size: 12px; font-weight: 700; }
  & > span:last-child { color: #64748b; font-size: 11px; }
`;

const DayDriver = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  padding: 6px 7px;
  border: 1px solid #e0e7ff;
  border-radius: 7px;
  background: #eef2ff;
  color: #312e81;
  font-size: 11px;
  font-weight: 750;
  & > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    overflow: hidden;
    color: #6366a2;
    font-size: 10px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DayDriverInitials = styled.span`
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border-radius: 50%;
  background: #4f46e5;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
`;

const DayDriverInfo = styled.span`
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 5px;
`;

const DayAssistant = styled.span`
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 10px;
  }
`;

const EmptyDay = styled.div`
  padding: 28px 20px;
  color: #8a8f98;
  font-size: 12px;
  font-weight: 600;
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

// ══ V3 MONTH GRID COMPONENTS (replaces FullCalendar rendering) ══════════════
// The colored card is a PLAIN <div> with inline style={{ backgroundColor }}.
// Inline styles win over every stylesheet rule except !important — this is
// the bulletproof approach that makes status colours render correctly.
const MonthToolbar = styled.div`
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

const MonthTable = styled.table`
  width: 100%; border-collapse: collapse; table-layout: fixed;
  thead th {
    background: #FFFFFF; border-bottom: 1px solid #EEEEEE;
    border-top: 2px solid transparent; padding: 8px 4px;
    font-size: 13px; font-weight: 700; color: #000000; text-align: center;
  }
  thead th.today { border-top-color: #2E7D32; color: #2E7D32; }
`;

const MonthCell = styled.td`
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

const MonthMoreLink = styled.span`
  display: inline-block; margin-top: 4px; padding: 3px 6px;
  background: #EFF6FF; color: #00296B; border-radius: 4px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  &:hover { background: #DBEAFE; }
`;

// THE COLORED CARD — plain <div> with inline backgroundColor.
// Cannot be overridden by CSS except via !important.
const MonthEventCard = ({ color, hearseName, plate, routeFrom, routeTo, pickupTime, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: color,
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
    }}>{hearseName}</div>
    {plate && plate !== '\u2014' && (
      <div style={{
        fontSize: '10px', color: 'rgba(255,255,255,0.85)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
      }}>{plate}</div>
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
      }}>{pickupTime}</div>
    )}
  </div>
);

const HearseCalendar = ({
  bookings = [],
  allBookings = bookings,
  hearses = [],
  branches = [],
  drivers = [],
  standbyDriverId = '',
  standbyDriverName = '',
  lineupLoading = false,
  savingStandby = false,
  onSaveStandby,
  onItemClick,
  onCreateBooking,
  selectedDate,
  onDateSelect,
  onDateClick,
  month,
  onMonthChange,
}) => {
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [dayViewDate, setDayViewDate] = useState(null);
  const [dayViewMode, setDayViewMode] = useState('schedule');
  const [editingStandby, setEditingStandby] = useState(false);
  const [standbyDraft, setStandbyDraft] = useState('');
  // ══ V3 MONTH GRID HOOKS ═══════════════════════════════════════════════════
  // These power the plain-HTML month grid that replaces FullCalendar.
  // The colored cards use inline backgroundColor — bulletproof against CSS.
  const visibleMonth = month || new Date();
  const todayKey = toDateKey(new Date());
  const MAX_EVENTS_PER_CELL_V3 = 3;
  const FULLY_BOOKED_THRESHOLD_V3 = 4;

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
    return map;
  }, [bookings]);

  const goToMonthV3 = useCallback((delta) => {
    const d = new Date(visibleMonth);
    d.setMonth(d.getMonth() + delta);
    onMonthChange?.(d.getMonth(), d.getFullYear());
  }, [visibleMonth, onMonthChange]);

  const goToTodayV3 = useCallback(() => {
    const d = new Date();
    onMonthChange?.(d.getMonth(), d.getFullYear());
  }, [onMonthChange]);

  const todayDowV3 = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() !== visibleMonth.getFullYear()
      || now.getMonth() !== visibleMonth.getMonth()) return -1;
    return now.getDay();
  }, [visibleMonth]);

  const formatPickupTimeV3 = (startDate) => {
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

  const renderMonthEvent = (b) => {
    const route = getBookingRoute(b);
    const branchName = resolveBranchName(
      b.branch_id,
      b.booking_branch_slug || b.branch_slug || b.branchSlug || b.branch,
      b.branch_name || b.branchName || b.hearse_branch_name || b.branch
    );
    const hearseName = b.hearse_name || b.hearse?.name || b.vehicle_name || 'Hearse';
    const plate = b.plate_number || b.hearse_plate || b.number_plate || '';
    const startDate = b.from_timestamp || getBookingDates(b)[0];
    const pickupTime = formatPickupTimeV3(startDate);
    return (
      <MonthEventCard
        key={String(b.booking_id || b.id || Math.random())}
        color={getBranchBookingColor(branchName, b.status)}
        hearseName={hearseName}
        plate={plate}
        routeFrom={route.from}
        routeTo={route.to}
        pickupTime={pickupTime}
        onClick={(e) => { e.stopPropagation(); onItemClick?.(b); }}
      />
    );
  };


  useEffect(() => {
    setEditingStandby(false);
    const assigned = drivers.find((driver) =>
      String(driver.driver_id ?? driver.id) === String(standbyDriverId ?? '')
    );
    setStandbyDraft(
      standbyDriverName
      || assigned?.driver_name
      || assigned?.full_name
      || (standbyDriverId ? `Driver ${standbyDriverId}` : '')
    );
  }, [dayViewDate, drivers, standbyDriverId, standbyDriverName]);
  const calendarRef = useRef(null);
  const wrapperRef = useRef(null);
  const lastReportedMonth = useRef(null);
  const sizeUpdateFrame = useRef(null);

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
    const map = new Map();
    branches.forEach((branch) => {
      const name = String(branch?.branch_name || branch?.branchName || branch?.name || '').trim();
      if (!name) return;
      [
        branch?.branch_id, branch?.branchId, branch?.id,
        branch?.branch_slug, branch?.branchSlug, branch?.slug,
        branch?.branch_db_name, branch?.branchDbName, branch?.branch_code, branch?.branchCode,
      ].forEach((key) => {
        if (key != null && key !== '') map.set(String(key).toLowerCase(), name);
      });
    });
    return map;
  }, [branches]);

  const resolveBranchName = (branchId, branchSlug, bookingBranchName) => {
    const genericNames = new Set(['main branch', 'main', 'default', 'unknown', 'n/a', '—', '']);
    const name = String(bookingBranchName || '').trim();
    if (name && !genericNames.has(name.toLowerCase())) return name;
    for (const key of [branchId, branchSlug]) {
      if (key == null || key === '') continue;
      const resolved = branchLookup.get(String(key).toLowerCase());
      if (resolved && !genericNames.has(resolved.toLowerCase())) return resolved;
    }
    if (branchSlug && BRANCH_SLUG_TO_NAME[String(branchSlug).toLowerCase()]) {
      return BRANCH_SLUG_TO_NAME[String(branchSlug).toLowerCase()];
    }
    if (name && BR[name.toLowerCase()]) return BR[name.toLowerCase()].name;
    if (branchSlug) {
      const lastPart = String(branchSlug).split('-').pop();
      if (lastPart) return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }
    return name || 'Unknown';
  };

  const events = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.map((b, index) => {
      const bookingDates = getBookingDates(b);
      const startDate = b.from_timestamp || bookingDates[0];
      if (!startDate) return null;

      const isAllDay = !String(startDate).includes('T') && !String(startDate).includes(':');
      let fcEnd = undefined;
      if (bookingDates.length > 1) {
        const last = new Date(bookingDates[bookingDates.length - 1] + 'T00:00:00');
        last.setDate(last.getDate() + 1);
        fcEnd = toDateKey(last);
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

      const hearseName = b.hearse_name || 'Hearse';
      const clientName = (b.client_name || b.client || 'client').toString();
      const datePart = startDate ? String(startDate).split('T')[0]?.replace(/[-]/g, '') : 'nodate';
      const stableId = b.booking_code || b.booking_id || b.id || `${clientName}-${datePart}-${index}`;
      const readableId = b.booking_code || `BK-${hearseName}-${clientName}-${datePart}-${stableId}`;
      const resolvedBranchName = resolveBranchName(
        b.branch_id,
        b.booking_branch_slug || b.branch_slug || b.branchSlug || b.branch,
        b.branch_name || b.branchName || b.hearse_branch_name || b.branch
      );
      const branchColor = getBranchBookingColor(resolvedBranchName, b.status);

      const isMultiDay = bookingDates.length > 1 || (() => {
        if (bookingDates.length === 1) {
          const d = new Date(bookingDates[0]);
          return b.end_date && new Date(b.end_date).toDateString() !== d.toDateString();
        }
        return false;
      })();
      const route = getBookingRoute(b);

      return {
        id: String(b.booking_id || b.id || `booking-${clientName}-${datePart}-${index}`),
        bookingId: readableId,
        title: hearseName,
        start: startDate,
        end: fcEnd,
        allDay: isAllDay,
        /* Branch color is used consistently by the outer event and inner card. */
        backgroundColor: branchColor,
        borderColor: branchColor,
        textColor: '#FFFFFF',
        extendedProps: {
          ...b,
          status: b.status,
          statusColor: branchColor,
          branchColor,
          from: route.from,
          dest: route.to,
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
  const standbyDriver = standbyDriverId != null && String(standbyDriverId) !== ''
    ? drivers.find((driver) => String(driver.driver_id ?? driver.id) === String(standbyDriverId))
    : null;
  const registeredDrivers = drivers.filter((driver) =>
    /^[1-9]\d*$/.test(String(driver.driver_id ?? driver.id ?? ''))
  );
  const resolvedStandbyDriverName = standbyDriverName || (standbyDriver
    ? standbyDriver.driver_name || standbyDriver.full_name || `Driver ${standbyDriverId}`
    : standbyDriverId ? `Driver ${standbyDriverId}` : '');
  const dayBookings = useMemo(() => {
    if (!dayViewDate) return [];
    return bookings
      .filter((booking) => getBookingDates(booking).some((date) => String(date).slice(0, 10) === dayViewDate))
      .sort((a, b) => {
        const aTime = getTimeInfo(a).sm;
        const bTime = getTimeInfo(b).sm;
        return aTime - bTime;
      });
  }, [bookings, dayViewDate]);
  const dayFleet = useMemo(() => {
    if (!dayViewDate) return { free: [], busy: [], unavailable: [] };
    const activeStatuses = new Set(['pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress']);
    const unavailableStatuses = new Set(['maintenance', 'out_of_service', 'disabled', 'inactive']);
    const bookedHearses = new Map();
    (allBookings || []).forEach((booking) => {
      if (!activeStatuses.has(String(booking.status || '').toLowerCase())) return;
      if (!getBookingDates(booking).some((date) => String(date).slice(0, 10) === dayViewDate)) return;
      const hearseId = booking.hearse_id ?? booking.hearseId ?? booking.hearse?.id;
      if (hearseId != null && !bookedHearses.has(String(hearseId))) {
        bookedHearses.set(String(hearseId), booking);
      }
    });

    return (hearses || []).reduce((result, hearse) => {
      const id = String(hearse.id ?? hearse.hearse_id ?? '');
      const booking = bookedHearses.get(id);
      const status = String(hearse.status || '').toLowerCase();
      if (unavailableStatuses.has(status)) result.unavailable.push(hearse);
      else if (booking) result.busy.push({ hearse, booking });
      else result.free.push(hearse);
      return result;
    }, { free: [], busy: [], unavailable: [] });
  }, [allBookings, dayViewDate, hearses]);
  const weekDates = useMemo(() => {
    if (!dayViewDate) return [];
    const start = new Date(`${dayViewDate}T00:00:00`);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return toDateKey(date);
    });
  }, [dayViewDate]);
  const weeklyAvailability = useMemo(() => {
    const activeStatuses = new Set(['pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress']);
    const unavailableStatuses = new Set(['maintenance', 'out_of_service', 'disabled', 'inactive']);
    return weekDates.reduce((availability, dateKey) => {
      const bookedHearses = new Set(
        (allBookings || [])
          .filter((booking) => activeStatuses.has(String(booking.status || '').toLowerCase()))
          .filter((booking) => getBookingDates(booking).some((date) => String(date).slice(0, 10) === dateKey))
          .map((booking) => booking.hearse_id ?? booking.hearseId ?? booking.hearse?.id)
          .filter((id) => id != null)
          .map(String)
      );
      availability[dateKey] = (hearses || []).filter((hearse) => {
        const id = String(hearse.id ?? hearse.hearse_id ?? '');
        return !unavailableStatuses.has(String(hearse.status || '').toLowerCase()) && !bookedHearses.has(id);
      }).length;
      return availability;
    }, {});
  }, [allBookings, hearses, weekDates]);
  const visibleDayBookings = dayBookings;

  const selectDay = useCallback((dateKey) => {
    setDayViewDate(dateKey);
    onDateSelect?.(dateKey);
    onDateClick?.(dateKey);
  }, [onDateClick, onDateSelect]);

  const handleDateClick = useCallback((info) => {
    const dateStr = info.dateStr.split('T')[0];
    setDayViewDate(dateStr);
    if (onDateSelect) onDateSelect(dateStr);
    if (onDateClick) onDateClick(dateStr);
  }, [onDateSelect, onDateClick]);

  const handleEventClick = useCallback((info) => {
    if (onItemClick) onItemClick(info.event.extendedProps);
  }, [onItemClick]);

  const updateCalendarSize = useCallback(() => {
    if (sizeUpdateFrame.current !== null) cancelAnimationFrame(sizeUpdateFrame.current);
    sizeUpdateFrame.current = requestAnimationFrame(() => {
      sizeUpdateFrame.current = null;
      calendarRef.current?.getApi?.()?.updateSize();
    });
  }, []);

  const handleViewChange = useCallback((view) => {
    setCalendarView(view.type);
  }, [updateCalendarSize]);

  useEffect(() => {
    updateCalendarSize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      let lastWidth = wrapperRef.current.getBoundingClientRect().width;
      ro = new ResizeObserver(([entry]) => {
        const width = entry?.contentRect.width;
        if (width !== undefined && Math.abs(width - lastWidth) > 0.5) {
          lastWidth = width;
          updateCalendarSize();
        }
      });
      ro.observe(wrapperRef.current);
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateCalendarSize();
    };
    window.addEventListener('resize', updateCalendarSize);
    window.addEventListener('orientationchange', updateCalendarSize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (sizeUpdateFrame.current !== null) {
        cancelAnimationFrame(sizeUpdateFrame.current);
        sizeUpdateFrame.current = null;
      }
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateCalendarSize);
      window.removeEventListener('orientationchange', updateCalendarSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateCalendarSize]);

  useEffect(() => {
    updateCalendarSize();
    const t = setTimeout(updateCalendarSize, 100);
    return () => clearTimeout(t);
  }, [events, updateCalendarSize]);

  // ── Renderer ──────────────────────────────────────────────────────────────
  //
  // MONTH: solid branch colour fills the entire card, with white text on top.
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

    const itemColor = props.branchColor || '#00296B';

    if (isMonthView) {
      const from = props.from || '—';
      const dest = props.dest || '—';
      return (
        <div
          style={{
            width: '100%',
            minHeight: '62px',
            /* Solid branch colour keeps each branch visually distinct. */
            backgroundColor: itemColor,
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '4px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        // title removed per user request — only hearse name, route, and plate should be visible
        >
          {/* Hearse name — big and prominent at top */}
          <span style={{
            fontSize: '14px', fontWeight: 700, color: '#FFFFFF',
            lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {props.hearseName || 'Hearse'}
          </span>

          {/* Plate number — below hearse name, secondary */}
          {props.plate && props.plate !== '—' && (
            <span style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.8)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginTop: '2px',
            }}>
              {props.plate}
            </span>
          )}

          {/* From → Destination route line */}
          {(from !== '—' || dest !== '—') && (
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              {from !== '—' && <span>{from}</span>}
              {from !== '—' && dest !== '—' && <span style={{ color: 'rgba(255,255,255,0.6)' }}>→</span>}
              {dest !== '—' && <span>{dest}</span>}
            </span>
          )}
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

  const getDayCellClasses = useCallback((info) => {
    if (calendarView !== 'dayGridMonth') return [];
    const dateStr = fmtDS(info.date);
    const hasEvents = bookings.some((b) => {
      const dates = getBookingDates(b);
      return dates.some(d => d && String(d).split('T')[0] === dateStr);
    });
    const activeStatuses = new Set(['pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress']);
    const unavailableStatuses = new Set(['maintenance', 'out_of_service', 'disabled', 'inactive']);
    const serviceableHearses = hearses.filter((hearse) =>
      !unavailableStatuses.has(String(hearse.status || '').toLowerCase())
    );
    const bookedHearses = new Set((allBookings || [])
      .filter((booking) => activeStatuses.has(String(booking.status || '').toLowerCase()))
      .filter((booking) => getBookingDates(booking).some((date) => String(date).slice(0, 10) === dateStr))
      .map((booking) => booking.hearse_id ?? booking.hearseId ?? booking.hearse?.id)
      .filter((id) => id != null)
      .map(String));
    const fullyBooked = serviceableHearses.length > 0
      && serviceableHearses.every((hearse) => bookedHearses.has(String(hearse.id ?? hearse.hearse_id ?? '')));
    return [
      ...(hasEvents ? ['fc-day-has-bookings'] : []),
      ...(fullyBooked ? ['fc-day-fully-booked'] : []),
    ];
  }, [allBookings, bookings, calendarView, hearses]);

  return (
    <Shell>
      {calendarView === 'timeGridDay' && selectedDate && dailyStats.total > 0 && (
        <StatsBar>
          <StatCard color="#00296B" tint="#EFF6FF" border="#DBEAFE">
            <StatIcon color="#00296B"><BarChart3 size={13} /></StatIcon>
            {dailyStats.total} Bookings
          </StatCard>
        </StatsBar>
      )}

      {dayViewDate ? (
        <DailyView>
          <DailyHeading>
            <DailyHeadingActions>
              <BackToCalendar type="button" onClick={() => setDayViewDate(null)}>Back to calendar</BackToCalendar>
              <SelectedDateBadge>
                <span className="dot" />
                <span className="label">{dayViewDate === toDateKey(new Date()) ? 'Today' : 'Selected'}</span>
                <span className="date">
                  {new Date(`${dayViewDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </SelectedDateBadge>
              <ViewSwitchButton
                type="button"
                $active={dayViewMode === 'schedule'}
                aria-pressed={dayViewMode === 'schedule'}
                onClick={() => setDayViewMode('schedule')}
              >
                Schedule
              </ViewSwitchButton>
              <ViewSwitchButton
                type="button"
                $active={dayViewMode === 'lineup'}
                aria-pressed={dayViewMode === 'lineup'}
                onClick={() => setDayViewMode('lineup')}
              >
                <Users size={14} aria-hidden="true" /> Driver lineup
              </ViewSwitchButton>
              <StandbyControl>
                {lineupLoading ? (
                  <StandbyEditor><label>Standby</label><span>Loading…</span></StandbyEditor>
                ) : resolvedStandbyDriverName && !editingStandby ? (
                  <StandbyBadge aria-label={`Standby driver for this day: ${resolvedStandbyDriverName}`}>
                    <span className="icon"><Users size={13} aria-hidden="true" /></span>
                    <span className="label">Standby</span>
                    <span className="name">{resolvedStandbyDriverName}</span>
                    <button type="button" onClick={() => setEditingStandby(true)}>Edit</button>
                  </StandbyBadge>
                ) : (
                  <StandbyEditor>
                    <label htmlFor="daily-standby-driver">Standby</label>
                    <input
                      id="daily-standby-driver"
                      type="text"
                      list="daily-standby-driver-options"
                      value={standbyDraft}
                      onChange={(event) => setStandbyDraft(event.target.value)}
                      disabled={savingStandby}
                      placeholder="Enter driver name"
                      aria-label="Standby driver for this day"
                      maxLength={200}
                    />
                    <datalist id="daily-standby-driver-options">
                      {registeredDrivers.map((driver) => (
                        <option
                          key={driver.driver_id ?? driver.id}
                          value={driver.driver_name || driver.full_name || `Driver ${driver.driver_id ?? driver.id}`}
                        />
                      ))}
                    </datalist>
                    <TodayButton
                      type="button"
                      disabled={savingStandby || standbyDraft.trim() === resolvedStandbyDriverName.trim()}
                      onClick={() => {
                        const enteredName = standbyDraft.trim();
                        const selectedDriver = registeredDrivers.find((driver) =>
                          String(driver.driver_name || driver.full_name || '').trim().toLowerCase() === enteredName.toLowerCase()
                        );
                        onSaveStandby?.({
                          driver_id: enteredName && selectedDriver ? selectedDriver.driver_id ?? selectedDriver.id : null,
                          driver_name: enteredName || null,
                        });
                      }}
                    >
                      {savingStandby ? 'Saving…' : standbyDraft.trim() ? 'Save standby' : 'Clear standby'}
                    </TodayButton>
                    {resolvedStandbyDriverName && (
                      <ViewSwitchButton
                        type="button"
                        disabled={savingStandby}
                        onClick={() => {
                          setStandbyDraft(resolvedStandbyDriverName);
                          setEditingStandby(false);
                        }}
                      >
                        Cancel
                      </ViewSwitchButton>
                    )}
                  </StandbyEditor>
                )}
              </StandbyControl>
            </DailyHeadingActions>
          </DailyHeading>

          <DateStrip aria-label="Choose a day">
            <DateStripDays>
              {weekDates.map((key) => {
                const date = new Date(`${key}T00:00:00`);
                const isToday = key === toDateKey(new Date());
                const hasBookings = (allBookings || []).some((booking) =>
                  getBookingDates(booking).some((bookingDate) => String(bookingDate).slice(0, 10) === key)
                );
                const freeHearses = weeklyAvailability[key] ?? 0;
                const isFullyBooked = hearses.some((hearse) =>
                  !['maintenance', 'out_of_service', 'disabled', 'inactive'].includes(String(hearse.status || '').toLowerCase())
                ) && freeHearses === 0;
                const availabilityLabel = isFullyBooked ? 'Fully booked' : `${freeHearses} free hearses`;
                return (
                  <DateStripButton
                    key={key}
                    type="button"
                    $active={key === dayViewDate}
                    $today={isToday}
                    $fullyBooked={isFullyBooked}
                    $weekend={date.getDay() === 0 || date.getDay() === 6}
                    $free={freeHearses}
                    aria-pressed={key === dayViewDate}
                    aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${availabilityLabel}${hasBookings ? ', bookings scheduled' : ''}`}
                    title={`${availabilityLabel}${hasBookings ? ' · bookings scheduled' : ''}`}
                    onClick={() => selectDay(key)}
                  >
                    <span className="dow">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className="day">{date.getDate()}</span>
                    <span className={`event-dot${hasBookings ? '' : ' empty'}`} aria-hidden="true" />
                    <span className="availability">{isFullyBooked ? 'Fully booked' : `${freeHearses} free`}</span>
                  </DateStripButton>
                );
              })}
            </DateStripDays>
          </DateStrip>

          <DaySchedule>
            <DayPanel $lineup={dayViewMode === 'lineup'}>
              {dayViewMode === 'lineup' && (
                <LineupTableHeader>
                  <span>Hearse Name</span>
                  <span>Number Plate</span>
                  <span>Pickup</span>
                  <span>Destination</span>
                  <span>Time</span>
                  <span>Driver</span>
                </LineupTableHeader>
              )}
              {visibleDayBookings.length ? visibleDayBookings.map((booking, lineupIndex) => {
                const schedule = getTimeInfo(booking);
                const hearse = hearses.find((item) => String(item.id ?? item.hearse_id) === String(booking.hearse_id ?? booking.hearse?.id));
                const hearseName = booking.hearse_name || booking.hearse?.hearse_name || hearse?.hearse_name || 'Hearse not assigned';
                const plate = booking.plate_number || booking.hearse_plate || booking.hearse?.plate_number || hearse?.plate_number || '';
                const vehicleTitle = booking.model || hearse?.model || booking.hearse?.model || hearseName;
                const assignedDriverId = booking.driver_id ?? booking.driverId ?? booking.assigned_driver_id;
                const assignedDriver = drivers.find((driver) =>
                  String(driver.driver_id ?? driver.id) === String(assignedDriverId ?? '')
                );
                const assignedDriverName = booking.assigned_driver_name
                  || assignedDriver?.driver_name
                  || assignedDriver?.full_name
                  || (assignedDriverId ? `Driver ${assignedDriverId}` : 'Unassigned');
                const bookingId = booking.booking_code || booking.booking_id || booking.id || '—';
                const branchName = resolveBranchName(
                  booking.branch_id,
                  booking.booking_branch_slug || booking.branch_slug || booking.branchSlug || booking.branch,
                  booking.branch_name || booking.branchName || booking.hearse_branch_name || booking.branch
                );
                const branchColor = getBranchBookingColor(branchName, booking.status);
                const clientName = booking.client_name || booking.client || '—';
                const clientPhone = booking.client_phone || booking.phone || '—';
                const { from: routeFrom, to: routeTo } = getBookingRoute(booking);
                const driverPhone = assignedDriver?.driver_phone || assignedDriver?.phone_number || assignedDriver?.phone || '';
                const assistantName = booking.assistant_name || '';
                const bookingKey = String(booking.booking_id || booking.id);
                return (
                  <React.Fragment key={bookingKey}>
                    {dayViewMode === 'lineup' ? (
                      <DayBookingRow
                        type="button"
                        $lineup
                        $stripe={lineupIndex % 2 === 1}
                        aria-label={`View booking ${bookingId}`}
                        onClick={() => onItemClick?.(booking)}
                      >
                        <LineupCell><LineupHearseName>{hearseName === 'Hearse not assigned' ? 'To be allocated' : vehicleTitle}</LineupHearseName></LineupCell>
                        <LineupCell><LineupPlate>{plate || '—'}</LineupPlate></LineupCell>
                        <LineupCell>{routeFrom}</LineupCell>
                        <LineupCell>{routeTo}</LineupCell>
                        <LineupCell><strong>{schedule.allDay ? 'All Day' : schedule.fs || 'Not set'}</strong></LineupCell>
                        <LineupCell>
                          <LineupDriver className={assignedDriverName === 'Unassigned' ? 'unassigned' : ''}>
                            {assignedDriverName === 'Unassigned'
                              ? 'Unassigned — allocate now'
                              : <>
                                <span className="initials">{getInitials(assignedDriverName)}</span>
                                <span className="name">{assignedDriverName}</span>
                              </>}
                          </LineupDriver>
                          {assistantName && <small>Assistant: {assistantName}</small>}
                        </LineupCell>
                      </DayBookingRow>
                    ) : (
                      <DayBookingRow
                        type="button"
                        onClick={() => onItemClick?.(booking)}
                      >
                        <DayBookingHeader>
                          <DayBookingVehicle>
                            {plate && <HearsePlateBadge>{plate}</HearsePlateBadge>}
                            <DayBookingVehicleText>
                              <HearseTitle>{vehicleTitle}</HearseTitle>
                            </DayBookingVehicleText>
                          </DayBookingVehicle>
                          <DayBookingMeta>
                            {branchName !== '—' && <DayBranchBadge>{branchName}</DayBranchBadge>}
                          </DayBookingMeta>
                        </DayBookingHeader>
                        <DayBookingBody>
                          <DayDetail>
                            <strong>Route / itinerary</strong>
                            <DayRoute><span>{routeFrom}</span><b aria-hidden="true">→</b><span>{routeTo}</span></DayRoute>
                          </DayDetail>
                          <DayDetail>
                            <strong>Client / contact</strong>
                            <DayClient><span>{clientName}</span><span>{clientPhone}</span></DayClient>
                          </DayDetail>
                          <DayDetail>
                            <strong>Schedule &amp; assigned driver</strong>
                            <DayBookingSchedule>
                              <span>{new Date(`${dayViewDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span>{schedule.range}</span>
                            </DayBookingSchedule>
                            <DayDriver>
                              <DayDriverInitials>{getInitials(assignedDriverName)}</DayDriverInitials>
                              <DayDriverInfo>
                                <span>{assignedDriverName}</span>
                                {driverPhone && <small>{driverPhone}</small>}
                              </DayDriverInfo>
                            </DayDriver>
                          </DayDetail>
                        </DayBookingBody>
                      </DayBookingRow>
                    )}
                  </React.Fragment>
                );
              }) : (
                <EmptyDay>
                  {dayViewMode === 'schedule'
                    ? 'No bookings for this day. Check the fleet panel for available hearses.'
                    : 'No bookings are available for the driver lineup.'}
                </EmptyDay>
              )}
            </DayPanel>

            <DailyFleetPanel>
              <DailyFleetHeader>
                <div>
                  <h2>Fleet status</h2>
                  <p>For {new Date(`${dayViewDate}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <DailyFleetCounts>
                  <DailyFleetCount><span aria-hidden="true">●</span>{dayFleet.free.length} Free</DailyFleetCount>
                  <DailyFleetCount $tone="booked"><span aria-hidden="true">●</span>{dayFleet.busy.length} Booked</DailyFleetCount>
                  {!!dayFleet.unavailable.length && (
                    <DailyFleetCount $tone="service"><span aria-hidden="true">●</span>{dayFleet.unavailable.length} Service</DailyFleetCount>
                  )}
                </DailyFleetCounts>
              </DailyFleetHeader>
              <DailyFleetList>
                {dayFleet.free.map((hearse) => (
                  <DailyFleetItem key={hearse.id || hearse.hearse_id}>
                    <DailyFleetDot />
                    <DailyFleetVehicle>
                      <DailyFleetTopLine>
                        {(hearse.plate_number || hearse.number_plate || hearse.registration_number) && (
                          <DailyFleetPlate>{hearse.plate_number || hearse.number_plate || hearse.registration_number}</DailyFleetPlate>
                        )}
                        {hearse.capacity && <DailyFleetCapacity>{hearse.capacity} Seater</DailyFleetCapacity>}
                      </DailyFleetTopLine>
                      <DailyFleetName>{hearse.model || hearse.hearse_name || hearse.name || 'Hearse'}</DailyFleetName>
                    </DailyFleetVehicle>
                    <DailyFleetState><strong>Free</strong></DailyFleetState>
                  </DailyFleetItem>
                ))}
                {!dayFleet.free.length && !dayFleet.busy.length && !dayFleet.unavailable.length && (
                  <EmptyDay>No hearses are registered in the fleet.</EmptyDay>
                )}
                {dayFleet.busy.length > 0 && (
                  <FleetSectionLabel>Currently booked</FleetSectionLabel>
                )}
                {dayFleet.busy.map(({ hearse, booking }) => (
                  <DailyFleetItem key={hearse.id || hearse.hearse_id} $booked>
                    <DailyFleetDot $tone="booked" />
                    <DailyFleetVehicle>
                      <DailyFleetTopLine>
                        {(hearse.plate_number || hearse.number_plate || hearse.registration_number) && (
                          <DailyFleetPlate>{hearse.plate_number || hearse.number_plate || hearse.registration_number}</DailyFleetPlate>
                        )}
                        {hearse.capacity && <DailyFleetCapacity>{hearse.capacity} Seater</DailyFleetCapacity>}
                      </DailyFleetTopLine>
                      <DailyFleetName $booked>{hearse.model || hearse.hearse_name || hearse.name || 'Hearse'}</DailyFleetName>
                      <DailyFleetBooking>Booked: {booking.client_name || booking.client || 'Client not listed'}</DailyFleetBooking>
                    </DailyFleetVehicle>
                    <DailyFleetState $tone="booked">
                      <strong>Booked</strong>
                      <span>{getTimeInfo(booking).fs}</span>
                    </DailyFleetState>
                  </DailyFleetItem>
                ))}
                {dayFleet.unavailable.length > 0 && (
                  <FleetSectionLabel>Out of service</FleetSectionLabel>
                )}
                {dayFleet.unavailable.map((hearse) => (
                  <DailyFleetItem key={hearse.id || hearse.hearse_id} $booked>
                    <DailyFleetDot $tone="service" />
                    <DailyFleetVehicle>
                      <DailyFleetTopLine>
                        {(hearse.plate_number || hearse.number_plate || hearse.registration_number) && (
                          <DailyFleetPlate>{hearse.plate_number || hearse.number_plate || hearse.registration_number}</DailyFleetPlate>
                        )}
                        {hearse.capacity && <DailyFleetCapacity>{hearse.capacity} Seater</DailyFleetCapacity>}
                      </DailyFleetTopLine>
                      <DailyFleetName $booked>{hearse.model || hearse.hearse_name || hearse.name || 'Hearse'}</DailyFleetName>
                    </DailyFleetVehicle>
                    <DailyFleetState $tone="service"><strong>Service</strong></DailyFleetState>
                  </DailyFleetItem>
                ))}
                {!dayFleet.free.length && (dayFleet.busy.length > 0 || dayFleet.unavailable.length > 0) && (
                  <EmptyDay>There are no free hearses on this day.</EmptyDay>
                )}
              </DailyFleetList>
            </DailyFleetPanel>
          </DaySchedule>
        </DailyView>
      ) : (
        <CalendarWrapper ref={wrapperRef}>
          <MonthToolbar data-version="v4-merged">
            <div className="toolbar-left">
              <button className="btn" onClick={() => goToMonthV3(-1)} aria-label="Previous month">&#8249; Prev</button>
              <button className="btn dark" onClick={goToTodayV3}>Today</button>
              <button className="btn" onClick={() => goToMonthV3(1)} aria-label="Next month">Next &#8250;</button>
              <span className="title">
                {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="toolbar-right">
              <button className="btn active">Month</button>
            </div>
          </MonthToolbar>
          <MonthTable>
            <thead>
              <tr>
                {WEEKDAYS.map((d, i) => (
                  <th key={d} className={i === todayDowV3 ? 'today' : ''}>{d}</th>
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
                    const fullyBooked = dayBookings.length >= FULLY_BOOKED_THRESHOLD_V3;
                    const visible = dayBookings.slice(0, MAX_EVENTS_PER_CELL_V3);
                    const hidden = dayBookings.length - visible.length;
                    const classes = [];
                    if (cell.otherMonth) classes.push('other-month');
                    if (dateKey === todayKey) classes.push('today-cell');
                    if (hasBookings) classes.push('has-bookings');
                    if (fullyBooked) classes.push('fully-booked');
                    return (
                      <MonthCell
                        key={cellIdx}
                        className={classes.join(' ')}
                        onClick={() => {
                          if (cell.date) {
                            selectDay(dateKey);
                          }
                        }}
                      >
                        <span className="day-number">{cell.day}</span>
                        {dayBookings.length > 0 && (
                          <div className="events">
                            {visible.map(renderMonthEvent)}
                            {hidden > 0 && (
                              <MonthMoreLink
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectDay(dateKey);
                                }}
                              >+{hidden} more</MonthMoreLink>
                            )}
                          </div>
                        )}
                      </MonthCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </MonthTable>

        </CalendarWrapper>
      )}
    </Shell>
  );
};
export default HearseCalendar;
