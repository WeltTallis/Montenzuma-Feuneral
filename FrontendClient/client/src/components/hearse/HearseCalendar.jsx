import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

// ===== IMPORT EXTERNAL VIEW COMPONENTS =====
import DailyView from './dailyView';
import WeeklyView from './weeklyView';
 
// ===== SHARED CONSTANTS =====
export const COLORS = {    
  primary: '#1a5f7a', primaryLight: '#2c8ac9', primaryDark: '#134b5f',
  white: '#FFFFFF', bg: '#f5f7fa', surface: '#ffffff',
  border: '#d1d5db', borderLight: '#e5e7eb',
  text: '#111827', textSecondary: '#6b7280', textMuted: '#9ca3af',
  success: '#10b981', successLight: '#d1fae5', successDark: '#059669',
  warning: '#f59e0b', warningLight: '#fef3c7', warningDark: '#d97706',
  danger: '#ef4444', dangerLight: '#fee2e2', dangerDark: '#dc2626',
  info: '#3b82f6', infoLight: '#dbeafe', infoDark: '#2563eb',
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: COLORS.warning, bg: COLORS.warningLight, text: COLORS.warningDark },
  booked: { label: 'Booked', color: COLORS.info, bg: COLORS.infoLight, text: COLORS.infoDark },
  in_transit: { label: 'In Transit', color: COLORS.primary, bg: '#e0f2fe', text: COLORS.primaryDark },
  completed: { label: 'Completed', color: COLORS.success, bg: COLORS.successLight, text: COLORS.successDark },
  cancelled: { label: 'Cancelled', color: COLORS.danger, bg: COLORS.dangerLight, text: COLORS.dangerDark },
  confirmed: { label: 'Confirmed', color: COLORS.success, bg: COLORS.successLight, text: COLORS.successDark },
};

export const START_HOUR = 6;
export const END_HOUR = 22;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
export const HOUR_H = 60;
export const TIME_W = 65;

// ===== SHARED HELPERS =====
export const pad = n => String(n).padStart(2, '0');
export const fmtDS = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
export const getInitials = n => { if (!n) return '?'; const p = n.split(' '); return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase(); };
export const fmtTime = s => { if (!s) return ''; try { return new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); } catch (e) { return ''; } };
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
  const fs = fmtTime(s), fe = fmtTime(e);
  return { sd, ed, allDay, sm, dur, fs, fe, range: allDay ? 'All Day' : (fe ? fs + ' – ' + fe : fs) };
};

// ===== BRIDGE: raw calendar bookings -> shape expected by external Daily/Weekly viewers =====
// buildViewerRecord reads the exact fields returned by GET /hearse-bookings:
//   booking_id, booking_code, client_name, client_phone, destination, status,
//   booking_dates (JSON array of "YYYY-MM-DD" date strings), plate_number,
//   hearse_name, branch_name, ...
// Date-only bookings render as all-day blocks (no invented times).

// Local-timezone-safe date parsing (avoids UTC shift for "YYYY-MM-DD" strings).
const parseLocalDate = (s) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
};

// Does the raw value really carry a clock time (e.g. "2026-08-09T14:30" or "14:30")?
const hasTime = (v) => {
  const s = String(v || '');
  const m = /(\d{1,2}):(\d{2})/.exec(s);
  return !!m && (s.includes('T') || s.includes(' ') || /^\d{1,2}:\d{2}/.test(s.trim()));
};

const hourOf = (v) => {
  const m = /(\d{1,2}):(\d{2})/.exec(String(v || ''));
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2]);
  const s = String(v || '').toLowerCase();
  if (s.includes('pm') && h < 12) h += 12;
  if (s.includes('am') && h === 12) h = 0;
  return h + mm / 60;
};

const parseDateKeys = (b) => {
  const keys = [];
  const collect = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((x) => {
      const d = parseLocalDate(x);
      if (d) keys.push(fmtDS(d));
    });
  };
  if (b.booking_dates) {
    try {
      collect(typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates);
    } catch (e) { /* fall through */ }
  }
  if (!keys.length) collect([b.booking_date || b.estimated_departure_time || b.date || b.start_date]);
  return [...new Set(keys)].filter(Boolean);
};

