import React, { lazy, Suspense } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth as useRestPointAuth } from '../utils/context/AuthContext.jsx';
import { hasSession } from '../utils/globalAuth.js';
import { AppProviders } from './contexts';
import { mapRestPointRole } from './contexts/AuthContext';
import type { AppRole } from './lib/auth';
import './styles/integration.css';

const AdminEmployees = lazy(() => import('@hr/pages/admin/EmployeesPage'));
const AdminTaxCalculator = lazy(() => import('@hr/pages/admin/TaxCalculatorPage'));
const HRCalendar = lazy(() => import('@hr/pages/admin/HRCalendarPage'));
const PartnerEmployees = lazy(() => import('@hr/pages/partner/EmployeesPage'));
const EmployeeRouter = lazy(() => import('@hr/pages/employee/EmployeeRouter'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

const ROLE_NAV: Partial<Record<AppRole, Array<{ label: string; path: string }>>> = {
  admin: [
    { label: 'Calendar & attendance', path: 'calendar' },
    { label: 'Employees', path: 'employees' },
    { label: 'Payroll taxes', path: 'taxes' },
  ],
  partner: [
    { label: 'Calendar & attendance', path: 'calendar' },
    { label: 'Employees', path: 'employees' },
  ],
  employee: [{ label: 'My payslips', path: 'dashboard' }],
  adv_partner: [],
};

const PageLoading = () => (
  <div className="flex min-h-40 items-center justify-center text-sm text-slate-500" role="status">
    Loading HR workspace…
  </div>
);

const AdminRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="calendar" replace />} />
    <Route path="calendar" element={<HRCalendar />} />
    <Route path="employees" element={<AdminEmployees />} />
    <Route path="taxes" element={<AdminTaxCalculator />} />
    <Route path="*" element={<Navigate to="calendar" replace />} />
  </Routes>
);

const PartnerRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="calendar" replace />} />
    <Route path="calendar" element={<HRCalendar />} />
    <Route path="employees" element={<PartnerEmployees />} />
    <Route path="*" element={<Navigate to="calendar" replace />} />
  </Routes>
);

const PayrollRoutes = ({ role }: { role: AppRole }) => {
  if (role === 'admin') return <AdminRoutes />;
  if (role === 'partner') return <PartnerRoutes />;
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
  const mappedRole = mapRestPointRole(user?.role);
  const role = mappedRole === 'accountant' ? null : mappedRole;

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

          <div className="mb-5" role="note">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              A focused HR workspace for the attendance calendar, employee records, and Kenya payroll tax estimates.
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
