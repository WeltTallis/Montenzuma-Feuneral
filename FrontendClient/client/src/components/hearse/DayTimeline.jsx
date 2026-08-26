import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

/* =========================================================
 * DayTimeline — standalone day timeline for Hearse bookings.
 * Strictly fits 100% of the available width on ALL devices 
 * without horizontal overflow using CSS percentages.
 * ========================================================= */

/* Constants */
const SH = 6;            // start hour 6 AM
const EH = 23;           // end hour 11 PM
const TH = EH - SH;
const PAD = 24;
const CARD_H = 98, GAP = 9;

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

/* Parse booking hour as a decimal (0-24). */
const bookingHour = (b) => {
  const candidates = [
    b?.estimated_departure_time,
    b?.booking_date,
    b?.start_time,
    b?.start,
    b?.created_at,
    b?.createdAt,
  ].filter(Boolean);

  for (const raw of candidates) {
    const r = String(raw).trim();
    if (!r) continue;

    const m = r.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ap = m[3].toUpperCase();
      if (ap === 'AM' && h === 12) h = 0;
      if (ap === 'PM' && h !== 12) h += 12;
      return h + min / 60;
    }

    const d = new Date(r);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      const min = d.getMinutes();
      if (r.includes('T') || r.includes(':') || h !== 0 || min !== 0) {
        return h + min / 60;
      }
    }
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
  } catch (e) { /* ignore */ }
  const bd = b?.booking_date;
  if (bd && String(bd).split('T')[0].slice(0, 10) === dateKey) return bd;
  return null;
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

/* Time-of-day label for a given hour */
const timeOfDayLabel = (hour) => {
  if (hour === null || hour === undefined) return 'Unscheduled';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Midday';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
};

const hourToPercent = (h) => ((h - SH) / TH) * 100;

