import React, { useState, useCallback } from 'react';

/* ============================================================================
   UseMaterialsModal — log material usage for an order.
   Props: open, materials, onClose, onSubmit
   ============================================================================ */
const UseMaterialsModal = ({ open, materials = [], onClose, onSubmit }) => {
  const [quantities, setQuantities] = useState({});

  const handleChange = useCallback((id, value) => {
    const qty = parseFloat(value);
    setQuantities((prev) => ({ ...prev, [id]: isNaN(qty) || qty <= 0 ? 0 : qty }));
  }, []);

  const submit = () => {
    const usage = Object.entries(quantities).filter(([, q]) => q > 0).map(([id, qty]) => ({
      materialId: parseInt(id, 10),
      qty,
    }));
    if (usage.length === 0) return;
    onSubmit?.(usage);
    onClose();
  };

  return (
    <div className="ec-modal-overlay open" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="ec-modal-head">
          <div>
            <div className="ec-mh-id">Log material usage</div>
            <div className="ec-mh-name">Use Materials</div>
          </div>
          <button className="ec-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ec-modal-body">
          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Enter quantity used per material — stock will be reduced and logged with a timestamp</div>
            <div className="ec-um-form-grid">
              {materials.map((m) => {
                const lowCls = m.quantity <= m.minLevel ? 'color:#d63862;' : m.quantity <= m.minLevel * 1.5 ? 'color:#d97706;' : 'color:#1a1a1a;';
                return (
                  <div key={m.id} className="ec-um-mat-row">
                    <div>
                      <div className="ec-um-mat-name">{m.name}</div>
                      <div className="ec-um-mat-stock">
                        In stock: <span style={{ lowCls, fontWeight: 700 }}>{m.quantity} {m.unit}</span> · Per coffin: {m.perCoffin}
                      </div>
                    </div>
                    <input type="number" min="0" max={m.quantity} className="ec-um-mat-input" data-mat-id={m.id} placeholder="0" onChange={(e) => handleChange(m.id, e.target.value)} />
                    <span className="ec-um-mat-unit">{m.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="ec-modal-footer">
          <span />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ec-modal-delete-btn" onClick={onClose} style={{ background: '#f4f5f7', color: '#666', borderColor: '#e0e0e0' }}>Cancel</button>
            <button className="ec-modal-close-btn" onClick={submit}>Log usage</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseMaterialsModal;