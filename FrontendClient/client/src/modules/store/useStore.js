import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { StoreAPI } from '../../api/storeApi';
import { getStatus, dateKey } from './seed';

// ============================================================
// Mini Store - data layer (React hook)
//
// Source of truth = local arrays (items/transactions). They start seeded from
// the local demo data and, when the store-service is reachable, are replaced by
// a live fetch. Mutations optimistically update local state then fire a
// best-effort API call to persist - keeping the UI snappy (identical behaviour
// to the KitchenTrack demo) while staying connected to the backend.
// ============================================================
let globalNextId = 31;
let globalNextTx = 1;

const todayKeyLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const useStore = () => {
        const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [pendingQuick, setPendingQuick] = useState(null);

  const loadFromService = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Connectivity is proven by the fetch itself — never seeded with dummy data.
      const itemsRes = await StoreAPI.getItems();
      const txRes = await StoreAPI.getTransactions({ perPage: 10000 });
      const apiItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const apiTx = Array.isArray(txRes?.data) ? txRes.data : [];
      setItems(apiItems);
      setTransactions(apiTx);
      setConnected(true);
      globalNextId = Math.max(0, ...apiItems.map((i) => i.id)) + 1;
      globalNextTx = Math.max(0, ...apiTx.map((t) => t.id)) + 1;
    } catch (e) {
      // No data injected here — the UI shows empty / offline states instead.
      setError(e.friendlyMessage || e.message);
      setItems([]);
      setTransactions([]);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFromService]);

  const stats = useMemo(() => {
    const total = items.length;
    const lowItems = items.filter((i) => getStatus(i) !== 'ok');
    const lowStock = lowItems.filter((i) => Number(i.stock) > 0).length;
    const outOfStock = lowItems.filter((i) => Number(i.stock) === 0).length;
    const usedToday = transactions.filter(
      (t) => dateKey(t.date || '') === todayKeyLocal() && t.action === 'used'
    ).length;
    return {
      total,
      inStock: total - lowItems.length,
      lowStock,
      outOfStock,
      usedToday,
    };
  }, [items, transactions]);

  // ---- Mutations ----
  const addItem = (payload) => {
    const newItem = {
      id: globalNextId++,
      name: payload.name,
      category: payload.category || 'Other',
      unit: payload.unit || 'pcs',
      stock: Number(payload.stock) || 0,
      minStock: Number(payload.minStock) || 0,
    };
    setItems((prev) => [...prev, newItem]);
    const tx = {
      id: globalNextTx++,
      date: new Date().toISOString(),
      itemId: newItem.id,
      itemName: newItem.name,
      action: 'restocked',
      quantity: newItem.stock,
      unit: newItem.unit,
      staff: 'Ahmed Mansour',
      reason: 'Initial stock',
      remaining: newItem.stock,
    };
        setTransactions((prev) => [tx, ...prev]);

    if (connected) {
      StoreAPI.createItem({ ...payload, staff: 'Ahmed Mansour' }).catch((e) =>
        toast.warn(`Item saved locally (service unreachable): ${e.friendlyMessage || e.message}`)
      );
    }
    return newItem;
  };

  const mutate = (tx, apiCall, okMsg) => {
    setTransactions((prev) => [tx, ...prev]);
    globalNextTx++;
    if (apiCall) apiCall.catch((e) => toast.warn(`Saved locally: ${e.friendlyMessage || e.message}`));
    toast.success(okMsg);
  };

  const pickItem = (itemId, qty, staff, reason, notes) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const quantity = Number(qty);
    if (quantity <= 0) { toast.error('Please enter a valid quantity.'); return; }
    if (quantity > Number(item.stock)) {
      toast.error(`Not enough stock! Available: ${item.stock} ${item.unit}`); return;
    }
    const newStock = Number(item.stock) - quantity;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
    );
    const tx = {
      id: globalNextTx,
      date: new Date().toISOString(),
      itemId: item.id,
      itemName: item.name,
      action: 'used',
      quantity,
      unit: item.unit,
      staff,
      reason: notes ? `${reason} - ${notes}` : reason,
      remaining: newStock,
    };
    mutate(tx, connected ? StoreAPI.pickItem.bind(null, item.id, { quantity, staff, reason, notes }) : null,
      `Picked ${quantity} ${item.unit} of ${item.name}`);
  };

  const restockItem = (itemId, qty, supplier) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const quantity = Number(qty);
    if (quantity <= 0) { toast.error('Please enter a valid quantity.'); return; }
    const newStock = Number(item.stock) + quantity;
    const reason = supplier ? `Supplier: ${supplier}` : 'Restocked';
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
    );
    const tx = {
      id: globalNextTx,
      date: new Date().toISOString(),
      itemId: item.id,
      itemName: item.name,
      action: 'restocked',
      quantity,
      unit: item.unit,
      staff: 'Ahmed Mansour',
      reason,
      remaining: newStock,
    };
    mutate(tx, connected ? StoreAPI.restockItem.bind(null, item.id, { quantity, supplier }) : null,
      `Restocked ${quantity} ${item.unit} of ${item.name}`);
  };

  const deleteItem = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (connected) StoreAPI.deleteItem(item.id).catch((e) => toast.warn(`Removed locally: ${e.friendlyMessage || e.message}`));
    toast(`"${item.name}" removed from the store`);
  };

    return {
    items, transactions, stats, connected, loading, error,
    view, setView, pendingQuick, setPendingQuick,
    refresh: loadFromService,
    addItem, pickItem, restockItem, deleteItem,
    };
};