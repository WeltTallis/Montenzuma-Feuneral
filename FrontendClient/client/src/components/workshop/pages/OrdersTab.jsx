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

const stageKey = (name) => name.toLowerCase().replace(/\s+/g, '_');

/* -- Clean card shell -----------------------------------------------
   Deliberately flat: one hairline border, no gradients, no status pills.
   The stage reads as a coloured dot + label, exactly like the reference. */
/* The card background is tinted by stage so the whole board can be read at a
       glance: scan a coffin and its stage is obvious from the colour without
       hunting for the label. A LEFT border in the full stage colour reinforces
       it, and the stage dot stays for the accessible text cue. */
const card = {
  background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: 16,
  display: 'flex', flexDirection: 'column', gap: 10,
};
const cardTop = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 };
const orderIdStyle = { fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '.04em' };
const stageTag = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.text };
const dot = { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 };
const cardName = { fontSize: 15, fontWeight: 600, color: T.text };
const cardMeta = { fontSize: 12, color: T.textSec };
const workerRow = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textSec,
  paddingTop: 10, borderTop: `1px solid ${T.borderLight}`,
};
const avatar = {
  width: 22, height: 22, borderRadius: '50%', background: T.borderLight,
  border: `1px solid ${T.bdr}`, color: T.textSec, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0,
};
const cardFoot = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 };
const ageTxt = { fontSize: 11, color: T.textMuted };
const actions = { display: 'flex', gap: 2 };
const actBtn = {
  background: 'none', border: 'none', padding: '6px 8px', fontSize: 11, fontWeight: 600,
  color: T.textSec, cursor: 'pointer', borderRadius: 5, display: 'inline-flex',
  alignItems: 'center', gap: 5, fontFamily: 'inherit',
};
const optRow = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
  background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 13, color: T.text, textAlign: 'left',
};
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,.4)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const modalStyle = {
  background: T.surface, borderRadius: 10, width: '100%', maxWidth: 380,
  boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
};
const modalHead = {
  padding: '16px 20px', borderBottom: `1px solid ${T.bdr}`,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
const modalTitle = { fontSize: 14, fontWeight: 600, color: T.text, margin: 0 };
const modalClose = { background: 'none', border: 'none', fontSize: 20, color: T.textMuted, cursor: 'pointer', lineHeight: 1 };
const modalNote = { padding: '4px 8px 12px', fontSize: 12, color: T.textSec };

const initialsOf = (name) =>
  String(name || 'W').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const OrdersTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { orders, workers, setModal, updateOrderStatus, deleteOrder, assignWorker } = ctx;
  const [filter, setFilter] = useState('all');
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [statusOrderId, setStatusOrderId] = useState(null);

  // This tab renders the LIVE board only — finished orders are filtered out in
  // SQL (see workshopService.getActiveOrders), so "All" and "Active" are the
  // same set and a "Completed" option could only ever show 0. The stage filter
  // therefore groups what is still on the floor by where it currently is.
  const STAGE_FILTERS = [
    { value: 'all', label: 'All Open' },
    { value: 'Building', label: 'Building' },
    { value: 'Waiting Bay', label: 'Waiting Bay' },
    { value: 'Painting', label: 'Painting' },
    { value: 'Interior', label: 'Interior' },
  ];

  const filtered = useMemo(() => {
    let f = [...orders];
    if (filter !== 'all') f = f.filter(o => o.stageIndex === STAGES.findIndex(s => s.name === filter));
    return f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, filter]);

  const stageCount = (value) =>
    value === 'all' ? orders.length : orders.filter(o => o.stageIndex === STAGES.findIndex(s => s.name === value)).length;

  const assigningOrder = assigningOrderId != null ? orders.find(o => o.dbId === assigningOrderId) : null;
  const statusOrder = statusOrderId != null ? orders.find(o => o.dbId === statusOrderId) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="select" style={{ padding: '8px 32px 8px 12px', fontSize: 13 }}>
          {STAGE_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label} ({stageCount(f.value)})</option>
          ))}
        </select>
        <button onClick={() => setModal('createOrder')} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
          <i className="fas fa-plus" style={{ fontSize: 11 }} /> New Order
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ border: `1px dashed ${T.bdr}`, borderRadius: 8, textAlign: 'center', padding: 48, color: T.textMuted, fontSize: 13 }}>
          No orders found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(order => {
            const worker = workers.find(w => String(w.id) === String(order.assignedTo));
            const stage = STAGES[order.stageIndex] || STAGES[0];
            const isDone = order.stageIndex === 4;
            const daysInStage = isDone ? 0 : Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000);
            return (
              <div
                key={order.dbId}
                style={{
                  ...card,
                  background: stage.bg,
                  borderLeft: `4px solid ${stage.color}`,
                }}
              >
                <div style={cardTop}>
                  <span style={orderIdStyle}>{order.id}</span>
                  <span style={stageTag}>
                    <span style={{ ...dot, background: stage.color }} />
                    {stage.name}
                  </span>
                </div>
                <div style={cardName}>{order.name}</div>
                <div style={cardMeta}>{[order.size, order.color].filter(Boolean).join(' · ') || 'Standard · Natural'}</div>
                <div style={workerRow}>
                  {worker || order.assignedToName ? (
                    <>
                      <span style={avatar}>{initialsOf(worker?.name || order.assignedToName)}</span>
                      {worker?.name || order.assignedToName}
                    </>
                  ) : (
                    <em style={{ color: T.textMuted }}>Unassigned</em>
                  )}
                </div>
                <div style={cardFoot}>
                  <span style={isDone ? { ...ageTxt, color: T.success, fontWeight: 600 } : ageTxt}>
                    {isDone ? '✓ Completed' : `${daysInStage}d in stage`}
                  </span>
                  <div style={actions}>
                    <button onClick={() => setStatusOrderId(order.dbId)} style={{ ...actBtn, color: T.primary }} title="Update status">
                      <i className="fas fa-pen" style={{ fontSize: 10 }} /> Update
                    </button>
                    {!isDone && (
                      <button onClick={() => setAssigningOrderId(order.dbId)} style={actBtn} title="Assign worker">
                        <i className="fas fa-user" style={{ fontSize: 10 }} />
                      </button>
                    )}
                    <button onClick={() => deleteOrder(order.dbId)} style={{ ...actBtn, color: T.danger }} title="Delete">
                      <i className="fas fa-trash" style={{ fontSize: 10 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Status Modal — one flat row per stage, current one tagged. */}
      {statusOrder && (
        <div style={overlayStyle} onClick={() => setStatusOrderId(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHead}>
              <h3 style={modalTitle}>Update Status</h3>
              <button onClick={() => setStatusOrderId(null)} style={modalClose}>&times;</button>
            </div>
            <div style={{ padding: 12 }}>
              <div style={modalNote}>{statusOrder.id} — {statusOrder.name}</div>
              {STAGES.map((s, i) => {
                const isCurrent = i === statusOrder.stageIndex;
                return (
                  <button
                    key={s.name}
                    disabled={isCurrent}
                    onClick={async () => {
                      await updateOrderStatus(statusOrder.dbId, stageKey(s.name));
                      setStatusOrderId(null);
                    }}
                    /* Each option carries its own stage tint so the scanner flow
                       reads consistently with the board behind it. */
                    style={{
                      ...optRow,
                      background: s.bg,
                      borderLeft: `3px solid ${s.color}`,
                      borderRadius: 6,
                      color: isCurrent ? T.textMuted : T.text,
                      cursor: isCurrent ? 'default' : 'pointer',
                      opacity: isCurrent ? 0.6 : 1,
                    }}
                  >
                    <span style={{ ...dot, width: 8, height: 8, background: s.color }} />
                    {s.name}
                    {isCurrent && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: '.05em', textTransform: 'uppercase' }}>Current</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {assigningOrder && (
        <div style={overlayStyle} onClick={() => setAssigningOrderId(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHead}>
              <h3 style={modalTitle}>Assign Worker</h3>
              <button onClick={() => setAssigningOrderId(null)} style={modalClose}>&times;</button>
            </div>
            <div style={{ padding: 12 }}>
              <div style={modalNote}>{assigningOrder.id} — {assigningOrder.name}</div>
              {workers.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                  No workers available. Add workers first.
                </div>
              )}
              {workers.map(w => (
                <button
                  key={w.id}
                  onClick={async () => {
                    await assignWorker(assigningOrder.dbId, w.id);
                    setAssigningOrderId(null);
                  }}
                  style={optRow}
                >
                  <span style={avatar}>{initialsOf(w.name)}</span>
                  <span style={{ fontSize: 13, color: T.text }}>{w.name}</span>
                  <small style={{ marginLeft: 'auto', color: T.textMuted }}>{w.role}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
