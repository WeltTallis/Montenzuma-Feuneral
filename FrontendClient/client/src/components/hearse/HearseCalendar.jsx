import { toDateKey, formatTimeAmPm } from '../../utils/dates/parseDates';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import styled from 'styled-components';
import { Calendar, CheckCircle, Truck, Clock, Check, BarChart3, MapPin, Home, Car, Building, Users } from '../../utils/icons/icons';
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

const DRIVER_LINEUP_THEMES = [

  { primary: '#d97706', light: '#fef3c7' },
  { primary: '#be185d', light: '#fce7f3' },
  { primary: '#1d4ed8', light: '#dbeafe' },
  { primary: '#15803d', light: '#dcfce7' },

];

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
  return { sd , ed , allDay , sm , dur , fs, fe , range: allDay ? 'All Day' : (fe ? fs + ' – ' + fe : fs) };
                                                

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

  /* MONTH VIEW: Let the inline background color (status color) show through.
     Previous "transparent !important" was hiding the status colour and letting
     FullCalendar's own dot rendering show instead. We now explicitly override
     ALL background properties to ensure the rich status colour fills the card. */
  .fc .fc-daygrid-event .fc-event-main,
  .fc .fc-daygrid-event .fc-event-main-frame {
    background-color: inherit !important;
    background: inherit !important;
    color: #FFFFFF !important;
  }
  .fc .fc-daygrid-event {
    background-color: inherit !important;
    background: inherit !important;
    border: none !important;
    box-shadow: none !important;
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
    font-weight: 700 !important; font-size: 13px !important;
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
  .fc .fc-timegrid-event .fc-event-multi-line {
    line-height: 1.3 !important;
    overflow: visible !important;
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

const StandbyEditor = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
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
  @media (max-width: 640px) { margin-left: 0; }
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
  overflow: hidden;
  border: 1px solid #ece7ea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 17, 20, .03);
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

const BookingLineup = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 10px;
  margin: 0 12px 14px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-top: 0;
  border-radius: 0 0 12px 12px;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(15, 23, 42, .04);
  label { display: grid; min-width: 0; gap: 5px; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  input, select {
    width: 100%;
    min-width: 0;
    min-height: 36px;
    padding: 0 9px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #1e293b;
    font: inherit;
    font-size: 11px;
    text-transform: none;
    letter-spacing: normal;
    &:focus { outline: 2px solid #bfdbfe; border-color: #60a5fa; }
  }
  button {
    min-height: 36px;
    padding: 0 13px;
    border: 1px solid #0f172a;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    font: inherit;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
    transition: background .15s ease, transform .15s ease;
    &:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
    &:disabled { opacity: .55; cursor: wait; }
  }
  @media (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0 8px 12px;
    padding: 11px;
    button { grid-column: 1 / -1; }
  }
  @media (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr);
    button { grid-column: auto; }
  }
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
  display: block;
  width: ${p => p.$lineup ? 'calc(100% - 24px)' : '100%'};
  margin: ${p => p.$lineup ? '14px 12px 0' : '0'};
  padding: 0;
  border: ${p => p.$lineup ? '1px solid #e2e8f0' : '0'};
  border-bottom: ${p => p.$lineup ? '0' : '1px solid #f4f5f7'};
  border-radius: ${p => p.$lineup ? '12px 12px 0 0' : '0'};
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  overflow: hidden;
  box-shadow: ${p => p.$lineup ? '0 4px 12px rgba(15, 23, 42, .05)' : 'none'};
  transition: ${p => p.$lineup ? 'transform .18s ease, box-shadow .18s ease' : 'none'};
  &:last-child { border-bottom: 0; }
  &:hover { background: #fff; }
  &:hover { ${p => p.$lineup ? 'transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15, 23, 42, .09);' : ''} }
`;

const DayBookingHeader = styled.span`
  display: ${p => p.$lineup ? 'grid' : 'flex'};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: ${p => p.$lineup ? '64px' : '62px'};
  align-items: center;
  justify-content: space-between;
  gap: ${p => p.$lineup ? '14px' : '14px'};
  padding: ${p => p.$lineup ? '14px 20px' : '11px 16px'};
  background: ${p => p.$lineup ? p.$theme?.primary || '#1d4ed8' : '#0f172a'};
  color: #fff;
  @media (max-width: 850px) {
    ${p => p.$lineup && `
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
      gap: 10px;
      padding: 14px 16px;
    `}
  }
  @media (max-width: 520px) {
    ${p => !p.$lineup && `
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
    `}
  }
`;

const LineupHeaderItem = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  svg { flex: 0 0 auto; }
  & > span, & > strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 850px) { justify-self: start; }
`;

const LineupDriverHeader = styled(LineupHeaderItem)`
  font-size: 13px;
  font-weight: 850;
`;

const LineupAssistantHeader = styled(LineupHeaderItem)`
  justify-self: center;
  span { color: rgba(255, 255, 255, .88); font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  strong { color: #fff; font-size: 11px; font-weight: 800; }
  @media (max-width: 850px) { justify-self: start; }
`;

const LineupVehicleHeader = styled(LineupHeaderItem)`
  justify-self: end;
  font-size: 11px;
  strong { font-weight: 850; }
  @media (max-width: 850px) { justify-self: start; }
`;

const LineupPlate = styled.span`
  padding: 3px 7px;
  border-radius: 4px;
  background: #fff;
  color: ${p => p.$theme?.primary || '#1d4ed8'};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .06em;
  white-space: nowrap;
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

const LineupCardBody = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 17px 20px;
  background: #fff;
  @media (max-width: 850px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`;

const LineupRouteSection = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 14px;
`;

const LineupNumber = styled.span`
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  place-items: center;
  border: 2px solid ${p => p.$theme?.primary || '#1d4ed8'};
  border-radius: 50%;
  background: ${p => p.$theme?.light || '#dbeafe'};
  color: ${p => p.$theme?.primary || '#1d4ed8'};
  font-size: 18px;
  font-weight: 900;
`;

const LineupRouteDetails = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 14px;
    font-weight: 850;
  }
`;

const LineupRoutePath = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #475569;
  font-size: 11px;
  font-weight: 650;
  svg { flex: 0 0 auto; color: ${p => p.$theme?.primary || '#1d4ed8'}; }
`;

const LineupMetaSection = styled.span`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 18px;
  @media (max-width: 850px) {
    width: 100%;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px dashed #e2e8f0;
  }
`;

const LineupTimeBox = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  strong { color: #0f172a; font-size: 14px; font-weight: 850; }
  small { color: #94a3b8; font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  @media (max-width: 850px) { align-items: flex-start; }
`;

const LineupStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1.5px solid ${p => p.$theme?.primary || '#1d4ed8'};
  border-radius: 8px;
  background: ${p => p.$theme?.light || '#dbeafe'};
  color: ${p => p.$theme?.primary || '#1d4ed8'};
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
  white-space: nowrap;
  &::before { width: 7px; height: 7px; border-radius: 50%; background: currentColor; content: ''; }
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

const BookingStatus = styled.span`
  padding: 4px 9px;
  border-radius: 999px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
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
  savingBookingLineup = null,
  onSaveStandby,
  onSaveBookingLineup,
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
  const [lineupDrafts, setLineupDrafts] = useState({});

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
      const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
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

      // Format time as "9 AM" (12-hour format without minutes when it's exactly on the hour)
      const formatTimeToDisplay = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        if (minutes === 0) {
          return `${displayHours} ${period}`;
        }
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      };

      const hearseName = b.hearse_name || b.hearse?.name || b.hearse_name || b.vehicle_name || 'Hearse';
      const clientName = (b.client_name || b.client || 'client').toString();
      const datePart = startDate ? String(startDate).split('T')[0]?.replace(/[-]/g, '') : 'nodate';
      const stableId = b.booking_code || b.booking_id || b.id || `${clientName}-${datePart}-${index}`;
      const readableId = b.booking_code || `BK-${hearseName}-${clientName}-${datePart}-${stableId}`;
      const resolvedBranchName = resolveBranchName(
        b.branch_id,
        b.booking_branch_slug || b.branch_slug || b.branchSlug || b.branch,
        b.branch_name || b.branchName || b.hearse_branch_name || b.branch
      );

      const formattedStartTime = formatTimeToDisplay(startTime);

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
        /* RICH saturated status colour — solid background (blue / orange /
           green / pink-red etc). Both FC's outer wrapper (this backgroundColor)
           AND the inner card (statusColor) use the same saturated hex, so the
           whole card fills with the rich colour. */
        backgroundColor: status.color,
        borderColor: status.color,
        textColor: '#FFFFFF',
        extendedProps: {
          status: b.status,
          statusLabel: status.label,
          statusColor: status.color,
          statusBg: status.bg,
          statusTextColor: status.textColor,
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
          formattedStartTime,
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
      const dest = props.dest || '—';
      return (
        <div
          style={{
            width: '100%',
            minHeight: '62px',
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

          {/* From — top line */}
          {props.from && props.from !== '—' && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'rgba(255,255,255,0.95)' }}>From:</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '4px' }}>{props.from}</span>
            </div>
          )}

          {/* To — below from */}
          {dest !== '—' && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>To:</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '4px' }}>{dest}</span>
            </div>
          )}

          {/* Pickup time — bottom line */}
          {props.formattedStartTime && (
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {props.formattedStartTime}
            </div>
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

      {dayViewDate ? (
        <DailyView>
          <DailyHeading>
            <DailyHeadingActions>
              <TodayButton type="button" onClick={() => selectDay(toDateKey(new Date()))}>Today</TodayButton>
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
            <DayPanel>
              {visibleDayBookings.length ? visibleDayBookings.map((booking, lineupIndex) => {
                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
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
                const branchName = booking.branch_name || booking.branchName || booking.branch || '—';
                const clientName = booking.client_name || booking.client || '—';
                const clientPhone = booking.client_phone || booking.phone || '—';
                const { from: routeFrom, to: routeTo } = getBookingRoute(booking);
                const driverPhone = assignedDriver?.driver_phone || assignedDriver?.phone_number || assignedDriver?.phone || '';
                const assistantName = booking.assistant_name || 'Not assigned';
                const routeTitle = booking.service_name || booking.service_type || booking.booking_title
                  || booking.booking_type || booking.client_name || booking.client || 'Hearse service';
                const lineupTheme = DRIVER_LINEUP_THEMES[lineupIndex % DRIVER_LINEUP_THEMES.length];
                const bookingKey = String(booking.booking_id || booking.id);
                const lineup = lineupDrafts[bookingKey] || {
                  driverId: booking.driver_id == null ? '' : String(booking.driver_id),
                  driverName: booking.manual_driver_name || (!booking.driver_id ? booking.assigned_driver_name || '' : ''),
                  assistantName: booking.assistant_name || '',
                  assistantPhone: booking.assistant_phone || '',
                };
                const activeStatuses = new Set(['pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress']);
                return (
                  <React.Fragment key={bookingKey}>
                    <DayBookingRow
                      type="button"
                      $lineup={dayViewMode === 'lineup'}
                      onClick={() => onItemClick?.(booking)}
                    >
                      <DayBookingHeader $lineup={dayViewMode === 'lineup'} $theme={lineupTheme}>
                        {dayViewMode === 'lineup' ? (
                          <>
                            <LineupDriverHeader>
                              <Users size={17} aria-hidden="true" />
                              <span>{assignedDriverName}</span>
                            </LineupDriverHeader>
                            <LineupAssistantHeader>
                              <span>Assisted by</span>
                              <strong>{assistantName}</strong>
                            </LineupAssistantHeader>
                            <LineupVehicleHeader>
                              <Car size={17} aria-hidden="true" />
                              <strong>{vehicleTitle}</strong>
                              {plate && <LineupPlate $theme={lineupTheme}>{plate}</LineupPlate>}
                            </LineupVehicleHeader>
                          </>
                        ) : (
                          <>
                            <DayBookingVehicle>
                              {plate && <HearsePlateBadge>{plate}</HearsePlateBadge>}
                              <DayBookingVehicleText>
                                <HearseTitle>{vehicleTitle}</HearseTitle>
                              </DayBookingVehicleText>
                            </DayBookingVehicle>
                            <DayBookingMeta>
                              {branchName !== '—' && <DayBranchBadge>{branchName}</DayBranchBadge>}
                              <BookingStatus $bg={status.bg} $color={status.textColor}>{status.label}</BookingStatus>
                            </DayBookingMeta>
                          </>
                        )}
                      </DayBookingHeader>
                      {dayViewMode === 'lineup' ? (
                        <LineupCardBody>
                          <LineupRouteSection>
                            <LineupNumber $theme={lineupTheme}>{String(lineupIndex + 1).padStart(2, '0')}</LineupNumber>
                            <LineupRouteDetails>
                              <h3>{routeTitle}</h3>
                              <LineupRoutePath $theme={lineupTheme}>
                                <span>{routeFrom}</span>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                <span>{routeTo}</span>
                              </LineupRoutePath>
                            </LineupRouteDetails>
                          </LineupRouteSection>
                          <LineupMetaSection>
                            <LineupTimeBox>
                              <small>Time</small>
                              <strong>{schedule.allDay ? 'All Day' : schedule.fs || 'Not set'}</strong>
                            </LineupTimeBox>
                            <LineupStatus $theme={lineupTheme}>{status.label}</LineupStatus>
                          </LineupMetaSection>
                        </LineupCardBody>
                      ) : (
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
                      )}
                    </DayBookingRow>
                    {dayViewMode === 'lineup' && <BookingLineup>
                      <label>
                        Select driver (optional)
                        <select
                          value={lineup.driverId}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const selectedId = event.target.value;
                            const selectedDriver = drivers.find((driver) =>
                              String(driver.driver_id ?? driver.id) === selectedId
                            );
                            const isNumericDriverId = /^[1-9]\d*$/.test(selectedId);
                            setLineupDrafts((current) => ({
                              ...current,
                              [bookingKey]: {
                                ...lineup,
                                driverId: isNumericDriverId ? selectedId : '',
                                driverName: isNumericDriverId ? '' : selectedDriver?.driver_name || selectedDriver?.full_name || '',
                              },
                            }));
                          }}
                          aria-label={`Assign driver for booking ${bookingId}`}
                        >
                          <option value="">{drivers.length ? 'Unassigned' : 'No drivers found for this tenant'}</option>
                          {drivers.map((driver) => {
                            const driverId = driver.driver_id ?? driver.id;
                            const assignedElsewhere = dayBookings.some((other) =>
                              String(other.booking_id || other.id) !== bookingKey
                              && String(other.driver_id || '') === String(driverId)
                              && activeStatuses.has(String(other.status || '').toLowerCase()));
                            const isStandby = String(standbyDriverId || '') === String(driverId);
                            return (
                              <option
                                key={driverId}
                                value={driverId}
                                disabled={(assignedElsewhere || isStandby) && String(lineup.driverId) !== String(driverId)}
                              >
                                {driver.driver_name || driver.full_name || `Driver ${driverId}`}
                                {isStandby ? ' · standby' : assignedElsewhere ? ' · assigned to another booking' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label>
                        Or enter driver name
                        <input
                          value={lineup.driverName}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => setLineupDrafts((current) => ({
                            ...current,
                            [bookingKey]: { ...lineup, driverId: '', driverName: event.target.value },
                          }))}
                          placeholder="Type driver name"
                          aria-label={`Enter driver name for booking ${bookingId}`}
                        />
                      </label>
                      <label>
                        Assistant name (optional)
                        <input
                          value={lineup.assistantName}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => setLineupDrafts((current) => ({
                            ...current,
                            [bookingKey]: { ...lineup, assistantName: event.target.value },
                          }))}
                          placeholder="Enter assistant name"
                          aria-label={`Assistant name for booking ${bookingId}`}
                        />
                      </label>
                      <label>
                        Assistant phone
                        <input
                          value={lineup.assistantPhone}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => setLineupDrafts((current) => ({
                            ...current,
                            [bookingKey]: { ...lineup, assistantPhone: event.target.value },
                          }))}
                          placeholder="Optional contact"
                          aria-label={`Assistant phone for booking ${bookingId}`}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={String(savingBookingLineup || '') === bookingKey}
                        onClick={() => onSaveBookingLineup?.(booking.booking_id || booking.id, {
                          driver_id: lineup.driverName.trim() ? null : lineup.driverId || null,
                          driver_name: lineup.driverName.trim(),
                          assistant_name: lineup.assistantName,
                          assistant_phone: lineup.assistantPhone,
                        })}
                      >
                        {String(savingBookingLineup || '') === bookingKey ? 'Saving…' : 'Save lineup'}
                      </button>
                    </BookingLineup>}
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
            dayCellClassNames={getDayCellClasses}
            height={calendarView === 'dayGridMonth' ? 'auto' : 750}
            contentHeight={calendarView === 'dayGridMonth' ? 'auto' : 700}
            fixedWeekCount={true}
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
      )}
    </Shell>
  );
};
export default HearseCalendar;