import React, { useState } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

const CreateOrderForm = ({ close, onSubmit, workers = [] }) => {
    const [form, setForm] = useState({ coffin_name: '', size: '', color: '', priority: 'normal', assigned_worker_id: '' });

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    close();
  };

  return (
    <form onSubmit={submit}>
            <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Coffin Name</label>
          <input required value={form.coffin_name} onChange={e => setForm({ ...form, coffin_name: e.target.value })} placeholder="e.g. Kamau Memorial Set" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Color</label>
            <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. Walnut, Mahogany, Oak" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Size (ft)</label>
            <input required value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="e.g. 6 ft" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Assign Worker</label>
            <select value={form.assigned_worker_id} onChange={e => setForm({ ...form, assigned_worker_id: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">-- Unassigned --</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.role ? `(${w.role})` : ''}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={close} className="btn" style={{ padding: '10px 20px' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Create Order</button>
        </div>
      </div>
    </form>
  );
};

export default CreateOrderForm;