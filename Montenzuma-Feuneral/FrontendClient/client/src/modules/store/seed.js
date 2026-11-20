export const STORE_CATEGORIES = [
  'Snacks',
  'Beverages',
  'Dairy & Chilled',
  'Bakery',
  'Frozen',
  'Groceries',
  'Household',
  'Toiletries',
  'Cleaning Supplies',
  'Other',
];

export const STORE_UNITS = [
  'pcs',
  'packs',
  'cartons',
  'crates',
  'bottles',
  'bags',
  'boxes',
  'cans',
  'jars',
  'tubs',
  'liters',
  'kg',
  'dozens',
  'pairs',
  'units',
];

export const PICK_REASONS = [
  'Sold - Counter',
  'Sold - Online',
  'Sold - Takeaway',
  'Damaged / Expired',
  'Transfer to Branch',
  'Staff Meal',
  'Promo Giveaway',
  'Other',
];

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

const pad = (value) => String(value).padStart(2, '0');

export const dateKey = (iso) => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const sameDay = (iso) => dateKey(iso) === todayKey();

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const monthName = (year, month) => `${MONTH_NAMES[month]} ${year}`;
