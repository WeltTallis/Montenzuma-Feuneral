import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { StoreAPI } from '../../api/storeApi';
import { getStatus, dateKey } from './seed';

// ============================================================
// Mini Store - data layer (React hook)
//
// Source of truth = the store API. LocalStorage is used as a
// fallback so data survives page refreshes when the service
// is unreachable. Mutations optimistically update local state,
// persist to localStorage, then fire a best-effort API call.
// ============================================================

const STORAGE_KEY_ITEMS = 'miniStore_items';
const STORAGE_KEY_TX = 'miniStore_transactions';
const STORAGE_KEY_NEXT_ID = 'miniStore_nextId';
const STORAGE_KEY_NEXT_TX = 'miniStore_nextTx';

// localStorage helpers
const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable - silently ignore
  }
};

const getStoredNextId = () => {
  const val = loadFromStorage(STORAGE_KEY_NEXT_ID, 31);
  return Number(val) || 31;
};

const getStoredNextTx = () => {
  const val = loadFromStorage(STORAGE_KEY_NEXT_TX, 1);
  return Number(val) || 1;
};

let globalNextId = getStoredNextId();
let globalNextTx = getStoredNextTx();

const todayKeyLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const useStore = () => {
  // Start from the localStorage mirror so a refresh never shows empty data
  const [items, setItems] = useState(() => loadFromStorage(STORAGE_KEY_ITEMS, []));
  const [transactions, setTransactions] = useState(() => loadFromStorage(STORAGE_KEY_TX, []));
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [pendingQuick, setPendingQuick] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Persist every change so products survive refreshes. Skipped until the
  // first load completes so we never overwrite the mirror with empty state.
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEY_ITEMS, items);
    saveToStorage(STORAGE_KEY_NEXT_ID, globalNextId);
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEY_TX, transactions);
    saveToStorage(STORAGE_KEY_NEXT_TX, globalNextTx);
  }, [transactions, hydrated]);

  const loadFromService = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const itemsRes = await StoreAPI.getItems();
      const txRes = await StoreAPI.getTransactions({ perPage: 10000 });
      const apiItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const apiTx = Array.isArray(txRes?.data) ? txRes.data : [];

      // Re-attach products created while the service was unreachable so a
      // successful reload can no longer wipe them out.
      const storedItems = loadFromStorage(STORAGE_KEY_ITEMS, []);
      const storedTx = loadFromStorage(STORAGE_KEY_TX, []);

      const offlineItems = storedItems
        .filter((i) => i && i._local)
        .filter(
          (i) =>
            !apiItems.some(
              (a) =>
                Number(a.id) === Number(i.id) ||
                String(a.name || '').toLowerCase() === String(i.name || '').toLowerCase()
            )
        )
        .map((i) => ({ ...i }));

      // Move offline ids into a range that cannot clash with server ids
      let nextItemId = apiItems.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0) + 1;
      const itemIdMap = new Map();
      offlineItems.forEach((i) => {
        itemIdMap.set(i.id, nextItemId);
        i.id = nextItemId;
        nextItemId += 1;
      });

      const offlineTx = storedTx
        .filter((t) => t && t._local)
        // Skip a local "Initial stock" entry when the item already exists on the
        // service (it logs its own on create), e.g. after a 409 duplicate sync.
        .filter(
          (t) =>
            !(
              t.action === 'restocked' &&
              t.reason === 'Initial stock' &&
              apiItems.some(
                (a) => String(a.name || '').toLowerCase() === String(t.itemName || '').toLowerCase()
              )
            )
        )
        .map((t) => {
          const copy = { ...t };
          if (itemIdMap.has(copy.itemId)) copy.itemId = itemIdMap.get(copy.itemId);
          return copy;
        });

      // Remap offline transaction ids past the server ids to keep React keys unique
      let nextTxId = apiTx.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0) + 1;
      offlineTx.forEach((t) => {
        t.id = nextTxId;
        nextTxId += 1;
      });

      globalNextId = Math.max(globalNextId, nextItemId);
      globalNextTx = Math.max(globalNextTx, nextTxId);

      const mergedItems = [...apiItems, ...offlineItems];
      const mergedTx = [...apiTx, ...offlineTx].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );

      setItems(mergedItems);
      setTransactions(mergedTx);
      setConnected(true);

      // Push offline-created products to the service now that it is back.
      offlineItems.forEach((localItem) => {
        const tempId = localItem.id;
        StoreAPI.createItem({
          name: localItem.name,
          category: localItem.category,
          unit: localItem.unit,
          stock: localItem.stock,
          minStock: localItem.minStock,
          staff: 'Ahmed Mansour',
        })
          .then((saved) => {
            const serverId = saved && Number(saved.id) ? Number(saved.id) : null;
            if (!serverId) return;
            setItems((prev) =>
              prev.map((i) => (i.id === tempId ? { ...i, id: serverId, _local: false } : i))
            );
            setTransactions((prev) =>
              prev
                // the service logs its own "Initial stock" entry on create
                .filter(
                  (t) =>
                    !(
                      t.itemId === tempId &&
                      t._local &&
                      t.action === 'restocked' &&
                      t.reason === 'Initial stock'
                    )
                )
                .map((t) => (t.itemId === tempId ? { ...t, itemId: serverId } : t))
            );
          })
          .catch(() => {
            /* stays local; retried on the next successful service load */
          });
      });

      // Replay stock moves recorded for server-known items while offline, so
      // service stock converges with what the staff actually did.
      offlineTx.forEach((tx) => {
        if (tx.action !== 'used' && tx.action !== 'restocked') return;
        if (tx.reason === 'Initial stock') return;
        const owner = mergedItems.find((i) => Number(i.id) === Number(tx.itemId));
        if (!owner || owner._local) return;
        const serverItemId = Number(owner.id);
        const call =
          tx.action === 'used'
            ? StoreAPI.pickItem(serverItemId, {
              quantity: tx.quantity,
              staff: tx.staff,
              reason: tx.reason,
              notes: '',
            })
            : StoreAPI.restockItem(serverItemId, {
              quantity: tx.quantity,
              supplier: String(tx.reason || '').startsWith('Supplier: ')
                ? tx.reason.slice('Supplier: '.length)
                : '',
            });
        call
          .then((updated) => {
            const serverStock =
              updated && updated.stock !== undefined ? Number(updated.stock) : null;
            setItems((prev) =>
              prev.map((i) =>
                i.id === serverItemId && serverStock !== null ? { ...i, stock: serverStock } : i
              )
            );
            // The service now owns the record; drop the local copy
            setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
          })
          .catch(() => {
            /* stays local; retried on the next successful service load */
          });
      });
    } catch (e) {
      // API unreachable - restore from localStorage fallback
      const storedItems = loadFromStorage(STORAGE_KEY_ITEMS, []);
      const storedTx = loadFromStorage(STORAGE_KEY_TX, []);
      setItems(storedItems);
      setTransactions(storedTx);
      setConnected(false);
      setError(e.friendlyMessage || e.message || 'Mini Store service is unavailable.');

      // Recalculate next IDs from stored data
      if (storedItems.length) {
        globalNextId = Math.max(getStoredNextId(), ...storedItems.map((i) => Number(i.id) || 0)) + 1;
      } else {
        globalNextId = getStoredNextId();
      }
      if (storedTx.length) {
        globalNextTx = Math.max(getStoredNextTx(), ...storedTx.map((t) => Number(t.id) || 0)) + 1;
      } else {
        globalNextTx = getStoredNextTx();
      }
    } finally {
      setLoading(false);
      setHydrated(true);
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
    // `_local` marks products that exist only in this browser so far; it is
    // cleared as soon as the store service confirms the save.
    const newItem = {
      id: globalNextId++,
      name: payload.name,
      category: payload.category || 'Other',
      unit: payload.unit || 'pcs',
      stock: Number(payload.stock) || 0,
      minStock: Number(payload.minStock) || 0,
      _local: true,
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
      _local: true,
    };
    setTransactions((prev) => [tx, ...prev]);

    if (connected) {
      StoreAPI.createItem({ ...payload, staff: 'Ahmed Mansour' })
        .then((savedItem) => {
          const serverId = savedItem && Number(savedItem.id) ? Number(savedItem.id) : null;
          if (!serverId) return;
          // Adopt the server-assigned id so later pick/restock calls hit the service
          setItems((prev) =>
            prev.map((i) => (i.id === newItem.id ? { ...i, id: serverId, _local: false } : i))
          );
          setTransactions((prev) =>
            prev.map((t) =>
              t.itemId === newItem.id ? { ...t, itemId: serverId, _local: false } : t
            )
          );
        })
        .catch((e) =>
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
      ...(connected ? {} : { _local: true }),
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
      ...(connected ? {} : { _local: true }),
    };
    mutate(tx, connected ? StoreAPI.restockItem.bind(null, item.id, { quantity, supplier }) : null,
      `Restocked ${quantity} ${item.unit} of ${item.name}`);
  };

  const deleteItem = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (!connected) {
      // Offline removal: also drop the item's history from the local mirror
      setTransactions((prev) => prev.filter((t) => t.itemId !== itemId));
    } else {
      StoreAPI.deleteItem(item.id).catch((e) => toast.warn(`Removed locally: ${e.friendlyMessage || e.message}`));
    }
    toast(`"${item.name}" removed from the store`);
  };

  return {
    items, transactions, stats, connected, loading, error,
    view, setView, pendingQuick, setPendingQuick,
    refresh: loadFromService,
    addItem, pickItem, restockItem, deleteItem,
  };
};