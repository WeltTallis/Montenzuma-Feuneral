import { workshopApi } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

// ============================================================
// WORKSHOP API SERVICE - All backend calls centralized here
// ============================================================

const handleResponse = async (apiCall) => {
    try {
        const res = await apiCall;
        return { data: res?.data?.data || res?.data || [], success: true };
    } catch (error) {
        console.error('[WorkshopService] API Error:', error?.response?.data || error.message);
        return {
            data: null,
            success: false,
            error: error?.response?.data?.message || error.message || 'Request failed',
            status: error?.response?.status
        };
    }
};

// ============ ORDERS ============
export const workshopService = {
    // --- Orders ---
    // `params.exclude_status` (comma separated) is pushed down to MySQL via
    // GET /workshop/orders?exclude_status=... so the live board stops pulling
    // the whole finished history on every refresh.
    getOrders: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDERS, { params })),

    // Statuses that represent a finished job. Kept in one place because both the
    // live board (exclude them) and the production analytics (only count them)
    // need the exact same list.
    FINISHED_ORDER_STATUSES: ['completed', 'delivered', 'dispatched', 'collected', 'cancelled'],

    /** Orders still on the floor — what the workshop tab actually renders. */
    getActiveOrders: () =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDERS, {
            params: { exclude_status: workshopService.FINISHED_ORDER_STATUSES.join(',') },
        })),

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

    // --- Materials ---
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

    // --- Workers ---
    getWorkers: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.WORKERS, { params })),

    createWorker: (data) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.WORKERS, data)),

    updateWorker: (id, data) =>
        handleResponse(workshopApi.patch(`/workshop/workers/${id}`, data)),

    deleteWorker: (id) =>
        handleResponse(workshopApi.delete(`/workshop/workers/${id}`)),

    // --- Production Stages ---
    getStages: (orderId) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.STAGES(orderId))),

    updateStage: (orderId, stageId, data) =>
        handleResponse(workshopApi.patch(`/workshop/orders/${orderId}/stages/${stageId}`, data)),

    assignWorker: (orderId, data) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.ASSIGN_WORKER(orderId), data)),

    completeStage: (orderId, stageId) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.PRODUCTION.COMPLETE_STAGE(orderId, stageId))),

    // --- Production Workflow ---
    assignWorkerToOrder: (orderId, data) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.PRODUCTION.ASSIGN_WORKER(orderId), data)),

    recordMaterialUsage: (orderId, data) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.PRODUCTION.USE_MATERIAL(orderId), data)),

    // --- Reports ---
    getDailyReport: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.DAILY, { params })),

    getWeeklyReport: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.WEEKLY, { params })),

    getProductionReport: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.PRODUCTION, { params })),

    getInventoryReport: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.INVENTORY, { params })),

    // Per-worker, per-month production. This is the source of truth for "how many
    // has each worker produced" — it is computed in SQL over FINISHED orders,
    // which the live board no longer downloads (see getActiveOrders).
    getWorkerProduction: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.REPORTS.WORKER_PRODUCTION, { params })),

    // --- Work Orders & PDF ---
    getWorkOrderPDF: (id) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.WORK_ORDER.PDF(id), {
            responseType: 'blob'
        })),

    // --- Analytics ---
    getMonthlyAnalytics: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ANALYTICS.MONTHLY, { params })),

    // --- Design ---
    saveDesign: (id, data) =>
        handleResponse(workshopApi.post(ENDPOINTS.WORKSHOP.DESIGN.SAVE(id), data)),

    getDesign: (id) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.DESIGN.GET(id))),

    // --- Store Management ---
    getStoreInventory: (params = {}) =>
        handleResponse(workshopApi.get('/workshop/store/inventory', { params })),

    getStoreHistory: (params = {}) =>
        handleResponse(workshopApi.get('/workshop/store/history', { params })),

    dispatchStoreItem: (data) =>
        handleResponse(workshopApi.post('/workshop/store/dispatch', data)),

    restockStoreItem: (data) =>
        handleResponse(workshopApi.post('/workshop/store/restock', data)),
};

export default workshopService;