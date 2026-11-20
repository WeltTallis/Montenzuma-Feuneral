import React, { useMemo } from 'react';

/* ============================================================================
   DeliveriesView — delivery dispatch log.
   ============================================================================ */
const DeliveriesView = ({ deliveries = [] }) => {
  return (
    <div className="ec-deliveries-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Logistics</div>
          <h1 className="ec-view-title">Deliveries & dispatch</h1>
        </div>
      </div>

      <div className="ec-top-bar">
        <div className="ec-store-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search deliveries..." style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', color: '#1a1a1a' }} />
        </div>
        <button className="ec-new-order-btn" onClick={() => alert('New dispatch form would open here')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          New Dispatch
        </button>
      </div>

      <div className="ec-deliv-grid">
        {deliveries.map((d) => {
          const statusLabel = d.status.charAt(0).toUpperCase() + d.status.slice(1);
          const statusCls = d.status;
          return (
            <div key={d.id} className="ec-deliv-card">
              <div className="ec-deliv-top">
                <div>
                  <div className="ec-deliv-id">{d.id}</div>
                  <div className="ec-deliv-name">{d.coffin}</div>
                  <div className="ec-deliv-client">{d.client}</div>
                </div>
                <span className={`ec-deliv-status ${statusCls}`}>{statusLabel}</span>
              </div>

              <div className="ec-deliv-route">
                <div className="ec-deliv-route-point">
                  <span className="ec-drp-label">From</span>
                  <span className="ec-drp-value">{d.from}</span>
                </div>
                <div className="ec-deliv-route-arrow">?</div>
                <div className="ec-deliv-route-point">
                  <span className="ec-drp-label">To</span>
                  <span className="ec-drp-value">{d.destination}</span>
                </div>
              </div>

              <div className="ec-deliv-grid-info">
                <div className="ec-deliv-info-item">
                  <span className="ec-dii-label">Date</span>
                  <span className="ec-dii-value">{d.date}</span>
                </div>
                <div className="ec-deliv-info-item">
                  <span className="ec-dii-label">Time</span>
                  <span className="ec-dii-value">{d.time}</span>
                </div>
                <div className="ec-deliv-info-item">
                  <span className="ec-dii-label">Dispatched By</span>
                  <span className="ec-dii-value">{d.dispatchedBy}</span>
                </div>
                <div className="ec-deliv-info-item">
                  <span className="ec-dii-label">Received By</span>
                  <span className="ec-dii-value">{d.receivedBy || '—'}</span>
                </div>
                <div className="ec-deliv-info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="ec-dii-label">Purpose</span>
                  <span className="ec-dii-value">{d.purpose || '—'}</span>
                </div>
                <div className="ec-deliv-info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="ec-dii-label">Remarks</span>
                  <span className="ec-dii-value">{d.remarks || '—'}</span>
                </div>
              </div>

              <div className="ec-deliv-driver">
                <span className="ec-driver-av">{d.driver?.split(/\s+/).map((n) => n[0]).join('') || 'T'}</span>
                <div className="ec-deliv-driver-info">
                  <div className="ec-deliv-driver-name">{d.driver}</div>
                  <div className="ec-deliv-driver-role">Assigned driver</div>
                </div>
                <span className="ec-deliv-driver-status">{statusLabel}</span>
              </div>
            </div>
          );
        })}
        {deliveries.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#999' }}>
            No deliveries found
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveriesView;
