import { Routes, Route, useParams, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';


const NotificationBell = lazy(() => import('../components/notifications/NotificationBell'))
const FooterComponent = lazy(() => import('../components/layout/globalFooter'))
import { useTenantStore } from '../modules/seo/useTenantStore';
import ModernSidebar from '../components/layout/ModernSidebar';
import { useAuth } from '../utils/context/AuthContext';
import Loader from '../components/loader/loader';
import { tenantApi } from '../api/tenant.api';

const UpcomingIntegrations = lazy(() => import('../modules/integrations/UpcomingIntegrations'));
const ChamaWelfareManagement = lazy(() => import('../modules/landing/ChamaWelfareManagement'));
const SACCOFuneralInsurance = lazy(() => import('../modules/landing/SACCOFuneralInsurance'));
const ChurchFuneralWelfare = lazy(() => import('../modules/landing/ChurchFuneralWelfare'));
const FuneralHomeSoftware = lazy(() => import('../modules/landing/FuneralHomeSoftware'));
const OnboardingFlow = lazy(() => import('../modules/onboarding/OnboardingFlow'));
const InsurancePage = lazy(() => import('../modules/insurance/insurance'));
const MemorialPage = lazy(() => import('../modules/memorial/MemorialPage'));
const LandingPage = lazy(() => import('../modules/landing/LandingPage'));

// SEO Pages - Topic Cluster
const FuneralHomeManagementSoftware = lazy(() => import('../modules/seo/FuneralHomeManagementSoftware'));
const MortuaryManagementSoftware = lazy(() => import('../modules/seo/MortuaryManagementSoftware'));
const HospitalMortuarySoftware = lazy(() => import('../modules/seo/HospitalMortuarySoftware'));
const HearseManagementSoftware = lazy(() => import('../modules/seo/HearseManagementSoftware'));
const MortuaryBillingSoftware = lazy(() => import('../modules/seo/MortuaryBillingSoftware'));
const PricingPage = lazy(() => import('../modules/seo/PricingPage'));

// Blog and Resource Pages
const BlogIndex = lazy(() => import('../modules/blog/BlogIndex'));
const BereavementManagementGuide = lazy(() => import('../modules/blog/BereavementManagementGuide'));
const MemberContributionsGuide = lazy(() => import('../modules/blog/MemberContributionsGuide'));
const FuneralWelfareGuide = lazy(() => import('../modules/blog/FuneralWelfareGuide'));
const FutureDeathCareGuide = lazy(() => import('../modules/blog/FutureDeathCareGuide'));
const ArchitectureOfBlooms = lazy(() => import('../modules/blog/Journals/ArchitectureOfBlooms'));

// Comparison Pages
const BestChurchSoftwareKenya = lazy(() => import('../modules/compare/BestChurchSoftwareKenya'));
const BestSACCOWelfareSoftware = lazy(() => import('../modules/compare/BestSACCOWelfareSoftware'));
const RestPointVsExcel = lazy(() => import('../modules/compare/RestPointVsExcel'));
const ManualVsDigital = lazy(() => import('../modules/compare/ManualVsDigital'));


// Tools and Resources
const NairobiFuneralWelfare = lazy(() => import('../modules/locations/NairobiFuneralWelfare'));
const CalculatorsPage = lazy(() => import('../modules/resources/CalculatorsPage'));
const TemplatesPage = lazy(() => import('../modules/resources/TemplatesPage'));
const GlossaryPage = lazy(() => import('../modules/resources/GlossaryPage'));
const LogsPage = lazy(() => import('../modules/resources/LogsPage'));

// Location Pages
const LocationPage = lazy(() => import('../modules/locations/LocationPage'));
const PrivacyPolicy = lazy(() => import('../modules/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../modules/pages/TermsOfService'));
const AccountDeletion = lazy(() => import('../modules/pages/AccountDeletion'));
const DataMigrationPolicy = lazy(() => import('../modules/pages/DataMigrationPolicy'));
const SecurityPolicy = lazy(() => import('../modules/pages/securityPolicy'));
const SLAPolicy = lazy(() => import('../modules/pages/slaPolicy'));
const ReleasePolicy = lazy(() => import('../modules/pages/releasePolicy'));
const CookiesPolicy = lazy(() => import('../modules/pages/CookiesPolicy'));
const SupportPage = lazy(() => import('../components/support/SupportPage'));
const AdminSupportDashboard = lazy(() => import('../components/support/AdminSupportDashboard'));
const WhyUsPage = lazy(() => import('../modules/pages/WhyUsPage'));
const AboutPage = lazy(() => import('../modules/pages/AboutPage'));
const ContactPage = lazy(() => import('../modules/pages/ContactPage'));
const WeltTallisAbout = lazy(() => import('../modules/about/WeltTallisAbout'));
const LoginPage = lazy(() => import('../components/auth/login'));
const PortalLoginPage = lazy(() => import('../components/auth/PortalLogin'));
const ReceptionPortal = lazy(() => import('../components/reception/ReceptionPortal'));
const PostmortemResults = lazy(() => import('../components/reception/PostmortemResults'));
const PostmortemQRPage = lazy(() => import('../components/reception/PostmortemQRPage'));
const PostmortemRequestForm = lazy(() => import('../components/reception/PostmortemRequestForm'));
const PostmortemPortal = lazy(() => import('../components/deceased/postmortem/postmortem-portal'));
import PostmortemVerifyPage from '../components/reception/PostmortemVerifyPage';
import PostmortemResultsPage from '../components/reception/PostmortemResultsPage';
const ForgotPassword = lazy(() => import('../components/auth/ForgotPassword'));
const ChangePassword = lazy(() => import('../components/auth/changePassword'));
const InvoiceManager = lazy(() => import('../components/invoices/invoicemanager'));
const DocumentsPage = lazy(() => import('../components/documents/documentspage'));
const StoreDashboard = lazy(() => import('../modules/store'));
const DeceasedRegistrationForm = lazy(() => import('../components/deceased/register/deceasedIntake'));
const RegisterCoffin = lazy(() => import('../components/coffins/registerCoffin'));
const CoffinInventory = lazy(() => import('../components/coffins/coffininventory'));
const CoffinInventoryDashboard = lazy(() => import('../components/dashboard/CoffinInventoryDashboard'));
const CoffinDetails = lazy(() => import('../components/coffins/coffinDetails'));
const CoffinRequests = lazy(() => import('../components/analysis/coffinRequests'));
const DeceasedList = lazy(() => import('../components/deceased/allDeceased/listDeceased'));
const NotFound = lazy(() => import('../components/layout/notFound'));
const DeceasedDetails = lazy(() => import('../components/deceased/deceasedinfo/deceasedDetailPage'));
const FinancialDetailsPage = lazy(() => import('../components/deceased/financialDetails/FinancialDetailsPage'));
const DashboardPage = lazy(() => import('../components/pages/DashboardPage'));
const DeceasedInfoSection = lazy(() => import('../components/deceased/deceasedInfoSection'));
const DeceasedAnalytics = lazy(() => import('../components/deceased/deceasedAnalytics'));

const SettingsPage = lazy(() => import('../components/settings/SettingsPage'));
const ReleaseFormPage = lazy(() => import('../components/deceased/register/deceasedRelease'));
const PostmortemFormPage = lazy(() => import('../components/deceased/deceasedinfo/PostmortemFormPage'));
const UserManagement = lazy(() => import('../components/modals/users'));

// Landing-page live previews — real modules rendered inside sandboxed iframes
// by the bento grid on the marketing site (modules/landing/imageCard.jsx)
const LivePreviewHost = lazy(() => import('../components/common/LivePreviewHost'));
const BodyIntakePreview = lazy(() => import('../components/deceased/register/deceasedIntake'));
const FlowerBookingsPreview = lazy(() => import('../components/florists/FlowerBookingsNew'));
const ReleaseFormPreview = lazy(() => import('../components/deceased/register/deceasedRelease'));
const ReceptionPortalPreview = lazy(() => import('../components/reception/ReceptionPortal'));
const PublicMemorialPage = lazy(() => import('../components/memorial/PublicMemorialPage'));
const ScannerSetupGuide = lazy(() => import('../modules/landing/scannerBridge'));


const ChemicalManagementDashboard = lazy(() => import('../components/chemicals/chemicals'));
const ChemicalInventoryAnalytics = lazy(() => import('../components/chemicals/chemicalAnalytics'));
const WorkshopDashboard = lazy(() => import('../components/workshop/pages/WorkshopDashboard'));
// Flower Booking System
const FlowerBookings = lazy(() => import('../components/florists/FlowerBookingsNew'));
const FlowerBookingForm = lazy(() => import('../components/florists/Samples'));
const FlowerOrderDetail = lazy(() => import('../components/florists/FlowerOrderDetail'));
const FlowerSamples = lazy(() => import('../components/florists/Samples'));
const RequestDetail = lazy(() => import('../components/analysis/RequestDetail'));

const HearseBookings = lazy(() => import('../components/hearse/hearseBookings'));
const DriverPortal = lazy(() => import('../components/Driver/DriverPortal'));
const LeaveDashboard = lazy(() => import('../components/leave/Dashboard'));
const ApplyLeave = lazy(() => import('../components/leave/ApplyLeave'));
const MyLeaves = lazy(() => import('../components/leave/MyLeaves'));


const RouteLoadingFallback = () => (
  <Loader text="Loading" color="#0e3345" />
);

// System Admin Dashboard — lazy-loaded ONCE at module level (never inside render)
const AdminSys = lazy(() => import('../components/support/adminsys'));

// Read the logged-in user's role from storage.
// AuthContext persists `role` in the safe user object at login time.
const getStoredUserRole = () => {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    return raw ? (JSON.parse(raw)?.role || '') : '';
  } catch {
    return '';
  }
};

