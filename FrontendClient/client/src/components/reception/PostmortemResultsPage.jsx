import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { Download, AlertCircle } from 'lucide-react';
import notify from '../../utils/notify';
import { resolveTenantBranding, resolveTenantLogoSrc, firstNonEmptyString } from '../../utils/tenantResolver/tenantBranding';
import usePublicTenantBranding from '../../utils/tenantResolver/usePublicTenantBranding';
import { useTenantStore } from '../../modules/seo/useTenantStore';

// Fonts (Saira, Fraunces, JetBrains Mono, Mr Dafoe) are already served from the
// single combined @import in src/index.css — nothing is re-imported here.

// ─── Print rules only (fonts stay in index.css) ────────────
const PrintStyles = createGlobalStyle`
  @media print {
    body { background: #fff; }
    [data-print="hide"] { display: none !important; }
  }
`;

// ─── Design tokens (matches PostmortemRequestForm / verify) ─
const C = {
  ink: '#1a1611',
  ink2: '#5f584c',
  inkFaint: '#a39d90',
  line: '#e6e2d8',
  lineSoft: '#f1efe9',
  paper: '#faf9f6',
  ox: '#7c2b23',
  oxDeep: '#6a241e',
  green: '#3f5138',
  red: '#b91c1c',
  ease: 'cubic-bezier(.32, .72, .24, 1)',
  sans: "'Saira', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── Animations ────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

// ─── Layout ────────────────────────────────────────────────
const Shell = styled.div`
  font-family: ${C.sans};
  background: #fff;
  color: ${C.ink};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: anywhere;
`;

const Card = styled.div`
  width: 100%;
  max-width: 860px;
  background: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(26,22,17,.04), 0 24px 60px -24px rgba(26,22,17,.14);
  animation: ${fadeIn} .5s ${C.ease} both;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) { min-height: 100vh; }
`;

/* watermark behind content */
const Watermark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-weight: 900;
  font-size: 9rem;
  letter-spacing: .05em;
  color: rgba(26, 22, 17, .03);
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
`;

const AccentLine = styled.div`
  height: 3px;
  background: linear-gradient(90deg, ${C.ox} 0 60%, ${C.ink} 60% 100%);
`;

// ─── Document header (logo · title · ref/meta) ─────────────
const DocHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 20px 40px;
  border-bottom: 1px solid ${C.lineSoft};
  position: relative;
  z-index: 1;

  @media (max-width: 640px) { gap: 12px; padding: 16px 20px; }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

// ─── FUNERAL HOME LOGO SLOT ────────────────────────────────
// Tenant logo → monogram initial → flame placeholder, so the slot is never
// empty (and never shows a broken-image glyph) on a document a family keeps.
const LogoBox = styled.div`
  width: 64px;
  height: 64px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${C.line};
  background: #fff;
  padding: 6px;

  @media (max-width: 640px) { width: 52px; height: 52px; padding: 5px; }
`;

const LogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const LogoMonogram = styled.span`
  font-weight: 700;
  font-size: 1.6rem;
  color: ${C.ox};
  line-height: 1;
`;

const DhTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -.01em;
  @media (max-width: 640px) { font-size: 15px; }
`;

const DhSub = styled.div`
  font-family: ${C.mono};
  font-size: .62rem;
  font-weight: 500;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: ${C.inkFaint};
  margin-top: 3px;
  @media (max-width: 640px) { display: none; }
`;

const DhMeta = styled.div`
  font-family: ${C.mono};
  font-size: .68rem;
  letter-spacing: .08em;
  color: ${C.inkFaint};

  b { color: ${C.ink2}; font-weight: 500; font-variant-numeric: tabular-nums; }
`;

const DhContact = styled.div`
  font-family: ${C.mono};
  font-size: .6rem;
  letter-spacing: .04em;
  color: ${C.inkFaint};
  line-height: 1.7;
  max-width: 46ch;
`;

// ─── Title ─────────────────────────────────────────────────
const TitleSection = styled.div`
  padding: 30px 40px 26px;
  text-align: center;
  position: relative;
  z-index: 1;

  h1 { font-size: 26px; font-weight: 600; letter-spacing: -.01em; }
  h1 em { font-style: italic; color: ${C.ox}; }
  p { font-size: 13.5px; color: ${C.ink2}; margin-top: 6px; }

  @media (max-width: 640px) {
    padding: 24px 20px 20px;
    h1 { font-size: 21px; }
  }
`;

// ─── Section bar (dark ink + mono) ─────────────────────────
const SBar = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.6rem;
  padding: .72rem 1.15rem;
  background: ${C.ink};
  border-radius: 3px;

  .n { font-family: ${C.mono}; font-size: .68rem; font-weight: 500; color: rgba(250,248,244,.42); }
  .t { font-family: ${C.mono}; font-size: .78rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #faf8f4; }
`;

// ─── Body ──────────────────────────────────────────────────
const Body = styled.div`
  padding: 0 40px 28px;
  position: relative;
  z-index: 1;
  @media (max-width: 640px) { padding: 0 20px 22px; }
`;

const Salutation = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
`;

const Hint = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${C.ink2};
  margin-bottom: 30px;
  max-width: 92%;

  strong { color: ${C.ox}; font-weight: 600; }
`;

/* case head (like request-form step 2) */
const CaseId = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 1.7rem;
`;

const CaseName = styled.h2`
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -.01em;
  line-height: 1.2;
  margin: 0;
  @media (max-width: 640px) { font-size: 22px; }
`;

const CaseAdm = styled.div`
  font-family: ${C.mono};
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .07em;
  color: ${C.ox};
  margin-top: 7px;

  span { color: ${C.inkFaint}; font-weight: 500; }
`;

const StatusPill = styled.div`
  flex: none;
  font-family: ${C.mono};
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: ${C.green};
  border: 1px solid rgba(63, 81, 56, .35);
  padding: 6px 12px;
  white-space: nowrap;
`;

/* data grid (request-form CaseGrid) */
const Grid = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 2.5rem;
  margin: 0 0 2.4rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; column-gap: 0; }
`;

const Item = styled.div`
  padding: 11px 0;
  border-bottom: 1px dashed ${C.line};

  &.full { grid-column: 1 / -1; }

  dt {
    font-family: ${C.mono};
    font-size: .56rem;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: ${C.inkFaint};
    margin-bottom: 4px;
  }
  dd { font-size: 14.5px; font-weight: 500; font-variant-numeric: tabular-nums; margin: 0; }
`;

/* summary box */
const SummaryBox = styled.div`
  margin: 0 0 2.4rem;
  padding: 22px 26px;
  background: ${C.paper};
  border-left: 3px solid ${C.ox};
  position: relative;

  &::before {
    content: '§';
    position: absolute;
    top: 14px;
    right: 18px;
    font-size: 1.8rem;
    color: ${C.ox};
    opacity: .4;
  }

  .sum-label {
    font-family: ${C.mono};
    font-size: .56rem;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: ${C.ink2};
    margin-bottom: 10px;
  }

  p { font-size: 14.5px; line-height: 1.75; color: #2a2620; margin: 0; }
`;

// ─── Signatures ────────────────────────────────────────────
const Signatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  position: relative;
  margin: 8px 0 40px;

  @media (max-width: 768px) { grid-template-columns: 1fr; gap: 36px; }
`;

const OfficialStamp = styled.div`
  position: absolute;
  top: -34px;
  right: 20px;
  width: 118px;
  height: 118px;
  border: 3px solid ${C.ox};
  border-radius: 50%;
  color: ${C.ox};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-transform: uppercase;
  font-weight: 700;
  font-size: .62rem;
  letter-spacing: .12em;
  transform: rotate(-12deg);
  background: rgba(255, 255, 255, .9);
  text-align: center;
  z-index: 5;

  &::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px solid ${C.ox};
    border-radius: 50%;
  }

  @media (max-width: 768px) { width: 96px; height: 96px; top: -46px; right: 6px; font-size: .55rem; }
`;

const StampStar = styled.div`
  font-size: 1rem;
  margin: 3px 0;
  color: ${C.ox};
`;

const StampMain = styled.div`
  font-size: .95rem;
  letter-spacing: .08em;
  font-weight: 700;
  @media (max-width: 768px) { font-size: .8rem; }
`;

const SigScript = styled.div`
  font-family: 'Mr Dafoe', cursive;
  font-size: 2.4rem;
  color: ${C.ink};
  line-height: 1;
  min-height: 52px;

  &.ox { color: ${C.ox}; }
`;

const SigLine = styled.div`
  border-top: 2px solid ${C.ink};
  padding-top: 8px;
  margin-bottom: 10px;
`;

const SigName = styled.div`
  font-weight: 600;
  font-size: 15px;
`;

const SigTitle = styled.div`
  font-size: .85rem;
  color: ${C.ink2};
  margin-top: 2px;
`;

const SigMeta = styled.div`
  margin-top: 8px;
  font-family: ${C.mono};
  font-size: .72rem;
  color: ${C.ink2};
  line-height: 1.7;
`;

/* verification strip */
const VerifyStrip = styled.div`
  margin-top: 6px;
  border-top: 1px dashed ${C.line};
  border-bottom: 1px dashed ${C.line};
  padding: 14px 4px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-family: ${C.mono};
  font-size: .68rem;
  letter-spacing: .06em;
  color: ${C.inkFaint};

  b { color: ${C.ink2}; font-weight: 600; font-variant-numeric: tabular-nums; }
  @media (max-width: 640px) { flex-direction: column; gap: 6px; }
`;

// ─── Footer buttons ────────────────────────────────────────
const FormFooter = styled.div`
  border-top: 1px solid ${C.lineSoft};
  padding: 18px 40px;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;

  @media (max-width: 640px) {
    padding: 14px 20px;
    flex-direction: column-reverse;
    button { width: 100%; justify-content: center; }
  }
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 24px;
  font-family: ${C.sans};
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid transparent;
  transition: all .2s ${C.ease};

  &:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

  ${p => p.$ghost && `
    background: #fff;
    border-color: ${C.line};
    color: ${C.ink2};
    &:hover:not(:disabled) { border-color: ${C.ink2}; color: ${C.ink}; }
  `}

  ${p => p.$primary && `
    background: ${C.ox};
    color: #fff;
    box-shadow: 0 6px 16px -4px rgba(124,43,35,.4);
    &:hover:not(:disabled) {
      background: ${C.oxDeep};
      transform: translateY(-1px);
      box-shadow: 0 10px 24px -4px rgba(124,43,35,.5);
    }
  `}

  svg { width: 15px; height: 15px; }
`;

// ─── Dark footer ───────────────────────────────────────────
const ElegantFooter = styled.footer`
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-top: auto;
  background: #14110d;
  color: #f3efe5;
  text-align: center;
  padding: 52px 24px 0;

  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    pointer-events: none;
  }
  &::before { bottom: -240px; width: 480px; height: 480px; border: 1.5px solid rgba(243,239,229,.08); }
  &::after  { bottom: -300px; width: 640px; height: 640px; border: 1px solid rgba(243,239,229,.05); }

  @media (max-width: 640px) { padding: 44px 20px 0; }
`;

const FooterTagline = styled.p`
  position: relative;
  z-index: 1;
  font-size: 19px;
  font-weight: 400;
  line-height: 1.55;
  color: rgba(243,239,229,.88);
  max-width: 44ch;
  margin: 0 auto;
`;

const FooterValues = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  max-width: 420px;
  margin: 24px auto 0;

  &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(243,239,229,.15); }

  span {
    font-family: ${C.mono};
    font-weight: 700;
    font-size: .58rem;
    letter-spacing: .26em;
    text-transform: uppercase;
    color: rgba(243,239,229,.6);
    white-space: nowrap;
  }
`;

const FooterBar = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 40px;
  border-top: 1px solid rgba(243,239,229,.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 18px 32px;
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(243,239,229,.5);

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 6px;
    padding: 16px 20px;
    text-align: center;
  }
`;

// ─── Loading & Expired helpers ─────────────────────────────
const CenterBox = styled.div`
  text-align: center;
  padding: 80px 24px;
  position: relative;
  z-index: 1;

  h2 { font-size: 24px; font-weight: 600; margin-bottom: 10px; }
  p { color: ${C.ink2}; margin-bottom: 28px; }

  .icon-alert { color: ${C.ox}; margin: 0 auto 16px; }
  .loading-text { font-size: 15px; color: ${C.ink2}; font-style: italic; }
`;

// ─── Component ─────────────────────────────────────────────
const PostmortemResultsPage = () => {
  const { sessionId, slug: urlSlug } = useParams();
  const location = useLocation();
  const { tenantData } = useTenantStore();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatureError, setSignatureError] = useState(false);
  // A stored logo URL can still 404 (tenant deleted the file, or it was never
  // uploaded under that key). Swapping to the monogram on error stops the crest
  // showing a broken-image glyph on a document a family keeps.
  const [logoError, setLogoError] = useState(false);

  // Branding fallback is resolved BEFORE the early returns below — calling
  // useMemo after a conditional return breaks React's hook ordering.
  const brand = useMemo(() => resolveTenantBranding(tenantData), [tenantData]);

  // ── Public tenant branding ────────────────────────────────────
  // This route is PUBLIC (a family member opens it from the link on the QR
  // card), so the tenant store and localStorage are both empty here and
  // `brand` has nothing to read. The session payload also carries no logo —
  // the public search selects only name/address/phone/email. Fetch the tenant
  // record directly so the report is letterheaded with the logo the admin
  // uploaded in Settings. Slug priority: URL → session.
  const publicBranding = usePublicTenantBranding(urlSlug || reportData?.tenantSlug);

  // A different tenant's logo arriving must re-arm the image, otherwise a stale
  // logoError would permanently suppress it.
  useEffect(() => { setLogoError(false); }, [publicBranding.logoUrl]);

  useEffect(() => {
    if (location.state) {
      console.log('Loading from location.state:', location.state);
      setReportData(location.state);
      setLoading(false);
    } else {
      const storedData = sessionStorage.getItem(`postmortem_session_${sessionId}`);
      console.log('Loading from sessionStorage:', storedData ? 'Found' : 'Not found');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('Parsed session data:', parsedData);
          setReportData(parsedData);
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse session data:', e);
          window.location.href = '/postmortem-verify';
        }
      } else {
        window.location.href = '/postmortem-verify';
      }
    }
  }, [location.state, sessionId]);

  const handleDownloadPDF = async () => {
    if (!reportData?.deceased?.admission_number) return;

    try {
      const url = `/deceased/public/postmortem/${reportData.deceased.admission_number}/pdf`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to generate PDF`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `postmortem-${reportData.deceased.admission_number}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('PDF download error:', error);
      notify.error('Download failed', error.message || 'Please try again or contact support.');
    }
  };

  // Keep the tenant slug in the URL. The legacy alias `/postmortem-verify` has no
  // slug, so the verify page could not know whose logo/name to show and had to
  // fall back to a placeholder — every "verify again" click threw the branding away.
  const verifyPath = publicBranding.slug
    ? `/${publicBranding.slug}/postmortem-verify`
    : '/postmortem-verify';

  const handleBackToVerify = () => {
    window.location.href = verifyPath;
  };

  if (loading) {
    return (
      <Shell>
        <Card>
          <AccentLine aria-hidden="true" />
          <CenterBox>
            <div className="loading-text">Loading report…</div>
          </CenterBox>
        </Card>
      </Shell>
    );
  }

  if (!reportData) {
    return (
      <Shell>
        <Card>
          <AccentLine aria-hidden="true" />
          <CenterBox>
            <AlertCircle size={48} className="icon-alert" />
            <h2>Session Expired</h2>
            <p>Please verify your identity again to access the report.</p>
            <div>
              <Btn type="button" $primary onClick={handleBackToVerify}>
                Back to Verification
              </Btn>
            </div>
          </CenterBox>
        </Card>
      </Shell>
    );
  }

  const { deceased, postmortem, verifiedAt } = reportData;
  const status = postmortem?.status || 'completed';

  // ── Letterhead data ──────────────────────────────────────────
  // The report payload is authoritative for the RECORD; the tenant record
  // fetched for this page's slug is authoritative for the LETTERHEAD (it is the
  // same GET /tenant/:slug/settings payload, with the same logo URL
  // normalisation, that Settings → Organization displays). resolveTenantBranding()
  // remains the last-resort chain (it merges the tenant store over login-time
  // localStorage and rebases the logo onto the public gateway origin so a stored
  // "http://api-gateway:5000/..." logo actually loads instead of failing as
  // mixed content). Nothing is invented here — a missing value renders blank.
  const apiTenant = reportData?.tenant || {};
  const apiDec = reportData?.deceased || {};

  const tenantName = firstNonEmptyString(
    apiTenant.name,
    apiTenant.tenantName,
    apiDec.tenant_name,
    publicBranding.name,
    brand.name
  );
  const tenantAddress = apiTenant.address
    || apiDec.tenant_address
    || publicBranding.location
    || brand.displayAddress
    || brand.location
    || '';
  const tenantPhone = apiTenant.phone
    || apiDec.tenant_phone
    || publicBranding.phone
    || brand.displayPhone
    || '';
  // resolveTenantBranding() pads a non-email string with "@restpoint.co.ke".
  // Harmless for an input, wrong on an official document, so validate.
  const emailCandidate = apiTenant.email || apiDec.tenant_email || publicBranding.email || brand.displayEmail || '';
  const tenantEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate) ? emailCandidate : '';
  const tenantCountry = apiTenant.country || apiDec.tenant_country || publicBranding.country || brand.country || '';
  // Priority: the tenant record fetched for THIS slug (same source + same URL
  // normalisation as Settings → Organization) → anything the session payload
  // carried → the store/localStorage chain. resolveTenantLogoSrc() turns a
  // stored relative path into a loadable URL and rebases internal origins, so a
  // "/uploads/tenants/<slug>/logos/x.png" or an "http://api-gateway:5000/..."
  // value actually loads instead of silently degrading to the monogram.
  const tenantLogo = resolveTenantLogoSrc(
    publicBranding.logoUrl
      || apiTenant.logoUrl
      || apiTenant.logo_url
      || apiTenant.logo
      || apiDec.tenant_logo
      || brand.tenantLogoUrl
  );

  // Initials for the crest fallback, e.g. "Lee Funeral Home" → "L".
  const tenantInitial = (tenantName || '').trim().charAt(0).toUpperCase();

  // Contact lines for the masthead, only those the tenant actually has.
  const contactLines = [
    tenantAddress,
    tenantPhone ? `Tel: ${tenantPhone}` : '',
    tenantEmail,
    tenantCountry,
  ].filter(Boolean);

  const now = new Date();
  const issuedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <>
      <PrintStyles />
      <Shell>
        <Card>

          <Watermark aria-hidden="true">CONFIDENTIAL</Watermark>
          <AccentLine aria-hidden="true" />

          {/* ── Document header: logo · title · ref/meta (no badge — removed) ── */}
          <DocHeader>
            <HeaderLeft>
              <Brand>
                {/* ══ FUNERAL HOME LOGO SLOT — tenant logo → monogram → flame ══ */}
                <LogoBox>
                  {tenantLogo && !logoError ? (
                    <LogoImg
                      src={tenantLogo}
                      alt={`${tenantName || 'Organisation'} logo`}
                      onError={() => setLogoError(true)}
                    />
                  ) : tenantInitial ? (
                    <LogoMonogram>{tenantInitial}</LogoMonogram>
                  ) : (
                    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
                      <circle cx="24" cy="24" r="22.5" stroke="#7c2b23" strokeWidth="1.6" />
                      <circle cx="24" cy="24" r="19" stroke="#7c2b23" strokeWidth=".8" opacity=".35" />
                      <g transform="translate(12 12)" stroke="#7c2b23" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </g>
                    </svg>
                  )}
                </LogoBox>
                <div>
                  <DhTitle>Postmortem Examination Report</DhTitle>
                  <DhSub>{tenantName || 'Mortuary & Bereavement Services'}</DhSub>
                </div>
              </Brand>
              <DhMeta>
                REF <b>{deceased?.admission_number || 'N/A'}</b> · ISSUED <b>{issuedDate}</b>
              </DhMeta>
              {contactLines.length > 0 && (
                <DhContact>{contactLines.join(' · ')}</DhContact>
              )}
            </HeaderLeft>
          </DocHeader>

          {/* ── Title ── */}
          <TitleSection>
            <h1>Postmortem <em>Report</em></h1>
            <p>Official examination findings, formally verified and released to the authorised next of kin.</p>
          </TitleSection>

          {/* ── Report body ── */}
          <Body>

            <Salutation>
              To the Family of <b>{deceased?.full_name || 'the Deceased'}</b>,
            </Salutation>

            <Hint>
              Please find enclosed the official postmortem examination report regarding the passing of{' '}
              <strong>{deceased?.full_name || 'the Deceased'}</strong>. This document has been prepared by the
              attending pathologist and formally verified by our records department. We extend our deepest
              sympathies during this difficult time.
            </Hint>

            {/* case head */}
            <CaseId>
              <div>
                <CaseName>{deceased?.full_name || '—'}</CaseName>
                <CaseAdm><span>ADMISSION</span> {deceased?.admission_number || 'N/A'}</CaseAdm>
              </div>
              <StatusPill>{status}</StatusPill>
            </CaseId>

            {/* 01 · decedent information */}
            <SBar><span className="n">01</span><span className="t">Decedent Information</span></SBar>
            <Grid>
              <Item><dt>Full Legal Name</dt><dd>{deceased?.full_name || 'N/A'}</dd></Item>
              <Item><dt>Admission Number</dt><dd>{deceased?.admission_number || 'N/A'}</dd></Item>
              <Item>
                <dt>Date of Birth</dt>
                <dd>{deceased?.date_of_birth
                  ? new Date(deceased.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}</dd>
              </Item>
              <Item>
                <dt>Date of Death</dt>
                <dd>{deceased?.date_of_death
                  ? new Date(deceased.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}</dd>
              </Item>
              <Item>
                <dt>Age &amp; Gender</dt>
                <dd>{deceased?.age ? `${deceased.age} Years` : 'N/A'} · {deceased?.gender || 'N/A'}</dd>
              </Item>
              <Item><dt>Place of Death</dt><dd>{deceased?.place_of_death || 'N/A'}</dd></Item>
            </Grid>

            {/* 02 · next of kin */}
            <SBar><span className="n">02</span><span className="t">Next of Kin / Authorising Party</span></SBar>
            <Grid>
              <Item><dt>Kin Name</dt><dd>{deceased?.next_of_kin_name || 'N/A'}</dd></Item>
              <Item><dt>Relationship</dt><dd>{deceased?.next_of_kin_relationship || 'N/A'}</dd></Item>
              <Item><dt>Telephone</dt><dd>{deceased?.next_of_kin_phone || deceased?.phone_number || 'N/A'}</dd></Item>
              <Item><dt>ID Number</dt><dd>{deceased?.next_of_kin_id_number || deceased?.national_id || 'N/A'}</dd></Item>
            </Grid>

            {/* 03 · postmortem results */}
            <SBar><span className="n">03</span><span className="t">Postmortem Results</span></SBar>
            <Grid>
              <Item>
                <dt>Examination Date</dt>
                <dd>{postmortem?.completed_at
                  ? new Date(postmortem.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}</dd>
              </Item>
              <Item>
                <dt>Attending Pathologist</dt>
                <dd>{postmortem?.pathologist_name || postmortem?.external_pathologist_name || 'N/A'}</dd>
              </Item>
              <Item><dt>Manner of Death</dt><dd>{postmortem?.manner_of_death || 'N/A'}</dd></Item>
              <Item><dt>Immediate Cause</dt><dd>{postmortem?.immediate_cause_of_death || 'N/A'}</dd></Item>
              <Item className="full"><dt>Underlying Cause</dt><dd>{postmortem?.underlying_cause_of_death || 'N/A'}</dd></Item>
            </Grid>

            {postmortem?.examination_summary && (
              <SummaryBox>
                <div className="sum-label">Examination Summary</div>
                <p>{postmortem.examination_summary}</p>
              </SummaryBox>
            )}

            {/* 04 · certification */}
            <SBar><span className="n">04</span><span className="t">Certification &amp; Signatures</span></SBar>

            <Signatures>
              <OfficialStamp aria-hidden="true">
                <div>Verified</div>
                <StampStar>★</StampStar>
                <StampMain>Official</StampMain>
                <div>{now.getFullYear()} · PM</div>
              </OfficialStamp>

              <div>
                <SigScript>
                  {(() => {
                    const signatureUrl = reportData?.postmortem?.signature
                      || reportData?.postmortem?.pathologist_signature
                      || reportData?.deceased?.pathologist_signature
                      || reportData?.deceased?.signature;
                    console.log('[PostmortemResults] Signature URL:', signatureUrl, 'Full reportData:', reportData);
                    if (signatureUrl && !signatureError) {
                      const absoluteUrl = signatureUrl.startsWith('http')
                        ? signatureUrl
                        : `${window.location.origin}${signatureUrl.startsWith('/') ? '' : '/'}${signatureUrl}`;
                      return (
                        <img
                          src={absoluteUrl}
                          alt="Pathologist Signature"
                          style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }}
                          onError={() => setSignatureError(true)}
                        />
                      );
                    }
                    return postmortem?.pathologist_name || 'Pathologist';
                  })()}
                </SigScript>
                <SigLine />
                <SigName>{postmortem?.pathologist_name || 'Attending Pathologist'}</SigName>
                <SigTitle>{postmortem?.pathologist_credentials || 'Pathologist'}</SigTitle>
                <SigMeta>
                  {postmortem?.pathologist_license ? `License: ${postmortem.pathologist_license}` : ''}
                  {postmortem?.pathologist_license ? <br /> : null}
                  Signed: {postmortem?.completed_at
                    ? new Date(postmortem.completed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </SigMeta>
              </div>

              <div>
                <SigScript className="ox">{deceased?.next_of_kin_name || 'Next of Kin'}</SigScript>
                <SigLine />
                <SigName>{deceased?.next_of_kin_name || 'Next of Kin'}</SigName>
                <SigTitle>Next of Kin / Authorising Party</SigTitle>
                <SigMeta>
                  ID: {deceased?.next_of_kin_id_number || deceased?.national_id || 'N/A'}<br />
                  Verified: {new Date(verifiedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </SigMeta>
              </div>
            </Signatures>

            {/* verification strip */}
            <VerifyStrip>
              <span>SESSION · <b>{sessionId}</b></span>
              <span>STATUS · <b>{status.toUpperCase()}</b></span>
              <span>TIMESTAMP · <b>{now.toISOString()}</b></span>
            </VerifyStrip>

          </Body>

          {/* ── Footer actions (hidden when printing) ── */}
          <FormFooter data-print="hide">
            <Btn type="button" $ghost onClick={handleBackToVerify}>
              <AlertCircle size={15} />
              New Verification
            </Btn>
            <Btn type="button" $primary onClick={handleDownloadPDF}>
              <Download size={15} />
              Download PDF Report
            </Btn>
          </FormFooter>

          {/* ── Dark footer (hidden when printing) ── */}
          <ElegantFooter data-print="hide">
            <FooterTagline>
              Received with dignity. Cared for with respect. Remembered with love.
            </FooterTagline>
            <FooterValues>
              <span>Dignity</span><span>Care</span><span>Respect</span>
            </FooterValues>
            <FooterBar>
              <span>© {now.getFullYear()} {tenantName || 'RestPoint Funeral Management'}</span>
              <span>Official Postmortem Report</span>
            </FooterBar>
          </ElegantFooter>

        </Card>
      </Shell>
    </>
  );
};

export default PostmortemResultsPage;