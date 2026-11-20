import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { StoreAPI } from '../../api/storeApi';
import { getStatus, dateKey, todayKey } from './seed';
import { getCurrentUserName } from '../../utils/globalAuth';

const errorMessage = (error, fallback) =>
  error?.friendlyMessage || error?.response?.data?.message || error?.message || fallback;

export const useStore = () => {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [pendingQuick, setPendingQuick] = useState(null);

  const loadFromService = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [itemsRes, txRes] = await Promise.all([
        StoreAPI.getItems(),
        StoreAPI.getTransactions({ perPage: 10000 }),
      ]);
      const apiItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const apiTx = Array.isArray(txRes?.data) ? txRes.data : [];

      setItems(apiItems);
      setTransactions(
        apiTx.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
      );
      setConnected(true);
      setError('');
      return true;
    } catch (loadError) {
      const message = errorMessage(loadError, 'The store service is unavailable.');
      setConnected(false);
      setError(message);
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromService();
  }, [loadFromService]);

  const refreshAfterMutation = async () => {
    const refreshed = await loadFromService({ silent: true });
    if (!refreshed) {
      toast.warn('The change was saved, but the latest store data could not be loaded. Retry to refresh.');
    }
  };

  const reportMutationError = (mutationError, fallback) => {
    const message = errorMessage(mutationError, fallback);
    if (!mutationError?.response || mutationError.response.status >= 500) {
      setConnected(false);
      setError(message);
    }
    toast.error(message);
  };

  const requireConnection = () => {
    if (connected) return true;
    toast.error('The store service is unavailable. Reconnect before making changes; nothing is saved in this browser.');
    return false;
  };

  const stats = useMemo(() => {
    const total = items.length;
    const lowItems = items.filter((item) => getStatus(item) !== 'ok');
    const lowStock = lowItems.filter((item) => Number(item.stock) > 0).length;
    const outOfStock = lowItems.filter((item) => Number(item.stock) === 0).length;
    const usedToday = transactions.filter(
      (transaction) =>
        dateKey(transaction.date || '') === todayKey() && transaction.action === 'used',
    ).length;

    return {
      total,
      inStock: total - lowItems.length,
      lowStock,
      outOfStock,
      usedToday,
    };
  }, [items, transactions]);

  const addItem = async (payload) => {
    if (!requireConnection()) return null;
    try {
      const savedItem = await StoreAPI.createItem({
        ...payload,
        staff: getCurrentUserName(),
      });
      await refreshAfterMutation();
      toast.success(`"${savedItem.name}" added to the store`);
      return savedItem;
    } catch (mutationError) {
      reportMutationError(mutationError, 'Could not save the item.');
      return null;
    }
  };

  const pickItem = async (itemId, qty, staff, reason, notes) => {
    if (!requireConnection()) return false;
    const item = items.find((candidate) => Number(candidate.id) === Number(itemId));
    if (!item) return false;

    const quantity = Number(qty);
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity.');
      return false;
    }
    if (quantity > Number(item.stock)) {
      toast.error(`Not enough stock! Available: ${item.stock} ${item.unit}`);
      return false;
    }

    try {
      await StoreAPI.pickItem(item.id, { quantity, staff, reason, notes });
      await refreshAfterMutation();
      toast.success(`Picked ${quantity} ${item.unit} of ${item.name}`);
      return true;
    } catch (mutationError) {
      reportMutationError(mutationError, 'Could not record the stock pick.');
      return false;
    }
  };

  const restockItem = async (itemId, qty, supplier) => {
    if (!requireConnection()) return false;
    const item = items.find((candidate) => Number(candidate.id) === Number(itemId));
    if (!item) return false;

    const quantity = Number(qty);
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity.');
      return false;
    }

    try {
      await StoreAPI.restockItem(item.id, {
        quantity,
        supplier,
        staff: getCurrentUserName(),
      });
      await refreshAfterMutation();
      toast.success(`Restocked ${quantity} ${item.unit} of ${item.name}`);
      return true;
    } catch (mutationError) {
      reportMutationError(mutationError, 'Could not record the restock.');
      return false;
    }
  };

  const deleteItem = async (itemId) => {
    if (!requireConnection()) return;
    const item = items.find((candidate) => Number(candidate.id) === Number(itemId));
    if (!item) return;

    try {
      await StoreAPI.deleteItem(item.id);
      await refreshAfterMutation();
      toast(`"${item.name}" removed from the store`);
    } catch (mutationError) {
      reportMutationError(mutationError, 'Could not remove the item.');
    }
  };

  return {
    items,
    transactions,
    stats,
    connected,
    loading,
    error,
    view,
    setView,
    pendingQuick,
    setPendingQuick,
    refresh: loadFromService,
    addItem,
    pickItem,
    restockItem,
    deleteItem,
  };
};
