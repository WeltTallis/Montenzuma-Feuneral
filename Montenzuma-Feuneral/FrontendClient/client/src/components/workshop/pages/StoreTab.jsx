import React, { useContext, useState, useEffect, useCallback } from 'react';
import { formatDate as fmtDate, parseDate, toDateKey } from '../../../utils/dates/parseDates';
import { workshopService } from '../services/workshopService';
import api from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';
import { getParentTenantSlug, getTenantSlug, getBranchId, getBranches } from '../../../utils/globalAuth';
import { CoffinAPI } from '../../../api/coffinApi';
import { Ctx } from './WorkshopContext';

const T = {

  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  warning: '#D97706', warningBg: '#FFFBEB',
  danger: '#DC2626', dangerBg: '#FEF2F2',

};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const toKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
// fmtDate is now imported from utils/dates/parseDates (single source of truth, no UTC shift)
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

const CAP_KEY = 'workshop.store.capacity';
const HIST_KEY = 'workshop.store.history';
const ADJ_KEY = 'workshop.store.adjust';

const Gauge = ({ pct, label }) => {

  const C = Math.PI * 70;
  const color = pct >= 85 ? T.danger : pct >= 60 ? T.warning : T.success;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="180" height="104" viewBox="0 0 180 104" style={{ display: 'block', margin: '0 auto' }}>

        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#E2E8F0" strokeWidth="16" strokeLinecap="round" />

        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} />

        <text x="90" y="82" textAnchor="middle" fontSize="26" fontWeight="800" fill={T.text}>{pct}%</text>

        <text x="90" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill={T.textMuted}>{label}</text>

      </svg>

    </div>

  );

};

