import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useSocket } from '../../../utils/context/socketContext';
import { workshopService } from '../services/workshopService';

import WorkshopHeader from './WorkshopHeader';
import WorkshopTabs from './WorkshopTabs';
import DashboardTab from './DashboardTab';
import OrdersTab from './OrdersTab';
import WorkersTab from './WorkersTab';
import MaterialsTab from './MaterialsTab';
import AnalyticsTab from './AnalyticsTab';
import ModalRouter from './ModalRouter';
import Toasts from './Toasts';

export const Ctx = createContext(null);

const STAGES = [
  { name: 'Building', icon: 'fa-hammer', color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Waiting Bay', icon: 'fa-clock', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Painting', icon: 'fa-paint-roller', color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Interior', icon: 'fa-couch', color: '#0891B2', bg: '#ECFEFF' },
  { name: 'Store', icon: 'fa-warehouse', color: '#059669', bg: '#ECFDF5' },
];

const AVATAR_COLORS = ['#1E40AF','#7C3AED','#0891B2','#059669','#D97706','#DB2777','#EA580C','#0D9488'];

const STATUS_TO_STAGE = {
  'pending': 0, 'building': 0, 'design': 0,
  'waiting_bay': 1, 'waiting': 1, 'inspection': 1,
  'painting': 2,
  'interior': 3, 'upholstery': 3,
  'completed': 4, 'delivered': 4, 'store': 4
};

const transformWorker = (w) => ({
  id: w.user_id || w.id,
  name: w.full_name || `${w.first_name || ''} ${w.last_name || ''}`.trim() || 'Unknown',
  role: w.role || 'Worker',
  email: w.email,
  phone: w.phone,
  createdAt: w.created_at,
  color: AVATAR_COLORS[(w.user_id || w.id) % AVATAR_COLORS.length],
});

const transformOrder = (o) => {
  const statusLower = (o.status || 'pending').toLowerCase();
  const stageIdx = STATUS_TO_STAGE[statusLower] !== undefined ? STATUS_TO_STAGE[statusLower] : 0;
  return {
    id: o.order_number || `CF-${o.id}`,
    dbId: o.id,
    name: o.deceased_name || 'Unnamed',
    customer: o.customer_name,
    type: o.coffin_type || 'Standard',
    size: 'Standard',
    color: o.color || 'Natural',
    status: o.status || 'pending',
    stageIndex: stageIdx,
    priority: o.priority || 'normal',
    price: parseFloat(o.selling_price) || 0,
    cost: parseFloat(o.total_cost) || 0,
    profit: parseFloat(o.profit) || 0,
    createdAt: o.order_date ? new Date(o.order_date) : new Date(),
    updatedAt: o.updated_at ? new Date(o.updated_at) : new Date(),
    dueDate: o.due_date ? new Date(o.due_date) : null,
    branchId: o.branch_id,
    notes: o.notes,
    stages: o.stages || [],
    assignments: o.assignments || [],
    materials: o.materials_used || [],
  };
};

const transformMaterial = (m) => ({
  id: m.id,
  name: m.name,
  category: m.category,
  quantity: parseFloat(m.quantity) || 0,
  unit: m.unit || 'pcs',
  minLevel: parseFloat(m.min_stock_level) || 10,
  costPerUnit: parseFloat(m.unit_price) || 0,
  description: m.description,
  createdAt: m.created_at,
});

const WorkshopDashboard = () => {
  const { socket } = useSocket();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [reports, setReports] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, workersRes, materialsRes, reportsRes] = await Promise.all([
        workshopService.getOrders(),
        workshopService.getWorkers(),
        workshopService.getMaterials(),
        workshopService.getProductionReport().catch(() => ({ data: null })),
      ]);
      if (ordersRes.data) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data.map(transformOrder) : []);
      if (workersRes.data) setWorkers(Array.isArray(workersRes.data) ? workersRes.data.map(transformWorker) : []);
      if (materialsRes.data) setMaterials(Array.isArray(materialsRes.data) ? materialsRes.data.map(transformMaterial) : []);
      if (reportsRes.data) setReports(reportsRes.data);
      setConnected(true);
    } catch (err) {
      setError(err.message);
      addToast('Failed to load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    const handlers = {
      'worker:created': () => { addToast('Worker created', 'success'); loadData(); },
      'worker:deleted': () => { addToast('Worker removed', 'info'); loadData(); },
      'order:created': () => { addToast('Order created', 'success'); loadData(); },
      'order:deleted': () => { addToast('Order deleted', 'info'); loadData(); },
      'order:status:changed': () => { addToast('Order status updated', 'success'); loadData(); },
      'production:stage:updated': () => loadData(),
      'production:stage:done': () => { addToast('Stage completed', 'success'); loadData(); },
      'material:used': () => loadData(),
    };
    Object.entries(handlers).forEach(([event, handler]) => { socket.on(event, handler); });
    return () => { Object.entries(handlers).forEach(([event, handler]) => { socket.off(event, handler); }); };
  }, [socket, addToast, loadData]);

  const createOrder = async (orderData) => {
    try { await workshopService.createOrder(orderData); addToast('Order created successfully', 'success'); setModal(null); loadData(); }
    catch (err) { addToast('Failed to create order: ' + err.message, 'error'); }
  };

  const updateOrderStatus = async (orderId, status) => {
    const result = await workshopService.updateOrderStatus(orderId, { status });
    if (result && result.success) {
      addToast('Order status updated', 'success');
      await loadData();
      return result;
    } else {
      const errorMsg = result?.error || 'Update failed';
      addToast('Failed to update status: ' + errorMsg, 'error');
      throw new Error(errorMsg);
    }
  };

  const createWorker = async (workerData) => {
    try { await workshopService.createWorker(workerData); addToast('Worker created', 'success'); setModal(null); loadData(); }
    catch (err) { addToast('Failed to create worker: ' + err.message, 'error'); }
  };

  const deleteWorker = async (id) => {
    if (!confirm('Remove this worker?')) return;
    try { await workshopService.deleteWorker(id); addToast('Worker removed', 'info'); loadData(); }
    catch (err) { addToast('Failed to remove worker: ' + err.message, 'error'); }
  };

  const addMaterial = async (matData) => {
    try { await workshopService.createMaterial(matData); addToast('Material added', 'success'); setModal(null); loadData(); }
    catch (err) { addToast('Failed to add material: ' + err.message, 'error'); }
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return;
    try { await workshopService.deleteOrder(id); addToast('Order deleted', 'info'); loadData(); }
    catch (err) { addToast('Failed to delete order: ' + err.message, 'error'); }
  };

  const value = useMemo(() => ({
    orders, workers, materials, reports, loading, error, connected,
    toasts, modal, setModal, addToast, createOrder, updateOrderStatus,
    createWorker, deleteWorker, addMaterial, deleteOrder, loadData, tab, setTab,
  }), [orders, workers, materials, reports, loading, error, connected, toasts, modal, tab, createOrder, updateOrderStatus, createWorker, deleteWorker, addMaterial, deleteOrder, loadData]);

  if (loading && !orders.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#64748B' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: '#1E40AF', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading workshop data...</div>
        </div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#FEF2F2', borderRadius: 16, border: '1px solid #DC262630' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: 48, color: '#DC2626', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Connection Error</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>{error}</div>
          <button onClick={loadData} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <i className="fas fa-redo" style={{ fontSize: 12 }} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={value}>
      <div style={{ minHeight: '100vh', background: '#F4F6F8' }}>
        <WorkshopHeader connected={connected} onRefresh={loadData} />
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
          <WorkshopTabs activeTab={tab} onTabChange={setTab} />
          <div style={{ marginTop: 16 }}>
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'orders' && <OrdersTab />}
            {tab === 'workers' && <WorkersTab />}
            {tab === 'materials' && <MaterialsTab />}
            {tab === 'analytics' && <AnalyticsTab />}
          </div>
        </div>
        {modal && <ModalRouter 
          type={modal} 
          onClose={() => setModal(null)}
          onSubmit={modal === 'createWorker' ? createWorker : modal === 'createMaterial' ? addMaterial : modal === 'createOrder' ? createOrder : undefined}
        />}
        <Toasts toasts={toasts} />
      </div>
    </Ctx.Provider>
  );
};

export default WorkshopDashboard;