const isAdminUser = () => getStoredUserRole() === 'systemadmin';

const normalizeDeploymentType = (value, branchCount = 0, metadata = {}) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'single' || normalized === 'multi') return normalized;

  const branchTotal = Number(branchCount || metadata?.branchCount || 0);
  if (metadata?.deploymentType === 'single' || metadata?.deploymentType === 'multi') {
    return metadata.deploymentType;
  }

  return branchTotal > 1 ? 'multi' : 'single';
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Validating session" color="#0e3345" />;
  }

  if (!user || !user.isAuthenticated) {
    // Preserve tenantSlug so we don't redirect to 'default'
    const slug = localStorage.getItem('tenantSlug');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    // Restore tenantSlug after clearing
    if (slug) localStorage.setItem('tenantSlug', slug);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
};

const DashboardLayout = ({ children, tenantData, tenantSlug }) => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const slug = tenantSlug || urlSlug;
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  // Determine deployment type: single tenant vs multi-branch.
  // Prefer the tenant metadata we actually fetched and ignore stale browser
  // values that would incorrectly force a tenant into multi-branch mode.
  const deploymentType = normalizeDeploymentType(
    tenantData?.deploymentType || localStorage.getItem('deploymentType'),
    tenantData?.branchCount || 0,
    tenantData || {}
  );

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('tenantSlug');
    navigate('/login');
  };

  const handleSidebarToggle = (isOpen) => setSidebarOpen(isOpen);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Every deployment type (single tenant included) now reserves sidebar space
  // on large screens so the persistent desktop sidebar panel is always visible.
  const marginLeft = isMobile ? '0' : (sidebarOpen ? '200px' : '60px');
  const contentPadding = isMobile ? '0.5rem' : (sidebarOpen ? '0.75rem 1rem 0.75rem 0.25rem' : '0.75rem');
  const footerMarginLeft = isMobile ? '0' : (sidebarOpen ? '200px' : '60px');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F9FB', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <ModernSidebar
          tenantData={tenantData}
          deploymentType={deploymentType}
          tenantSlug={slug}
          userData={{ name: user?.full_name || user?.name, role: user?.role || 'Administrator' }}
          onLogout={handleLogout}
          onToggle={handleSidebarToggle}
        />
        <main style={{ flex: 1, marginLeft, padding: contentPadding, background: '#F7F9FB', transition: 'margin-left 0.3s ease, padding 0.3s ease' }}>
          <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
        </main>
      </div>
      <div style={{ marginLeft: footerMarginLeft, transition: 'margin-left 0.3s ease' }}>
        <FooterComponent />
      </div>
    </div>
  );
};

