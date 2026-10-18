/* ============================================================================
   Workshop API Layer — all backend calls centralized here.
   Uses the existing workshopApi axios instance from ../../../api/axios.
   ============================================================================ */
import { workshopApi } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

const handleResponse = async (apiCall) => {
  try {
    const res = await apiCall;
    return { data: res?.data?.data || res?.data || [], success: true };
  } catch (error) {
    console.error('[WorkshopApi] API Error:', error?.response?.data || error.message);
    return {
      data: null,
      success: false,
      error: error?.response?.data?.message || error.message || 'Request failed',
      status: error?.response?.status,
    };
  }
};

export const workshopApiService = {
  // ============ ORDERS ============
  getOrders: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDERS, { params })),

  getActiveOrders: () =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDERS, { params: { active_only: 1 } })),

  getOrder: (id) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDER_DETAIL(id))),

  createOrder: (orderData) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.ORDERS, orderData)),

  updateOrder: (id, data) =>
    handleResponse(workshopApi.patch(ENDPOINTS.WORKSHOP.ORDER_DETAIL(id), data)),

  deleteOrder: (id) =>
    handleResponse(workshopApi.delete(ENDPOINTS.WORKSHOP.ORDER_DETAIL(id))),

  updateOrderStatus: (id, status) =>
    handleResponse(workshopApi.patch(ENDPOINTS.WORKSHOP.PRODUCTION.UPDATE_STATUS(id), { status })),

  getTodayCompleted: () =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.PRODUCTION.TODAY_COMPLETED)),

  getOrderTimeline: (id) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.PRODUCTION.TIMELINE(id))),

  // ============ MATERIALS ============
  getMaterials: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.MATERIALS, { params })),

  getMaterial: (id) =>
    handleResponse(workshopApi.get(`/workshop/materials/${id}`)),

  createMaterial: (data) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.MATERIALS, data)),

  updateMaterial: (id, data) =>
    handleResponse(workshopApi.patch(`/workshop/materials/${id}`, data)),

  deleteMaterial: (id) =>
    handleResponse(workshopApi.delete(`/workshop/materials/${id}`)),

  useMaterial: (data) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.MATERIAL_USE, data)),

  recordMaterialIntake: (data) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.MATERIAL_INTAKE, data)),

  getMaterialIntakeHistory: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.MATERIAL_INTAKE_HISTORY, { params })),

  // ============ WORKERS ============
  getWorkers: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.WORKERS, { params })),

  createWorker: (data) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.WORKERS, data)),

  updateWorker: (id, data) =>
    handleResponse(workshopApi.patch(`/workshop/workers/${id}`, data)),

  deleteWorker: (id) =>
    handleResponse(workshopApi.delete(`/workshop/workers/${id}`)),

  // ============ STORE ============
  getStoreInventory: (params = {}) =>
    handleResponse(workshopApi.get('/workshop/store/inventory', { params })),

  getStoreHistory: (params = {}) =>
    handleResponse(workshopApi.get('/workshop/store/history', { params })),

  dispatchStoreItem: (data) =>
    handleResponse(workshopApi.post('/workshop/store/dispatch', data)),

  restockStoreItem: (data) =>
    handleResponse(workshopApi.post('/workshop/store/restock', data)),

  getMonthlyTargets: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.STORE_TARGETS, { params })),

  setMonthlyTarget: (month, target, workerId = null) =>
    handleResponse(workshopApi.put(ENDPOINTS.WORKSHOP.STORE_TARGETS, { month, target, worker_id: workerId })),

  // ============ REPORTS ============
  getDailyReport: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.DAILY, { params })),

  getWeeklyReport: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.WEEKLY, { params })),

  getProductionReport: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.PRODUCTION, { params })),

  getInventoryReport: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.INVENTORY, { params })),

  getWorkerProduction: (params = {}) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.WORKER_PRODUCTION, { params })),

  // ============ DESIGN ============
  saveDesign: (id, data) =>
    handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.DESIGN.SAVE(id), data)),

  getDesign: (id) =>
    handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.DESIGN.GET(id))),
};

export default workshopApiService;