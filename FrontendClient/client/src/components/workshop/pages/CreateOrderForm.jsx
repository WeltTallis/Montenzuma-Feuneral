import React, { useState } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

// The coffin types the workshop stocks. Kept in sync with COFFIN_TYPES in
// the workshop Store so an order can be booked against a type the store
// already tracks. "Other" stays in the list so a one-off model can still be
// typed by hand.
export const COFFIN_TYPES = [
  'Standard', 'Premier', 'Executive', 'Deluxe', 'Basic', 'Casket', 'Child',
];

const inputStyle = {
  width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`,
  borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text,
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 };

const CreateOrderForm = ({ close, onSubmit, workers = [] }) => {
    const [form, setForm] = useState({
      coffin_name: '', coffin_type: 'Standard', size: '', color: '',
      priority: 'normal', assigned_worker_id: '',
    });

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    close();
  };

  return (
    <form onSubmit={submit}>
            <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Coffin Name</label>
          <input required value={form.coffin_name} onChange={e => setForm({ ...form, coffin_name: e.target.value })} placeholder="e.g. Kamau Memorial Set" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Coffin Type</label>
          <select
            required
            value={form.coffin_type}
            onChange={e => setForm({ ...form, coffin_type: e.target.value })}
            style={inputStyle}
          >
            {COFFIN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <p style={{ fontSize: 11, color: T.textSec, margin: '4px 0 0' }}>
            The type is what the Store counts and tracks — every order of the same
            type is tallied as one store line.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Color</label>
            <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. Walnut, Mahogany, Oak" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Size (ft)</label>
            <input required value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="e.g. 6 ft" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assign Worker</label>
            <select value={form.assigned_worker_id} onChange={e => setForm({ ...form, assigned_worker_id: e.target.value })} style={inputStyle}>
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