const TenantResolver = () => {
  const { slug } = useParams();
  const { setTenantData, setLoading, error, setError, tenantData } = useTenantStore();
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();
  const location = useLocation();
  const cacheKey = `tenant_cache_${slug}`;

  const resolveTenantSlug = () => {
    let tenantSlug = slug;
    if (!tenantSlug || tenantSlug === 'dashboard' || tenantSlug === 'default' || tenantSlug === 'undefined' || tenantSlug === 'null') {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      tenantSlug = user?.tenantSlug || user?.branchDbName || user?.branchSlug || user?.tenant_slug || user?.parentTenantSlug || localStorage.getItem('tenantSlug') || '';
    }
    return tenantSlug;
  };

  const resolvedSlug = resolveTenantSlug();

  useEffect(() => {
    if (slug && (slug === 'dashboard' || slug === 'default' || slug === 'undefined' || slug === 'null') && resolvedSlug && resolvedSlug !== slug) {
      const restPath = location.pathname.replace(`/tenant/${slug}`, '') || '/all-deceased';
      navigate(`/tenant/${resolvedSlug}${restPath}`, { replace: true });
    }
  }, [slug, resolvedSlug, location.pathname, navigate]);

  useEffect(() => {
    let cancelled = false;
    const fetchTenant = async () => {
      const memoryCache = (window.__tenantCache ||= {});
      const cached = memoryCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < 300000) {
        if (!cancelled) {
          setTenantData(cached.data);
          document.documentElement.style.setProperty('--tenant-primary', cached.data.primaryColor || '#2b5a82');
          document.title = `${cached.data.name || resolvedSlug} | REST POINT`;
        }
        return;
      }
      try {
        let tenantSlug = resolvedSlug;
        if (!tenantSlug || tenantSlug === 'dashboard' || tenantSlug === 'default' || tenantSlug === 'undefined' || tenantSlug === 'null') {
          console.error('Invalid tenant slug in URL:', slug);
          navigate('/login', { replace: true });
          return;
        }

        localStorage.setItem('tenantSlug', tenantSlug);

        const data = await tenantApi.getBranding(tenantSlug);
        const settingsResult = await tenantApi.getTenantSettings();
        const settings = settingsResult?.data || {};
        const branchesResult = await tenantApi.getBranches();
        const branches = branchesResult?.data || branchesResult || [];
        const branchCount = Array.isArray(branches) ? branches.length : 0;

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const hasBranchAssignment = user?.branchId !== null && user?.branchId !== undefined;
        const hasParentTenant = !!user?.parentTenantSlug;
        const hasBranchDbName = !!user?.branchDbName;
        const isMultiBranch = hasBranchAssignment || hasParentTenant || hasBranchDbName || branchCount > 1;

        const loginDeploymentType = localStorage.getItem('deploymentType');
        const effectiveDeploymentType = normalizeDeploymentType(
          settings?.deploymentType || data?.deploymentType || loginDeploymentType,
          branchCount,
          { ...settings, ...data, branchCount }
        );

        if (!cancelled) {
          const safeData = {
            ...(data || {}),
            name: data?.name || settings?.tenantName || resolvedSlug,
            deploymentType: effectiveDeploymentType,
            branchCount: branchCount,
            branches: data?.branches || branches || (branchCount > 0 ? [{ name: settings?.tenantName || resolvedSlug }] : []),
            tenantName: settings?.tenantName || data?.name || resolvedSlug,
            tenantSlug: settings?.tenantSlug || resolvedSlug,
            country: settings?.country || data?.country,
            location: settings?.location || data?.location,
            email: settings?.email || data?.email
          };

          memoryCache[cacheKey] = { data: safeData, timestamp: Date.now() };
          setTenantData(safeData);
          document.documentElement.style.setProperty('--tenant-primary', safeData.primaryColor || '#2b5a82');
          document.title = `${safeData.name || resolvedSlug} | REST POINT`;

          if (safeData.deploymentType) {
            localStorage.setItem('deploymentType', safeData.deploymentType);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Tenant fetch error:', err);
          setError('Tenant not found: ' + err.message);
          navigate('/login', { replace: true });
        }
      }
    };
    if (slug && token) { fetchTenant(); } else if (!token) { navigate('/login', { replace: true }); }
    return () => { cancelled = true; };
  }, [slug, resolvedSlug, setTenantData, setError, token, navigate, cacheKey]);

  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }
  return <TenantDashboardRoutes tenantData={tenantData || {}} tenantSlug={resolvedSlug} />;
};

