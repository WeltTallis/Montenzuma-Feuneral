import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import {
  startOfWeek, addDays, isSameDay, isSameMonth, isToday, format,
} from 'date-fns';

/* Coffin reservations — DAY and WEEK calendar grids.
 *
 * Clean, modern calendar for coffin bookings:
 *  - DAY view: single day with a 6am–10pm time spine; bookings land on their
 *    service hour row.
 *  - WEEK view: seven days side by side; bookings stack as payment-coloured
 *    chips (PAID / DEPOSIT / UNPAID) under each day header.
 *  - Click a booking chip → onPick(booking) opens the reservation panel.
 *  - Click a day header → onPickDay(date) jumps to that day.
 *
 * Coffins carry `service_time` only when the booking was given a time, so a
 * booking with no time is parked in the "No time" lane rather than being
 * dropped or forced into a fake hour.
 */

const C = {
  ink: '#111827',
  ink2: '#374151',
  ink3: '#6b7280',
  ink4: '#9ca3af',
  bg: '#f8fafc',
  card: '#ffffff',
  brd: '#e2e8f0',
  brdl: '#f1f5f9',
  acc: '#0f766e',
  acclt: '#ecfeff',
  suc: '#15803d',
  sucLt: '#ecfdf5',
  dng: '#dc2626',
  dngLt: '#fef2f2',
  pend: '#64748b',
  pendLt: '#f1f5f9',
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03)',
  radius: '10px',
  transition: 'all 0.15s ease',
};

/* Payment palette — must match ReservationDashboard so chips/panel agree.
 * The backend stores every coffin booking as status='active' and tracks the
 * money in paid / amount / deposit, so a chip is coloured by payment state:
 * Paid = green, Deposited = amber, Unpaid = red. Colouring by a booking
 * status painted every chip the same colour (and 'paid'/'deposited'/'unpaid'
 * were unknown keys, so everything fell back to one grey), which made it
 * impossible to see who had paid. */
const ST = {
  paid:      { label: 'Paid',      mark: 'PAID',    color: C.suc,     tint: '#ecfdf5' },
  deposited: { label: 'Deposited', mark: 'DEPOSIT', color: '#d97706', tint: '#fffbeb' },
  unpaid:    { label: 'Unpaid',    mark: 'UNPAID',  color: C.dng,     tint: '#fef2f2' },
};

const statusOf = (b) => ST[b?.status] || ST.unpaid;

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

/* ---------- Styled primitives ---------- */

const Frame = styled.div`
  display: flex; flex-direction: column; height: 100%; min-height: 0;
  background: ${C.card}; border-radius: ${C.radius}; border: 1px solid ${C.brd};
  overflow: hidden; box-shadow: ${C.shadow};
`;

const Head = styled.div`
  display: grid; align-items: center; gap: 6px;
  border-bottom: 1px solid ${C.brdl};
  padding: 10px 14px;
  background: ${C.bg};
  grid-template-columns: 60px repeat(var(--cols, 1), minmax(0, 1fr));
`;

const HeadCorner = styled.div`
  font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
  color: ${C.ink4}; height: 1px;
`;

const DayHead = styled.button.attrs({ type: 'button' })`
  border: 1px solid ${({ $selected }) => ($selected ? C.acc : C.brd)};
  background: ${({ $selected, $today }) =>
    $selected ? C.acclt : $today ? '#f0fdff' : C.card};
  color: ${C.ink2}; border-radius: 10px; padding: 10px 6px; cursor: pointer;
  font-family: inherit; display: flex; flex-direction: column; align-items: center;
  gap: 4px; transition: ${C.transition}; outline: none;
  &:hover { border-color: ${C.acc}; background: ${C.acclt}; }
  .dow { font-size: 9px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: ${C.ink4}; }
  .dom { font-size: 16px; font-weight: 800; color: ${C.ink}; line-height: 1.1; }
  .sub { font-size: 10px; color: ${C.ink3}; margin-top: 2px; }
`;

const BodyGrid = styled.div`
  flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
  display: grid;
  grid-template-columns: 60px repeat(var(--cols, 1), minmax(0, 1fr));
`;

const TimeCell = styled.div`
  border-right: 1px solid ${C.brdl}; border-bottom: 1px solid ${C.brdl};
  background: ${C.bg}; font-size: 10px; font-weight: 700; color: ${C.ink4};
  text-align: right; padding: 4px 8px 0 0; height: 44px;
`;

const DayCell = styled.div`
  border-right: 1px solid ${C.brdl}; border-bottom: 1px solid ${C.brdl};
  height: 44px; position: relative; padding: 4px;
  display: flex; flex-direction: column; gap: 3px; overflow: hidden;
`;

const UntimedWrap = styled.div`
  grid-column: 2 / -1; border-bottom: 1px solid ${C.brd};
  padding: 9px 12px; display: flex; flex-wrap: wrap; gap: 7px;
  background: ${C.bg};
`;

const UntimedLabel = styled.span`
  font-size: 9px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
  color: ${C.ink4}; align-self: center; margin-right: 3px;
`;

const Empty = styled.div`
  grid-column: 2 / -1; padding: 40px 16px; text-align: center;
  color: ${C.ink4}; font-size: 12px; font-weight: 600;
`;

const Chip = styled.button.attrs({ type: 'button' })`
  border: 0; border-left: 3px solid ${({ $color }) => $color};
  background: ${({ $tint }) => $tint}; color: ${C.ink}; border-radius: 7px;
  padding: 4px 7px; font-family: inherit; font-size: 11px; text-align: left;
  cursor: pointer; display: flex; flex-direction: column; gap: 1px;
  min-width: 0; transition: ${C.transition}; outline: none;
  &:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .t { font-size: 10px; font-weight: 700; color: ${C.ink3}; }
  .n { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m { font-size: 10px; color: ${C.ink4}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
     day, which have a usable time, and which hour row each sits in. Days are
     keyed on the LOCAL date, never toISOString(): that converts to UTC and
     silently shifts every evening booking into the next day. */
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
        const h = parseHour(b.time || b.service_time);
        // No parsable time -> the "No time" lane. A time outside the visible
        // window is CLAMPED onto the nearest hour row so it stays visible.
        if (h === null) { untimed.push(b); return; }
        const row = Math.max(SH, Math.min(EH - 1, Math.floor(h)));
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row).push(b);
      });

      return { d, key, total: list.length, untimed, rows };
    });

    return { cols, total, untimedAll: cols.flatMap((c) => c.untimed) };
  }, [bookings, days]);

  const renderChip = useCallback((b) => {
    const s = statusOf(b);
    const time = b.time || b.service_time || '';
    return (
      <Chip
        key={b.id ?? `${b.clientName}-${b.time}-${b.service_time}`}
        $color={s.color}
        $tint={s.tint}
        onClick={() => onPick && onPick(b)}
        title={`${b.clientName} · ${s.label}`}
      >
        {time && <span className="t">{time}</span>}
        <span className="n">{b.clientName}</span>
        <span className="m">
          <b style={{ color: s.color, fontWeight: 800 }}>{s.mark}</b>
          {b.coffinType || b.coffin_name ? ` \u00b7 ${b.coffinType || b.coffin_name}` : ''}
        </span>
      </Chip>
    );
  }, [onPick]);

  const colsStyle = { '--cols': model.cols.length };

  const handlePickDay = useCallback((d) => {
    onPickDay && onPickDay(d);
  }, [onPickDay]);

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
