import React, { useMemo, useCallback } from 'react';
import { OrderCard } from '../components/OrderCard';
import { SearchBar } from '../components/SearchBar';
import { NewOrderModal } from '../modals/NewOrderModal';
import { OrderDetailModal } from '../modals/OrderDetailModal';
import { setOrderCardDeps } from '../components/OrderCard';

/* ============================================================================
   OrdersView — full orders list with search, filter, create modal.
   ============================================================================ */
const OrdersView = ({ orders = [], workers = [], onRefresh, createOrder, updateOrderStatus, deleteOrder }) => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(null);
  const [search, setSearch] = useState('');

  useMemo(() => {
    if (typeof setOrderCardDeps === 'function') setOrderCardDeps([], workers);
  }, [workers, setOrderCardDeps]);

  const filtered = useMemo(() => {
    let list = orders;
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search]);

  const handleCreate = useCallback((data) => {
    createOrder?.(data);
    setOpenCreate(false);
  }, [createOrder]);

  return (
    <div className="ec-orders-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Workshop</div>
          <h1 className="ec-view-title">All coffin orders</h1>
        </div>
      </div>

      <div className="ec-top-bar">
        <SearchBar placeholder="Search by order ID, client, or coffin name..." value={search} onChange={setSearch} />
        <button className="ec-new-order-btn" onClick={() => setOpenCreate(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New order
        </button>
      </div>

      <div className="ec-orders-section">
        <div className="ec-orders-header">
          <h2 className="ec-orders-title">Order pipeline</h2>
          <div className="ec-orders-tabs">
            <div className="ec-tab active" data-filter="all">All Open</div>
            <div className="ec-tab" data-filter="urgent">Urgent</div>
            <div className="ec-tab" data-filter="today">Today</div>
            <div className="ec-tab" data-filter="progress">In progress</div>
            <div className="ec-tab" data-filter="delivered">Delivered</div>
          </div>
        </div>
        <div className="ec-order-grid">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onSelect={(id) => setOpenDetail(id)} onStatusChange={updateOrderStatus} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#999' }}>
              No orders found
            </div>
          )}
        </div>
      </div>

      <NewOrderModal open={openCreate} onClose={() => setOpenCreate(false)} onSubmit={handleCreate} workers={workers} />
      {openDetail && (
        <OrderDetailModal
          open={openDetail}
          order={orders.find((o) => o.id === openDetail)}
          onClose={() => setOpenDetail(null)}
          onStatusChange={updateOrderStatus}
          onDelete={deleteOrder}
        />
      )}
    </div>
  );
};

export default OrdersView;
