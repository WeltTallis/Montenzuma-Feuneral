import { Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalLoaderStyles } from './components/loader/loader';
import Loader from './components/loader/loader';
import ConnectionToast from './components/common/ConnectionToast.jsx';
import InstallPrompt from './components/pwa/InstallPrompt.jsx';
import AppRoutes from './routes/AppRouter.jsx';
import ErrorBoundary from './utils/ErrorBoundary.jsx';
import { AuthProvider } from './utils/context/AuthContext.jsx';
import { TenantProvider } from './utils/context/TenantContext.jsx';
import { UserProvider } from './utils/context/userContext.jsx';
import { SocketProvider } from './utils/context/socketContext.jsx';


function App() {
  useEffect(() => {
    document.getElementById('boot-loader')?.remove();
  }, []);

  return (
    <>
      {/* Outside the boundary so the connection toast still renders while a
          fallback screen is up — it is the primary "you are offline" signal. */}
      <GlobalLoaderStyles />
      <ConnectionToast />
      <ErrorBoundary>
        <HelmetProvider>
          <AuthProvider>
            <TenantProvider>
              <UserProvider>
                <SocketProvider>
                  <Suspense fallback={<Loader text="Loading" />}>
                    <AppRoutes />
                    <InstallPrompt />
                  </Suspense>
                </SocketProvider>
              </UserProvider>
            </TenantProvider>
          </AuthProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
