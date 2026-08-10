import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Ic = ({ children, size = 15, color = "currentColor", sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}
    style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </svg>
);

/* ─── Sample Data ─── */
const REQUESTS = {
  'REQ-4282': { id: 'REQ-4282', from: 'Kisumu', to: 'Nairobi HQ', coffin: 'Pine Economy', qty: 5, neededBy: 'Aug 23', status: 'pending', urgency: 'critical', reason: 'Community tragedy — 6 casualties, immediate need', time: 'Just now', inventory: { total: 12, reserved: 2, available: 10 } },
  'REQ-4281': { id: 'REQ-4281', from: 'Mombasa', to: 'Nairobi HQ', coffin: 'Mahogany Premium', qty: 4, neededBy: 'Aug 22', status: 'approved', urgency: 'high', reason: 'Funeral services backlog — 4 burials scheduled Saturday', time: '2 min ago', inventory: { total: 12, reserved: 3, available: 9 } },
  'REQ-4280': { id: 'REQ-4280', from: 'Nakuru', to: 'Mombasa', coffin: 'Pine Economy', qty: 10, neededBy: 'Aug 21', status: 'in-transit', urgency: 'critical', reason: 'Emergency — mass funeral arrangement, 10 caskets required', time: '1 hr ago', inventory: { total: 8, reserved: 5, available: 3 } },
  'REQ-4279': { id: 'REQ-4279', from: 'Machakos', to: 'Nairobi HQ', coffin: 'Hardwood Deluxe', qty: 2, neededBy: 'Aug 25', status: 'pending', urgency: 'low', reason: 'Upcoming VIP funeral — family requested specific hardwood', time: '2 hrs ago', inventory: { total: 15, reserved: 1, available: 14 } },
  'REQ-4278': { id: 'REQ-4278', from: 'Mombasa', to: 'Kisumu', coffin: 'Wicker Natural', qty: 8, neededBy: 'Aug 24', status: 'declined', urgency: 'medium', reason: 'Kisumu also out of stock — no available supply chain', time: '3 hrs ago', inventory: { total: 0, reserved: 0, available: 0 } },
  'REQ-4277': { id: 'REQ-4277', from: 'Nakuru', to: 'Nairobi HQ', coffin: 'Oak Standard', qty: 3, neededBy: 'Aug 22', status: 'delivered', urgency: 'high', reason: 'Replacement for damaged stock — water damage in storage', time: '5 hrs ago', inventory: { total: 12, reserved: 2, available: 10 } },
  'REQ-4276': { id: 'REQ-4276', from: 'Machakos', to: 'Nairobi HQ', coffin: 'Oak Standard', qty: 6, neededBy: 'Aug 23', status: 'pending', urgency: 'medium', reason: 'Stock replenishment for upcoming week', time: '6 hrs ago', inventory: { total: 8, reserved: 3, available: 5 } },
};

