/**
 * Tenant Branding Helper
 * This ensures forms (intake, release, etc.) always show the REAL tenant details
 * that were stored at login — no hardcoded/fake data.
 */

import env from '../config/env';
import { useTenantStore } from '../../modules/seo/useTenantStore';

// Neutral fallback values for tenant branding. NEVER hardcode a real funeral
// home's details here — a freshly registered tenant (e.g. "Lee Funeral Home")
// has nothing in localStorage yet, so anything hardcoded shows up as dummy
// data on the intake/release forms. Real values come from the Zustand tenant
// store (populated by TenantResolver for the EXACT tenant in the URL) or from
// login-time localStorage. Empty strings render as blanks, never fake data.
const DEFAULT_BRANDING = {
  name: '',
  phone: '',
  email: '',
  location: '',
  country: '',
  address: '',
  logoUrl: '',
  fontFamily: "'Saira', sans-serif",
};

/*
 * Some internal service origins MUST never be loaded directly by the browser:
 *  - docker DNS names (api-gateway, tenant-service) don't resolve on clients
 *  - http:// origins are blocked as mixed-content on HTTPS pages
 * Any upload/logo URL that starts with one of these is rebased onto the
 * public gateway origin (https://restpoint.co.ke) so it loads over HTTPS.
 */
const INTERNAL_HTTP_ORIGINS = [
  'http://api-gateway:5000',
  'http://restpoint_api_gateway:5000',
  'http://uploads-service:5012',
  'http://restpoint_uploads_service:5012',
  'http://tenant-service:5000',
  'http://restpoint_tenant_service:5000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5012',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:5002',
  'http://127.0.0.1:5012',
];

export const rebaseUploadUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  if (!rawUrl.startsWith('http')) return rawUrl;

  const publicOrigin = (env.API_GATEWAY_URL || env.UPLOADS_URL || '').replace(/\/+$/, '');
  if (!publicOrigin) return rawUrl;

  // Already on the public origin → keep as-is
  try {
    const u = new URL(rawUrl);
    const pub = new URL(publicOrigin);
    if (u.hostname === pub.hostname) return rawUrl;
  } catch { /* ignore */ }

  const match = INTERNAL_HTTP_ORIGINS.find((o) => rawUrl.startsWith(o));
  if (match) return rawUrl.replace(match, publicOrigin);

  return rawUrl;
};

/*
 * Get tenant branding details from localStorage.
 * These are stored by AuthContext at login time.
 */

export const getTenantBrandingFromStorage = () => {
  try {
    return {
      name: localStorage.getItem('tenantName') || '',
      email: localStorage.getItem('tenantEmail') || '',
      phone: localStorage.getItem('tenantPhone') || '',
      location: localStorage.getItem('tenantLocation') || '',
      country: localStorage.getItem('tenantCountry') || '',
      address: localStorage.getItem('tenantAddress') || localStorage.getItem('tenantAdress') || '',
      logoUrl: localStorage.getItem('tenantLogoUrl') || '',
      fontFamily: localStorage.getItem('tenantFont') || '',
    };
  } catch (error) {
    console.warn('Error reading tenant branding from localStorage:', error);
    return {
      name: '',
      email: '',
      phone: '',
      location: '',
      country: '',
      address: '',
      logoUrl: '',
      fontFamily: ''
    };
  }
};

/**
 * Merge tenant data from the Zustand store with localStorage fallbacks.
 * The store is populated by TenantResolver; localStorage is populated at login.
 * Using both ensures data is available even before the store resolves.
 *
 * @param {object|null} tenantData - tenant data from useTenantStore()
 * @returns {object} normalized branding fields
 */
