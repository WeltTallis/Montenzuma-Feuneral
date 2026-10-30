import React, { lazy, Suspense } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth as useRestPointAuth } from '../utils/context/AuthContext.jsx';
import { hasSession } from '../utils/globalAuth.js';
import { AppProviders } from './contexts';
import { mapRestPointRole } from './contexts/AuthContext';
import type { AppRole } from './lib/auth';
import { ResponsivePage } from './components/ResponsivePage';
import './styles/integration.css';

const AdminDashboard = lazy(() => import('@hr/pages/admin/DashboardPage'));
const AdminDashboardMobile = lazy(() => import('@hr/pages/mobile/admin/DashboardPage'));
const AdminEmployees = lazy(() => import('@hr/pages/admin/EmployeesPage'));
const AdminEmployeesMobile = lazy(() => import('@hr/pages/mobile/admin/EmployeesPage'));
const AdminProjects = lazy(() => import('@hr/pages/admin/ProjectsPage'));
const AdminProjectsMobile = lazy(() => import('@hr/pages/mobile/admin/ProjectsPage'));
const AdminTimesheets = lazy(() => import('@hr/pages/admin/TimesheetPage'));
const AdminTimesheetsMobile = lazy(() => import('@hr/pages/mobile/admin/TimesheetPage'));
const AdminLedger = lazy(() => import('@hr/pages/admin/TransactionsPage'));
const AdminLedgerMobile = lazy(() => import('@hr/pages/mobile/admin/LedgerEntriesPage'));
const AdminAdvancePayments = lazy(() => import('@hr/pages/admin/AdvancePaymentsPage'));
const AdminAdvancePaymentsMobile = lazy(() => import('@hr/pages/mobile/admin/AdvancePaymentsPage'));
const AdminUsers = lazy(() => import('@hr/pages/admin/UsersPage'));
const AdminUsersMobile = lazy(() => import('@hr/pages/mobile/admin/UsersPage'));
const AdminWallet = lazy(() => import('@hr/pages/admin/WalletPage'));
const AdminWalletMobile = lazy(() => import('@hr/pages/mobile/admin/WalletPage'));
const AdminSettings = lazy(() => import('@hr/pages/admin/SettingsPage'));
const AdminSettingsMobile = lazy(() => import('@hr/pages/mobile/admin/SettingsPage'));
const AdminPaymentHistory = lazy(() => import('@hr/pages/admin/PaymentHistoryPage'));
const AdminTaxCalculator = lazy(() => import('@hr/pages/admin/TaxCalculatorPage'));
const PartnerDashboard = lazy(() => import('@hr/pages/partner/DashboardPage'));
const PartnerDashboardMobile = lazy(() => import('@hr/pages/mobile/partner/DashboardPage'));
const PartnerProjects = lazy(() => import('@hr/pages/partner/ProjectsPage'));
const PartnerProjectsMobile = lazy(() => import('@hr/pages/mobile/partner/ProjectsPage'));
const PartnerEmployees = lazy(() => import('@hr/pages/partner/EmployeesPage'));
const PartnerEmployeesMobile = lazy(() => import('@hr/pages/mobile/partner/EmployeesPage'));
const PartnerTimesheets = lazy(() => import('@hr/pages/partner/TimesheetsPage'));
const PartnerTimesheetsMobile = lazy(() => import('@hr/pages/mobile/partner/TimesheetsPage'));
const PartnerPaymentHistory = lazy(() => import('@hr/pages/partner/PaymentHistoryPage'));
const AccountantPage = lazy(() => import('@hr/pages/accountant/AccountantPage'));
const EmployeeRouter = lazy(() => import('@hr/pages/employee/EmployeeRouter'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

const ROLE_NAV: Record<AppRole, Array<{ label: string; path: string }>> = {
  admin: [
    { label: 'Overview', path: 'dashboard' },
    { label: 'Employees', path: 'employees' },
    { label: 'Projects', path: 'projects' },
    { label: 'Timesheets', path: 'timesheets' },
    { label: 'Ledger', path: 'ledger' },
    { label: 'Advance payments', path: 'advance-payments' },
    { label: 'Wallet', path: 'wallet' },
    { label: 'Payment history', path: 'payment-history' },
    { label: 'Tax calculator', path: 'tax-calculator' },
    { label: 'Users', path: 'users' },
    { label: 'Settings', path: 'settings' },
  ],
  partner: [
    { label: 'Overview', path: 'dashboard' },
    { label: 'Projects', path: 'projects' },
    { label: 'Employees', path: 'employees' },
    { label: 'Timesheets', path: 'timesheets' },
    { label: 'Payment history', path: 'payment-history' },
  ],
  accountant: [{ label: 'Payroll', path: 'dashboard' }],
  employee: [{ label: 'My payroll', path: 'dashboard' }],
  adv_partner: [],
};

const PageLoading = () => (
  <div className="flex min-h-40 items-center justify-center text-sm text-slate-500" role="status">
    Loading attendance…
  </div>
);

const Responsive = ({
  desktop,
  mobile,
}: {
  desktop: React.ComponentType;
  mobile: React.ComponentType;
}) => <ResponsivePage desktopComponent={desktop} mobileComponent={mobile} />;

const AdminRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Responsive desktop={AdminDashboard} mobile={AdminDashboardMobile} />} />
    <Route path="employees" element={<Responsive desktop={AdminEmployees} mobile={AdminEmployeesMobile} />} />
    <Route path="projects" element={<Responsive desktop={AdminProjects} mobile={AdminProjectsMobile} />} />
    <Route path="timesheets" element={<Responsive desktop={AdminTimesheets} mobile={AdminTimesheetsMobile} />} />
    <Route path="ledger" element={<Responsive desktop={AdminLedger} mobile={AdminLedgerMobile} />} />
    <Route path="advance-payments" element={<Responsive desktop={AdminAdvancePayments} mobile={AdminAdvancePaymentsMobile} />} />
    <Route path="wallet" element={<Responsive desktop={AdminWallet} mobile={AdminWalletMobile} />} />
    <Route path="payment-history" element={<AdminPaymentHistory />} />
    <Route path="tax-calculator" element={<AdminTaxCalculator />} />
    <Route path="users" element={<Responsive desktop={AdminUsers} mobile={AdminUsersMobile} />} />
    <Route path="settings" element={<Responsive desktop={AdminSettings} mobile={AdminSettingsMobile} />} />
    <Route path="*" element={<Navigate to="dashboard" replace />} />
  </Routes>
);

const PartnerRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Responsive desktop={PartnerDashboard} mobile={PartnerDashboardMobile} />} />
    <Route path="projects" element={<Responsive desktop={PartnerProjects} mobile={PartnerProjectsMobile} />} />
    <Route path="employees" element={<Responsive desktop={PartnerEmployees} mobile={PartnerEmployeesMobile} />} />
    <Route path="timesheets" element={<Responsive desktop={PartnerTimesheets} mobile={PartnerTimesheetsMobile} />} />
    <Route path="payment-history" element={<PartnerPaymentHistory />} />
    <Route path="*" element={<Navigate to="dashboard" replace />} />
  </Routes>
);

const PayrollRoutes = ({ role }: { role: AppRole }) => {
  if (role === 'admin') return <AdminRoutes />;
  if (role === 'partner') return <PartnerRoutes />;
  if (role === 'accountant') {
    return (
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AccountantPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    );
  }
  if (role === 'employee') {
    return (
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard/*" element={<EmployeeRouter />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    );
  }
  return <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">This RestPoint role is not mapped to an HR workspace.</div>;
};

const HrPayrollWorkspace = () => {
  const { user, loading } = useRestPointAuth();
  const { slug } = useParams();
  const role = mapRestPointRole(user?.role);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add('hr-payroll-active');
    if (role === 'admin') root.classList.add('admin-route-active');
    if (role === 'partner') root.classList.add('partner-route-active');
    return () => {
      root.classList.remove('hr-payroll-active', 'admin-route-active', 'partner-route-active');
    };
  }, [role]);

  if (loading) return <PageLoading />;
  if (!hasSession() || !role) {
    return (
      <section className="mx-auto my-8 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">HR access is unavailable</h1>
        <p className="mt-2 text-sm">Sign in through RestPoint with an authorized tenant role to access HR &amp; Payroll.</p>
      </section>
    );
  }

  const navItems = ROLE_NAV[role] || [];

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <section
          className="hr-payroll-workspace min-w-0 p-4 sm:p-6"
          data-hr-payroll=""
          data-admin-ui={role === 'admin' ? '' : undefined}
          data-partner-ui={role === 'partner' ? '' : undefined}
        >
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link to={`/${slug}/hr`} className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                RestPoint HR
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">HR &amp; Payroll</h1>
            </div>
          </header>

          <div className="mb-5 space-y-3" role="status">
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Payroll screens are connected to the RestPoint HR workspace. Payroll data remains unavailable until RestPoint identity mapping and tenant-isolated storage are verified; payroll API calls and separate payroll sign-in stay disabled.
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <h2 className="font-semibold text-slate-900">ZKTeco K40 attendance</h2>
              <p className="mt-1">
                Assign each employee a unique ID on the K40, then enrol their fingerprint using the terminal's user
                management menu. Fingerprint templates stay on the device; the supplied SDK can read users and
                attendance logs but does not enrol fingerprint templates. Cloud sync still needs an office connector
                that sends records over an outbound encrypted connection. Do not expose the terminal directly to the
                internet. The connector is not configured yet.
              </p>
            </div>
          </div>

          <nav aria-label="HR and payroll" className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `shrink-0 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Suspense fallback={<PageLoading />}>
            <PayrollRoutes role={role} />
          </Suspense>
        </section>
      </AppProviders>
    </QueryClientProvider>
  );
};

export default HrPayrollWorkspace;
