import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
import notify from '../../utils/notify';
import { Calendar, FileText, Upload, X, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

// ─── ADVANCED DESIGN SYSTEM (Your Custom Palette) ───────────────────────────
const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#e0e0e0',
  borderLight: '#efefef',
  bgField: '#f7f7f5',
  bgSection: '#fafaf9',
  bgApp: '#ececec',
  exportBtn: '#0F3040',
  success: '#047857',
  successBg: '#ecfdf5',
  warning: '#b45309',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#1e3a8a',
  infoBg: '#e0e7ff',
  brown: '#795548',

  cBlue: '#00296B',
  cOrange: '#E36414',
  cPurple: '#5F0F40',
  cPink: '#DD2D4A',
  cNavy: '#03071E',

  accent: '#DD2D4A',
};

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'compassionate', label: 'Compassionate' },
  { value: 'study', label: 'Study' },
  { value: 'unpaid', label: 'Unpaid' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'emergency', label: 'Emergency' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY_STR = toStr(new Date());

function parseLocal(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseLocal(dateStr);
  if (!d) return String(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function countBusinessDays(start, end) {
  if (!start || !end) return 0;
  let count = 0;
  const d = parseLocal(start);
  const endD = parseLocal(end);
  if (!d || !endD) return 0;
  while (d <= endD) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function dateInRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

const statusColors = {
  pending: { bg: C.warningBg, fg: C.warning, dot: C.warning },
  approved: { bg: C.successBg, fg: C.success, dot: C.success },
  rejected: { bg: C.dangerBg, fg: C.danger, dot: C.danger },
  cancelled: { bg: 'rgba(107, 114, 128, 0.12)', fg: C.gray, dot: C.gray },
};

// ─── STYLED COMPONENTS ───────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  background: ${C.bgApp};
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  padding: 2rem 1rem;
  color: ${C.black};
  box-sizing: border-box;
  
  @media (max-width: 640px) {
    padding: 1rem 0.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderContent = styled.div` flex: 1; min-width: 220px; `;

const Title = styled.h1`
  font-size: 1.8rem; font-weight: 700; color: ${C.black};
  margin: 0 0 0.25rem 0; letter-spacing: -0.02em;
`;

const Subtitle = styled.p` font-size: 0.9rem; color: ${C.gray}; margin: 0; `;

const Layout = styled.div`
  display: grid; grid-template-columns: 1fr 360px; gap: 1.5rem; align-items: start;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: ${C.bgSection}; border: 1px solid ${C.borderLight};
  border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02);
`;

const CardTitle = styled.h3`
  font-size: 1rem; font-weight: 700; color: ${C.black}; margin: 0 0 1.25rem 0;
  display: flex; align-items: center; gap: 0.5rem;
`;

const CardTitleAction = styled.button`
  margin-left: auto; background: none; border: 1px solid ${C.border};
  color: ${C.mid}; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  padding: 0.5rem 0.8rem; border-radius: 6px; transition: all 0.2s;
  &:hover { background: ${C.bgField}; border-color: ${C.gray}; color: ${C.black}; }
`;

// Calendar
const CalNav = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
`;

const CalMonthLabel = styled.span` font-size: 1.1rem; font-weight: 700; color: ${C.black}; `;

const CalNavBtn = styled.button`
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border: 1px solid ${C.border}; background: ${C.bgSection}; border-radius: 6px;
  color: ${C.gray}; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: ${C.exportBtn}; color: ${C.exportBtn}; background: ${C.bgField}; }
  &.today-btn { width: auto; padding: 0 0.75rem; font-size: 0.75rem; font-weight: 600; }
`;

const CalGrid = styled.div` display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; `;

const CalDayName = styled.div`
  text-align: center; font-size: 0.7rem; font-weight: 700; color: ${C.lightGray};
  text-transform: uppercase; padding: 0.5rem 0;
`;

const CalCell = styled.div`
  position: relative; min-height: 48px; border-radius: 6px; padding: 4px;
  background: ${C.bgSection}; cursor: pointer; user-select: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: background 0.15s;

  ${(p) => p.$weekend && `background: ${C.bgField};`}
  
  ${(p) => p.$inRange && `
    background: ${C.infoBg};
    border-radius: 0;
  `}
  ${(p) => p.$isStart && p.$inRange && `border-top-left-radius: 6px; border-bottom-left-radius: 6px;`}
  ${(p) => p.$isEnd && p.$inRange && `border-top-right-radius: 6px; border-bottom-right-radius: 6px;`}

  &:hover { background: ${C.infoBg}; z-index: 2; }
`;

const CalDayNum = styled.span`
  font-size: 0.9rem; font-weight: 500; width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: all 0.15s;
  
  ${(p) => p.$isToday && !p.$onAnchor && `
    border: 2px solid ${C.cBlue};
    color: ${C.cBlue};
  `}

  ${(p) => p.$onAnchor && `
    background: ${C.cBlue};
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `}
`;

const CalDots = styled.div`
  position: absolute; bottom: 4px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 3px;
`;

const CalDot = styled.span` width: 5px; height: 5px; border-radius: 50%; background: ${(p) => p.$color}; `;

const CalHint = styled.p`
  font-size: 0.8rem; color: ${C.gray}; margin-top: 1.25rem; text-align: center;
  background: ${C.bgField}; padding: 0.5rem; border-radius: 6px; border: 1px dashed ${C.border};
`;

// Form
const FormGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
  &.full { grid-column: 1 / -1; }
`;

const Label = styled.label`
  font-size: 0.8rem; font-weight: 600; color: ${C.mid};
  text-transform: uppercase; letter-spacing: 0.03em;
`;

const Required = styled.span` color: ${C.accent}; margin-left: 2px; `;

const Select = styled.select`
  padding: 0.75rem 1rem; border: 1px solid ${C.border}; border-radius: 6px;
  font-size: 0.9rem; color: ${C.black}; background: ${C.bgField};
  font-family: inherit; cursor: pointer; transition: all 0.2s;
  &:focus { outline: none; border-color: ${C.cBlue}; background: ${C.bgSection}; box-shadow: 0 0 0 3px rgba(0, 41, 107, 0.1); }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem; border: 1px solid ${C.border}; border-radius: 6px;
  font-size: 0.9rem; color: ${C.black}; background: ${C.bgSection};
  font-family: inherit; resize: vertical; min-height: 100px; transition: all 0.2s;
  &:focus { outline: none; border-color: ${C.cBlue}; background: #fff; box-shadow: 0 0 0 3px rgba(0, 41, 107, 0.1); }
`;

const DateRangeBox = styled.div`
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
  padding: 0.75rem 1rem; background: ${C.infoBg}; border: 1px solid ${C.cBlue}; border-radius: 6px;
`;

const DateText = styled.span` font-size: 0.95rem; font-weight: 700; color: ${C.cBlue}; `;

const DaysBadge = styled.span`
  margin-left: auto; font-size: 0.75rem; font-weight: 700; color: #fff;
  background: ${C.cBlue}; padding: 0.3rem 0.6rem; border-radius: 999px;
`;

const DropZone = styled.div`
  border: 2px dashed ${C.border}; border-radius: 8px; padding: 1.5rem; text-align: center;
  transition: all 0.2s; cursor: pointer; background: ${C.bgField};
  ${(p) => p.$drag && `border-color: ${C.cBlue}; background: ${C.infoBg};`}
  p { font-size: 0.9rem; color: ${C.gray}; margin-top: 0.5rem; }
  .browse { color: ${C.exportBtn}; font-weight: 600; text-decoration: underline; }
`;

const FileChip = styled.div`
  display: flex; align-items: center; gap: 0.5rem; justify-content: center;
  font-size: 0.9rem; color: ${C.black}; font-weight: 500;
  button { background: #fff; border: 1px solid ${C.border}; color: ${C.danger}; cursor: pointer; display: flex; padding: 0.25rem; border-radius: 6px; &:hover { background: ${C.dangerBg}; } }
`;

const Actions = styled.div` display: flex; gap: 1rem; margin-top: 1.5rem; `;

const Btn = styled.button`
  flex: 1; padding: 0.85rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center;
  justify-content: center; gap: 0.5rem; border: 1px solid transparent;
  
  &.secondary { background: ${C.bgSection}; border-color: ${C.border}; color: ${C.mid}; &:hover { background: ${C.bgField}; } }
  &.primary { background: ${C.exportBtn}; border-color: ${C.exportBtn}; color: #fff; box-shadow: 0 4px 6px -1px rgba(15, 48, 64, 0.2); &:hover { background: #0A1F2A; } }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// Right Column: Gauge & Requests
const GaugeContainer = styled.div` display: flex; flex-direction: column; align-items: center; padding: 1rem 0; `;
const GaugeWrapper = styled.div` position: relative; width: 160px; height: 160px; `;
const GaugeText = styled.div` position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; `;
const GaugeNum = styled.div` font-size: 2.5rem; font-weight: 800; color: ${C.cBlue}; line-height: 1; `;
const GaugeLbl = styled.div` font-size: 0.7rem; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; `;

const Breakdown = styled.div`
  margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem;
  border-top: 1px solid ${C.borderLight}; padding-top: 1.25rem;
  .row { display: flex; justify-content: space-between; align-items: center; }
  .k { font-size: 0.85rem; color: ${C.gray}; display: flex; align-items: center; gap: 0.5rem; }
  .v { font-size: 0.9rem; font-weight: 700; font-variant-numeric: tabular-nums; color: ${C.black}; }
  .dot-sm { width: 8px; height: 8px; border-radius: 50%; }
  .dot-sm.used { background: ${C.cBlue}; }
  .dot-sm.pend { background: ${C.warning}; }
`;

// Dynamic Request Backgrounds
const ReqItem = styled.div`
  padding: 0.85rem 1rem; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid ${C.borderLight};
  background: ${(p) => (statusColors[p.$status] || statusColors.pending).bg};
  border-color: ${(p) => (statusColors[p.$status] || statusColors.pending).fg}33;
  
  &:last-child { margin-bottom: 0; }
`;

const ReqTop = styled.div` display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; `;
const ReqType = styled.span` font-size: 0.9rem; font-weight: 700; color: ${C.black}; text-transform: capitalize; `;

const StatusBadge = styled.span`
  margin-left: auto; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
  border-radius: 999px; text-transform: capitalize; color: #fff;
  background: ${(p) => (statusColors[p.$status] || statusColors.pending).fg};
`;

const ReqMeta = styled.p` margin: 0; font-size: 0.8rem; color: ${C.mid}; font-weight: 500; `;
const ReqReason = styled.p`
  margin: 0.25rem 0 0 0; font-size: 0.75rem; color: ${C.gray};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const CancelBtn = styled.button`
  margin-top: 0.5rem; background: none; border: none; color: ${C.danger};
  font-size: 0.75rem; font-weight: 600; cursor: pointer; padding: 0;
  &:hover { text-decoration: underline; }
`;

const Banner = styled.div`
  display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem;
  border-radius: 8px; font-size: 0.9rem; font-weight: 500; margin-bottom: 1.5rem;
  &.success { background: ${C.successBg}; color: ${C.success}; border: 1px solid ${C.success}33; }
  &.error { background: ${C.dangerBg}; color: ${C.danger}; border: 1px solid ${C.danger}33; }
`;

const Empty = styled.div` text-align: center; padding: 1.5rem 0; font-size: 0.85rem; color: ${C.gray}; `;

const LoadingRow = styled.div`
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
  color: ${C.gray}; padding: 0.5rem 0;
  svg { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// History Section
const HistoryCard = styled.div`
  margin-top: 1.5rem; background: ${C.bgSection}; border: 1px solid ${C.borderLight};
  border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
`;

const HistoryHead = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  flex-wrap: wrap; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid ${C.borderLight};
`;

const FilterRow = styled.div` display: flex; gap: 0.5rem; flex-wrap: wrap; `;
const FilterChip = styled.button`
  border: 1px solid ${C.border}; background: ${C.bgSection}; color: ${C.gray};
  border-radius: 999px; padding: 0.4rem 0.85rem; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; text-transform: capitalize; transition: all 0.2s;
  &:hover { border-color: ${C.exportBtn}; color: ${C.exportBtn}; }
  ${(p) => p.$active && `border-color: ${C.exportBtn}; background: ${C.exportBtn}; color: #fff;`}
`;

const HistRow = styled.div`
  border-radius: 8px; padding: 1rem 1.25rem; margin-top: 0.75rem;
  border: 1px solid ${C.borderLight}; border-left: 4px solid transparent;
  background: ${(p) => (statusColors[p.$status] || statusColors.pending).bg};
  border-left-color: ${(p) => (statusColors[p.$status] || statusColors.pending).fg};
`;

const HistTop = styled.div` display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; `;
const HistType = styled.span` font-size: 0.95rem; font-weight: 700; color: ${C.black}; text-transform: capitalize; `;
const RefCode = styled.span`
  font-size: 0.75rem; font-family: monospace; color: ${C.gray};
  background: rgba(255,255,255,0.5); padding: 0.15rem 0.5rem; border-radius: 4px;
`;
const HistMeta = styled.div` margin-top: 0.5rem; font-size: 0.85rem; color: ${C.mid}; font-weight: 500; `;
const HistReason = styled.div`
  margin-top: 0.5rem; font-size: 0.85rem; color: ${C.black};
  background: rgba(255,255,255,0.6); border-radius: 6px; padding: 0.75rem 1rem;
`;
const RejectBox = styled.div`
  margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: ${C.danger}; font-weight: 600;
`;

// ===== CALENDAR LOGIC =====

function LeaveCalendar({ myLeaves, rangeStart, rangeEnd, onRangeChange }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const dragAnchor = useRef(null);
  const lastDownDay = useRef(null);
  const [dragEnd, setDragEnd] = useState(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const pad = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const effectiveEnd = dragEnd || rangeEnd;
  const inRange = (ds) => {
    if (!rangeStart || !effectiveEnd) return false;
    const a = rangeStart < effectiveEnd ? rangeStart : effectiveEnd;
    const b = rangeStart < effectiveEnd ? effectiveEnd : rangeStart;
    return ds >= a && ds <= b;
  };

  const leavesForDay = (ds) => (myLeaves || []).filter((l) => {
    const s = String(l.start_date || '').slice(0, 10);
    const e = String(l.end_date || '').slice(0, 10);
    return s && e && dateInRange(ds, s, e) && l.status !== 'cancelled';
  });

  const handleDown = (d) => {
    const ds = dayStr(d);
    lastDownDay.current = ds;
    dragAnchor.current = ds;
    setDragEnd(ds);
    const singleAnchor = rangeStart && rangeEnd && rangeStart === rangeEnd;
    if (!singleAnchor) onRangeChange(ds, ds);
  };

  const handleEnter = (d) => {
    if (!dragAnchor.current) return;
    const ds = dayStr(d);
    setDragEnd(ds);
    const a = dragAnchor.current < ds ? dragAnchor.current : ds;
    const b = dragAnchor.current < ds ? ds : dragAnchor.current;
    onRangeChange(a, b);
  };

  const handleUp = (d) => {
    const ds = d ? dayStr(d) : null;
    if (ds && lastDownDay.current === ds) {
      const singleAnchor = rangeStart && rangeEnd && rangeStart === rangeEnd;
      if (singleAnchor && ds !== rangeStart) {
        const a = rangeStart < ds ? rangeStart : ds;
        const b = rangeStart < ds ? ds : rangeStart;
        onRangeChange(a, b);
      } else {
        onRangeChange(ds, ds);
      }
    }
    dragAnchor.current = null;
    lastDownDay.current = null;
    setDragEnd(null);
  };

  const cancelDrag = () => {
    dragAnchor.current = null;
    lastDownDay.current = null;
    setDragEnd(null);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  return (
    <div onMouseLeave={cancelDrag}>
      <CalNav>
        <CalNavBtn onClick={prevMonth} type="button" aria-label="Previous month"><ChevronLeft size={16} /></CalNavBtn>
        <CalMonthLabel>{MONTH_NAMES[month]} {year}</CalMonthLabel>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <CalNavBtn className="today-btn" onClick={goToday} type="button" title="Today">Today</CalNavBtn>
          <CalNavBtn onClick={nextMonth} type="button" aria-label="Next month"><ChevronRight size={16} /></CalNavBtn>
        </div>
      </CalNav>

      <CalGrid>
        {DAY_NAMES.map((d) => <CalDayName key={d}>{d}</CalDayName>)}
        {pad.map((_, i) => <div key={`p${i}`} />)}
        {days.map((d) => {
          const ds = dayStr(d);
          const dow = new Date(year, month, d).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const isToday = ds === TODAY_STR;
          const dayLeaves = leavesForDay(ds);
          const uniqueStatuses = [...new Set(dayLeaves.map((l) => l.status))];
          const isStart = rangeStart === ds;
          const isEnd = rangeEnd === ds;
          const isAnchor = isStart || isEnd;

          return (
            <CalCell
              key={ds}
              $weekend={isWeekend}
              $isToday={isToday}
              $inRange={inRange(ds)}
              $isStart={isStart}
              $isEnd={isEnd}
              onMouseDown={() => handleDown(d)}
              onMouseEnter={() => handleEnter(d)}
              onMouseUp={() => handleUp(d)}
              onTouchStart={(e) => { e.preventDefault(); handleDown(d); }}
              onTouchEnd={() => handleUp(d)}
              title={dayLeaves.map((l) => `${l.leave_type} (${l.status})`).join(', ')}
            >
              <CalDayNum $isToday={isToday} $onAnchor={isAnchor}>{d}</CalDayNum>
              {!isAnchor && dayLeaves.length > 0 && (
                <CalDots>
                  {uniqueStatuses.slice(0, 3).map((s) => (
                    <CalDot key={s} $color={(statusColors[s] || statusColors.pending).dot} />
                  ))}
                </CalDots>
              )}
            </CalCell>
          );
        })}
      </CalGrid>

      <CalHint>💡 Click your start date, then your end date — or press & drag across the days.</CalHint>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const ApplyLeave = () => {
  const navigate = useNavigate();

  const userId = getUserId();
  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.full_name || u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email || 'You';
    } catch { return 'You'; }
  })();

  const parentSlug = getParentTenantSlug() || getTenantSlug();
  const tenantHeaders = useMemo(() => {
    const h = { 'x-tenant-slug': parentSlug };
    if (userId) h['x-user-id'] = String(userId);
    return { headers: h };
  }, [parentSlug, userId]);

  const [myLeaves, setMyLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [range, setRange] = useState({ start: null, end: null });
  const [form, setForm] = useState({ type: '', priority: 'medium', reason: '' });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get(ENDPOINTS.LEAVE.MY_LEAVES, tenantHeaders).catch(() => null),
        api.get(ENDPOINTS.LEAVE.BALANCE(userId), tenantHeaders).catch(() => null),
      ]);
      const leavesData = leavesRes?.data?.data || leavesRes?.data || [];
      setMyLeaves(Array.isArray(leavesData) ? leavesData : []);
      setBalance(balanceRes?.data?.data || balanceRes?.data || null);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  // The banner is a persistent summary; the toast is the immediate feedback.
  // Clear it after a few seconds so it never sits there looking stale.
  useEffect(() => {
    if (!banner) return undefined;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  const days = useMemo(() => {
    if (!range.start || !range.end) return 0;
    let count = 0;
    const d = new Date(`${range.start}T00:00:00`);
    const end = new Date(`${range.end}T00:00:00`);
    while (d <= end) { count += 1; d.setDate(d.getDate() + 1); }
    return count;
  }, [range]);

  const initial = Number(balance?.initial) || 26;
  const used = Number(balance?.leaveTaken) || 0;
  const pending = Number(balance?.pendingDays) || 0;
  const available = balance ? Math.max(0, Number(balance.currentBalance) || 0) : null;

  // Gauge Math
  const gaugeValue = available !== null && initial > 0 ? available / initial : 0;
  const circ = 2 * Math.PI * 54;
  const gaugeOffset = circ * (1 - gaugeValue);

  const pendingRequests = useMemo(
    () => myLeaves.filter((l) => l.status === 'pending'),
    [myLeaves]
  );
  const recentRequests = useMemo(() => myLeaves.slice(0, 6), [myLeaves]);

  const historyCounts = useMemo(() => {
    const c = { all: myLeaves.length, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    myLeaves.forEach((l) => {
      const s = String(l.status || '').toLowerCase();
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [myLeaves]);

  const filteredRequests = useMemo(
    () => (historyFilter === 'all'
      ? myLeaves
      : myLeaves.filter((l) => String(l.status || '').toLowerCase() === historyFilter)),
    [myLeaves, historyFilter]
  );

  const handleRangeChange = useCallback((start, end) => {
    setRange({ start, end });
    setBanner(null);
  }, []);

  const clearRange = () => {
    setRange({ start: null, end: null });
    notify.info('Dates cleared', 'Your selected range was cleared.');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    // Guard the required fields with a toast that says WHICH one is missing.
    if (!form.type.trim()) {
      notify.warning('Leave type required', 'Pick Annual, Sick or another type first.');
      return;
    }
    if (!range.start || !range.end) {
      notify.warning('No dates selected', 'Click your start date, then your end date on the calendar.');
      return;
    }
    if (!form.reason.trim()) {
      notify.warning('Reason required', 'Tell us why you are taking this leave.');
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const payload = {
        user_id: userId,
        leave_type: form.type.trim(),
        priority: form.priority,
        start_date: range.start,
        end_date: range.end,
        days,
        reason: form.reason.trim(),
        tenant_slug: parentSlug,
        parent_slug: parentSlug,
      };
      const res = await api.post(ENDPOINTS.LEAVE.APPLY, payload, tenantHeaders);
      const created = res?.data?.data || res?.data;

      if (file && created?.id) {
        try {
          const fd = new FormData();
          fd.append('document', file);
          await api.post(ENDPOINTS.LEAVE.UPLOAD_DOCUMENT(created.id), fd, {
            ...tenantHeaders,
            headers: { ...tenantHeaders.headers, 'Content-Type': null },
          });
        } catch (upErr) {
          console.warn('Document upload failed:', upErr);
        }
      }

      setBanner({ type: 'success', msg: `Leave request submitted for ${formatDate(range.start)} → ${formatDate(range.end)}` });
      notify.success(
        'Leave request submitted',
        `${formatDate(range.start)} → ${formatDate(range.end)} · ${days} day${days === 1 ? '' : 's'}`
      );
      setForm({ type: '', priority: 'medium', reason: '' });
      setFile(null);
      setRange({ start: null, end: null });
      if (created && created.id) {
        setMyLeaves((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return [created, ...list.filter((l) => l.id !== created.id)];
        });
      }
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit leave request';
      setBanner({ type: 'error', msg });
      notify.error('Could not submit request', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leaveId) => {
    try {
      await api.patch(ENDPOINTS.LEAVE.CANCEL(leaveId), {}, tenantHeaders);
      setBanner({ type: 'success', msg: 'Leave request cancelled' });
      notify.success('Request cancelled', 'Your leave request was withdrawn.');
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel request';
      setBanner({ type: 'error', msg });
      notify.error('Could not cancel request', msg);
    }
  };

  /* ── file handling ────────────────────────────────────────────────────── */

  const pickFile = (f) => {
    if (!f) return;
    // The backend only stores one document; anything else is rejected later
    // with a confusing error, so catch it here with a clear message instead.
    const ok = /\.(pdf|jpe?g|png)$/i.test(f.name);
    if (!ok) {
      notify.error('Unsupported file', 'Attach a PDF, JPG or PNG.');
      return;
    }
    setFile(f);
    notify.info('Document attached', f.name);
  };

  const clearFile = () => {
    setFile(null);
    const input = document.getElementById('leave-file-input');
    if (input) input.value = '';
    notify.info('Document removed', 'The supporting document was detached.');
  };

  if (!userId) {
    return (
      <Container>
        <Banner className="error"><AlertCircle size={16} /> You must be logged in to apply for leave.</Banner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Apply for Leave</Title>
          <Subtitle>Hi {userName} — select your dates on the calendar, fill in the details and submit.</Subtitle>
        </HeaderContent>
        <CardTitleAction onClick={() => navigate(-1)}>
          <ChevronLeft size={14} /> Back
        </CardTitleAction>
      </Header>

      {banner && (
        <Banner className={banner.type}>
          {banner.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {banner.msg}
        </Banner>
      )}

      <Layout>
        <div>
          <Card>
            <CardTitle><Calendar size={18} /> 1. Select your dates</CardTitle>
            <LeaveCalendar
              myLeaves={myLeaves}
              rangeStart={range.start}
              rangeEnd={range.end}
              onRangeChange={handleRangeChange}
            />
          </Card>

          <Card>
            <CardTitle><FileText size={18} /> 2. Leave details</CardTitle>
            <FormGrid>
              <FormGroup className="full">
                <Label htmlFor="leaveType">Leave type <Required>*</Required></Label>
                <Select
                  id="leaveType"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select leave type…</option>
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Selected range</Label>
                {range.start && range.end ? (
                  <DateRangeBox>
                    <DateText>{formatDate(range.start)} &rarr; {formatDate(range.end)}</DateText>
                    <DaysBadge>{days} day{days === 1 ? '' : 's'}</DaysBadge>
                    <CardTitleAction type="button" onClick={clearRange}>Clear</CardTitleAction>
                  </DateRangeBox>
                ) : (
                  <Empty>No dates selected yet — click on the calendar above.</Empty>
                )}
              </FormGroup>

              <FormGroup className="full">
                <Label htmlFor="reason">Reason <Required>*</Required></Label>
                <TextArea
                  id="reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave request..."
                />
              </FormGroup>

              <FormGroup className="full">
                <Label>Supporting document (optional)</Label>
                <input
                  id="leave-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />
                <DropZone
                  $drag={drag}
                  onClick={() => document.getElementById('leave-file-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    pickFile(e.dataTransfer?.files?.[0] || null);
                  }}
                >
                  {file ? (
                    <FileChip>
                      <FileText size={18} />
                      {file.name}
                      <button type="button" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                        <X size={14} />
                      </button>
                    </FileChip>
                  ) : (
                    <>
                      <Upload size={24} />
                      <p>Drag & drop a file here, or <span className="browse">browse</span></p>
                      <p className="hint" style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>PDF, JPG or PNG — one supporting document</p>
                    </>
                  )}
                </DropZone>
              </FormGroup>
            </FormGrid>

            <Actions>
              <Btn
                className="secondary"
                type="button"
                onClick={() => { notify.info('Cancelled', 'Nothing was submitted.'); navigate(-1); }}
              >
                Cancel
              </Btn>
              {/* Only disabled while submitting: a permanently-disabled button
                  gives the user no idea WHY it will not work. handleSubmit
                  validates and toasts the specific missing field instead. */}
              <Btn className="primary" type="button" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 size={18} /> : <CheckCircle size={18} />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Btn>
            </Actions>
          </Card>
        </div>

        <div>
          <Card>
            <CardTitle>Leave balance</CardTitle>
            {loading ? (
              <LoadingRow><Loader2 size={16} /> Loading your balance...</LoadingRow>
            ) : (
              <>
                <GaugeContainer>
                  <GaugeWrapper>
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="54" fill="none" stroke="#ececec" strokeWidth="12" />
                      <circle
                        cx="80" cy="80" r="54" fill="none"
                        stroke={C.cBlue} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={gaugeOffset}
                        transform="rotate(-90 80 80)"
                      />
                    </svg>
                    <GaugeText>
                      <GaugeNum>{available ?? '—'}</GaugeNum>
                      <GaugeLbl>Days Left</GaugeLbl>
                    </GaugeText>
                  </GaugeWrapper>
                </GaugeContainer>

                <Breakdown>
                  <div className="row"><span className="k"><span className="dot-sm used"></span> Total Entitlement</span><span className="v">{initial}</span></div>
                  <div className="row"><span className="k"><span className="dot-sm used"></span> Days Taken</span><span className="v">{used}</span></div>
                  <div className="row"><span className="k"><span className="dot-sm pend"></span> Pending Approval</span><span className="v">{pending}</span></div>
                </Breakdown>
              </>
            )}
          </Card>

          <Card>
            <CardTitle>
              Recent requests
              <DaysBadge>{myLeaves.length} total</DaysBadge>
              {pendingRequests.length > 0 && <DaysBadge>{pendingRequests.length} pending</DaysBadge>}
            </CardTitle>
            {loading ? (
              <LoadingRow><Loader2 size={16} /> Loading your requests...</LoadingRow>
            ) : recentRequests.length === 0 ? (
              <Empty>No leave requests yet — apply for your first one here.</Empty>
            ) : (
              recentRequests.map((l) => (
                <ReqItem key={l.id || `${l.start_date}-${l.end_date}`} $status={l.status}>
                  <ReqTop>
                    <ReqType>{String(l.leave_type || 'leave').replace('_', ' ')}</ReqType>
                    <StatusBadge $status={l.status}>{l.status}</StatusBadge>
                  </ReqTop>
                  <ReqMeta>
                    {formatDate(l.start_date)} &rarr; {formatDate(l.end_date)}
                    {' '}&middot;{' '}{l.days ?? countBusinessDays(l.start_date, l.end_date)} day(s)
                  </ReqMeta>
                  {l.reason && <ReqReason>{l.reason}</ReqReason>}
                  {l.status === 'pending' && (
                    <CancelBtn onClick={() => handleCancel(l.id)}>Cancel request</CancelBtn>
                  )}
                </ReqItem>
              ))
            )}
          </Card>
        </div>
      </Layout>

      <HistoryCard>
        <HistoryHead>
          <CardTitle style={{ margin: 0 }}><FileText size={18} /> My leave applications</CardTitle>
          <FilterRow>
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <FilterChip key={s} $active={historyFilter === s} onClick={() => setHistoryFilter(s)}>
                {s} ({historyCounts[s] ?? 0})
              </FilterChip>
            ))}
          </FilterRow>
        </HistoryHead>

        {loading ? (
          <LoadingRow><Loader2 size={16} /> Loading your applications...</LoadingRow>
        ) : filteredRequests.length === 0 ? (
          <Empty>
            {historyFilter === 'all'
              ? 'No leave applications yet — select your dates above and submit your first request.'
              : `No ${historyFilter} applications.`}
          </Empty>
        ) : (
          filteredRequests.map((l) => {
            const st = String(l.status || 'pending').toLowerCase();
            return (
              <HistRow key={l.id || `${l.start_date}-${l.end_date}-${l.created_at}`} $status={st}>
                <HistTop>
                  <HistType>
                    {String(l.leave_type || 'leave').replace('_', ' ')}
                    {l.is_half_day ? ' · half day' : ''}
                  </HistType>
                  {l.reference_code && <RefCode>{l.reference_code}</RefCode>}
                  <StatusBadge $status={st}>{st}</StatusBadge>
                  {st === 'pending' && (
                    <CancelBtn onClick={() => handleCancel(l.id)}>Cancel request</CancelBtn>
                  )}
                </HistTop>
                <HistMeta>
                  {formatDate(l.start_date)} &rarr; {formatDate(l.end_date)}
                  {' '}&middot;{' '}{l.days ?? countBusinessDays(l.start_date, l.end_date)} day(s)
                  {' '}&middot;{' '}applied {formatDate(l.created_at)}
                  {l.approved_at ? ` · decided ${formatDate(l.approved_at)}` : ''}
                </HistMeta>
                {l.reason && <HistReason>{l.reason}</HistReason>}
                {st === 'rejected' && l.rejection_reason && (
                  <RejectBox><AlertCircle size={14} /> {l.rejection_reason}</RejectBox>
                )}
              </HistRow>
            );
          })
        )}
      </HistoryCard>
    </Container>
  );
};

export default ApplyLeave;