const branchKey = (name) => {
  const known = ['nairobi', 'thika', 'mombasa', 'nakuru', 'kisumu'];
  const s = String(name || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const k of known) if (s.includes(k)) return k;
  return 'nairobi';
};

const viewStatus = (s) => {
  const v = String(s || 'booked').toLowerCase();
  if (v === 'in_transit' || v === 'transit') return 'transit';
  if (v === 'cancelled' || v === 'canceled') return 'cancelled';
  if (v === 'confirmed') return 'booked';
  return ['pending', 'booked', 'completed', 'reserved', 'standby'].includes(v) ? v : 'booked';
};

const buildViewerRecord = (b, dateKey) => {
  const dates = (() => {
    if (b.booking_dates) {
      try {
        const arr = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates;
        if (Array.isArray(arr) && arr.length) return arr;
      } catch (x) { /* fall through */ }
    }
    return [b.booking_date || b.estimated_departure_time || b.date || b.start_date].filter(Boolean);
  })();

  const depRaw = b.estimated_departure_time || dates[0] || '';
  const arrRaw = b.estimated_arrival_time || dates[dates.length - 1] || '';

  const depH = hasTime(depRaw) ? hourOf(depRaw) : null;
  const arrH = hasTime(arrRaw) ? hourOf(arrRaw) : null;
  const depDay = depH != null && depRaw ? parseLocalDate(String(depRaw).slice(0, 10)) : null;
  const arrDay = arrH != null && arrRaw ? parseLocalDate(String(arrRaw).slice(0, 10)) : null;
  const isDepDay = depDay ? fmtDS(depDay) === dateKey : false;
  const isArrDay = arrDay ? fmtDS(arrDay) === dateKey : false;

  let start = START_HOUR;
  let end = END_HOUR;
  let allDay = true;

  if (depH != null) {
    if (isDepDay && (!arrH || isArrDay)) {
      allDay = false;
      start = depH;
      end = arrH != null ? Math.max(depH + 0.25, arrH) : Math.min(END_HOUR, depH + 1);
    } else if (isDepDay) {
      // travels across several days: starts today with the departure time
      allDay = false;
      start = depH;
      end = END_HOUR;
    } else if (isArrDay && arrH != null) {
      // returns on this day at the arrival time
      allDay = false;
      start = START_HOUR;
      end = arrH;
    }
  }
  if (start >= end) end = Math.min(24, start + 0.5);

  const slug = String(b.booking_code || b.hearse_name || 'bk').replace(/[^a-z0-9]/gi, '').slice(0, 12);

  return {
    id: b.booking_id || b.id || `${dateKey}-${slug}`,
    client: b.client_name || b.client || b.booking_code || '—',
    dest: b.destination || b.to_location || '—',
    from: b.from_location || b.origin || b.branch_name || '—',
    plate: b.plate_number || b.hearse_plate || b.number_plate || '—',
    branch: branchKey(b.branch_name || b.branch),
    branchName: b.branch_name || b.branch || '',
    status: viewStatus(b.status || b.booking_status),
    phone: b.client_phone || b.phone || '',
    start,
    end,
    allDay,
    _raw: b
  };
};

// ===== STYLED COMPONENTS =====
const fadeIn = keyframes`from { opacity: 0 } to { opacity: 1 }`;
const scaleIn = keyframes`from { transform: scale(0.98); opacity: 0 } to { transform: scale(1); opacity: 1 }`;

const Shell = styled.div`
  background: ${COLORS.surface};
  border-radius: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${COLORS.text};
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const Bar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  flex-wrap: wrap;
  background: ${COLORS.surface};
  border-bottom: 1px solid ${COLORS.borderLight};
  @media (max-width: 640px) {
    padding: 0.75rem 1rem;
    justify-content: center;
    gap: .5rem;
  }
`;

const TGrp = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Ttl = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: .5rem;
  color: ${COLORS.text};
