import React from 'react';

/* 
   ReservationTopbar  brand bar: CoffinBook mark + New Booking action.
 */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ReservationTopbar({ onInventory, onNewBooking }) {
  return (
    <header className="cb-topbar">
      <div className="cb-topbar-brand">
        <div className="cb-topbar-mark">CB</div>
        <div className="cb-topbar-title">
          CoffinBook
          <span className="sub">Reservation Dashboard</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {onInventory && (
          <button type="button" className="cb-topbar-link" onClick={onInventory}>
            ? Inventory
          </button>
        )}
        <button className="cb-btn-primary" onClick={onNewBooking}>
          <PlusIcon />
          New Booking
        </button>
      </div>
    </header>
  );
}

export default ReservationTopbar;
