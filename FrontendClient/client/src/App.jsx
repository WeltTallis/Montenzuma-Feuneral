import React, { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRouter';
import ConnectionToast from './components/common/ConnectionToast';
import {
  CONNECTION_RESTORED_EVENT,
  isConnectionLost,
  probeConnection,
} from './api/connectionStatus';
import { AuthProvider } from './utils/context/AuthContext';
import { TenantProvider } from './utils/context/TenantContext';
import { UserProvider } from './utils/context/userContext';
import { SocketProvider } from './utils/context/socketContext';
import SocketStatus from './components/layout/SocketStatus';
import InstallPrompt from './components/pwa/InstallPrompt';
import Loader, { GlobalLoaderStyles } from './components/loader/loader';
import './index.css';

// ─── Error classification ───────────────────────────────────────────────────
// The boundary used to render the red "Something went wrong" screen for EVERY
// caught error — including "no internet" and "Failed to fetch dynamically
// imported module" (React.lazy route chunks fetched while offline). Those are
// connectivity problems, not app bugs, so they get a friendly connection
// screen that heals itself once the backend answers again.

// Vite/webpack chunk loading — almost always "user is offline" or a stale
// deploy (old hashed chunk no longer on the server).
const CHUNK_LOAD_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /loading chunk\b/i,
  /loading css chunk\b/i,
  /chunkloaderror/i,
];

// Transport-level failures: fetch() TypeErrors, axios network errors, browser
// network codes, DNS/refused sockets.
const NETWORK_ERROR_PATTERNS = [
  /\bnetworkerror\b/i,
  /failed to fetch/i,
  /fetch failed/i,
  /\bload failed\b/i, // Safari's fetch() failure message
  /the network connection was lost/i, // Safari
  /err_network\b/i,
  /err_internet_disconnected/i,
  /err_connection_(refused|reset|timed_out|aborted|closed|failed)/i,
  /err_name_not_resolved/i,
  /err_network_changed/i,
  /net::err_/i,
  /\beconnrefused\b/i,
  /\beconnreset\b/i,
  /\benotfound\b/i,
  /\beai_again\b/i,
  /\behostunreach\b/i,
  /\benetunreach\b/i,
];

const describeError = (error) =>
  [error?.name, error?.message, error?.code].filter(Boolean).join(' ');

const matchesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

/** True when the error is a lazy-route/chunk fetch failure (needs a reload to recover). */
const isChunkLoadError = (error) => matchesAny(describeError(error), CHUNK_LOAD_ERROR_PATTERNS);

/**
 * True when the error is connectivity-related rather than a real app bug:
 * chunk load failures, transport errors, or the browser/connection module
 * confirming there is genuinely no network right now.
 */
const isNetworkError = (error) => {
  const text = describeError(error);
  if (matchesAny(text, CHUNK_LOAD_ERROR_PATTERNS)) return true;
  if (matchesAny(text, NETWORK_ERROR_PATTERNS)) return true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  try {
    if (isConnectionLost()) return true;
  } catch {
    /* connection module unavailable — fall through */
  }
  return false;
};

const FALLBACK_PAGE_STYLE = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: '#f8f9fa',
};

