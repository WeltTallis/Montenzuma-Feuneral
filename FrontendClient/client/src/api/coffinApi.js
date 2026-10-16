import axios from 'axios';
import env from '../utils/config/env';
import { getAuthToken, getTenantSlug } from '../utils/globalAuth';

/**
 * Coffin service API client.
 * Cross-branch coffin inventory tracking for the dashboard.
 * Responses from `services/coffin-service` are wrapped as:
 *   { success: true, data: ..., message?: string }
 */
const coffinApi = axios.create({
  baseURL: env.COFFIN_SERVICE_API || env.FULL_API_URL + '/coffin',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

coffinApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const slug = getTenantSlug();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (slug) config.headers['x-tenant-slug'] = slug;
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
    unwrap(coffinApi.get('/all-branches', { params: { parent_slug: parentSlug } })),

  /** Single coffin detail (GET /coffins/:id) */
  getById: (id) => unwrap(coffinApi.get(`/${id}`)),

  /** All coffin bookings/orders for movement analysis (GET /coffins/orders)
   *  Supports query params: search, from, to, today, branch_id, parent_slug */
  getOrders: (params = {}) =>
    unwrap(coffinApi.get('/orders', { params })),

  /** Create a coffin reservation/order with amount and deposit support
   *  POST /coffins/orders */
  createOrder: (orderData) =>
    unwrap(coffinApi.post('/orders', orderData)),

  /** Update order status / paid / amount / deposit
   *  PATCH /coffins/orders/:id/status */
  updateOrderStatus: (id, { status, paid, amount, deposit }) =>
    unwrap(coffinApi.patch(`/orders/${id}/status`, { status, paid, amount, deposit })),

  /** Get today's coffin bookings (GET /coffins/orders?today=1) */
  getTodayBookings: (params = {}) =>
    unwrap(coffinApi.get('/orders', { params: { ...params, today: '1' } })),
};

export default coffinApi;
