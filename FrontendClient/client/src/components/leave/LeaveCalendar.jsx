import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

/*
  Leave Range Calendar
  A self-contained month-view calendar that highlights, for a given
  employee, the period they went on leave (start_date) up to the day
  they returned / finished (end_date).
*/

const COLORS = {
  primary: '#0A2463',
  primaryLight: '#1A3A7A',
  primarySoft: 'rgba(10, 36, 99, 0.05)',
  white: '#FFFFFF',
  bg: '#F9FAFB',
  bgAlt: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const STATUS_STYLE = {
  approved: { dot: '#10B981', label: '#047857', bg: 'rgba(16, 185, 129, 0.1)' },
  pending: { dot: '#F59E0B', label: '#B45309', bg: 'rgba(245, 158, 11, 0.1)' },
  rejected: { dot: '#EF4444', label: '#B91C1C', bg: 'rgba(239, 68, 68, 0.1)' },
  cancelled: { dot: '#94A3B8', label: '#475569', bg: 'rgba(148, 163, 184, 0.1)' },
};

const TYPE_LABEL = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity', paternity: 'Paternity',
  compassionate: 'Compassionate', study: 'Study', unpaid: 'Unpaid',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const date = new Date(d);
  if (isNaN(date)) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const startOfDay = (d) => {
  const ds = toYMD(d);
  return ds ? new Date(`${ds}T00:00:00`) : null;
};

const endOfDay = (d) => {
  const ds = toYMD(d);
  return ds ? new Date(`${ds}T23:59:59`) : null;
};

const formatDateShort = (d) => {
  const ds = toYMD(d);
  if (!ds) return '-';
  const date = new Date(`${ds}T12:00:00`);
  if (isNaN(date)) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Styled Components ─────────────────────────────────────────────

const Wrapper = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: ${COLORS.white};
`;

const NavBtn = styled.button`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textSecondary};
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);

  &:hover {
    background: ${COLORS.primary};
    border-color: ${COLORS.primary};
    color: ${COLORS.white};
    transform: translateY(-1px);
  }
  
  &.today-btn {
    width: auto;
    padding: 0 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
  }
`;

const Title = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${COLORS.text};
  letter-spacing: -0.01em;
`;

const WeekdaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: ${COLORS.bgAlt};
  border-top: 1px solid ${COLORS.border};
  border-bottom: 1px solid ${COLORS.border};
`;

const WeekdayCell = styled.div`
  text-align: center;
  padding: 0.65rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${COLORS.textSecondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: ${COLORS.border}; /* Acts as grid lines */
  gap: 1px; 
  border-bottom: 1px solid ${COLORS.border};
`;

const DayCell = styled.div`
  height: 54px;
  padding: 4px;
  position: relative;
  background: ${(p) => (p.$today ? COLORS.primarySoft : COLORS.white)};
  transition: background 0.15s;
  
  &:hover {
    background: ${(p) => (p.$today ? COLORS.primarySoft : COLORS.bg)};
  }
`;

const DayNum = styled.div`
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$today ? '700' : '500')};
  color: ${(p) =>
    p.$today ? COLORS.primary : COLORS.text};
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  ${(p) => p.$today && `background: rgba(10, 36, 99, 0.1);`}
`;

const MarkerContainer = styled.div`
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px;
`;

const DayMarker = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${(p) => p.$color};
  cursor: ${(p) => (p.$interactive ? 'pointer' : 'default')};
  transition: transform 0.15s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ExtraLeaveText = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${COLORS.textSecondary};
  padding-left: 4px;
`;

// ─── Timeline Section ─────────────────────────────────────────────

const TimelineWrapper = styled.div`
  padding: 1.5rem;
  background: ${COLORS.bg};
`;

const TimelineHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TimelineTitle = styled.h4`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.text};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

const TimelineScroll = styled.div`
  max-height: 260px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
