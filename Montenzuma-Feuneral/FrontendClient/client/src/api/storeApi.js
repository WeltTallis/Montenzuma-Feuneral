import axios from 'axios';
import env from '../utils/config/env';
import { getAuthToken, getTenantSlug, getBranchSlug, getBranchId } from '../utils/globalAuth';

/**
 * Mini Store service API client.
 *
 * Responses from `services/store-service` are wrapped as:
 *   { success: true, data: ..., message?: string }
 * These methods unwrap `data` for the UI layer so callers get the payload directly.
 */

const storeApi = axios.create({
  baseURL: env.STORE_SERVICE_API,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Every /store route runs `protect` (JWT) + `authorizeAny`, and the API gateway
// only forwards what the browser actually sends. Without an Authorization
// header the service answers 401 "Not authorized, no token provided", which the
// dashboard surfaces as "Store service unreachable" and pushes all edits into
// the offline queue — the service was up, the request just wasn't authenticated.
// Same header set the shared axios instance sends (see api/axios.js).
storeApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const slug = getTenantSlug();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (slug) config.headers['x-tenant-slug'] = slug;

    // Branch context, kept consistent with the rest of the app.
    const branchSlug = getBranchSlug();
    const branchId = getBranchId();
    const branchDbName = localStorage.getItem('branchDbName');
    if (branchSlug) config.headers['x-branch-slug'] = branchSlug;
    if (branchId) config.headers['x-branch-id'] = branchId;
    if (branchDbName && branchDbName !== 'undefined' && branchDbName !== 'null') {
      config.headers['x-branch-db'] = branchDbName;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Friendly errors + unwrap success=false payloads
storeApi.interceptors.response.use(
  (res) => {
    const wrapper = res.data;
    if (wrapper && wrapper.success === false) {
      const err = new Error(wrapper.message || 'Store service error');
      // @ts-ignore
      err.friendlyMessage = wrapper.message || 'Store service error';
      // @ts-ignore
      err.status = res.status;
      return Promise.reject(err);
    }
    return res;
  },
  (err) => {
    const isNet = !err.response;
    err.friendlyMessage = isNet
      ? 'Lichene Store service is unreachable. Inventory is not saved locally.'
      : (err.response?.data?.message || err.message || 'Store service error');
    return Promise.reject(err);
  }
);

const unwrap = (p) => p.then((res) => res.data);

export const StoreAPI = {
  health: () => unwrap(storeApi.get('/health')),

  getItems: (params) =>
    unwrap(storeApi.get('/items', { params }))
      .then((w) => ({ data: w.data, count: w.count })),

  createItem: (body) =>
    unwrap(storeApi.post('/items', body)).then((w) => w.data),

  updateItem: (id, body) =>
    unwrap(storeApi.put(`/items/${id}`, body)).then((w) => w.data),

  deleteItem: (id) =>
    unwrap(storeApi.delete(`/items/${id}`)).then((w) => w.data),

  pickItem: (id, body) =>
    unwrap(storeApi.post(`/items/${id}/pick`, body)).then((w) => w.data),

  restockItem: (id, body) =>
    unwrap(storeApi.post(`/items/${id}/restock`, body)).then((w) => w.data),

  adjustItem: (id, body) =>
    unwrap(storeApi.post(`/items/${id}/adjust`, body)).then((w) => w.data),

  getStats: () =>
    unwrap(storeApi.get('/stats')).then((w) => w.data),

  getTransactions: (params) =>
    unwrap(storeApi.get('/transactions', { params }))
      .then((w) => ({
        data: w.data,
        total: w.total,
        page: w.page,
        perPage: w.perPage,
        totalPages: w.totalPages,
      })),
};

export default storeApi;
