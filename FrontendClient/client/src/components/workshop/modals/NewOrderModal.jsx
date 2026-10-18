import React, { useState, useEffect, useCallback } from 'react';

const NewOrderModal = ({ open, onClose, onSubmit, workers = [], types = [], colors = [], materials = [], sizes = ['Adult', 'Child', 'Oversized'] }) => {
  const [form, setForm] = useState({
    name: '',
    type: types[0] || '',
    material: materials[0] || '',
    color: colors[0] || '',
    size: sizes[0] || '',
    priority: 'normal',
    deadline: '',
    workers: [],
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: types[0] || prev.type, material: materials[0] || prev.material, color: colors[0] || prev.color }));
  }, [types, materials, colors]);

  const toggleWorker = useCallback((id) => {
    setForm((prev) => {
      const idx = prev.workers.indexOf(id);
      if (idx >= 0) return { ...prev, workers: prev.workers.filter((w) => w !== id) };
      return { ...prev, workers: [...prev.workers, id] };
    });
  }, []);

  const submit = useCallback((e) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit?.({
      coffin_name: form.name,
      coffin_type: form.type,
      material: form.material,
      size: form.size,
      color: form.color,
      priority: form.priority,
      deadline: form.deadline || 'Today, 5:00 PM',
      workers: form.workers,
    });
    onClose();
  }, [form, onSubmit, onClose]);

  const AVATAR_COLORS = ['#1E40AF', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777'];

  return (
    <div className="ec-modal-overlay open" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="ec-modal-head">
          <div>
            <div className="ec-mh-id">New coffin order</div>
            <div className="ec-mh-name">Create order</div>
          </div>
          <button className="ec-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ec-modal-body">
          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Coffin details</div>
            <div className="ec-no-form-grid">
              <div className="ec-no-field" style={{ gridColumn: '1 / -1' }}>
                <label>Coffin name</label>
                <input type="text" id="ec-no-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Oak Casket" />
              </div>
              <div className="ec-no-field">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ec-no-field">
                <label>Material</label>
                <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                  {materials.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="ec-no-field">
                <label>Color</label>
                <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                  {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ec-no-field">
                <label>Size</label>
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="ec-no-field" style={{ gridColumn: '1 / -1' }}>
                <label>Deadline</label>
                <input type="text" id="ec-no-deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="e.g. Today, 5:00 PM" />
              </div>
            </div>
          </div>

          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Priority</div>
            <div className="ec-no-priority-row">
              <label className="ec-no-priority-opt">
                <input type="radio" name="ec-no-priority" value="normal" checked={form.priority === 'normal'} onChange={() => setForm({ ...form, priority: 'normal' })} />
                <span className="ec-npo-box">
                  <span className="ec-npo-dot" style={{ background: '#1f9d50' }} />
                  <span className="ec-npo-name">Normal</span>
                </span>
              </label>
              <label className="ec-no-priority-opt">
                <input type="radio" name="ec-no-priority" value="rush" checked={form.priority === 'rush'} onChange={() => setForm({ ...form, priority: 'rush' })} />
                <span className="ec-npo-box">
                  <span className="ec-npo-dot" style={{ background: '#d63862' }} />
                  <span className="ec-npo-name">Rush</span>
                </span>
              </label>
            </div>
          </div>

          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Assign workers</div>
            <div className="ec-no-workers-list">
              {workers.map((w) => {
                const initials = w.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                const color = AVATAR_COLORS[w.id % AVATAR_COLORS.length];
                const isSelected = form.workers.includes(w.id);
                return (
                  <label key={w.id} className={`ec-no-worker-chip ${isSelected ? 'selected' : ''}`} onClick={() => toggleWorker(w.id)}>
                    <input type="checkbox" className="ec-no-worker" checked={isSelected} onChange={() => toggleWorker(w.id)} />
                    <span className="ec-nwc-av" style={{ background: color }}>{initials}</span>
                    <span className="ec-nwc-name">{w.name}</span>
                    <span className="ec-nwc-role" style={{ marginLeft: 'auto' }}>{w.role}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="ec-modal-footer">
          <span />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ec-modal-delete-btn" onClick={onClose} style={{ background: '#f4f5f7', color: '#666', borderColor: '#e0e0e0' }}>Cancel</button>
            <button className="ec-modal-close-btn" onClick={submit}>Create order</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
