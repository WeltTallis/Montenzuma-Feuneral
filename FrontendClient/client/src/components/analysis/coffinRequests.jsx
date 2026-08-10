import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

/* ─── Data ─── */
const REQUESTS = [
  { id: 'REQ-4282', from: 'Kisumu', to: 'Nairobi HQ', coffin: 'Pine Economy', qty: 5, neededBy: 'Aug 23', status: 'pending', urgency: 'critical', reason: 'Community tragedy — 6 casualties, immediate need', time: 'Just now' },
  { id: 'REQ-4281', from: 'Mombasa', to: 'Nairobi HQ', coffin: 'Mahogany Premium', qty: 4, neededBy: 'Aug 22', status: 'approved', urgency: 'high', reason: 'Funeral services backlog — 4 burials scheduled Saturday', time: '2 min ago' },
  { id: 'REQ-4280', from: 'Nakuru', to: 'Mombasa', coffin: 'Pine Economy', qty: 10, neededBy: 'Aug 21', status: 'in-transit', urgency: 'critical', reason: 'Emergency — mass funeral arrangement, 10 caskets required', time: '1 hr ago' },
  { id: 'REQ-4279', from: 'Machakos', to: 'Nairobi HQ', coffin: 'Hardwood Deluxe', qty: 2, neededBy: 'Aug 25', status: 'pending', urgency: 'low', reason: 'Upcoming VIP funeral — family requested specific hardwood', time: '2 hrs ago' },
  { id: 'REQ-4278', from: 'Mombasa', to: 'Kisumu', coffin: 'Wicker Natural', qty: 8, neededBy: 'Aug 24', status: 'declined', urgency: 'medium', reason: 'Kisumu also out of stock — no available supply chain', time: '3 hrs ago' },
  { id: 'REQ-4277', from: 'Nakuru', to: 'Nairobi HQ', coffin: 'Oak Standard', qty: 3, neededBy: 'Aug 22', status: 'delivered', urgency: 'high', reason: 'Replacement for damaged stock — water damage in storage', time: '5 hrs ago' },
  { id: 'REQ-4276', from: 'Machakos', to: 'Nairobi HQ', coffin: 'Oak Standard', qty: 6, neededBy: 'Aug 23', status: 'pending', urgency: 'medium', reason: 'Stock replenishment for upcoming week', time: '6 hrs ago' },
];