`;

const IBtn = styled.button`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.bg};
  border: 1px solid ${COLORS.borderLight};
  border-radius: 8px;
  cursor: pointer;
  color: ${COLORS.textSecondary};
  transition: all .2s;
  &:hover {
    background: ${COLORS.borderLight};
    color: ${COLORS.text};
  }
  &:active {
    transform: scale(.96);
  }
`;

const TBtn = styled.button`
  background: ${COLORS.primary};
  border: none;
  border-radius: 8px;
  padding: .4rem 1rem;
  font-size: .75rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all .2s;
  &:hover {
    background: ${COLORS.primaryDark};
  }
  &:active {
    transform: scale(.96);
  }
`;

const VTog = styled.div`
  display: flex;
  background: ${COLORS.bg};
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  border: 1px solid ${COLORS.borderLight};
`;

const VBtn = styled.button`
  padding: .35rem 0.85rem;
  border-radius: 6px;
  border: none;
  background: ${props => props.$a ? COLORS.primary : 'transparent'};
  font-size: .75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  color: ${props => props.$a ? COLORS.white : COLORS.textSecondary};
  &:hover {
    background: ${props => props.$a ? COLORS.primary : COLORS.borderLight};
  }
`;

// Icons
const ChLIco = p => <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>;
const ChRIco = p => <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>;

// ===== OVERLAY / DRAWER =====
const Ovr = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 90;
  animation: ${fadeIn} .2s ease;
`;

const Drw = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100%;
  background: ${COLORS.surface};
  z-index: 100;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.08);
  transform: translateX(${props => props.$o ? '0' : '100%'});
  transition: transform .3s ease;
  display: flex;
  flex-direction: column;
  @media (max-width: 640px) {
    width: 100%;
  }
`;

const DrwH = styled.div`
  padding: 1.25rem 1.25rem;
  background: ${COLORS.surface};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid ${COLORS.borderLight};
`;

const DrwDt = styled.div`
  font-size: .65rem;
  font-weight: 700;
  color: ${COLORS.textMuted};
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: .25rem;
`;

const DrwTt = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.text};
  line-height: 1.2;
`;

const ClsBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${COLORS.bg};
  border: none;
  color: ${COLORS.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
  &:hover {
    background: ${COLORS.borderLight};
    color: ${COLORS.text};
  }
`;

const DrwB = styled.div`
  padding: 0;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: ${COLORS.bg};
`;

const DtW = styled.div`
  padding: 1.25rem;
  animation: ${scaleIn} .2s ease;
`;

const DtNm = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.text};
  line-height: 1.2;
`;

const DtSub = styled.p`
  font-size: .8rem;
  color: ${COLORS.textSecondary};
  margin: 6px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DtSec = styled.div`
  margin-top: 1.5rem;
`;

const DtST = styled.div`
  font-size: .65rem;
  font-weight: 700;
  color: ${COLORS.textMuted};
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 8px;
  padding: 0 4px;
`;

const DtCd = styled.div`
  background: ${COLORS.surface};
  border-radius: 10px;
  padding: 4px 14px;
  border: 1px solid ${COLORS.borderLight};
`;

const DtRw = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${COLORS.borderLight};
  gap: 0.75rem;
  &:last-child {
    border-bottom: none;
  }
`;

const DtLb = styled.div`
  font-size: .78rem;
  color: ${COLORS.textSecondary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DtVl = styled.div`
  font-size: .85rem;
  color: ${COLORS.text};
  font-weight: 600;
  text-align: right;
  word-break: break-word;
`;

const Avtr = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${props => props.$bg};
  color: ${props => props.$c};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .8rem;
`;

const RSt = styled.div`
  font-size: .6rem;
  font-weight: 700;
  color: ${props => props.$c};
  background: ${props => props.$bg};
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  text-transform: capitalize;
`;

// ===== MAIN CALENDAR COMPONENT =====
const HearseCalendar = ({ bookings = [], onItemClick, onCreateBooking, selectedDate, onDateSelect }) => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fmtDStr = useCallback((d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }, []);

  // Normalized, date-keyed bookings for the external Daily + Weekly viewer components.
  // Each viewer record uses the shape those components expect (numeric hours, display fields).
  const viewerBookings = useMemo(() => {
    const map = {};
    (bookings || []).forEach((b) => {
      parseDateKeys(b).forEach((k) => {
        if (!map[k]) map[k] = [];
        map[k].push(buildViewerRecord(b, k));
      });
    });
    return map;
  }, [bookings]);

  const unwrapViewer = useCallback((b) => (b && b._raw) || b, []);

  const handleViewerDateChange = useCallback((ds) => {
    if (!ds) return;
    const d = new Date(ds + 'T12:00:00');
    setSelectedDay(d);
    setCurrentDate(d);
    if (onDateSelect) onDateSelect(ds);
  }, [onDateSelect]);

  const getEvents = useCallback((dateStr) => {
    if (!dateStr) return [];
    return bookings.filter((b) => {
      if (b.booking_dates) {
        try {
          const dates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates;
          if (Array.isArray(dates)) {
            return dates.some(d => fmtDStr(d) === dateStr);
          }
        } catch (e) {}
      }
      const bd = b.booking_date || b.estimated_departure_time || b.date || '';
      return fmtDStr(bd) === dateStr;
    }).sort((a, b) => {
      const tiA = getTimeInfo(a);
      const tiB = getTimeInfo(b);
      return tiA.sm - tiB.sm;
    });
  }, [bookings, fmtDStr]);

  const navigate = useCallback((delta) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else if (view === 'day') {
      const target = selectedDay || currentDate;
      const d = new Date(target);
      d.setDate(d.getDate() + delta);
      setSelectedDay(d);
      newDate.setDate(newDate.getDate() + delta);
    }
    setCurrentDate(newDate);
    if (onDateSelect) onDateSelect(fmtDS(newDate));
  }, [currentDate, view, selectedDay, onDateSelect]);

  const goToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
    setView('day');
    if (onDateSelect) onDateSelect(fmtDS(today));
  }, [onDateSelect]);

  const openDay = useCallback((dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    setSelectedDay(d);
    setCurrentDate(d);
    setView('day');
    if (onDateSelect) onDateSelect(dateStr);
  }, [onDateSelect]);

  const openBookingDetails = useCallback((booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
    if (onItemClick) onItemClick(booking);
  }, [onItemClick]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedBooking(null);
  }, []);

  const title = useMemo(() => {
    if (view === 'month') return MONTHS[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
    if (view === 'week') return 'Week of ' + MONTHS[currentDate.getMonth()] + ' ' + currentDate.getDate();
    if (selectedDay) return MONTHS[selectedDay.getMonth()] + ' ' + selectedDay.getDate() + ', ' + selectedDay.getFullYear();
    return MONTHS[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
  }, [view, currentDate, selectedDay]);

  // Render drawer
  const renderDrawer = () => {
    if (!selectedBooking) return null;
    const b = selectedBooking;
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const ti = getTimeInfo(b);

    return (
      <>
        <Ovr onClick={closeDrawer} />
        <Drw $o={drawerOpen}>
          <DrwH>
            <div>
              <DrwDt>Booking Details</DrwDt>
              <DrwTt>{b.booking_code || ('BK-' + String(1000 + (b.booking_id || b.id || 0)).padStart(4, '0'))}</DrwTt>
            </div>
            <ClsBtn onClick={closeDrawer}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </ClsBtn>
          </DrwH>
          <DrwB>
            <DtW>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Avtr $bg={cfg.bg} $c={cfg.color} style={{ width: '48px', height: '48px', fontSize: '1rem', borderRadius: '12px' }}>
                  {getInitials(b.client_name)}
                </Avtr>
                <div style={{ flex: 1 }}>
                  <DtNm style={{ fontSize: '1.2rem' }}>{b.client_name || 'Unknown Client'}</DtNm>
                  <div><RSt $c={cfg.color} $bg={cfg.bg}>{cfg.label}</RSt></div>
                </div>
              </div>
              {b.client_phone && <DtSub><PhoneIco size={12} /> {b.client_phone}</DtSub>}
              <DtSub><ClockIco size={12} /> {ti.range || 'Time not set'}</DtSub>
              <DtSec>
                <DtST>Trip Details</DtST>
                <DtCd>
                  <DtRw>
                    <DtLb><PinIco size={12} /> To</DtLb>
                    <DtVl>{b.destination || b.to_location || '—'}</DtVl>
                  </DtRw>
                  {b.from_location && <DtRw>
                    <DtLb><PinIco size={12} /> From</DtLb>
                    <DtVl>{b.from_location}</DtVl>
                  </DtRw>}
                </DtCd>
              </DtSec>
              <DtSec>
                <DtST>Vehicle</DtST>
                <DtCd>
                  <DtRw>
                    <DtLb><TruckIco size={12} /> Hearse</DtLb>
                    <DtVl>{b.hearse_name || 'Unassigned'}</DtVl>
                  </DtRw>
                  <DtRw>
                    <DtLb>Plate</DtLb>
                    <DtVl>{b.plate_number || b.number_plate || 'N/A'}</DtVl>
                  </DtRw>
                </DtCd>
              </DtSec>
              {b.branch_name && <DtSec>
                <DtST>Branch</DtST>
                <DtCd>
                  <DtRw>
                    <DtLb>Branch</DtLb>
                    <DtVl>{b.branch_name}</DtVl>
                  </DtRw>
                </DtCd>
              </DtSec>}
            </DtW>
          </DrwB>
        </Drw>
      </>
    );
  };

  // ===== RENDER =====
  return (
    <Shell>
      <Bar>
        <TGrp>
          <IBtn onClick={() => navigate(-1)} aria-label="Previous">
            <ChLIco size={16} />
          </IBtn>
          <Ttl>{title}</Ttl>
          <IBtn onClick={() => navigate(1)} aria-label="Next">
            <ChRIco size={16} />
          </IBtn>
          <TBtn onClick={goToday}>Today</TBtn>
        </TGrp>
        <VTog>
          <VBtn $a={view === 'month'} onClick={() => setView('month')}>Month</VBtn>
          <VBtn $a={view === 'week'} onClick={() => setView('week')}>Week</VBtn>
          <VBtn
            $a={view === 'day'}
            onClick={() => {
              if (view !== 'day') {
                const today = new Date();
                setSelectedDay(today);
                setCurrentDate(today);
                setView('day');
              }
            }}
          >
            Day
          </VBtn>
        </VTog>
      </Bar>

      {view === 'week' && (
        <WeeklyView
          currentDate={currentDate}
          bookings={viewerBookings}
          getEvents={(ds) => viewerBookings[ds] || []}
          openDay={openDay}
          openBookingDetails={(b) => openBookingDetails(unwrapViewer(b))}
        />
      )}

      {view === 'day' && (
        <DailyView
          bookings={viewerBookings}
          selectedDate={fmtDS(selectedDay || currentDate)}
          onDateChange={handleViewerDateChange}
          onBookingClick={(b) => openBookingDetails(unwrapViewer(b))}
          onBookingUpdate={(data, mode) => {
            if (mode === 'create' && onCreateBooking) {
              onCreateBooking([fmtDS(selectedDay || currentDate)]);
            }
          }}
        />
      )}

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          bookings={bookings}
          getEvents={getEvents}
          openDay={openDay}
          openBookingDetails={openBookingDetails}
        />
      )}

      {renderDrawer()}
    </Shell>
  );
};

