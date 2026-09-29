// LeaveCalendar.jsx
// Read-only month view used inside the EMPLOYEE PROFILE drawer.
//
// Visual language deliberately matches the calendar on the Apply-for-Leave
// page (weekend shading, a blue ring on today, leave ranges painted as a
// continuous band across the days they cover, status dots underneath) so the
// same dates read the same way everywhere in the leave module.

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

/* Palette lifted from ApplyLeave.jsx so the two calendars match exactly. */
const C = {
  black: '#0a0a0a',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#e0e0e0',
  borderLight: '#efefef',
  bgField: '#f7f7f5',
  bgSection: '#fafaf9',
  infoBg: '#e0e7ff',
  cBlue: '#00296B',
  white: '#FFFFFF',
};

/* Status -> the dot colour under the day number, same as ApplyLeave. */
const STATUS_STYLE = {
  pending: { dot: '#b45309', label: 'Pending', bg: '#fffbeb', fg: '#b45309' },
  approved: { dot: '#047857', label: 'Approved', bg: '#ecfdf5', fg: '#047857' },
  rejected: { dot: '#dc2626', label: 'Rejected', bg: '#fef2f2', fg: '#dc2626' },
  cancelled: { dot: '#6b7280', label: 'Cancelled', bg: '#f3f4f6', fg: '#6b7280' },
};

const TYPE_LABEL = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity', paternity: 'Paternity',
  compassionate: 'Compassionate', study: 'Study', unpaid: 'Unpaid',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');

