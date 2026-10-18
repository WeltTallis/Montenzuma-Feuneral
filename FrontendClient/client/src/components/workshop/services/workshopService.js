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

    // Statuses that represent a finished job.
    //
    // NO LONGER USED TO FILTER THE BOARD. The live board used to send this list
    // to the server as `exclude_status`, which meant the browser decided what
    // counted as finished — and a cached bundle missing 'store' let every
    // completed coffin back onto the workers' board. getActiveOrders() now sends
    // `active_only=1` and the server applies its own list.
    //
    // Kept as documentation of the domain only. The authoritative list is
    // FINISHED_ORDER_STATUSES in services/workshop-service/controllers/
    // coffinOrderController.ts, which the analytics share.
    FINISHED_ORDER_STATUSES: ['completed', 'delivered', 'store', 'dispatched', 'collected', 'cancelled'],

    getActiveOrders: () =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.ORDERS, {
            params: { active_only: 1 },
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

    // --- Monthly output target ---
    // How many coffins the workshop aims to finish each month, plus what it
    // actually finished. The server counts the actuals with the same finished-
    // status and credit-date rules as the worker report, so these two numbers
    // can never disagree on the same screen.
    getMonthlyTargets: (params = {}) =>
        handleResponse(workshopApi.get(ENDPOINTS.WORKSHOP.STORE_TARGETS, { params })),

    // `workerId` (optional) scopes the target to ONE worker; omit it for the
    // workshop-wide number. Both are stored server-side and returned together by
    // getMonthlyTargets (months[] for the workshop, workerTargets[] per worker).
    setMonthlyTarget: (month, target, workerId = null) =>
        handleResponse(workshopApi.put(ENDPOINTS.WORKSHOP.STORE_TARGETS, { month, target, worker_id: workerId })),

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

    updateDispatchTarget: (id, data) =>
        handleResponse(workshopApi.patch(`/workshop/store/dispatch/${id}/target`, data)),

    // Driver pickups — store dispatches that were assigned to a driver.
    // `identity` is `{ driver_id }` or `{ driver_name }`; the endpoint refuses
    // to list anything without one so a tenant's whole dispatch history is
    // never handed to an unidentified caller.
    getDriverPickups: (identity = {}, params = {}) =>
        handleResponse(workshopApi.get('/workshop/store/pickups', {
            params: { ...identity, ...params },
        })),

    // status: 'accepted' | 'declined'
    respondToPickup: (id, status) =>
        handleResponse(workshopApi.patch(`/workshop/store/pickups/${id}`, { status })),

    restockStoreItem: (data) =>
        handleResponse(workshopApi.post('/workshop/store/restock', data)),
};

export default workshopService;