export const resolveTenantBranding = (tenantData) => {
  // Fallback chain: 1) explicit argument, 2) the EXACT tenant data from the
  // Zustand store (populated by TenantResolver from the URL slug), 3) the
  // login-time localStorage values. Without the store fallback every form
  // rendered with hardcoded dummy branding for newly registered tenants.
  let source = tenantData;
  if (!source || typeof source !== 'object') {
    try {
      source = useTenantStore.getState()?.tenantData || null;
    } catch {
      source = null;
    }
  }
  // Unwrap raw API responses shaped { success, data: {...} }
  if (source && !source.name && !source.tenantName && source.data && typeof source.data === 'object') {
    source = source.data;
  }

  const stored = getTenantBrandingFromStorage();

  // Get tenant name with fallbacks
  const name = source?.name
    || source?.tenantName
    || stored.name
    || DEFAULT_BRANDING.name;

  // Get phone with realistic fallbacks
  const phone = source?.phone
    || source?.tenantPhone
    || stored.phone
    || DEFAULT_BRANDING.phone;

  // Get email with realistic fallbacks
  const email = source?.email
    || source?.tenantEmail
    || stored.email
    || DEFAULT_BRANDING.email;

  // Get location with fallbacks
  const location = source?.location
    || source?.tenantLocation
    || stored.location
    || DEFAULT_BRANDING.location;

  // Get country with fallbacks
  const country = source?.country
    || source?.tenantCountry
    || stored.country
    || DEFAULT_BRANDING.country;

  // Get street address with fallbacks
  const address = source?.address
    || source?.tenantAddress
    || stored.address
    || DEFAULT_BRANDING.address;

  // Font family — resolve the tenant brand font. Prefers a per-tenant override, otherwise falls
  // back to the brand font (Saira) that is already imported in index.css for the tenant pages.
  const fontFamily = source?.fontFamily
    || source?.font_family
    || source?.primaryFont
    || stored.fontFamily
    || DEFAULT_BRANDING.fontFamily
    || '';

  // Branch info (first branch) — used for display when available
  const branchInfo = source?.branches?.[0] || {};

  // Get branch display values with realistic fallbacks
  const displayBranch = branchInfo?.branch_name && branchInfo.branch_name !== name
    ? branchInfo.branch_name
    : '';

  const displayLocation = branchInfo?.branch_location
    || branchInfo?.location
    || location
    || DEFAULT_BRANDING.location;

  const displayPhone = branchInfo?.branch_phone
    || branchInfo?.phone
    || phone
    || DEFAULT_BRANDING.phone;

  const displayEmail = branchInfo?.branch_email
    || branchInfo?.email
    || email
    || DEFAULT_BRANDING.email;

  // Logo URL — normalize relative paths to full URL
  const getLogoFromTenantData = () => {
    const logo = tenantData?.logoUrl || tenantData?.logo_url || tenantData?.logo;
    const validLogo = (logo && typeof logo === 'string' && logo.trim() !== '') ? logo : null;
    return validLogo;
  };

  const rawLogoUrl = getLogoFromTenantData()
    || stored.logoUrl
    || DEFAULT_BRANDING.logoUrl;

  // Robust URL normalization to prevent malformed URLs
  let tenantLogoUrl = '';
  if (rawLogoUrl) {
    if (rawLogoUrl.startsWith('http') || rawLogoUrl.startsWith('/') || rawLogoUrl.startsWith('data:')) {
      // It's already an absolute URL, a root-relative path, or a data URI
      tenantLogoUrl = rawLogoUrl;
    } else {
      // It's a relative path from the API, need to prepend API base URL safely
      const baseUrl = env.API_GATEWAY_URL || '';
      // Remove trailing slash from base URL
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // Ensure path starts with a slash
      const cleanPath = rawLogoUrl.startsWith('/') ? rawLogoUrl : `/${rawLogoUrl}`;
      tenantLogoUrl = `${cleanBase}${cleanPath}`;
    }
  }

  // Rebase internal/docker origins (e.g. http://api-gateway:5000) onto the
  // public origin so the logo loads over HTTPS instead of failing as mixed
  // content / unresolvable DNS.
  if (tenantLogoUrl) {
    tenantLogoUrl = rebaseUploadUrl(tenantLogoUrl);
  }

  // Format phone number (if it's a Kenyan number)
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return DEFAULT_BRANDING.phone;

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254${cleaned.slice(1)}`;
    }

    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return `+254${cleaned}`;
    }

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    if (cleaned.length >= 9 && cleaned.length <= 12) {
      return `+254${cleaned}`;
    }

    return phoneNumber || DEFAULT_BRANDING.phone;
  };

  // Format email (ensure it's valid)
  const formatEmail = (emailAddress) => {
    if (!emailAddress) return DEFAULT_BRANDING.email;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(emailAddress)) {
      return emailAddress;
    }

    if (!emailAddress.includes('@')) {
      return `${emailAddress}@${DEFAULT_BRANDING.email.split('@')[1] || 'restpoint.co.ke'}`;
    }

    return emailAddress || DEFAULT_BRANDING.email;
  };

  const formattedPhone = formatPhoneNumber(displayPhone);
  const formattedEmail = formatEmail(displayEmail);

  return {
    name,
    phone: formattedPhone,
    email: formattedEmail,
    location,
    country,
    address,

    branchInfo,
    displayBranch,
    displayLocation: displayLocation || location || DEFAULT_BRANDING.location,
    displayPhone: formattedPhone,
    displayEmail: formattedEmail,
    displayAddress: address || displayLocation || location || DEFAULT_BRANDING.location,

    rawLogoUrl,
    tenantLogoUrl,

    fullAddress: [displayLocation || location, country].filter(Boolean).join(', '),
    fontFamily,
    contactInfo: {
      phone: formattedPhone,
      email: formattedEmail,
      location: displayLocation || location,
    },

    fallback: {
      fontFamily: DEFAULT_BRANDING.fontFamily,
      phone: DEFAULT_BRANDING.phone,
      email: DEFAULT_BRANDING.email,
      name: DEFAULT_BRANDING.name,
      location: DEFAULT_BRANDING.location,
      address: DEFAULT_BRANDING.Adress || DEFAULT_BRANDING.address,
    },

    hasBranding: !!(name && name !== DEFAULT_BRANDING.name),
    hasPhone: !!(phone && phone !== DEFAULT_BRANDING.phone),
    hasEmail: !!(email && email !== DEFAULT_BRANDING.email),
    hasLocation: !!(location && location !== DEFAULT_BRANDING.location),

    getDisplayName: () => displayBranch || name,
    getDisplayPhone: () => formattedPhone,
    getDisplayEmail: () => formattedEmail,
    getFullAddress: () => [displayLocation || location, country].filter(Boolean).join(', '),
  };
};

export default resolveTenantBranding;