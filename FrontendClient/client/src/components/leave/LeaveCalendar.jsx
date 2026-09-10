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

const STATUS_STYLE = {
  approved: { tint: '#dcfce7', dot: '#22c581', badge: '#f0fdf4', label: '#166534' },
  pending: { tint: '#fef9c4', dot: '#f59e0b', badge: '#fefceb', label: '#854d0e' },
  rejected: { tint: '#fee2e2', dot: '#ef4444', badge: '#fef2f2', label: '#991b1b' },
  cancelled: { tint: '#f1f5f9', dot: '#94a3b8', badge: '#f8fafc', label: '#475569' },
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

const Wrapper = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  overflow: hidden;
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.bg};
`;

const NavBtn = styled.button`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textSecondary};
  transition: all 0.2s;
  &:hover {
    background: ${COLORS.primary};
    color: ${COLORS.white};
  }
`;

const Title = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.text};
`;

const WeekdaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: ${COLORS.bg};
  border-bottom: 1px solid ${COLORS.border};
`;

const WeekdayCell = styled.div`
  text-align: center;
  padding: 0.45rem 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${COLORS.textSecondary};
`;


const DayNum = styled.div`
  font-size: 0.7rem;
  font-weight: ${(p) => (p.$today ? '700' : '500')};
  color: ${(p) =>
    p.$today ? COLORS.primary : p.$muted ? COLORS.textSecondary : COLORS.text};
  padding: 2px 4px;
`;

const DayMarker = styled.span`
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  margin-top: 2px;
  background: ${(p) => p.$color || COLORS.info};
  cursor: ${(p) => (p.$interactive ? 'pointer' : 'default')};
`;

const Timeline = styled.div`
  padding: 1rem;
`;

const PeriodRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
`;

const PeriodBarWrap = styled.div`
  flex: 1;
  height: 18px;
  background: ${COLORS.bg};
  border-radius: 9px;
  overflow: hidden;
  position: relative;
  min-width: 60px;
`;

const PeriodBar = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9px;
  background: ${(p) => p.$color || COLORS.info};
`;

const PeriodDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(p) => p.$color || COLORS.info};
  flex-shrink: 0;
`;

const PeriodLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${COLORS.text};
  min-width: 90px;
`;

const PeriodDates = styled.div`
  font-size: 0.78rem;
  color: ${COLORS.textSecondary};
  white-space: nowrap;
`;

const PeriodDays = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${(p) => p.$color || COLORS.info};
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.bg};
  font-size: 0.76rem;
  color: ${COLORS.textSecondary};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`;

const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: ${(p) => p.$color};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2.5rem 1rem;
  color: ${COLORS.textSecondary};
`;

const SectionLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const DayCell = styled.div`
  height: 54px;
  padding: 3px;
  border-bottom: 1px solid ${COLORS.border};
  border-right: 1px solid ${COLORS.border};
  position: relative;
  background: ${(p) => (p.$today ? '#eff4ff' : COLORS.white)};
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
          <ChevronLeft size={16} />
        </NavBtn>
        <Title>
          {monthName} {viewYear}
        </Title>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <NavBtn onClick={goToToday} aria-label="Today">
            Today
          </NavBtn>
          <NavBtn onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={16} />
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
          if (cell.blank) return <DayCell key={`blank-${i}`} />;
          const isToday = cell.ymd === todayYmd;
          const dayRanges = rangesForDay(cell.ymd);
          const visible = dayRanges.slice(0, 2);
          const extra = dayRanges.length - visible.length;
          return (
            <DayCell key={cell.ymd} $today={isToday}>
              <DayNum $today={isToday}>{cell.date.getDate()}</DayNum>
              {dayRanges.length > 0 && (
                <div
                  style={{
                    marginTop: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
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
                    <DayNum $muted style={{ fontSize: '0.6rem' }}>
                      +{extra}
                    </DayNum>
                  )}
                </div>
              )}
            </DayCell>
          );
        })}
      </Grid>

      {/* Timeline: leave ranges shown from start date up to the day they returned */}
      <Timeline>
        <SectionLabel>Leave Periods</SectionLabel>
        {ranges.length === 0 ? (
          <EmptyState>
            <CalendarIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              No leave history found for this employee.
            </p>
          </EmptyState>
        ) : (
          ranges.map((r) => {
            const { minStart, spanMs } = timelineSpan;
            const leftPct =
              spanMs > 0
                ? ((r.start.getTime() - minStart.getTime()) / spanMs) * 100
                : 0;
            const widthPct =
              spanMs > 0 ? ((r.end.getTime() - r.start.getTime()) / spanMs) * 100 : 0;
            return (
              <PeriodRow
                key={r.id}
                onClick={onLeaveClick ? () => onLeaveClick(r.leave) : undefined}
                style={onLeaveClick ? { cursor: 'pointer' } : undefined}
                title={onLeaveClick ? 'Open leave record' : undefined}
              >
                <PeriodDot $color={r.style.dot} />
                <PeriodLabel>{r.title}</PeriodLabel>
                <PeriodBarWrap>
                  <PeriodBar
                    $color={r.style.dot}
                    style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 4)}%` }}
                  />
                </PeriodBarWrap>
                <PeriodDates>
                  {formatDateShort(r.start)} → {formatDateShort(r.end)}
                </PeriodDates>
                <PeriodDays $color={r.style.dot}>
                  {r.days} day{r.days !== 1 ? 's' : ''}
                </PeriodDays>
              </PeriodRow>
            );
          })
        )}
      </Timeline>

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
        <span
          style={{
            marginLeft: 'auto',
            color: COLORS.textSecondary,
            fontSize: '0.72rem',
          }}
        >
          {ranges.length} leave{ranges.length !== 1 ? 's' : ''}
        </span>
      </Legend>
    </Wrapper>
  );
};

export default LeaveCalendar;