const STATUS_CFG = {
  pending: { label: 'Pending', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  approved: { label: 'Approved', color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
  'in-transit': { label: 'In Transit', color: 'var(--color-purple)', bg: 'var(--color-purple-light)' },
  delivered: { label: 'Delivered', color: 'var(--color-green)', bg: 'var(--color-green-light)' },
  declined: { label: 'Declined', color: 'var(--color-red)', bg: 'var(--color-red-light)' },
};

const URGENCY_CFG = {
  critical: { label: 'Critical', color: 'var(--color-red)', bg: 'var(--color-red-light)' },
  high: { label: 'High', color: 'var(--color-orange)', bg: 'var(--color-orange-light)' },
  medium: { label: 'Medium', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  low: { label: 'Low', color: 'var(--color-muted-foreground)', bg: 'var(--color-muted)' },
};

export default function CoffinRequests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const c = { all: REQUESTS.length, pending: 0, approved: 0, 'in-transit': 0, delivered: 0, declined: 0, critical: 0 };
    REQUESTS.forEach(r => {
      if (c[r.status] !== undefined) c[r.status]++;
      if (r.urgency === 'critical') c.critical++;
    });
    return c;
  }, []);

  const filtered = filter === 'all' ? REQUESTS : REQUESTS.filter(r => r.status === filter);
  const hasCritical = REQUESTS.some(r => r.urgency === 'critical' && r.status === 'pending');

  const handleRequestClick = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Branch Requests</span>
          {hasCritical && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 16,
              background: 'var(--color-red-light)',
              fontSize: 10, fontWeight: 600,
              color: 'var(--color-red)',
              animation: 'pulse-dot-red 2s ease-in-out infinite'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-red)' }} />
              LIVE
            </div>
          )}
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--color-primary)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          color: 'var(--color-primary-foreground)'
        }}>
          <Ic size={11} color="var(--color-primary-foreground)" sw={2.5}><path d="M12 5v14m-7-7h14" /></Ic>
          New Request
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>Overview</span>
          <span style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>Updated just now</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-amber-light)',
            border: '1px solid var(--color-amber)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-amber)', lineHeight: 1, marginBottom: 4 }}>{counts.pending}</div>
            <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>New</div>
            <div style={{ fontSize: 8, color: 'var(--color-muted-foreground)', marginTop: 2 }}>Needs review</div>
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-blue-light)',
            border: '1px solid var(--color-blue)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-blue)', lineHeight: 1, marginBottom: 4 }}>{counts.approved}</div>
            <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved</div>
            <div style={{ fontSize: 8, color: 'var(--color-muted-foreground)', marginTop: 2 }}>Awaiting pickup</div>
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-purple-light)',
            border: '1px solid var(--color-purple)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-purple)', lineHeight: 1, marginBottom: 4 }}>{counts['in-transit']}</div>
            <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Transit</div>
            <div style={{ fontSize: 8, color: 'var(--color-muted-foreground)', marginTop: 2 }}>On the road</div>
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: counts.critical > 0 ? 'var(--color-red-light)' : 'var(--color-green-light)',
            border: `1px solid ${counts.critical > 0 ? 'var(--color-red)' : 'var(--color-green)'}`,
            textAlign: 'center',
            animation: counts.critical > 0 ? 'pulse-dot-red 2s ease-in-out infinite' : 'none'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: counts.critical > 0 ? 'var(--color-red)' : 'var(--color-green)', lineHeight: 1, marginBottom: 4 }}>{counts.critical}</div>
            <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical</div>
            <div style={{ fontSize: 8, color: 'var(--color-muted-foreground)', marginTop: 2 }}>Immediate action</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'in-transit', 'delivered'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 5,
              border: `1px solid ${filter === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
              fontSize: 11, fontWeight: 500, fontFamily: 'inherit', lineHeight: 1, cursor: 'pointer',
              transition: 'all .15s'
            }}
          >
            {f === 'all' ? 'All' : STATUS_CFG[f]?.label}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
              fontSize: 9, fontWeight: 600,
              background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--color-muted)',
              color: filter === f ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)'
            }}>
              {counts[f] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 120px 100px 80px 60px',
          gap: 12,
          padding: '10px 16px',
          background: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <div>Request ID</div>
          <div>Route</div>
          <div>Product</div>
          <div>Qty</div>
          <div>Status</div>
          <div>Time</div>
        </div>

        {/* Table Rows */}
        {filtered.map((r, i) => {
          const sc = STATUS_CFG[r.status];
          const uc = URGENCY_CFG[r.urgency];
          
          return (
            <div
              key={r.id}
              onClick={() => handleRequestClick(r.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px 100px 80px 60px',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                transition: 'background .15s',
                background: 'transparent'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: 'var(--color-foreground)',
                  fontFamily: 'monospace', letterSpacing: '0.3px'
                }}>
                  {r.id}
                </span>
                {r.urgency === 'critical' && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-red)',
                    animation: 'pulse-dot-red 2s ease-in-out infinite'
                  }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-foreground)', fontWeight: 500 }}>
                <span>{r.from}</span>
                <Ic size={10} color="var(--color-muted-foreground)" sw={2.5}><path d="M5 12h14m-7-7 7 7-7 7" /></Ic>
                <span>{r.to}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.coffin}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1 }}>
                {r.qty}
              </div>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: sc.bg,
                  fontSize: 9,
                  fontWeight: 600,
                  color: sc.color
                }}>
                  {sc.label}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', whiteSpace: 'nowrap' }}>
                {r.time}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-muted-foreground)',
            fontWeight: 500
          }}>
            No requests matching this filter
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--color-muted-foreground)',
        fontStyle: 'italic'
      }}>
        Click on any request to view details
      </div>
    </div>
  );
}
