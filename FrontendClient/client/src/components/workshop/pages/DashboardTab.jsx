import React, { useContext, useState, useEffect } from 'react';
import { Ctx } from './WorkshopDashboard';

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF', primaryLight: '#93C5FD',
  success: '#059669', successBg: '#ECFDF5', successLight: '#6EE7B7',
  warning: '#D97706', warningBg: '#FFFBEB', warningLight: '#FCD34D',
  danger: '#DC2626', dangerBg: '#FEF2F2', dangerLight: '#FCA5A5',
  purple: '#7C3AED', purpleBg: '#F5F3FF', purpleLight: '#C4B5FD',
  cyan: '#0891B2', cyanBg: '#ECFEFF', cyanLight: '#67E8F9',
  orange: '#EA580C', orangeBg: '#FFF7ED',
};

const STAGES = [
  { name: 'Building', icon: 'fa-hammer', color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Waiting Bay', icon: 'fa-clock', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Painting', icon: 'fa-paint-roller', color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Interior', icon: 'fa-couch', color: '#0891B2', bg: '#ECFEFF' },
  { name: 'Store', icon: 'fa-warehouse', color: '#059669', bg: '#ECFDF5' },
];

const DashboardTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  
  const { orders, workers, materials, setModal, deleteOrder, updateOrderStatus, loadData, addToast } = ctx;
  const [loading, setLoading] = useState(false);
  const [advancingOrder, setAdvancingOrder] = useState(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeOrder, setStoreOrder] = useState(null);
  const [pickedQuantity, setPickedQuantity] = useState(1);
  const [pickDate, setPickDate] = useState(new Date().toISOString().split('T')[0]);

  const totalOrders = orders.length;
  const inProgress = orders.filter(o => o.stageIndex < 4).length;
  const completedOrders = orders.filter(o => o.stageIndex === 4).length;
  const lowStock = materials.filter(m => m.quantity <= m.minLevel).length;
  const stageCounts = STAGES.map((_, i) => orders.filter(o => o.stageIndex === i).length);

  const handleAdvanceClick = (order) => {
    setAdvancingOrder(order);
    setShowAdvanceModal(true);
  };

  const handleAdvanceTo = async (order, stageIndex) => {
    setLoading(true);
    try {
      const newStatus = STAGES[stageIndex].name.toLowerCase().replace(' ', '_');
      console.log(`[ADVANCE] Attempting to advance order ${order.dbId} (${order.id}) to ${newStatus}`);
      console.log(`[ADVANCE] Order current stage: ${order.stageIndex}, target stage: ${stageIndex}`);
      
      // Call the update function
      const result = await updateOrderStatus(order.dbId, newStatus);
      
      console.log('[ADVANCE] API Response:', result);
      
      if (result && result.success) {
        addToast(`Order ${order.id} advanced to ${STAGES[stageIndex].name}`, 'success');
        setShowAdvanceModal(false);
        setAdvancingOrder(null);
        // Reload data to reflect changes
        setTimeout(async () => {
          await loadData();
        }, 300);
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('[ADVANCE] Failed:', error);
      console.error('[ADVANCE] Error details:', error.response?.data || error.message);
      addToast('Failed to advance order: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStorePick = (order) => {
    setStoreOrder(order);
    setShowStoreModal(true);
    setPickedQuantity(1);
    setPickDate(new Date().toISOString().split('T')[0]);
  };

  const confirmStorePick = async () => {
    if (!storeOrder || !pickedQuantity || pickedQuantity < 1) return;
    
    setLoading(true);
    try {
      // Here you would call an API to record the pickup
      console.log(`Picked ${pickedQuantity} coffins (${storeOrder.id}) on ${pickDate}`);
      addToast(`Picked ${pickedQuantity} coffins from store`, 'success');
      setShowStoreModal(false);
      setStoreOrder(null);
      await loadData();
    } catch (error) {
      addToast('Failed to record pickup: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '16px 20px', position: 'relative', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Orders</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.primary, lineHeight: 1, letterSpacing: '-0.02em' }}>{totalOrders}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginTop: 6 }}>All time</div>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 10, background: T.primaryBg, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-box" /></div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '16px 20px', position: 'relative', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>In Progress</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.warning, lineHeight: 1, letterSpacing: '-0.02em' }}>{inProgress}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginTop: 6 }}>{stageCounts[0]} building · {stageCounts[2]} painting</div>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 10, background: T.warningBg, color: T.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-spinner" /></div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '16px 20px', position: 'relative', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Low Stock</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: lowStock > 0 ? T.danger : T.success, lineHeight: 1, letterSpacing: '-0.02em' }}>{lowStock}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginTop: 6 }}>{lowStock > 0 ? 'Needs restocking' : 'All good'}</div>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 10, background: lowStock > 0 ? T.dangerBg : T.successBg, color: lowStock > 0 ? T.danger : T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-triangle-exclamation" /></div>
        </div>
      </div>

      {/* Production Pipeline */}
      <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}><i className="fas fa-diagram-project" style={{ fontSize: 15 }} /> Production Pipeline</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Click Advance to move orders to next stage</div>
          </div>
          <button onClick={() => setModal('createOrder')} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700 }}>
            <i className="fas fa-plus" style={{ fontSize: 10 }} /> New Order
          </button>
        </div>
        <div style={{ padding: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 1100 }}>
            {STAGES.map((stage, si) => {
              const stageOrders = orders.filter(o => o.stageIndex === si);
              return (
                <div key={si} style={{ flex: 1, minWidth: 200, background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 9, display: 'flex', flexDirection: 'column', maxHeight: 500 }}>
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stage.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: stage.color }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: stage.color, letterSpacing: '-0.01em' }}>{stage.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: stage.color, padding: '2px 9px', background: T.surface, borderRadius: 7, minWidth: 24, textAlign: 'center' }}>{stageOrders.length}</span>
                  </div>
                  <div style={{ padding: 8, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stageOrders.length === 0 ? (
                      <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 28, fontStyle: 'italic' }}>Empty</div>
                    ) : stageOrders.map(order => {
                      const assignee = workers.find(w => w.id === order.assignedTo) || { name: 'Unassigned', color: '#94A3B8' };
                      return (
                        <div key={order.dbId} style={{ padding: 10, background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 7, transition: 'all 0.15s' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, marginBottom: 3, letterSpacing: '0.04em' }}>{order.id}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 5, letterSpacing: '-0.01em' }}>{order.name}</div>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: T.primaryBg, color: T.primary }}>{order.type}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: T.purpleBg, color: T.purple }}>{order.color}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: assignee.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, flexShrink: 0 }}>
                              {assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span style={{ fontSize: 10, color: T.textSec, fontWeight: 500 }}>{assignee.name}</span>
                          </div>
                          {si < 4 ? (
                            <button 
                              onClick={() => handleAdvanceClick(order)} 
                              disabled={loading}
                              className="btn btn-sm" 
                              style={{ 
                                width: '100%', 
                                padding: '5px', 
                                fontSize: 10, 
                                background: T.successBg, 
                                color: T.success, 
                                border: `1px solid ${T.success}40`,
                                fontWeight: 700,
                                opacity: loading && advancingOrder?.dbId === order.dbId ? 0.6 : 1
                              }}
                            >
                              <i className="fas fa-arrow-right" style={{ fontSize: 9 }} /> {loading && advancingOrder?.dbId === order.dbId ? 'Advancing...' : 'Advance'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStorePick(order)} 
                              className="btn btn-sm" 
                              style={{ 
                                width: '100%', 
                                padding: '5px', 
                                fontSize: 10, 
                                background: T.cyanBg, 
                                color: T.cyan, 
                                border: `1px solid ${T.cyan}40`,
                                fontWeight: 700 
                              }}
                            >
                              <i className="fas fa-hand-holding" style={{ fontSize: 9 }} /> Pick Up
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advance Modal */}
      {showAdvanceModal && advancingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowAdvanceModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Advance Coffin</div>
              <button onClick={() => setShowAdvanceModal(false)} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: T.primaryBg, border: `1px solid ${T.primary}30`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Current Stage</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{advancingOrder.name}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{advancingOrder.id} · {STAGES[advancingOrder.stageIndex].name}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Advance to:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STAGES.slice(advancingOrder.stageIndex + 1).map((stage, idx) => {
                  const actualIdx = advancingOrder.stageIndex + 1 + idx;
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => handleAdvanceTo(advancingOrder, actualIdx)}
                      disabled={loading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                        border: `2px solid ${T.bdr}`, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                        background: T.surface, transition: 'all 0.15s', textAlign: 'left',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: stage.bg, color: stage.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        <i className={`fas ${stage.icon}`} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{stage.name}</div>
                        <div style={{ fontSize: 11, color: T.textSec }}>Move to {stage.name} stage</div>
                      </div>
                      <i className="fas fa-arrow-right" style={{ color: T.success, fontSize: 14 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Pickup Modal */}
      {showStoreModal && storeOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowStoreModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Store Pickup</div>
              <button onClick={() => setShowStoreModal(false)} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: T.cyanBg, border: `1px solid ${T.cyan}30`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.cyan, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>From Store</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{storeOrder.name}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{storeOrder.id} · {storeOrder.type} · {storeOrder.color}</div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>Quantity to Pick</label>
                <input
                  type="number"
                  min="1"
                  value={pickedQuantity}
                  onChange={e => setPickedQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 14, fontFamily: 'inherit', fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>Pickup Date</label>
                <input
                  type="date"
                  value={pickDate}
                  onChange={e => setPickDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 14, fontFamily: 'inherit', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowStoreModal(false)} className="btn" style={{ padding: '10px 20px', fontWeight: 600 }}>Cancel</button>
                <button onClick={confirmStorePick} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
                  <i className="fas fa-check" style={{ fontSize: 11 }} /> Confirm Pickup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;