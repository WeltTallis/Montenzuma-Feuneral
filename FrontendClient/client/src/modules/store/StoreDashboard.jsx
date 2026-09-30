import React, { Suspense, useState } from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './store.css';
import { useStore } from './useStore';
import { StoreContext } from './storeContext';
import { getCurrentUserName } from '../../utils/globalAuth';
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
  const currentUser = getCurrentUserName();

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
          className="store-navbar px-3 px-md-4 align-items-center"
          style={{ minHeight: 72 }}
        >
          <Container fluid className="px-0">
            <Navbar.Brand className="store-brand d-flex align-items-center gap-2 me-4">
              <span className="store-brand-mark d-inline-flex align-items-center justify-content-center rounded-circle">
                <i className="fa-solid fa-store" />
              </span>
              <span className="store-brand-name">Lichene Store</span>
            </Navbar.Brand>

            <div className="d-flex align-items-center gap-1 flex-wrap navbar-tabs">
              {TABS.map((t) => (
                <Button
                  key={t.key}
                  variant={store.view === t.key ? 'primary' : 'outline-secondary'}
                  className={`store-tab-btn d-inline-flex align-items-center gap-1 mb-1 ${store.view === t.key ? 'active' : ''}`}
                  onClick={() => store.setView(t.key)}
                >
                  <i className={t.icon} /> {t.label}
                </Button>
              ))}
            </div>

            <div className="d-flex align-items-center gap-3 ms-auto navbar-actions">
              <Button
                size="sm"
                className="store-primary-btn d-inline-flex align-items-center gap-1 mb-1"
                onClick={() => setShowAdd(true)}
              >
                <i className="fa-solid fa-plus" /> Add Item
              </Button>
              <span className="store-user-pill" title={currentUser || 'Signed-in user'}>
                <span className="store-user-avatar" aria-hidden="true">
                  {(currentUser || '?').trim().charAt(0).toUpperCase()}
                </span>
                <span className="store-user-name">{currentUser || 'Signed in'}</span>
              </span>
            </div>
          </Container>
        </Navbar>

        <main className="py-3 py-md-4 page-bg">
          <Container fluid className="px-3 px-md-4">
            {/* Offline / unsynced banner. Without it the store looks healthy
                while every "save" is really only a localStorage write that is
                lost on refresh — which is how this failed silently before. */}
            {!store.loading && (!store.connected || store.pendingSync > 0) && (
              <div
                className="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-3 py-2 px-3"
                role="status"
                aria-live="polite"
              >
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  {!store.connected && <strong>Store service unreachable.</strong>}
                  {store.error ? <span> {store.error} </span> : null}
                  {store.pendingSync > 0 && (
                    <span>
                      <strong>{store.pendingSync}</strong>{' '}
                      {store.pendingSync === 1 ? 'item is' : 'items are'} saved in this
                      browser only and {store.pendingSync === 1 ? 'has' : 'have'} not
                      reached the server yet.
                    </span>
                  )}
                  {!store.connected && (
                    <span>
                      Changes are held in this browser and upload automatically
                      once the service is reachable. Clearing site data or using a
                      different browser will lose them.
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="d-inline-flex align-items-center gap-1"
                  onClick={store.refresh}
                  disabled={store.loading}
                >
                  <i className="fa-solid fa-rotate" aria-hidden="true" /> Retry now
                </Button>
              </div>
            )}

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
