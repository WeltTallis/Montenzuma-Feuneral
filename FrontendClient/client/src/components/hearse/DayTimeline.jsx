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

/* Parse booking start hour as a decimal (0-24), or null if untimed */
const bookingHour = (b) => {
  const raw = String(b?.estimated_departure_time || b?.booking_date || b?.start_time || b?.start || '');
  const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (raw && m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === 'AM' && h === 12) h = 0;
    if (ap === 'PM' && h !== 12) h += 12;
    return h + min / 60;
  }
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.getHours() + d.getMinutes() / 60;
  }
  return null;
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

  /* Cards positioned on the timeline (row collision layout) */
  const cards = useMemo(() => {
    const sorted = [...dayBookings]
      .map((b) => ({ b, hour: bookingHour(b) }))
      .sort((a, z) => (a.hour ?? 12) - (z.hour ?? 12));

    const rows = [];
    return sorted.map(({ b, hour }) => {
      const cx = h2x(hour ?? 12);
      const x1 = cx - CARD_W / 2;
      const x2 = cx + CARD_W / 2;
      let row = 0;
      while (true) {
        const rowItems = rows[row] || (rows[row] = []);
        const clash = rowItems.some(([a1, a2]) => x1 < a2 + 6 && x2 > a1 - 6);
        if (!clash) { rowItems.push([x1, x2]); break; }
        row++;
      }
      return { b, hour, x: cx - CARD_W / 2, y: row * (CARD_H + GAP) };
    });
  }, [dayBookings]);

  useEffect(() => {
    if (!date) return;
    const el = document.getElementById('day-timeline-scroll');
    if (el) el.scrollTo({ left: Math.max(0, h2x(13) - el.clientWidth / 2), behavior: 'smooth' });
  }, [date]);

  if (!date) return null;

  return createPortal(
    <div className="day-timeline-root" style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,17,23,0.28)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .rtl-tl-scroll-x { overflow-x: auto; scrollbar-width: none; }
        .rtl-tl-scroll-x::-webkit-scrollbar { display: none; }
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

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
        {/* Time header */}
        <div className="rtl-tl-scroll-x" style={{ background: '#fff', borderBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: PAD * 2 + CW, padding: '0 0 12px', position: 'relative' }}>
            {(() => {
              const marks = [];
              for (let h = SH; h <= EH; h += 2) {
                const label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                const major = h % 2 === 0;
                marks.push(
                  <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: PPH * 2, flexShrink: 0, padding: '0 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: major ? '#1a1a2e' : '#a0a3b1' }}>{label}</span>
                    <div style={{ width: 1, height: major ? 10 : 6, background: major ? '#a0a3b1' : '#d4d6de', marginTop: 4 }} />
                  </div>
                );
              }
              return marks;
            })()}
          </div>
        </div>
        <div style={{ borderBottom: '1px solid #e2e4ea' }} />

        {/* Timeline scrollable body */}
        <div
          id="day-timeline-scroll"
          style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e2e4ea transparent' }}
        >
          <div style={{ position: 'relative', minWidth: PAD * 2 + CW, minHeight: cards.length * (CARD_H + GAP) + 24 }}>
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
              const startLabel = fmtTime(parseBookingDate(b, String(date).slice(0, 10)) || b?.booking_date || b?.estimated_departure_time);
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
                { id: 'time', label: 'Time', value: fmtTime(selected.estimated_departure_time || selected.booking_date || '') || 'All day', icon: '⏰' },
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