import React from 'react';
import { HH, MAX_H, VIEWER_CSS, COFFIN_WEEK_EXTRA, dk, ft, layout, getStatus } from './viewerShared';

const SH = 5;
const EH = 22;
const DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const wsOf = (d) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - t.getDay());
  return t;
};

export default function WeeklyView({
  currentDate,
  bookings = [],
  onBookingClick,
  getCoffinName,
  selectedDate,
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

  const weekBookings = {};
  weekDays.forEach((day) => {
    const ds = dk(day);
    weekBookings[ds] = bookings.filter((b) => dk(b.service_date) === ds);
  });

  const allBookings = Object.values(weekBookings).flat();

  const now = new Date();
  const nws = wsOf(now);
  const sn = nws.getTime() === startOfWeek.getTime();
  const nh = now.getHours() + now.getMinutes() / 60;

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
          <div className="hc" data-hour={h} style={{ position: 'relative' }} />
        </div>
      );
    }
    rows.push(<React.Fragment key={`row${h}`}>{cells}</React.Fragment>);
  }

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
      const st = getStatus(b.status);
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
            left: `${lp}%`,
            width: `${wp}%`,
            background: st.color,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onBookingClick) onBookingClick(b);
          }}
        >
          <div className="bb-t">
            {showTm && <span className="bb-tm">{ft(b.start)}</span>}
            {showDs && <span className="bb-ds">{b.deceased_name || 'Reservation'}</span>}
          </div>
          {showFrom && (
            <div className="bb-frm">
              {b.client_name} · {(getCoffinName && getCoffinName(b.coffin_id)) || 'Coffin'}
            </div>
          )}
          {showPlate && <div className="bb-pl">{(getCoffinName && getCoffinName(b.coffin_id)) || 'Coffin'}</div>}
        </div>
      );
    });

    if (colBlocks.length > 0) {
      blocks.push(
        <div key={`col-${ds}`} className="dc-w" style={{ left: `${d * dayW}%`, width: `${dayW}%` }}>
          {colBlocks}
        </div>
      );
    }
  }

  return (
    <div className="dispatch-board">
      <style>{VIEWER_CSS + COFFIN_WEEK_EXTRA}</style>
      <div className="main">
        <div className="cal">
          <div className="gw">
            <div className="fl">
              {allBookings.length > 0 && (
                <div className="fb" style={{ animationDelay: '0s' }}>
                  <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                  <span style={{ color: '#2563EB' }}>{allBookings.length} Booking{allBookings.length !== 1 ? 's' : ''} This Week</span>
                </div>
              )}
              {allBookings.length === 0 && (
                <div className="fb" style={{ animationDelay: '0s' }}>
                  <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                  <span style={{ color: '#2563EB' }}>All Clear This Week</span>
                </div>
              )}
            </div>

            <div className="wkdh">
              <div className="dhs"></div>
              {weekDays.map((day, i) => {
                const isToday = dk(day) === todayStr;
                const isSel = selectedDate ? dk(day) === dk(selectedDate) : false;
                return (
                  <div className="wkc" key={i}>
                    <div className={`wkn ${isToday ? 'td' : ''}`}>{DS[i]}</div>
                    <div className={`wknm ${isToday || isSel ? 'td' : ''}`}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

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
