import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug, getTenantId, getBranchId, getBranchSlug } from '../../utils/globalAuth';
import { Calendar, FileText, Upload, X, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

const COLORS = {
    primary: '#0A2463',
    primaryLight: '#1A3A7A',
    white: '#FFFFFF',
    bg: '#F5F7FA',
    border: '#E8ECF0',
    text: '#1A1D24',
    textSecondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#E74C3C',
    info: '#3B82F6',
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

// Parse a 'YYYY-MM-DD' (or full ISO) string as a LOCAL calendar date so the
// shown day never shifts when the browser timezone is west of UTC - selecting
// the 1st must never render as the 31st of the previous month.
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
    pending: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#B45309' },
    approved: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' },
    rejected: { bg: 'rgba(231, 76, 60, 0.12)', fg: '#B91C1C' },
    cancelled: { bg: 'rgba(107, 114, 128, 0.12)', fg: COLORS.textSecondary },
};

// ─── STYLED COMPONENTS ───────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  background: ${COLORS.white};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderContent = styled.div`
  flex: 1;
  min-width: 220px;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${COLORS.text};
  margin: 0 0 0.25rem 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
  margin: 0;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${COLORS.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardTitleAction = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  color: ${COLORS.primary};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;

  &:hover { background: ${COLORS.bg}; }
`;

// Calendar
const CalNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const CalMonthLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${COLORS.text};
`;

const CalNavBtn = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  border-radius: 8px;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${COLORS.primary}; color: ${COLORS.primary}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
`;

const CalDayName = styled.div`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.35rem 0;
`;

const CalCell = styled.div`
  position: relative;
  min-height: 52px;
  border-radius: 8px;
  padding: 4px;
  background: ${COLORS.white};
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;

  ${(p) => p.$muted && `color: ${COLORS.textSecondary}; background: ${COLORS.bg};`}
  ${(p) => p.$weekend && !p.$muted && !p.$anchor && `background: ${COLORS.bg};`}
  ${(p) => p.$isToday && !p.$inRange && !p.$anchor && `border-color: ${COLORS.info};`}

  /* Days in the middle of a selection — clearly visible, not a faint wash */
  ${(p) => p.$inRange && !p.$anchor && `
    background: rgba(10, 36, 99, 0.18);
    border-color: ${COLORS.primary};
    box-shadow: inset 0 0 0 1px rgba(10, 36, 99, 0.10);
  `}

  /* Start / end anchors — solid fill so they are unmistakable */
  ${(p) => p.$anchor && `
    background: ${COLORS.primary};
    border-color: ${COLORS.primary};
    color: ${COLORS.white};
    z-index: 1;
    box-shadow: 0 2px 10px rgba(10, 36, 99, 0.35);
  `}

  &:hover { border-color: ${COLORS.primary}; z-index: 2; }
`;

const CalDayNum = styled.span`
  font-size: 0.75rem;
  font-weight: ${(p) => (p.$isToday || p.$onAnchor ? 700 : 500)};
  color: ${(p) => (p.$onAnchor ? '#FFFFFF' : p.$isToday ? COLORS.primary : COLORS.text)};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${(p) => (p.$isToday && !p.$onAnchor ? 'rgba(59, 130, 246, 0.15)' : 'transparent')};
`;

const CalAnchor = styled.span`
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.28);
  padding: 2px 4px;
  border-radius: 4px;
`;

const CalDots = styled.div`
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 3px;
`;

const CalDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

const CalHint = styled.p`
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
  margin: 0.75rem 0 0 0;
  text-align: center;
`;

// Form
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &.full { grid-column: 1 / -1; }
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Required = styled.span`
  color: ${COLORS.danger};
`;

const TypeChips = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TypeChip = styled.button`
  padding: 0.5rem 0.35rem;
  border-radius: 10px;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  color: ${COLORS.textSecondary};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  ${(p) => p.$active && `
    background: ${COLORS.primary};
    border-color: ${COLORS.primary};
    color: ${COLORS.white};
  `}
`;

const Select = styled.select`
  padding: 0.6rem 0.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  font-size: 0.875rem;
  color: ${COLORS.text};
  background: ${COLORS.white};
  font-family: inherit;

  &:focus { outline: none; border-color: ${COLORS.primary}; }
`;

const TextArea = styled.textarea`
  padding: 0.6rem 0.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  font-size: 0.875rem;
  color: ${COLORS.text};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus { outline: none; border-color: ${COLORS.primary}; }
`;

const DateRangeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0.7rem 0.9rem;
  background: rgba(10, 36, 99, 0.05);
  border: 1px solid rgba(10, 36, 99, 0.15);
  border-radius: 10px;
`;

const DateText = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.primary};
`;

const DaysBadge = styled.span`
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${COLORS.primary};
  background: rgba(10, 36, 99, 0.1);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
