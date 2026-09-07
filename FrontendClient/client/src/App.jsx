import React, { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRouter';
import ConnectionToast from './components/common/ConnectionToast';
import { AuthProvider } from './utils/context/AuthContext';
import { TenantProvider } from './utils/context/TenantContext';
import { UserProvider } from './utils/context/userContext';
import { SocketProvider } from './utils/context/socketContext';
import SocketStatus from './components/layout/SocketStatus';
import InstallPrompt from './components/pwa/InstallPrompt';
import Loader, { GlobalLoaderStyles } from './components/loader/loader';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8f9fa'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '12px' }}>
           Something went wrong
          </h2>
          <p style={{ color: '#6c757d', maxWidth: '400px', textAlign: 'center' }}>
            The application encountered an error. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', maxWidth: '600px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: '#6c757d' }}>Error Details</summary>
              <pre style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                overflow: 'auto',
                marginTop: '10px'
              }}>
                {this.state.error?.toString() || 'Unknown error'}
              </pre>
            </details>
          )}
        </div>
      );
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
    <ErrorBoundary>
      <GlobalLoaderStyles />
      <ConnectionToast />
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
  );
}

export default App;