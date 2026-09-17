
import React, { useState, useEffect } from 'react';
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
        // Then the URL slug, which is the canonical /tenant/:slug route. For a
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
            // The driver-portal page only exists under /tenant/:slug/driver-portal.
            if (user.role === 'driver') {
                const navSlug = user.branchSlug || user.parentTenantSlug || user.tenantSlug || tenantSlug || urlSlug;
                navigate(`/tenant/${navSlug}/driver-portal`);
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
        <div style={{ minHeight: '100vh', background: THEME.colors.bone }}>
            {error && (
                <div style={{
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

            {/* Header */}
            <div style={{ background: THEME.colors.white, borderBottom: `1px solid ${THEME.colors.line}`, padding: '1.5rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt={`${settings?.tenantName || 'Company'} logo`}
                                style={{ width: 54, height: 54, objectFit: 'contain', border: `1px solid ${THEME.colors.line}`, borderRadius: '8px', padding: '6px', background: THEME.colors.white }}
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                        ) : null}
                        <div>
                        <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '0.25rem' }}>
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
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: THEME.colors.white,
                    border: `1px solid ${THEME.colors.line}`,
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                }}>
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: THEME.colors.ink, marginBottom: '1rem' }}>
                        Organization Information
                    </h3>
                    {companyLogo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${THEME.colors.line}` }}>
                            <img
                                src={companyLogo}
                                alt={`${settings?.tenantName || 'Company'} logo`}
                                style={{ width: 72, height: 72, objectFit: 'contain', border: `1px solid ${THEME.colors.line}`, borderRadius: '8px', padding: '8px', background: THEME.colors.white }}
                            />
                            <div>
                                <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Company logo</p>
                                <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.tenantName || storedBranding.name || 'Organization branding'}</p>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.72rem', color: THEME.colors.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Organization Name</p>
                            <p style={{ fontSize: '0.88rem', color: THEME.colors.ink, fontWeight: 500 }}>{settings?.tenantName}</p>
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
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${THEME.colors.line}` }}>
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
                <div style={{
                    background: THEME.colors.white,
                    border: `1px solid ${THEME.colors.line}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                }}>
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
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                <div style={{ maxWidth: 520, display: 'grid', gap: '1rem' }}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {branches.map((branch) => (
                                    <div key={branch.branch_id} style={{
                                        padding: '1.25rem',
                                        background: THEME.colors.bone,
                                        border: `1px solid ${THEME.colors.line}`,
                                        borderRadius: '8px',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                            <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: THEME.colors.ink }}>
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
                <div style={{
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
                    <div style={{
                        background: THEME.colors.white,
                        borderRadius: '8px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: THEME.colors.ink }}>
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

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