// ============================================================
// REMOVED: RoleBasedRoute - Now allowing direct access to all pages
// ============================================================

const TenantDashboardRoutes = ({ tenantData, tenantSlug: propTenantSlug }) => {
  const { slug: urlSlug } = useParams();
  const location = useLocation();

  // Use the resolved tenant slug from TenantResolver, falling back to URL slug
  const slug = propTenantSlug || urlSlug;

  // Always use DashboardLayout with sidebar for all users
  const Layout = DashboardLayout;

  // Hide the notification bell on public-facing client forms (receptionist,
  // deceased registration and release form pages).
  const isClientPage =
    location.pathname.includes('/receptionist') ||
    location.pathname.includes('/deceased/register') ||
    location.pathname.includes('/release-form') ||
    location.pathname.includes('/flower-samples') ||
    location.pathname.includes('/flowers/new');
  const showNotificationBell = !isClientPage;

  return (
    <>
      {showNotificationBell && <NotificationBell />}
      <Routes>
        <Route path="/" element={<TenantRootRedirect slug={slug} />} />

        {/* Dashboard - Standalone full-screen (no global sidebar); nav via top header drawer */}
        <Route path="dashboard" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <DashboardRoleGate tenantSlug={slug} tenantData={tenantData} />
          </Suspense>
        } />

        {/* Scanner Setup Guide - Public page */}
        <Route path="scanner" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <ScannerSetupGuide />
          </Suspense>
        } />

        {/* Analytics - All authenticated users (same standalone dashboard) */}
        <Route path="analytics" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <DashboardPage tenantSlug={slug} tenantData={tenantData} />
          </Suspense>
        } />

        {/* Deceased Analytics - All authenticated users */}
        <Route path="deceased/analytics" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><DeceasedAnalytics /></Layout>
        } />

        {/* Deceased Management - All authenticated users */}
        <Route path="all-deceased" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><DeceasedList /></Layout>
        } />

        <Route path="deceased" element={
          <DeceasedRouteSwitch tenantData={tenantData} slug={slug} />
        } />

        <Route path="deceased/register" element={
          <DeceasedRegistrationForm />
        } />

        {/* Legacy path-style deceased URLs (/deceased/XXX) → redirect to /deceased?id=XXX */}
        <Route path="deceased/:id" element={<TenantDeceasedIdRedirect />} />

        <Route path="deceased-details/:id" element={<TenantDeceasedIdRedirect />} />

        {/* Financial Details */}
        <Route path="financials/:id" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><FinancialDetailsPage /></Layout>
        } />

        {/* Legacy deceased routes - redirect to tenant slug format */}
        <Route path="/deceased/:id" element={<LegacyDeceasedRedirect />} />

        {/* Coffins - All authenticated users */}
        <Route path="coffins" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><CoffinInventory /></Layout>
        } />

        <Route path="coffins/dashboard" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><CoffinInventoryDashboard /></Layout>
        } />

        <Route path="coffins/register" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><RegisterCoffin /></Layout>
        } />

        <Route path="coffins/:coffinId/details" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><CoffinDetails /></Layout>
        } />

        {/* Branch Requests - All authenticated users */}
        <Route path="requests" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><CoffinRequests /></Layout>
        } />
        <Route path="requests/:id" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><RequestDetail /></Layout>
        } />

        {/* Documents - All authenticated users */}
        <Route path="documents/:deceasedId" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><DocumentsPage /></Layout>
        } />

        {/* Invoices - All authenticated users */}
        <Route path="invoices" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><InvoiceManager /></Layout>
        } />

        {/* Chemicals - All authenticated users */}
        <Route path="chemicals" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><ChemicalInventoryAnalytics /></Layout>
        } />

        <Route path="chemicals/analytics" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><ChemicalInventoryAnalytics /></Layout>
        } />

        {/* Workshop - All authenticated users */}
        <Route path="workshop" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><WorkshopDashboard /></Layout>
        } />

        {/* Settings - All authenticated users */}
        <Route path="settings" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><SettingsPage /></Layout>
        } />

        {/* Release Form */}
        <Route path="release-form/:id" element={
          <ReleaseFormPage />
        } />

        {/* Postmortem Examination Form */}
        <Route path="postmortem-form/:deceased_id" element={
          <PostmortemFormPage />
        } />

        {/* Memorial - Public access */}
        <Route path="memorial/:tenantSlug/:deceasedId" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><PublicMemorialPage /></Layout>
        } />
        <Route path="memorial/:tenantSlug/:deceasedId/:token" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><PublicMemorialPage /></Layout>
        } />

        {/* User Management - All authenticated users */}
        <Route path="users" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><UserManagement /></Layout>
        } />

        {/* Flower Booking - All authenticated users */}
        <Route path="flowers" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><FlowerBookings /></Layout>
        } />

        <Route path="flowers/new" element={
          <FlowerBookingForm />
        } />

        <Route path="flowers/order/:id" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><FlowerOrderDetail /></Layout>
        } />

        {/* Flower Samples - standalone user-facing gallery (Instagram-story style) */}
        <Route path="flower-samples" element={
          <FlowerSamples />
        } />

        {/* Hearse - All authenticated users */}
        <Route path="hearse" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><HearseBookings /></Layout>
        } />

        {/* Mini Store - All authenticated users */}
        <Route path="mini-store" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><StoreDashboard /></Layout>
        } />
        <Route path="store" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><StoreDashboard /></Layout>
        } />

        {/* Driver Portal - Standalone without sidebar */}
        <Route path="driver-portal" element={
          <DriverPortal />
        } />

        {/* Receptionist Portal - Standalone without sidebar */}
        <Route path="receptionist" element={
          <ReceptionPortal />
        } />

        {/* Postmortem Results - Standalone without sidebar */}
        <Route path="postmortem-results" element={
          <PostmortemResults />
        } />

        {/* Postmortem QR Code Page - Standalone without sidebar */}
        <Route path="postmortem-qr" element={
          <PostmortemQRPage />
        } />

        {/* Leave Management - All authenticated users */}
        <Route path="leaves" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><LeaveDashboard /></Layout>
        } />

        <Route path="leaves/apply" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><ApplyLeave /></Layout>
        } />

        <Route path="leaves/my-leaves" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><MyLeaves /></Layout>
        } />

        {/* Support - All authenticated users */}
        <Route path="support" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><SupportPage /></Layout>
        } />

        {/* Admin Support Dashboard - All authenticated users */}
        <Route path="support-dashboard" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><AdminSupportDashboard /></Layout>
        } />

        {/* System Admin Dashboard - role-guarded, reachable under /tenant/:slug/system-admin */}
        <Route path="system-admin" element={<SystemAdminRoute />} />

        {/* 404 */}
        <Route path="*" element={
          <Layout tenantData={tenantData} tenantSlug={slug}><NotFound /></Layout>
        } />
      </Routes>
    </>
  );
};

