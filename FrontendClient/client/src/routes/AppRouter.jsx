import { Routes, Route, useParams, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';


const NotificationBell = lazy(() => import('../components/notifications/NotificationBell'))
import { shouldShowNotificationBell } from '../components/notifications/bellVisibility';
const FooterComponent = lazy(() => import('../components/layout/globalFooter'))
import { useTenantStore } from '../modules/seo/useTenantStore';
import ModernSidebar from '../components/layout/ModernSidebar';
import { hasSession, getTenantSlug } from '../utils/globalAuth';
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
// Amani Cover (Montenzuma Monalisa) — the public funeral-insurance site, split
// across several routes so no single page becomes a wall of text:
//   /amani/cover        → landing (what it is + how to apply)
//   /amani/cover/apply  → the application document on its own page
//   /amani/cover/terms  → eligibility, waiting periods, exclusions, claims
//   /amani/cover/refer  → referral pitch + referral form
//   /amani/claims       → submit a claim (for people who already hold cover)
//   /amani/payments     → how to make a contribution
// /insurance is untouched and still serves the Rest Point B2B page.
const AmaniCoverPage = lazy(() => import('../modules/insurance/amani/AmaniCover'));
const AmaniTermsPage = lazy(() => import('../modules/insurance/amani/AmaniTerms'));
const AmaniReferPage = lazy(() => import('../modules/insurance/amani/AmaniRefer'));
const AmaniApplyPage = lazy(() => import('../modules/insurance/amani/AmaniApply'));
const AmaniClaimsPage = lazy(() => import('../modules/insurance/amani/AmaniClaims'));
const AmaniTrackClaimPage = lazy(() => import('../modules/insurance/amani/AmaniTrackClaim'));
const AmaniPaymentsPage = lazy(() => import('../modules/insurance/amani/AmaniPayments'));
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

const BereavementManagementGuide = lazy(() => import('../modules/blog/BereavementManagementGuide'));
const ArchitectureOfBlooms = lazy(() => import('../modules/blog/Journals/ArchitectureOfBlooms'));
const MemberContributionsGuide = lazy(() => import('../modules/blog/MemberContributionsGuide'));
const FuneralWelfareGuide = lazy(() => import('../modules/blog/FuneralWelfareGuide'));
const FutureDeathCareGuide = lazy(() => import('../modules/blog/FutureDeathCareGuide'));
const BlogIndex = lazy(() => import('../modules/blog/BlogIndex'));

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
const AdminSupportDashboard = lazy(() => import('../components/support/AdminSupportDashboard'));
const DataMigrationPolicy = lazy(() => import('../modules/pages/DataMigrationPolicy'));
const LocationPage = lazy(() => import('../modules/locations/LocationPage'));
const PrivacyPolicy = lazy(() => import('../modules/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../modules/pages/TermsOfService'));
const AccountDeletion = lazy(() => import('../modules/pages/AccountDeletion'));

const SecurityPolicy = lazy(() => import('../modules/pages/securityPolicy'));
const SLAPolicy = lazy(() => import('../modules/pages/slaPolicy'));
const ReleasePolicy = lazy(() => import('../modules/pages/releasePolicy'));
const CookiesPolicy = lazy(() => import('../modules/pages/CookiesPolicy'));
const SupportPage = lazy(() => import('../components/support/SupportPage'));

const PostmortemRequestForm = lazy(() => import('../components/reception/PostmortemRequestForm'));
const PostmortemResults = lazy(() => import('../components/reception/PostmortemResults'));
const PostmortemQRPage = lazy(() => import('../components/reception/PostmortemQRPage'));
const ReceptionPortal = lazy(() => import('../components/reception/ReceptionPortal'));
const WeltTallisAbout = lazy(() => import('../modules/about/WeltTallisAbout'));
const PortalLoginPage = lazy(() => import('../components/auth/PortalLogin'));
const ContactPage = lazy(() => import('../modules/pages/ContactPage'));
const WhyUsPage = lazy(() => import('../modules/pages/WhyUsPage'));
const AboutPage = lazy(() => import('../modules/pages/AboutPage'));
const LoginPage = lazy(() => import('../components/auth/login'));


const FinancialDetailsPage = lazy(() => import('../components/deceased/financialDetails/FinancialDetailsPage'));
const DeceasedInfoSection = lazy(() => import('../components/deceased/deceasedProfile/deceasedInfoSection'));
const PostmortemFormPage = lazy(() => import('../components/deceased/deceasedProfile/PostmortemFormPage'));
const DeceasedDetails = lazy(() => import('../components/deceased/deceasedProfile/deceasedDetailPage'));
const DeceasedRegistrationForm = lazy(() => import('../components/deceased/register/deceasedIntake'));

const CoffinInventoryDashboard = lazy(() => import('../components/coffins/coffininventory'));
const ReleaseFormPage = lazy(() => import('../components/deceased/register/deceasedRelease'));
const DeceasedList = lazy(() => import('../components/deceased/allDeceased/listDeceased'));
const CoffinRequests = lazy(() => import('../components/analysis/coffinRequests'));
const CoffinInventory = lazy(() => import('../components/coffins/coffininventory'));
const InvoiceManager = lazy(() => import('../components/invoices/invoicemanager'));
const DocumentsPage = lazy(() => import('../components/documents/documentspage'));
const RegisterCoffin = lazy(() => import('../components/coffins/registerCoffin'));
const CoffinDetails = lazy(() => import('../components/coffins/coffinDetails'));
import PostmortemResultsPage from '../components/reception/PostmortemResultsPage';
import PostmortemVerifyPage from '../components/reception/PostmortemVerifyPage';
const ForgotPassword = lazy(() => import('../components/auth/ForgotPassword'));
const ChangePassword = lazy(() => import('../components/auth/changePassword'));
const DashboardPage = lazy(() => import('../components/pages/DashboardPage'));
const RestPointOsMonitor = lazy(() => import('../monitoring/RestPointOsMonitor'));
const SettingsPage = lazy(() => import('../components/settings/SettingsPage'));
const NotFound = lazy(() => import('../components/layout/notFound'));
const StoreDashboard = lazy(() => import('../modules/store'));

// Landing-page live previews — real modules rendered inside sandboxed iframes
// by the bento grid on the marketing site (modules/landing/imageCard.jsx)
const ChemicalInventoryAnalytics = lazy(() => import('../components/chemicals/chemicalAnalytics'));
const ReleaseFormPreview = lazy(() => import('../components/deceased/register/deceasedRelease'));
const WorkshopDashboard = lazy(() => import('../components/workshop/pages/WorkshopDashboard'));
const BodyIntakePreview = lazy(() => import('../components/deceased/register/deceasedIntake'));
const FlowerBookingsPreview = lazy(() => import('../components/florists/FlowerBookingsNew'));
const ReceptionPortalPreview = lazy(() => import('../components/reception/ReceptionPortal'));
const ChemicalManagementDashboard = lazy(() => import('../components/chemicals/chemicals'));
const PublicMemorialPage = lazy(() => import('../components/memorial/PublicMemorialPage'));
const LivePreviewHost = lazy(() => import('../components/common/LivePreviewHost'));
const ScannerSetupGuide = lazy(() => import('../modules/landing/scannerBridge'));

// Flower Booking System
const FlowerOrderDetail = lazy(() => import('../components/florists/FlowerOrderDetail'));
const FlowerBookings = lazy(() => import('../components/florists/FlowerBookingsNew'));
const RequestDetail = lazy(() => import('../components/analysis/RequestDetail'));
const FlowerBookingForm = lazy(() => import('../components/florists/Samples'));
const FlowerSamples = lazy(() => import('../components/florists/Samples'));


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

  // A live access token is enough to enter the app. The AuthContext may not
  // have hydrated the user object yet (fresh tab, storage event still in
  // flight), and this guard used to WIPE authToken/user from storage whenever
  // `user` was missing — permanently signing genuinely logged-in clients out
  // and bouncing them to /login on every navigation.
  if (!user && !hasSession()) {
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
    sessionStorage.clear();
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
    // 100dvh (not 100vh) on the outer shell: on mobile 100vh resolves to the
    // FULL viewport including the strip behind the collapsing URL bar, so a
    // "100vh" shell was always taller than the screen the user could see.
    <div className="rp-app-shell" style={{ minHeight: '100dvh' }}>
      <style>{`
        .rp-app-shell{
          display:flex;
          flex-direction:column;
          background:#F7F9FB;
          /* Belt-and-braces: nothing inside the dashboard may scroll the page
             sideways. Wide tables scroll inside their own .panel wrapper. */
          max-width:100%;
          /* "clip", NOT "hidden": overflow-x:hidden would turn this shell into a
             scroll container, which silently breaks every position:sticky header
             inside it (the financials topbar, monitor header, ...). "clip" contains
             the overflow without creating a scrollport, so sticky still works. */
          overflow-x:clip;
        }
        .rp-app-body{ min-height:0; }
        /* The floating menu button (ModernSidebar's MobileMenuButton /
           SingleTenantMenuButton) is position:fixed at bottom:18px, 52px tall
           on the LEFT edge, so at full scroll it lands on top of the footer.
           A lane is reserved so the button never covers the copyright /
           WhatsApp links.

           The reserve is padding on the DARK FOOTER BAR ITSELF
           (.rp-app-footer > footer), never on the .rp-app-footer wrapper.
           Padding on the wrapper reserved a transparent strip BELOW the bar,
           so the dark footer looked raised with a band of empty space under it
           on every tenant page (deceased profile + list, mini store, apply
           leave, support). Pushing the bar's own bottom padding grows the bar
           into the lane instead: the background stays continuous and the
           button lands on the dark bar, where its white fill and shadow stay
           visible.

           Specificity note: styled-components compiles FooterBar to a single
           class, so this element+class selector (0,1,1) outranks it (0,1,0)
           and wins regardless of stylesheet injection order. */
        @media (max-width:767px){
          .rp-app-footer > footer{
            padding-bottom:calc(76px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
      {/* minWidth:0 — a flex item defaults to min-width:auto, so ONE wide child
          (the store's 620px table, a long settings row) used to stretch this row
          past the viewport and give the whole page a horizontal scrollbar. */}
      <div className="rp-app-body" style={{ display: 'flex', flex: '1 0 auto', position: 'relative', minWidth: 0 }}>
        <ModernSidebar
          tenantData={tenantData}
          deploymentType={deploymentType}
          tenantSlug={slug}
          userData={{ name: user?.full_name || user?.name, role: user?.role || 'Administrator' }}
          onLogout={handleLogout}
          onToggle={handleSidebarToggle}
        />
        <main style={{ flex: 1, minWidth: 0, marginLeft, padding: contentPadding, background: '#F7F9FB', transition: 'margin-left 0.3s ease, padding 0.3s ease' }}>
          <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
        </main>
      </div>
      {/* The footer is a sibling of the content, not inside it. Pages that set
          their own min-height:100vh used to add a SECOND full viewport before
          this footer, which is what left it hanging past the fold with empty
          space underneath. Pages are now free to size to their content. */}
      <div className="rp-app-footer" style={{ marginLeft: footerMarginLeft, transition: 'margin-left 0.3s ease' }}>
        <FooterComponent />
      </div>
    </div>
  );
};

const TenantResolver = () => {
  const { slug } = useParams();
  const { setTenantData, setLoading, error, setError, tenantData } = useTenantStore();
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
      // Strip the placeholder tenant segment (legacy /tenant/<bad> or /<bad>).
      const restPath = location.pathname.replace(/^\/tenant\/[^/]+/, '').replace(/^\/[^/]+/, '') || '/all-deceased';
      navigate(`/${resolvedSlug}${restPath}`, { replace: true });
    }
  }, [slug, resolvedSlug, location.pathname, navigate]);

  useEffect(() => {
    let cancelled = false;

    // ── Persist resolved tenant branding to localStorage ──────────────────
    // getTenantBrandingFromStorage() (the intake/release forms' last-resort
    // fallback) reads these exact keys, but nothing ever wrote them — so any
    // form that rendered before the Zustand store resolved showed blank
    // tenant details. Writing them here keeps that fallback chain real.
    const persistTenantBranding = (data, settings = {}) => {
      try {
        const pick = (...vals) => {
          for (const v of vals) {
            if (v !== undefined && v !== null && String(v).trim() !== '') return v;
          }
          return '';
        };
        const map = {
          tenantName: pick(data?.name, data?.tenantName, settings?.tenantName),
          tenantEmail: pick(data?.email, settings?.email, settings?.tenantEmail),
          tenantPhone: pick(data?.phone, settings?.phone, settings?.tenantPhone),
          tenantLocation: pick(data?.location, settings?.location, settings?.tenantLocation),
          tenantCountry: pick(data?.country, settings?.country, settings?.tenantCountry),
          tenantAddress: pick(data?.address, settings?.address, settings?.tenantAddress),
          tenantLogoUrl: pick(data?.logoUrl, data?.logo_url, data?.logo, settings?.logoUrl, settings?.logo_url, settings?.logo),
        };
        Object.entries(map).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, String(value));
        });
      } catch { /* storage unavailable — branding still works via the store */ }
    };

    const fetchTenant = async () => {
      const memoryCache = (window.__tenantCache ||= {});
      const cached = memoryCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < 300000) {
        if (!cancelled) {
          setTenantData(cached.data);
          persistTenantBranding(cached.data);
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
          persistTenantBranding(safeData, settings);
          document.documentElement.style.setProperty('--tenant-primary', safeData.primaryColor || '#2b5a82');
          document.title = `${safeData.name || resolvedSlug} | REST POINT`;

          if (safeData.deploymentType) {
            localStorage.setItem('deploymentType', safeData.deploymentType);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Tenant fetch error:', err);
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            // The session really is dead — only now is /login the right answer.
            setError('Your session has expired. Please log in again.');
            navigate('/login', { replace: true });
          } else {
            // A network blip, timeout or 5xx must NEVER sign a user out.
            // Keep rendering the app (the tenant store simply stays empty)
            // instead of dumping a signed-in client on the login screen.
            setError('Could not load tenant details: ' + (err.message || 'network error'));
          }
        }
      }
    };
    if (slug && token) { fetchTenant(); } else if (!token) { navigate('/login', { replace: true }); }
    return () => { cancelled = true; };
  }, [slug, resolvedSlug, setTenantData, setError, token, navigate, cacheKey]);

  if (!hasSession()) {
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

  // Hide the notification bell on the standalone / public-facing screens where
  // the floating overlay would cover page content or simply isn't wanted:
  // body intake form, body release form, drivers portal, the dashboard (and
  // its analytics twin), the reception portal, the flower screens, the
  // workshop and the mini store.
  // The matcher strips the tenant slug first, so a tenant slug that happens to
  // be called "dashboard" can never hide the bell by accident.
  const showNotificationBell = shouldShowNotificationBell(location.pathname);

  return (
    <>
      {showNotificationBell && <NotificationBell />}
      <Routes>
        <Route path="/" element={<TenantRootRedirect slug={slug} />} />

        {/* Dashboard — wrapped in DashboardLayout so the global ModernSidebar
            side panel is visible here, exactly like every other tenant page. */}
        <Route path="dashboard" element={
          <Layout tenantData={tenantData} tenantSlug={slug}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <DashboardRoleGate tenantSlug={slug} tenantData={tenantData} />
            </Suspense>
          </Layout>
        } />

        {/* Scanner Setup Guide - Public page */}
        <Route path="scanner" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <ScannerSetupGuide />
          </Suspense>
        } />

        {/* Infrastructure Monitor — real gateway / Redis / BullMQ telemetry */}
        <Route path="monitoring" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <RestPointOsMonitor />
          </Suspense>
        } />

        {/* Analytics - All authenticated users (same standalone dashboard) */}
        <Route path="analytics" element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <DashboardPage tenantSlug={slug} tenantData={tenantData} />
          </Suspense>
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

        {/* Store Journal — the Journal is no longer a standalone destination.
            The Store, with its Calendar + History journal, is a tab inside the
            Operations dashboard's Workshop module, which is where the nav now
            sends people. This redirect is kept deliberately: the old
            /workshop/store-journal URL is already in bookmarks, browser history
            and any links sent to staff, and a redirect lands them on a working
            screen instead of a 404. `replace` so Back does not bounce straight
            back into the redirect. */}
        <Route path="workshop/store-journal" element={
          <Navigate to={`/${slug}/dashboard`} replace />
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

        {/* System Admin Dashboard - role-guarded, reachable under /<slug>/system-admin */}
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
    return <Navigate to={`/${tenantSlug}/deceased`} replace />;
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
    return <Navigate to={`/${tenantSlug}/driver-portal`} replace />;
  }
  return <DashboardPage tenantSlug={tenantSlug} tenantData={tenantData} />;
};

// Tenant root redirect: keep drivers inside the driver portal only.
const TenantRootRedirect = ({ slug }) => {
  if (getStoredUserRole() === 'driver') {
    return <Navigate to={`/${slug}/driver-portal`} replace />;
  }
  return <Navigate to="deceased" replace />;
};

/* /<slug>/deceased          → deceased LIST
   /<slug>/deceased?id=XXX   → deceased DETAILS for XXX (query-param URL format) */
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
    navigate(`/${slug}/deceased?id=${encodeURIComponent(id || '')}`, { replace: true });
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
    navigate(`/${tenantSlug}/deceased?id=${encodeURIComponent(id || '')}`, { replace: true });
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

/* ── Legacy URL compatibility ────────────────────────────────────────────
   Tenant pages used to live at /tenant/<slug>/<page>; they now live at
   /<slug>/<page>. Every old link — a bookmark, an installed-PWA start URL, a
   postmortem QR code, a printed intake sheet — is redirected to the new URL
   while keeping the rest of the path, query string and hash intact. */
const LegacyTenantRedirect = () => {
  const { slug } = useParams();
  const location = useLocation();
  const rest = location.pathname.replace(/^\/tenant\/[^/]+/, '');
  return <Navigate to={`/${slug}${rest}${location.search}${location.hash}`} replace />;
};

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: ctxUser } = useAuth();
  // `state.from` is set by ProtectedRoute; `?open=` lets the PWA shortcuts
  // (manifest.json) deep-link into a tenant page without knowing the slug.
  const from = location.state?.from?.pathname
    || new URLSearchParams(location.search).get('open')
    || null;
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let storedUser = {};
    try {
      storedUser = userStr ? JSON.parse(userStr) : {};
    } catch (e) {
      console.error('Error parsing user', e);
      storedUser = {};
    }
    // Fall back to the AuthContext identity (which is rebuilt from the JWT
    // claims when the stored `user` blob is missing) so role checks still work
    // for a recovered session.
    const user = Object.keys(storedUser).length ? storedUser : (ctxUser || {});

    // The tenant slug is either the first path segment (/acme/deceased) or,
    // for legacy links, the second one (/tenant/acme/deceased).
    const parts = location.pathname.split('/').filter(Boolean);
    const urlSlug = parts[0] === 'tenant' ? parts[1] : parts[0];
    const storedTenantSlug = localStorage.getItem('tenantSlug');
    const userTenantSlug = user.tenantSlug || user.branchDbName || user.branchSlug || user.tenant_slug || user.parentTenantSlug || '';

    let finalSlug = (urlSlug && urlSlug !== 'default' && urlSlug !== 'dashboard') ? urlSlug : (storedTenantSlug || userTenantSlug || '');

    if (!finalSlug || finalSlug === 'dashboard' || finalSlug === 'default' || finalSlug === 'login') {
      // Full recovery chain: parentTenantSlug key → stored `user` blob → JWT
      // claims (getTenantSlug). Single-branch ("normal") clients whose login
      // response carried no branch info used to fail this check and get
      // dumped on /login even though they were perfectly signed in.
      finalSlug = getTenantSlug();
    }

    if (!finalSlug || finalSlug === 'dashboard' || finalSlug === 'default' || finalSlug === 'login') {
      if (hasSession()) {
        // We ARE signed in, but nothing (storage or token) can say which
        // tenant this session belongs to. Clear the unusable session once
        // instead of ping-ponging between /dashboard and /login forever.
        ['authToken', 'token', 'refreshToken', 'user', 'tenantId', 'branchId'].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
      }
      navigate('/login', { replace: true });
      return;
    }

    // Heal storage so API headers and later navigations reuse the same slug.
    const currentStored = localStorage.getItem('tenantSlug');
    if (!currentStored || currentStored === 'undefined' || currentStored === 'null' || currentStored === 'dashboard' || currentStored === 'default') {
      localStorage.setItem('tenantSlug', finalSlug);
    }

    if (user?.role === 'systemadmin' || isAdminUser()) {
      navigate('/system-admin', { replace: true });
      return;
    }

    if (user?.role === 'driver') {
      navigate(`/${finalSlug}/driver-portal`, { replace: true });
      return;
    }

    // Default landing after login / app entry is ALWAYS the deceased
    // register — never the dashboard. Resume a deep link only when the
    // router handed us a specific `from` destination.
    if (from && from !== '/login' && from !== '/') { navigate(`/${finalSlug}${from}`, { replace: true }); } else { navigate(`/${finalSlug}/deceased`, { replace: true }); }
  }, [navigate, location, ctxUser]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading deceased records...</p>
      </div>
    </div>
  );
};

// Root entry point: signed-in users go straight into the app (the deceased
// register), everyone else gets the real HOME page instead of a login wall —
// the landing page (and its Scanner download link at /scanner) used to be
// unreachable because `/` always redirected to /login.
const RootRedirect = () => {
  if (hasSession()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
};

const AppRouter = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
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
      <Route path="/amani/cover" element={<AmaniCoverPage />} />
      <Route path="/amani/cover/apply" element={<AmaniApplyPage />} />
      <Route path="/amani/cover/terms" element={<AmaniTermsPage />} />
      <Route path="/amani/cover/refer" element={<AmaniReferPage />} />
      <Route path="/amani/claims" element={<AmaniClaimsPage />} />
      <Route path="/amani/claims/track" element={<AmaniTrackClaimPage />} />
      <Route path="/amani/payments" element={<AmaniPaymentsPage />} />
      <Route path="/p/:code" element={<AmaniPaymentsPage />} />
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

      {/* Public Postmortem / release routes — slug-first URLs (/<slug>/...) */}
      <Route path="/:slug/postmortem-qr" element={<PostmortemQRPage />} />
      <Route path="/:slug/postmortem-request" element={<PostmortemRequestForm />} />
      <Route path="/:slug/postmortem-verify" element={<PostmortemVerifyPage />} />
      <Route path="/:slug/postmortem/results/:sessionId" element={<PostmortemResultsPage />} />
      <Route path="/:slug/release-form/:id" element={<ReleaseFormPage />} />
      <Route path="/postmortem/verify" element={<PostmortemVerifyPage />} />
      <Route path="/postmortem/request" element={<PostmortemRequestForm />} />
      <Route path="/postmortem/results/:sessionId" element={<PostmortemResultsPage />} />

      {/* Public marketing namespaces. Unknown paths inside them must keep
          falling back to the landing page (like the final `*` route) instead of
          being swallowed by the dynamic /<slug>/* tenant route below. */}
      <Route path="/solutions/*" element={<LandingPage />} />
      <Route path="/blog/*" element={<LandingPage />} />
      <Route path="/compare/*" element={<LandingPage />} />
      <Route path="/locations/*" element={<LandingPage />} />
      <Route path="/resources/*" element={<LandingPage />} />
      <Route path="/preview/*" element={<LandingPage />} />

      {/* Legacy /tenant/<slug>/... URLs → the slug-first equivalent. */}
      <Route path="/tenant" element={<Navigate to="/dashboard" replace />} />
      <Route path="/tenant/*" element={<LegacyTenantRedirect />} />

      {/* Main Tenant Route - All authenticated routes (slug-first: /<slug>/…) */}
      <Route path="/:slug/*" element={<ProtectedRoute><TenantResolver /></ProtectedRoute>} />

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