`;

const HalfDayRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${COLORS.text};
  cursor: pointer;
  user-select: none;

  input { accent-color: ${COLORS.primary}; width: 16px; height: 16px; cursor: pointer; }
`;

const DropZone = styled.div`
  border: 2px dashed ${COLORS.border};
  border-radius: 10px;
  padding: 1.1rem;
  text-align: center;
  transition: all 0.15s;
  cursor: pointer;

  ${(p) => p.$drag && `border-color: ${COLORS.primary}; background: rgba(10, 36, 99, 0.04);`}

  p { margin: 0; font-size: 0.82rem; color: ${COLORS.textSecondary}; }
  .browse { color: ${COLORS.primary}; font-weight: 600; cursor: pointer; text-decoration: underline; }
  .hint { font-size: 0.7rem; color: ${COLORS.textSecondary}; opacity: 0.7; margin-top: 0.25rem; }
`;

const FileChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  font-size: 0.85rem;
  color: ${COLORS.text};

  button {
    background: none;
    border: none;
    color: ${COLORS.danger};
    cursor: pointer;
    display: flex;
    padding: 0.15rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const Btn = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.secondary {
    background: ${COLORS.white};
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textSecondary};

    &:hover { background: ${COLORS.bg}; }
  }

  &.primary {
    background: ${COLORS.primary};
    border: 1px solid ${COLORS.primary};
    color: ${COLORS.white};

    &:hover { background: ${COLORS.primaryLight}; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }
`;

// Balance + requests
const BalanceBig = styled.div`
  text-align: center;
  padding: 0.75rem 0 1rem 0;

  .num { font-size: 2.6rem; font-weight: 700; color: ${COLORS.primary}; line-height: 1; }
  .lbl { font-size: 0.78rem; color: ${COLORS.textSecondary}; margin-top: 0.35rem; }
`;

const Bar = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: ${COLORS.bg};
  overflow: hidden;
  display: flex;

  .used { height: 100%; background: ${COLORS.primary}; }
  .pending { height: 100%; background: ${COLORS.warning}; }
`;

const Breakdown = styled.div`
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .row { display: flex; justify-content: space-between; align-items: center; }
  .k { font-size: 0.78rem; color: ${COLORS.textSecondary}; }
  .v { font-size: 0.85rem; font-weight: 600; font-variant-numeric: tabular-nums; color: ${COLORS.text}; }
  .v.primary { color: ${COLORS.primary}; }
  .v.warning { color: #B45309; }
`;

const ReqItem = styled.div`
  padding: 0.65rem 0.7rem;
  border-radius: 10px;
  background: ${COLORS.bg};
  margin-bottom: 0.5rem;

  &:last-child { margin-bottom: 0; }
`;

const ReqTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const ReqType = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.primary};
  text-transform: capitalize;
`;

const StatusBadge = styled.span`
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${(p) => (statusColors[p.$status] || statusColors.pending).bg};
  color: ${(p) => (statusColors[p.$status] || statusColors.pending).fg};
`;

const ReqMeta = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
`;

const ReqReason = styled.p`
  margin: 0.15rem 0 0 0;
  font-size: 0.72rem;
  color: ${COLORS.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CancelBtn = styled.button`
  margin-top: 0.4rem;
  background: none;
  border: none;
  color: ${COLORS.danger};
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
`;

// Feedback
const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1rem;

  &.success { background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); }
  &.error { background: rgba(231, 76, 60, 0.1); color: #B91C1C; border: 1px solid rgba(231, 76, 60, 0.3); }
`;