// System Admin Route Guard
const SystemAdminRoute = () => {
  const { user } = useAuth();
  const tenantSlug = localStorage.getItem('tenantSlug') || user?.tenantSlug || '';

  // Only allow systemadmin role (checks AuthContext user AND persisted storage)
  if (user?.role !== 'systemadmin' && !isAdminUser()) {
    return <Navigate to={`/tenant/${tenantSlug}/dashboard`} replace />;
  }

  // Render the system admin dashboard
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <AdminSys />
    </Suspense>
  );
};

// Gate on the tenant dashboard route: system admins are bounced to the
// System Admin console immediately after login instead of the tenant dashboard,
// and drivers are always sent to the driver portal (their dashboard).
const DashboardRoleGate = ({ tenantSlug, tenantData }) => {
  if (isAdminUser()) {
    return <Navigate to="/system-admin" replace />;
  }
  if (getStoredUserRole() === 'driver') {
    return <Navigate to={`/tenant/${tenantSlug}/driver-portal`} replace />;
  }
  return <DashboardPage tenantSlug={tenantSlug} tenantData={tenantData} />;
};

// Tenant root redirect: keep drivers inside the driver portal only.
const TenantRootRedirect = ({ slug }) => {
  if (getStoredUserRole() === 'driver') {
    return <Navigate to={`/tenant/${slug}/driver-portal`} replace />;
  }
  return <Navigate to="all-deceased" replace />;
};

/* /tenant/:slug/deceased          → deceased LIST
   /tenant/:slug/deceased?id=XXX   → deceased DETAILS for XXX (query-param URL format) */
const DeceasedRouteSwitch = ({ tenantData, slug }) => {
  const [searchParams] = useSearchParams();
  const hasId = !!searchParams.get('id');
  return hasId ? (
    <DashboardLayout tenantData={tenantData} tenantSlug={slug}><DeceasedDetails /></DashboardLayout>
  ) : (
    <DashboardLayout tenantData={tenantData} tenantSlug={slug}><DeceasedList /></DashboardLayout>
  );
};

/* Redirect old path-style deceased URLs (/deceased/XXX, /deceased-details/XXX)
   to the current query-param format /deceased?id=XXX */
const TenantDeceasedIdRedirect = () => {
  const navigate = useNavigate();
  const { slug: slugParam, id } = useParams();

  useEffect(() => {
    const slug = slugParam || localStorage.getItem('tenantSlug') || '';
    navigate(`/tenant/${slug}/deceased?id=${encodeURIComponent(id || '')}`, { replace: true });
  }, [navigate, slugParam, id]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

const LegacyDeceasedRedirect = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const tenantSlug = localStorage.getItem('tenantSlug') || '';
    navigate(`/tenant/${tenantSlug}/deceased?id=${encodeURIComponent(id || '')}`, { replace: true });
  }, [navigate, id]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    const urlSlug = location.pathname.match(/\/tenant\/([^\/]+)/)?.[1];
    const storedTenantSlug = localStorage.getItem('tenantSlug');
    let userTenantSlug = '';
    if (userStr) { try { const u = JSON.parse(userStr); userTenantSlug = u.tenantSlug || u.branchDbName || u.branchSlug || u.tenant_slug || u.parentTenantSlug || ''; } catch (e) { console.error('Error parsing user', e); } }

    let finalSlug = (urlSlug && urlSlug !== 'default' && urlSlug !== 'dashboard') ? urlSlug : (storedTenantSlug || userTenantSlug || '');

    if (!finalSlug || finalSlug === 'dashboard' || finalSlug === 'default' || finalSlug === 'login') {
      navigate('/login', { replace: true });
      return;
    }

    if (user?.role === 'systemadmin' || isAdminUser()) {
      navigate('/system-admin', { replace: true });
      return;
    }

    if (user?.role === 'driver') {
      navigate(`/tenant/${finalSlug}/driver-portal`, { replace: true });
      return;
    }

    if (from && from !== '/login' && from !== '/') { navigate(`/tenant/${finalSlug}${from}`, { replace: true }); } else { navigate(`/tenant/${finalSlug}/dashboard`, { replace: true }); }
  }, [navigate, location]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading dashboard...</p>
      </div>
    </div>
  );
};

const AppRouter = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/solutions/churches" element={<ChurchFuneralWelfare />} />
      <Route path="/solutions/saccos" element={<SACCOFuneralInsurance />} />
      <Route path="/solutions/chamas" element={<ChamaWelfareManagement />} />
      <Route path="/solutions/funeral-homes" element={<FuneralHomeSoftware />} />
      <Route path="/register" element={<OnboardingFlow />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/portal" element={<Navigate to="/portal/login" replace />} />
      <Route path="/reception" element={<ReceptionPortal />} />
      <Route path="/insurance" element={<InsurancePage />} />
      <Route path="/memorial" element={<MemorialPage />} />
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route path="/integrations" element={<UpcomingIntegrations />} />

      {/* Public scanner setup page used by the main navigation. */}
      <Route path="/scanner" element={<ScannerSetupGuide />} />

      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/security" element={<SecurityPolicy />} />
      <Route path="/account-deletion" element={<AccountDeletion />} />
      <Route path="/data-migration" element={<DataMigrationPolicy />} />
      <Route path="/security" element={<SecurityPolicy />} />
      <Route path="/sla" element={<SLAPolicy />} />
      <Route path="/releases" element={<ReleasePolicy />} />
      <Route path="/cookies" element={<CookiesPolicy />} />
      <Route path="/why-us" element={<WhyUsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/about-welt-tallis" element={<WeltTallisAbout />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/support/:slug" element={<SupportPage />} />

      {/* System Admin Dashboard - Protected route for systemadmin role */}
      <Route path="/system-admin" element={
        <ProtectedRoute>
          <SystemAdminRoute />
        </ProtectedRoute>
      } />

      // SEO Topic Cluster Routes
      <Route path="/mortuary-management-software" element={<MortuaryManagementSoftware />} />
      <Route path="/funeral-home-management-software" element={<FuneralHomeManagementSoftware />} />
      <Route path="/hospital-mortuary-software" element={<HospitalMortuarySoftware />} />
      <Route path="/hearse-management" element={<HearseManagementSoftware />} />
      <Route path="/mortuary-billing" element={<MortuaryBillingSoftware />} />
      <Route path="/pricing" element={<PricingPage />} />

      // Blog and Resource Routes
      <Route path="/blog" element={<Navigate to="/blog/architecture-of-blooms" replace />} />
      <Route path="/blog/stories" element={<BlogIndex />} />
      <Route path="/blog/funeral-welfare-management" element={<FuneralWelfareGuide />} />
      <Route path="/blog/bereavement-management" element={<BereavementManagementGuide />} />
      <Route path="/blog/member-contributions" element={<MemberContributionsGuide />} />
      <Route path="/blog/future-of-death-care-software-restpoint" element={<FutureDeathCareGuide />} />
      <Route path="/blog/architecture-of-blooms" element={<ArchitectureOfBlooms />} />

      // Comparison Routes
      <Route path="/compare/restpoint-vs-excel" element={<RestPointVsExcel />} />
      <Route path="/compare/manual-vs-digital" element={<ManualVsDigital />} />
      <Route path="/compare/best-church-software-kenya" element={<BestChurchSoftwareKenya />} />
      <Route path="/compare/best-sacco-welfare-software" element={<BestSACCOWelfareSoftware />} />

      // Tools and Resources Routes
      <Route path="/calculators" element={<CalculatorsPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/glossary" element={<GlossaryPage />} />
      <Route path="/resources/logs" element={<LogsPage />} />

      // Location Routes
      <Route path="/locations/nairobi" element={<NairobiFuneralWelfare />} />
      <Route path="/locations/:city" element={<LocationPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
      <Route path="/dashboard/*" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

      {/* Public Postmortem Routes */}
      <Route path="/tenant/:slug/postmortem-qr" element={<PostmortemQRPage />} />
      <Route path="/tenant/:slug/postmortem-request" element={<PostmortemRequestForm />} />
      <Route path="/tenant/:slug/postmortem-verify" element={<PostmortemVerifyPage />} />
      <Route path="/tenant/:slug/postmortem/results/:sessionId" element={<PostmortemResultsPage />} />
      <Route path="/tenant/:slug/release-form/:id" element={<ReleaseFormPage />} />
      <Route path="/postmortem/verify" element={<PostmortemVerifyPage />} />
      <Route path="/postmortem/request" element={<PostmortemRequestForm />} />
      <Route path="/postmortem/results/:sessionId" element={<PostmortemResultsPage />} />

      {/* Main Tenant Route - All authenticated routes */}
      <Route path="/tenant/:slug/*" element={<ProtectedRoute><TenantResolver /></ProtectedRoute>} />

      {/* Mini Store - standalone mini POS / stock module */}
      <Route path="/store" element={<StoreDashboard />} />
      <Route path="/mini-store" element={<StoreDashboard />} />

      {/* Landing-page live previews — real modules shown inside the bento grid
          cards via sandboxed iframes (see modules/landing/imageCard.jsx).
          Public on purpose: visitors must see how each module looks. */}
      <Route path="/preview/body-intake" element={<LivePreviewHost><BodyIntakePreview /></LivePreviewHost>} />
      <Route path="/preview/flower-bookings" element={<LivePreviewHost><FlowerBookingsPreview /></LivePreviewHost>} />
      <Route path="/preview/release-form" element={<LivePreviewHost><ReleaseFormPreview /></LivePreviewHost>} />
      <Route path="/preview/reception-portal" element={<LivePreviewHost><ReceptionPortalPreview /></LivePreviewHost>} />

      <Route path="*" element={<LandingPage />} />

    </Routes>
  </Suspense>
);

export default AppRouter;