import api from './axios';
import { ENDPOINTS } from './endpoints';
import { clearDeceasedCache } from './dashboardDataApi';

export const deceasedApi = {
  // Year-only list: callers that need the whole history pass { year: 'all' };
  // without it the backend defaults to the CURRENT calendar year.
  // There is NO month filter on this endpoint — never send ?month=.
  list: (params = {}) => api.get(ENDPOINTS.DECEASED.LIST, { params }).then(r => r.data),
  create: (data) => api.post(ENDPOINTS.DECEASED.CREATE, data).then(r => { clearDeceasedCache(); return r.data; }),
  getById: (id) => api.get(ENDPOINTS.DECEASED.DETAIL(id)).then(r => r.data),
  update: (id, data) => api.put(ENDPOINTS.DECEASED.UPDATE(id), data).then(r => { clearDeceasedCache(); return r.data; }),
  delete: (id) => api.delete(ENDPOINTS.DECEASED.DELETE(id)).then(r => { clearDeceasedCache(); return r.data; }),
  search: (query) => api.get(ENDPOINTS.DECEASED.SEARCH, { params: { q: query, year: 'all' } }).then(r => r.data),
  getQR: (id) => api.get(ENDPOINTS.DECEASED.QR(id)).then(r => r.data),
  checkout: (id, data) => api.post(ENDPOINTS.DECEASED.CHECKOUT(id), data).then(r => r.data),
  getNextOfKin: (id, cfg) => api.get(ENDPOINTS.DECEASED.NEXT_OF_KIN(id), cfg).then(r => r.data),
  addNextOfKin: (id, data) => api.post(ENDPOINTS.DECEASED.NEXT_OF_KIN(id), data).then(r => r.data),
  getDocuments: (id) => api.get(ENDPOINTS.DECEASED.DOCUMENTS(id)).then(r => r.data),
};
