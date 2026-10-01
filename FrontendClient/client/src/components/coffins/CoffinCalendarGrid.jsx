import React, { useMemo } from 'react';
import styled from 'styled-components';
import { startOfWeek, addDays, isSameDay, isSameMonth, isToday, format } from 'date-fns';

/* Coffin reservations â€” DAY and WEEK calendar grids.
 *
 * These mirror what the hearse calendar does instead of rendering the same
 * flat table for every view: DAY shows that day's reservations on a time
 * spine, WEEK lays the seven days of the selected week out side by side with
 * each day's bookings as chips. MONTH continues to use the parent's table.
 *
 * Coffins carry `service_time` only when the booking was given a time, so a
 * booking with no time is parked in the "Untimed" lane rather than being
 * dropped or forced into a fake hour.
 */

const C = {
  ink: '#111827',
  ink2: '#374151',
  ink3: '#6b7280',
  ink4: '#9ca3af',
  bg: '#f9fafb',
  card: '#ffffff',
  brd: '#e5e7eb',
  brdl: '#f3f4f6',
  acc: '#0f766e',
  acclt: '#f0fdfa',
  suc: '#16a34a',
  dng: '#dc2626',
};

/* Must match mapStatus() in ReservationDashboard. */
const ST = {
  confirmed: { label: 'Confirmed', color: C.acc },
  pending: { label: 'Pending', color: '#64748b' },
  completed: { label: 'Completed', color: C.suc },
  cancelled: { label: 'Cancelled', color: C.dng },
};

const statusOf = (b) => ST[b?.status] || ST.pending;

/* Translucent chip tint for a status colour: the 6-digit hex plus a 2-digit
   alpha ("14" ≈ 8%). Using hex + alpha keeps the tint locked to whatever the
   status palette says, so a new status can never land on a hard-coded colour.
   Requires a 6-digit hex — the palette above satisfies that, and the `+ 14`
   on a named colour like "red" would produce an invalid 8-char string. */
const tintOf = (color) => (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color + '14' : color);

/* "14:30" -> 14.5 ; anything unparsable -> null (untimed lane). */
const parseHour = (t) => {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h + min / 60;
};

const fmtHour = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
};

const Frame = styled.div`
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  background: ${C.card};
`;

const Head = styled.div`
  display: grid; align-items: center;
  border-bottom: 1px solid ${C.brd};
  padding: 10px 14px; gap: 6px;
  grid-template-columns: 58px repeat(var(--cols, 1), minmax(0, 1fr));
`;

const HeadCorner = styled.div`
  font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
  color: ${C.ink4};
`;

const DayHead = styled.button`
  border: 1px solid ${C.brd}; background: ${C.card}; border-radius: 8px;
  padding: 6px 4px; cursor: pointer; font-family: inherit;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  transition: all .12s;

  &:hover { border-color: ${C.acc}; }

  .dow { font-size: 9px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: ${C.ink4}; }
  .dom { font-size: 15px; font-weight: 800; color: ${C.ink2}; line-height: 1.1; }

  &.today .dom { color: ${C.acc}; }
  &.today { border-color: ${C.acc}; background: ${C.acclt}; }
  &.other .dom { color: ${C.ink4}; opacity: .55; }
  &.sel { border-color: ${C.acc}; box-shadow: 0 0 0 2px ${C.acclt}; }
`;

const BodyGrid = styled.div`
  flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
  display: grid;
  grid-template-columns: 58px repeat(var(--cols, 1), minmax(0, 1fr));
`;

const TimeCell = styled.div`
  border-right: 1px solid ${C.brd}; border-bottom: 1px solid ${C.brdl};
  background: ${C.bg};
  font-size: 10px; font-weight: 600; color: ${C.ink4};
  text-align: right; padding: 3px 7px 0 0;
  height: 52px;
`;

const DayCell = styled.div`
  border-right: 1px solid ${C.brdl}; border-bottom: 1px solid ${C.brdl};
  height: 52px; position: relative; padding: 2px;
  display: flex; flex-direction: column; gap: 2px;
  overflow: hidden;
`;

const Chip = styled.button`
  border: 0; border-left: 3px solid ${(p) => p.$color};
  background: ${(p) => p.$tint};
  color: ${C.ink}; border-radius: 6px; padding: 3px 6px;
  font-family: inherit; font-size: 10.5px; text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 1px; min-width: 0;
  transition: transform .12s, box-shadow .12s;

  &:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,.1); }

  .t { font-size: 9px; font-weight: 700; color: ${C.ink3}; }
  .n { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m { font-size: 9px; color: ${C.ink4}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const UntimedWrap = styled.div`
  grid-column: 2 / -1;
  border-bottom: 1px solid ${C.brd};
  padding: 8px 10px;
  display: flex; flex-wrap: wrap; gap: 6px;
  background: ${C.bg};