const DayTimeline = ({ date, bookings = [], onClose, onItemClick }) => {
  const [selected, setSelected] = useState(null);
  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  /* Track exact container width to dynamically adjust card sizes */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateWidth = () => {
      const newWidth = el.clientWidth;
      setContainerWidth((prev) => (Math.abs(newWidth - prev) > 1 ? newWidth : prev));
    };

    updateWidth(); // Initial measurement

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    
    return () => observer.disconnect();
  }, []);

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

    const cw = Math.max(320, containerWidth - PAD * 2); // Available width inside padding
    const CARD_W_LOCAL = Math.max(120, Math.min(220, (cw / TH) * 3)); // Responsive card width

    const rows = [];
    return sorted.map(({ b, hour }) => {
      const effectiveHour = hour ?? 12;
      const percent = hourToPercent(effectiveHour); // 0% to 100%
      
      let leftPx = (percent / 100) * cw - CARD_W_LOCAL / 2;
      // Clamp strictly to viewport bounds
      leftPx = Math.max(0, Math.min(leftPx, cw - CARD_W_LOCAL));
      
      const x1 = leftPx;
      const x2 = leftPx + CARD_W_LOCAL;
      let row = 0;
      while (true) {
        const rowItems = rows[row] || (rows[row] = []);
        const clash = rowItems.some(([a1, a2]) => x1 < a2 + 6 && x2 > a1 - 6);
        if (!clash) { rowItems.push([x1, x2]); break; }
        row++;
      }
      return { b, hour: effectiveHour, x: leftPx, y: row * (CARD_H + GAP), cardW: CARD_W_LOCAL };
    });
  }, [dayBookings, containerWidth]);

  if (!date) return null;

  return createPortal(
    <div className="day-timeline-root" style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,17,23,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .rtl-tl-card{
          position: absolute; padding: 10px 12px; border-radius: 10px;
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
        
        {/* Timeline scrollable body (Only vertical scroll allowed) */}
        <div
          ref={scrollRef}
          id="day-timeline-scroll"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#e2e4ea transparent' }}
        >
          {/* Inner wrapper takes exactly 100% width */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            {/* Sticky Time Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', height: 40, borderBottom: '1px solid #e2e4ea', marginBottom: 10 }}>
              {/* Apply padding wrapper so 0% aligns perfectly with timeline body */}
              <div style={{ position: 'relative', width: '100%', height: '100%', padding: `0 ${PAD}px`, boxSizing: 'border-box' }}>
                {(() => {
                  const marks = [];
                  for (let h = SH; h <= EH; h += 2) {
                    const label = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                    const major = h % 2 === 0;
                    marks.push(
                      <div key={h} style={{ 
                        position: 'absolute', 
                        bottom: 4,
                        left: `${hourToPercent(h)}%`, 
                        transform: 'translateX(-50%)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: major ? '#1a1a2e' : '#a0a3b1' }}>{label}</span>
                        <div style={{ width: 1, height: major ? 10 : 6, background: major ? '#a0a3b1' : '#d4d6de', marginTop: 4 }} />
                      </div>
                    );
                  }
                  return marks;
                })()}
              </div>
            </div>

            {/* Timeline Body */}
            <div style={{ position: 'relative', width: '100%', minHeight: Math.max(cards.length * (CARD_H + GAP) + 24, 200) }}>
              {/* Apply padding wrapper so absolute positions match header */}
              <div style={{ position: 'relative', width: '100%', height: '100%', padding: `0 ${PAD}px`, boxSizing: 'border-box' }}>
                
                {/* Vertical grid lines */}
                {(() => {
                  const grid = [];
                  for (let h = SH; h <= EH; h += 1) {
                    grid.push(
                      <div key={h} style={{
                        position: 'absolute', top: 0, bottom: 0, 
                        left: `${hourToPercent(h)}%`, 
                        transform: 'translateX(-50%)',
                        width: 1,
                        background: h % 2 === 0 ? '#e7e9ef' : '#f0f1f4', pointerEvents: 'none',
                      }} />
                    );
                  }
                  return grid;
                })()}

                {/* Time-of-day band labels (Morning / Midday / Afternoon / Evening) */}
                {[
                  { from: 6,  to: 12, label: 'Morning',    color: '#fef3c7' },
                  { from: 12, to: 14, label: 'Midday',     color: '#dbeafe' },
                  { from: 14, to: 17, label: 'Afternoon',  color: '#e0e7ff' },
                  { from: 17, to: 21, label: 'Evening',    color: '#ede9fe' },
                  { from: 21, to: 23, label: 'Night',      color: '#f3f4f6' },
                ].map((band) => (
                  <div key={band.label} style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${hourToPercent(band.from)}%`, 
                    width: `${hourToPercent(band.to) - hourToPercent(band.from)}%`,
                    background: band.color, opacity: 0.35, pointerEvents: 'none',
                  }} />
                ))}
                {[
                  { from: 6,  to: 12, label: 'MORNING' },
                  { from: 12, to: 14, label: 'MIDDAY' },
                  { from: 14, to: 17, label: 'AFTERNOON' },
                  { from: 17, to: 21, label: 'EVENING' },
                  { from: 21, to: 23, label: 'NIGHT' },
                ].map((band) => (
                  <div key={`lbl-${band.label}`} style={{
                    position: 'absolute', top: 6,
                    left: `${hourToPercent(band.from)}%`, 
                    transform: 'translateX(4px)',
                    pointerEvents: 'none',
                    fontSize: 9, fontWeight: 800, letterSpacing: '1.2px',
                    color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase',
                  }}>{band.label}</div>
                ))}

                {/* Booking cards */}
                {cards.map(({ b, hour, x, y, cardW }) => {
                  const statusC = STATUS_COLOR[b?.status] || '#475569';
                  const startLabel = fmtTime(
                    parseBookingDate(b, String(date).slice(0, 10)) ||
                    b?.estimated_departure_time ||
                    b?.booking_date ||
                    b?.created_at
                  ) || 'All day';
                  const cat = b?.status || 'booked';
                  const tod = timeOfDayLabel(hour);
                  return (
                    <div
                      key={b.booking_id || b.id || `${x}-${y}`}
                      className="rtl-tl-card"
                      style={{ left: x, top: y, width: cardW, background: statusC, opacity: 0.95 }}
                      onClick={() => setSelected(b)}
                    >
                      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, color: '#fff', marginBottom: 1 }}>
                        ⏰ {startLabel} · {tod}
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
                { label: 'Booking ID', value: selected.booking_code || selected.booking_id || '—', icon: '🗓' },
                { label: 'Time', value: fmtTime(selected.estimated_departure_time || selected.booking_date || selected.created_at) || 'All day', icon: '⏰' },
                { label: 'Time of Day', value: timeOfDayLabel(bookingHour(selected)), icon: '🌤' },
                { label: 'From', value: selected.from_location || selected.from || selected.origin || '—', icon: '📍' },
                { label: 'Location', value: selected.destination || selected.to_location || '—', icon: '🏁' },
                { label: 'Hearse', value: `${selected.hearse_name || ''} ${selected.plate_number || selected.number_plate || selected.hearse_plate || ''}`.trim() || '—', icon: '🚚' },
                { label: 'Branch', value: selected.branch_name || selected.branch || '—', icon: '🏢' },
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

              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#c0c2cc', marginBottom: 8, marginTop: 12 }}>
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