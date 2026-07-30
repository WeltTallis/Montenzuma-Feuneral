import React, { useState } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

const CreateWorkerForm = ({ close, onSubmit }) => {
  const [form, setForm] = useState({ full_name: '', role: 'Carpenter', email: '', phone: '' });

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    close();
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Full Name</label>
          <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Kamau" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
            <option>Carpenter</option><option>Senior Carpenter</option><option>Painter</option><option>Interior Finisher</option><option>All-rounder</option><option>Supervisor</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={close} className="btn" style={{ padding: '10px 20px' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Add Worker</button>
        </div>
      </div>
    </form>
  );
};

export default CreateWorkerForm;