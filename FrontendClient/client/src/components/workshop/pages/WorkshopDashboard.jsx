import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useSocket } from '../../../utils/context/socketContext';
import { workshopService } from '../services/workshopService';

import WorkshopTabs from './WorkshopTabs';
import DashboardTab from './DashboardTab';
import OrdersTab from './OrdersTab';
import WorkersTab from './WorkersTab';
import MaterialsTab from './MaterialsTab';
import StoreTab from './StoreTab';
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
    name: o.coffin_name || o.deceased_name || 'Unnamed',
    type: o.coffin_type || 'Standard',
    size: o.size || 'Standard',
    color: o.color || 'Natural',
    status: o.status || 'pending',
    stageIndex: stageIdx,
    priority: o.priority || 'normal',
    assignedTo: o.assigned_to,
    assignedToName: o.assigned_to_name,
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

// ─── Design Tokens ───────────────────────────────────────────────────
const S = {
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  bg: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  shadowLg: '0 10px 25px rgba(0, 0, 0, 0.05)',
  shadowXl: '0 20px 40px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease',
};

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
// ============================================
// FIXED: Socket.io Event Handlers with Error Handling
// ============================================
useEffect(() => {
  if (!socket) {
    console.warn('Socket not available - events not registered');
    return;
  }

  // Check if socket is connected
  if (!socket.connected) {
    console.warn('Socket not connected - events may not work');
  }

  // Event handlers with error handling
  const handlers = {
    'worker:created': () => {
      addToast('Worker created successfully', 'success');
      loadData();
    },
    'worker:deleted': () => {
      addToast('Worker removed successfully', 'info');
      loadData();
    },
    'order:created': () => {
      addToast('New order created', 'success');
      loadData();
    },
    'order:deleted': () => {
      addToast('Order deleted', 'info');
      loadData();
    },
    'order:status:changed': (data) => {
      addToast(`Order status updated to: ${data?.status || 'new status'}`, 'success');
      loadData();
    },
    'production:stage:updated': (data) => {
      loadData();
    },
    'production:stage:done': (data) => {
      addToast(`Stage ${data?.stage || ''} completed`, 'success');
      loadData();
    },
    'material:used': (data) => {
      addToast(`Material ${data?.material || ''} used`, 'info');
      loadData();
    },
    // Error handler for socket events
    'error': (error) => {
      console.error('Socket error:', error);
      addToast(`Socket error: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  // Register all event listeners
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });

  // Cleanup function
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.off(event, handler);
    });
  };
}, [socket, addToast, loadData]);

// ============================================
// Create Order Function
// ============================================
  const createOrder = async (orderData) => {
    try {
      if (!orderData.coffin_name) {
        addToast('Coffin name is required', 'error');
        return;
      }
      const result = await workshopService.createOrder(orderData);
      if (!result || !result.success) {
        const msg = result?.error || result?.status || 'Failed to create order';
        addToast('Failed to create order: ' + msg, 'error');
        return;
      }
      addToast('Order created successfully', 'success'); setModal(null); loadData(); }
    catch (err) { addToast('Failed to create order: ' + (err.message || 'Unknown error'), 'error'); }
  };

// FIXED: Optional - Add Socket Connection Status
// ============================================
useEffect(() => {
  if (!socket) return;

  // Handle connection status
  const onConnect = () => {
    console.log('Socket connected - real-time updates active');
    addToast('Connected to real-time updates', 'info');
  };

  const onDisconnect = () => {
    console.warn('Socket disconnected - real-time updates paused');
    addToast('Disconnected from real-time updates', 'warning');
  };

  const onConnectError = (error) => {
    console.error('Socket connection error:', error);
    addToast('Real-time updates unavailable', 'warning');
  };

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onConnectError);

  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('connect_error', onConnectError);
  };
}, [socket, addToast]);

// ============================================
// OPTIONAL: Add a check if socket is connected before sending
// ============================================
const emitSocketEvent = useCallback((event, data) => {
  if (!socket) {
    console.warn('Socket not available');
    return false;
  }
  if (!socket.connected) {
    console.warn('Socket not connected');
    return false;
  }
  
  socket.emit(event, data);
  
  return true;
}, [socket]);

  const updateOrderStatus = async (orderId, status) => {
    const result = await workshopService.updateOrderStatus(orderId, status);
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

  const assignWorker = async (orderId, workerId) => {
    try {
      await workshopService.assignWorkerToOrder(orderId, { user_id: workerId });
      addToast('Worker assigned', 'success');
      await loadData();
    } catch (err) {
      addToast('Failed to assign worker: ' + err.message, 'error');
    }
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
    assignWorker,
  }), [orders, workers, materials, reports, loading, error, connected, toasts, modal, tab, createOrder, updateOrderStatus, createWorker, deleteWorker, addMaterial, deleteOrder, loadData, assignWorker]);

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading && !orders.length) {
    return (
      <div style={{
        minHeight: '100vh',
        background: S.bg,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        fontFamily: S.font,
        color: S.textMuted,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 48,
          height: 48,
          border: `4px solid ${S.border}`,
          borderTopColor: S.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>
          Loading workshop data...
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (error && !orders.length) {
    return (
      <div style={{
        minHeight: '100vh',
        background: S.bg,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        fontFamily: S.font,
      }}>
        <div style={{
          textAlign: 'center',
          padding: 40,
          background: '#fff',
          borderRadius: 16,
          border: `1px solid ${S.dangerLight}`,
          boxShadow: S.shadowLg,
          maxWidth: 420,
        }}>
          <div style={{
            width: 56,
            height: 56,
            background: S.dangerLight,
            color: S.danger,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.text, marginBottom: 8 }}>
            Connection Error
          </div>
          <div style={{ fontSize: 14, color: S.textMuted, marginBottom: 24, lineHeight: 1.5 }}>
            {error}
          </div>
          <button 
            onClick={loadData} 
            style={{
              background: S.primary,
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              transition: S.transition,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = S.primaryDark}
            onMouseLeave={e => e.currentTarget.style.background = S.primary}
          >
            <i className="fas fa-redo" style={{ fontSize: 12 }} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <Ctx.Provider value={value}>
            <style>{`
        body { font-family: ${S.font}; background-color: ${S.bg}; }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{  
        minHeight: '100vh', 
        background: S.bg,
        color: S.text,
        WebkitFontSmoothing: 'antialiased'
      }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 24px 48px' }}>
          <WorkshopTabs activeTab={tab} onTabChange={setTab} />
          <div style={{ marginTop: 24 }}>
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'orders' && <OrdersTab />}
            {tab === 'workers' && <WorkersTab />}
            {tab === 'materials' && <MaterialsTab />}
            {tab === 'store' && <StoreTab />}
            {tab === 'analytics' && <AnalyticsTab />}
          </div>
        </div>
        {modal && <ModalRouter 
          type={modal} 
          onClose={() => setModal(null)}
          onSubmit={modal === 'createWorker' ? createWorker : modal === 'createMaterial' ? addMaterial : modal === 'createOrder' ? createOrder : undefined}
          workers={workers}
        />}
        <Toasts toasts={toasts} />
      </div>
    </Ctx.Provider>
  );
};

export default WorkshopDashboard;