/** Anything -> 'YYYY-MM-DD', parsed as LOCAL so the day never shifts a zone. */
const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDateShort = (d) => {
  const ds = toYMD(d);
  if (!ds) return '—';
  return new Date(`${ds}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ─── Styled components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: ${C.bgSection};
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
`;

const CalNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CalMonth = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${C.black};
`;

const CalNavRight = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CalBtn = styled.button`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${C.border};
  background: ${C.bgSection};
  border-radius: 6px;
  color: ${C.gray};
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover { border-color: ${C.cBlue}; color: ${C.cBlue}; background: ${C.bgField}; }
  &.today { width: auto; padding: 0 0.75rem; font-size: 0.75rem; font-weight: 600; }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const CalDow = styled.div`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${C.lightGray};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 0;
`;

/* A day inside a leave range. The band looks continuous because the only gap
   between cells is the 2px grid gap, exactly as on ApplyLeave. */
const Cell = styled.div`
  position: relative;
  min-height: 52px;
  border-radius: 6px;
  padding: 4px;
  background: ${(p) => (p.$weekend ? C.bgField : C.bgSection)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: background 0.15s;

  ${(p) => p.$inRange && `background: ${C.infoBg}; border-radius: 0;`}
  ${(p) => p.$inRange && p.$start && 'border-top-left-radius: 6px; border-bottom-left-radius: 6px;'}
  ${(p) => p.$inRange && p.$end && 'border-top-right-radius: 6px; border-bottom-right-radius: 6px;'}
`;

const DayNum = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${C.black};
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  ${(p) => p.$today && !p.$onRange && `border: 2px solid ${C.cBlue}; color: ${C.cBlue};`}
  ${(p) => p.$onRange && `background: ${C.cBlue}; color: #fff; font-weight: 600;`}
`;

const Dots = styled.div`
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 3px;
`;

const Dot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

/* ── Periods list ──────────────────────────────────────────────────────────── */

const PeriodsHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1.5rem 0 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${C.borderLight};
`;

const PeriodsTitle = styled.h4`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${C.black};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

const PeriodsCount = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: ${C.cBlue};
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
`;

const PeriodsScroll = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.25rem;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
`;

const PeriodRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.4rem;
  border: 1px solid ${C.borderLight};
  border-left: 4px solid ${(p) => p.$color};
  border-radius: 6px;
  background: ${C.white};
`;

const PeriodBody = styled.div`flex: 1; min-width: 0;`;

const PeriodName = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${C.black};
`;

const PeriodMeta = styled.div`
  font-size: 0.75rem;
  color: ${C.gray};
  margin-top: 2px;
`;

const StatusTag = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  white-space: nowrap;
`;

const DaysTag = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${C.cBlue};
  white-space: nowrap;
`;

const Empty = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${C.gray};
  font-size: 0.8rem;
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid ${C.borderLight};
  font-size: 0.7rem;
  color: ${C.gray};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
`;

const LegendDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

// ─── Component ────────────────────────────────────────────────────────────────

const LeaveCalendar = ({ leaves = [] }) => {
  const today = new Date();
  const todayYmd = `${pad(today.getFullYear())}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Normalise once: each leave becomes a plain YYYY-MM-DD span we can compare.
  const ranges = useMemo(
    () => leaves
      .map((l) => {
        const start = toYMD(l.start_date);
        const end = toYMD(l.end_date);
        if (!start || !end) return null;
        const status = String(l.status || 'pending').toLowerCase();
        return {
          id: l.id,
          start,
          end,
          status,
          style: STATUS_STYLE[status] || STATUS_STYLE.pending,
          typeLabel: TYPE_LABEL[l.leave_type] || l.leave_type || 'Leave',
          days: Number(l.days) || 0,
          leave: l,
        };
      })
      .filter(Boolean),
    [leaves],
  );

  /** Every non-cancelled leave covering this day - drives both band and dots. */
  const covers = (ymd) =>
    ranges.filter((r) => r.status !== 'cancelled' && ymd >= r.start && ymd <= r.end);

  // Open on the current month, unless a leave is still upcoming.
  const initial = useMemo(() => {
    const upcoming = ranges.find((r) => r.end >= todayYmd);
    if (upcoming) {
      const d = new Date(`${upcoming.start}T12:00:00`);
      if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [ranges, todayYmd, today]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
  }
  while (cells.length % 7) cells.push(null);

  const shift = (n) => {
    const m = viewMonth + n;
    if (m < 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else if (m > 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth(m);
  };

  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  // Newest first, so the most recent leave is always at the top of the list.
  const periods = useMemo(() => [...ranges].sort((a, b) => (a.start < b.start ? 1 : -1)), [ranges]);

  if (ranges.length === 0) {
    return (
      <Wrapper>
        <Empty>
          <CalendarIcon size={30} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No leave history for this employee yet.</div>
        </Empty>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <CalNav>
        <CalBtn onClick={() => shift(-1)} aria-label="Previous month" type="button">
          <ChevronLeft size={15} />
        </CalBtn>
        <CalMonth>{MONTH_NAMES[viewMonth]} {viewYear}</CalMonth>
        <CalNavRight>
          <CalBtn className="today" onClick={goToday} type="button">Today</CalBtn>
          <CalBtn onClick={() => shift(1)} aria-label="Next month" type="button">
            <ChevronRight size={15} />
          </CalBtn>
        </CalNavRight>
      </CalNav>

      <CalGrid>
        {WEEKDAYS.map((w) => <CalDow key={w}>{w}</CalDow>)}
        {cells.map((ymd, i) => {
          if (!ymd) return <Cell key={`e${i}`} />;
          const day = Number(ymd.slice(-2));
          const dow = new Date(`${ymd}T12:00:00`).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const active = covers(ymd);
          const isStart = active.some((r) => r.start === ymd);
          const isEnd = active.some((r) => r.end === ymd);
          const onRange = active.length > 0;
          const statuses = [...new Set(active.map((r) => r.status))].slice(0, 3);

          return (
            <Cell
              key={ymd}
              $weekend={isWeekend}
              $inRange={onRange}
              $start={isStart}
              $end={isEnd}
              title={active.map((r) => `${r.typeLabel} (${r.status})`).join(', ')}
            >
              <DayNum $today={ymd === todayYmd} $onRange={isStart || isEnd}>{day}</DayNum>
              {onRange && (
                <Dots>
                  {statuses.map((s) => (
                    <Dot key={s} $color={(STATUS_STYLE[s] || STATUS_STYLE.pending).dot} />
                  ))}
                </Dots>
              )}
            </Cell>
          );
        })}
      </CalGrid>

      <Legend>
        {['pending', 'approved', 'rejected'].map((s) => (
          <LegendItem key={s}>
            <LegendDot $color={STATUS_STYLE[s].dot} />
            {STATUS_STYLE[s].label}
          </LegendItem>
        ))}
      </Legend>

      <PeriodsHead>
        <PeriodsTitle>Leave periods</PeriodsTitle>
        <PeriodsCount>{periods.length}</PeriodsCount>
      </PeriodsHead>

      <PeriodsScroll>
        {periods.map((r) => (
          <PeriodRow key={r.id} $color={r.style.dot}>
            <PeriodBody>
              <PeriodName>{r.typeLabel}</PeriodName>
              <PeriodMeta>
                {formatDateShort(r.start)} → {formatDateShort(r.end)}
              </PeriodMeta>
            </PeriodBody>
            <DaysTag>{r.days} day{r.days === 1 ? '' : 's'}</DaysTag>
            <StatusTag $bg={r.style.bg} $color={r.style.fg}>{r.status}</StatusTag>
          </PeriodRow>
        ))}
      </PeriodsScroll>
    </Wrapper>
  );
};

export default LeaveCalendar;
