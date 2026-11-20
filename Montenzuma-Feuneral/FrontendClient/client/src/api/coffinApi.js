import axios from 'axios';
import env from '../utils/config/env';
import { getAuthToken, getTenantId, getTenantSlug, getBranchId } from '../utils/globalAuth';

/**
 * Coffin service API client.
 * Cross-branch coffin inventory tracking for the dashboard.
 * Responses from `services/coffin-service` are wrapped as:
 *   { success: true, data: ..., message?: string }
 */
const coffinApi = axios.create({
  baseURL: env.COFFIN_SERVICE_API || env.FULL_API_URL + '/coffins',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

coffinApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const slug = getTenantSlug();
    const tenantId = getTenantId();
    const branchId = getBranchId();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (slug) config.headers['x-tenant-slug'] = slug;
    if (tenantId && !config.headers['x-tenant-id']) config.headers['x-tenant-id'] = String(tenantId);
    if (branchId && !config.headers['x-branch-id']) config.headers['x-branch-id'] = String(branchId);
    return config;
  },
  (error) => Promise.reject(error)
);

coffinApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const isNet = !err.response;
    err.friendlyMessage = isNet
      ? 'Coffin service is unreachable. Cross-branch inventory may be stale.'
      : (err.response?.data?.message || err.message || 'Coffin service error');
    return Promise.reject(err);
  }
);

const unwrap = (p) => p.then((res) => res.data);

export const CoffinAPI = {
  /** All coffins across every branch for the parent org (GET /coffins/all-branches?parent_slug=...) */
  getAllBranches: (parentSlug) =>
    unwrap(coffinApi.get('/all-branches', {
      params: { parent_slug: parentSlug, tenant_id: getTenantId() || undefined },
    })),

  /** Single coffin detail (GET /coffins/:id) */
  getById: (id) => unwrap(coffinApi.get(`/${id}`)),

  /** All coffin bookings/orders for movement analysis (GET /coffins/orders)
   *  Supports query params: search, from, to, today, branch_id, parent_slug */
  getOrders: (params = {}) =>
    unwrap(coffinApi.get('/orders', { params })),

  /** Create a coffin reservation/order with amount and deposit support
   *  POST /coffins/orders */
  createOrder: (orderData, branchId) =>
    unwrap(coffinApi.post('/orders', {
      ...orderData,
      ...(branchId ? { branch_id: String(branchId) } : {}),
    }, branchId ? { headers: { 'x-branch-id': String(branchId) } } : undefined)),

  /** Register a finished workshop dispatch in a branch's coffin inventory. */
  registerInventory: (inventoryData, branchId) =>
    unwrap(coffinApi.post('/', {
      ...inventoryData,
      branch_id: String(branchId),
    }, { headers: { 'x-branch-id': String(branchId) } })),

  /** Update a branch inventory variant, including quantity adjustments. */
  updateInventory: (coffinId, inventoryData, branchId) =>
    unwrap(coffinApi.put(`/${coffinId}`, {
      ...inventoryData,
    }, { headers: { 'x-branch-id': String(branchId) } })),

  /** Update order status / paid / amount / deposit
   *  PATCH /coffins/orders/:id/status */
  updateOrderStatus: (id, { status, paid, amount, deposit }) =>
    unwrap(coffinApi.patch(`/orders/${id}/status`, { status, paid, amount, deposit })),

  /** Get today's coffin bookings (GET /coffins/orders?today=1) */
  getTodayBookings: (params = {}) =>
    unwrap(coffinApi.get('/orders', { params: { ...params, today: '1' } })),
};

export default coffinApi;
