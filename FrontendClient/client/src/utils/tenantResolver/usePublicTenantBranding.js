/**
 * PUBLIC tenant branding for the unauthenticated postmortem portal.
 * =============================================================================
 * The verify page and the results page are PUBLIC routes — they are NOT wrapped
 * in <ProtectedRoute>/<TenantResolver>, so the Zustand tenant store stays null
 * for the family member who opened the link, and localStorage holds nothing
 * either. resolveTenantBranding() therefore has no source to read, which is why
 * both pages used to fall through to a hardcoded placeholder logo.
 *
 * The tenant-service exposes `GET /tenant/:slug/settings` with NO auth
 * middleware (services/tenant-service/server.ts), it returns `logoUrl` /
 * `logo_url`, and the gateway forwards the `tenant` prefix as a pre-auth route
 * — so this works for an anonymous visitor. This hook fetches it with the SAME
 * rule Settings → Organization uses to display the logo, so what the family sees
 * is the exact logo the admin uploaded.
 */
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { getTenantSlug } from '../globalAuth';
import {
  resolveTenantLogoSrc,
  firstNonEmptyString,
} from './tenantBranding';

/**
 * Resolve which tenant slug this page is for. The public routes are slug-first
 * (`/<slug>/postmortem-verify`), with legacy slug-less aliases
 * (`/postmortem/verify`) that must fall back to the session's tenant.
 */
export const resolveSlugForPortal = (urlSlug) =>
  firstNonEmptyString(urlSlug) || getTenantSlug() || '';

/**
 * @param {string} [urlSlug] - the `:slug` route param, when the URL carries one
 * @returns {{ slug: string, logoUrl: string, name: string, location: string,
 *            country: string, phone: string, email: string, loading: boolean }}
 */
export const usePublicTenantBranding = (urlSlug) => {
  const slug = resolveSlugForPortal(urlSlug);

  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (!slug) {
      setRemote(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    // Send the slug explicitly: the shared axios interceptor can only add
    // `x-tenant-slug` from localStorage, which is empty for an anonymous family
    // member, and the gateway's pre-auth pass needs the client's slug.
    api
      .get(`/tenant/${slug}/settings`, { headers: { 'x-tenant-slug': slug } })
      .then((res) => {
        if (cancelled) return;
        setRemote(res?.data?.data ?? null);
      })
      .catch((err) => {
        // A missing/renamed tenant must not break the document — the pages
        // simply fall back to their monogram/placeholder crest.
        console.warn('[postmortem] tenant branding fetch failed:', err?.message);
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  // Derived from `remote` (memoised so the object identity is stable across
  // renders and does not re-trigger the logo <img> load in the pages).
  return useMemo(() => {
    const t = remote || {};

    // Same alias order SettingsPage reads: logoUrl → logo_url → logo.
    // resolveTenantLogoSrc applies the identical URL normalisation.
    const logoUrl = resolveTenantLogoSrc(
      firstNonEmptyString(t.logoUrl, t.logo_url, t.logo)
    );

    return {
      slug,
      logoUrl,
      name: firstNonEmptyString(t.tenantName, t.name),
      location: firstNonEmptyString(t.location, t.address),
      country: firstNonEmptyString(t.country),
      phone: firstNonEmptyString(t.phone),
      email: firstNonEmptyString(t.email),
      loading,
    };
  }, [remote, slug, loading]);
};

export default usePublicTenantBranding;