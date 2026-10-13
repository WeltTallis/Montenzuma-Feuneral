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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
            <div className="store-brand" aria-label="Lichene Store">
              <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
              <span>Lichene Store</span>
            </div>

            <Button
              type="button"
              variant="outline-secondary"
              className="store-nav-toggle"
              aria-label={mobileNavOpen ? 'Close store navigation' : 'Open store navigation'}
              aria-expanded={mobileNavOpen}
              aria-controls="store-primary-navigation"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <i className={`fa-solid ${mobileNavOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
            </Button>

            <nav
              id="store-primary-navigation"
              aria-label="Store sections"
              className={`d-flex align-items-center gap-1 flex-wrap navbar-tabs${mobileNavOpen ? ' is-open' : ''}`}
            >
              {TABS.map((t) => (
                <Button
                  key={t.key}
                  variant={store.view === t.key ? 'primary' : 'outline-secondary'}
                  className={`store-tab-btn d-inline-flex align-items-center gap-1 mb-1 ${store.view === t.key ? 'active' : ''}`}
                  aria-current={store.view === t.key ? 'page' : undefined}
                  onClick={() => {
                    store.setView(t.key);
                    setMobileNavOpen(false);
                  }}
                >
                  <i className={t.icon} /> {t.label}
                </Button>
              ))}
            </nav>

            <div className="d-flex align-items-center gap-3 ms-auto navbar-actions">
              <Button
                size="sm"
                className="store-primary-btn d-inline-flex align-items-center gap-1 mb-1"
                onClick={() => setShowAdd(true)}
                disabled={!store.connected || store.loading}
                title={!store.connected ? 'Reconnect to the store service to add inventory' : 'Add an item'}
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
            {/* Never fall back to browser-only inventory; keep the outage visible. */}
            {!store.loading && !store.connected && (
              <div
                className="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-3 py-2 px-3"
                role="status"
                aria-live="polite"
              >
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <strong>Store service unavailable.</strong>
                  {store.error ? <span> {store.error} </span> : null}
                  <span>Inventory changes are not saved in this browser. Reconnect to load and update server records.</span>
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
