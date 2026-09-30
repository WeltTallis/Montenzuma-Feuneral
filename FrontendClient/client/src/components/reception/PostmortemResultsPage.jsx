import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Download, AlertCircle, CheckCircle, User, Phone, FileText, Shield } from 'lucide-react';
import notify from '../../utils/notify';
import { resolveTenantBranding } from '../../utils/tenantResolver/tenantBranding';
import { useTenantStore } from '../../modules/seo/useTenantStore';

// The old per-component `createGlobalStyle` Google Fonts block was removed when
// the app consolidated every family into the single combined @import in
// src/index.css. All four families it loaded (Saira, Fraunces, JetBrains Mono,
// Mr Dafoe) are already served from there, so the block was left behind as an
// empty template that rendered nothing. Restoring the @import would duplicate
// the request; re-adding it per component is explicitly discouraged in index.css.

// ─── Design tokens (new palette) ────────────────────────────
const C = {
  paper: '#f3efe5',
  paper2: '#f7f4ec',
  ink: '#211d17',
  ink2: '#5d554a',
  hair: 'rgba(33, 29, 23, .16)',
  hair2: 'rgba(33, 29, 23, .38)',
  ox: '#7c2b23',
  moss: '#4d5f42',
  mossDeep: '#2f3d28',
  och: '#9a6a1e',
  ease: 'cubic-bezier(.32, .72, .24, 1)',
};

// ─── Page Wrapper (no padding) ────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top center, #efe9da 0%, #e3ddcc 100%);
  font-family: 'Saira', sans-serif;
  color: ${C.ink};
  padding: 0; /* all padding removed */
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: center;
`;

// ─── Sheet (no radius, top border lines removed) ────────────
const Sheet = styled.div`
  width: 100%;
  max-width: 850px;
  margin: 0;
  background: #fdfbf5;
  box-shadow:
    0 1px 0 rgba(255,255,255,.6) inset,
    0 2px 4px rgba(33, 29, 23, .04),
    0 24px 60px -20px rgba(33, 29, 23, .25);
  position: relative;
  overflow: hidden;
  border-radius: 0;
  /* top border lines (::before moss bar + ::after ochre rule) removed */

  @media (max-width: 768px) {
    min-height: 100vh;
  }
`;

const SheetInner = styled.div`
  padding: 64px 72px 56px;
  position: relative;

  @media (max-width: 768px) {
    padding: 40px 28px 32px;
  }
`;

// ─── Watermark ───────────────────────────────────────────────
const Watermark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-family: 'Fraunces', serif;
  font-size: 8rem;
  font-weight: 900;
  color: rgba(77, 95, 66, 0.04);
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  letter-spacing: .05em;
`;

// ─── Letterhead ──────────────────────────────────────────────
// Centred masthead (name → tagline → logo → contact → case ref) so the real
// tenant's identity leads the document. The old split logo-left / ref-right
// grid gave the organisation's own details less weight than the case number.
const Letterhead = styled.div`
  text-align: center;
  padding-bottom: 36px;
  border-bottom: 3px double ${C.ink};
  margin-bottom: 44px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding-bottom: 26px;
    margin-bottom: 30px;
  }
`;

const BrandName = styled.h2`
  font-family: 'Fraunces', serif;
  font-size: 2rem;
  font-weight: 700;
  color: ${C.mossDeep};
  letter-spacing: .02em;
  line-height: 1.15;
  margin: 0;
  /* A long trading name must wrap rather than push the sheet sideways. */
  overflow-wrap: anywhere;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Tagline = styled.span`
  display: block;
  margin-top: 6px;
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .24em;
  color: ${C.och};
`;

// Circular crest. Holds the tenant's real uploaded logo when there is one, and
// falls back to the mortuary cross (then to a monogram) so the slot is never
// empty on an official document.
const Logo = styled.div`
  width: 76px;
  height: 76px;
  margin: 22px auto 0;
  border: 2px solid ${C.mossDeep};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.mossDeep};
  background: ${C.paper2};
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    margin-top: 18px;
  }
`;

const LogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Breathing room so a logo with its own padding isn't clipped by the circle. */
  padding: 8px;
`;

const LogoMonogram = styled.span`
  font-family: 'Fraunces', serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: ${C.mossDeep};
  line-height: 1;
`;

