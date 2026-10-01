import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_COLOR, STATUS_CONFIG } from './statusColors';

/* =========================================================
 * DayTimeline — day view for Hearse bookings.
 *
 * A vertical, scrollable day grid that matches the weekly dispatch
 * viewer rather than the old horizontal-scroll track:
 *   - status summary bar
 *   - day header with prev / Today / next navigation
 *   - multi-day chip rail
 *   - sticky "all day" lane for untimed bookings
 *   - one row per hour; click any empty slot to create a booking
 *   - overlapping bookings share the width via a column layout
 *   - red "now" line on today, auto-scrolled into view
 *   - LEFT / RIGHT arrow keys move a day at a time
 *
 * Props
 *   date            YYYY-MM-DD (or anything `new Date()` accepts)
 *   bookings        bookings for that day (pre-filtered by the parent)
 *   onClose         close the overlay
 *   onItemClick     open the full booking drawer for a card
 *   onDateChange    OPTIONAL (dateKey) => void  — prev / next / Today
 *   onCreateBooking OPTIONAL ([dateKey]) => void — empty slot clicked
 * ========================================================= */

/* ---------- grid geometry ---------- */
const SH = 6;        // first hour row
const EH = 23;       // last hour row (exclusive)
const ROW_H = 60;    // px per hour row
const MIN_CARD_H = 20;

/* ---------- booking field resolution ----------
   Bookings arrive from several endpoints with different field names, so
   every value is resolved through an ordered candidate list rather than a
   single hardcoded key. */

/* Start time candidates, in priority order. `created_at` lets historical
   bookings land at the moment they were actually made. */
const START_FIELDS = [
  'estimated_departure_time', 'start_time', 'from_timestamp',
  'delivery_time', 'event_time', 'created_at', 'booking_date', 'start', 'date',
];

/* End time candidates. Not every record carries one, so a booking without a
   resolvable end is drawn DEFAULT_DUR hours long. */
const END_FIELDS = [
  'estimated_arrival_time', 'end_time', 'to_timestamp',
  'arrival_time', 'return_time', 'end',
];

const DEFAULT_DUR = 1;