`;

const PeriodCard = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: box-shadow 0.2s, border-color 0.2s;
  cursor: ${(p) => (p.$clickable ? 'pointer' : 'default')};
  
  &:hover {
    border-color: ${COLORS.primaryLight};
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }
`;

const PeriodHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const PeriodDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

const PeriodLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.text};
  flex: 1;
`;

const PeriodDaysBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
`;

const PeriodBarWrap = styled.div`
  height: 10px;
  background: ${COLORS.bgAlt};
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;

const PeriodBar = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  background: ${(p) => p.$color};
  transition: width 0.3s ease, left 0.3s ease;
`;

const PeriodDates = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${COLORS.textSecondary};
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  font-size: 0.75rem;
  color: ${COLORS.textSecondary};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
`;

const LegendDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: ${(p) => p.$color};
`;

/* ═══════════════════════════════════════════════════════════════
   LeaveCalendar component
   ═══════════════════════════════════════════════════════════════ */

const LeaveCalendar = ({ leaves = [], onLeaveClick }) => {
  const today = new Date();
  const todayYmd = `${pad(today.getFullYear())}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Normalise the incoming leave range data
  const ranges = useMemo(() => {
    return leaves
      .map((l) => {
        const start = startOfDay(l.start_date);
        const end = endOfDay(l.end_date);
        if (!start || !end) return null;
        const status = (l.status || 'pending').toLowerCase();
        const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
        return {
          id: l.id,
          title: l.name
            ? `${l.name} · ${l.leave_type ? TYPE_LABEL[l.leave_type] || l.leave_type : 'Leave'}`
            : (l.leave_type ? TYPE_LABEL[l.leave_type] || l.leave_type : 'Leave'),
          start,
          end,
          days: Number(l.days) || 0,
          status,
          style,
          leave: l,
        };
      })
      .filter(Boolean);
  }, [leaves]);

  // Pick an initial month: the earliest leave's start, else today
  const initialMonth = useMemo(() => {
    if (ranges.length === 0) {
      return { year: today.getFullYear(), month: today.getMonth() };
    }
    const earliest = ranges.reduce(
      (min, r) => (r.start < min ? r.start : min),
      ranges[0].start,
    );
    return { year: earliest.getFullYear(), month: earliest.getMonth() };
  }, [ranges, today]);

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  // Build the grid: leading blanks + days
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push({ blank: true, date: null });
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(viewYear, viewMonth, d);
    cells.push({ blank: false, date, ymd: toYMD(date) });
  }

  // Ranges covering a given day
  const rangesForDay = useCallback(
    (ymd) =>
      ranges.filter((r) => ymd && r.start <= endOfDay(ymd) && r.end >= startOfDay(ymd)),
    [ranges],
  );

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', {
    month: 'long',
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Timeline spans across the earliest start -> latest end of all ranges
  const timelineSpan = useMemo(() => {
    if (ranges.length === 0) return { minStart: null, maxEnd: null, spanMs: 0 };
    const minStart = ranges.reduce(
      (a, x) => (x.start < a ? x.start : a),
      ranges[0].start,
    );
    const maxEnd = ranges.reduce(
      (a, x) => (x.end > a ? x.end : a),
      ranges[0].end,
    );
    return { minStart, maxEnd, spanMs: maxEnd.getTime() - minStart.getTime() };
  }, [ranges]);

  return (
    <Wrapper>
      <CalHeader>
        <NavBtn onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft size={18} />
        </NavBtn>
        <Title>
          {monthName} {viewYear}
        </Title>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <NavBtn className="today-btn" onClick={goToToday} aria-label="Today">
            Today
          </NavBtn>
          <NavBtn onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </NavBtn>
        </div>
      </CalHeader>

      <WeekdaysRow>
        {WEEKDAYS.map((w) => (
          <WeekdayCell key={w}>{w}</WeekdayCell>
        ))}
      </WeekdaysRow>

      <Grid>
        {cells.map((cell, i) => {
          if (cell.blank) return <DayCell key={`blank-${i}`} style={{ background: COLORS.bg }} />;

          const isToday = cell.ymd === todayYmd;
          const dayRanges = rangesForDay(cell.ymd);
          const visible = dayRanges.slice(0, 2);
          const extra = dayRanges.length - visible.length;

          return (
            <DayCell key={cell.ymd} $today={isToday}>
              <DayNum $today={isToday}>{cell.date.getDate()}</DayNum>
              {dayRanges.length > 0 && (
                <MarkerContainer>
                  {visible.map((r) => (
                    <DayMarker
                      key={r.id}
                      $color={r.style.dot}
                      $interactive={Boolean(onLeaveClick)}
                      title={`${r.title} (${r.status})`}
                      role={onLeaveClick ? 'button' : undefined}
                      tabIndex={onLeaveClick ? 0 : undefined}
                      onClick={onLeaveClick ? () => onLeaveClick(r.leave) : undefined}
                      onKeyDown={onLeaveClick ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') onLeaveClick(r.leave);
                      } : undefined}
                    />
                  ))}
                  {extra > 0 && (
                    <ExtraLeaveText>+{extra} more</ExtraLeaveText>
                  )}
                </MarkerContainer>
              )}
            </DayCell>
          );
        })}
      </Grid>

      {/* Timeline: leave ranges shown from start date up to the day they returned */}
      <TimelineWrapper>
        <TimelineHead>
          <TimelineTitle>Leave Periods</TimelineTitle>
        </TimelineHead>

        {ranges.length === 0 ? (
          <EmptyState>
            <CalendarIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>
              No leave history found for this employee.
            </p>
          </EmptyState>
        ) : (
          <TimelineScroll>
            {ranges.map((r) => {
              const { minStart, spanMs } = timelineSpan;
              const leftPct = spanMs > 0 ? ((r.start.getTime() - minStart.getTime()) / spanMs) * 100 : 0;
              const widthPct = spanMs > 0 ? ((r.end.getTime() - r.start.getTime()) / spanMs) * 100 : 0;

              return (
                <PeriodCard
                  key={r.id}
                  $clickable={Boolean(onLeaveClick)}
                  onClick={onLeaveClick ? () => onLeaveClick(r.leave) : undefined}
                >
                  <PeriodHeader>
                    <PeriodDot $color={r.style.dot} />
                    <PeriodLabel>{r.title}</PeriodLabel>
                    <PeriodDaysBadge $bg={r.style.bg} $color={r.style.label}>
                      {r.days} day{r.days !== 1 ? 's' : ''}
                    </PeriodDaysBadge>
                  </PeriodHeader>

                  <PeriodBarWrap>
                    <PeriodBar
                      $color={r.style.dot}
                      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 4)}%` }}
                    />
                  </PeriodBarWrap>

                  <PeriodDates>
                    <span>Start: {formatDateShort(r.start)}</span>
                    <span>End: {formatDateShort(r.end)}</span>
                  </PeriodDates>
                </PeriodCard>
              );
            })}
          </TimelineScroll>
        )}
      </TimelineWrapper>

      <Legend>
        <LegendItem>
          <LegendDot $color={STATUS_STYLE.approved.dot} /> Approved
        </LegendItem>
        <LegendItem>
          <LegendDot $color={STATUS_STYLE.pending.dot} /> Pending
        </LegendItem>
        <LegendItem>
          <LegendDot $color={STATUS_STYLE.rejected.dot} /> Rejected
        </LegendItem>
        <LegendItem>
          <LegendDot $color={STATUS_STYLE.cancelled.dot} /> Cancelled
        </LegendItem>
        <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
          {ranges.length} leave{ranges.length !== 1 ? 's' : ''}
        </span>
      </Legend>
    </Wrapper>
  );
};

export default LeaveCalendar;