`;

const UntimedLabel = styled.span`
  font-size: 9px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
  color: ${C.ink4}; align-self: center; margin-right: 2px;
`;

const Empty = styled.div`
  grid-column: 2 / -1; padding: 40px 16px; text-align: center;
  color: ${C.ink4}; font-size: 12px; font-weight: 600;
`;
const SH = 6;   // first hour shown
const EH = 22;  // last hour shown (exclusive)
const HOURS = [];
for (let h = SH; h < EH; h++) HOURS.push(h);

export default function CoffinCalendarGrid({ view, date, bookings = [], onPick, onPickDay }) {
  const isWeek = view === 'week';

  /* The seven days on screen. For the DAY view this is just the one day, which
     lets a single grid implementation serve both views. */
  const days = useMemo(() => {
    if (isWeek) {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return [date];
  }, [isWeek, date]);

  /* ONE pass over the bookings builds the per-day model: which land on which
     day, which have a usable time, and which hour row each sits in. Doing this
     inside the render loop instead would re-split the whole list for every
     hour cell â€” O(hours x days x bookings) on every paint.

     Days are keyed on the LOCAL date, never toISOString(): that converts to
     UTC and silently shifts every evening booking into the next day for
     anyone east of Greenwich. */
  const model = useMemo(() => {
    const buckets = new Map();
    days.forEach((d) => buckets.set(format(d, 'yyyy-MM-dd'), []));

    (bookings || []).forEach((b) => {
      if (!b || !b.date) return;
      const k = format(b.date, 'yyyy-MM-dd');
      if (buckets.has(k)) buckets.get(k).push(b);
    });

    let total = 0;
    const cols = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const list = buckets.get(key) || [];
      total += list.length;

      const untimed = [];
      const rows = new Map();
      list.forEach((b) => {
        const h = parseHour(b.time);
        // No parsable time -> the "No time" lane. A time outside the visible
        // window is CLAMPED onto the nearest hour row so it is still visible
        // instead of vanishing off the top or bottom of the grid.
        if (h === null) { untimed.push(b); return; }
        const row = Math.max(SH, Math.min(EH - 1, Math.floor(h)));
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row).push(b);
      });

      return { d, key, total: list.length, untimed, rows };
    });

    return { cols, total, untimedAll: cols.flatMap((c) => c.untimed) };
  }, [bookings, days]);

  const renderChip = (b) => {
    const s = statusOf(b);
    return (
      <Chip
        key={b.id ?? `${b.clientName}-${b.time}`}
        $color={s.color}
        $tint={tintOf(s.color)}
        onClick={() => onPick && onPick(b)}
        title={`${b.clientName} Â· ${s.label}`}
      >
        {b.time && <span className="t">{b.time}</span>}
        <span className="n">{b.clientName}</span>
        <span className="m">{b.coffinType}</span>
      </Chip>
    );
  };

  const colsStyle = { '--cols': model.cols.length };

  return (
    <Frame>
      <Head style={colsStyle}>
        <HeadCorner>{isWeek ? '' : 'Time'}</HeadCorner>
        {model.cols.map(({ d }) => {
          const cls = [
            isToday(d) ? 'today' : '',
            isSameMonth(d, date) ? '' : 'other',
            isSameDay(d, date) ? 'sel' : '',
          ].filter(Boolean).join(' ');
          return (
            <DayHead
              key={format(d, 'yyyy-MM-dd')}
              className={cls}
              onClick={() => onPickDay && onPickDay(d)}
              title={`Jump to ${format(d, 'EEEE d MMMM yyyy')}`}
            >
              <span className="dow">{format(d, 'EEE')}</span>
              <span className="dom">{format(d, 'd')}</span>
            </DayHead>
          );
        })}
      </Head>

      {model.total === 0 ? (
        <BodyGrid style={colsStyle}>
          <Empty>
            No coffin reservations for {isWeek ? 'this week' : format(date, 'EEEE d MMMM')}.
          </Empty>
        </BodyGrid>
      ) : (
        <BodyGrid style={colsStyle}>
          {/* Untimed lane â€” one row across the whole grid */}
          {model.untimedAll.length > 0 && (
            <>
              <TimeCell style={{ height: 'auto', padding: '9px 7px 0 0' }} />
              <UntimedWrap>
                <UntimedLabel>No time</UntimedLabel>
                {model.untimedAll.map(renderChip)}
              </UntimedWrap>
            </>
          )}

          {/* Hour spine */}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <TimeCell>{fmtHour(h)}</TimeCell>
              {model.cols.map(({ key, rows }) => {
                const hits = rows.get(h) || [];
                return <DayCell key={key + '-' + h}>{hits.map(renderChip)}</DayCell>;
              })}
            </React.Fragment>
          ))}
        </BodyGrid>
      )}
    </Frame>
  );
}
