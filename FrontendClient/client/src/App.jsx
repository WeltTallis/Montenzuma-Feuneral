
function App() {
  return (
    <>
      {/* Outside the boundary so the connection toast still renders while a
          fallback screen is up â€” it is the primary "you are offline" signal. */}
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
}

export default App;
