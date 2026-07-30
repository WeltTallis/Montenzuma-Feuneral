import React, { useState, useMemo, useContext } from 'react';
import { Ctx } from './WorkshopDashboard';

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
};

const STAGES = [
  { name: 'Building', icon: 'fa-hammer', color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Waiting Bay', icon: 'fa-clock', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Painting', icon: 'fa-paint-roller', color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Interior', icon: 'fa-couch', color: '#0891B2', bg: '#ECFEFF' },
  { name: 'Store', icon: 'fa-warehouse', color: '#059669', bg: '#ECFDF5' },
];

const OrdersTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { orders, workers, setModal, updateOrderStatus, deleteOrder } = ctx;
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let f = [...orders];
    if (filter === 'active') f = f.filter(o => o.status !== 'completed' && o.status !== 'delivered');
    else if (filter === 'completed') f = f.filter(o => o.status === 'completed' || o.status === 'delivered');
    return f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, filter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="select" style={{ padding: '8px 32px 8px 12px', fontSize: 13 }}>
          <option value="all">All Orders ({orders.length})</option>
          <option value="active">Active ({orders.filter(o => o.stageIndex < 4).length})</option>
          <option value="completed">Completed ({orders.filter(o => o.stageIndex === 4).length})</option>
        </select>
        <button onClick={() => setModal('createOrder')} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
          <i className="fas fa-plus" style={{ fontSize: 11 }} /> New Order
        </button>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, overflow: 'hidden', animation: 'fadeIn 0.3s ease-out both', animationDelay: '0.1s' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.bdr}`, background: T.bg }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coffin</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned To</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stage</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time in Stage</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const assignee = workers.find(w => w.id === order.assignedTo) || { name: 'Unassigned', color: '#94A3B8' };
                const stage = STAGES[order.stageIndex] || STAGES[0];
                const daysInStage = order.stageIndex < 4 ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000) : '—';
                const isDone = order.stageIndex === 4;
                
                return (
                  <tr key={order.dbId} style={{ borderBottom: `1px solid ${T.borderLight}`, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: T.primary, letterSpacing: '0.03em' }}>{order.id}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text }}>{order.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textSec }}>{order.size || 'Standard'}</td>
                    <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: T.purpleBg, color: T.purple }}>{order.color || 'Natural'}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: assignee.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, flexShrink: 0 }}>
                          {assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>{assignee.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: stage.bg, color: stage.color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <i className={`fas ${stage.icon}`} style={{ fontSize: 9 }} />
                        {stage.name}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: typeof daysInStage === 'number' && daysInStage > 5 ? T.warning : T.textSec, fontWeight: typeof daysInStage === 'number' && daysInStage > 5 ? 700 : 400 }}>
                      {isDone ? '—' : `${daysInStage}d`}
                    </td>
                    <td style={{ fontSize: 11, color: T.textSec }}>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {!isDone ? (
                          <button 
                            onClick={() => updateOrderStatus(order.dbId, STAGES[Math.min(order.stageIndex + 1, 4)].name.toLowerCase().replace(' ', '_'))} 
                            className="btn btn-sm" 
                            style={{ padding: '5px 10px', background: T.successBg, color: T.success, border: `1px solid ${T.success}40`, fontWeight: 700 }}
                            title="Advance"
                          >
                            <i className="fas fa-arrow-right" style={{ fontSize: 9 }} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 10, color: T.success, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <i className="fas fa-check" style={{ fontSize: 9 }} /> Done
                          </span>
                        )}
                        <button onClick={() => deleteOrder(order.dbId)} className="btn btn-sm btn-danger" style={{ padding: '5px 10px' }} title="Delete">
                          <i className="fas fa-trash" style={{ fontSize: 9 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersTab;