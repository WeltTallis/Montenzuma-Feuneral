// Imports are intentionally minimal in this file; data helpers live here.


// ============================================================
// Mini Store - shared constants & demo seed
// Mirrors the KitchenTrack sample dataset, store-flavoured.
// ============================================================

export const STORE_CATEGORIES = [
  'Snacks', 'Beverages', 'Dairy & Chilled', 'Bakery', 'Frozen',
  'Groceries', 'Household', 'Toiletries', 'Cleaning Supplies', 'Other',
];

export const STORE_UNITS = [
  'pcs', 'packs', 'cartons', 'crates', 'bottles', 'bags', 'boxes',
  'cans', 'jars', 'tubs', 'liters', 'kg', 'dozens', 'pairs', 'units',
];

export const PICK_REASONS = [
  'Sold - Counter', 'Sold - Online', 'Sold - Takeaway',
  'Damaged / Expired', 'Transfer to Branch', 'Staff Meal',
  'Promo Giveaway', 'Other',
];

export const SEED_ITEMS = [
  { id: 1, name: 'Potato Chips (Salt & Vinegar)', category: 'Snacks', unit: 'packs', stock: 24, minStock: 10 },
  { id: 2, name: 'Potato Chips (BBQ)', category: 'Snacks', unit: 'packs', stock: 18, minStock: 10 },
  { id: 3, name: 'Milk Chocolate Bar', category: 'Snacks', unit: 'pcs', stock: 60, minStock: 30 },
  { id: 4, name: 'Dark Chocolate Bar 70%', category: 'Snacks', unit: 'pcs', stock: 35, minStock: 20 },
  { id: 5, name: 'Roasted Peanuts (200g)', category: 'Snacks', unit: 'bags', stock: 15, minStock: 8 },
  { id: 6, name: 'Caramel Popcorn (250g)', category: 'Snacks', unit: 'bags', stock: 0, minStock: 6 },
  { id: 7, name: 'Bottled Water (500ml)', category: 'Beverages', unit: 'bottles', stock: 48, minStock: 24 },
  { id: 8, name: 'Sparkling Water (500ml)', category: 'Beverages', unit: 'bottles', stock: 12, minStock: 12 },
  { id: 9, name: 'Orange Juice (1L)', category: 'Beverages', unit: 'bottles', stock: 9, minStock: 10 },
  { id: 10, name: 'Cola (330ml Can)', category: 'Beverages', unit: 'cans', stock: 72, minStock: 24 },
  { id: 11, name: 'Lemonade (1L)', category: 'Beverages', unit: 'bottles', stock: 20, minStock: 10 },
  { id: 12, name: 'Tea Bags (100 Pack)', category: 'Groceries', unit: 'packs', stock: 14, minStock: 8 },
  { id: 13, name: 'Instant Coffee (200g)', category: 'Groceries', unit: 'jars', stock: 10, minStock: 5 },
  { id: 14, name: 'White Sugar (1kg)', category: 'Groceries', unit: 'bags', stock: 30, minStock: 15 },
  { id: 15, name: 'Cooking Oil (2L)', category: 'Groceries', unit: 'bottles', stock: 8, minStock: 8 },
  { id: 16, name: 'Pasta (500g)', category: 'Groceries', unit: 'packs', stock: 40, minStock: 15 },
  { id: 17, name: 'Long-Grain Rice (2kg)', category: 'Groceries', unit: 'bags', stock: 25, minStock: 12 },
  { id: 18, name: 'Table Salt (1kg)', category: 'Groceries', unit: 'packs', stock: 18, minStock: 8 },
  { id: 19, name: 'Fresh Milk (1L)', category: 'Dairy & Chilled', unit: 'bottles', stock: 22, minStock: 12 },
  { id: 20, name: 'Plain Yogurt (500ml)', category: 'Dairy & Chilled', unit: 'cups', stock: 14, minStock: 8 },
  { id: 21, name: 'Butter (250g)', category: 'Dairy & Chilled', unit: 'packs', stock: 0, minStock: 6 },
  { id: 22, name: 'Mozzarella Slices (200g)', category: 'Dairy & Chilled', unit: 'packs', stock: 12, minStock: 6 },
  { id: 23, name: 'Frozen French Fries (1kg)', category: 'Frozen', unit: 'bags', stock: 10, minStock: 6 },
  { id: 24, name: 'Vanilla Ice Cream (1L)', category: 'Frozen', unit: 'tubs', stock: 9, minStock: 5 },
  { id: 25, name: 'Paper Towels (6 Rolls)', category: 'Household', unit: 'packs', stock: 16, minStock: 8 },
  { id: 26, name: 'Tissue Boxes (12 pack)', category: 'Household', unit: 'boxes', stock: 30, minStock: 12 },
  { id: 27, name: 'Dishwashing Liquid (1L)', category: 'Cleaning Supplies', unit: 'bottles', stock: 7, minStock: 6 },
  { id: 28, name: 'All-Purpose Cleaner (500ml)', category: 'Cleaning Supplies', unit: 'bottles', stock: 5, minStock: 4 },
  { id: 29, name: 'Toothpaste (100ml)', category: 'Toiletries', unit: 'tubes', stock: 25, minStock: 12 },
  { id: 30, name: 'Bar Soap (4 pcs)', category: 'Toiletries', unit: 'bars', stock: 40, minStock: 15 },
];

const SAMPLE_ACTIONS = [
  { itemId: 7, action: 'used', qty: 6, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 0, hoursAgo: 1 },
  { itemId: 23, action: 'used', qty: 2, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 0, hoursAgo: 2 },
  { itemId: 20, action: 'used', qty: 1, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 0, hoursAgo: 1 },
  { itemId: 3, action: 'used', qty: 8, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 0, hoursAgo: 3 },
  { itemId: 19, action: 'used', qty: 3, staff: 'Layla Ibrahim', reason: 'Sold - Online', daysAgo: 0, hoursAgo: 4 },
  { itemId: 14, action: 'used', qty: 2, staff: 'Youssef Nader', reason: 'Staff Meal', daysAgo: 0, hoursAgo: 5 },
  { itemId: 27, action: 'used', qty: 1, staff: 'Fatima Al-Rashid', reason: 'Damaged / Expired', daysAgo: 0, hoursAgo: 6 },
  { itemId: 1, action: 'used', qty: 3, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 1, hoursAgo: 2 },
  { itemId: 12, action: 'used', qty: 1, staff: 'Omar Hassan', reason: 'Sold - Online', daysAgo: 1, hoursAgo: 3 },
  { itemId: 23, action: 'used', qty: 1, staff: 'Sara Khalil', reason: 'Staff Meal', daysAgo: 1, hoursAgo: 4 },
  { itemId: 22, action: 'used', qty: 2, staff: 'Layla Ibrahim', reason: 'Sold - Counter', daysAgo: 1, hoursAgo: 5 },
  { itemId: 5, action: 'used', qty: 2, staff: 'Omar Hassan', reason: 'Promo Giveaway', daysAgo: 1, hoursAgo: 6 },
  { itemId: 10, action: 'used', qty: 12, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 2, hoursAgo: 1 },
  { itemId: 19, action: 'used', qty: 5, staff: 'Youssef Nader', reason: 'Sold - Takeaway', daysAgo: 2, hoursAgo: 3 },
  { itemId: 7, action: 'used', qty: 4, staff: 'Omar Hassan', reason: 'Sold - Online', daysAgo: 2, hoursAgo: 4 },
  { itemId: 8, action: 'used', qty: 2, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 2, hoursAgo: 2 },
  { itemId: 1, action: 'restocked', qty: 6, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 2, hoursAgo: 6 },
  { itemId: 14, action: 'used', qty: 4, staff: 'Layla Ibrahim', reason: 'Staff Meal', daysAgo: 3, hoursAgo: 4 },
  { itemId: 3, action: 'used', qty: 6, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 3, hoursAgo: 1 },
  { itemId: 10, action: 'used', qty: 18, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 3, hoursAgo: 2 },
  { itemId: 27, action: 'used', qty: 2, staff: 'Fatima Al-Rashid', reason: 'Damaged / Expired', daysAgo: 3, hoursAgo: 5 },
  { itemId: 16, action: 'used', qty: 6, staff: 'Youssef Nader', reason: 'Sold - Online', daysAgo: 4, hoursAgo: 2 },
  { id: 6, action: 'restocked', qty: 6, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 4, hoursAgo: 5 },
  { id: 20, action: 'used', qty: 3, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 4, hoursAgo: 1 },
  { id: 8, action: 'restocked', qty: 12, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 5, hoursAgo: 4 },
  { id: 18, action: 'used', qty: 2, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 5, hoursAgo: 3 },
  { id: 23, action: 'used', qty: 3, staff: 'Layla Ibrahim', reason: 'Staff Meal', daysAgo: 5, hoursAgo: 6 },
  { id: 5, action: 'used', qty: 4, staff: 'Sara Khalil', reason: 'Promo Giveaway', daysAgo: 6, hoursAgo: 2 },
  { id: 9, action: 'used', qty: 2, staff: 'Youssef Nader', reason: 'Sold - Online', daysAgo: 6, hoursAgo: 5 },
  { id: 7, action: 'used', qty: 6, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 7, hoursAgo: 1 },
  { id: 12, action: 'used', qty: 3, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 7, hoursAgo: 4 },
  { id: 10, action: 'restocked', qty: 24, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 7, hoursAgo: 6 },
  { id: 19, action: 'used', qty: 4, staff: 'Sara Khalil', reason: 'Sold - Online', daysAgo: 8, hoursAgo: 2 },
  { id: 3, action: 'used', qty: 5, staff: 'Layla Ibrahim', reason: 'Staff Meal', daysAgo: 8, hoursAgo: 5 },
  { id: 23, action: 'used', qty: 4, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 9, hoursAgo: 2 },
  { id: 20, action: 'restocked', qty: 6, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 9, hoursAgo: 5 },
  { id: 14, action: 'used', qty: 2, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 10, hoursAgo: 3 },
  { id: 27, action: 'used', qty: 1, staff: 'Fatima Al-Rashid', reason: 'Damaged / Expired', daysAgo: 11, hoursAgo: 4 },
  { id: 9, action: 'used', qty: 1, staff: 'Youssef Nader', reason: 'Staff Meal', daysAgo: 11, hoursAgo: 5 },
  { id: 28, action: 'used', qty: 1, staff: 'Omar Hassan', reason: 'Sold - Takeaway', daysAgo: 12, hoursAgo: 2 },
  { id: 15, action: 'used', qty: 2, staff: 'Sara Khalil', reason: 'Sold - Counter', daysAgo: 12, hoursAgo: 3 },
  { id: 11, action: 'restocked', qty: 12, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 12, hoursAgo: 5 },
  { id: 1, action: 'used', qty: 5, staff: 'Sara Khalil', reason: 'Sold - Takeaway', daysAgo: 13, hoursAgo: 2 },
  { id: 6, action: 'used', qty: 2, staff: 'Layla Ibrahim', reason: 'Damaged / Expired', daysAgo: 14, hoursAgo: 3 },
  { id: 21, action: 'restocked', qty: 6, staff: 'Ahmed Mansour', reason: 'Supplier Delivery', daysAgo: 15, hoursAgo: 5 },
];

export function generateSeedTransactions(seedItems) {
  const items = seedItems.map((i) => ({ ...i }));
  const transactions = [];
  let nextTxId = 1;
  const now = new Date();

  const sorted = [...SAMPLE_ACTIONS].sort(
    (a, b) => a.daysAgo - b.daysAgo || a.hoursAgo - b.hoursAgo
  );

  sorted.forEach((sa) => {
    const item = items.find((i) => i.id === sa.itemId);
    if (!item) return;
    const d = new Date(now);
    d.setDate(d.getDate() - sa.daysAgo);
    d.setHours(d.getHours() - sa.hoursAgo);

    if (sa.action === 'used') {
      item.stock = Math.max(0, item.stock - sa.qty);
    } else {
      item.stock += sa.qty;
    }

    transactions.push({
      id: nextTxId++,
      date: d.toISOString(),
      itemId: sa.itemId,
      itemName: item.name,
      action: sa.action,
      quantity: sa.qty,
      unit: item.unit,
      staff: sa.staff,
      reason: sa.reason,
      remaining: item.stock,
    });
  });

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { items, transactions, nextTxId };
}

// ============================================================
// Shared utilities (used by the React views)
// ============================================================
export function getStatus(item) {
  if (!item || Number(item.stock) === 0) return 'out';
  if (item.stock <= item.minStock) return 'low';
  return 'ok';
}

export function statusBadge(status) {
  if (status === 'out') return { label: 'Out of Stock', variant: 'danger' };
  if (status === 'low') return { label: 'Low Stock', variant: 'warning' };
  return { label: 'In Stock', variant: 'success' };
}

export function actionBadge(action) {
  if (action === 'used') return { label: 'Used', variant: 'danger', icon: 'fa-arrow-down' };
  if (action === 'restocked') return { label: 'Restocked', variant: 'success', icon: 'fa-arrow-up' };
  return { label: 'Adjusted', variant: 'info', icon: 'fa-pen' };
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const sameDay = (iso) => dateKey(iso) === todayKey();

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const monthName = (y, m) => `${MONTH_NAMES[m]} ${y}`;