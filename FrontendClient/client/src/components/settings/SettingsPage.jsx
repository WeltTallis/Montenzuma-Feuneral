import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';
import api from '../../api/axios';
import { getTenantBrandingFromStorage, rebaseUploadUrl } from '../../utils/tenantResolver/tenantBranding';
import { useTenantStore } from '../../modules/seo/useTenantStore';

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
        line: '#E3DDD0',
        gray: '#6B6862',
    },
};

// Small inline SVG icons (keeps the markup tidy below).
const IconPlus = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const IconSearch = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
const IconPencil = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
);
const IconClose = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);
const IconCheck = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5 5L20 6.5" /></svg>
);
const IconBuilding = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" /></svg>
);

// Initials for the user avatar (full name → username → email fallback).
const userInitials = (u) => {
    const src = String(u?.full_name || u?.username || u?.email || '?').trim();
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function SettingsPage() {
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams();
    // Care Charges is the DEFAULT landing tab now (was 'users').
    const [activeTab, setActiveTab] = useState('charges');
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
    const [chargesMsg, setChargesMsg] = useState(null); // inline status for the charges form
    const [userSearch, setUserSearch] = useState('');

    // Tiny toast for quick confirmations (auto-hides).
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);
    const showToast = (message) => {
        setToast(message);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 2600);
    };
    useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

    // ── Organization information (Settings → Organization) ───────────────────
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
        push(parentSlug);
        push(urlSlug);
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

            setSettings(data.settings);
            setUsers(data.users);
            setBranches(data.branches);
            setError(null);
        } catch (err) {
            console.error('Failed to load settings:', err);
            let message = err.response?.data?.message || 'Please check the tenant and try again.';
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
            setChargesMsg({ type: 'error', message: 'Enter a positive default daily charge.' });
            return;
        }
        if (homeCharges.chargeType === 'hourly' && hourlyRate <= 0) {
            setChargesMsg({ type: 'error', message: 'Enter a positive default hourly charge.' });
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
            setChargesMsg({ type: 'success', message: 'Care charges saved.' });
            showToast('Care charges saved');
        } catch (err) {
            setChargesMsg({ type: 'error', message: err.response?.data?.message || 'Failed to save default care charges.' });
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
                tenant_id: cachedUser?.tenantId
                    || cachedUser?.tenant_id
                    || localStorage.getItem('tenantId')
                    || sessionStorage.getItem('tenantId')
                    || null,
                // Backend requires a unique username — auto-derive from the email.
                username: (userForm.username || userForm.email || '').trim().toLowerCase(),
                branch_id: userForm.branch_id || (activeBranches.length === 1 ? String(activeBranches[0].branch_id) : null),
            };

            await api.post(ENDPOINTS.TENANT.CREATE_USER(tenantSlug), payload);
            setShowAddUserModal(false);
            setFormError('');
            setUserForm({ email: '', username: '', password: '', full_name: '', phone: '', role: 'staff', branch_id: '' });
            showToast('User created');
            loadData();
        } catch (err) {
            console.error('Failed to add user:', err);
            setFormError(err.response?.data?.message || 'Failed to add user. Please try again.');
        }
    };

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
            showToast(`Branch updated for ${user.full_name || user.email || 'user'}`);
        } catch (err) {
            console.error('Failed to assign branch:', err);
            setError(err.response?.data?.message || 'Failed to assign branch. Please try again.');
        } finally {
            setAssigningBranch(null);
        }
    };

    // Multi-branch detection: an org is "multi" if the backend says so OR the
    // loaded branch list has more than one entry.
    const isMultiTenant = settings?.deploymentType === 'multi' || branches.length > 1;
    const isAdmin = isUserManager(currentUser) || isUserManager(resolveStoredUser());
    const isManager = isAdmin;

    useEffect(() => {
        if (activeTab === 'charges' && isManager) loadHomeCharges();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isManager]);

    const storedBranding = getTenantBrandingFromStorage();
    const rawLogoUrl = settings?.logoUrl || settings?.logo_url || settings?.logo || storedBranding.logoUrl;
    const companyLogo = rawLogoUrl
        ? rebaseUploadUrl(rawLogoUrl.startsWith('http') || rawLogoUrl.startsWith('data:')
            ? rawLogoUrl
            : `${env.UPLOADS_URL.replace(/\/$/, '')}/${rawLogoUrl.replace(/^\/+/, '')}`)
        : '';
    const displayPhone = settings?.phone || storedBranding.phone || '';

    // Mirror the loaded tenant record into the editable Organization form.
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
                if (value !== undefined) localStorage.setItem(storageKey, value === null ? '' : value);
            });
        } catch {
            // Storage can be unavailable (private mode / quota) — non-fatal.
        }
    };

    // The intake/release letterheads resolve branding through
    // resolveTenantBranding(tenantData), which PREFERS the Zustand tenant
    // store and only falls back to localStorage:
    //     name = source?.name || source?.tenantName || stored.name || ...
    // Writing localStorage alone left the store serving the PREVIOUS name /
    // phone / location, so the forms printed the old letterhead until a hard
    // reload. Push the saved values into the store as well.
    const syncTenantBrandingStore = (patch = {}, fallback = {}) => {
        try {
            // undefined = not supplied (skip); "" = cleared by admin (apply).
            const val = (...vals) => {
                for (const v of vals) if (v !== undefined && v !== null) return v;
                return undefined;
            };
            const name = val(patch.name, patch.tenantName, fallback.name);
            const phone = val(patch.phone, patch.tenantPhone, fallback.phone);
            const email = val(patch.email, patch.tenantEmail, fallback.email);
            const location = val(patch.location, patch.tenantLocation, fallback.location);
            const country = val(patch.country, patch.tenantCountry, fallback.country);
            const logoUrl = val(patch.logoUrl, patch.logo_url, patch.logo, fallback.logoUrl);

            const current = useTenantStore.getState()?.tenantData || {};
            const next = { ...current };
            // name is read through BOTH `name` and `tenantName`, so set both.
            if (name !== undefined) { next.name = name; next.tenantName = name; }
            if (phone !== undefined) next.phone = phone;
            if (email !== undefined) next.email = email;
            if (location !== undefined) next.location = location;
            if (country !== undefined) next.country = country;
            if (logoUrl !== undefined) { next.logoUrl = logoUrl; next.logo_url = logoUrl; }

            useTenantStore.getState().setTenantData(next);
            if (name) document.title = `${name} | REST POINT`;

            // The router caches the tenant payload for 5 minutes and re-seeds
            // the store from it, which would restore the pre-save values.
            const memoryCache = window.__tenantCache;
            if (memoryCache) Object.keys(memoryCache).forEach((k) => { delete memoryCache[k]; });
        } catch {
            // Non-fatal: localStorage and the next resolve still carry it.
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
            // Keep the tenant store (what the forms read) in step with the save.
            syncTenantBrandingStore(updated, {
                name,
                phone: orgForm.phone.trim(),
                email,
                location: orgForm.location.trim(),
                country: orgForm.country.trim(),
            });
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
            // the boundary (hand-setting it omits the boundary → multer 400).
            const response = await api.post(ENDPOINTS.TENANT.LOGO(tenantSlug), payload, {
                headers: { 'Content-Type': null },
            });
            const nextLogo = response.data?.data?.logoUrl || response.data?.data?.logo_url || '';
            setSettings((prev) => ({ ...prev, logoUrl: nextLogo, logo_url: nextLogo }));
            persistBrandingLocally({ logoUrl: nextLogo });
            syncTenantBrandingStore({ logoUrl: nextLogo });
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

    // ── Derived view data ────────────────────────────────────────────────────
    const activeBranches = branches.filter((b) => b.is_active === undefined || b.is_active === true || b.is_active === 1);

    const q = userSearch.trim().toLowerCase();
    const filteredUsers = q
        ? users.filter((u) => [u.full_name, u.username, u.email, u.role, u.branch_name]
            .some((v) => String(v || '').toLowerCase().includes(q)))
        : users;

    // Charges summary (live, computed from state).
    const fmtNum = (n) => Number(n || 0).toLocaleString();
    const chargesCurrency = homeCharges.currency || 'KES';
    const activeRate = Number(homeCharges.chargeType === 'daily' ? homeCharges.dailyRate : homeCharges.hourlyRate) || 0;
    const usdRateNum = Number(homeCharges.usdRate || 0) || 0;
    const summaryTotal1 = homeCharges.chargeType === 'daily' ? activeRate : activeRate * 24;
    const summaryTotal2 = homeCharges.chargeType === 'daily' ? activeRate * 3 : activeRate * 72;

    // If the default tab isn't available for this role, fall back once.
    useEffect(() => {
        if (loading) return;
        if (!isManager && (activeTab === 'charges' || activeTab === 'users')) {
            setActiveTab(isMultiTenant ? 'branches' : 'organization');
        }
        if (!isMultiTenant && activeTab === 'branches') {
            setActiveTab('organization');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, isManager, isMultiTenant]);

    // Modal: ESC to close + body scroll lock while open.
    useEffect(() => {
        if (!showAddUserModal) return;
        const onKey = (e) => { if (e.key === 'Escape') setShowAddUserModal(false); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [showAddUserModal]);

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        let out = '';
        for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
        setUserForm((prev) => ({ ...prev, password: out }));
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.colors.bone, fontFamily: "'Inter', sans-serif" }}>
                <style>{`@keyframes rps-spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: `3px solid ${THEME.colors.line}`, borderTopColor: THEME.colors.brass, borderRadius: '50%', animation: 'rps-spin 0.65s linear infinite', margin: '0 auto 1rem' }} />
                    <p style={{ color: THEME.colors.gray, fontSize: '0.88rem' }}>Loading settings…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rp-settings-root">
            <style>{`
        .rp-settings-root{
          --rps-ink:#15171A; --rps-bone:#FAF8F4; --rps-bone-2:#F3EFE6;
          --rps-brass:#8B7355; --rps-brass-hover:#A98F6E; --rps-verdigris:#3D4F47;
          --rps-line:#E3DDD0; --rps-gray:#6B6862;
          --rps-success:#475A43; --rps-success-bg:#EEF3EC;
          --rps-red:#9B4A3F; --rps-red-bg:#F7ECE9;
          --rps-amber:#8A6D3B;
          --rps-radius:14px;
          --rps-shadow-sm:0 1px 2px rgba(21,23,26,.05);
          --rps-shadow-md:0 2px 4px rgba(21,23,26,.05), 0 14px 34px rgba(21,23,26,.09);
          min-height:100vh;
          background:var(--rps-bone);
          color:var(--rps-ink);
          font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
          line-height:1.5;
          -webkit-font-smoothing:antialiased;
          overflow-wrap:anywhere;
        }
        .rp-settings-root *, .rp-settings-root *::before, .rp-settings-root *::after{ box-sizing:border-box; margin:0; padding:0; }
        .rp-settings-root img{ max-width:100%; display:block; }
        .rp-settings-root button{ cursor:pointer; background:none; border:0; font:inherit; color:inherit; }
        .rp-settings-root input, .rp-settings-root select{ font:inherit; color:inherit; }
        .rp-settings-root :focus-visible{ outline:2px solid var(--rps-brass); outline-offset:2px; border-radius:4px; }
        .rp-settings-root input[type=number]{ appearance:textfield; -moz-appearance:textfield; }
        .rp-settings-root input[type=number]::-webkit-outer-spin-button,
        .rp-settings-root input[type=number]::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }

        @keyframes rps-spin{ to{ transform:rotate(360deg); } }
        @keyframes rps-fade-up{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
        @keyframes rps-fade{ from{ opacity:0; } to{ opacity:1; } }

        .rps-container{ max-width:1140px; margin:0 auto; padding:0 24px; }

        .rps-banner{ background:var(--rps-red-bg); color:var(--rps-red); border-bottom:1px solid #f0d3cd; padding:.85rem 24px; font-size:.85rem; }
        .rps-banner-inner{ max-width:1140px; margin:0 auto; }

        /* ── Slim sticky tab bar ── */
        .rps-topbar{ position:sticky; top:0; z-index:40; background:rgba(255,255,255,.94); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border-bottom:1px solid var(--rps-line); }
        .rps-topbar-inner{ display:flex; align-items:stretch; gap:26px; }
        .rps-topbar-label{ display:flex; align-items:center; font-size:.7rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--rps-gray); flex:none; }
        .rps-tabs{ display:flex; gap:26px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; flex:1; min-width:0; }
        .rps-tabs::-webkit-scrollbar{ display:none; }
        .rps-tab{ position:relative; display:inline-flex; align-items:center; gap:7px; height:56px; font-size:.875rem; font-weight:500; color:var(--rps-gray); white-space:nowrap; transition:color .15s; }
        .rps-tab::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; border-radius:2px; background:transparent; transition:background .15s; }
        .rps-tab:hover{ color:var(--rps-ink); }
        .rps-tab.active{ color:var(--rps-ink); font-weight:600; }
        .rps-tab.active::after{ background:var(--rps-brass); }
        .rps-tab-count{ background:var(--rps-bone-2); color:var(--rps-gray); font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:999px; }
        .rps-tab.active .rps-tab-count{ background:var(--rps-brass); color:#fff; }

        .rps-main{ padding:26px 0 90px; }

        .rps-card{ background:#fff; border:1px solid var(--rps-line); border-radius:var(--rps-radius); box-shadow:var(--rps-shadow-sm); }
        .rps-panel{ animation:rps-fade-up .25s ease; }
        .rps-panel-card{ padding:26px; }
        .rps-panel-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
        .rps-panel-head h2{ font-size:1.05rem; font-weight:600; }
        .rps-panel-head p{ font-size:.82rem; color:var(--rps-gray); margin-top:2px; }
        .rps-panel-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

        .rps-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 18px; border-radius:10px; font-size:.875rem; font-weight:600; border:1px solid transparent; white-space:nowrap; transition:all .18s ease; }
        .rps-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none !important; }
        .rps-btn-primary{ background:var(--rps-brass); color:#fff; box-shadow:var(--rps-shadow-sm); }
        .rps-btn-primary:hover:not(:disabled){ background:var(--rps-brass-hover); transform:translateY(-1px); box-shadow:var(--rps-shadow-md); }
        .rps-btn-ghost{ background:#fff; border-color:var(--rps-line); color:var(--rps-verdigris); }
        .rps-btn-ghost:hover:not(:disabled){ border-color:var(--rps-brass); color:var(--rps-brass); }
        .rps-btn-sm{ padding:8px 14px; font-size:.8rem; }
        .rps-icon-btn{ width:34px; height:34px; display:grid; place-items:center; border-radius:8px; color:var(--rps-gray); transition:.15s; }
        .rps-icon-btn:hover{ background:var(--rps-bone-2); color:var(--rps-ink); }

        .rps-search{ position:relative; }
        .rps-search svg{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--rps-gray); pointer-events:none; }
        .rps-search input{ width:240px; max-width:100%; padding:9px 12px 9px 36px; border:1px solid var(--rps-line); border-radius:10px; background:#fff; font-size:.86rem; }
        .rps-search input:focus{ outline:none; border-color:var(--rps-brass); box-shadow:0 0 0 3px rgba(139,115,85,.14); }

        /* ── Users table ── */
        .rps-table-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
        table.rps-users{ width:100%; border-collapse:collapse; min-width:760px; }
        .rps-users th{ font-size:.68rem; text-transform:uppercase; letter-spacing:.07em; color:var(--rps-gray); font-weight:600; text-align:left; padding:10px 12px; border-bottom:1px solid var(--rps-line); }
        .rps-users td{ padding:14px 12px; border-bottom:1px solid var(--rps-bone-2); font-size:.875rem; vertical-align:middle; }
        .rps-users tbody tr{ transition:background .12s; }
        .rps-users tbody tr:hover{ background:var(--rps-bone); }
        .rps-users tbody tr:last-child td{ border-bottom:0; }
        .rps-users th:last-child, .rps-users td.rps-cell-actions{ text-align:right; }
        .rps-users td .rps-mini-select{ max-width:100%; }
        .rps-cell-user{ display:flex; align-items:center; gap:12px; min-width:0; }
        .rps-cell-user .rps-who{ min-width:0; }
        .rps-cell-user .rps-name{ font-weight:600; font-size:.9rem; }
        .rps-cell-user .rps-email{ font-size:.78rem; color:var(--rps-gray); }
        .rps-avatar{ width:38px; height:38px; border-radius:50%; display:grid; place-items:center; font-size:.76rem; font-weight:700; flex:none; }
        .rps-av-1{ background:#efe7da; color:var(--rps-brass); }
        .rps-av-2{ background:#e4eae5; color:var(--rps-verdigris); }
        .rps-av-3{ background:#f4ead6; color:var(--rps-amber); }
        .rps-av-4{ background:#f3e3df; color:var(--rps-red); }
        .rps-av-5{ background:#e8e6e2; color:var(--rps-gray); }
        .rps-pill{ display:inline-flex; align-items:center; padding:4px 11px; border-radius:999px; font-size:.74rem; font-weight:600; }
        .rps-pill-manager{ background:#f1ece2; color:var(--rps-brass); }
        .rps-pill-staff{ background:#e7ecea; color:var(--rps-verdigris); }
        .rps-pill-accountant{ background:#f4ead6; color:var(--rps-amber); }
        .rps-pill-driver{ background:#eceae6; color:var(--rps-gray); }
        .rps-status{ display:inline-flex; align-items:center; gap:7px; font-size:.78rem; font-weight:500; }
        .rps-status .rps-dot{ width:8px; height:8px; border-radius:50%; flex:none; }
        .rps-status.on{ color:var(--rps-success); }
        .rps-status.on .rps-dot{ background:#5a7d54; box-shadow:0 0 0 3px rgba(90,125,84,.15); }
        .rps-status.off{ color:var(--rps-gray); }
        .rps-status.off .rps-dot{ background:#b5b0a6; }
        .rps-actions-row{ display:inline-flex; gap:4px; }

        /* ── Branches ── */
        .rps-branch-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px; }
        .rps-branch-card{ padding:22px; display:flex; flex-direction:column; gap:14px; position:relative; transition:.18s; }
        .rps-branch-card:hover{ transform:translateY(-2px); box-shadow:var(--rps-shadow-md); }
        .rps-branch-top{ display:flex; gap:12px; align-items:flex-start; padding-right:90px; }
        .rps-branch-icon{ width:42px; height:42px; flex:none; border-radius:10px; background:var(--rps-bone-2); color:var(--rps-verdigris); display:grid; place-items:center; }
        .rps-branch-name{ font-weight:600; font-size:.95rem; }
        .rps-branch-loc{ font-size:.8rem; color:var(--rps-gray); margin-top:1px; }
        .rps-tag-main{ position:absolute; top:16px; right:16px; font-size:.64rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--rps-brass); background:#f1ece2; padding:4px 9px; border-radius:999px; }
        .rps-branch-meta{ display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--rps-line); padding-top:14px; margin-top:auto; font-size:.8rem; color:var(--rps-gray); }

        /* ── Forms ── */
        .rps-field label{ display:block; font-size:.72rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--rps-gray); margin-bottom:7px; }
        .rps-input{ width:100%; padding:11px 14px; border:1px solid var(--rps-line); border-radius:10px; background:#fff; font-size:.9rem; color:var(--rps-ink); transition:border-color .15s, box-shadow .15s; }
        .rps-input::placeholder{ color:#b5b0a6; }
        .rps-input:focus{ outline:none; border-color:var(--rps-brass); box-shadow:0 0 0 3px rgba(139,115,85,.14); }
        .rps-input:disabled{ background:var(--rps-bone); color:var(--rps-gray); cursor:not-allowed; }
        select.rps-input, .rps-mini-select{ appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%236B6862' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px; }
        .rps-form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .rps-full{ grid-column:1/-1; }
        .rps-form-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; grid-column:1/-1; }
        .rps-muted{ opacity:.45; }
        .rps-inline-status{ padding:.7rem .9rem; margin-bottom:1.25rem; border-radius:8px; font-size:.82rem; }
        .rps-inline-status.error{ background:var(--rps-red-bg); color:var(--rps-red); border:1px solid #ecc9c2; }
        .rps-inline-status.success{ background:var(--rps-success-bg); color:var(--rps-success); border:1px solid #d4e0d0; }

        /* ── Organization ── */
        .rps-org-layout{ display:grid; grid-template-columns:290px 1fr; gap:34px; align-items:start; }
        .rps-logo-box{ display:flex; flex-direction:column; align-items:center; gap:14px; padding:26px 20px; border:1px dashed var(--rps-line); border-radius:var(--rps-radius); background:var(--rps-bone); text-align:center; }
        .rps-logo-preview{ width:96px; height:96px; border-radius:16px; background:#fff; border:1px solid var(--rps-line); display:grid; place-items:center; font-size:2rem; font-weight:700; color:var(--rps-brass); overflow:hidden; }
        .rps-logo-preview img{ width:100%; height:100%; object-fit:contain; padding:8px; }
        .rps-hint{ font-size:.74rem; color:var(--rps-gray); }
        .rps-org-readonly{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:18px 24px; }
        .rps-label{ font-size:.68rem; font-weight:600; letter-spacing:.07em; text-transform:uppercase; color:var(--rps-gray); margin-bottom:4px; }
        .rps-value{ font-size:.9rem; font-weight:500; }

        /* ── Charges ── */
        .rps-charges-layout{ display:grid; grid-template-columns:1fr 280px; gap:32px; align-items:start; }
        .rps-segment{ display:inline-flex; background:var(--rps-bone-2); padding:4px; border-radius:10px; gap:4px; }
        .rps-segment button{ padding:8px 18px; border-radius:7px; font-size:.85rem; font-weight:500; color:var(--rps-gray); transition:.15s; }
        .rps-segment button.on{ background:#fff; color:var(--rps-ink); font-weight:600; box-shadow:var(--rps-shadow-sm); }
        .rps-summary-card{ background:linear-gradient(150deg,var(--rps-verdigris),#2e3b35); color:#eef2ee; border-radius:var(--rps-radius); padding:24px; position:sticky; top:80px; box-shadow:var(--rps-shadow-md); }
        .rps-summary-card .rps-label{ color:rgba(238,242,238,.6); }
        .rps-summary-rate{ font-size:1.9rem; font-weight:700; letter-spacing:-.02em; margin-top:6px; }
        .rps-summary-sub{ font-size:.8rem; color:rgba(238,242,238,.7); margin-top:2px; }
        .rps-summary-rows{ margin-top:20px; border-top:1px solid rgba(255,255,255,.14); padding-top:16px; display:grid; gap:10px; font-size:.84rem; }
        .rps-summary-rows>div{ display:flex; justify-content:space-between; gap:12px; }
        .rps-summary-rows b{ font-weight:600; color:#fff; }

        /* ── Modal ── */
        .rps-modal{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(21,23,26,.5); animation:rps-fade .2s ease; }
        .rps-modal-panel{ width:100%; max-width:520px; max-height:calc(100vh - 48px); overflow-y:auto; background:#fff; border-radius:16px; box-shadow:0 24px 64px rgba(21,23,26,.28); padding:26px; animation:rps-fade-up .22s ease; }
        .rps-modal-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:20px; }
        .rps-modal-head h3{ font-size:1.05rem; }
        .rps-modal-head p{ font-size:.82rem; color:var(--rps-gray); margin-top:2px; }
        .rps-modal-body{ display:grid; gap:16px; }
        .rps-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .rps-pwd-row{ display:flex; gap:10px; }
        .rps-pwd-row .rps-input{ flex:1; }
        .rps-modal-foot{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; padding-top:18px; border-top:1px solid var(--rps-bone-2); }
        .rps-mini-select{ padding:7px 30px 7px 10px; border:1px solid var(--rps-line); border-radius:8px; background-color:#fff; font-size:.8rem; color:var(--rps-ink); }
        .rps-mini-select:focus{ outline:none; border-color:var(--rps-brass); }

        /* ── Toast ── */
        .rps-toast{ position:fixed; left:50%; bottom:28px; z-index:60; transform:translateX(-50%); background:var(--rps-ink); color:#f5f3ef; padding:12px 20px 12px 14px; border-radius:12px; font-size:.86rem; display:flex; gap:10px; align-items:center; box-shadow:var(--rps-shadow-md); animation:rps-fade-up .28s cubic-bezier(.2,.9,.3,1.15); max-width:calc(100vw - 32px); }
        .rps-tick{ width:20px; height:20px; border-radius:50%; background:var(--rps-success); display:grid; place-items:center; flex:none; }

        /* ── Responsive ── */
        @media (max-height:520px){
          .rps-modal{ align-items:flex-start; }
          .rps-modal-panel{ max-height:92vh; }
        }
        @media (max-width:860px){
          .rps-org-layout, .rps-charges-layout{ grid-template-columns:1fr; }
          .rps-summary-card{ position:static; }
        }
        @media (max-width:760px){
          table.rps-users{ min-width:0; }
          .rps-users thead{ display:none; }
          .rps-users, .rps-users tbody{ display:block; }
          .rps-users tbody tr{ display:block; border:1px solid var(--rps-line); border-radius:12px; padding:6px 16px; margin-bottom:12px; background:#fff; }
          .rps-users tbody tr:hover{ background:#fff; }
          .rps-users td{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 0; border-bottom:1px solid var(--rps-bone-2); text-align:right; }
          .rps-users td::before{ content:attr(data-label); font-size:.66rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--rps-gray); text-align:left; }
          .rps-users td:last-child{ border-bottom:0; }
          .rps-users td.rps-cell-user-td{ justify-content:flex-start; }
          .rps-users td.rps-cell-user-td::before, .rps-users td.rps-cell-actions::before{ display:none; }
        }
        @media (max-width:640px){
          .rps-form-grid{ grid-template-columns:1fr; }
          .rps-container{ padding:0 16px; }
          .rps-panel-card{ padding:18px 16px; }
          .rps-branch-grid{ grid-template-columns:1fr; }
          .rps-panel-head{ flex-direction:column; align-items:stretch; }
          .rps-search{ width:100%; }
          .rps-search input{ width:100%; }
          .rps-panel-actions .rps-btn{ flex:1; }
        }
        @media (max-width:560px){
          .rps-topbar{ padding-top:env(safe-area-inset-top); }
          .rps-topbar-label{ display:none; }
          .rps-tabs{ gap:20px; }
          .rps-btn, .rps-input, .rps-mini-select{ min-height:44px; }
          .rp-settings-root input, .rp-settings-root select{ font-size:16px !important; } /* stops iOS zoom-on-focus */
          .rps-modal{ padding:0; align-items:flex-end; }
          .rps-modal-panel{ border-radius:18px 18px 0 0; max-height:90vh; padding-bottom:calc(22px + env(safe-area-inset-bottom)); }
          .rps-grid2{ grid-template-columns:1fr; }
          .rps-modal-foot{ flex-direction:column-reverse; }
          .rps-modal-foot .rps-btn{ width:100%; }
          .rps-form-actions{ flex-direction:column-reverse; }
          .rps-form-actions .rps-btn{ width:100%; }
        }
        @media (prefers-reduced-motion:reduce){
          .rp-settings-root *, .rp-settings-root *::before, .rp-settings-root *::after{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }
      `}</style>

            {/* Tenant / load error banner */}
            {error && (
                <div className="rps-banner" role="alert">
                    <div className="rps-banner-inner">⚠️ {error}</div>
                </div>
            )}

            {/* ── Slim sticky tab bar (replaces the old header) ────────── */}
            <header className="rps-topbar">
                <div className="rps-container rps-topbar-inner">
                    <span className="rps-topbar-label">Settings</span>
                    <nav className="rps-tabs" role="tablist" aria-label="Settings sections">
                        {isManager && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'charges'}
                                className={'rps-tab' + (activeTab === 'charges' ? ' active' : '')}
                                onClick={() => setActiveTab('charges')}
                            >
                                Care Charges
                            </button>
                        )}
                        {isManager && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'users'}
                                className={'rps-tab' + (activeTab === 'users' ? ' active' : '')}
                                onClick={() => setActiveTab('users')}
                            >
                                Users &amp; Roles <span className="rps-tab-count">{users.length}</span>
                            </button>
                        )}
                        {isMultiTenant && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'branches'}
                                className={'rps-tab' + (activeTab === 'branches' ? ' active' : '')}
                                onClick={() => setActiveTab('branches')}
                            >
                                Branches <span className="rps-tab-count">{branches.length}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'organization'}
                            className={'rps-tab' + (activeTab === 'organization' ? ' active' : '')}
                            onClick={() => setActiveTab('organization')}
                        >
                            Organization
                        </button>
                    </nav>
                </div>
            </header>

            <main className="rps-container rps-main">

                {/* ── Care Charges (default view) ──────────────────────── */}
                {isManager && activeTab === 'charges' && (
                    <section className="rps-panel" role="tabpanel">
                        <div className="rps-card rps-panel-card">
                            <div className="rps-panel-head">
                                <div>
                                    <h2>Care Charges</h2>
                                    <p>Default charges applied to new admissions at the home.</p>
                                </div>
                            </div>

                            <div className="rps-charges-layout">
                                <form onSubmit={saveHomeCharges} noValidate>
                                    <div className="rps-field">
                                        <label>Billing basis</label>
                                        <div className="rps-segment" role="group" aria-label="Billing basis">
                                            <button
                                                type="button"
                                                className={homeCharges.chargeType === 'daily' ? 'on' : ''}
                                                onClick={() => setHomeCharges((prev) => ({ ...prev, chargeType: 'daily' }))}
                                            >
                                                Per day
                                            </button>
                                            <button
                                                type="button"
                                                className={homeCharges.chargeType === 'hourly' ? 'on' : ''}
                                                onClick={() => setHomeCharges((prev) => ({ ...prev, chargeType: 'hourly' }))}
                                            >
                                                Per hour
                                            </button>
                                        </div>
                                    </div>

                                    {chargesMsg && (
                                        <div className={'rps-inline-status ' + chargesMsg.type} role="status" style={{ marginTop: '14px', marginBottom: 0 }}>
                                            {chargesMsg.message}
                                        </div>
                                    )}

                                    <div className="rps-form-grid" style={{ marginTop: '18px' }}>
                                        <div className="rps-field">
                                            <label htmlFor="charge-currency">Currency</label>
                                            <select
                                                id="charge-currency"
                                                className="rps-input"
                                                value={homeCharges.currency}
                                                onChange={(e) => setHomeCharges((prev) => ({ ...prev, currency: e.target.value }))}
                                            >
                                                <option value="KES">KES</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                        <div className={'rps-field' + (homeCharges.chargeType !== 'daily' ? ' rps-muted' : '')}>
                                            <label htmlFor="charge-daily">Default daily rate</label>
                                            <input
                                                id="charge-daily"
                                                className="rps-input"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                disabled={homeCharges.chargeType !== 'daily' || homeChargesLoading}
                                                value={homeCharges.dailyRate}
                                                onChange={(e) => setHomeCharges((prev) => ({ ...prev, dailyRate: e.target.value }))}
                                            />
                                        </div>
                                        <div className={'rps-field' + (homeCharges.chargeType !== 'hourly' ? ' rps-muted' : '')}>
                                            <label htmlFor="charge-hourly">Default hourly rate</label>
                                            <input
                                                id="charge-hourly"
                                                className="rps-input"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                disabled={homeCharges.chargeType !== 'hourly' || homeChargesLoading}
                                                value={homeCharges.hourlyRate}
                                                onChange={(e) => setHomeCharges((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="rps-field">
                                            <label htmlFor="charge-usd">USD exchange rate (1 USD ≈ ?)</label>
                                            <input
                                                id="charge-usd"
                                                className="rps-input"
                                                type="number"
                                                min="0"
                                                step="any"
                                                disabled={homeChargesLoading}
                                                value={homeCharges.usdRate}
                                                onChange={(e) => setHomeCharges((prev) => ({ ...prev, usdRate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="rps-form-actions">
                                            <button type="submit" className="rps-btn rps-btn-primary" disabled={homeChargesSaving || homeChargesLoading}>
                                                {homeChargesSaving ? 'Saving…' : 'Save charges'}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <aside className="rps-summary-card">
                                    <p className="rps-label">Active rate</p>
                                    <div className="rps-summary-rate">{chargesCurrency} {fmtNum(activeRate)}</div>
                                    <p className="rps-summary-sub">{homeCharges.chargeType === 'daily' ? 'per day of care' : 'per hour of care'}</p>
                                    <div className="rps-summary-rows">
                                        <div>
                                            <span>{homeCharges.chargeType === 'daily' ? '1 day' : '1 day (24 h)'}</span>
                                            <b>{chargesCurrency} {fmtNum(summaryTotal1)}</b>
                                        </div>
                                        <div>
                                            <span>{homeCharges.chargeType === 'daily' ? '3 days' : '3 days (72 h)'}</span>
                                            <b>{chargesCurrency} {fmtNum(summaryTotal2)}</b>
                                        </div>
                                        <div>
                                            <span>Exchange</span>
                                            <b>{usdRateNum ? `1 USD = ${chargesCurrency} ${fmtNum(usdRateNum)}` : '—'}</b>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Users & Roles ────────────────────────────────────── */}
                {isManager && activeTab === 'users' && (
                    <section className="rps-panel" role="tabpanel">
                        <div className="rps-card rps-panel-card">
                            <div className="rps-panel-head">
                                <div>
                                    <h2>Users &amp; Roles</h2>
                                    <p>Manage who has access, their branch and what they can do.</p>
                                </div>
                                <div className="rps-panel-actions">
                                    <div className="rps-search">
                                        <IconSearch />
                                        <input
                                            type="search"
                                            placeholder="Search users…"
                                            aria-label="Search users"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <button type="button" className="rps-btn rps-btn-primary" onClick={openAddUserModal}>
                                        <IconPlus />
                                        Add User
                                    </button>
                                </div>
                            </div>

                            <div className="rps-table-scroll">
                                <table className="rps-users">
                                    <thead>
                                        <tr>
                                            <th>User</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '28px 12px', color: THEME.colors.gray, fontSize: '.86rem' }}>
                                                    {userSearch ? 'No users match your search.' : 'No users yet — add your first team member.'}
                                                </td>
                                            </tr>
                                        )}
                                        {filteredUsers.map((u, idx) => {
                                            const roleKey = String(u.role || 'staff').toLowerCase();
                                            const pillClass =
                                                roleKey.includes('manager') || roleKey.includes('admin') ? 'rps-pill-manager'
                                                    : roleKey === 'accountant' ? 'rps-pill-accountant'
                                                        : roleKey === 'driver' ? 'rps-pill-driver'
                                                            : 'rps-pill-staff';
                                            const isActiveUser = !(u.is_active === false || u.is_active === 0);
                                            const busy = assigningBranch === u.user_id;
                                            return (
                                                <tr key={u.user_id ?? idx}>
                                                    <td data-label="User" className="rps-cell-user-td">
                                                        <div className="rps-cell-user">
                                                            <div className={'rps-avatar rps-av-' + ((idx % 5) + 1)}>{userInitials(u)}</div>
                                                            <div className="rps-who">
                                                                <div className="rps-name">{u.full_name || u.username || u.email || 'Unnamed user'}</div>
                                                                <div className="rps-email">{u.email || u.username || ''}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td data-label="Role">
                                                        <span className={'rps-pill ' + pillClass}>{u.role || 'Staff'}</span>
                                                    </td>
                                                    <td data-label="Branch">
                                                        <select
                                                            className="rps-mini-select"
                                                            value={String(u.branch_id || '')}
                                                            disabled={busy}
                                                            aria-label={'Assign branch for ' + (u.full_name || u.email || 'user')}
                                                            onChange={(e) => handleAssignBranch(u, e.target.value)}
                                                        >
                                                            {!u.branch_id && <option value="">Unassigned</option>}
                                                            {activeBranches.map((b) => (
                                                                <option key={b.branch_id} value={String(b.branch_id)}>{b.branch_name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td data-label="Status">
                                                        <span className={'rps-status ' + (isActiveUser ? 'on' : 'off')}>
                                                            <span className="rps-dot" />
                                                            {busy ? 'Saving…' : (isActiveUser ? 'Active' : 'Inactive')}
                                                        </span>
                                                    </td>
                                                    <td data-label="" className="rps-cell-actions">
                                                        <span className="rps-actions-row">
                                                            <button
                                                                type="button"
                                                                className="rps-icon-btn"
                                                                title="Edit user"
                                                                onClick={() => showToast('User editing is coming soon')}
                                                            >
                                                                <IconPencil />
                                                            </button>
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Branches ─────────────────────────────────────────── */}
                {isMultiTenant && activeTab === 'branches' && (
                    <section className="rps-panel" role="tabpanel">
                        <div className="rps-panel-head">
                            <div>
                                <h2>Branches</h2>
                                <p>Locations belonging to this organization.</p>
                            </div>
                        </div>

                        <div className="rps-branch-grid">
                            {branches.length === 0 && (
                                <p style={{ color: THEME.colors.gray, fontSize: '.86rem' }}>No branches found.</p>
                            )}
                            {branches.map((b, i) => {
                                const branchActive = !(b.is_active === false || b.is_active === 0);
                                return (
                                    <article key={b.branch_id ?? i} className="rps-card rps-branch-card">
                                        {isMainBranch(b) && <span className="rps-tag-main">Main branch</span>}
                                        <div className="rps-branch-top">
                                            <div className="rps-branch-icon"><IconBuilding /></div>
                                            <div>
                                                <div className="rps-branch-name">{b.branch_name || 'Branch'}</div>
                                                <div className="rps-branch-loc">{b.location || b.branch_location || b.town || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="rps-branch-meta">
                                            <span>{b.branch_code || b.slug || ('Branch ' + (i + 1))}</span>
                                            <span className={'rps-status ' + (branchActive ? 'on' : 'off')}>
                                                <span className="rps-dot" />
                                                {branchActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Organization ─────────────────────────────────────── */}
                {activeTab === 'organization' && (
                    <section className="rps-panel" role="tabpanel">
                        <div className="rps-card rps-panel-card">
                            <div className="rps-panel-head">
                                <div>
                                    <h2>Organization</h2>
                                    <p>These details appear on the dashboard, intake/release forms and printed documents.</p>
                                </div>
                            </div>

                            {orgStatus && (
                                <div className={'rps-inline-status ' + orgStatus.type} role="status">
                                    {orgStatus.message}
                                </div>
                            )}

                            <div className="rps-org-layout">
                                <aside className="rps-logo-box">
                                    <div className="rps-logo-preview">
                                        {companyLogo ? (
                                            <img
                                                src={companyLogo}
                                                alt={`${settings?.tenantName || 'Company'} logo`}
                                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            (settings?.tenantName || 'O').trim().charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {isManager && (
                                        <>
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                                                onChange={handleLogoFile}
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                type="button"
                                                className="rps-btn rps-btn-ghost rps-btn-sm"
                                                onClick={() => logoInputRef.current?.click()}
                                                disabled={logoUploading}
                                            >
                                                {logoUploading ? 'Uploading…' : (companyLogo ? 'Replace logo' : 'Upload logo')}
                                            </button>
                                        </>
                                    )}
                                    <p className="rps-hint">JPG, PNG, GIF, WEBP or SVG — up to 10 MB.</p>
                                </aside>

                                {isManager ? (
                                    <form onSubmit={saveOrganization} className="rps-form-grid" noValidate>
                                        <div className="rps-field rps-full">
                                            <label htmlFor="org-name">Organization name</label>
                                            <input
                                                id="org-name"
                                                className="rps-input"
                                                type="text"
                                                required
                                                minLength={2}
                                                value={orgForm.tenantName}
                                                onChange={(e) => setOrgForm((prev) => ({ ...prev, tenantName: e.target.value }))}
                                                placeholder="e.g. Montezuma Monalisa Funeral Home"
                                            />
                                        </div>
                                        <div className="rps-field">
                                            <label htmlFor="org-phone">Phone</label>
                                            <input
                                                id="org-phone"
                                                className="rps-input"
                                                type="text"
                                                value={orgForm.phone}
                                                onChange={(e) => setOrgForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                placeholder="+254 …"
                                            />
                                        </div>
                                        <div className="rps-field">
                                            <label htmlFor="org-email">Email</label>
                                            <input
                                                id="org-email"
                                                className="rps-input"
                                                type="email"
                                                value={orgForm.email}
                                                onChange={(e) => setOrgForm((prev) => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>
                                        <div className="rps-field">
                                            <label htmlFor="org-location">Location</label>
                                            <input
                                                id="org-location"
                                                className="rps-input"
                                                type="text"
                                                value={orgForm.location}
                                                onChange={(e) => setOrgForm((prev) => ({ ...prev, location: e.target.value }))}
                                            />
                                        </div>
                                        <div className="rps-field">
                                            <label htmlFor="org-country">Country</label>
                                            <input
                                                id="org-country"
                                                className="rps-input"
                                                type="text"
                                                value={orgForm.country}
                                                onChange={(e) => setOrgForm((prev) => ({ ...prev, country: e.target.value }))}
                                            />
                                        </div>
                                        <div className="rps-form-actions">
                                            <button type="submit" className="rps-btn rps-btn-primary" disabled={orgSaving}>
                                                {orgSaving ? 'Saving…' : 'Save changes'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Non-managers see the read-only summary (old banner content). */
                                    <div className="rps-org-readonly">
                                        <div><p className="rps-label">Organization Name</p><p className="rps-value">{settings?.tenantName || storedBranding.name || 'Not specified'}</p></div>
                                        <div><p className="rps-label">Phone</p><p className="rps-value">{displayPhone || 'Not specified'}</p></div>
                                        <div><p className="rps-label">Location</p><p className="rps-value">{settings?.location || 'Not specified'}</p></div>
                                        <div><p className="rps-label">Country</p><p className="rps-value">{settings?.country || 'Not specified'}</p></div>
                                        <div><p className="rps-label">Email</p><p className="rps-value">{settings?.email || 'Not specified'}</p></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* ── Add User modal ──────────────────────────────────────── */}
            {showAddUserModal && (
                <div
                    className="rps-modal"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowAddUserModal(false); }}
                >
                    <div className="rps-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rps-modal-title">
                        <div className="rps-modal-head">
                            <div>
                                <h3 id="rps-modal-title">Add user</h3>
                                <p>Create an account and assign their branch &amp; role.</p>
                            </div>
                            <button type="button" className="rps-icon-btn" aria-label="Close" onClick={() => setShowAddUserModal(false)}>
                                <IconClose />
                            </button>
                        </div>

                        <form className="rps-modal-body" onSubmit={handleAddUser} noValidate>
                            {formError && (
                                <div className="rps-inline-status error" role="alert" style={{ marginBottom: 0 }}>
                                    {formError}
                                </div>
                            )}

                            <div className="rps-field">
                                <label htmlFor="nu-name">Full name</label>
                                <input
                                    id="nu-name"
                                    className="rps-input"
                                    type="text"
                                    value={userForm.full_name}
                                    onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="e.g. Amina Hassan"
                                />
                            </div>
                            <div className="rps-field">
                                <label htmlFor="nu-email">Email</label>
                                <input
                                    id="nu-email"
                                    className="rps-input"
                                    type="email"
                                    required
                                    value={userForm.email}
                                    onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div className="rps-grid2">
                                <div className="rps-field">
                                    <label htmlFor="nu-phone">Phone</label>
                                    <input
                                        id="nu-phone"
                                        className="rps-input"
                                        type="text"
                                        value={userForm.phone}
                                        onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+254 …"
                                    />
                                </div>
                                <div className="rps-field">
                                    <label htmlFor="nu-role">Role</label>
                                    <select
                                        id="nu-role"
                                        className="rps-input"
                                        value={userForm.role}
                                        onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="accountant">Accountant</option>
                                        <option value="driver">Driver</option>
                                    </select>
                                </div>
                            </div>
                            {activeBranches.length > 0 && (
                                <div className="rps-field">
                                    <label htmlFor="nu-branch">Branch</label>
                                    <select
                                        id="nu-branch"
                                        className="rps-input"
                                        value={String(userForm.branch_id || '')}
                                        onChange={(e) => setUserForm((prev) => ({ ...prev, branch_id: e.target.value }))}
                                    >
                                        <option value="">Select branch…</option>
                                        {activeBranches.map((b) => (
                                            <option key={b.branch_id} value={String(b.branch_id)}>
                                                {b.branch_name}{isMainBranch(b) ? ' (main)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="rps-field">
                                <label htmlFor="nu-pwd">Temporary password</label>
                                <div className="rps-pwd-row">
                                    <input
                                        id="nu-pwd"
                                        className="rps-input"
                                        type="text"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                                        placeholder="Optional"
                                    />
                                    <button type="button" className="rps-btn rps-btn-ghost" onClick={generatePassword}>
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div className="rps-modal-foot">
                                <button type="button" className="rps-btn rps-btn-ghost" onClick={() => setShowAddUserModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="rps-btn rps-btn-primary">
                                    Create user
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Toast ───────────────────────────────────────────────── */}
            {toast && (
                <div className="rps-toast" role="status" aria-live="polite">
                    <span className="rps-tick"><IconCheck /></span>
                    <span>{toast}</span>
                </div>
            )}
        </div>
    );
}