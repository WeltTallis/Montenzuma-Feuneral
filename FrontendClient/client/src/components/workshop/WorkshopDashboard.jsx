import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSocket } from '../../../utils/context/socketContext';
import { Shell } from './shell/Shell';
import { Sidebar } from './shell/Sidebar';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { FloorView } from './views/FloorView';
import { MaterialsView } from './views/MaterialsView';
import { StoreView } from './views/StoreView';
import { DeliveriesView } from './views/DeliveriesView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { NewOrderModal } from './modals/NewOrderModal';
import { OrderDetailModal } from './modals/OrderDetailModal';
import { UseMaterialsModal } from './modals/UseMaterialsModal';
import { useWorkshopData } from './hooks/useWorkshopData';
import { workshopApiService } from './api/workshopApi';

export const WorkshopCtx = createContext(null);

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'floor', label: 'Production Floor', icon: 'fa-warehouse' },
  { id: 'materials', label: 'Materials', icon: 'fa-boxes-stacked' },
  { id: 'store', label: 'Store', icon: 'fa-cube' },
  { id: 'deliveries', label: 'Deliveries', icon: 'fa-truck' },
  { id: 'reports', label: 'Reports', icon: 'fa-chart-line' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const WorkshopDashboard = () => {
  const { socket, connected } = useSocket();
  const {
    orders,
    materials,
    workers,
    storeInventory,
    loading,
    error,
    refresh,
    setOrders,
    setMaterials,
    setWorkers,
    setStoreInventory,
  } = useWorkshopData();

  const [activeView, setActiveView] = useState('dashboard');
  const [openNewOrder, setOpenNewOrder] = useState(false);
  const [openOrderDetail, setOpenOrderDetail] = useState(null);
  const [openUseMaterials, setOpenUseMaterials] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
    addToast('Data refreshed', 'info');
  }, [refresh, addToast]);

  const handleCreateOrder = useCallback(async (data) => {
    const res = await workshopApiService.createOrder(data);
    if (res.success) {
      addToast('Order created successfully', 'success');
      refresh();
    } else {
      addToast('Failed to create order: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const handleUpdateOrderStatus = useCallback(async (orderId, status) => {
    const res = await workshopApiService.updateOrderStatus(orderId, status);
    if (res.success) {
      addToast('Order status updated', 'success');
      refresh();
    } else {
      addToast('Failed to update status: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const handleDeleteOrder = useCallback(async (orderId) => {
    const res = await workshopApiService.deleteOrder(orderId);
    if (res.success) {
      addToast('Order deleted', 'info');
      refresh();
    } else {
      addToast('Failed to delete: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const handleRestock = useCallback(async (material) => {
    const res = await workshopApiService.updateMaterial(material.id, {
      quantity: material.quantity + 10,
    });
    if (res.success) {
      addToast('Restocked ' + material.name, 'success');
      refresh();
    } else {
      addToast('Failed to restock: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const handleDeleteMaterial = useCallback(async (material) => {
    const res = await workshopApiService.deleteMaterial(material.id);
    if (res.success) {
      addToast(material.name + ' deleted', 'info');
      refresh();
    } else {
      addToast('Failed to delete: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const handleUseMaterial = useCallback(async (usage) => {
    for (const u of usage) {
      await workshopApiService.useMaterial({
        material_id: u.materialId,
        quantity_used: u.qty,
      });
    }
    addToast('Material usage logged', 'success');
    refresh();
  }, [workshopApiService, addToast, refresh]);

  const handleDispatch = useCallback(async (orderId) => {
    const res = await workshopApiService.updateOrderStatus(orderId, 'store');
    if (res.success) {
      addToast('Order dispatched to store', 'success');
      refresh();
    } else {
      addToast('Failed to dispatch: ' + res.error, 'error');
    }
  }, [workshopApiService, addToast, refresh]);

  const ctxValue = {
    orders,
    materials,
    workers,
    setOrders,
    setMaterials,
    setWorkers,
    loadData: refresh,
    addToast,
  };

  return (
    <WorkshopCtx.Provider value={ctxValue}>
      <Shell
        sidebar={({ toggleSidebar }) => (
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            user={{ name: 'Workshop Manager', initials: 'WM', branch: 'Main Branch' }}
            toggleSidebar={toggleSidebar}
          />
        )}
        main={
          <div className="ec-main">
            {activeView === 'dashboard' && (
              <DashboardView
                orders={orders}
                workers={workers}
                onOrderSelect={(id) => setOpenOrderDetail(id)}
                onOrderStatusChange={handleUpdateOrderStatus}
              />
            )}
            {activeView === 'orders' && (
              <OrdersView
                orders={orders}
                workers={workers}
                onRefresh={handleRefresh}
                createOrder={handleCreateOrder}
                updateOrderStatus={handleUpdateOrderStatus}
                deleteOrder={handleDeleteOrder}
              />
            )}
            {activeView === 'floor' && (
              <FloorView
                orders={orders}
                workers={workers}
                onPause={() => addToast('Pause feature coming soon', 'info')}
                onResume={() => addToast('Resume feature coming soon', 'info')}
                onAdvance={() => addToast('Advance feature coming soon', 'info')}
                onDispatch={handleDispatch}
                onBack={() => addToast('Back feature coming soon', 'info')}
                onOrderSelect={(id) => setOpenOrderDetail(id)}
              />
            )}
            {activeView === 'materials' && (
              <MaterialsView
                materials={materials}
                onRestock={handleRestock}
                onDelete={handleDeleteMaterial}
                onUseMaterial={handleUseMaterial}
              />
            )}
            {activeView === 'store' && (
              <StoreView
                store={storeInventory}
                onRestock={handleRestock}
                onDispatch={() => addToast('Dispatch panel coming soon', 'info')}
              />
            )}
            {activeView === 'deliveries' && (
              <DeliveriesView deliveries={[]} />
            )}
            {activeView === 'reports' && (
              <ReportsView materials={materials} usageLog={[]} />
            )}
            {activeView === 'settings' && (
              <SettingsView
                coffinTypes={[]}
                colors={[]}
              />
            )}
          </div>
        }
      />

      <NewOrderModal
        open={openNewOrder}
        onClose={() => setOpenNewOrder(false)}
        onSubmit={handleCreateOrder}
        workers={workers}
        types={['Standard', 'Premium', 'Executive', 'Deluxe', 'Basic', 'Casket', 'Child']}
        colors={['Natural', 'Mahogany', 'Walnut', 'Dark Cherry', 'Golden Oak', 'Honey', 'White', 'Red', 'Black']}
        materials={['Oak', 'Mahogany', 'Pine', 'Rosewood', 'Cherry', 'Maple', 'Black Walnut']}
      />
      {openOrderDetail && (
        <OrderDetailModal
          open={openOrderDetail}
          order={orders.find((o) => o.id === openOrderDetail)}
          onClose={() => setOpenOrderDetail(null)}
          onStatusChange={handleUpdateOrderStatus}
          onDelete={handleDeleteOrder}
        />
      )}
      <UseMaterialsModal
        open={openUseMaterials}
        onClose={() => setOpenUseMaterials(false)}
        materials={materials}
        onSubmit={handleUseMaterial}
      />
    </WorkshopCtx.Provider>
  );
};

export default WorkshopDashboard;