const Empty = styled.div`
  text-align: center;
  padding: 1rem 0;
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
  padding: 0.5rem 0;

  svg { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ===== CALENDAR: click a start day then an end day, or drag across days =====

function LeaveCalendar({ myLeaves, rangeStart, rangeEnd, onRangeChange }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const dragAnchor = useRef(null);      // day the pointer went down on (drag)
  const lastDownDay = useRef(null);     // tells a simple click apart from a drag
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

    // If no single-day anchor is active, start (or restart) the selection at
    // the pressed day. If one IS active, keep it so the next click can
    // complete the range (click start -> click end).
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

    // Genuine click = pressed & released on the same day without dragging.
    if (ds && lastDownDay.current === ds) {
      const singleAnchor = rangeStart && rangeEnd && rangeStart === rangeEnd;
      if (singleAnchor && ds !== rangeStart) {
        // Second click: complete the range from the anchored start day.
        const a = rangeStart < ds ? rangeStart : ds;
        const b = rangeStart < ds ? ds : rangeStart;
        onRangeChange(a, b);
      } else {
        // First click (or re-anchor): mark the clicked day as the anchor.
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
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <CalNavBtn onClick={goToday} type="button" title="Today" style={{ width: 'auto', padding: '0 0.6rem', fontSize: '0.72rem' }}>Today</CalNavBtn>
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
              $anchor={isAnchor}
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
              {isAnchor ? (
                <CalAnchor>{isStart && isEnd ? 'Selected' : isStart ? 'Start' : 'End'}</CalAnchor>
              ) : (
                dayLeaves.length > 0 && (
                  <CalDots>
                    {uniqueStatuses.slice(0, 4).map((s) => (
                      <CalDot key={s} $color={(statusColors[s] || statusColors.pending).fg} />
                    ))}
                  </CalDots>
                )
              )}
            </CalCell>
          );
        })}
      </CalGrid>

      <CalHint>Click your start date, then your end date - or press &amp; drag across the days.</CalHint>
    </div>
  );
}

// ─── ALL MY APPLICATIONS (full history + status) ─────────────────────────────

const HistoryCard = styled.div`
  margin-top: 1.5rem;
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 1.2rem 1.4rem 1.4rem 1.4rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
`;

const HistoryHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid ${COLORS.border};
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const FilterChip = styled.button`
  border: 1px solid ${(p) => (p.$active ? COLORS.primary : COLORS.border)};
  background: ${(p) => (p.$active ? COLORS.primary : COLORS.white)};
  color: ${(p) => (p.$active ? COLORS.white : COLORS.textSecondary)};
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${COLORS.primary}; }
`;

const HistRow = styled.div`
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-top: 0.6rem;
  background: ${COLORS.white};
`;

const HistTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const HistType = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.text};
  text-transform: capitalize;
`;

const RefCode = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  font-family: monospace;
  color: ${COLORS.textSecondary};
  background: ${COLORS.bg};
  padding: 0.12rem 0.45rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
