import React, { useContext } from 'react';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textMuted: '#94A3B8',
  primary: '#1E40AF',
};

const ModalRouter = ({ type, onClose, onSubmit, workers = [] }) => {
  if (!type) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>
            {type === 'createOrder' && <><i className="fas fa-plus" style={{ color: T.primary, marginRight: 8 }} />New Coffin Order</>}
            {type === 'createWorker' && <><i className="fas fa-user-plus" style={{ color: T.primary, marginRight: 8 }} />Add Worker</>}
            {type === 'createMaterial' && <><i className="fas fa-cube" style={{ color: T.primary, marginRight: 8 }} />Add Material</>}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {type === 'createOrder' && <CreateOrderForm close={onClose} onSubmit={onSubmit} workers={workers} />}
          {type === 'createWorker' && <CreateWorkerForm close={onClose} onSubmit={onSubmit} />}
          {type === 'createMaterial' && <CreateMaterialForm close={onClose} onSubmit={onSubmit} />}
        </div>
      </div>
    </div>
  );
};

const CreateOrderForm = ({ close, onSubmit, workers = [] }) => {
      const [form, setForm] = React.useState({ coffin_name: '', size: '', color: '', priority: 'normal', assigned_worker_id: '' });

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

const CreateWorkerForm = ({ close, onSubmit }) => {
  const [form, setForm] = React.useState({ full_name: '', role: '' });

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
          <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder='e.g. Painter, Carpenter, Supervisor' style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={close} className="btn" style={{ padding: '10px 20px' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Add Worker</button>
        </div>
      </div>
    </form>
  );
};

const CreateMaterialForm = ({ close, onSubmit }) => {
  const [form, setForm] = React.useState({ name: '', category: 'general', unit: 'pieces', quantity: 0, minStock: 10, price: 0 });

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    close();
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Material Name</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pine Boards (18mm)" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="general">General</option><option value="wood">Wood</option><option value="hardware">Hardware</option><option value="finishing">Finishing</option><option value="upholstery">Upholstery</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Unit</label>
            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }}>
              <option>pieces</option><option>liters</option><option>meters</option><option>packs</option><option>kg</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Initial Stock</label>
            <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Low Stock Alert</label>
            <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={close} className="btn" style={{ padding: '10px 20px' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>Add Material</button>
        </div>
      </div>
    </form>
  );
};

export default ModalRouter;