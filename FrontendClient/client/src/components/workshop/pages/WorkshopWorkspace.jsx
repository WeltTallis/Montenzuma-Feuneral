import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocket } from '../../../utils/context/socketContext';
import { workshopService } from '../services/workshopService';
import WorkshopSidebar from '../components/WorkshopSidebar';
import OrdersTab from './OrdersTab';
import MaterialsTab from './MaterialsTab';
import ModalRouter from './ModalRouter';
import StoreTab from './StoreTab';
import Toasts from './Toasts';
import { Ctx } from './WorkshopContext';

const STAGES = [
  { name: 'Building', color: '#2563eb', bg: '#eff6ff', statuses: ['building', 'pending', 'design'] },
  { name: 'Waiting Bay', color: '#d97706', bg: '#fffbeb', statuses: ['waiting_bay', 'waiting', 'inspection'] },
  { name: 'Painting', color: '#7c3aed', bg: '#f5f3ff', statuses: ['painting'] },
  { name: 'Interior', color: '#0891b2', bg: '#ecfeff', statuses: ['interior', 'upholstery'] },
  { name: 'Store', color: '#059669', bg: '#ecfdf5', statuses: ['store', 'completed', 'delivered'] },
];

const VIEW_COPY = {
  dashboard: ['WORKSHOP', 'Your workshop at a glance'],
  orders: ['WORKSHOP', 'All coffin orders'],
  floor: ['PRODUCTION', 'Production floor'],
  store: ['INVENTORY', 'Store'],
  materials: ['INVENTORY', 'Materials stock'],
  deliveries: ['LOGISTICS', 'Deliveries & dispatch'],
  reports: ['INSIGHTS', 'Workshop reports'],
  settings: ['CONFIGURATION', 'Workshop settings'],
};

const toOrder = (order) => {
  const status = String(order.status || 'pending').toLowerCase().replace(/[\s-]+/g, '_');
  const stageIndex = STAGES.findIndex((stage) => stage.statuses.includes(status));
  return {
    ...order,
    id: order.order_number || `CF-${order.id}`,
    dbId: order.id,
    name: order.coffin_name || 'Unnamed coffin',
    client: order.client_name || order.client || order.customer_name || '',
    type: order.coffin_type || 'Standard',
    size: order.size || 'Standard',
    color: order.color || 'Natural',
    status,
    stageIndex: stageIndex < 0 ? 0 : stageIndex,
    priority: order.priority || 'normal',
    assignedTo: order.assigned_to || order.assigned_worker_id,
    assignedToName: order.assigned_to_name || order.worker_name,
    createdAt: order.order_date ? new Date(order.order_date) : new Date(),
    dueDate: order.due_date ? new Date(order.due_date) : null,
  };
};

const toWorker = (worker) => ({
  id: worker.user_id || worker.id,
  name: worker.full_name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.username || 'Workshop worker',
  role: worker.role || 'Worker',
  email: worker.email,
  phone: worker.phone,
});

const toMaterial = (material) => ({
  ...material,
  id: material.id,
  name: material.name,
  category: material.category,
  quantity: Number.parseFloat(material.quantity) || 0,
  unit: material.unit || 'pcs',
  minLevel: Number.parseFloat(material.min_stock_level) || 10,
  costPerUnit: Number.parseFloat(material.unit_price) || 0,
});

