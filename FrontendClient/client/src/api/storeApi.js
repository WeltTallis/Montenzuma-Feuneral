import axios from 'axios';
import env from '../utils/config/env';

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
      ? 'Mini Store service is unreachable. Showing local demo data.'
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
