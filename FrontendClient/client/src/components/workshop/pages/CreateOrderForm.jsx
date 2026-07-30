import React, { useState } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

const CreateOrderForm = ({ close, onSubmit }) => {
  const [form, setForm] = useState({ customer: '', deceased: '', type: 'Standard', color: 'Walnut', priority: 'normal' });

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    close();
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Customer Name</label>
          <input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Deceased Name</label>
          <input required value={form.deceased} onChange={e => setForm({ ...form, deceased: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Coffin Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option>Standard</option><option>Premium</option><option>Elite</option><option>Child</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Color</label>
            <select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option>Walnut</option><option>Mahogany</option><option>Oak</option><option>Cherry</option><option>White</option><option>Black</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Priority</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="express">Express</option>
          </select>
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