`;

const HistMeta = styled.div`
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: ${COLORS.textSecondary};
`;

const HistReason = styled.div`
  margin-top: 0.45rem;
  font-size: 0.8rem;
  color: ${COLORS.text};
  background: ${COLORS.bg};
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
`;

const RejectBox = styled.div`
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #B91C1C;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.25);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
`;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const ApplyLeave = () => {
    const navigate = useNavigate();

    // ── User identity from localStorage ──
    // user id comes from localStorage and is sent on every apply request
    // (x-user-id header + user_id in the body).
    const userId = getUserId();
    const userName = (() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.full_name || u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email || 'You';
        } catch { return 'You'; }
    })();

    // ── Multi-tenant: leaves ALWAYS go to the parent/main database ──
    // The leave service stores every leave in the parent tenant's main DB, so
    // we explicitly send the parent slug for branch users (falls back to the
    // current tenant slug when there is no parent, e.g. the parent itself).
    // NOTE: spread order matters — the default axios interceptor sets
    // x-tenant-slug from getTenantSlug(); our explicit parentSlug MUST win,
    // so it goes AFTER tenantHeaders. x-user-id is also required on
    // MY_LEAVES/BALANCE so the backend can scope to the logged-in employee.
    const parentSlug = getParentTenantSlug() || getTenantSlug();
    const tenantHeaders = useMemo(() => {
      const h = { 'x-tenant-slug': parentSlug };
      if (userId) h['x-user-id'] = String(userId);
      return { headers: h };
    }, [parentSlug, userId]);

    // ── State ──
    const [myLeaves, setMyLeaves] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null); // { type: 'success'|'error', msg }
    const [range, setRange] = useState({ start: null, end: null });
    const [form, setForm] = useState({ type: '', priority: 'medium', reason: '' });
    const [file, setFile] = useState(null);
    const [drag, setDrag] = useState(false);
    // Filter for the "My leave applications" section below (all | pending | approved | rejected | cancelled)
    const [historyFilter, setHistoryFilter] = useState('all');

    // ── Data loading (own leaves + balance, via parent/main database) ──
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

    // ── Derived ──
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
    const usedPct = initial > 0 ? Math.min(100, (used / initial) * 100) : 0;
    const pendingPct = initial > 0 ? Math.min(100 - usedPct, (pending / initial) * 100) : 0;

    const pendingRequests = useMemo(
        () => myLeaves.filter((l) => l.status === 'pending'),
        [myLeaves]
    );
    const recentRequests = useMemo(() => myLeaves.slice(0, 6), [myLeaves]);

    // ── Full application history (ALL my applications + their status) ──
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

    const canSubmit = Boolean(userId && form.type && range.start && range.end && form.reason.trim() && !submitting);

    // ── Actions ──
    const handleRangeChange = useCallback((start, end) => {
        setRange({ start, end });
        setBanner(null);
    }, []);

    const clearRange = () => setRange({ start: null, end: null });

    const handleSubmit = async () => {
        if (!canSubmit) return;
        // Explicit guard so the user sees WHICH field is missing (the backend
        // only returns a combined "Leave type, start date, and end date are
        // required" message).
        if (!form.type.trim()) {
            setBanner({ type: 'error', msg: 'Please select a leave type' });
            return;
        }
        setSubmitting(true);
        setBanner(null);
        try {
            const payload = {
                // Identity comes from localStorage — the service trusts x-user-id
                // header (set by the axios interceptor) and body user_id.
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
            console.log('[ApplyLeave] Submitting payload:', payload);
            console.log('[ApplyLeave] Headers:', tenantHeaders);
            const res = await api.post(ENDPOINTS.LEAVE.APPLY, payload, tenantHeaders);
            const created = res?.data?.data || res?.data;
            console.log('[ApplyLeave] Response:', created);

            // Optional supporting document upload
            if (file && created?.id) {
                try {
                    const fd = new FormData();
                    fd.append('document', file);
                    await api.post(ENDPOINTS.LEAVE.UPLOAD_DOCUMENT(created.id), fd, {
                        ...tenantHeaders,
                        headers: { ...tenantHeaders.headers, 'Content-Type': null },
                    });
                } catch (upErr) {
                    console.warn('Document upload failed (leave was submitted):', upErr);
                }
            }

            setBanner({ type: 'success', msg: `Leave request submitted for ${formatDate(range.start)} → ${formatDate(range.end)}` });
            setForm({ type: '', priority: 'medium', reason: '' });
            setFile(null);
            setRange({ start: null, end: null });
            // Optimistically show the new request immediately so the user sees
            // it even if the follow-up fetch is slow or the network hiccups.
            if (created && created.id) {
                setMyLeaves((prev) => {
                    const list = Array.isArray(prev) ? prev : [];
                    return [created, ...list.filter((l) => l.id !== created.id)];
                });
            }
            await loadData();
        } catch (err) {
            console.error('[ApplyLeave] Submit failed:', {
                message: err?.message,
                status: err?.response?.status,
                data: err?.response?.data,
                stack: err?.stack
            });
            const msg = err?.response?.data?.message || err?.message || 'Failed to submit leave request';
            setBanner({ type: 'error', msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (leaveId) => {
        try {
            await api.patch(ENDPOINTS.LEAVE.CANCEL(leaveId), {}, tenantHeaders);
            setBanner({ type: 'success', msg: 'Leave request cancelled' });
            await loadData();
        } catch (err) {
            setBanner({ type: 'error', msg: err?.response?.data?.message || 'Failed to cancel request' });
        }
    };

    // ── Not logged in ──
    if (!userId) {
        return (
            <Container>
                <Banner className="error"><AlertCircle size={16} /> You must be logged in to apply for leave.</Banner>
            </Container>
        );
    }

    // ── Render ──
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
                    {banner.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {banner.msg}
                </Banner>
            )}

            <Layout>
                {/* ── Left column: calendar + form ── */}
                <div>
                    <Card>
                        <CardTitle><Calendar size={16} /> 1. Select your dates</CardTitle>
                        <LeaveCalendar
                            myLeaves={myLeaves}
                            rangeStart={range.start}
                            rangeEnd={range.end}
                            onRangeChange={handleRangeChange}
                        />
                    </Card>

                    <Card>
                        <CardTitle><FileText size={16} /> 2. Leave details</CardTitle>
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
                                        <DaysBadge>
                                            {days} day{days === 1 ? '' : 's'}
                                        </DaysBadge>
                                        <CardTitleAction type="button" onClick={clearRange}>Clear</CardTitleAction>
                                    </DateRangeBox>
                                ) : (
                                    <Empty>No dates selected yet — drag on the calendar above.</Empty>
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
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <DropZone
                                    $drag={drag}
                                    onClick={() => document.getElementById('leave-file-input')?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                                    onDragLeave={() => setDrag(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDrag(false);
                                        const f = e.dataTransfer?.files?.[0];
                                        if (f) setFile(f);
                                    }}
                                >
                                    {file ? (
                                        <FileChip>
                                            <FileText size={16} />
                                            {file.name}
                                            <button
                                                type="button"
                                                aria-label="Remove file"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </FileChip>
                                    ) : (
                                        <>
                                            <Upload size={22} />
                                            <p>Drag &amp; drop a file here, or <span className="browse">browse</span></p>
                                            <p className="hint">PDF, JPG or PNG — one supporting document</p>
                                        </>
                                    )}
                                </DropZone>
                            </FormGroup>
                        </FormGrid>

                        <Actions>
                            <Btn className="secondary" type="button" onClick={() => navigate(-1)}>
                                Cancel
                            </Btn>
                            <Btn className="primary" type="button" disabled={!canSubmit} onClick={handleSubmit}>
                                {submitting ? <Loader2 size={16} /> : <CheckCircle size={16} />}
                                {submitting ? 'Submitting...' : 'Submit request'}
                            </Btn>
                        </Actions>
                    </Card>
                </div>

                {/* ── Right column: balance + my requests ── */}
                <div>
                    <Card>
                        <CardTitle>Leave balance</CardTitle>
                        {loading ? (
                            <LoadingRow><Loader2 size={14} /> Loading your balance...</LoadingRow>
                        ) : (
                            <>
                                <BalanceBig>
                                    <div className="num">{available ?? '—'}</div>
                                    <div className="lbl">days available</div>
                                </BalanceBig>
                                <Bar>
                                    <div className="used" style={{ width: `${usedPct}%` }} />
                                    <div className="pending" style={{ width: `${pendingPct}%` }} />
                                </Bar>
                                <Breakdown>
                                    <div className="row"><span className="k">Entitlement</span><span className="v">{initial}</span></div>
                                    <div className="row"><span className="k">Taken</span><span className="v">{used}</span></div>
                                    <div className="row"><span className="k">Pending</span><span className="v warning">{pending}</span></div>
                                    <div className="row"><span className="k">Available</span><span className="v primary">{available ?? '—'}</span></div>
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
                            <LoadingRow><Loader2 size={14} /> Loading your requests...</LoadingRow>
                        ) : recentRequests.length === 0 ? (
                            <Empty>No leave requests yet — apply for your first one here.</Empty>
                        ) : (
                            recentRequests.map((l) => (
                                <ReqItem key={l.id || `${l.start_date}-${l.end_date}`}>
                                    <ReqTop>
                                        <ReqType>{String(l.leave_type || 'leave').replace('_', ' ')}</ReqType>
                                        <StatusBadge $status={l.status}>{l.status}</StatusBadge>
                                    </ReqTop>
                                    <ReqMeta>
                                        {formatDate(l.start_date)} &rarr; {formatDate(l.end_date)}
                                        {' '}&middot;{' '}
                                        {l.days ?? countBusinessDays(l.start_date, l.end_date)} day(s)
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

            {/* ── ALL my leave applications & their status ── */}
            <HistoryCard>
                <HistoryHead>
                    <CardTitle style={{ margin: 0 }}><FileText size={16} /> My leave applications</CardTitle>
                    <FilterRow>
                        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
                            <FilterChip key={s} $active={historyFilter === s} onClick={() => setHistoryFilter(s)}>
                                {s} ({historyCounts[s] ?? 0})
                            </FilterChip>
                        ))}
                    </FilterRow>
                </HistoryHead>

                {loading ? (
                    <LoadingRow><Loader2 size={14} /> Loading your applications...</LoadingRow>
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
                            <HistRow key={l.id || `${l.start_date}-${l.end_date}-${l.created_at}`}>
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
                                    <RejectBox><AlertCircle size={13} /> {l.rejection_reason}</RejectBox>
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