const PRIMARY_BUTTON_STYLE = {
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: '600',
  background: '#0d6efd',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const SECONDARY_BUTTON_STYLE = {
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: '600',
  background: 'transparent',
  color: '#0d6efd',
  border: '1px solid #0d6efd',
  borderRadius: '8px',
  cursor: 'pointer',
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
      isRetrying: false,
      retryFailed: false,
    };
    // Guards so the 5s probe / event handlers never overlap a reload.
    this.recovering = false;
    this.recoveryTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, isNetworkError: isNetworkError(error) };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    window.addEventListener('online', this.checkConnection);
    window.addEventListener(CONNECTION_RESTORED_EVENT, this.checkConnection);
  }

  componentDidUpdate(_prevProps, prevState) {
    // While the connection screen is up, keep probing so recovery does not
    // depend on the browser firing a (often missing) `online` event.
    if (this.state.hasError && this.state.isNetworkError && !this.recoveryTimer) {
      this.recoveryTimer = setInterval(this.checkConnection, 5000);
      this.checkConnection();
    } else if ((!this.state.hasError || !this.state.isNetworkError) && this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.checkConnection);
    window.removeEventListener(CONNECTION_RESTORED_EVENT, this.checkConnection);
    if (this.recoveryTimer) clearInterval(this.recoveryTimer);
    this.recoveryTimer = null;
  }

  /** Probe the gateway; recover as soon as the backend is reachable again. */
  checkConnection = async () => {
    if (this.recovering || !this.state.hasError || !this.state.isNetworkError) return;
    this.recovering = true;
    try {
      if (await probeConnection()) this.recover();
    } finally {
      this.recovering = false;
    }
  };

  /**
   * Recover without forcing the user to mash Refresh:
   *  - chunk/lazy-load errors: React.lazy caches the rejected import, so only
   *    a fresh page load can re-fetch the module.
   *  - everything else: clear the boundary state; the subtree re-mounts and
   *    its effects re-run (now that connectivity is back).
   */
  recover = () => {
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.reset();
  };

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
      isRetrying: false,
      retryFailed: false,
    });
  };

  handleRetry = async () => {
    if (this.state.isRetrying) return;
    this.setState({ isRetrying: true, retryFailed: false });
    if (await probeConnection()) {
      this.recover();
      return;
    }
    this.setState({ isRetrying: false, retryFailed: true });
  };

  renderDevDetails() {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <details style={{ marginTop: '20px', maxWidth: '600px', width: '100%' }}>
        <summary style={{ cursor: 'pointer', color: '#6c757d' }}>Error Details</summary>
        <pre
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            overflow: 'auto',
            marginTop: '10px',
          }}
        >
          {(this.state.error?.toString() || 'Unknown error') +
            (this.state.errorInfo?.componentStack
              ? '\n' + this.state.errorInfo.componentStack
              : '')}
        </pre>
      </details>
    );
  }

  renderRetryButtons() {
    return (
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={this.handleRetry}
          disabled={this.state.isRetrying}
          style={PRIMARY_BUTTON_STYLE}
        >
          {this.state.isRetrying ? 'Checking connection…' : 'Try Again'}
        </button>
        <button onClick={() => window.location.reload()} style={SECONDARY_BUTTON_STYLE}>
          Refresh Page
        </button>
      </div>
    );
  }

  /** Connectivity problem — friendly copy + auto-healing, NOT a crash page. */
  renderConnectionFallback() {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return (
      <div style={FALLBACK_PAGE_STYLE}>
        <h2 style={{ color: '#b45309', marginBottom: '12px' }}>
          {offline ? "You're offline" : 'Connection problem'}
        </h2>
        <p style={{ color: '#6c757d', maxWidth: '440px', textAlign: 'center' }}>
          We couldn&apos;t reach the server, so part of the app didn&apos;t load. Check your
          internet connection and try again — we&apos;ll also retry automatically every few
          seconds.
        </p>
        {this.renderRetryButtons()}
        {this.state.retryFailed && (
          <p style={{ color: '#dc3545', marginTop: '16px', fontSize: '13px' }} role="alert">
            Still can&apos;t reach the server. We&apos;ll keep retrying in the background.
          </p>
        )}
        {this.renderDevDetails()}
      </div>
    );
  }

  /** Genuine application error — the original "Something went wrong" screen. */
  renderAppErrorFallback() {
    return (
      <div style={FALLBACK_PAGE_STYLE} role="alert">
        <h2 style={{ color: '#dc3545', marginBottom: '12px' }}>Something went wrong</h2>
        <p style={{ color: '#6c757d', maxWidth: '400px', textAlign: 'center' }}>
          The application encountered an error. Please refresh the page or try again later.
        </p>
        {this.renderRetryButtons()}
        {this.renderDevDetails()}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.state.isNetworkError
        ? this.renderConnectionFallback()
        : this.renderAppErrorFallback();
    }

    return this.props.children;
  }
}

// Loading component for Suspense — uses the global Rest Point loader
const LoadingFallback = () => (
  <Loader text="Loading" color="#0e3345" />
);

function App() {
  return (
    <>
      {/* Outside the boundary so the connection toast still renders while a
          fallback screen is up — it is the primary "you are offline" signal. */}
      <GlobalLoaderStyles />
      <ConnectionToast />
      <ErrorBoundary>
        <HelmetProvider>
          <Router>
            <AuthProvider>
              <TenantProvider>
                <UserProvider>
                  <SocketProvider>
                    <Suspense fallback={<LoadingFallback />}>
                      <AppRoutes />
                      <InstallPrompt />
                    </Suspense>
                  </SocketProvider>
                </UserProvider>
              </TenantProvider>
            </AuthProvider>
          </Router>
        </HelmetProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;