// ===== SIMPLE ICON HELPERS FOR DRAWER =====
const TruckIco = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
const PinIco = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const ClockIco = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const PhoneIco = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;

// ===== VIEW COMPONENTS =====
// Week + Day views come from the external ./weeklyView and ./dailyView components.
// MonthView below is defined inline.

const MonthView = ({ currentDate, bookings, getEvents, openDay, openBookingDetails }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = fmtDS(new Date());

  const days = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthDays - i), isOtherMonth: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isOtherMonth: false });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isOtherMonth: true });
  }

  return (
    <MWrap>
      <WkRow>{WEEKDAYS.map(w => <WkCell key={w}>{w}</WkCell>)}</WkRow>
      <DGrid>
        {days.map(({ date, isOtherMonth }) => {
          const dateStr = fmtDS(date);
          const isToday = dateStr === todayStr;
          const events = getEvents(dateStr);
          const hasEvents = events.length > 0;

          return (
            <DCell key={dateStr} $o={isOtherMonth} $t={isToday} $b={hasEvents} onClick={() => openDay(dateStr)}>
              <DHdr>
                {isToday ? <TCir>{date.getDate()}</TCir> : <DNum>{date.getDate()}</DNum>}
                {hasEvents && <BBadge>{events.length}</BBadge>}
              </DHdr>
              <DCont>
                {events.slice(0, 2).map(ev => {
                  const ti = getTimeInfo(ev);
                  return (
                    <EChip key={ev.booking_id || ev.id} onClick={(e) => { e.stopPropagation(); openBookingDetails(ev); }}>
                      <ETm>{ti.fs || '—'}</ETm>
                      <ENm>{(ev.client_name || 'Unknown').split(' ')[0]}</ENm>
                    </EChip>
                  );
                })}
                {events.length > 2 && <MChp onClick={(e) => { e.stopPropagation(); openDay(dateStr); }}>+{events.length - 2} more</MChp>}
              </DCont>
            </DCell>
          );
        })}
      </DGrid>
    </MWrap>
  );
};

