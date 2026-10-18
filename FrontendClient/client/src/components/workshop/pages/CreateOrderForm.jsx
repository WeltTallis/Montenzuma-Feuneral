import React, { useEffect, useMemo, useState } from 'react';
import { workshopService } from '../services/workshopService';

const T = {
  surface: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', textSec: '#64748B',
  primary: '#1E40AF',
};

/* Common coffin types remain available alongside tenant-configured types and
   variants already represented by finished stock. */
export const COFFIN_TYPES = [
  'Standard', 'Premier', 'Executive', 'Deluxe', 'Basic', 'Casket', 'Child',
];

const inputStyle = {
  width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`,
  borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: T.surface, color: T.text,
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 };

const CreateOrderForm = ({ close, onSubmit, workers = [], catalog }) => {
    const [form, setForm] = useState({
      coffin_name: '', coffin_type: 'Standard', size: '', color: '',
      priority: 'normal', assigned_worker_id: '',
    });

  /* Variants the Store already tracks. Best-effort: if the inventory call fails,
     the canonical COFFIN_TYPES list alone is offered. */
  const [storeTypes, setStoreTypes] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await workshopService.getStoreInventory();
      if (!alive || !res?.success) return;
      const list = Array.isArray(res.data?.coffinTypes) ? res.data.coffinTypes : [];
      setStoreTypes(list
        .map(t => ({
          type: String(t?.type ?? '').trim(),
          color: String(t?.color ?? '').trim(),
          size: String(t?.size ?? '').trim(),
          count: Number(t?.count) || 0,
        }))
        .filter(t => t.type));
    })();
    return () => { alive = false; };
  }, []);

  const keyOf = (s) => String(s).trim().toLowerCase();

  /* Canonical types first, then types from settings or finished stock. */
  const typeOptions = useMemo(() => {
    const counts = new Map();
    storeTypes.forEach((t) => counts.set(keyOf(t.type), (counts.get(keyOf(t.type)) || 0) + t.count));
    const seen = new Set();
    const out = [];
    const push = (raw) => {
      const type = String(raw).trim();
      const k = keyOf(type);
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push({ type, count: counts.get(k) || 0 });
    };
    COFFIN_TYPES.forEach(push);
    Object.keys(catalog?.types || {}).forEach(push);
    storeTypes.forEach(t => push(t.type));
    return out;
  }, [storeTypes, catalog]);

  const colorOptions = useMemo(() => {
    const configured = catalog?.types?.[form.coffin_type] || [];
    const stocked = storeTypes.filter((variant) => keyOf(variant.type) === keyOf(form.coffin_type)).map((variant) => variant.color);
    return [...new Set([...configured, ...stocked].filter(Boolean))];
  }, [catalog, form.coffin_type, storeTypes]);
  const selectedInStore = storeTypes
    .filter((variant) => keyOf(variant.type) === keyOf(form.coffin_type)
      && (!form.color || keyOf(variant.color) === keyOf(form.color))
      && (!form.size || keyOf(variant.size) === keyOf(form.size)))
    .reduce((count, variant) => count + variant.count, 0);

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
            onChange={e => setForm({ ...form, coffin_type: e.target.value, color: '' })}
            style={inputStyle}
          >
            {typeOptions.map(o => (
              <option key={o.type} value={o.type}>
                {o.type}{o.count > 0 ? ` — ${o.count} in Store` : ''}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: T.textSec, margin: '4px 0 0' }}>
            The Store tracks finished coffins separately by type, color, and size.
            {selectedInStore > 0 && (
              <> This combination currently has <b>{selectedInStore}</b> finished in the Store.</>
            )}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Color</label>
            <select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={inputStyle}>
              <option value="">Choose color</option>
              {colorOptions.map((color) => <option key={color} value={color}>{color}</option>)}
            </select>
            {form.color && catalog?.colors?.[form.color] && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, color: T.textSec, fontSize: 11 }}>
                <i style={{ width: 12, height: 12, display: 'inline-block', border: '1px solid #d1d5db', borderRadius: '50%', background: catalog.colors[form.color] }} />
                {form.color}
              </span>
            )}
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