const StoreTab = ({ dispatchRequest = 0 }) => {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { addToast, workers = [], catalog = { colors: {} } } = ctx;
  const slug = getTenantSlug() || 'default';

  const [items, setItems] = useState([]);

  const [history, setHistory] = useState([]);

  const [stats, setStats] = useState({ totalUnits: 0, coffinsCount: 0, materialsUnits: 0, dispatchedToday: 0, totalDispatched: 0 });

  const [capacity, setCapacity] = useState(() => load(`${CAP_KEY}.${slug}`, 50));


  const [modal, setModal] = useState(null);

  const [loading, setLoading] = useState(false);
  const [previewDispatchId, setPreviewDispatchId] = useState('');

  /* Drivers are ordinary users with role "driver" (created in Settings → Users),
     NOT rows in the hearse service's own roster. The hearse `/all-drivers`
     endpoint has no create/assign path, so it is almost always empty and the
     dispatch dropdown read "No drivers available". Fetch the tenant user list
     the same way the Settings page does (GET /tenant/{slug}/users against the
     PARENT tenant slug) and filter it down to drivers here. The stored
     driver_id/driver_name still match what the Driver Portal looks up by name. */
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchesError, setBranchesError] = useState('');

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true);
    setDriversError('');
    try {
      // Tenant-level users live in the PARENT tenant DB; a branch slug is not a
      // real tenant, so the parent slug must take priority (mirrors SettingsPage).
      // Try each candidate slug in turn — the first that returns a non-empty user
      // list wins, so a stale/missing parentTenantSlug can't blank the dropdown.
      const seen = new Set();
      const slugCandidates = [
        getParentTenantSlug(),
        getTenantSlug(),
        localStorage.getItem('tenantSlug'),
        localStorage.getItem('parentTenantSlug'),
      ].filter(Boolean).filter(s => (seen.has(s) ? false : (seen.add(s), true)));
      if (!slugCandidates.length) {
        throw new Error('Could not resolve your organisation. Please sign in again.');
      }

      // Keep only drivers — case/format tolerant since several services write
      // the role ('driver', 'Driver', 'hearse_driver', 'Hearse Driver', ...).
      const isDriver = (u) => {
        const role = String(u?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
        return role === 'driver' || role === 'hearse_driver' || role.includes('driver');
      };
      const toDriver = (u) => ({
        id: String(u.user_id ?? u.id ?? ''),
        name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || '',
      });

      let drivers = [];
      let lastList = [];
      let resolvedSlug = '';
      for (const slug of slugCandidates) {
        const headers = { 'x-tenant-slug': slug };
        let r;
        try {
          r = await api.get(ENDPOINTS.TENANT.USERS(slug), { headers });
        } catch (err) {
          // 404 = tenant not found for this slug; keep trying the next candidate.
          if (err?.response?.status === 404) continue;
          throw err;
        }
        const list = r?.data?.data || r?.data?.users || r?.data;
        if (!Array.isArray(list)) {
          throw new Error('The user service returned an invalid user list.');
        }
        lastList = list;
        resolvedSlug = slug;
        const found = list.filter(isDriver).map(toDriver).filter(d => d.id && d.name);
        if (found.length) { drivers = found; break; }
      }

      setDrivers(drivers);

      // Self-diagnosing log: shows exactly what the API returned and why nothing
      // matched, so "No drivers available" is never a dead end in the console.
      if (!drivers.length) {
        const roles = [...new Set(lastList.map(u => String(u?.role ?? '')))];
        console.warn('[StoreTab] No drivers matched.', {
          resolvedSlug,
          triedSlugs: slugCandidates,
          userCount: lastList.length,
          distinctRoles: roles,
          sampleUsers: lastList.slice(0, 5).map(u => ({ id: u.user_id ?? u.id, name: u.full_name ?? u.username, role: u.role })),
        });
        setDriversError(
          lastList.length
            ? `No users with a "Driver" role were found for ${resolvedSlug || 'your organisation'} (roles present: ${roles.filter(Boolean).join(', ') || 'none'}). Add one in Settings → Users, then Retry.`
            : 'No drivers were found. Add a user with the "Driver" role in Settings → Users before dispatching a coffin.'
        );
      }
    } catch (e) {
      setDrivers([]);
      console.warn('[StoreTab] loadDrivers failed:', e?.response?.data || e?.message);
      setDriversError(e?.response?.data?.message || e?.message || 'Could not load the driver list.');
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const loadBranches = useCallback(async () => {
    setBranchesError('');
    const cached = (getBranches() || []).map((branch) => ({
      id: String(branch.branchId ?? branch.branch_id ?? branch.id ?? ''),
      name: branch.name || branch.branchName || branch.branch_name || branch.branchSlug || 'Branch',
    })).filter((branch) => branch.id);
    const currentBranchId = String(getBranchId() || '');
    if (currentBranchId && !cached.some((branch) => branch.id === currentBranchId)) {
      cached.push({ id: currentBranchId, name: 'My branch' });
    }

    try {
      const parentSlug = getParentTenantSlug();
      if (!parentSlug) throw new Error('Could not resolve your organisation to load branches.');
      const response = await api.get(ENDPOINTS.TENANT.BRANCHES(parentSlug));
      const result = response?.data?.data || response?.data?.branches || response?.data;
      const branchRows = Array.isArray(result) ? result : Array.isArray(result?.branches) ? result.branches : [];
      if (!branchRows.length && !cached.length) throw new Error('No branches are available for this organisation.');
      const remote = branchRows.map((branch) => ({
        id: String(branch.branchId ?? branch.branch_id ?? branch.id ?? ''),
        name: branch.name || branch.branchName || branch.branch_name || branch.branchSlug || 'Branch',
      })).filter((branch) => branch.id);
      const merged = [...remote];
      cached.forEach((branch) => {
        if (!merged.some((item) => item.id === branch.id)) merged.push(branch);
      });
      setBranches(merged);
      setDispatchForm((form) => ({
        ...form,
        branchId: form.branchId || currentBranchId || merged[0]?.id || '',
      }));
    } catch (error) {
      setBranches(cached);
      setBranchesError(error?.response?.data?.message || error.message || 'Could not load branch options.');
      setDispatchForm((form) => ({ ...form, branchId: form.branchId || currentBranchId || cached[0]?.id || '' }));
    }
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const [form, setForm] = useState({ qty: 1, date: toKey(new Date()), pickedBy: '', notes: '' });

  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const [dispatchStep, setDispatchStep] = useState(1);

  const [dispatchCart, setDispatchCart] = useState([]); // { key, name, sub, unit, qty, maxQty }[]

  const [dispatchForm, setDispatchForm] = useState({

    dispatchType: 'inventory',
    branchId: String(getBranchId() || ''),
    inventoryPrice: '',
    customerName: '',
    customerPhone: '',
    customerFor: '',
    serviceDate: toKey(new Date()),
    serviceTime: '',

    dispatchedBy: '',

    receivedBy: '',

    // `driverId` is the roster assignment; `driver` stores its display name.
    driverId: '',

    driver: '',

    date: toKey(new Date()),

    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

    destination: '',

    from: '',

    purpose: '',

    remarks: '',

  });



  const loadStore = useCallback(async () => {

    try {

      const res = await workshopService.getStoreInventory();

      if (res && res.success) {

        const data = res.data || {};

        setItems(Array.isArray(data.items) ? data.items.map(it => {
          const variant = String(it.item_sub || '').match(/^Color:\s*(.*?)\s*·\s*Size:\s*(.*?)$/);
          return {
          key: it.item_key, kind: it.item_type || 'Item', name: it.item_name,

          sub: it.item_sub || '', color: variant && variant[1] !== '—' ? variant[1] : '', size: variant && variant[2] !== '—' ? variant[2] : '', unit: it.unit || 'pcs', quantity: Number(it.quantity) || 0,

          assignedToName: it.assigned_to_name || '',

        }; }) : []);

        setHistory(Array.isArray(data.history) ? data.history.map(h => ({

          id: h.id, action: h.action, itemKey: h.item_key, name: h.item_name, sub: h.item_sub || '',

          unit: h.unit || 'pcs', qty: Number(h.qty) || 0, date: toDateKey(parseDate(h.txn_date)) || '',

          pickedBy: h.txn_by || '', notes: h.notes || '', assignedToName: h.assigned_to_name || '',
          dispatchType: h.dispatch_type || 'legacy', dispatchId: h.dispatch_id || '',
          recipientName: h.recipient_name || '', recipientPhone: h.recipient_phone || '',
          destination: h.destination || '', destinationBranchId: h.destination_branch_id || '',
          serviceDate: h.service_date || '', serviceTime: h.service_time || '',

        })) : []);

        if (data.stats) setStats(data.stats);

      } else {

        addToast(res?.error || 'Failed to load store', 'error');

      }

    } catch (e) {

      addToast('Failed to load store: ' + (e.message || 'error'), 'error');

    }

  }, [addToast]);



  useEffect(() => { loadStore(); }, [loadStore]);



  // Store shows coffins only — materials are tracked separately in Materials stock

  const storeItems = items.filter(it => it.kind === 'Coffin');

  const effQty = (item) => Math.max(0, Number(item?.quantity) || 0);

  const totalUnits = storeItems.reduce((s, it) => s + effQty(it), 0);

  const coffinsCount = Number(stats.coffinsCount) || 0;

  const gaugePct = Math.min(100, Math.round((totalUnits / (capacity || 1)) * 100));


  const dispatchedToday = Number(stats.dispatchedToday) || 0;

  const totalDispatched = Number(stats.totalDispatched) || 0;




  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const setDF = (key) => (e) => setDispatchForm(f => ({ ...f, [key]: e.target.value }));



  // Aviation-style multi-coffin dispatch

  const readyCoffins = items.filter(it => it.kind === 'Coffin' && effQty(it) > 0);

  /* The "Dispatch Coffin" button now lives in the workshop top bar, one level
     above this tab, but the stored-coffin list it needs lives here. The parent
     bumps `dispatchRequest` on each click; we watch it and run the very same
     openAviationDispatch that this button used to call directly.

     The guard on n > 0 matters: on first mount the prop is 0, and the effect
     must not fire then or the panel would pop open the moment the Store tab
     was rendered. */
  useEffect(() => {
    if (dispatchRequest > 0) openAviationDispatch();
  }, [dispatchRequest]);



  const openAviationDispatch = () => {

    setDispatchCart([]);

    setDispatchForm(f => ({

      ...f,

      date: toKey(new Date()),

      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),

      serviceDate: toKey(new Date()),

      customerFor: '',

      dispatchedBy: '',

      receivedBy: '',

      driverId: '',

      driver: '',

      destination: '',

      from: '',

      purpose: '',

      remarks: '',

    }));

    setDispatchStep(1);

    setShowDispatchModal(true);

  };



  const addToCart = (item) => {

    setDispatchCart(cart => {

      if (cart.find(c => c.key === item.key)) return cart;

      return [...cart, { key: item.key, name: item.name, sub: item.sub, unit: item.unit, qty: 1, maxQty: effQty(item) }];

    });

  };

  const removeFromCart = (key) => {

    setDispatchCart(cart => cart.filter(c => c.key !== key));

  };

  const updateCartQty = (key, qty) => {

    setDispatchCart(cart => cart.map(c => c.key === key ? { ...c, qty: Math.max(1, Math.min(qty, c.maxQty)) } : c));

  };

  const cartTotalUnits = dispatchCart.reduce((s, c) => s + (c.qty || 0), 0);



  const receiveInBranchInventory = async (item, quantity, branchId) => {
    if (!branchId) throw new Error('Select a destination branch.');
    const parentSlug = getParentTenantSlug();
    if (!parentSlug) throw new Error('Could not resolve your organisation to register branch stock.');

    const response = await CoffinAPI.getAllBranches(parentSlug);
    const inventoryRows = Array.isArray(response?.data) ? response.data : [];
    const variant = inventoryRows.find((row) =>
      String(row.branch_id || '') === String(branchId)
      && String(row.type || row.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
      && String(row.color || '').trim().toLowerCase() === String(item.color || '').trim().toLowerCase()
      && String(row.size || '').trim().toLowerCase() === String(item.size || '').trim().toLowerCase()
    );

    if (variant) {
      await CoffinAPI.updateInventory(variant.coffin_id, {
        quantity: (Number(variant.quantity) || 0) + quantity,
      }, branchId);
      return variant;
    }

    const price = Number(dispatchForm.inventoryPrice);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Enter a valid coffin price to register ${item.name} in this branch's inventory.`);
    }
    return CoffinAPI.registerInventory({
      type: item.name,
      color: item.color || '',
      size: item.size || '',
      quantity,
      exact_price: price,
      description: 'Received from workshop dispatch',
    }, branchId);
  };

  const submitAviationDispatch = async () => {

    const errors = [];

    if (dispatchCart.length === 0) errors.push('Select at least one coffin to dispatch');

    if (!dispatchForm.dispatchedBy.trim()) errors.push('Enter dispatched by name');

    if (!dispatchForm.branchId || !branches.some((branch) => branch.id === dispatchForm.branchId)) errors.push('Select a registered destination branch');
    if (dispatchForm.dispatchType === 'customer' && !dispatchForm.customerName.trim()) errors.push('Enter the customer name');
    if (dispatchForm.dispatchType === 'customer' && !dispatchForm.serviceDate) errors.push('Choose the customer service date');
    if (!dispatchForm.driverId || !drivers.some(d => d.id === dispatchForm.driverId)) errors.push('Select a registered driver');



    if (errors.length > 0) {

      addToast(errors[0], 'error');

      return;

    }



    setLoading(true);

    try {

      const dispatchId = `DSP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const destinationBranch = branches.find((branch) => branch.id === dispatchForm.branchId);

      const results = await Promise.all(dispatchCart.map(async (cartItem) => {

        const item = items.find(it => it.key === cartItem.key);
        if (!item) return { success: false, key: cartItem.key, name: cartItem.name };

        const q = cartItem.qty || 1;
        if (q > effQty(item)) return { success: false, key: item.key, name: item.name, error: 'Not enough stock' };

        const response = await workshopService.dispatchStoreItem({
          item_key: item.key,
          item_type: item.kind,
          item_name: item.name,
          item_sub: item.sub,
          unit: item.unit,
          qty: q,
          date: dispatchForm.date,
          picked_by: dispatchForm.dispatchedBy,
          dispatch_type: dispatchForm.dispatchType,
          dispatch_id: dispatchId,
          recipient_name: dispatchForm.dispatchType === 'customer' ? dispatchForm.customerName.trim() : '',
          recipient_phone: dispatchForm.customerPhone.trim(),
          destination_branch_id: dispatchForm.branchId,
          service_date: dispatchForm.dispatchType === 'customer' ? dispatchForm.serviceDate : null,
          service_time: dispatchForm.dispatchType === 'customer' ? dispatchForm.serviceTime : null,
          driver_id: dispatchForm.driverId || null,
          driver_name: dispatchForm.driver || null,
          destination: dispatchForm.dispatchType === 'customer' ? dispatchForm.customerName.trim() : destinationBranch?.name || null,
          notes: 'DISPATCH LOG: Dispatch ID: ' + dispatchId + ' | Type: ' + dispatchForm.dispatchType + ' | Dispatched By: ' + dispatchForm.dispatchedBy + ' | Received By: ' + (dispatchForm.receivedBy || 'None') + ' | Driver: ' + dispatchForm.driver + ' | From: ' + (dispatchForm.from || 'N/A') + ' | Destination: ' + (dispatchForm.dispatchType === 'customer' ? dispatchForm.customerName : destinationBranch?.name || 'N/A') + ' | Purpose: ' + dispatchForm.purpose + ' | Remarks: ' + dispatchForm.remarks + ' | Time: ' + dispatchForm.time + (item.assignedToName ? ' | Assigned To: ' + item.assignedToName : ''),
        });
        if (!response?.success) {
          return { success: false, key: item.key, name: item.name, error: response?.error || 'Dispatch request failed' };
        }

        const transactionId = response?.data?.transaction?.id || response?.transaction?.id;
        try {
          const branchVariant = await receiveInBranchInventory(item, q, dispatchForm.branchId);
          let customerOrderId = '';
          if (dispatchForm.dispatchType === 'customer') {
            const order = await CoffinAPI.createOrder({
              coffin_id: branchVariant.coffin_id,
              coffin_name: item.name,
              color: item.color || '',
              size: item.size || '',
              quantity: q,
              client_name: dispatchForm.customerName.trim(),
              client_phone: dispatchForm.customerPhone.trim(),
              deceased_name: dispatchForm.customerFor.trim(),
              service_date: dispatchForm.serviceDate,
              service_time: dispatchForm.serviceTime || null,
              notes: `Created from workshop dispatch ${dispatchId}`,
            }, dispatchForm.branchId);
            customerOrderId = String(order?.order_id || order?.data?.order_id || '');
          }
          if (transactionId) {
            const update = await workshopService.updateDispatchTarget(transactionId, {
              status: 'synced',
              customer_order_id: customerOrderId,
            });
            if (!update?.success) throw new Error(update?.error || 'Branch registration status could not be saved.');
          }
        } catch (error) {
          const message = error?.friendlyMessage || error?.response?.data?.message || error.message || 'Target registration failed';
          if (transactionId) {
            try {
              const targetUpdate = await workshopService.updateDispatchTarget(transactionId, { status: 'failed', error: message });
              if (!targetUpdate?.success) console.error('[StoreTab] Could not record failed dispatch target status:', targetUpdate?.error);
            } catch (targetUpdateError) {
              console.error('[StoreTab] Could not record failed dispatch target status:', targetUpdateError);
            }
          }
          return { success: false, recorded: true, key: item.key, name: item.name, error: message };
        }
        return { success: true, key: item.key, name: item.name, qty: q };

      }));



      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        const recordedFailures = failed.filter((result) => result.recorded);
        const dispatchFailures = failed.filter((result) => !result.recorded);
        if (recordedFailures.length) {
          addToast('Dispatch recorded, but branch/customer registration needs attention: ' + recordedFailures.map(f => `${f.name} (${f.error})`).join(', '), 'error');
        }
        if (dispatchFailures.length) {
          addToast('Dispatch failed for: ' + dispatchFailures.map(f => `${f.name}${f.error ? ` (${f.error})` : ''}`).join(', '), 'error');
        }
        setDispatchCart(cart => cart.filter(item => dispatchFailures.some(f => f.key === item.key)));
        if (!dispatchFailures.length) {
          setShowDispatchModal(false);
          setDispatchCart([]);
        }
      } else {
        addToast('Successfully dispatched ' + dispatchCart.length + ' coffin(s) · ' + cartTotalUnits + ' units', 'success');
        setShowDispatchModal(false);
        setDispatchCart([]);
      }

      loadStore();

    } catch (error) {

      addToast('Dispatch failed: ' + (error.message || 'Unknown error'), 'error');

    } finally {

      setLoading(false);

    }

  };



  const openDispatch = (item) => {
    setDispatchCart([{ key: item.key, name: item.name, sub: item.sub, unit: item.unit, qty: 1, maxQty: effQty(item) }]);
    setDispatchStep(2);
    setDispatchForm((form) => ({
      ...form,
      dispatchType: 'inventory',
      date: toKey(new Date()),
      serviceDate: toKey(new Date()),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      dispatchedBy: '',
      receivedBy: '',
      customerName: '',
      customerPhone: '',
      customerFor: '',
      inventoryPrice: '',
    }));
    setShowDispatchModal(true);
  };

  const openRestock = (item) => { setForm({ qty: 1, date: toKey(new Date()), pickedBy: '', notes: '' }); setModal({ type: 'restock', item }); };



  const handleDispatch = async () => {

    const item = modal.item;

    const q = parseInt(form.qty, 10) || 1;

    if (q <= 0) return addToast('Enter a valid quantity', 'error');

    if (q > effQty(item)) return addToast('Not enough stock in store', 'error');

    const res = await workshopService.dispatchStoreItem({

      item_key: item.key, item_type: item.kind, item_name: item.name, item_sub: item.sub, unit: item.unit,

      qty: q, date: form.date, picked_by: form.pickedBy, notes: form.notes,

    });

    if (res && res.success) { addToast(`Dispatched ${q} × ${item.name}`, 'success'); setModal(null); loadStore(); }

    else addToast(res?.error || 'Dispatch failed', 'error');

  };



  const handleRestock = async () => {

    const item = modal.item;

    const q = parseInt(form.qty, 10) || 1;

    if (q <= 0) return addToast('Enter a valid quantity', 'error');

    const res = await workshopService.restockStoreItem({

      item_key: item.key, item_type: item.kind, item_name: item.name, item_sub: item.sub, unit: item.unit,

      qty: q, date: form.date, picked_by: form.pickedBy, notes: form.notes,

    });

    if (res && res.success) { addToast(`Added ${q} × ${item.name} to store`, 'success'); setModal(null); loadStore(); }

    else addToast(res?.error || 'Restock failed', 'error');

  };






  const inputS = { width: '100%', padding: '10px 12px', border: `1px solid ${T.bdr}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };

  const labelS = { display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 };



  return (

    <>

    {/* Store is the one screen workers use on a phone while standing at the
        racks: the gauge + stat band stacks, and the stock table scrolls
        sideways instead of squashing the action buttons off-screen. */}
    <style>{`
      .st-gauge { display: grid; grid-template-columns: 230px 1fr; gap: 16px; align-items: stretch; }
      .st-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .st-tablewrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .st-tablewrap table { min-width: 560px; }

      @media (max-width: 768px) {
        .st-gauge { grid-template-columns: 1fr; gap: 12px; }
        .st-stats { grid-template-columns: 1fr; gap: 10px; }
      }
    `}</style>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {renderHeader()}

      {renderGaugeBand()}

      {renderInventory()}

      {/* Calendar + History used to live on a separate admin-only /workshop/store-journal
          page. That page is gone: the journal is part of the Store view inside the
          Operations dashboard's Workshop module, so there is one Store, not two.
          Floor staff keep working from this plain stock list. */}

      {modal?.type === 'dispatch' && renderDispatchModal()}

      {modal?.type === 'restock' && renderRestockModal()}

      {showDispatchModal && renderAviationDispatchModal()}

    </div>

    </>
  );



  function renderHeader() {

    return (

      /* The "Store Management / In-store coffins · dispatch · history" identity block
       was removed by request — the Store tab is already named Store in the tab
       bar directly above it, so the heading repeated itself. The capacity
       control and the Dispatch action are deliberately KEPT: they are the only
       two working controls on this screen. */
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

        {/* Right-hand control cluster: capacity + dispatch sit side by side. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

            <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, whiteSpace: 'nowrap' }}>Store Capacity</span>

            <input type="number" min={1} value={capacity} onChange={e => { const v = Math.max(1, parseInt(e.target.value, 10) || 50); setCapacity(v); save(`${CAP_KEY}.${slug}`, v); }} style={{ width: 76, padding: '8px 10px', border: `1px solid ${T.bdr}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', fontWeight: 700, boxSizing: 'border-box' }} />

            <span style={{ fontSize: 11, color: T.textMuted }}>units</span>

          </div>

          {/* "Dispatch Coffins" MOVED to the workshop top bar (WorkshopDashboard.jsx).

              It is a workshop-wide action — a coffin has to be finished and in the
              store before it can be dispatched — so burying it on the Store tab
              made the driver cross two tabs to reach it. It now lives next to the
              tab switcher and drives this tab through the `dispatchRequest`
              counter, which opens the same panel via the effect below.

              Only the button was removed. Store Capacity stays, because it is the
              one setting that actually belongs to this screen. */}

        </div>

      </div>

    );

  }



  function statCard(bg, label, value, sub, icon) {

    return (

      <div style={{ background: bg, borderRadius: 12, padding: 20, height: 130, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>

          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className={`fas ${icon}`} /></div>

        </div>

        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{sub}</div>

      </div>

    );

  }



  function renderGaugeBand() {

    return (

      <div className="st-gauge">

        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 12, padding: '18px 12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          <Gauge pct={gaugePct} label={`${totalUnits} of ${capacity} units`} />

          <div style={{ textAlign: 'center', marginTop: 4, fontSize: 12, fontWeight: 700, color: gaugePct >= 85 ? T.danger : gaugePct >= 60 ? T.warning : T.success }}>

            {totalUnits === 0 ? 'Store Empty' : gaugePct >= 85 ? 'Near Capacity' : gaugePct >= 60 ? 'Healthy Stock' : 'Plenty of Room'}

          </div>

        </div>

        <div className="st-stats">

          {statCard('#1e3a8a', 'Coffins in Store', coffinsCount, 'Ready for pickup', 'fa-warehouse')}

          {statCard('#d97706', 'Dispatched Today', dispatchedToday, `${totalDispatched} all-time coffins`, 'fa-truck-ramp-box')}

        </div>

      </div>

    );

  }



  function renderInventory() {

    return (

      <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>

        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>

          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}><i className="fas fa-list-check" style={{ color: T.primary }} /> Store Inventory</div>

          <span style={{ fontSize: 12, color: T.textSec }}>{storeItems.length} item(s) · {totalUnits} units</span>

        </div>

        <div className="st-tablewrap" style={{ overflowX: 'auto' }}>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>

            <thead>

              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.bdr}` }}>

                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>

                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>

                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Store</th>

                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatched</th>

                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>

              </tr>

            </thead>

            <tbody>

              {storeItems.map(it => {

                const dispatchedQty = history.filter(h => h.itemKey === it.key && h.action === 'DISPATCH').reduce((s, h) => s + (h.qty || 0), 0);

                const q = effQty(it);

                const isCoffin = it.kind === 'Coffin';

                return (

                  <tr key={it.key} style={{ borderBottom: `1px solid ${T.borderLight}` }}>

                    <td style={{ padding: '10px 14px' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: T.text }}>
                        {it.color && <i aria-label={it.color} title={it.color} style={{ width: 12, height: 12, flex: '0 0 12px', border: '1px solid #cbd5e1', borderRadius: '50%', background: catalog.colors?.[it.color] || '#e5e7eb' }} />}
                        {it.name}
                      </div>

                      <div style={{ fontSize: 11, color: T.textSec }}>{it.sub}</div>

                    </td>

                    <td style={{ padding: '10px 14px' }}>

                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: isCoffin ? T.primaryBg : T.successBg, color: isCoffin ? T.primary : T.success }}>{it.kind}</span>

                    </td>

                    <td style={{ padding: '10px 14px' }}>

                      <span style={{ fontSize: 15, fontWeight: 800, color: q === 0 ? T.danger : T.text }}>{q}</span>

                      <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>{it.unit}</span>

                    </td>

                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: T.textSec }}>{dispatchedQty}</td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>

                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>

                        <button onClick={() => openRestock(it)} style={{ padding: '7px 12px', background: T.successBg, color: T.success, border: `1px solid ${T.success}40`, fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Add to store"><i className="fas fa-plus" style={{ fontSize: 10 }} /> Add</button>

                        <button onClick={() => openDispatch(it)} disabled={q === 0} style={{ padding: '7px 12px', background: T.dangerBg, color: T.danger, border: `1px solid ${T.danger}40`, fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: q === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: q === 0 ? 0.5 : 1 }} title="Dispatch from store"><i className="fas fa-truck" style={{ fontSize: 10 }} /> Dispatch</button>

                      </div>

                    </td>

                  </tr>

                );

              })}

              {storeItems.length === 0 && (

                <tr>

                  <td colSpan={5} style={{ textAlign: 'center', padding: 44, color: T.textMuted, fontSize: 13 }}>

                    <i className="fas fa-warehouse" style={{ fontSize: 40, opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />

                    No coffins in the store yet. Advance coffin orders to the Store stage.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    );

  }

  function primaryBtn(bg, color) {

    return { padding: '10px 18px', background: bg, color, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' };

  }



  function renderAviationDispatchModal() {
    return (
      <>
        <style>{`@keyframes storeDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000 }} onClick={() => setShowDispatchModal(false)}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(640px, 98vw)', background: T.surface, boxShadow: '-14px 0 44px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', animation: 'storeDrawerIn .28s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><i className="fas fa-truck-fast" style={{ color: T.danger, marginRight: 8 }} />Dispatch Coffin</div>
              <button onClick={() => setShowDispatchModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2].map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dispatchStep === s ? 1 : dispatchStep > s ? 0.8 : 0.45 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: dispatchStep >= s ? T.primary : T.bg, color: dispatchStep >= s ? '#fff' : T.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                      {dispatchStep > s ? <i className="fas fa-check" style={{ fontSize: 9 }} /> : s}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: dispatchStep === s ? T.text : T.textSec }}>{s === 1 ? 'Select Coffin' : 'Dispatch Details'}</span>
                    {s === 1 && <i className="fas fa-chevron-right" style={{ fontSize: 10, color: T.textMuted }} />}
                  </div>
                ))}
              </div>

              {dispatchStep === 1 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.textSec }}>{readyCoffins.length} coffin(s) in store</span>
                    {dispatchCart.length > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryBg, padding: '4px 10px', borderRadius: 6 }}>
                        {dispatchCart.length} selected · {cartTotalUnits} units
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, minHeight: 340, padding: 6, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg }}>
                    {readyCoffins.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 28, fontSize: 13, color: T.textMuted }}>
                        <i className="fas fa-warehouse" style={{ fontSize: 32, opacity: 0.25, display: 'block', margin: '0 auto 10px' }} />
                        No coffins available to dispatch.
                      </div>
                    ) : readyCoffins.map(it => {
                      const inCart = dispatchCart.find(c => c.key === it.key);
                      const isChecked = !!inCart;
                      return (
                        <label key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${isChecked ? T.primary : T.borderLight}`, background: isChecked ? T.primaryBg : T.surface, cursor: 'pointer', boxShadow: isChecked ? `0 0 0 2px ${T.primary}15` : 'none', transition: 'all .15s' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addToCart(it);
                              } else {
                                removeFromCart(it.key);
                              }
                            }}
                            style={{ accentColor: T.primary, width: 18, height: 18 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{it.name}</div>
                            <div style={{ fontSize: 11, color: T.textSec }}>{it.sub} · Available: {effQty(it)} {it.unit}{it.assignedToName ? ' · Assigned: ' + it.assignedToName : ''}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min={1}
                              max={effQty(it)}
                              value={isChecked ? inCart.qty : 1}
                              onChange={(e) => {
                                const v = Math.max(1, Math.min(Number(e.target.value) || 1, effQty(it)));
                                if (isChecked) updateCartQty(it.key, v);
                              }}
                              disabled={!isChecked}
                              style={{ ...inputS, width: 80, opacity: isChecked ? 1 : 0.5, cursor: isChecked ? 'text' : 'not-allowed' }}
                            />
                            <span style={{ fontSize: 11, color: T.textMuted }}>{it.unit}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDispatchModal(false)} style={primaryBtn(T.bg, T.textSec)}>Cancel</button>
                    <button onClick={() => dispatchCart.length > 0 ? setDispatchStep(2) : addToast('Select at least one coffin to dispatch', 'error')} disabled={dispatchCart.length === 0} style={{ ...primaryBtn(T.danger, '#fff'), opacity: dispatchCart.length > 0 ? 1 : 0.5, cursor: dispatchCart.length > 0 ? 'pointer' : 'not-allowed' }}>
                      Next <i className="fas fa-arrow-right" style={{ fontSize: 11, marginLeft: 6 }} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Dispatch ID */}
                  <div style={{ background: T.primaryBg, border: `1px solid ${T.primary}30`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec }}>Dispatch ID</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.primary, letterSpacing: 0.5 }}>{previewDispatchId || '...'}</span>
                  </div>

                  {/* Dispatch Details Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>Dispatched By</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{dispatchForm.dispatchedBy || '—'}</div>
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>From</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{dispatchForm.from || '—'}</div>
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>To</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{dispatchForm.dispatchType === 'customer' ? dispatchForm.customerName || 'Customer' : branches.find((branch) => branch.id === dispatchForm.branchId)?.name || 'Select branch'}</div>
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>Driver</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: dispatchForm.driver ? T.text : T.textMuted }}>{dispatchForm.driver || 'Unassigned'}</div>
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>Dispatch Date</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{dispatchForm.date ? fmtDate(dispatchForm.date) : '—'}</div>
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 8, padding: '8px 12px', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 2 }}>Dispatch Time</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{dispatchForm.time || '—'}</div>
                    </div>
                  </div>

                  {/* Dispatch Details Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelS}>Dispatch type *</label>
                      <select value={dispatchForm.dispatchType} onChange={setDF('dispatchType')} style={inputS}>
                        <option value="inventory">Add to branch inventory</option>
                        <option value="customer">Direct customer order</option>
                      </select>
                      <small style={{ display: 'block', marginTop: 5, color: T.textMuted }}>
                        {dispatchForm.dispatchType === 'inventory'
                          ? 'The dispatched coffin variant will be added to the selected branch inventory.'
                          : 'The coffin will be registered in branch inventory and a customer booking will be created immediately.'}
                      </small>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelS}>Destination branch *</label>
                      <select value={dispatchForm.branchId} onChange={setDF('branchId')} style={inputS}>
                        <option value="">Select a branch…</option>
                        {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                      </select>
                      {branchesError && <div role="alert" style={{ color: T.danger, fontSize: 11, marginTop: 5 }}>{branchesError} <button type="button" onClick={loadBranches} style={{ border: 0, background: 'none', color: T.primary, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button></div>}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelS}>Coffin price (KES) *</label>
                      <input type="number" min="0.01" step="0.01" value={dispatchForm.inventoryPrice} onChange={setDF('inventoryPrice')} style={inputS} placeholder="Only needed when this variant is new to the branch" />
                      <small style={{ display: 'block', marginTop: 5, color: T.textMuted }}>Existing branch variants keep their saved price; this is used for a new type/color/size.</small>
                    </div>
                    {dispatchForm.dispatchType === 'customer' && (
                      <>
                        <div>
                          <label style={labelS}>Customer name *</label>
                          <input value={dispatchForm.customerName} onChange={setDF('customerName')} style={inputS} placeholder="Customer or family name" />
                        </div>
                        <div>
                          <label style={labelS}>Customer phone</label>
                          <input value={dispatchForm.customerPhone} onChange={setDF('customerPhone')} style={inputS} placeholder="Phone number" />
                        </div>
                        <div>
                          <label style={labelS}>Deceased name</label>
                          <input value={dispatchForm.customerFor} onChange={setDF('customerFor')} style={inputS} placeholder="Optional" />
                        </div>
                        <div>
                          <label style={labelS}>Service date *</label>
                          <input type="date" value={dispatchForm.serviceDate} onChange={setDF('serviceDate')} style={inputS} />
                        </div>
                        <div>
                          <label style={labelS}>Service time</label>
                          <input type="time" value={dispatchForm.serviceTime} onChange={setDF('serviceTime')} style={inputS} />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={labelS}>From</label>
                      <input value={dispatchForm.from} onChange={setDF('from')} style={inputS} placeholder="Origin / From location" />
                    </div>
                    <div><label style={labelS}>Received by</label><input value={dispatchForm.receivedBy} onChange={setDF('receivedBy')} style={inputS} placeholder="Receiving person" /></div>
                    <div>
                      <label style={labelS}>Date Dispatched</label>
                      <input type="date" value={dispatchForm.date} onChange={setDF('date')} style={inputS} />
                    </div>
                    <div>
                      <label style={labelS}>Time</label>
                      <input type="time" value={dispatchForm.time} onChange={setDF('time')} style={inputS} />
                    </div>
                    <div>
                      <label style={labelS}>Dispatched By</label>
                      <input list="store-pickers" placeholder="Name of person dispatching" value={dispatchForm.dispatchedBy} onChange={setDF('dispatchedBy')} style={inputS} />
                      <datalist id="store-pickers">{workers.map(w => <option key={w.id} value={w.name} />)}</datalist>
                    </div>
                    <div>
                      <label style={labelS}>Driver</label>
                      <select
                        value={dispatchForm.driverId}
                        onChange={(e) => {
                          const picked = drivers.find(d => d.id === e.target.value);
                          setDispatchForm(f => ({ ...f, driverId: e.target.value, driver: picked ? picked.name : '' }));
                        }}
                        style={inputS}
                        disabled={driversLoading || drivers.length === 0}
                      >
                        <option value="">
                          {driversLoading ? 'Loading drivers…' : drivers.length ? 'Select a driver…' : 'No drivers available'}
                        </option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {driversError && (
                        <div role="alert" style={{ color: T.danger, fontSize: 12, marginTop: 5 }}>
                          {driversError}{drivers.length === 0 && (
                            <button type="button" onClick={loadDrivers} disabled={driversLoading} style={{ marginLeft: 8, color: T.primary, background: 'none', border: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                              {driversLoading ? 'Loading…' : 'Retry'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelS}>Purpose</label>
                      <input value={dispatchForm.purpose} onChange={setDF('purpose')} style={inputS} placeholder="Purpose of dispatch" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelS}>Remarks</label>
                      <textarea value={dispatchForm.remarks} onChange={setDF('remarks')} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} placeholder="Additional notes" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button onClick={() => setDispatchStep(1)} style={primaryBtn(T.bg, T.textSec)}><i className="fas fa-arrow-left" style={{ fontSize: 11, marginRight: 6 }} />Back</button>
                    <button onClick={submitAviationDispatch} disabled={loading || driversLoading || drivers.length === 0 || !dispatchForm.driverId} style={{ ...primaryBtn(T.danger, '#fff'), opacity: loading || driversLoading || drivers.length === 0 || !dispatchForm.driverId ? 0.5 : 1, cursor: loading || driversLoading || drivers.length === 0 || !dispatchForm.driverId ? 'not-allowed' : 'pointer' }}>
                      <i className="fas fa-truck-fast" style={{ fontSize: 12 }} /> {loading ? 'Dispatching...' : 'Confirm & Dispatch'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderDispatchModal() {

    const item = modal.item;

    const max = effQty(item);

    return (

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>

        <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><i className="fas fa-truck" style={{ color: T.danger, marginRight: 8 }} />Dispatch from Store</div>

            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>

          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ background: T.dangerBg, border: `1px solid ${T.danger}30`, borderRadius: 10, padding: 12 }}>

              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{item.name}</div>

              <div style={{ fontSize: 11, color: T.textSec }}>{item.sub} · Available: {max} {item.unit}</div>

            </div>

            <div>

              <label style={labelS}>Quantity to Dispatch</label>

              <input type="number" min={1} max={max} value={form.qty} onChange={setF('qty')} style={inputS} />

            </div>

            <div>

              <label style={labelS}>Date Dispatched</label>

              <input type="date" value={form.date} onChange={setF('date')} style={inputS} />

            </div>

            <div>

              <label style={labelS}>Picked By</label>

              <input list="store-pickers" placeholder="Name of person picking up" value={form.pickedBy} onChange={setF('pickedBy')} style={inputS} />

              <datalist id="store-pickers">{workers.map(w => <option key={w.id} value={w.name} />)}</datalist>

            </div>

            <div>

              <label style={labelS}>Notes</label>

              <input placeholder="e.g. delivered to funeral site" value={form.notes} onChange={setF('notes')} style={inputS} />

            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>

              <button onClick={() => setModal(null)} style={primaryBtn(T.bg, T.textSec)}>Cancel</button>

              <button onClick={handleDispatch} disabled={max === 0} style={{ ...primaryBtn(T.danger, '#fff'), opacity: max === 0 ? 0.5 : 1, cursor: max === 0 ? 'not-allowed' : 'pointer' }}>

                <i className="fas fa-truck" style={{ fontSize: 11 }} /> Dispatch {form.qty || 0} × {item.name}

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }



  function renderRestockModal() {

    const item = modal.item;

    return (

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>

        <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><i className="fas fa-box-open" style={{ color: T.success, marginRight: 8 }} />Add to Store</div>

            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMuted, cursor: 'pointer', lineHeight: 1 }}>×</button>

          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ background: T.successBg, border: `1px solid ${T.success}30`, borderRadius: 10, padding: 12 }}>

              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{item.name}</div>

              <div style={{ fontSize: 11, color: T.textSec }}>{item.sub} · Currently: {effQty(item)} {item.unit}</div>

            </div>

            <div>

              <label style={labelS}>Quantity to Add</label>

              <input type="number" min={1} value={form.qty} onChange={setF('qty')} style={inputS} />

            </div>

            <div>

              <label style={labelS}>Date Received</label>

              <input type="date" value={form.date} onChange={setF('date')} style={inputS} />

            </div>

            <div>

              <label style={labelS}>Received By</label>

              <input list="store-pickers" placeholder="Who received the stock" value={form.pickedBy} onChange={setF('pickedBy')} style={inputS} />

              <datalist id="store-pickers">{workers.map(w => <option key={w.id} value={w.name} />)}</datalist>

            </div>

            <div>

              <label style={labelS}>Notes</label>

              <input placeholder="e.g. supplier delivery" value={form.notes} onChange={setF('notes')} style={inputS} />

            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>

              <button onClick={() => setModal(null)} style={primaryBtn(T.bg, T.textSec)}>Cancel</button>

              <button onClick={handleRestock} style={primaryBtn(T.success, '#fff')}>

                <i className="fas fa-plus" style={{ fontSize: 11 }} /> Add {form.qty || 0} × {item.name}

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }

};



export default StoreTab;