const firstFilled = (b, fields) => {
  if (!b) return '';
  for (const f of fields) {
    const v = b[f];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
};

/* "9:30 AM" / "14:30" / "2026-03-06 09:30:00" -> "9:30 AM" (best effort) */
const fmtTimeSmart = (raw) => {
  if (raw === undefined || raw === null || raw === '') return '';
  /* DATE-only strings ("2026-03-06") are parsed by Date() as UTC midnight and
     would render shifted on UTC+3 — they mean "all day", not a clock time. */
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw).trim())) return '';
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const s = String(raw);
  let m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m[2] || '00'} ${h < 12 ? 'AM' : 'PM'}`;
  }
  m = s.match(/(?:^|[\sT])(\d{1,2}):(\d{2})/);
  if (m) {
    const h = parseInt(m[1], 10);
    if (h <= 23) {
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
    }
  }
  return '';
};

/* Any raw value -> decimal hour (0-24), or null when untimed/unparsable. */
const parseTimeValue = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return raw >= 0 && raw <= 24 ? raw : null;
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    /* DATE columns arrive as Dates at UTC midnight — that is a calendar day,
       not a clock time, so the booking belongs in the all-day lane. */
    if (
      raw.getUTCHours() === 0 && raw.getUTCMinutes() === 0 && raw.getUTCSeconds() === 0
    ) return null;
    return raw.getHours() + raw.getMinutes() / 60;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  let m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    return h + parseInt(m[2], 10) / 60;
  }
  m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
    if (h <= 23 && min <= 59) return h + min / 60;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.getHours() + d.getMinutes() / 60;
};

/* Local-time YYYY-MM-DD. Never use toISOString() here: it converts to UTC and
   silently shifts the day for anyone east of Greenwich on a late booking. */
const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  return (
    dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0')
  );
  /* Multi-day bookings carry a JSON array of ISO dates in `booking_dates`.
     Anything unparsable degrades to an empty list rather than throwing — the
     day grid must still render the booking. */
  const bookingDatesOf = (b) => {
    try {
      const arr = typeof b?.booking_dates === 'string'
        ? JSON.parse(b.booking_dates)
        : (b?.booking_dates || []);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  /* The specific `booking_dates` entry matching dateKey, else the booking's own
     date when it matches. Lets multi-day bookings carry a per-day time. */
  const entryForDate = (b, dateKey) => {
    const hit = bookingDatesOf(b).find(
      (d) => String(d).split('T')[0].slice(0, 10) === dateKey
    );
    if (hit) return hit;
    const own = b?.booking_date || b?.estimated_departure_time || b?.date || '';
    return String(own).split('T')[0].slice(0, 10) === dateKey ? own : null;
  };

  /* Start hour for this specific day, or null when the booking is untimed
     (and therefore belongs in the all-day lane). */
  const startHourFor = (b, dateKey) => {
    const hit = entryForDate(b, dateKey);
    if (hit && String(hit).length > 10) {
      const h = parseTimeValue(hit);
      if (h !== null) return h;
    }
    return parseTimeValue(firstFilled(b, START_FIELDS));
  };

  /* End hour. Falls back to start + DEFAULT_DUR so a card always has a height,
     and is forced to be strictly after start (a zero-height card is invisible
     and looks like a dropped booking). */
  const endHourFor = (b, dateKey, startH) => {
    if (startH === null) return null;
    const hit = entryForDate(b, dateKey);
    let end = null;
    if (hit && String(hit).length > 10) end = parseTimeValue(hit);
    if (end === null) end = parseTimeValue(firstFilled(b, END_FIELDS));
    if (end === null || end <= startH) return startH + DEFAULT_DUR;
    return end;
  };

  const statusColorOf = (b) => STATUS_COLOR[b?.status] || '#2563EB';
  const statusLabelOf = (b) => STATUS_CONFIG[b?.status]?.label || b?.status || 'Booked';

  const hourLabel = (h) => {
    const hr = Math.floor(h);
    const ap = hr >= 12 ? 'PM' : 'AM';
    const h12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${h12} ${ap}`;
  };

  const fmtDuration = (start, end) => {
    const mins = Math.round((end - start) * 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  /* Flatten the API's varying field names into the display fields the card
     markup needs. Kept in one place so the card, the all-day chip, the
     multi-day chip and the detail panel can never disagree about what a
     booking is called. */
  const displayFields = (b) => ({
    client: b.client_name || b.clientName || b.customer_name || b.contact_name || '—',
    from: b.from_location || b.origin || b.pickup_location || b.departure_point || '—',
    dest: b.destination || b.to_location || b.destination_name || b.delivery_location || '—',
    plate: b.plate_number || b.number_plate || b.hearse_plate || b.vehicle_plate || '',
    phone: b.client_phone || b.phone || '',
    branch: b.branch_name || b.branch || '',
  });

  /* Column layout for overlapping bookings: greedy first-fit into lanes, then
     widen every booking to the widest lane set it participates in. Without the
     second pass a short booking tucked beside a long one would only use its own
     lane width and leave a visible gap. */
  function layoutColumns(items) {
    const sorted = [...items].sort(
      (a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start)
    );
    const laneEnds = [];
    sorted.forEach((it) => {
      let lane = laneEnds.findIndex((e) => it.start >= e);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.end);
      } else {
        laneEnds[lane] = it.end;
      }
      it.col = lane;
    });
    sorted.forEach((it) => {
      let max = it.col;
      sorted.forEach((o) => {
        if (o !== it && o.start < it.end && o.end > it.start && o.col > max) max = o.col;
      });
      it.tot = max + 1;
    });
    return sorted;
  }
  const CSS = `
.dtl-root{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;color:#000;height:100%;display:flex;flex-direction:column;
  background:#fff}
.dtl-root *{box-sizing:border-box}
.dtl-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;padding-bottom:8px}
.dtl-scroll::-webkit-scrollbar{width:6px}
.dtl-scroll::-webkit-scrollbar-thumb{background:#E5E5E5;border-radius:3px}
.dtl-scroll::-webkit-scrollbar-track{background:transparent}

.dtl-stats{display:flex;gap:16px;padding:12px 16px;margin:12px 16px 8px;background:#FAFAFA;
  border:1px solid #EEEEEE;border-radius:10px;flex-wrap:wrap}
.dtl-stat{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600}
.dtl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

.dtl-dh{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:2px solid #EEEEEE;
  background:#fff;flex-wrap:wrap}
.dtl-nav{display:flex;gap:5px}
.dtl-navbtn{height:30px;min-width:30px;padding:0 8px;border:1px solid #EEEEEE;background:#fff;
  border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;color:#666;
  transition:background .15s;font-family:inherit;display:inline-flex;align-items:center;
  justify-content:center}
.dtl-navbtn:hover{background:#FAFAFA}
.dtl-todaybtn{height:30px;padding:0 12px;border:1px solid #EEEEEE;background:#fff;border-radius:8px;
  cursor:pointer;font-size:12px;font-weight:700;color:#2E7D32;font-family:inherit}
.dtl-todaybtn:hover{background:#FAFAFA}
.dtl-dhc{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.dtl-dn{font-size:16px;font-weight:800;color:#000}
.dtl-dsub{font-size:12px;font-weight:600;color:#999}
.dtl-sp{flex:1}
.dtl-hint{font-size:11px;font-weight:500;color:#BBB}

.dtl-mdb{display:flex;gap:6px;align-items:center;padding:10px 16px 0;flex-wrap:wrap}
.dtl-mdb-l{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:#999;margin-right:2px}
.dtl-mdb-i{display:inline-flex;align-items:center;gap:6px;color:#fff;font-size:11px;font-weight:600;
  padding:5px 11px;border-radius:999px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.12);
  transition:transform .15s;border:none;font-family:inherit;max-width:100%;text-align:left}
.dtl-mdb-i:hover{transform:translateY(-1px)}
.dtl-sub{font-size:10px;font-weight:500;opacity:.9}

.dtl-grid{margin:12px 16px 24px;border:1px solid #EEEEEE;border-radius:12px;overflow:hidden;
  background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04)}

.dtl-allday{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:64px 1fr;
  background:#fff;border-bottom:1px solid #EEEEEE}
.dtl-ad-label{background:#FAFAFA;border-right:1px solid #EEEEEE;font-size:10px;font-weight:700;
  color:#999;text-transform:uppercase;display:flex;justify-content:flex-end;padding:8px 8px 0 0}
.dtl-ad-row{position:relative;min-height:42px;padding:4px}
.dtl-adev{display:inline-flex;align-items:center;gap:6px;color:#fff;border-radius:8px;
  padding:4px 10px;font-size:11.5px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1);
  cursor:pointer;margin:1px 2px;transition:transform .2s;border:none;font-family:inherit;
  max-width:100%;text-align:left}
.dtl-adev:hover{transform:scale(1.02)}
.dtl-tg{position:relative}
.dtl-trow{display:grid;grid-template-columns:64px 1fr}
.dtl-tl{height:60px;background:#FAFAFA;border-right:1px solid #EEEEEE;border-bottom:1px solid #EEEEEE;
  font-size:11px;font-weight:600;color:#999;text-align:right;padding:2px 8px 0 0}
.dtl-dc{height:60px;border-bottom:1px solid #EEEEEE;position:relative;cursor:pointer;
  transition:background .15s}
.dtl-dc:hover{background:#FAFAFA}
.dtl-dc::before{content:'';position:absolute;left:0;right:0;top:50%;
  border-top:1px dashed #F5F5F5;pointer-events:none}
.dtl-ov{position:absolute;left:64px;right:0;top:0;bottom:0;pointer-events:none}

.dtl-bb{position:absolute;border-radius:8px;color:#fff;padding:5px 7px;overflow:hidden;
  cursor:pointer;pointer-events:auto;box-shadow:0 1px 3px rgba(0,0,0,.12);
  border:0;border-left:3px solid rgba(0,0,0,.2);transition:transform .15s, box-shadow .15s;
  display:flex;flex-direction:column;gap:1px;text-align:left;font-family:inherit}
.dtl-bb:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,.18);z-index:5}
.dtl-bb-t{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700;opacity:.92;
  white-space:nowrap;overflow:hidden}
.dtl-grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.dtl-pill{font-size:8.5px;font-weight:700;background:rgba(255,255,255,.25);padding:1px 5px;
  border-radius:4px;flex-shrink:0}
.dtl-bb-cl{font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dtl-bb-sub{font-size:9.5px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dtl-bb-meta{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px}
.dtl-chip{background:rgba(255,255,255,.22);padding:1px 5px;border-radius:4px;font-size:8.5px;
  font-weight:600;white-space:nowrap}

.dtl-nl{position:absolute;left:64px;right:0;height:2px;background:#DC2626;z-index:6;
  pointer-events:none}
.dtl-nl-l{position:absolute;left:0;top:-9px;background:#DC2626;color:#fff;font-size:9px;
  font-weight:700;padding:1px 6px;border-radius:6px}

.dtl-empty{padding:48px 16px;text-align:center;color:#BBB;font-size:12px;font-weight:600}

.dtl-toasts{position:fixed;bottom:18px;right:18px;z-index:2100;display:flex;flex-direction:column;
  gap:4px;pointer-events:none}
.dtl-tm{padding:8px 12px;background:#111;color:#fff;border-radius:8px;font-size:11px;
  font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.18);
  animation:dtl-toast .3s cubic-bezier(.22,1,.36,1)}
@keyframes dtl-toast{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}

.dtl-panel{position:absolute;top:0;right:0;bottom:0;width:360px;max-width:88%;background:#fff;
  border-left:1px solid #EEEEEE;box-shadow:-8px 0 28px rgba(0,0,0,.1);z-index:20;overflow-y:auto;
  animation:dtl-slide .26s cubic-bezier(.22,1,.36,1)}
@keyframes dtl-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
.dtl-panel-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;
  border-bottom:1px solid #EEEEEE;position:sticky;top:0;background:#fff;z-index:2}
.dtl-panel-t{font-size:14px;font-weight:800}
.dtl-panel-b{padding:14px 16px}
.dtl-x{width:28px;height:28px;border:none;background:#F5F5F5;border-radius:50%;cursor:pointer;
  color:#666;font-size:13px;display:flex;align-items:center;justify-content:center}
.dtl-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;
  background:#FAFAFA;margin-bottom:6px}
.dtl-row-l{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.4px;font-weight:700}
.dtl-row-v{font-size:12px;font-weight:600;color:#000;margin-top:1px}
.dtl-sec{font-size:10px;font-weight:700;text-transform:uppercase;color:#999;letter-spacing:.6px;
  margin:14px 0 8px}
.dtl-open{width:100%;padding:10px;border:none;border-radius:8px;color:#fff;font-size:12px;
  font-weight:600;cursor:pointer;margin-top:8px;font-family:inherit}

@media (max-width:640px){
  .dtl-grid{margin:8px}
  .dtl-stats{margin:8px 8px 4px;padding:10px 12px;gap:10px}
  .dtl-hint{display:none}
}
`;
  const DayTimeline = ({ date, bookings = [], onClose, onItemClick, onDateChange, onCreateBooking }) => {
    const [selected, setSelected] = useState(null);
    const [toasts, setToasts] = useState([]);
    const scrollRef = useRef(null);
    const toastId = useRef(0);

    const pushToast = useCallback((msg) => {
      const id = ++toastId.current;
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
    }, []);

    /* Build the Date at LOCAL midnight. `new Date('2026-03-06')` is UTC midnight,
       which renders as the previous day anywhere west of Greenwich. */
    const dateKey = toDateKey(date);
    const dateObj = useMemo(() => {
      if (!dateKey) return null;
      const d = new Date(dateKey + 'T00:00:00');
      return isNaN(d.getTime()) ? null : d;
    }, [dateKey]);

    const isToday = dateKey !== '' && dateKey === toDateKey(new Date());

    /* ---------- derived booking model ----------
       The parent already filtered to this day, but membership is re-checked
       here with the same logic used for time resolution so a booking whose own
       date field disagrees is dropped rather than rendered at a wrong hour. */
    const { allDay, timed, multiDay, counts } = useMemo(() => {
      const list = Array.isArray(bookings) ? bookings : [];
      const ad = [];
      const tm = [];

      list.forEach((b) => {
        if (!entryForDate(b, dateKey)) return;
        const start = startHourFor(b, dateKey);
        const rec = {
          b,
          id: b.booking_id || b.id,
          ...displayFields(b),
          color: statusColorOf(b),
          label: statusLabelOf(b),
          span: bookingDatesOf(b).length,
        };
        if (start === null) {
          ad.push(rec);
        } else {
          tm.push({ ...rec, start, end: endHourFor(b, dateKey, start) });
        }
      });

      const c = {};
      list.forEach((b) => {
        const k = b.status || 'booked';
        c[k] = (c[k] || 0) + 1;
      });

      return {
        allDay: ad,
        timed: layoutColumns(tm),
        multiDay: list
          .map((b) => ({ b, span: bookingDatesOf(b).length }))
          .filter((x) => x.span > 1),
        counts: c,
      };
    }, [bookings, dateKey]);

    const total = allDay.length + timed.length;

    /* Bookings outside the rendered hours are clamped onto the first/last row
       instead of being dropped — a 04:00 departure still has to be visible. */
    const clamp = useCallback((h) => Math.max(SH, Math.min(EH - 1, h)), []);

    const shiftDay = useCallback((n) => {
      if (!dateObj || !onDateChange) return;
      const d = new Date(dateObj.getTime());
      d.setDate(d.getDate() + n);
      onDateChange(toDateKey(d));
    }, [dateObj, onDateChange]);

    const goToday = useCallback(() => {
      if (onDateChange) onDateChange(toDateKey(new Date()));
    }, [onDateChange]);
    /* ---------- keyboard ----------
         Escape closes the detail panel first, then the whole overlay — a single
         Escape should not discard the panel and the timeline at once. */
    useEffect(() => {
      const h = (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); shiftDay(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); shiftDay(1); }
        else if (e.key === 'Escape') {
          if (selected) setSelected(null);
          else if (onClose) onClose();
        }
      };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, [shiftDay, onClose, selected]);

    /* Scroll to "now" on today, otherwise to the day's first booking. Left at
       the top when there is nothing to scroll to, so an empty day opens clean. */
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      let target = null;
      if (isToday) {
        const d = new Date();
        const nowH = d.getHours() + d.getMinutes() / 60;
        if (nowH >= SH && nowH <= EH) target = (nowH - SH) * ROW_H;
      } else if (timed.length) {
        target = (clamp(timed[0].start) - SH) * ROW_H;
      }
      if (target !== null) el.scrollTop = Math.max(0, target - ROW_H);
    }, [dateKey, isToday, timed, clamp]);

    /* Every hook above runs unconditionally; only now is it safe to bail out
       on an unusable date. */
    if (!date || !dateObj) return null;

    const hours = [];
    for (let h = SH; h < EH; h++) hours.push(h);

    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    const nowLabel =
      `${now.getHours() % 12 === 0 ? 12 : now.getHours() % 12}:` +
      `${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    return createPortal(
      <div className="dtl-root" style={{ position: 'fixed', inset: 0, zIndex: 5000 }}>
        <style>{CSS}</style>

        <div ref={scrollRef} className="dtl-scroll">
          {/* status summary */}
          {total > 0 && (
            <div className="dtl-stats">
              {Object.keys(counts).map((k) => (
                <span key={k} className="dtl-stat">
                  <span className="dtl-dot" style={{ background: STATUS_COLOR[k] || '#999' }} />
                  {counts[k]} {STATUS_CONFIG[k]?.label || k}
                </span>
              ))}
            </div>
          )}

          {/* day header */}
          <div className="dtl-dh">
            <div className="dtl-nav">
              <button className="dtl-navbtn" onClick={() => shiftDay(-1)} title="Previous day" aria-label="Previous day">‹</button>
              <button className="dtl-navbtn" onClick={() => shiftDay(1)} title="Next day" aria-label="Next day">›</button>
              <button className="dtl-todaybtn" onClick={goToday}>Today</button>
            </div>
            <div className="dtl-dhc">
              <span className="dtl-dn">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</span>
              <span className="dtl-dsub">
                {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}{total} booking{total !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="dtl-sp" />
            <span className="dtl-hint">← → to change day</span>
            <button className="dtl-navbtn" onClick={onClose} title="Close" aria-label="Close">×</button>
          </div>

          {/* multi-day rail */}
          {multiDay.length > 0 && (
            <div className="dtl-mdb">
              <span className="dtl-mdb-l">Multi-day</span>
              {multiDay.map((m, i) => {
                const d = displayFields(m.b);
                return (
                  <button
                    key={m.b.booking_id || m.b.id || i}
                    className="dtl-mdb-i"
                    style={{ background: statusColorOf(m.b) }}
                    onClick={() => setSelected({
                      b: m.b, ...d,
                      color: statusColorOf(m.b),
                      label: statusLabelOf(m.b),
                      span: m.span,
                    })}
                  >
                    {d.client}<span className="dtl-sub">{m.span}d</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* day grid */}
          <div className="dtl-grid">
            {allDay.length > 0 && (
              <div className="dtl-allday">
                <div className="dtl-ad-label">All day</div>
                <div className="dtl-ad-row">
                  {allDay.map((it) => (
                    <button
                      key={it.id ?? it.client}
                      className="dtl-adev"
                      style={{ background: it.color }}
                      onClick={() => setSelected(it)}
                    >
                      {it.client}<span className="dtl-sub">{it.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {total === 0 ? (
              <div className="dtl-empty">No bookings for this day — click any hour to add one</div>
            ) : (
              <div className="dtl-tg">
                {hours.map((h) => (
                  <div key={h} className="dtl-trow">
                    <div className="dtl-tl">{hourLabel(h)}</div>
                    <div
                      className="dtl-dc"
                      role="button"
                      tabIndex={-1}
                      aria-label={`Add booking at ${hourLabel(h)}`}
                      onClick={() => {
                        if (onCreateBooking) onCreateBooking([dateKey]);
                        else pushToast(`Add booking at ${hourLabel(h)}`);
                      }}
                    />
                  </div>
                ))}

                <div className="dtl-ov">
                  {timed.map((it) => {
                    const top = (clamp(it.start) - SH) * ROW_H + 2;
                    const height = Math.max(
                      MIN_CARD_H,
                      (Math.min(it.end, EH) - clamp(it.start)) * ROW_H - 4
                    );
                    const w = 100 / it.tot;
                    /* Detail rows are revealed by card HEIGHT, not by a media
                       query: a 30-minute booking must not try to render a
                       3-line footer inside a 26px box. */
                    const showDest = height >= 44;
                    const showMeta = height >= 92;
                    return (
                      <button
                        key={it.id ?? `${it.client}-${it.start}`}
                        className="dtl-bb"
                        style={{
                          top, height, background: it.color,
                          left: `calc(${it.col * w}% + 4px)`,
                          width: `calc(${w}% - 8px)`,
                        }}
                        onClick={() => setSelected(it)}
                      >
                        <span className="dtl-bb-t">
                          <span className="dtl-grow">
                            {hourLabel(it.start)} – {hourLabel(it.end)}
                          </span>
                          {it.span > 1 && <span className="dtl-pill">{it.span}d</span>}
                          <span className="dtl-pill">{fmtDuration(it.start, it.end)}</span>
                        </span>
                        <span className="dtl-bb-cl">{it.client}</span>
                        {showDest && <span className="dtl-bb-sub">→ {it.dest}</span>}
                        {showMeta && (
                          <span className="dtl-bb-meta">
                            {it.plate && <span className="dtl-chip">{it.plate}</span>}
                            {it.phone && <span className="dtl-chip">{it.phone}</span>}
                            {it.branch && <span className="dtl-chip">{it.branch}</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isToday && nowH >= SH && nowH <= EH && (
                  <div className="dtl-nl" style={{ top: (nowH - SH) * ROW_H }}>
                    <span className="dtl-nl-l">{nowLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* detail panel */}
        {selected && (
          <div className="dtl-panel" role="dialog" aria-label="Booking details">
            <div className="dtl-panel-h">
              <span className="dtl-panel-t">Booking Details</span>
              <button className="dtl-x" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>
            <div className="dtl-panel-b">
              <div className="dtl-row" style={{ background: `${selected.color}14` }}>
                <div
                  style={{
                    width: 30, height: 30, borderRadius: 7, background: selected.color,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}
                >
                  {String(selected.client || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="dtl-row-l">Client</div>
                  <div className="dtl-row-v">{selected.client}</div>
                </div>
              </div>

              <div className="dtl-sec">Schedule</div>
              <div className="dtl-row">
                <div style={{ minWidth: 0 }}>
                  <div className="dtl-row-l">
                    {selected.start != null
                      ? `${hourLabel(selected.start)} – ${hourLabel(selected.end)} · ${fmtDuration(selected.start, selected.end)}`
                      : 'All day'}
                  </div>
                  <div className="dtl-row-v">
                    {dateObj.toLocaleDateString('en-US', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="dtl-sec">Route</div>
              <div className="dtl-row">
                <div style={{ minWidth: 0 }}>
                  <div className="dtl-row-l">From</div>
                  <div className="dtl-row-v">{selected.from}</div>
                </div>
              </div>
              <div className="dtl-row">
                <div style={{ minWidth: 0 }}>
                  <div className="dtl-row-l">Destination</div>
                  <div className="dtl-row-v">{selected.dest}</div>
                </div>
              </div>

              <div className="dtl-sec">Details</div>
              <div className="dtl-row">
                <div style={{ minWidth: 0 }}>
                  <div className="dtl-row-l">Status</div>
                  <div className="dtl-row-v" style={{ color: selected.color }}>{selected.label}</div>
                </div>
              </div>
              {selected.plate && (
                <div className="dtl-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="dtl-row-l">Hearse</div>
                    <div className="dtl-row-v">{selected.plate}</div>
                  </div>
                </div>
              )}
              {selected.phone && (
                <div className="dtl-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="dtl-row-l">Phone</div>
                    <div className="dtl-row-v">{selected.phone}</div>
                  </div>
                </div>
              )}
              {selected.branch && (
                <div className="dtl-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="dtl-row-l">Branch</div>
                    <div className="dtl-row-v">{selected.branch}</div>
                  </div>
                </div>
              )}

              {onItemClick && (
                <button
                  className="dtl-open"
                  style={{ background: selected.color }}
                  onClick={() => onItemClick(selected.b)}
                >
                  Open Full Booking →
                </button>
              )}
            </div>
          </div>
        )}

        {toasts.length > 0 && (
          <div className="dtl-toasts">
            {toasts.map((t) => (
              <div key={t.id} className="dtl-tm">{t.msg}</div>
            ))}
          </div>
        )}
      </div>,
      document.body
    );
  }
}

export default DayTimeline;