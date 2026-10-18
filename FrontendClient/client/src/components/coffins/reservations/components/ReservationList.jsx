import React from 'react';
import { format } from 'date-fns';
import { getStatusStyle, getPaymentStatus, money, fmtMD, fmtTime12 } from '../tokens';

/* ============================================================================
   ReservationList — month table + clicked-day filter banner.
   ============================================================================ */
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ReservationList({ visible, clickedDay, panelBk, onPick, onClearDay }) {
  const dayBanner = clickedDay ? (
    <div className="cb-df">
      <span>
        <CalIcon /> Showing: {fmtMD(clickedDay)}
        {` — ${visible.length} booking${visible.length !== 1 ? 's' : ''}`}
      </span>
      <button onClick={onClearDay}>
        Clear <CloseIcon />
      </button>
    </div>
  ) : null;

  if (visible.length === 0) {
    return (
      <>
        {dayBanner}
        <div className="cb-empty">
          <div className="cb-empty-ico">
            <CalIcon />
          </div>
          <span style={{ fontSize: 12 }}>
            {clickedDay ? 'No bookings for ' + fmtMD(clickedDay) : 'No bookings for this period'}
          </span>
        </div>
      </>
    );
  }

  const rows = visible.map((b) => {
    const st = getStatusStyle(b);
    const pay = getPaymentStatus(b);
    const isActive = panelBk && panelBk.id === b.id;
    return (
      <div key={b.id} className={'cb-r' + (isActive ? ' active' : '')} onClick={() => onPick(b)}>
        <div className="cb-bar" style={{ background: st.bar }} />
        <div className="cb-cell">
          <div className="cb-nm">{b.clientName}</div>
          {b.deceasedName && (
            <div className="cb-sub">
              <span><UserIcon /></span>
              {b.deceasedName}
            </div>
          )}
        </div>
        <div className="cb-cell">
          <div className="cb-cn">{b.coffinType}</div>
          <div className="cb-sub">
            <span><PhoneIcon /></span>
            {b.phone || '—'}
          </div>
        </div>
        <div className="cb-cell">
          <div className="cb-mt">{fmtMD(b.date)}</div>
          <div className="cb-sub">
            <span><ClockIcon /></span>
            {b.time ? fmtTime12(b.time) : '—'}
          </div>
        </div>
        <div className="cb-cell">
          <span className="cb-status-chip" style={{ background: st.bg }}>
            <span className="dot" style={{ background: st.color }} />
            <span className="lbl" style={{ color: st.color }}>{st.label}</span>
          </span>
        </div>
        <div className="cb-cell" style={{ textAlign: 'right' }}>
          <div className="cb-pr">{money(b.price)}</div>
          <div className="cb-paid" style={{ color: pay.color }}>
            <span className="cb-paid-dot" style={{ background: pay.color }} />
            {money(b.paidAmount || 0)} / {money(b.price)}
          </div>
        </div>
      </div>
    );
  });

  return (
    <>
      {dayBanner}
      <div className="cb-lh">
        <div />
        <div>Client</div>
        <div>Coffin</div>
        <div>Schedule</div>
        <div>Status</div>
        <div>Amount</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>{rows}</div>
    </>
  );
}

export default ReservationList;
