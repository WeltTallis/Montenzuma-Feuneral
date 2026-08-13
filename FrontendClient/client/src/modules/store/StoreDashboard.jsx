import React, { Suspense, useState } from 'react';
import { Navbar, Container, Button, Badge } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './store.css';
import { useStore } from './useStore';
import { StoreContext } from './storeContext';
import AddItemModal from './components/AddItemModal';

const DashboardView = React.lazy(() => import('./components/Dashboard'));
const ItemsView = React.lazy(() => import('./components/Items'));
const MovementView = React.lazy(() => import('./components/Movement'));
const HistoryView = React.lazy(() => import('./components/History'));

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { key: 'items', label: 'Items', icon: 'fa-solid fa-box' },
  { key: 'movement', label: 'Stock Movement', icon: 'fa-solid fa-arrows-rotate' },
  { key: 'history', label: 'History', icon: 'fa-solid fa-clock-rotate-left' },
];

export default function StoreDashboard() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const renderView = () => {
    switch (store.view) {
      case 'items': return <ItemsView />;
      case 'movement': return <MovementView />;
      case 'history': return <HistoryView />;
      default: return <DashboardView />;
    }
  };

  return (
    <StoreContext.Provider value={store}>
      <div className="mini-store">
        <Navbar
          bg="light"
          variant="light"
          className="px-3 px-md-4 border-bottom align-items-center"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)', height: 64 }}
        >
          <Container fluid className="px-0">
            <Navbar.Brand className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 30, height: 30, background: 'rgba(26,95,122,.1)', color: 'var(--k-primary)' }}
              >
                <i className="fa-solid fa-store" />
              </span>
              MiniStore
            </Navbar.Brand>

                        <div className="d-flex align-items-center gap-1 flex-wrap navbar-tabs">
              {TABS.map((t) => (
                <Button
                  key={t.key}
                  variant={store.view === t.key ? 'primary' : 'outline-secondary'}
                  className="d-inline-flex align-items-center gap-1 mb-1 quick-btn"
                  onClick={() => store.setView(t.key)}
                >
                  <i className={t.icon} /> {t.label}
                </Button>
              ))}
            </div>

                        <div className="d-flex align-items-center gap-3 ms-auto navbar-actions">
              <Button
                variant="primary"
                size="sm"
                className="d-inline-flex align-items-center gap-1 mb-1"
                onClick={() => setShowAdd(true)}
              >
                <i className="fa-solid fa-plus" /> Add Item
              </Button>
              <Badge bg={store.connected ? 'success' : 'secondary'} className="connection-badge d-inline-flex align-items-center gap-1">
                <i className={`fa-solid ${store.connected ? 'fa-wifi' : 'fa-wifi-slash'}`} />
                                {store.connected ? 'Live API' : 'Offline'}
              </Badge>
              <div className="d-none d-sm-flex align-items-center gap-2">
                <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-primary fw-bold" style={{ width: 34, height: 34, background: 'rgba(26,95,122,.1)' }}>AM</span>
                <span className="d-none sm-inline fw-medium">Ahmed Mansour</span>
              </div>
            </div>
          </Container>
        </Navbar>

        <main className="py-3 py-md-4 page-bg">
          <Container fluid className="px-3 px-md-4">
            {store.loading ? (
              <div className="text-center py-5">
                <span className="spinner-border" role="status" />
              </div>
            ) : (
              <Suspense fallback={<div className="text-center py-4">Loading…</div>}>
                {renderView()}
              </Suspense>
            )}
          </Container>
        </main>

        <AddItemModal show={showAdd} onHide={() => setShowAdd(false)} />
        <ToastContainer position="bottom-end" theme="light" />
      </div>
    </StoreContext.Provider>
  );
}
