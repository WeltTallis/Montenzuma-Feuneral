import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* =========================================================
 * DayTimeline — standalone day timeline for Hearse bookings.
 *   - sticky hour header (06:00 → 22:00)
 *   - horizontal scrollable timeline with vertical grid
 *   - color-coded booking cards positioned by start time
 *   - click a card → right slide-in detail panel
 * Faithful React port of the compact day-timeline layout.
 * ========================================================= */

/* Constants */
const SH = 6, EH = 23, TH = EH - SH;
const PAD = 24;
const CW = 1600;
const PPH = CW / TH;
const CARD_W = 240, CARD_H = 98, GAP = 9;

const h2x = (h) => PAD + (h - SH) * PPH;

/* Colour map (status → card colour) */
const STATUS_COLOR = {
    pending: '#d97706',
    booked: '#00296B',
    confirmed: '#00296B',
    scheduled: '#E36414',
    in_transit: '#E36414',
    in_progress: '#0c0b0f',
    postponed: '#d97706',
    completed: '#5F0F40',
    delivered: '#132A13',
    cancelled: '#DD2D4A',
    maintenance: '#03071E',
};

/* Format a Date/ISO string to "9:00 AM" style */
const fmtTime = (raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/* Format raw time strings that Date() can't parse ("9:30 AM", "14:30",
   "09:05:00") by extracting the clock parts directly */
const fmtTimeSmart = (raw) => {
    /* Date-only strings ("2026-03-06") are parsed by Date() as UTC midnight
       and would render shifted (e.g. "3:00 AM" on UTC+3) — they mean all-day */
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw ?? '').trim())) return '';
    const viaDate = fmtTime(raw);
    if (viaDate) return viaDate;
    const s = String(raw ?? '');
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

/* All booking fields that can carry a start time, in priority order.
   created_at lets historical bookings land at the exact moment they
   were made on the day timeline. */
const TIME_FIELDS = [
    'estimated_departure_time', 'start_time', 'from_timestamp',
    'delivery_time', 'event_time', 'created_at', 'booking_date', 'start', 'date',
];