const isSameDay = (date) => date && new Date(date).toDateString() === new Date().toDateString();
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function WorkshopHome({ orders, workers, materials, search, onView, onNewOrder }) {
  const [filter, setFilter] = useState('all');
  const query = search.trim().toLowerCase();
  const matchesSearch = (order) => !query || [order.id, order.name, order.client, order.type, order.color, order.size, order.assignedToName]
    .some((value) => String(value || '').toLowerCase().includes(query));
  const todayOrders = orders.filter((order) => isSameDay(order.createdAt));
  const urgentOrders = orders.filter((order) => ['urgent', 'rush', 'express', 'high'].includes(String(order.priority).toLowerCase()));
  const visibleOrders = orders.filter((order) => {
    if (!matchesSearch(order)) return false;
    if (filter === 'today') return isSameDay(order.createdAt);
    if (filter === 'progress') return order.stageIndex > 0;
    if (filter === 'urgent') return ['urgent', 'rush', 'express', 'high'].includes(String(order.priority).toLowerCase());
    if (filter === 'delivered') return order.stageIndex === 4;
    return true;
  }).slice(0, 6);
  const lowStock = materials.filter((material) => material.quantity <= material.minLevel).length;
  const deadlines = orders.filter((order) => isSameDay(order.dueDate)).slice(0, 5);
  const filters = [
    ['all', 'Recently'],
    ['today', 'Today'],
    ['progress', 'In progress'],
    ['urgent', 'Urgent'],
    ['delivered', 'Delivered'],
  ];

  return (
    <>
      <div className="workshop-greeting">
        <p className="workshop-eyebrow">WORKSHOP OVERVIEW</p>
        <h1>You have <span>{orders.length} coffin orders</span> in production</h1>
        <p className="workshop-subtitle">Track production, materials, and finished stock from one place.</p>
      </div>
      <div className="workshop-toolbar">
        <label className="workshop-search">
          <i className="fas fa-search" aria-hidden="true" />
          <input value={search} onChange={(event) => onView('search', event.target.value)} placeholder="Search orders, clients, materials..." />
        </label>
        <button type="button" className="workshop-primary-button" onClick={onNewOrder}>
          <i className="fas fa-plus" aria-hidden="true" /> New order
        </button>
      </div>

      <div className="workshop-stats">
        <button type="button" className="workshop-stat workshop-stat-dark" onClick={() => onView('orders')}>
          <span className="workshop-stat-icon"><i className="fas fa-clipboard-list" /></span>
          <strong>{orders.length}</strong><small>Open orders</small>
        </button>
        <button type="button" className="workshop-stat" onClick={() => onView('floor')}>
          <span className="workshop-stat-icon"><i className="fas fa-hammer" /></span>
          <strong>{todayOrders.length}</strong><small>Started today</small>
        </button>
        <button type="button" className="workshop-stat" onClick={() => onView('materials')}>
          <span className="workshop-stat-icon"><i className="fas fa-cubes" /></span>
          <strong>{materials.length}</strong><small>Materials tracked</small>
        </button>
        <button type="button" className="workshop-stat" onClick={() => onView('materials')}>
          <span className="workshop-stat-icon"><i className="fas fa-triangle-exclamation" /></span>
          <strong>{lowStock}</strong><small>Low-stock items</small>
        </button>
      </div>

      <div className="workshop-overview-grid">
        <section className="workshop-panel">
          <div className="workshop-section-heading">
            <div><p className="workshop-eyebrow">PRODUCTION</p><h2>My tasks</h2></div>
            <button type="button" className="workshop-text-button" onClick={() => onView('orders')}>All orders <i className="fas fa-arrow-right" /></button>
          </div>
          <div className="workshop-filter-row" role="tablist" aria-label="Filter workshop tasks">
            {filters.map(([key, label]) => (
              <button type="button" key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'is-selected' : ''} onClick={() => setFilter(key)}>
                {label}{key === 'urgent' && urgentOrders.length > 0 && <span className="workshop-filter-dot" />}
              </button>
            ))}
          </div>
          {visibleOrders.length ? (
            <div className="workshop-task-list">
              {visibleOrders.map((order) => {
                const stage = STAGES[order.stageIndex] || STAGES[0];
                return (
                  <article className="workshop-task" key={order.dbId}>
                    <span className="workshop-task-mark" style={{ background: stage.bg, color: stage.color }}><i className="fas fa-box" /></span>
                    <div className="workshop-task-copy">
                      <strong>{order.name}</strong>
                      <small>{[order.id, order.client, order.type, order.color].filter(Boolean).join(' · ')}</small>
                    </div>
                    <span className="workshop-stage-label"><i style={{ background: stage.color }} />{stage.name}</span>
                    <span className={`workshop-priority${['urgent', 'rush', 'express', 'high'].includes(String(order.priority).toLowerCase()) ? ' is-urgent' : ''}`}>
                      {order.priority}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="workshop-empty"><i className="fas fa-inbox" /><strong>No matching orders</strong><span>Create an order or choose another filter.</span></div>
          )}
        </section>

        <aside className="workshop-overview-aside">
          <section className="workshop-panel workshop-team-panel">
            <div className="workshop-section-heading">
              <div><p className="workshop-eyebrow">YOUR CREW</p><h2>Workshop team</h2></div>
              <span className="workshop-count">{workers.length}</span>
            </div>
            {workers.length ? workers.slice(0, 4).map((worker) => (
              <div className="workshop-team-row" key={worker.id}>
                <span className="workshop-avatar">{initials(worker.name)}</span>
                <span><strong>{worker.name}</strong><small>{worker.role}</small></span>
              </div>
            )) : <p className="workshop-muted-note">Worker assignments will appear here.</p>}
          </section>
          <section className="workshop-panel workshop-deadlines">
            <div className="workshop-section-heading">
              <div><p className="workshop-eyebrow">DUE TODAY</p><h2>Today's deadlines</h2></div>
              <i className="fas fa-clock" />
            </div>
            {deadlines.length ? deadlines.map((order) => (
              <div className="workshop-deadline-row" key={order.dbId}>
                <span className="workshop-deadline-time">{order.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span><strong>{order.name}</strong><small>{order.client || order.id}</small></span>
              </div>
            )) : <p className="workshop-muted-note">No deadlines scheduled for today.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}

function ProductionFloor({ orders }) {
  const columns = STAGES.slice(0, 4).map((stage) => ({
    ...stage,
    orders: orders.filter((order) => stage.statuses.includes(order.status)),
  }));
  return (
    <div className="workshop-floor">
      {columns.map((column) => (
        <section className="workshop-floor-column" key={column.name}>
          <header><span><i style={{ background: column.color }} />{column.name}</span><b>{column.orders.length}</b></header>
          {column.orders.length ? column.orders.map((order) => (
            <article className="workshop-floor-card" key={order.dbId}>
              <small>{order.id}</small><strong>{order.name}</strong>
              <span>{[order.type, order.size, order.color].filter(Boolean).join(' · ')}</span>
              <footer><span>{order.assignedToName || 'Unassigned'}</span><span>{order.priority}</span></footer>
            </article>
          )) : <p className="workshop-muted-note">No orders in this stage.</p>}
        </section>
      ))}
    </div>
  );
}

function WorkshopReports({ orders, workers, materials }) {
  const lowStock = materials.filter((material) => material.quantity <= material.minLevel);
  return (
    <div className="workshop-report-grid">
      {STAGES.map((stage) => {
        const count = orders.filter((order) => stage.statuses.includes(order.status)).length;
        return (
          <article className="workshop-report-card" key={stage.name}>
            <span className="workshop-report-icon" style={{ color: stage.color, background: stage.bg }}><i className="fas fa-chart-column" /></span>
            <small>{stage.name}</small><strong>{count}</strong><span>active orders</span>
          </article>
        );
      })}
      <section className="workshop-panel workshop-report-detail">
        <div className="workshop-section-heading"><div><p className="workshop-eyebrow">INVENTORY HEALTH</p><h2>Materials to check</h2></div><span className="workshop-count">{lowStock.length}</span></div>
        {lowStock.length ? lowStock.map((material) => <div className="workshop-deadline-row" key={material.id}><span className="workshop-low-dot" /><span><strong>{material.name}</strong><small>{material.quantity} {material.unit} remaining · alert at {material.minLevel}</small></span></div>) : <p className="workshop-muted-note">All material levels are above their alert thresholds.</p>}
      </section>
      <section className="workshop-panel workshop-report-detail">
        <div className="workshop-section-heading"><div><p className="workshop-eyebrow">PEOPLE</p><h2>Workshop team</h2></div><span className="workshop-count">{workers.length}</span></div>
        {workers.length ? workers.map((worker) => <div className="workshop-team-row" key={worker.id}><span className="workshop-avatar">{initials(worker.name)}</span><span><strong>{worker.name}</strong><small>{worker.role}</small></span></div>) : <p className="workshop-muted-note">No workers have been added yet.</p>}
      </section>
    </div>
  );
}

function WorkshopSettings({ onAddWorker }) {
  return (
    <div className="workshop-settings-grid">
      <section className="workshop-panel">
        <p className="workshop-eyebrow">PRODUCTION WORKFLOW</p>
        <h2>Order stages</h2>
        <p className="workshop-settings-copy">Move each coffin through the same clear production stages. Update an order from the Orders page to keep the floor current.</p>
        <div className="workshop-settings-stages">
          {STAGES.map((stage, index) => <div className="workshop-settings-stage" key={stage.name}><span style={{ background: stage.bg, color: stage.color }}>{String(index + 1).padStart(2, '0')}</span><strong>{stage.name}</strong><i className="fas fa-check" /></div>)}
        </div>
      </section>
      <section className="workshop-panel">
        <p className="workshop-eyebrow">TEAM ACCESS</p>
        <h2>Workshop workers</h2>
        <p className="workshop-settings-copy">Add production workers so they can be assigned to coffin orders.</p>
        <button type="button" className="workshop-primary-button" onClick={onAddWorker}><i className="fas fa-user-plus" /> Add worker</button>
      </section>
    </div>
  );
}

export default function WorkshopWorkspace() {
  const { socket } = useSocket();
  const [view, setView] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [dispatchRequest, setDispatchRequest] = useState(0);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, msg, type }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([
        workshopService.getActiveOrders(),
        workshopService.getWorkers(),
        workshopService.getMaterials(),
      ]);
      const failed = results.find((result) => !result?.success);
      if (failed) throw new Error(failed.error || 'Workshop data could not be loaded.');
      setOrders(Array.isArray(results[0].data) ? results[0].data.map(toOrder) : []);
      setWorkers(Array.isArray(results[1].data) ? results[1].data.map(toWorker) : []);
      setMaterials(Array.isArray(results[2].data) ? results[2].data.map(toMaterial) : []);
    } catch (loadError) {
      setError(loadError.message || 'Workshop data could not be loaded.');
      addToast(loadError.message || 'Workshop data could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!socket) return undefined;
    const refreshEvents = ['worker:created', 'worker:deleted', 'order:created', 'order:deleted', 'order:status:changed', 'production:stage:updated', 'production:stage:done', 'material:used'];
    refreshEvents.forEach((eventName) => socket.on(eventName, loadData));
    return () => refreshEvents.forEach((eventName) => socket.off(eventName, loadData));
  }, [socket, loadData]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    const result = await workshopService.updateOrderStatus(orderId, status);
    if (!result?.success) throw new Error(result?.error || 'Could not update order status.');
    addToast('Order status updated', 'success');
    await loadData();
  }, [addToast, loadData]);

  const assignWorker = useCallback(async (orderId, workerId) => {
    const result = await workshopService.assignWorkerToOrder(orderId, { user_id: workerId });
    if (!result?.success) throw new Error(result?.error || 'Could not assign worker.');
    addToast('Worker assigned', 'success');
    await loadData();
  }, [addToast, loadData]);

  const deleteOrder = useCallback(async (id) => {
    if (!window.confirm('Delete this order?')) return;
    const result = await workshopService.deleteOrder(id);
    if (!result?.success) throw new Error(result?.error || 'Could not delete order.');
    addToast('Order deleted', 'success');
    await loadData();
  }, [addToast, loadData]);

  const deleteMaterial = useCallback(async (id) => {
    const result = await workshopService.deleteMaterial(id);
    if (!result?.success) throw new Error(result?.error || 'Could not delete material.');
    addToast('Material deleted', 'success');
    await loadData();
  }, [addToast, loadData]);

  const createOrder = useCallback(async (form) => {
    const result = await workshopService.createOrder(form);
    if (!result?.success) {
      addToast(`Could not create order: ${result?.error || 'Request failed'}`, 'error');
      return;
    }
    setModal(null);
    addToast('Order created', 'success');
    await loadData();
  }, [addToast, loadData]);

  const createWorker = useCallback(async (form) => {
    const result = await workshopService.createWorker(form);
    if (!result?.success) {
      addToast(`Could not add worker: ${result?.error || 'Request failed'}`, 'error');
      return;
    }
    setModal(null);
    addToast('Worker added', 'success');
    await loadData();
  }, [addToast, loadData]);

  const addMaterial = useCallback(async (form) => {
    const result = await workshopService.createMaterial({
      name: form.name,
      category: form.category,
      unit: form.unit,
      quantity: form.quantity,
      unit_price: form.price,
      min_stock_level: form.minStock,
      description: form.description,
    });
    if (!result?.success) {
      addToast(`Could not add material: ${result?.error || 'Request failed'}`, 'error');
      return;
    }
    setModal(null);
    addToast('Material added', 'success');
    await loadData();
  }, [addToast, loadData]);

  const activeViewData = useMemo(() => ({
    orders,
    workers,
    materials,
    loading,
    error,
    connected: !error,
    toasts,
    modal,
    setModal,
    addToast,
    createOrder,
    updateOrderStatus,
    createWorker,
    addMaterial,
    deleteMaterial,
    deleteOrder,
    loadData,
    tab: view,
    setTab: setView,
    assignWorker,
  }), [orders, workers, materials, loading, error, toasts, modal, addToast, createOrder, updateOrderStatus, createWorker, addMaterial, deleteMaterial, deleteOrder, loadData, view, assignWorker]);

  const [eyebrow, title] = VIEW_COPY[view] || VIEW_COPY.dashboard;
  const hasSearch = view === 'dashboard' || view === 'orders' || view === 'floor' || view === 'materials' || view === 'store' || view === 'deliveries';
  const matchingOrders = orders.filter((order) => !search.trim() || [order.id, order.name, order.client, order.type, order.color, order.size, order.assignedToName].some((value) => String(value || '').toLowerCase().includes(search.trim().toLowerCase())));
  const newOrderView = view === 'dashboard' || view === 'orders';

  return (
    <Ctx.Provider value={activeViewData}>
      <div className="workshop-app">
        <WorkshopSidebar activeView={view} onSelect={setView} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} ordersCount={orders.length} />
        <main className="workshop-main">
          <div className="workshop-main-inner">
            <header className="workshop-page-header">
              <div className="workshop-page-title">
                <button type="button" className="workshop-mobile-menu" aria-label="Open workshop navigation" onClick={() => setMobileNavOpen(true)}><i className="fas fa-bars" /></button>
                <div><p className="workshop-eyebrow">{eyebrow}</p><h1>{title}</h1></div>
              </div>
              <div className="workshop-header-actions">
                <button type="button" className="workshop-icon-button" aria-label="Refresh workshop" onClick={loadData} disabled={loading}><i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} /></button>
                {newOrderView && <button type="button" className="workshop-primary-button" onClick={() => setModal('createOrder')}><i className="fas fa-plus" /> New order</button>}
                {view === 'materials' && <button type="button" className="workshop-primary-button" onClick={() => setModal('createMaterial')}><i className="fas fa-plus" /> Add material</button>}
                {view === 'settings' && <button type="button" className="workshop-primary-button" onClick={() => setModal('createWorker')}><i className="fas fa-user-plus" /> Add worker</button>}
              </div>
            </header>

            {hasSearch && view !== 'dashboard' && (
              <label className="workshop-search workshop-subpage-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${view === 'materials' ? 'materials' : view === 'store' ? 'inventory' : 'orders'}...`} />
              </label>
            )}

            <section className="workshop-view-content">
              {loading && !orders.length && <div className="workshop-feedback"><span className="workshop-spinner" /><strong>Loading workshop data</strong><small>Fetching your orders, workers, and materials.</small></div>}
              {!loading && error && !orders.length && (
                <div className="workshop-feedback workshop-error"><i className="fas fa-triangle-exclamation" /><strong>Workshop data is unavailable</strong><small>{error}</small><button type="button" className="workshop-primary-button" onClick={loadData}>Try again</button></div>
              )}
              {(!loading || orders.length > 0) && !(error && !orders.length) && (
                <>
                  {view === 'dashboard' && <WorkshopHome orders={orders} workers={workers} materials={materials} search={search} onView={(next, value) => next === 'search' ? setSearch(value) : setView(next)} onNewOrder={() => setModal('createOrder')} />}
                  {view === 'orders' && <OrdersTab searchTerm={search} />}
                  {view === 'floor' && <ProductionFloor orders={matchingOrders} />}
                  {view === 'store' && (
                    <>
                      <div className="workshop-view-intro"><p>Finished coffins ready for stock management and dispatch.</p><button type="button" className="workshop-outline-button" onClick={() => { setView('store'); setDispatchRequest((count) => count + 1); }}>Open dispatch</button></div>
                      <StoreTab dispatchRequest={dispatchRequest} />
                    </>
                  )}
                  {view === 'materials' && <MaterialsTab />}
                  {view === 'deliveries' && (
                    <div className="workshop-panel workshop-deliveries">
                      <span className="workshop-deliveries-icon"><i className="fas fa-truck-fast" /></span>
                      <h2>Dispatch from the Store</h2>
                      <p>Finished coffin stock and dispatch records are managed in the Store workspace.</p>
                      <button type="button" className="workshop-primary-button" onClick={() => setView('store')}>Open Store <i className="fas fa-arrow-right" /></button>
                    </div>
                  )}
                  {view === 'reports' && <WorkshopReports orders={orders} workers={workers} materials={materials} />}
                  {view === 'settings' && <WorkshopSettings onAddWorker={() => setModal('createWorker')} />}
                </>
              )}
            </section>
          </div>
        </main>

        {modal && <ModalRouter type={modal} onClose={() => setModal(null)} onSubmit={modal === 'createWorker' ? createWorker : modal === 'createMaterial' ? addMaterial : modal === 'createOrder' ? createOrder : undefined} workers={workers} />}
        <Toasts toasts={toasts} />
        <style>{`
          .workshop-app{--ws-ink:#1a1a1a;--ws-muted:#777;--ws-line:#ececec;--ws-yellow:#f4c430;display:grid;grid-template-columns:220px minmax(0,1fr);width:100%;height:100dvh;min-height:600px;background:#eef0f4;color:var(--ws-ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
          .workshop-sidebar{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;min-height:0;overflow:auto;padding:28px 18px 22px;background:#0a0a0a;color:#fff}
          .workshop-brand{display:flex;align-items:center;gap:10px;margin:0 0 36px 4px}.workshop-brand-mark{display:grid;width:32px;height:32px;place-items:center;border-radius:7px;background:var(--ws-yellow);color:#111;font-size:13px;font-weight:800}.workshop-brand-copy,.workshop-workspace-copy{display:grid;gap:2px}.workshop-brand-copy strong{font-size:14px}.workshop-brand-copy small{color:#888;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
          .workshop-nav{display:grid;gap:4px}.workshop-nav-item{display:flex;align-items:center;gap:13px;width:100%;min-height:43px;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:#969696;text-align:left;font:500 13px inherit;cursor:pointer;transition:background .15s,color .15s}.workshop-nav-item i{width:18px;text-align:center;font-size:14px}.workshop-nav-item:hover,.workshop-nav-item.is-active{background:#191919;color:#fff}.workshop-nav-item.is-active{box-shadow:inset 0 0 0 1px #252525}.workshop-nav-badge{margin-left:auto;padding:2px 7px;border-radius:6px;background:#2a2a2a;color:#ddd;font-size:10px}
          .workshop-sidebar-footer{margin-top:auto;padding-top:30px}.workshop-workspace-label{margin:0 0 9px 5px;color:#777;font-size:9px;letter-spacing:.1em}.workshop-workspace-card{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #252525;border-radius:10px;background:#151515}.workshop-workspace-avatar{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;background:var(--ws-yellow);color:#111;font-size:11px;font-weight:800}.workshop-workspace-copy strong{font-size:11px}.workshop-workspace-copy small{color:#888;font-size:10px}
          .workshop-main{min-width:0;height:100%;overflow:auto;padding:30px clamp(20px,3vw,46px);background:#f5f6f8}.workshop-main-inner{max-width:1500px;margin:0 auto}.workshop-page-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:27px}.workshop-page-title{display:flex;align-items:center;gap:12px}.workshop-page-title h1{margin:3px 0 0;font-size:25px;letter-spacing:-.035em}.workshop-eyebrow{margin:0;color:#999;font-size:9px;font-weight:700;letter-spacing:.13em}.workshop-header-actions{display:flex;align-items:center;gap:9px}.workshop-mobile-menu{display:none}
          .workshop-primary-button,.workshop-outline-button,.workshop-icon-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border:1px solid transparent;border-radius:9px;font:600 12px inherit;white-space:nowrap;cursor:pointer}.workshop-primary-button{background:#111;color:#fff}.workshop-primary-button:hover{background:#292929}.workshop-primary-button:disabled{opacity:.5;cursor:wait}.workshop-outline-button,.workshop-icon-button{border-color:#e6e6e6;background:#fff;color:#333}.workshop-icon-button{width:42px;padding:0}
          .workshop-greeting{margin:0 0 20px}.workshop-greeting h1{max-width:850px;margin:7px 0;font-size:clamp(25px,3vw,34px);line-height:1.2;letter-spacing:-.04em}.workshop-greeting h1 span{color:#9b7710}.workshop-subtitle,.workshop-view-intro p{margin:0;color:#858585;font-size:13px}
          .workshop-toolbar{display:flex;gap:10px;margin-bottom:20px}.workshop-search{display:flex;align-items:center;gap:10px;min-width:0;min-height:43px;padding:0 14px;border:1px solid #e9e9e9;border-radius:10px;background:#fff;color:#999}.workshop-search i{font-size:13px}.workshop-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#222;font:400 12px inherit}.workshop-search input::placeholder{color:#aaa}.workshop-toolbar .workshop-search{flex:1}.workshop-subpage-search{max-width:520px;margin:0 0 20px}
          .workshop-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:22px}.workshop-stat{display:grid;grid-template-columns:38px 1fr;align-items:center;column-gap:11px;min-height:94px;padding:16px;border:1px solid #ededed;border-radius:13px;background:#fff;text-align:left;cursor:pointer}.workshop-stat:hover{box-shadow:0 8px 24px #0000000d;transform:translateY(-1px)}.workshop-stat-dark{border-color:#1a1a1a;background:#1a1a1a;color:#fff}.workshop-stat-icon{grid-row:span 2;display:grid;width:36px;height:36px;place-items:center;border-radius:10px;background:#f4f5f7;color:#333}.workshop-stat-dark .workshop-stat-icon{background:#292929;color:var(--ws-yellow)}.workshop-stat>strong{font-size:25px;line-height:1}.workshop-stat>small{color:#929292;font-size:11px}.workshop-stat-dark>small{color:#aaa}
          .workshop-overview-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;align-items:start;gap:16px}.workshop-panel{min-width:0;padding:18px;border:1px solid #ececec;border-radius:14px;background:#fff}.workshop-section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px}.workshop-section-heading h2,.workshop-panel h2{margin:4px 0 0;font-size:17px;letter-spacing:-.02em}.workshop-text-button{display:flex;align-items:center;gap:7px;border:0;background:transparent;color:#777;font:600 11px inherit;cursor:pointer}.workshop-filter-row{display:flex;gap:17px;overflow:auto;margin-bottom:13px;border-bottom:1px solid #f0f0f0}.workshop-filter-row button{position:relative;flex:0 0 auto;padding:0 0 11px;border:0;background:transparent;color:#999;font:500 11px inherit;cursor:pointer}.workshop-filter-row button.is-selected{color:#191919;font-weight:700}.workshop-filter-row button.is-selected:after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:var(--ws-yellow);content:""}.workshop-filter-dot{display:inline-block;width:5px;height:5px;margin-left:4px;border-radius:50%;background:#e54b4b;vertical-align:middle}
          .workshop-task-list{display:grid}.workshop-task{display:grid;grid-template-columns:36px minmax(0,1fr) auto auto;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid #f1f1f1}.workshop-task:last-child{border-bottom:0}.workshop-task-mark{display:grid;width:34px;height:34px;place-items:center;border-radius:9px;font-size:12px}.workshop-task-copy,.workshop-team-row>span:last-child,.workshop-deadline-row>span:last-child{display:grid;min-width:0;gap:4px}.workshop-task-copy strong,.workshop-team-row strong,.workshop-deadline-row strong{overflow:hidden;color:#282828;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.workshop-task-copy small,.workshop-team-row small,.workshop-deadline-row small{overflow:hidden;color:#999;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.workshop-stage-label{display:flex;align-items:center;gap:6px;color:#555;font-size:10px;white-space:nowrap}.workshop-stage-label i,.workshop-low-dot{width:7px;height:7px;border-radius:50%}.workshop-priority{padding:4px 7px;border-radius:6px;background:#f5f5f5;color:#777;font-size:9px;text-transform:capitalize}.workshop-priority.is-urgent{background:#fdecee;color:#c5364c}.workshop-overview-aside{display:grid;gap:14px}.workshop-count{display:grid;min-width:26px;height:26px;place-items:center;border-radius:8px;background:#f5f5f5;color:#555;font-size:11px;font-weight:700}.workshop-team-row,.workshop-deadline-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f3f3f3}.workshop-team-row:last-child,.workshop-deadline-row:last-child{border-bottom:0}.workshop-avatar{display:grid;width:30px;height:30px;flex:none;place-items:center;border-radius:50%;background:#f3f0e7;color:#78642c;font-size:10px;font-weight:700}.workshop-deadlines .workshop-section-heading>i{color:#888}.workshop-deadline-time{min-width:48px;color:#987718;font-size:10px;font-weight:700}.workshop-muted-note{margin:0;padding:12px 0;color:#999;font-size:11px;line-height:1.5}.workshop-empty{display:grid;justify-items:center;gap:7px;padding:42px 12px;color:#999;text-align:center}.workshop-empty>i{font-size:22px}.workshop-empty strong{color:#555;font-size:13px}.workshop-empty span{font-size:11px}
          .workshop-view-content{min-height:200px}.workshop-view-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.workshop-floor{display:grid;grid-template-columns:repeat(4,minmax(210px,1fr));gap:12px;overflow-x:auto;padding-bottom:10px}.workshop-floor-column{min-width:210px;padding:12px;border:1px solid #eaeaea;border-radius:12px;background:#f9f9f9}.workshop-floor-column>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;font-size:12px;font-weight:700}.workshop-floor-column>header span{display:flex;align-items:center;gap:7px}.workshop-floor-column>header i{width:8px;height:8px;border-radius:50%}.workshop-floor-column>header b{display:grid;min-width:22px;height:22px;place-items:center;border-radius:7px;background:#fff;color:#666;font-size:10px}.workshop-floor-card{display:grid;gap:7px;margin-bottom:9px;padding:13px;border:1px solid #ececec;border-radius:10px;background:#fff}.workshop-floor-card>small{color:#999;font-size:9px}.workshop-floor-card>strong{font-size:12px}.workshop-floor-card>span{color:#888;font-size:10px}.workshop-floor-card>footer{display:flex;justify-content:space-between;gap:8px;padding-top:7px;border-top:1px solid #f2f2f2;color:#888;font-size:9px}
          .workshop-report-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.workshop-report-card{display:grid;grid-template-columns:36px 1fr;column-gap:10px;align-items:center;padding:15px;border:1px solid #ececec;border-radius:12px;background:#fff}.workshop-report-icon{grid-row:span 3;display:grid;width:34px;height:34px;place-items:center;border-radius:9px}.workshop-report-card small,.workshop-report-card>span:last-child{color:#888;font-size:10px}.workshop-report-card strong{font-size:20px}.workshop-report-detail{grid-column:span 2}.workshop-low-dot{background:#df9e1b}.workshop-settings-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}.workshop-settings-copy{max-width:550px;margin:12px 0 20px;color:#888;font-size:12px;line-height:1.6}.workshop-settings-stages{display:grid;gap:7px}.workshop-settings-stage{display:flex;align-items:center;gap:11px;padding:10px;border:1px solid #f0f0f0;border-radius:9px}.workshop-settings-stage>span{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;font-size:10px;font-weight:700}.workshop-settings-stage>strong{font-size:12px}.workshop-settings-stage>i{margin-left:auto;color:#999;font-size:11px}.workshop-deliveries{display:grid;justify-items:center;gap:10px;padding:60px 24px;text-align:center}.workshop-deliveries-icon{display:grid;width:54px;height:54px;place-items:center;border-radius:15px;background:#f4f5f7;color:#444;font-size:20px}.workshop-deliveries h2{margin:4px 0 0}.workshop-deliveries p{max-width:380px;margin:0 0 8px;color:#888;font-size:12px;line-height:1.6}
          .workshop-feedback{display:grid;justify-items:center;gap:10px;margin:8vh auto;padding:42px 24px;color:#888;text-align:center}.workshop-feedback strong{color:#333;font-size:14px}.workshop-feedback small{max-width:440px;font-size:12px;line-height:1.5}.workshop-feedback>i{color:#ba3a3a;font-size:22px}.workshop-spinner{width:34px;height:34px;border:3px solid #e5e5e5;border-top-color:#161616;border-radius:50%;animation:workshop-spin .75s linear infinite}@keyframes workshop-spin{to{transform:rotate(360deg)}}
          .workshop-sidebar-backdrop{display:none}
          @media(max-width:1150px){.workshop-overview-grid{grid-template-columns:minmax(0,1fr) 250px}.workshop-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.workshop-report-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
          @media(max-width:900px){.workshop-app{display:block}.workshop-sidebar{position:fixed;inset:0 auto 0 0;width:250px;height:100dvh;transform:translateX(-105%);transition:transform .25s ease;z-index:1200}.workshop-sidebar.is-open{transform:translateX(0)}.workshop-sidebar-backdrop{position:fixed;inset:0;z-index:1190;display:block;border:0;background:#0008}.workshop-mobile-menu{display:grid;width:38px;height:38px;place-items:center;border:1px solid #e8e8e8;border-radius:9px;background:#fff;color:#333}.workshop-main{height:100dvh}.workshop-overview-grid{grid-template-columns:1fr}.workshop-overview-aside{grid-template-columns:repeat(2,minmax(0,1fr))}}
          @media(max-width:650px){.workshop-main{padding:20px 14px}.workshop-page-header{align-items:flex-start;margin-bottom:22px}.workshop-page-title h1{font-size:20px}.workshop-header-actions{gap:6px}.workshop-header-actions .workshop-primary-button{min-height:38px;padding:0 10px;font-size:10px}.workshop-icon-button{width:38px;min-height:38px}.workshop-greeting h1{font-size:25px}.workshop-stats{gap:8px}.workshop-stat{min-height:78px;padding:10px;grid-template-columns:30px 1fr;column-gap:8px}.workshop-stat-icon{width:29px;height:29px;font-size:11px}.workshop-stat>strong{font-size:20px}.workshop-stat>small{font-size:9px}.workshop-toolbar{align-items:stretch}.workshop-toolbar .workshop-primary-button{padding:0 11px;font-size:10px}.workshop-overview-aside{grid-template-columns:1fr}.workshop-task{grid-template-columns:32px minmax(0,1fr) auto;gap:8px}.workshop-priority{display:none}.workshop-task-copy small{max-width:100%;}.workshop-report-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.workshop-report-detail{grid-column:1/-1}.workshop-settings-grid{grid-template-columns:1fr}.workshop-panel{padding:14px}.workshop-filter-row{gap:13px}.workshop-view-intro{align-items:flex-start;flex-direction:column}}
        `}</style>
      </div>
    </Ctx.Provider>
  );
}