const STATUS_CFG = {
  pending: { label: 'Pending', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  approved: { label: 'Approved', color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
  'in-transit': { label: 'In Transit', color: 'var(--color-purple)', bg: 'var(--color-purple-light)' },
  delivered: { label: 'Delivered', color: 'var(--color-green)', bg: 'var(--color-green-light)' },
  declined: { label: 'Declined', color: 'var(--color-red)', bg: 'var(--color-red-light)' },
};

const URGENCY_CFG = {
  critical: { label: 'Critical', color: 'var(--color-red)', bg: 'var(--color-red-light)', pulse: true },
  high: { label: 'High', color: 'var(--color-orange)', bg: 'var(--color-orange-light)', pulse: false },
  medium: { label: 'Medium', color: 'var(--color-amber)', bg: 'var(--color-amber-light)', pulse: false },
  low: { label: 'Low', color: 'var(--color-muted-foreground)', bg: 'var(--color-muted)', pulse: false },
};

function RouteVisualization({ from, to, status }) {
  const isInTransit = status === 'in-transit';
  
  if (isInTransit) {
    return (
      <div style={{ padding: 16, background: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, fontWeight: 600, color: 'var(--color-foreground)' }}>
          <span>{from}</span>
          <span>{to}</span>
        </div>
        <div style={{ position: 'relative', height: 20, marginBottom: 8 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--color-muted)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '62%', height: 2, background: 'var(--color-purple)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '62%', transform: 'translateY(-50%)', fontSize: 14 }}>🚚</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-muted-foreground)' }}>
          <span>335 km</span>
          <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>62% complete</span>
          <span>ETA 14:35</span>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: 16, background: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>{from}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)' }}>335 km</div>
          <Ic size={16} color="var(--color-muted-foreground)" sw={2.5}><path d="M5 12h14m-7-7 7 7-7 7" /></Ic>
          <div style={{ fontSize: 9, color: 'var(--color-muted-foreground)' }}>ETA 5h 20m</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>{to}</div>
        </div>
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const request = REQUESTS[id];

  if (!request) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted-foreground)' }}>
        Request not found
      </div>
    );
  }

  const sc = STATUS_CFG[request.status];
  const uc = URGENCY_CFG[request.urgency];
  const inv = request.inventory;
  const canFulfill = inv.available >= request.qty;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-body)', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--color-lg)',
        padding: 20,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)', marginBottom: 8 }}>
              {request.id}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 12,
                background: sc.bg,
                fontSize: 11,
                fontWeight: 600,
                color: sc.color
              }}>
                {sc.label}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 12px',
                borderRadius: 12,
                background: uc.bg,
                fontSize: 11,
                fontWeight: 600,
                color: uc.color
              }}>
                {uc.pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: uc.color, animation: 'pulse-dot-red 2s ease-in-out infinite' }} />}
                {uc.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/requests')}
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'var(--color-background)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-muted-foreground)'
            }}
          >
            <Ic size={16} color="var(--color-muted-foreground)" sw={2.5}><path d="M18 6L6 18M6 6l12 12" /></Ic>
          </button>
        </div>

        {/* Route Visualization */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Route</div>
        <RouteVisualization from={request.from} to={request.to} status={request.status} />
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {/* Product Info */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Product Information</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 8 }}>{request.coffin}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: 'var(--color-muted-foreground)' }}>Quantity</span>
            <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{request.qty} units</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--color-muted-foreground)' }}>Needed By</span>
            <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{request.neededBy}</span>
          </div>
        </div>

        {/* Inventory Availability */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Inventory Availability</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--color-muted-foreground)' }}>Requested</span>
              <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{request.qty}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--color-muted-foreground)' }}>In Stock</span>
              <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{inv.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--color-muted-foreground)' }}>Reserved</span>
              <span style={{ fontWeight: 600, color: 'var(--color-amber)' }}>{inv.reserved}</span>
            </div>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: 'var(--color-foreground)' }}>Available</span>
              <span style={{ color: canFulfill ? 'var(--color-green)' : 'var(--color-red)' }}>{inv.available}</span>
            </div>
          </div>
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: canFulfill ? 'var(--color-green-light)' : 'var(--color-red-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 600,
            color: canFulfill ? 'var(--color-green)' : 'var(--color-red)'
          }}>
            {canFulfill ? '✓ CAN FULFILL' : '⚠ SHORTAGE — Need ' + (request.qty - inv.available) + ' more units'}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Reason / Notes</div>
        <div style={{ fontSize: 12, color: 'var(--color-foreground)', lineHeight: 1.6 }}>{request.reason}</div>
        <div style={{ fontSize: 10, color: 'var(--color-muted-foreground)', marginTop: 8 }}>Created {request.time}</div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: 'var(--color-red)',
            border: '1px solid var(--color-red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; }}
          >
            Decline
          </button>
          <button style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-secondary-foreground)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
          >
            ✓ Approve & Allocate
          </button>
        </div>
      )}
      {request.status !== 'pending' && (
        <button
          onClick={() => navigate('/requests')}
          style={{
            padding: '12px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          ← Back to Requests
        </button>
      )}
    </div>
  );
}