// Styled components for MonthView
const MWrap = styled.div`padding: 1.25rem; @media (max-width: 640px) { padding: 0.75rem; }`;
const WkRow = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px;`;
const WkCell = styled.div`text-align: center; font-size: .65rem; font-weight: 600; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: .04em; padding: 6px 0;`;
const DGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;`;
const DCell = styled.div`
  min-height: 80px; border-radius: 8px; padding: 6px; cursor: pointer; transition: all .15s;
  display: flex; flex-direction: column; border: 1px solid transparent;
  opacity: ${props => props.$o ? 0.4 : 1};
  background: ${props => props.$t ? COLORS.infoLight : props.$b ? COLORS.bg : COLORS.surface};
  border-color: ${props => props.$t ? COLORS.info : 'transparent'};
  &:hover { background: ${props => props.$t ? COLORS.infoLight : COLORS.bg}; border-color: ${COLORS.border}; }
  @media (max-width: 640px) { min-height: 44px; padding: 4px; align-items: center; justify-content: center; }
`;
const DHdr = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; @media (max-width: 640px) { margin-bottom: 0; width: 100%; justify-content: center; }`;
const DNum = styled.div`font-size: .85rem; font-weight: 600; color: ${COLORS.text};`;
const TCir = styled.span`background: ${COLORS.info}; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700;`;
const BBadge = styled.div`background: ${COLORS.primary}; color: #fff; font-size: .6rem; font-weight: 700; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 4px; display: flex; align-items: center; justify-content: center;`;
const DCont = styled.div`display: flex; flex-direction: column; gap: 2px; overflow: hidden; @media (max-width: 640px) { display: none; }`;
const EChip = styled.div`display: flex; align-items: center; gap: 4px; background: ${COLORS.surface}; border: 1px solid ${COLORS.borderLight}; border-radius: 4px; padding: 2px 6px; font-size: .65rem; cursor: pointer; transition: all .15s; &:hover { background: ${COLORS.bg}; border-color: ${COLORS.primary}; }`;
const ETm = styled.span`font-weight: 600; color: ${COLORS.textSecondary}; font-size: .6rem;`;
const ENm = styled.span`font-weight: 500; color: ${COLORS.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const MChp = styled.div`font-size: .6rem; font-weight: 600; color: ${COLORS.textSecondary}; padding: 2px 4px; cursor: pointer;`;

// ===== EXPORT =====
export default HearseCalendar;