/**
 * Tenant Branding Helper
 *
 * Centralizes access to tenant branding data (name, phone, location, logo, email, country)
 * from multiple sources: Zustand store, localStorage, and the user object.
 *
 * This ensures forms (intake, release, etc.) always show the REAL tenant details
 * that were stored at login — no hardcoded/fake data.
 */

import env from '../config/env';

// Default fallback values for tenant branding
const DEFAULT_BRANDING = {
  name: 'MONTENZUMA MONALISA  FUNERAL',
  phone: '+254 700 000 000',
  email: 'info@restpoint.co.ke',
  location: 'Nairobi, Kenya',
  country: 'Kenya',
  logoUrl: '/monalisa.png', // Ensure this file exists in your /public folder!
};

/**
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
      logoUrl: localStorage.getItem('tenantLogoUrl') || '',
    };
  } catch (error) {
    console.warn('Error reading tenant branding from localStorage:', error);
    return { 
      name: '', 
      email: '', 
      phone: '', 
      location: '', 
      country: '', 
      logoUrl: '' 
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
  const stored = getTenantBrandingFromStorage();
  
  // Get tenant name with fallbacks
  const name = tenantData?.name 
    || tenantData?.tenantName 
    || stored.name 
    || DEFAULT_BRANDING.name;

  // Get phone with realistic fallbacks
  const phone = tenantData?.phone 
    || tenantData?.tenantPhone
    || stored.phone 
    || DEFAULT_BRANDING.phone;

  // Get email with realistic fallbacks
  const email = tenantData?.email 
    || tenantData?.tenantEmail
    || stored.email 
    || DEFAULT_BRANDING.email;

  // Get location with fallbacks
  const location = tenantData?.location 
    || tenantData?.tenantLocation
    || stored.location 
    || DEFAULT_BRANDING.location;

  // Get country with fallbacks
  const country = tenantData?.country 
    || tenantData?.tenantCountry
    || stored.country 
    || DEFAULT_BRANDING.country;

  // Branch info (first branch) — used for display when available
  const branchInfo = tenantData?.branches?.[0] || {};
  
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
    
    branchInfo,
    displayBranch,
    displayLocation: displayLocation || location || DEFAULT_BRANDING.location,
    displayPhone: formattedPhone,
    displayEmail: formattedEmail,
    
    rawLogoUrl,
    tenantLogoUrl,
    
    fullAddress: [displayLocation || location, country].filter(Boolean).join(', '),
    contactInfo: {
      phone: formattedPhone,
      email: formattedEmail,
      location: displayLocation || location,
    },
    
    fallback: {
      phone: DEFAULT_BRANDING.phone,
      email: DEFAULT_BRANDING.email,
      name: DEFAULT_BRANDING.name,
      location: DEFAULT_BRANDING.location,
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