const AddressBlock = styled.address`
  margin: 18px auto 0;
  font-family: 'JetBrains Mono', monospace;
  font-style: normal;
  font-size: .74rem;
  line-height: 1.75;
  color: ${C.ink2};
  max-width: 34rem;

  span {
    display: block;
  }
`;

const RefLine = styled.p`
  margin: 14px 0 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  color: ${C.ink2};

  b {
    color: ${C.ink};
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;

// ─── Salutation & Intro ─────────────────────────────────────
const Salutation = styled.div`
  font-size: 1rem;
  margin-bottom: 24px;
  font-weight: 600;
  color: ${C.ink};
  position: relative;
  z-index: 1;
`;

const IntroText = styled.p`
  font-family: 'Fraunces', serif;
  font-size: 1.05rem;
  margin-bottom: 40px;
  max-width: 92%;
  line-height: 1.75;
  color: ${C.ink};
  position: relative;
  z-index: 1;

  .highlight {
    font-style: italic;
    font-weight: 700;
    color: ${C.mossDeep};
  }
`;

// ─── Data Section ────────────────────────────────────────────
const DataSection = styled.div`
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const DataHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: .82rem;
  text-transform: uppercase;
  letter-spacing: .18em;
  font-weight: 700;
  color: ${C.mossDeep};
  margin-bottom: 20px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${C.hair};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${C.och};
    padding: 5px;
    background: rgba(154, 106, 30, .10);
    box-sizing: content-box;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 12px;
  border-bottom: 1px dotted ${C.hair};

  &.full {
    grid-column: 1 / -1;
  }

  label {
    font-size: .68rem;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: ${C.ink2};
    font-weight: 600;
  }

  span {
    font-size: 1.02rem;
    color: ${C.ink};
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
`;

// ─── Summary Box ─────────────────────────────────────────────
const SummaryBox = styled.div`
  margin: 32px 0;
  padding: 24px 28px;
  background: ${C.paper2};
  border-left: 4px solid ${C.och};
  position: relative;

  &::before {
    content: '§';
    font-family: 'Fraunces', serif;
    font-size: 2rem;
    color: ${C.och};
    position: absolute;
    top: 16px;
    right: 20px;
    opacity: .45;
  }

  p {
    margin: 0;
    font-family: 'Fraunces', serif;
    font-size: .95rem;
    line-height: 1.75;
    color: #2a2620;
  }

  strong {
    display: block;
    margin-bottom: 8px;
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: ${C.ink};
    font-weight: 600;
  }
`;

// ─── Signatures ──────────────────────────────────────────────
const Signatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  margin-top: 64px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-top: 80px;
  }
`;

const OfficialStamp = styled.div`
  position: absolute;
  top: -24px;
  right: 32px;
  width: 120px;
  height: 120px;
  border: 3px solid ${C.ox};
  border-radius: 50%;
  color: ${C.ox};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-transform: uppercase;
  font-weight: 700;
  font-size: .65rem;
  letter-spacing: .12em;
  transform: rotate(-12deg);
  opacity: .85;
  text-align: center;
  z-index: 5;
  background: rgba(253, 251, 245, .85);

  &::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px solid ${C.ox};
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    right: 16px;
    width: 100px;
    height: 100px;
    font-size: .6rem;
    top: -40px;
  }
`;

const StampStar = styled.div`
  font-size: 1.1rem;
  margin: 4px 0;
  color: ${C.ox};
`;

const StampMain = styled.div`
  font-size: 1rem;
  letter-spacing: .08em;
  font-weight: 900;

  @media (max-width: 768px) { font-size: .85rem; }
`;

const SigBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const SigScript = styled.div`
  font-family: 'Mr Dafoe', cursive;
  font-size: 2.6rem;
  color: ${C.mossDeep};
  line-height: 1;
  margin-bottom: 8px;
  min-height: 50px;

  &.ox { color: ${C.ox}; }
`;

const SigLine = styled.div`
  border-top: 2px solid ${C.ink};
  padding-top: 8px;
  margin-bottom: 12px;
`;

const SigName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: ${C.ink};
`;

const SigTitle = styled.div`
  font-size: .85rem;
  color: ${C.ink2};
  margin-top: 2px;
`;

const SigMeta = styled.div`
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  color: ${C.ink2};
  line-height: 1.6;
`;

// ─── Footer Actions ──────────────────────────────────────────
const FooterActions = styled.div`
  margin-top: 48px;
  padding-top: 40px;
  border-top: 1px dashed ${C.hair};
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
`;

const VerificationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(77, 95, 66, .08);
  border: 1px solid rgba(77, 95, 66, .25);
  padding: 16px 24px;
  border-radius: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const VbLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VbIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${C.moss};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const VbText = styled.div`
  strong {
    display: block;
    color: ${C.mossDeep};
    font-size: .9rem;
    font-weight: 700;
  }

  span {
    font-size: .72rem;
    color: ${C.ink2};
    font-family: 'JetBrains Mono', monospace;
  }
`;

const VbRight = styled.div`
  text-align: right;
  font-size: .72rem;
  color: ${C.ink2};
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.6;

  strong {
    color: ${C.ink2};
    font-weight: 600;
    letter-spacing: .15em;
    font-size: .62rem;
    text-transform: uppercase;
  }

  @media (max-width: 768px) {
    text-align: left;
  }
`;

const BtnRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  flex: 1;
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  font-family: 'Saira', sans-serif;
  font-size: .82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .12em;
  cursor: pointer;
  border-radius: 0;
  transition: all .2s ${C.ease};
  border: 1px solid transparent;

  ${props => props.$primary ? `
    background: ${C.moss};
    color: #f3efe5;
    border-color: ${C.moss};
    box-shadow: 0 6px 16px -4px rgba(77, 95, 66, .35);
    &:hover {
      background: ${C.mossDeep};
      transform: translateY(-1px);
      box-shadow: 0 10px 22px -4px rgba(77, 95, 66, .45);
    }
  ` : `
    background: transparent;
    color: ${C.ink};
    border-color: ${C.hair2};
    &:hover {
      background: ${C.paper};
      border-color: ${C.ink2};
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }

  &:disabled {
    background: #999;
    color: white;
    cursor: not-allowed;
  }
`;

// ─── Loading & Expired helpers ──────────────────────────────
const CenterBox = styled.div`
  text-align: center;
  padding: 64px 0;

  h2 {
    font-family: 'Fraunces', serif;
    color: ${C.ink};
    margin-bottom: 12px;
    font-size: 1.5rem;
  }

  p {
    color: ${C.ink2};
    margin-bottom: 32px;
  }

  .icon-alert {
    color: ${C.ox};
    margin-bottom: 16px;
  }

  .loading-text {
    font-size: 1.1rem;
    color: ${C.ink2};
    font-family: 'Fraunces', serif;
    font-style: italic;
  }
`;

// ─── Component ──────────────────────────────────────────────
const PostmortemResultsPage = () => {
  // `slug` is intentionally not used for branding — deriving the funeral home's
  // name from the URL was what produced reports letterheaded by the wrong org.
  const { sessionId } = useParams();
  const location = useLocation();
  const { tenantData } = useTenantStore();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatureError, setSignatureError] = useState(false);
  // A stored logo URL can still 404 (tenant deleted the file, or it was never
  // uploaded under that key). Swapping to the monogram on error stops the crest
  // showing a broken-image glyph on a document a family keeps.
  const [logoError, setLogoError] = useState(false);

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

  const handleBackToVerify = () => {
    window.location.href = '/postmortem-verify';
  };

  if (loading) {
    return (
      <>
        <PageWrapper>
          <Sheet>
            <SheetInner>
              <CenterBox>
                <div className="loading-text">Loading report…</div>
              </CenterBox>
            </SheetInner>
          </Sheet>
        </PageWrapper>
      </>
    );
  }

  if (!reportData) {
    return (
      <>
        <PageWrapper>
          <Sheet>
            <SheetInner>
              <CenterBox>
                <AlertCircle size={48} className="icon-alert" />
                <h2>Session Expired</h2>
                <p>Please verify your identity again to access the report.</p>
                <Button $primary onClick={handleBackToVerify}>
                  Back to Verification
                </Button>
              </CenterBox>
            </SheetInner>
          </Sheet>
        </PageWrapper>
      </>
    );
  }

  const { deceased, postmortem, verifiedAt } = reportData;
  const status = postmortem?.status || 'completed';

  // ── Letterhead data ──────────────────────────────────────────
  // The report payload is authoritative; resolveTenantBranding() is the fallback
  // (it merges the tenant store over login-time localStorage and, importantly,
  // REBASES the logo URL onto the public gateway origin so a stored
  // "http://api-gateway:5000/..." logo actually loads instead of failing as
  // mixed content). The old formatTenantName() guessed the funeral home's name
  // from the URL slug and hardcoded "Rest Point Funeral Home" / "Nairobi, Kenya",
  // which meant a family could be handed a report letterheaded by the WRONG
  // organisation. Nothing is invented here — a missing value renders blank.
  const brand = useMemo(() => resolveTenantBranding(tenantData), [tenantData]);
  const apiTenant = reportData?.tenant || {};
  const apiDec = reportData?.deceased || {};

  const tenantName = apiTenant.name
    || apiTenant.tenantName
    || apiDec.tenant_name
    || brand.name
    || '';
  const tenantAddress = apiTenant.address
    || apiDec.tenant_address
    || brand.displayAddress
    || brand.location
    || '';
  const tenantPhone = apiTenant.phone
    || apiDec.tenant_phone
    || brand.displayPhone
    || '';
  // resolveTenantBranding() pads a non-email string with "@restpoint.co.ke".
  // Harmless for an input, wrong on an official document, so validate.
  const emailCandidate = apiTenant.email || apiDec.tenant_email || brand.displayEmail || '';
  const tenantEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate) ? emailCandidate : '';
  const tenantCountry = apiTenant.country || apiDec.tenant_country || brand.country || '';
  const tenantLogo = apiTenant.logoUrl
    || apiTenant.logo_url
    || apiTenant.logo
    || apiDec.tenant_logo
    || brand.tenantLogoUrl
    || '';

  // Initials for the crest fallback, e.g. "Lee Funeral Home" → "L".
  const tenantInitial = (tenantName || '').trim().charAt(0).toUpperCase();

  // Contact lines for the masthead, only those the tenant actually has.
  const contactLines = [
    tenantAddress,
    tenantPhone ? `Tel: ${tenantPhone}` : '',
    tenantEmail,
    tenantCountry,
  ].filter(Boolean);

  return (
    <>
      <PageWrapper>
        <Sheet>
          <Watermark>CONFIDENTIAL</Watermark>

          <SheetInner>
            {/* ─── Letterhead: real tenant name → logo → contact ─── */}
            <Letterhead>
              <BrandName>{tenantName || '—'}</BrandName>
              <Tagline>Mortuary &amp; Bereavement Services</Tagline>

              <Logo>
                {tenantLogo && !logoError ? (
                  <LogoImg
                    src={tenantLogo}
                    alt={`${tenantName || 'Organisation'} logo`}
                    onError={() => setLogoError(true)}
                  />
                ) : tenantInitial ? (
                  <LogoMonogram>{tenantInitial}</LogoMonogram>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" style={{ width: '34px', height: '34px' }}>
                    <path d="M12 2v20M12 2c-2.5 0-5 1.5-5 4 0 2.5 2.5 4 5 4M12 2c2.5 0 5 1.5 5 4 0 2.5-2.5 4-5 4M12 22c-2.5 0-5-1.5-5-4 0-2.5 2.5-4 5-4M12 22c2.5 0 5-1.5 5-4 0-2.5-2.5-4-5-4" />
                  </svg>
                )}
              </Logo>

              {contactLines.length > 0 && (
                <AddressBlock>
                  {contactLines.map((line, i) => <span key={i}>{line}</span>)}
                </AddressBlock>
              )}

              <RefLine>
                Case Reference · <b>{deceased?.admission_number || 'N/A'}</b>
                {' · '}
                Issued:{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </RefLine>
            </Letterhead>

            {/* ─── Body ─── */}
            <div className="letter-body">
              <Salutation>
                <strong>To the Family of {deceased?.full_name || 'the Deceased'},</strong>
              </Salutation>

              <IntroText>
                Please find enclosed the official postmortem examination report regarding the passing of{' '}
                <span className="highlight">{deceased?.full_name || 'the Deceased'}</span>. This document has been
                prepared by the attending pathologist and formally verified by our records department. We extend
                our deepest sympathies during this difficult time.
              </IntroText>

              {/* Section 1 — Decedent Information */}
              <DataSection>
                <DataHeading>
                  <User />
                  Decedent Information
                </DataHeading>
                <InfoGrid>
                  <InfoRow>
                    <label>Full Legal Name</label>
                    <span>{deceased?.full_name || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Admission Number</label>
                    <span>{deceased?.admission_number || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Date of Birth</label>
                    <span>{deceased?.date_of_birth
                      ? new Date(deceased.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Date of Death</label>
                    <span>{deceased?.date_of_death
                      ? new Date(deceased.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Age &amp; Gender</label>
                    <span>{deceased?.age ? `${deceased.age} Years` : 'N/A'} · {deceased?.gender || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Place of Death</label>
                    <span>{deceased?.place_of_death || 'N/A'}</span>
                  </InfoRow>
                </InfoGrid>
              </DataSection>

              {/* Section 2 — Next of Kin */}
              <DataSection>
                <DataHeading>
                  <Phone />
                  Next of Kin / Authorizing Party
                </DataHeading>
                <InfoGrid>
                  <InfoRow>
                    <label>Kin Name</label>
                    <span>{deceased?.next_of_kin_name || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Relationship</label>
                    <span>{deceased?.next_of_kin_relationship || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Telephone</label>
                    <span>{deceased?.next_of_kin_phone || deceased?.phone_number || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>ID Number</label>
                    <span>{deceased?.next_of_kin_id_number || deceased?.national_id || 'N/A'}</span>
                  </InfoRow>
                </InfoGrid>
              </DataSection>

              {/* Section 3 — Postmortem Results */}
              <DataSection>
                <DataHeading>
                  <FileText />
                  Postmortem Results
                </DataHeading>
                <InfoGrid>
                  <InfoRow>
                    <label>Examination Date</label>
                    <span>{postmortem?.completed_at
                      ? new Date(postmortem.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Attending Pathologist</label>
                    <span>{postmortem?.pathologist_name || postmortem?.external_pathologist_name || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Manner of Death</label>
                    <span>{postmortem?.manner_of_death || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow>
                    <label>Immediate Cause</label>
                    <span>{postmortem?.immediate_cause_of_death || 'N/A'}</span>
                  </InfoRow>
                  <InfoRow className="full">
                    <label>Underlying Cause</label>
                    <span>{postmortem?.underlying_cause_of_death || 'N/A'}</span>
                  </InfoRow>
                </InfoGrid>

                {postmortem?.examination_summary && (
                  <SummaryBox>
                    <strong>Examination Summary</strong>
                    <p>{postmortem.examination_summary}</p>
                  </SummaryBox>
                )}
              </DataSection>

              {/* ─── Signatures ─── */}
              <Signatures>
                <OfficialStamp>
                  <div>Verified</div>
                  <StampStar>★</StampStar>
                  <StampMain>Official</StampMain>
                  <div>{new Date().getFullYear()} · PM</div>
                </OfficialStamp>

                <SigBlock>
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
                </SigBlock>

                <SigBlock>
                  <SigScript className="ox">{deceased?.next_of_kin_name || 'Next of Kin'}</SigScript>
                  <SigLine />
                  <SigName>{deceased?.next_of_kin_name || 'Next of Kin'}</SigName>
                  <SigTitle>Next of Kin / Authorizing Party</SigTitle>
                  <SigMeta>
                    ID: {deceased?.next_of_kin_id_number || deceased?.national_id || 'N/A'}<br />
                    Verified: {new Date(verifiedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </SigMeta>
                </SigBlock>
              </Signatures>

              {/* ─── Footer / Actions ─── */}
              <FooterActions>
                <VerificationBar>
                  <VbLeft>
                    <VbIcon>
                      <Shield size={18} />
                    </VbIcon>
                    <VbText>
                      <strong>Digitally Verified &amp; Authenticated</strong>
                      <span>Session: {sessionId} · Status: {status}</span>
                    </VbText>
                  </VbLeft>
                  <VbRight>
                    <strong>Timestamp</strong><br />
                    <span>{new Date().toISOString()}</span>
                  </VbRight>
                </VerificationBar>

                <BtnRow>
                  <Button $primary onClick={handleDownloadPDF}>
                    <Download />
                    Download PDF Report
                  </Button>
                  <Button onClick={handleBackToVerify}>
                    <AlertCircle />
                    New Verification
                  </Button>
                </BtnRow>
              </FooterActions>
            </div>
          </SheetInner>
        </Sheet>
      </PageWrapper>
    </>
  );
};

export default PostmortemResultsPage;