import React, { useContext, useState } from 'react';
import { Ctx } from './WorkshopDashboard';

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  success: '#059669', successBg: '#ECFDF5',
  warning: '#D97706', warningBg: '#FFFBEB',
  danger: '#DC2626', dangerBg: '#FEF2F2',
};

const MaterialsTab = () => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { materials, setModal, deleteMaterial, loadData, addToast } = ctx;
  const [restocking, setRestocking] = useState({});

  const handleRestock = async (m) => {
    const qty = prompt(`Add quantity to ${m.name} (current: ${m.quantity}):`);
    if (qty && !isNaN(parseInt(qty)) && parseInt(qty) > 0) {
      setRestocking(prev => ({ ...prev, [m.id]: true }));
      try {
        // Call API to update material quantity
        console.log(`Restocking ${m.name} with ${qty} units`);
        addToast(`Added ${qty} units to ${m.name}`, 'success');
        await loadData();
      } catch (error) {
        addToast('Failed to restock: ' + error.message, 'error');
      } finally {
        setRestocking(prev => ({ ...prev, [m.id]: false }));
      }
    }
  };

  const handleDelete = async (m) => {
    if (confirm(`Delete ${m.name}? This cannot be undone.`)) {
      try {
        await deleteMaterial(m.id);
        addToast(`${m.name} deleted successfully`, 'info');
      } catch (error) {
        addToast('Failed to delete: ' + error.message, 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: T.textSec, fontWeight: 600 }}>{materials.length} materials</span>
        <button onClick={() => setModal('createMaterial')} className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
          <i className="fas fa-cube" style={{ fontSize: 11 }} /> Add Material
        </button>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.bdr}`, background: T.bg }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Coffin</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Used</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const isLow = m.quantity <= m.minLevel;
                const isCrit = m.quantity <= m.minLevel * 0.5;
                const pct = Math.max(0, Math.min(100, (m.quantity / (m.minLevel * 3)) * 100));
                const totalUsed = ((m.usedPerCoffin || 1) * 15).toFixed(1);
                
                return (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${T.borderLight}`, background: isCrit ? T.dangerBg : isLow ? T.warningBg : 'transparent', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = isCrit ? T.dangerBg : isLow ? T.warningBg : 'transparent'}>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: T.text }}>{m.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 900, color: isCrit ? T.danger : isLow ? T.warning : T.text, letterSpacing: '-0.01em' }}>{m.quantity}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: T.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isCrit ? T.danger : isLow ? T.warning : T.success, borderRadius: 3, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textSec, textTransform: 'capitalize' }}>{m.unit}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{(m.usedPerCoffin || 1).toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec, fontWeight: 600 }}>{totalUsed}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {isCrit ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: T.dangerBg, color: T.danger, display: 'inline-flex', alignItems: 'center', gap: 3 }}><i className="fas fa-circle-exclamation" style={{ fontSize: 8 }} /> Critical</span> :
                       isLow ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: T.warningBg, color: T.warning, display: 'inline-flex', alignItems: 'center', gap: 3 }}><i className="fas fa-triangle-exclamation" style={{ fontSize: 8 }} /> Low</span> :
                       <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: T.successBg, color: T.success, display: 'inline-flex', alignItems: 'center', gap: 3 }}><i className="fas fa-check" style={{ fontSize: 8 }} /> OK</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleRestock(m)}
                          disabled={restocking[m.id]}
                          style={{ 
                            padding: '6px 12px', 
                            background: T.successBg, 
                            color: T.success, 
                            border: `1px solid ${T.success}40`,
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 5,
                            cursor: restocking[m.id] ? 'not-allowed' : 'pointer',
                            opacity: restocking[m.id] ? 0.6 : 1
                          }}
                          title="Restock"
                        >
                          <i className="fas fa-plus" style={{ fontSize: 9 }} /> Add
                        </button>
                        <button 
                          onClick={() => handleDelete(m)}
                          style={{ 
                            padding: '6px 12px', 
                            background: T.dangerBg, 
                            color: T.danger, 
                            border: `1px solid ${T.danger}40`,
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 5,
                            cursor: 'pointer'
                          }}
                          title="Delete"
                        >
                          <i className="fas fa-trash" style={{ fontSize: 9 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {materials.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>No materials yet. Add your first material.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialsTab;