
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';
import api from '../../api/axios';
import { getTenantBrandingFromStorage, rebaseUploadUrl } from '../../utils/tenantResolver/tenantBranding';

// Read the raw stored user from either storage (state can be stale/null).
const resolveStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}') || {};
    } catch {
        return {};
    }
};

// Roles allowed to manage users. Normalized lowercase for reliable comparison
// ('Admin', 'ADMIN', etc.) plus common variants written by different services.
const USER_ADMIN_ROLES = ['admin', 'manager', 'systemadmin', 'system_administrator', 'tenant_admin'];
const isUserManager = (user) => USER_ADMIN_ROLES.includes(String(user?.role || '').toLowerCase());



const THEME = {
    colors: {
        ink: '#15171A',
        bone: '#FAF8F4',
        bone2: '#F3EFE6',
        brass: '#8B7355',
        brassHover: '#A98F6E',
        verdigris: '#3D4F47',
        line: '#E3DDD0',
        gray: '#6B6862',
        white: '#FFFFFF',
        success: '#475A43',
        successBg: '#EEF3EC',
        red: '#9B4A3F',
        redBg: '#F7ECE9',
        shadow: 'rgba(21,23,26,0.12)',
    },
    spacing: {
        xs: '0.3rem',
        sm: '0.55rem',
        md: '0.78rem',
        lg: '1.1rem',
        xl: '1.5rem',
        xxl: '2rem',
    },
};

// Shared styling for the editable Organization Information inputs.
const FIELD_LABEL_STYLE = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: THEME.colors.gray,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.35rem',
};

const FIELD_INPUT_STYLE = {
    width: '100%',
    padding: '0.6rem 0.7rem',
    border: `1px solid ${THEME.colors.line}`,
    borderRadius: '4px',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    color: THEME.colors.ink,
    background: THEME.colors.white,
    outline: 'none',
};

export default function SettingsPage() {
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(resolveStoredUser());
    const [formError, setFormError] = useState('');
    const [error, setError] = useState(null);
    const [assigningBranch, setAssigningBranch] = useState(null);
    const [homeCharges, setHomeCharges] = useState({ chargeType: 'daily', currency: 'KES', dailyRate: '', hourlyRate: '', usdRate: '130' });
    const [homeChargesLoading, setHomeChargesLoading] = useState(false);
    const [homeChargesSaving, setHomeChargesSaving] = useState(false);

    // ── Organization information (Settings → Organization) ───────────────────
    // Name / phone / email / location / country + logo are stored on the
    // tenant's master record; managers edit them here.
    const [orgForm, setOrgForm] = useState({
        tenantName: '',
        phone: '',
        email: '',
        location: '',
        country: '',
    });
    const [orgSaving, setOrgSaving] = useState(false);
    const [orgStatus, setOrgStatus] = useState(null); // { type: 'success' | 'error', message }
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef(null);

    const [userForm, setUserForm] = useState({
        email: '',
        username: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'staff',
        branch_id: '',
    });

    // The tenant-level data (settings, users, branches) all live in the PARENT
    // tenant's database. For multi-tenant / multi-branch organizations the
    // current slug can be a BRANCH slug (e.g. "...-machakos") which is NOT a
    // real tenant — findBySubdomain() can't resolve it, so /tenant/:slug/branches
    // 404s. Therefore the PARENT tenant slug ALWAYS takes top priority for
    // fetching this data; branch scope is applied separately via branchId/branchSlug.
    const cachedUser = resolveStoredUser();
    const parentSlug =
        cachedUser?.parentTenantSlug ||
        localStorage.getItem('parentTenantSlug') ||
        '';

    const slugCandidates = (() => {
        const seen = new Set();
        const push = (v) => { if (v && !seen.has(v)) { seen.add(v); } };
        // Parent tenant slug first — authoritative tenant for branches/users/settings.
        push(parentSlug);
        // Then the URL slug, which is the canonical /<slug> route. For a
        // single-tenant (no parent) this IS the tenant slug.
        push(urlSlug);
        // Then the current user's own tenant slug / stored tenant slug, restricted
        // to the logged-in user's tenant so we never render another org's data.
        push(cachedUser?.tenantSlug);
        if (!parentSlug) push(localStorage.getItem('tenantSlug'));
        return [...seen];
    })();
    let tenantSlug = slugCandidates[0] || '';

    const loadData = async () => {
        setLoading(true);

        const fetchAll = async (slug) => {
            const [settingsRes, usersRes, branchesRes] = await Promise.all([
                api.get(ENDPOINTS.TENANT.SETTINGS(slug)),
                api.get(ENDPOINTS.TENANT.USERS(slug)),
                api.get(ENDPOINTS.TENANT.BRANCHES(slug)),
            ]);
            return {
                settings: settingsRes.data?.data || null,
                users: usersRes.data?.data || [],
                branches: branchesRes.data?.data || [],
            };
        };

        try {
            let data = null;
            let lastErr = null;
            for (const slug of slugCandidates) {
                if (!slug) continue;
                try {
                    data = await fetchAll(slug);
                    tenantSlug = slug;
                    break;
                } catch (err) {
                    lastErr = err;
                    console.warn(`[Settings] tenant lookup failed for "${slug}" (${err?.response?.status || err?.message})`);
                }
            }
            if (!data) throw lastErr || new Error('No tenant slug resolved');

            // The effective tenant slug — always the parent for multi-branch orgs.
            setSettings(data.settings);
            setUsers(data.users);
            setBranches(data.branches);
            setError(null);
        } catch (error) {
            console.error('Failed to load settings:', error);
            // If the user navigated to a slug that doesn't exist, tell them the
            // URL is wrong instead of silently showing another tenant's data.
            let message = error.response?.data?.message || 'Please check the tenant and try again.';
            if (urlSlug && urlSlug !== parentSlug) {
                message = `The tenant "${urlSlug}" was not found. Check that the URL uses the parent tenant slug.`;
            }
            setError(`Failed to load settings: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadHomeCharges = async () => {
        setHomeChargesLoading(true);
        try {
            const response = await api.get(ENDPOINTS.DECEASED.CHARGE_SETTINGS('__DEFAULT__'));
            const data = response.data?.data || {};
            setHomeCharges({
                chargeType: data.chargeType || 'daily',
                currency: data.currency || 'KES',
                dailyRate: data.dailyRate || '',
                hourlyRate: data.hourlyRate || '',
                usdRate: data.usdRate || '130',
            });
        } catch (err) {
            console.error('Failed to load home charge settings:', err);
        } finally {
            setHomeChargesLoading(false);
        }
    };

    const saveHomeCharges = async (event) => {
        event.preventDefault();
        const dailyRate = Number(homeCharges.dailyRate || 0);
        const hourlyRate = Number(homeCharges.hourlyRate || 0);
        if (homeCharges.chargeType === 'daily' && dailyRate <= 0) {
            setError('Enter a positive default daily charge.');
            return;
        }
        if (homeCharges.chargeType === 'hourly' && hourlyRate <= 0) {
            setError('Enter a positive default hourly charge.');
            return;
        }
        setHomeChargesSaving(true);
        try {
            await api.put(ENDPOINTS.DECEASED.UPDATE_CHARGE_SETTINGS('__DEFAULT__'), {
                rateProfile: 'standard',
                ...homeCharges,
                dailyRate,
                hourlyRate,
                usdRate: Number(homeCharges.usdRate || 0),
                isHomeDefault: true,
            });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save default care charges.');
        } finally {
            setHomeChargesSaving(false);
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try { setCurrentUser(JSON.parse(userData)); } catch { /* ignore */ }
            const user = resolveStoredUser();

            // Redirect drivers to driver portal (tenant-scoped route).
            // The driver-portal page only exists under /<slug>/driver-portal.
            if (user.role === 'driver') {
                const navSlug = user.branchSlug || user.parentTenantSlug || user.tenantSlug || tenantSlug || urlSlug;
                navigate(`/${navSlug}/driver-portal`);
                return;
            }
        }
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormError('');

        // A branch MUST be chosen on multi-branch organizations so every new
        // user always logs in to the correct branch (never null/main).
        const activeBranches = branches.filter((b) => b.is_active === undefined || b.is_active === true || b.is_active === 1);
        if (!userForm.branch_id) {
            if (activeBranches.length > 1) {
                setFormError('Please select the branch this user belongs to.');
                return;
            }
            if (activeBranches.length === 1) {
                setUserForm((prev) => ({ ...prev, branch_id: String(activeBranches[0].branch_id) }));
            }
        }

        try {
            const payload = {
                ...userForm,
                // The user is always owned by THIS tenant and assigned to a
                // branch — tenant_id + branch_id decide where they log in.
                tenant_id: cachedUser?.tenantId
                    || cachedUser?.tenant_id
                    || localStorage.getItem('tenantId')
                    || sessionStorage.getItem('tenantId')
                    || null,
                // Backend requires a unique username — auto-derive from the
                // email when the admin leaves it empty.
                username: (userForm.username || userForm.email || '').trim().toLowerCase(),
                branch_id: userForm.branch_id || (activeBranches.length === 1 ? String(activeBranches[0].branch_id) : null),
            };

            await api.post(ENDPOINTS.TENANT.CREATE_USER(tenantSlug), payload);
            setShowAddUserModal(false);
            setFormError('');
            setUserForm({ email: '', username: '', password: '', full_name: '', phone: '', role: 'staff', branch_id: '' });
            loadData();
        } catch (error) {
            console.error('Failed to add user:', error);
            setFormError(error.response?.data?.message || 'Failed to add user. Please try again.');
        }
    };

    // Open the Add-User modal with the branch PRESELECTED to the MAIN/PARENT
    // branch — the default for new users is always the parent branch. On
    // multi-branch orgs the admin can then switch to any specific branch.
    // The MAIN/PARENT branch is the one with no parent (parent_branch_id NULL)
    // or the is_main flag — it is always the tenant's own (parent) database.
    const isMainBranch = (b) => b.is_main === 1 || b.is_main === true || b.parent_branch_id === null || b.parent_branch_id === undefined;
    const openAddUserModal = () => {
        const activeBranches = branches.filter((b) => b.is_active === undefined || b.is_active === true || b.is_active === 1);
        const main = activeBranches.find(isMainBranch) || activeBranches[0];
        setUserForm({
            email: '',
            username: '',
            password: '',
            full_name: '',
            phone: '',
            role: 'staff',
            branch_id: main ? String(main.branch_id) : '',
        });
        setFormError('');
        setShowAddUserModal(true);
    };

    // Reassign an existing user to a branch. Users ALWAYS carry tenant_id +
    // branch_id, so this decides which tenant DB + branch the user logs in to.
    const handleAssignBranch = async (user, branchId) => {
        if (!branchId || String(branchId) === String(user.branch_id || '')) return;
        setAssigningBranch(user.user_id);
        setError(null);
        try {
            await api.put(ENDPOINTS.TENANT.UPDATE_USER_BRANCH(tenantSlug, user.user_id), { branch_id: branchId });
            setUsers((prev) => prev.map((u) => {
                if (u.user_id !== user.user_id) return u;
                const branch = branches.find((b) => String(b.branch_id) === String(branchId));
                return { ...u, branch_id: branchId, branch_name: branch ? branch.branch_name : u.branch_name };
            }));
        } catch (err) {
            console.error('Failed to assign branch:', err);
            setError(err.response?.data?.message || 'Failed to assign branch. Please try again.');
        } finally {
            setAssigningBranch(null);
        }
    };

    // Multi-branch detection: an org is "multi" if the backend says so OR the
    // loaded branch list has more than one entry. This keeps the Branch
    // Management tab + branch picker reliable even if `deploymentType` is
    // reported differently by the API.
    const isMultiTenant = settings?.deploymentType === 'multi' || branches.length > 1;
    // Roles are normalized + read from storage fallback so admins always see
    // the Users & Roles tab and the "Add User" functionality.
    const isAdmin = isUserManager(currentUser) || isUserManager(resolveStoredUser());
    const isManager = isAdmin;
    useEffect(() => {
        if (activeTab === 'charges' && isManager) loadHomeCharges();
    }, [activeTab, isManager]);
    const storedBranding = getTenantBrandingFromStorage();
    const rawLogoUrl = settings?.logoUrl || settings?.logo_url || settings?.logo || storedBranding.logoUrl;
    const companyLogo = rawLogoUrl
        ? rebaseUploadUrl(rawLogoUrl.startsWith('http') || rawLogoUrl.startsWith('data:')
            ? rawLogoUrl
            : `${env.UPLOADS_URL.replace(/\/$/, '')}/${rawLogoUrl.replace(/^\/+/, '')}`)
        : '';
    // Phone shown in the Organization Information banner: the real tenant
    // record first, then whatever login stored locally. Never a fake default.
    const displayPhone = settings?.phone || storedBranding.phone || '';

    // Mirror the loaded tenant record into the editable Organization form.
    // Runs on first load and again after every successful save.
    useEffect(() => {
        if (!settings) return;
        setOrgForm({
            tenantName: settings.tenantName || '',
            phone: settings.phone || storedBranding.phone || '',
            email: settings.email || '',
            location: settings.location || '',
            country: settings.country || '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    // Keep the login-time branding keys in sync with the edited organization so
    // every form/print header (which reads them via getTenantBrandingFromStorage)
    // shows the NEW name / phone / logo immediately — no re-login needed.
    const persistBrandingLocally = (patch) => {
        try {
            const storageMap = {
                tenantName: 'tenantName',
                phone: 'tenantPhone',
                email: 'tenantEmail',
                location: 'tenantLocation',
                country: 'tenantCountry',
                logoUrl: 'tenantLogoUrl',
            };
            Object.entries(storageMap).forEach(([key, storageKey]) => {
                const value = patch?.[key];
                // null (e.g. a cleared phone number) must overwrite the stale
                // stored value with an empty string, not leave the old one.
                if (value !== undefined) localStorage.setItem(storageKey, value === null ? '' : value);
            });
        } catch {
            // Storage can be unavailable (private mode / quota) — non-fatal.
        }
    };

    const saveOrganization = async (event) => {
        event.preventDefault();
        setOrgStatus(null);

        const name = orgForm.tenantName.trim();
        if (name.length < 2) {
            setOrgStatus({ type: 'error', message: 'Enter the organization name (at least 2 characters).' });
            return;
        }
        const email = orgForm.email.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setOrgStatus({ type: 'error', message: 'Enter a valid email address.' });
            return;
        }

        setOrgSaving(true);
        try {
            const response = await api.put(ENDPOINTS.TENANT.UPDATE_SETTINGS(tenantSlug), {
                tenantName: name,
                phone: orgForm.phone.trim(),
                email,
                location: orgForm.location.trim(),
                country: orgForm.country.trim(),
            });
            const updated = response.data?.data || {};
            setSettings((prev) => ({ ...prev, ...updated }));
            persistBrandingLocally(updated);
            setError(null);
            setOrgStatus({ type: 'success', message: response.data?.message || 'Organization information saved.' });
        } catch (err) {
            setOrgStatus({
                type: 'error',
                message: err.response?.data?.message || err.friendlyMessage || 'Failed to save organization information.',
            });
        } finally {
            setOrgSaving(false);
        }
    };

    const handleLogoFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setOrgStatus(null);

        if (!/^image\//i.test(file.type)) {
            setOrgStatus({ type: 'error', message: 'Choose an image file (JPG, PNG, GIF, WEBP or SVG).' });
            event.target.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setOrgStatus({ type: 'error', message: 'The logo must be 10MB or smaller.' });
            event.target.value = '';
            return;
        }

        setLogoUploading(true);
        try {
            const payload = new FormData();
            payload.append('logo', file);
            // Content-Type: null lets the BROWSER set multipart/form-data WITH
            // the boundary. Hand-setting 'multipart/form-data' omits the
            // boundary and multer rejects the request (400 Boundary not found).
            const response = await api.post(ENDPOINTS.TENANT.LOGO(tenantSlug), payload, {
                headers: { 'Content-Type': null },
            });
            const nextLogo = response.data?.data?.logoUrl || response.data?.data?.logo_url || '';
            setSettings((prev) => ({ ...prev, logoUrl: nextLogo, logo_url: nextLogo }));
            persistBrandingLocally({ logoUrl: nextLogo });
            setOrgStatus({ type: 'success', message: response.data?.message || 'Logo updated.' });
        } catch (err) {
            setOrgStatus({
                type: 'error',
                message: err.response?.data?.message || err.friendlyMessage || 'Failed to upload the logo.',
            });
        } finally {
            setLogoUploading(false);
            // Reset so re-selecting the SAME file fires onChange again.
            event.target.value = '';
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.colors.bone }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid ' + THEME.colors.line, borderTopColor: THEME.colors.brass, borderRadius: '50%', animation: 'spin 0.65s linear infinite', margin: '0 auto 1rem' }} />
                    <p style={{ color: THEME.colors.gray, fontSize: '0.88rem' }}>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rp-settings-root" style={{ minHeight: '100vh', background: THEME.colors.bone }}>
            {error && (
                <div className="rp-settings-pad" style={{
                    background: THEME.colors.redBg || '#fdecea',
                    color: THEME.colors.red,
                    borderBottom: '1px solid ' + (THEME.colors.redLine || '#f5c6c2'),
                    padding: '0.85rem 2rem',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    ⚠️ {error}
                </div>
            )}
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile responsiveness ────────────────────────────────────────────
           This page is styled almost entirely with inline styles, so the
           media-query rules below use !important to win over them on small
           screens. Nothing here applies above the breakpoints, so the desktop
           layout stays exactly as it was.

           Scoped to .rp-settings-root so these !important rules can never
           leak into other components rendered alongside this page. */
        .rp-settings-root {
          /* Long emails / URLs / slugs are the #1 cause of a page-level
             horizontal scrollbar. Wrapping them everywhere means no single
             string can ever widen the document. */
          overflow-wrap: anywhere;
        }
        .rp-settings-root table { width: 100%; }

        /* Tabs scroll horizontally at EVERY width, not just small screens.
           With enough tabs (Users / Branches / Organization) the row can
           overflow just above the 900px breakpoint too, where the old rules
           had nothing to say. Harmless when it fits. */
        .rp-settings-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .rp-settings-tabs button { flex: 0 0 auto; }

        /* Text columns in flex rows must be allowed to shrink, otherwise a
           long name forces the row wider than the viewport. */
        .rp-settings-header-meta,
        .rp-settings-branch-name,
        .rp-settings-modal-title { min-width: 0; overflow-wrap: anywhere; }

        /* ── Short viewports (landscape phones) ──────────────────────────────
           Width breakpoints never fire in landscape (~700x390), so the desktop
           layout was being crammed into a very short window. */
        @media (max-height: 520px) {
          .rp-settings-modal { align-items: flex-start !important; }
          .rp-settings-modal-panel { max-height: 92vh !important; }
        }

        @media (max-width: 1024px) {
          .rp-settings-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important; }
        }

        @media (max-width: 900px) {
          .rp-settings-pad { padding-left: 1rem !important; padding-right: 1rem !important; }
          .rp-settings-header { flex-direction: column !important; align-items: stretch !important; gap: 1rem !important; }
          .rp-settings-header-row { align-items: flex-start !important; }
          .rp-settings-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .rp-settings-tabs::-webkit-scrollbar { height: 0; }
          .rp-settings-tabs button { white-space: nowrap !important; flex: 0 0 auto; padding: 0.7rem 0.9rem !important; }
          .rp-settings-card { padding: 1rem !important; }
          .rp-settings-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important; }
          .rp-settings-form { max-width: 100% !important; }
          .rp-settings-modal { padding: 1rem !important; }
          .rp-settings-modal-panel { padding: 1.25rem !important; }
          .rp-settings-table { min-width: 680px; }
          .rp-settings-actions { flex-direction: column-reverse !important; }
          .rp-settings-actions > button { width: 100% !important; }
        }

        @media (max-width: 560px) {
          /* The dashboard layout already adds 0.5rem of gutters on phones, so
             the page keeps only a little of its own to avoid double spacing. */
          .rp-settings-pad { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .rp-settings-grid { grid-template-columns: 1fr !important; }
          .rp-settings-logo { width: 56px !important; height: 56px !important; padding: 4px !important; }
          .rp-settings-logo-sm { width: 44px !important; height: 44px !important; padding: 4px !important; }
          .rp-settings-title { font-size: 1.25rem !important; }
          .rp-settings-branches { grid-template-columns: 1fr !important; }
          .rp-settings-inline { flex-direction: column !important; align-items: flex-start !important; }

          /* Touch targets (44px is the platform minimum) — phones only, so
             tablets keep the lighter desktop density. Scoped to real controls
             on this page rather than naming buttons that may come and go. */
          .rp-settings-root button,
          .rp-settings-root input,
          .rp-settings-root select { min-height: 44px; }

          /* 16px stops iOS Safari from auto-zooming the page when a field is
             focused, which otherwise leaves the form zoomed in and unusable. */
          .rp-settings-root input,
          .rp-settings-root select,
          .rp-settings-root textarea { font-size: 16px !important; }

          /* Docked at the bottom and anchored to the real safe area so the
             buttons clear the iOS home indicator. */
          .rp-settings-modal { align-items: flex-end !important; padding: 0 !important; }
          .rp-settings-modal-panel {
            border-radius: 12px 12px 0 0 !important;
            max-height: 88vh !important;
            padding-bottom: calc(1.25rem + env(safe-area-inset-bottom)) !important;
          }

          /* Space below the sticky header for the notch in landscape. */
          .rp-settings-pad { padding-top: env(safe-area-inset-top) !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rp-settings-root *, .rp-settings-root *::before, .rp-settings-root *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

            {/* Header */}
            <div style={{ background: THEME.colors.white, borderBottom: `1px solid ${THEME.colors.line}`, padding: '1.5rem 0' }}>
                <div className="rp-settings-pad rp-settings-header" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="rp-settings-header-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt={`${settings?.tenantName || 'Company'} logo`}
                                className="rp-settings-logo-sm"
                                style={{ width: 54, height: 54, objectFit: 'contain', border: `1px solid ${THEME.colors.line}`, borderRadius: '8px', padding: '6px', background: THEME.colors.white }}
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            // No logo stored yet → placeholder with the org initial
                            // (instead of nothing) so the header never collapses and
                            // it's obvious a logo still needs uploading.
                            <div
                                className="rp-settings-logo-sm"
                                aria-hidden="true"
                                style={{
                                    width: 54,
                                    height: 54,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px dashed ${THEME.colors.line}`,
                                    borderRadius: '8px',
                                    background: THEME.colors.bone,
                                    color: THEME.colors.brass,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                }}
                            >
                                {(settings?.tenantName || 'O').trim().charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="rp-settings-header-meta">
                        <h1 className="rp-settings-title" style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '0.25rem' }}>
                            Settings
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: THEME.colors.gray }}>
                            {isMultiTenant ? 'Multi-Branch Organization' : 'Single Location'} • {settings?.branchCount} {isMultiTenant ? 'branches' : 'location'}
                        </p>
                        </div>
                    </div>
                    {isManager && (
                        <button
                            onClick={() => openAddUserModal()}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: THEME.colors.brass,
                                color: THEME.colors.white,
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            + Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Organization Info Banner */}
            <div className="rp-settings-pad" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div className="rp-settings-card" style={{
                    padding: '1.25rem 1.5rem',
                    background: THEME.colors.white,
                    border: `1px solid ${THEME.colors.line}`,
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                }}>
                    <div className="rp-settings-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: THEME.colors.ink }}>
                            Organization Information
                        </h3>
                        {isManager && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('organization')}
                                style={{
                                    padding: '0.45rem 0.9rem',
                                    background: activeTab === 'organization' ? THEME.colors.bone2 : THEME.colors.white,
                                    color: THEME.colors.brass,
                                    border: `1px solid ${THEME.colors.line}`,
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: 'pointer',
                                }}
                            >
                                Edit information
                            </button>
                        )}
                    </div>
                    {companyLogo && (
                        <div className="rp-settings-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${THEME.colors.line}` }}>
                            <img
                                src={companyLogo}
                                alt={`${settings?.tenantName || 'Company'} logo`}
                                className="rp-settings-logo"
                                style={{ width: 72, height: 72, objectFit: 'contain', border: `1px solid ${THEME.colors.line}`, borderRadius: '8px', padding: '8px', background: THEME.colors.white }}
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                            <div>
                                <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Company logo</p>
                                <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.tenantName || storedBranding.name || 'Organization branding'}</p>
                            </div>
                        </div>
                    )}
                    <div className="rp-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Organization Name</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.tenantName || storedBranding.name || 'Not specified'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Phone</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{displayPhone || 'Not specified'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Location</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.location || 'Not specified'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Country</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.country || 'Not specified'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Email</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.email || 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="rp-settings-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${THEME.colors.line}` }}>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === 'users' ? THEME.colors.brass : 'transparent'}`,
                                color: activeTab === 'users' ? THEME.colors.ink : THEME.colors.gray,
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                marginBottom: '-1px',
                            }}
                        >
                            Users & Roles
                        </button>
                    )}
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('organization')}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === 'organization' ? THEME.colors.brass : 'transparent'}`,
                                color: activeTab === 'organization' ? THEME.colors.ink : THEME.colors.gray,
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                marginBottom: '-1px',
                            }}
                        >
                            Organization
                        </button>
                    )}
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('charges')}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === 'charges' ? THEME.colors.brass : 'transparent'}`,
                                color: activeTab === 'charges' ? THEME.colors.ink : THEME.colors.gray,
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                marginBottom: '-1px',
                            }}
                        >
                            Care Charges
                        </button>
                    )}
                    {isMultiTenant && (
                        <button
                            onClick={() => setActiveTab('branches')}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === 'branches' ? THEME.colors.brass : 'transparent'}`,
                                color: activeTab === 'branches' ? THEME.colors.ink : THEME.colors.gray,
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                                marginBottom: '-1px',
                            }}
                        >
                            Branches
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="rp-settings-card" style={{
                    background: THEME.colors.white,
                    border: `1px solid ${THEME.colors.line}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                }}>
                    {/* ── Organization (edit name / phone / email / location /
                        country + logo) ─────────────────────────────────────── */}
                    {activeTab === 'organization' && isManager && (
                        <div>
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '0.35rem' }}>
                                Organization Information
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: THEME.colors.gray, marginBottom: '1.25rem' }}>
                                These details appear on the dashboard, intake/release forms and printed documents.
                            </p>

                            {orgStatus && (
                                <div
                                    role="status"
                                    style={{
                                        padding: '0.7rem 0.9rem',
                                        marginBottom: '1.25rem',
                                        borderRadius: '4px',
                                        fontSize: '0.82rem',
                                        background: orgStatus.type === 'error' ? THEME.colors.redBg : THEME.colors.successBg,
                                        color: orgStatus.type === 'error' ? THEME.colors.red : THEME.colors.success,
                                        border: `1px solid ${orgStatus.type === 'error' ? THEME.colors.red : THEME.colors.success}`,
                                    }}
                                >
                                    {orgStatus.message}
                                </div>
                            )}

                            {/* Company logo */}
                            <div className="rp-settings-inline" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${THEME.colors.line}`, flexWrap: 'wrap' }}>
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt={`${settings?.tenantName || 'Company'} logo`}
                                        className="rp-settings-logo"
                                        style={{ width: 72, height: 72, objectFit: 'contain', border: `1px solid ${THEME.colors.line}`, borderRadius: '8px', padding: '8px', background: THEME.colors.white }}
                                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div
                                        className="rp-settings-logo"
                                        aria-hidden="true"
                                        style={{
                                            width: 72,
                                            height: 72,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `1px dashed ${THEME.colors.line}`,
                                            borderRadius: '8px',
                                            background: THEME.colors.bone,
                                            color: THEME.colors.brass,
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '1.5rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {(settings?.tenantName || 'O').trim().charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p style={FIELD_LABEL_STYLE}>Company logo</p>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                                        onChange={handleLogoFile}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={logoUploading}
                                        style={{
                                            padding: '0.5rem 0.9rem',
                                            background: THEME.colors.white,
                                            color: THEME.colors.brass,
                                            border: `1px solid ${THEME.colors.line}`,
                                            borderRadius: '4px',
                                            fontSize: '0.82rem',
                                            fontWeight: 500,
                                            fontFamily: "'Inter', sans-serif",
                                            cursor: logoUploading ? 'wait' : 'pointer',
                                            opacity: logoUploading ? 0.7 : 1,
                                        }}
                                    >
                                        {logoUploading ? 'Uploading…' : (companyLogo ? 'Replace logo' : 'Upload logo')}
                                    </button>
                                    <p style={{ fontSize: '0.75rem', color: THEME.colors.gray, marginTop: '0.4rem' }}>
                                        JPG, PNG, GIF, WEBP or SVG — up to 10MB.
                                    </p>
                                </div>
                            </div>
                            <form onSubmit={saveOrganization} className="rp-settings-form" style={{ maxWidth: '560px', display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label htmlFor="org-name" style={FIELD_LABEL_STYLE}>Organization name</label>
                                    <input
                                        id="org-name"
                                        type="text"
                                        required
                                        minLength={2}
                                        value={orgForm.tenantName}
                                        onChange={(event) => setOrgForm((prev) => ({ ...prev, tenantName: event.target.value }))}
                                        placeholder="e.g. Montenzuma Monalisa Funeral Home"
                                        style={FIELD_INPUT_STYLE}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="org-phone" style={FIELD_LABEL_STYLE}>Phone number</label>
                                    <input
                                        id="org-phone"
                                        type="tel"
                                        inputMode="tel"
                                        value={orgForm.phone}
                                        onChange={(event) => setOrgForm((prev) => ({ ...prev, phone: event.target.value }))}
                                        placeholder="e.g. +254 712 345 678"
                                        style={FIELD_INPUT_STYLE}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="org-email" style={FIELD_LABEL_STYLE}>Email</label>
                                    <input
                                        id="org-email"
                                        type="email"
                                        value={orgForm.email}
                                        onChange={(event) => setOrgForm((prev) => ({ ...prev, email: event.target.value }))}
                                        placeholder="e.g. info@example.co.ke"
                                        style={FIELD_INPUT_STYLE}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="org-location" style={FIELD_LABEL_STYLE}>Location / address</label>
                                    <input
                                        id="org-location"
                                        type="text"
                                        value={orgForm.location}
                                        onChange={(event) => setOrgForm((prev) => ({ ...prev, location: event.target.value }))}
                                        placeholder="e.g. Nairobi, Kenya"
                                        style={FIELD_INPUT_STYLE}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="org-country" style={FIELD_LABEL_STYLE}>Country</label>
                                    <input
                                        id="org-country"
                                        type="text"
                                        value={orgForm.country}
                                        onChange={(event) => setOrgForm((prev) => ({ ...prev, country: event.target.value }))}
                                        placeholder="e.g. Kenya"
                                        style={FIELD_INPUT_STYLE}
                                    />
                                </div>
                                <div className="rp-settings-actions" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <button
                                        type="submit"
                                        disabled={orgSaving}
                                        style={{
                                            padding: '0.65rem 1.25rem',
                                            background: THEME.colors.brass,
                                            color: THEME.colors.white,
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '0.88rem',
                                            fontWeight: 500,
                                            fontFamily: "'Inter', sans-serif",
                                            cursor: orgSaving ? 'wait' : 'pointer',
                                            opacity: orgSaving ? 0.75 : 1,
                                        }}
                                    >
                                        {orgSaving ? 'Saving…' : 'Save changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrgForm({
                                            tenantName: settings?.tenantName || '',
                                            phone: settings?.phone || '',
                                            email: settings?.email || '',
                                            location: settings?.location || '',
                                            country: settings?.country || '',
                                        })}
                                        disabled={orgSaving}
                                        style={{
                                            padding: '0.65rem 1.1rem',
                                            background: THEME.colors.white,
                                            color: THEME.colors.ink,
                                            border: `1px solid ${THEME.colors.line}`,
                                            borderRadius: '4px',
                                            fontSize: '0.88rem',
                                            fontWeight: 500,
                                            fontFamily: "'Inter', sans-serif",
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'users' && isManager && (
                        <div>
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '1rem' }}>
                                User Management
                            </h3>
                            {users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: THEME.colors.gray }}>
                                    <p style={{ fontSize: '0.88rem', marginBottom: '0.5rem' }}>No users registered yet</p>
                                    <p style={{ fontSize: '0.82rem' }}>Click "Add User" to create your first user account</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table className="rp-settings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: `2px solid ${THEME.colors.line}` }}>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                                                {branches.length > 0 && <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch</th>}
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.user_id} style={{ borderBottom: `1px solid ${THEME.colors.line}` }}>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.88rem', color: THEME.colors.ink }}>{user.full_name}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.88rem', color: THEME.colors.gray }}>{user.email}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.6rem',
                                                            background: user.role === 'admin' ? THEME.colors.redBg : THEME.colors.bone2,
                                                            color: user.role === 'admin' ? THEME.colors.red : THEME.colors.ink,
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            textTransform: 'capitalize',
                                                        }}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    {branches.length > 0 && (
                                                        <td style={{ padding: '0.75rem' }}>
                                                            {isManager ? (
                                                                <select
                                                                    value={String(user.branch_id || '')}
                                                                    disabled={assigningBranch === user.user_id}
                                                                    onChange={(e) => handleAssignBranch(user, e.target.value)}
                                                                    style={{
                                                                        padding: '0.35rem 0.5rem',
                                                                        border: `1px solid ${THEME.colors.line}`,
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        fontFamily: "'Inter', sans-serif",
                                                                        background: THEME.colors.white,
                                                                        color: THEME.colors.ink,
                                                                        maxWidth: '190px',
                                                                        opacity: assigningBranch === user.user_id ? 0.6 : 1,
                                                                        cursor: assigningBranch === user.user_id ? 'wait' : 'pointer',
                                                                    }}
                                                                >
                                                                    <option value="">{assigningBranch === user.user_id ? 'Saving…' : 'Unassigned'}</option>
                                                                    {branches.map((branch) => (
                                                                        <option key={branch.branch_id} value={String(branch.branch_id)}>
                                                                            {branch.branch_name}{isMainBranch(branch) ? ' (Main)' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span style={{ fontSize: '0.88rem', color: THEME.colors.gray }}>
                                                                    {user.branch_name || 'Main'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.6rem',
                                                            background: THEME.colors.successBg,
                                                            color: THEME.colors.success,
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                        }}>
                                                            Active
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'charges' && isManager && (
                        <form onSubmit={saveHomeCharges}>
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                Funeral Home Default Care Charge
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: THEME.colors.gray, marginBottom: '1.25rem', maxWidth: 620 }}>
                                This rate applies per day to deceased records that do not have their own specific charge setting. Individual deceased rates remain independent.
                            </p>
                            {homeChargesLoading ? (
                                <p style={{ color: THEME.colors.gray, fontSize: '0.88rem' }}>Loading default charges...</p>
                            ) : (
                                <div className="rp-settings-form" style={{ maxWidth: 520, display: 'grid', gap: '1rem' }}>
                                    <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.78rem', color: THEME.colors.gray }}>
                                        Charge frequency
                                        <select
                                            value={homeCharges.chargeType}
                                            onChange={(event) => setHomeCharges((prev) => ({ ...prev, chargeType: event.target.value }))}
                                            style={{ padding: '0.7rem', border: `1px solid ${THEME.colors.line}`, borderRadius: 5, fontFamily: "'Inter', sans-serif" }}
                                        >
                                            <option value="daily">Per day</option>
                                            <option value="hourly">Per hour</option>
                                        </select>
                                    </label>
                                    <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.78rem', color: THEME.colors.gray }}>
                                        {homeCharges.chargeType === 'daily' ? 'Default daily rate (KES)' : 'Default hourly rate (KES)'}
                                        <input
                                            type="number"
                                            min="1"
                                            value={homeCharges.chargeType === 'daily' ? homeCharges.dailyRate : homeCharges.hourlyRate}
                                            onChange={(event) => setHomeCharges((prev) => ({
                                                ...prev,
                                                [prev.chargeType === 'daily' ? 'dailyRate' : 'hourlyRate']: event.target.value,
                                            }))}
                                            style={{ padding: '0.7rem', border: `1px solid ${THEME.colors.line}`, borderRadius: 5, fontSize: '1rem' }}
                                        />
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={homeChargesSaving}
                                        style={{ justifySelf: 'start', padding: '0.7rem 1.25rem', background: THEME.colors.brass, color: THEME.colors.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: homeChargesSaving ? 'wait' : 'pointer' }}
                                    >
                                        {homeChargesSaving ? 'Saving...' : 'Save Home Default'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {activeTab === 'branches' && isMultiTenant && (
                        <div>
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '1rem' }}>
                                Branch Management
                            </h3>
                            <div className="rp-settings-branches" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {branches.map((branch) => (
                                    <div key={branch.branch_id} style={{
                                        padding: '1.25rem',
                                        background: THEME.colors.bone,
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '8px',
                                    }}>
                                        <div className="rp-settings-branch-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                            <h4 className="rp-settings-branch-name" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: THEME.colors.ink }}>
                                                {branch.branch_name}
                                            </h4>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                background: THEME.colors.successBg,
                                                color: THEME.colors.success,
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                            }}>
                                                Active
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: THEME.colors.gray, marginBottom: '0.5rem' }}>
                                            Slug: {branch.branch_slug}
                                        </p>
                                        {branch.branch_location && (
                                            <p style={{ fontSize: '0.82rem', color: THEME.colors.gray, marginBottom: '0.5rem' }}>
                                                📍 {branch.branch_location}
                                            </p>
                                        )}
                                        {branch.branch_phone && (
                                            <p style={{ fontSize: '0.82rem', color: THEME.colors.gray }}>
                                                📞 {branch.branch_phone}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="rp-settings-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(21,23,26,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem',
                }}>
                    <div className="rp-settings-modal-panel" style={{
                        background: THEME.colors.white,
                        borderRadius: '8px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        <div className="rp-settings-modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="rp-settings-modal-title" style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: THEME.colors.ink }}>
                                Add New User
                            </h2>
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    color: THEME.colors.gray,
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddUser}>
                            {formError && (
                                <div style={{
                                    padding: '0.75rem',
                                    background: THEME.colors.redBg,
                                    color: THEME.colors.red,
                                    borderRadius: '4px',
                                    fontSize: '0.82rem',
                                    marginBottom: '1rem',
                                }}>
                                    {formError}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Full Name <span style={{ color: THEME.colors.red }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={userForm.full_name}
                                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Email <span style={{ color: THEME.colors.red }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={userForm.username}
                                    placeholder="Used to log in (auto-filled from email if left blank)"
                                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Password <span style={{ color: THEME.colors.red }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    required
                                    minLength={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={userForm.phone}
                                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                    Role <span style={{ color: THEME.colors.red }}>*</span>
                                </label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontFamily: "'Inter', sans-serif",
                                        background: THEME.colors.white,
                                    }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="staff">Staff</option>
                                    <option value="user">User</option>
                                    <option value="driver">Driver</option>
                                </select>
                            </div>

                            {branches.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: THEME.colors.ink, marginBottom: '0.4rem' }}>
                                        Branch <span style={{ color: THEME.colors.red }}>*</span>
                                    </label>
                                    <select
                                        value={userForm.branch_id}
                                        onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            border: `1px solid ${THEME.colors.line}`,
                                            borderRadius: '4px',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Inter', sans-serif",
                                            background: THEME.colors.white,
                                        }}
                                    >
                                        <option value="">Select a branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch.branch_id} value={branch.branch_id}>
                                                {branch.branch_name}{isMainBranch(branch) ? ' (Main)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, marginTop: '0.35rem' }}>
                                        {isMultiTenant
                                            ? 'The user is assigned to this tenant and will only be able to log in to the selected branch.'
                                            : 'All users are assigned to the main (parent) branch of this organization.'}
                                    </p>
                                </div>
                            )}

                            <div className="rp-settings-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        color: THEME.colors.gray,
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: THEME.colors.brass,
                                        color: THEME.colors.white,
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.88rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