/* Pick the first field that actually holds a value */
const timeSourceOf = (b) => {
    if (!b) return '';
    for (const f of TIME_FIELDS) {
        const v = b[f];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return '';
};

/* Parse any raw value (Date | hour number | "9:30 AM" | "14:30" |
   "2026-03-06 09:30:00" | ISO datetime) into a decimal hour (0-24).
   Returns null when the value is untimed or unparsable. */
const parseTimeValue = (raw) => {
    if (raw === undefined || raw === null || raw === '') return null;
    if (raw instanceof Date) {
        if (isNaN(raw.getTime())) return null;
        /* DATE columns come back as Dates at UTC midnight — that's a calendar
           day, not a clock time, so the booking belongs in the all-day lane */
        if (raw.getUTCHours() === 0 && raw.getUTCMinutes() === 0 && raw.getUTCSeconds() === 0) return null;
        return raw.getHours() + raw.getMinutes() / 60;
    }
    if (typeof raw === 'number') {
        if (raw >= 0 && raw <= 24) return raw; /* plain hour value */
        const dn = new Date(raw);
        return isNaN(dn.getTime()) ? null : dn.getHours() + dn.getMinutes() / 60;
    }
    const s = String(raw).trim();
    /* 12-hour clock, minutes optional: "9:30 AM", "9 AM", "09:05pm" */
    let m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (m) {
        let h = parseInt(m[1], 10) % 12;
        if (m[3].toUpperCase() === 'PM') h += 12;
        return h + (m[2] ? parseInt(m[2], 10) / 60 : 0);
    }
    /* Bare / MySQL wall-clock times without a T separator: "14:30",
       "09:05:00", "2026-03-06 09:30:00". ISO strings with "T" are left
       to Date parsing below so timezone offsets stay honoured. */
    if (!s.includes('T')) {
        /* A bare calendar date carries no time — it's an "all day" booking */
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
        m = s.match(/(?:^|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!m) m = s.match(/^(\d{1,2}):(\d{2})/);
        if (m) {
            const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
            if (h <= 23 && min <= 59) return h + min / 60;
        }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.getHours() + d.getMinutes() / 60;
};

/* Parse a booking date for a target key (YYYY-MM-DD) */
const parseBookingDate = (b, dateKey) => {
    try {
        const arr = typeof b?.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b?.booking_dates || []);
        if (Array.isArray(arr) && arr.length) {
            const hit = arr.find((d) => String(d).split('T')[0].slice(0, 10) === dateKey);
            if (hit) return hit;
        }
    } catch (e) { }
    return String(b?.booking_date || '').split('T')[0].slice(0, 10) === dateKey ? b.booking_date : null;
};

const dateKeyOf = (b) => {
    const raw = b?.booking_date || b?.estimated_departure_time || b?.date || '';
    return String(raw).split('T')[0].slice(0, 10);
};

/* Booking start hour for a specific day (YYYY-MM-DD key) as a decimal
   0-24, or null if untimed. For multi-day bookings a per-day entry from
   booking_dates wins when it carries its own time component. */
const bookingHourFor = (b, dateKey) => {
    const hit = dateKey ? parseBookingDate(b, dateKey) : null;
    if (hit && String(hit).length > 10) {
        const h = parseTimeValue(hit);
        if (h !== null) return h;
    }
    return parseTimeValue(timeSourceOf(b));
};

/* Human label ("9:30 AM") resolved from the same sources the timeline
   positions cards with — falls back to "All day" when untimed */
const bookingTimeLabel = (b, dateKey) => {
    const hit = dateKey ? parseBookingDate(b, dateKey) : null;
    if (hit && String(hit).length > 10) {
        const t = fmtTimeSmart(hit);
        if (t) return t;
    }
    return fmtTimeSmart(timeSourceOf(b)) || 'All day';
};

/* Header label e.g. "Friday, March 6, 2026" */
const fmtDateLabel = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const DayTimeline = ({ date, bookings = [], onClose, onItemClick }) => {
    const [selected, setSelected] = useState(null);

    /* Bookings that fall on the selected date */
    const dayBookings = useMemo(() => {
        if (!date) return [];
        const key = String(date).split('T')[0].slice(0, 10);
        return (Array.isArray(bookings) ? bookings : []).filter((b) => {
            if (parseBookingDate(b, key)) return true;
            return dateKeyOf(b) === key;
        });
    }, [bookings, date]);

    /* Cards positioned on the timeline (row collision layout).
       Each card is centred on its exact start time, clamped so early /
       late bookings never clip outside the track. Untimed bookings are
       parked at the left edge and labelled "All day". */
    const cards = useMemo(() => {
        if (!dayBookings.length) return [];
        const key = String(date).split('T')[0].slice(0, 10);
        const MIN_X = 2, MAX_X = PAD * 2 + CW - CARD_W - 2;

        const sorted = [...dayBookings]
            .map((b) => ({ b, hour: bookingHourFor(b, key) }))
            .sort((a, z) => (a.hour ?? -1) - (z.hour ?? -1));

        const rows = [];
        return sorted.map(({ b, hour }) => {
            const clampedH = hour === null ? null : Math.max(SH, Math.min(EH, hour));
            const cx = clampedH !== null ? h2x(clampedH) : PAD + 4;
            const x = Math.max(MIN_X, Math.min(MAX_X, cx - CARD_W / 2));
            const x1 = x, x2 = x + CARD_W;
            let row = 0;
            while (true) {
                const rowItems = rows[row] || (rows[row] = []);
                const clash = rowItems.some(([a1, a2]) => x1 < a2 + 6 && x2 > a1 - 6);
                if (!clash) { rowItems.push([x1, x2]); break; }
                row++;
            }
            return { b, hour, x, y: row * (CARD_H + GAP) };
        });

    }, [dayBookings, date]);

    useEffect(() => {
        if (!date) return;
        const el = document.getElementById('day-timeline-scroll');
        if (el) el.scrollTo({ left: Math.max(0, h2x(13) - el.clientWidth / 2), behavior: 'smooth' });
    }, [date]);

    if (!date) return null;

    return createPortal(
        <div className="day-timeline-root" style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,17,23,0.28)', display: 'flex', flexDirection: 'column' }}>
            <style>{`
        .rtl-tl-card{
          position: absolute; width: ${CARD_W}px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; transition: transform .15s, box-shadow .15s; z-index: 10;
        }
        .rtl-tl-card:hover{ transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.22); z-index: 12; }
        .rtl-tl-panel-row{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; margin-bottom:5px; }
      `}</style>
            {/* Header bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #e2e4ea',
            }}>
                <button
                    onClick={onClose}
                    title="Close timeline"
                    style={{
                        border: '1px solid #e2e4ea', background: '#fff', color: '#5b5e66',
                        borderRadius: 8, cursor: 'pointer', padding: '6px 10px', fontWeight: 600, fontSize: 12,
                    }}
                >
                    ✕ Close
                </button>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Day Timeline</div>
                <div style={{ fontSize: 12, color: '#5b5e66' }}>{fmtDateLabel(date)}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                    {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Body — ONE scroll container so the hour ruler and cards can
          never drift apart horizontally while scrolling */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
                <div
                    id="day-timeline-scroll"
                    style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e2e4ea transparent' }}
                >
                    <div style={{ position: 'relative', minWidth: PAD * 2 + CW }}>
                        {/* Sticky time header — labels absolutely positioned at the
                exact h2x() coordinate of their gridline */}
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 20, background: '#fff',
                            height: 46, borderBottom: '1px solid #e2e4ea',
                        }}>
                            {(() => {
                                const marks = [];
                                for (let h = SH; h <= EH; h += 2) {
                                    const label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                                    const major = h % 4 === 0;
                                    marks.push(
                                        <div key={h} style={{
                                            position: 'absolute', left: h2x(h), top: 0, bottom: 0,
                                            transform: 'translateX(-50%)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                                            paddingBottom: 8, pointerEvents: 'none',
                                        }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: major ? '#1a1a2e' : '#a0a3b1', whiteSpace: 'nowrap' }}>{label}</span>
                                            <div style={{ width: 1, height: major ? 10 : 6, background: major ? '#a0a3b1' : '#d4d6de', marginTop: 4 }} />
                                        </div>
                                    );
                                }
                                return marks;
                            })()}
                        </div>

                        {/* Timeline track */}
                        <div style={{ position: 'relative', minHeight: cards.length * (CARD_H + GAP) + 24 }}>
                            {(() => {
                                const grid = [];
                                for (let h = SH; h <= EH; h += 1) {
                                    grid.push(
                                        <div key={h} style={{
                                            position: 'absolute', top: 0, bottom: 0, left: h2x(h), width: 1,
                                            background: h % 2 === 0 ? '#e7e9ef' : '#f0f1f4', pointerEvents: 'none',
                                        }} />
                                    );
                                }
                                return grid;
                            })()}

                            {cards.map(({ b, hour, x, y }) => {
                                const statusC = STATUS_COLOR[b?.status] || '#475569';
                                const startLabel = bookingTimeLabel(b, String(date).slice(0, 10));
                                const cat = b?.status || 'booked';
                                return (
                                    <div
                                        key={b.booking_id || b.id || `${x}-${y}`}
                                        className="rtl-tl-card"
                                        style={{ left: x, top: y, background: statusC, opacity: 0.95 }}
                                        onClick={() => setSelected(b)}
                                    >
                                        <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.55, color: '#fff', marginBottom: 1 }}>
                                            ⏰ {startLabel}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {b.client_name || b.client || 'Client'}
                                        </div>
                                        <span style={{
                                            display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 7px',
                                            borderRadius: 20, marginTop: 5, textTransform: 'uppercase', letterSpacing: '.3px',
                                            background: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.92)',
                                        }}>
                                            {cat}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {/* Side detail panel */}
            <div
                style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, maxWidth: '92vw',
                    background: '#ffffff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', borderLeft: '1px solid #e2e4ea',
                    transform: selected ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform .3s cubic-bezier(.32,.72,0,1)',
                    display: 'flex', flexDirection: 'column', zIndex: 10,
                }}
            >
                {selected && (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            padding: '18px 20px 16px', borderBottom: '1px solid #eef0f3',
                        }}>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.2px', lineHeight: 1.2 }}>
                                {selected.client_name || selected.client || 'Client'}
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                aria-label="Close details"
                                style={{
                                    width: 30, height: 30, border: '1px solid #e2e4ea', borderRadius: 8,
                                    background: '#fff', color: '#888', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                }}
                            >✕</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                            <div className="rtl-tl-panel-row" style={{ background: '#f4f6f9', marginBottom: 16, padding: '10px 12px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[selected.status] || '#475569', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{selected.status || 'booked'}</span>
                                <span style={{
                                    marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                                    textTransform: 'uppercase', letterSpacing: '.3px', background: '#f4f5f7', color: '#5b5e66',
                                }}>
                                    {selected.priority || 'standard'}
                                </span>
                            </div>

                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#c0c2cc', marginBottom: 8 }}>
                                Booking Details
                            </div>
                            {[
                                { id: 'id', label: 'Booking ID', value: selected.booking_code || selected.booking_id || '—', icon: '🗓' },
                                { id: 'time', label: 'Time', value: bookingTimeLabel(selected, null), icon: '⏰' },
                                { id: 'from', label: 'From', value: selected.from_location || selected.from || selected.origin || '—', icon: '📍' },
                                { id: 'loc', label: 'Location', value: selected.destination || selected.to_location || '—', icon: '🏁' },
                                { id: 'plate', label: 'Hearse', value: `${selected.hearse_name || ''} ${selected.plate_number || selected.number_plate || selected.hearse_plate || ''}`.trim() || '—', icon: '🚚' },
                                { id: 'branch', label: 'Branch', value: selected.branch_name || selected.branch || '—', icon: '🏢' },
                            ].map((r) => (
                                <div key={r.label} className="rtl-tl-panel-row" style={{ background: '#f9f9fb' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 7, background: STATUS_COLOR[selected.status] || '#475569', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                                        {r.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#a0a3b1' }}>{r.label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{r.value}</div>
                                    </div>
                                </div>
                            ))}

                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#c0c2cc', marginBottom: 8 }}>
                                Client Contact
                            </div>
                            <div className="rtl-tl-panel-row" style={{ background: '#f9f9fb' }}>
                                <div style={{ width: 30, height: 30, borderRadius: 7, background: STATUS_COLOR[selected.status] || '#475569', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                                    📞
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: '#a0a3b1' }}>Phone</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{selected.client_phone || selected.phone || '—'}</div>
                                </div>
                            </div>

                            {onItemClick && (
                                <button
                                    onClick={() => { onItemClick(selected); setSelected(null); }}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: 10, marginTop: 16,
                                        background: STATUS_COLOR[selected.status] || '#475569', color: '#fff',
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                                    }}
                                >
                                    Open Full Booking →
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default DayTimeline;