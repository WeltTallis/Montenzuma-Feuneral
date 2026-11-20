import React from 'react';
import { C, getStatusStyle, money, fmtMDY } from '../tokens';

/* 
   ReservationDetailPanel  slide-in client/amount/payment panel.
  */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function ReservationDetailPanel({ booking, markingPaid, onClose, onMarkPaid }) {
  if (!booking) return null;
  const b = booking;
  const st = getStatusStyle(b);
  const dateObj = b.date;

  return (
    <>
      <div className="cb-ov" onClick={onClose} />
      <div className="cb-panel">
        <div className="cb-ph">
          <div className="cb-ph-status" style={{ color: st.color, background: st.bg }}>
            <span className="cb-ph-pulse" style={{ background: st.color }} />
            {st.label}
          </div>
          <button className="cb-ph-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="cb-pb">
          <div className="cb-pb-client">{b.clientName}</div>
          <div className="cb-pb-code">Booking #{b.id}</div>
          <div className="cb-pb-sec">
            <div className="cb-pb-sec-t">Details</div>
            <div className="cb-pb-grid">
              <div className="cb-pb-card">
                <div className="cb-pb-card-l">Phone</div>
                <div className="cb-pb-card-v">{b.phone || '�'}</div>
              </div>
              <div className="cb-pb-card">
                <div className="cb-pb-card-l">Payment</div>
                <div className="cb-pb-card-v" style={{ color: b.paid ? C.suc : C.dng, fontWeight: 700 }}>
                  {b.paid ? 'Paid' : 'Unpaid'}
                </div>
              </div>
              <div className="cb-pb-card">
                <div className="cb-pb-card-l">Coffin</div>
                <div className="cb-pb-card-v" style={{ fontSize: 12 }}>{b.coffinType}</div>
              </div>
              <div className="cb-pb-card">
                <div className="cb-pb-card-l">Schedule</div>
                <div className="cb-pb-card-v" style={{ fontSize: 12 }}>{fmtMDY(dateObj)} {b.time || ''}</div>
              </div>
              <div className="cb-pb-card wide">
                <div className="cb-pb-card-l">Amount</div>
                <div className="cb-pb-card-v hl">{money(b.price)}</div>
              </div>
              {b.deceasedName && (
                <div className="cb-pb-card wide">
                  <div className="cb-pb-card-l">Deceased</div>
                  <div className="cb-pb-card-v">{b.deceasedName}</div>
                </div>
              )}
              {b.notes && (
                <div className="cb-pb-card wide">
                  <div className="cb-pb-card-l">Notes</div>
                  <div className="cb-pb-card-v" style={{ fontSize: 12, color: C.ink2 }}>{b.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="cb-pf">
          {!b.paid ? (
            <button className="cb-pbtn primary" onClick={() => onMarkPaid(b.id)} disabled={markingPaid}>
              {markingPaid ? 'Processing...' : (<><CheckIcon /> Mark as Paid</>)}
            </button>
          ) : (
            <button className="cb-pbtn paid" disabled>
              <CheckIcon /> Payment Received
            </button>
          )}
          <button className="cb-pbtn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

export default ReservationDetailPanel;
