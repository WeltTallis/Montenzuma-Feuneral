import React from 'react';
import { BR, HH, MAX_H, SM, VIEWER_CSS, WEEK_CSS, dk, ft, layout } from './viewerShared';

// --- Weekly grid constants (match daily view: HH row height, operational window) ---
const SH = 5;
const EH = 22;
const DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const wsOf = d => { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - t.getDay()); return t; };

// --- Weekly View (same styling + data contract as the daily view) ---
export default function WeeklyView({
  currentDate,
  bookings = {},
  getEvents,
  openDay,
  openBookingDetails,
  onRefresh
}) {
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const todayStr = dk(new Date());

  // Resolve bookings for every day of the week (pre-normalised by HearseCalendar).
  const weekBookings = {};
  weekDays.forEach(day => {
    const ds = dk(day);
    weekBookings[ds] = getEvents ? getEvents(ds) : (bookings[ds] || []);
  });

  const allBookings = Object.values(weekBookings).flat();
  const tr = allBookings.filter(b => b.status === 'transit' || b.status === 'in_transit').length;
  const pn = allBookings.filter(b => b.status === 'pending').length;

  // Now line (only shown when the week being viewed is the current one)
  const now = new Date();
  const nws = wsOf(now);
  const sn = nws.getTime() === startOfWeek.getTime();
  const nh = now.getHours() + now.getMinutes() / 60;

  // Time grid rows: time gutter + 7 day columns
  const rows = [];
  for (let h = SH; h < EH; h++) {
    const l = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    const cells = [];
    cells.push(<div className="tl" key={`t${h}`}>{l}</div>);
    for (let d = 0; d < 7; d++) {
      const dd = new Date(startOfWeek);
      dd.setDate(dd.getDate() + d);
      cells.push(
        <div className="dc" key={`c${h}${d}`}>
          <div
            className="hc"
            data-hour={h}
            style={{ position: 'relative' }}
            onClick={(e) => { e.stopPropagation(); if (openDay) openDay(dk(dd), h); }}
          ></div>
        </div>
      );
    }
    rows.push(<React.Fragment key={`row${h}`}>{cells}</React.Fragment>);
  }
  // Booking blocks (same .bb styling as the daily view) - grouped per day column
  const blocks = [];
  const dayW = 100 / 7;
  for (let d = 0; d < 7; d++) {
    const dd = new Date(startOfWeek);
    dd.setDate(dd.getDate() + d);
    const ds = dk(dd);
    const laid = layout(weekBookings[ds] || []);
    const colBlocks = [];
    laid.forEach((b, i) => {
      const top = Math.max(0, Math.min((b.start - SH) * HH, (EH - SH) * HH - MAX_H));
      const height = Math.min(MAX_H, Math.max(HH * 0.2, (Math.min(b.end, EH) - Math.max(b.start, SH)) * HH));
      const wp = 100 / b._t;
      const lp = b._c * wp;
      const br = BR[b.branch] || BR.nairobi;
      const showTm = height > 30;
      const showDs = height > 48;
      const showFrom = height > 66;
      const showPlate = height > 42;
      colBlocks.push(
        <div
          key={`${ds}-${b.id}`}
          className="bb"
          style={{
            top: `${top}px`,
            height: `${height}px`,
            left: `calc(${lp}% + 2px)`,
            width: `calc(${wp}% - 4px)`,
            background: br.color,
            animationDelay: `${i * 0.04}s`
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (openBookingDetails) openBookingDetails(b);
          }}
        >
          <div className="bb-sp">{SM[b.status] || b.status}</div>
          <div className="bb-br">{b.branchName || br.name}</div>
          <div className="bb-cl">{b.client}</div>
          {showTm && <div className="bb-tm">{b.allDay ? 'All Day' : `${ft(b.start)} – ${ft(b.end)}`}</div>}
          {showDs && <div className="bb-ds">{b.dest}</div>}
          {showFrom && <div className="bb-dt">{b.from}</div>}
          {showPlate && <div className="bb-pl">{b.plate}</div>}
        </div>
      );
    });
    if (colBlocks.length) {
      blocks.push(
        <div
          key={`col-${ds}`}
          className="wkcol"
          style={{
            position: 'absolute',
            left: `calc(${d * dayW}% + 3px)`,
            width: `calc(${dayW}% - 6px)`,
            top: 0,
            bottom: 0,
            pointerEvents: 'none'
          }}
        >
          {colBlocks}
        </div>
      );
    }
  }

  return (
    <div className="dispatch-board">
      <style>{VIEWER_CSS + WEEK_CSS}</style>

      <div className="main">
        <div className="cal">
          <div className="gw">
            {/* Floating stats — real counts only */}
            <div className="fl">
              {allBookings.length > 0 && (
                <div className="fb" style={{ animationDelay: '0s' }}>
                  <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                  <span style={{ color: '#2563EB' }}>{allBookings.length} Booking{allBookings.length !== 1 ? 's' : ''} This Week</span>
                </div>
              )}
              {tr > 0 && (
                <div className="fb" style={{ animationDelay: '0.1s' }}>
                  <div className="fp" style={{ background: '#DC2626', color: '#DC2626' }}></div>
                  <span style={{ color: '#DC2626' }}>{tr} In Transit</span>
                </div>
              )}
              {pn > 0 && (
                <div className="fb" style={{ animationDelay: '0.2s' }}>
                  <div className="fp" style={{ background: '#D97706', color: '#D97706' }}></div>
                  <span style={{ color: '#D97706' }}>{pn} Pending</span>
                </div>
              )}
              {allBookings.length === 0 && (
                <div className="fb" style={{ animationDelay: '0s' }}>
                  <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                  <span style={{ color: '#2563EB' }}>All Clear This Week</span>
                </div>
              )}
            </div>

            {/* Day headers (Sun..Sat) */}
            <div className="wkdh">
              <div className="dhs"></div>
              {weekDays.map((day, i) => {
                const isToday = dk(day) === todayStr;
                return (
                  <div className="wkc" key={i}>
                    <div className={`wkn ${isToday ? 'td' : ''}`}>{DS[i]}</div>
                    <div className={`wknm ${isToday ? 'td' : ''}`}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Time grid + overlay */}
            <div className="tg tg-wk" id="weekGrid">
              {rows}
              <div className="tg-ov">
                {blocks}
                {sn && nh >= SH && nh < EH && (
                  <div className="nl" style={{ top: (nh - SH) * HH + 'px' }}>
                    <span className="nl-l">{ft(nh)}</span>
                  </div>
                )}
                {allBookings.length === 0 && (
                  <div className="empty-ctr">
                    <div style={{ textAlign: 'center' }}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <p style={{ marginTop: '8px' }}>No bookings for this week</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
