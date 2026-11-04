import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { createGlobalStyle, css, keyframes } from 'styled-components';
import { ShieldCheck, Search, AlertCircle, Lock, EyeOff, Clock } from 'lucide-react';
import api from '../../api/axios';
import usePublicTenantBranding from '../../utils/tenantResolver/usePublicTenantBranding';

// ─── Fonts (same as the request form) ──────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  img, svg { display: block; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; background: none; border: 0; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

// ─── Design tokens (matches PostmortemRequestForm) ─────────
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
const fadeUp = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

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
  box-shadow: 0 2px 6px rgba(26,22,17,.04), 0 24px 60px -24px rgba(26,22,17,.14);
  animation: ${fadeIn} .5s ${C.ease} both;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) { min-height: 100vh; }
`;

const AccentLine = styled.div`
  height: 3px;
  background: linear-gradient(90deg, ${C.ox} 0 60%, ${C.ink} 60% 100%);
`;

// ─── Document header (logo · title · live meta) ────────────
const DocHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 20px 40px;
  border-bottom: 1px solid ${C.lineSoft};

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
// The tenant logo itself comes from usePublicTenantBranding(), which reads the
// same GET /tenant/:slug/settings payload Settings → Organization displays.
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

  img { width: 100%; height: 100%; object-fit: contain; }
  svg  { width: 100%; height: 100%; }

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

// replaces the QR code — confidential badge
const SecureWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: none;
`;

const SecureBox = styled.div`
  width: 92px;
  height: 92px;
  padding: 8px;
  border: 1px solid ${C.lineSoft};
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.ox};

  svg { width: 34px; height: 34px; }
  @media (max-width: 640px) { width: 70px; height: 70px; svg { width: 26px; height: 26px; } }
`;

const SecureLabel = styled.span`
  font-family: ${C.mono};
  font-size: .56rem;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: ${C.ox};
  text-align: center;
  @media (max-width: 640px) { font-size: 8px; letter-spacing: .12em; }
`;

// ─── Title ─────────────────────────────────────────────────
const TitleSection = styled.div`
  padding: 30px 40px 26px;
  text-align: center;

  h1 { font-size: 26px; font-weight: 600; letter-spacing: -.01em; }
  h1 em { font-style: italic; color: ${C.ox}; }
  p { font-size: 13.5px; color: ${C.ink2}; margin-top: 6px; }

  @media (max-width: 640px) {
    padding: 24px 20px 20px;
    h1 { font-size: 21px; }
  }
`;

// ─── Section bar (dark ink + mono label) ───────────────────
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

// ─── Body / footer ─────────────────────────────────────────
const Body = styled.div`
  padding: 28px 40px;
  @media (max-width: 640px) { padding: 22px 20px; }
`;

const FormFooter = styled.div`
  border-top: 1px solid ${C.lineSoft};
  padding: 18px 40px;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 640px) {
    padding: 14px 20px;
    flex-direction: column-reverse;
    button { width: 100%; justify-content: center; }
  }
`;

// ─── Toggle group (styled like the request form's Seg) ─────
const ToggleGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid ${C.line};
  margin-bottom: 26px;
`;

const ToggleBtn = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 6px;
  font-family: ${C.sans};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: ${p => (p.$active ? C.ink : C.inkFaint)};
  transition: color .2s ${C.ease};

  & + & { border-left: 1px solid ${C.lineSoft}; }

  svg { width: 13px; height: 13px; flex: none; }

  &:hover { color: ${C.ink2}; }

  ${p => p.$active && `
    color: ${C.ink};
    &::after {
      content: '';
      position: absolute;
      left: 14%; right: 14%; bottom: -1px;
      height: 2px;
      background: ${C.ox};
    }
  `}

  @media (max-width: 480px) {
    font-size: .68rem;
    padding: 12px 4px;
    gap: 4px;
    span { display: ${p => (p.$active ? 'inline' : 'none')}; }
  }
`;

// ─── Underline-only field (same as request form) ───────────
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 26px;
  &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: ${C.ink2};
`;

const Field = styled.input`
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  padding: 10px 2px;
  font-size: 15px;
  color: ${C.ink};
  outline: none;
  transition: border-color .2s ${C.ease};

  &::placeholder { color: ${C.inkFaint}; font-weight: 400; }
  &:hover { border-bottom-color: ${C.ink}; }
  &:focus { border-bottom-color: ${C.ox}; }
  &:disabled { opacity: .6; cursor: not-allowed; }

  /* MUST use the css helper tag — not a bare backtick string. A plain string is
     an UNTAGGED template, so interpolating the shake keyframe calls String() on
     the Keyframes object outside a styled-components tag, which throws
     styled-components error #12 ("interpolating a keyframe declaration into an
     untagged string"). Because the interpolation is guarded by the p.$error
     check, it was only ever evaluated while an error was shown — so the page
     rendered fine, then the moment a search returned 404 this threw mid-render
     and the App Error Boundary replaced the whole screen with "Something went
     wrong". */
  ${p => p.$error && css`
    border-bottom-color: ${C.red};
    animation: ${shake} .4s ease;
  `}
`;

// ─── Error note (request-form style) ───────────────────────
const NoteErr = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.55;
  color: ${C.red};
  margin-bottom: 26px;
  animation: ${fadeUp} .25s ease both;

  svg { width: 14px; height: 14px; flex: none; margin-top: 2px; }
`;

// ─── Buttons ───────────────────────────────────────────────
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
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex: none;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  animation: ${spin} .7s linear infinite;
`;

// ─── Dark footer (request form) ────────────────────────────
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
  max-width: 460px;
  margin: 24px auto 0;

  &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(243,239,229,.15); }

  span {
    font-family: ${C.mono};
    font-weight: 700;
    font-size: .58rem;
    letter-spacing: .26em;
    text-transform: uppercase;
    color: rgba(243,239,229,.6);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;

    svg { width: 11px; height: 11px; flex: none; color: rgba(243,239,229,.55); }
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

// ─── Component ─────────────────────────────────────────────
const PostmortemVerifyPage = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const [searchType, setSearchType] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Tenant branding ──────────────────────────────────────────
  // This is a PUBLIC page (a family member opens it from a QR code), so the
  // Zustand tenant store and localStorage are both empty and the slug comes from
  // the URL. Fetch the real tenant record so the crest, the name and the tenant
  // the lookup runs against all belong to the funeral home that issued it —
  // instead of the previously hardcoded Montezuma Monalisa placeholder.
  const branding = usePublicTenantBranding(urlSlug);
  const tenantSlug = branding.slug;
  const tenantName = branding.name;
  // A stored logo URL can still 404 (the tenant deleted the file, or it was
  // never uploaded under that key). Dropping to the monogram on error stops the
  // crest showing a broken-image glyph.
  const [logoError, setLogoError] = useState(false);
  const tenantInitial = tenantName.trim().charAt(0).toUpperCase();

  // A different tenant's logo arriving (slug change / refetch) must re-arm the
  // image, otherwise the stale logoError would suppress the new logo forever.
  useEffect(() => { setLogoError(false); }, [branding.logoUrl]);

  // live date / time — same header meta as the request form
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const liveDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
  const liveTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleToggle = (type) => {
    setSearchType(type);
    setInputValue('');
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      setError('Please enter your details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchType === 'phone') {
        params.phone = value;
      } else if (searchType === 'id') {
        params.id_number = value;
      } else if (searchType === 'deceased_id') {
        params.deceased_id = value;
      }

      // Without a slug the lookup would run against the service default tenant
      // and return the wrong (or no) record, so refuse rather than guess.
      if (!tenantSlug) {
        setError('This verification link is incomplete. Please use the link provided by your funeral home.');
        return;
      }

      const response = await api.get('/deceased/public/postmortem/search', {
        params,
        headers: {
          'x-tenant-slug': tenantSlug
        }
      });

      if (response.data?.success && response.data?.data) {
        const { deceased, postmortem } = response.data.data;
        if (!deceased || !postmortem) {
          setError('Postmortem reports are available through the mortuary. Please contact the facility for assistance.');
          return;
        }

        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const sessionData = {
          deceased: {
            ...deceased,
            signature: deceased?.signature || null,
            pathologist_signature: deceased?.pathologist_signature || null
          },
          postmortem,
          verifiedAt: new Date().toISOString(),
          searchType,
          searchValue: value,
          // Carry the resolved slug into the results page so it keeps printing
          // THIS tenant's crest even after a full page reload (when React Router
          // state and the in-memory branding hook are both gone).
          tenantSlug
        };
        console.log('Storing session data with signature:', {
          signature: sessionData.deceased.signature,
          pathologist_signature: sessionData.deceased.pathologist_signature
        });
        sessionStorage.setItem(`postmortem_session_${sessionId}`, JSON.stringify(sessionData));

        navigate(`/${tenantSlug}/postmortem/results/${sessionId}`, {
          state: sessionData
        });
      } else {
        setError('No record found. Please verify your details and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      const status = err.response?.status;
      const serverMsg = String(err.response?.data?.message || '');
      // The service answers 404 for THREE very different situations. They used to
      // all collapse into the same friendly "No record found", which hid a
      // genuinely mis-routed or mis-tenanted request behind an honest "this person
      // isn't in the system" — impossible to diagnose from the screen.
      if (status === 404 && /^Route\s/i.test(serverMsg)) {
        // deceased-service's catch-all: the endpoint itself did not match.
        console.error('[PostmortemVerify] endpoint not deployed/routed:', serverMsg);
        setError('The verification service is unavailable. Please contact the funeral home.');
      } else if (status === 404 && /tenant/i.test(serverMsg)) {
        console.error('[PostmortemVerify] tenant resolution failed:', serverMsg);
        setError('This verification link is incomplete. Please use the link provided by your funeral home.');
      } else if (status === 404 || serverMsg) {
        // Expected business answer: no row matched what was typed.
        setError('No record found. Please verify your details and try again.');
      } else {
        setError('Unable to verify at this time. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <Shell>
        <Card>

          <AccentLine aria-hidden="true" />

          {/* ── Document header: logo · title · live meta · confidential badge ── */}
          <DocHeader>
            <HeaderLeft>
              <Brand>
                {/* ══ FUNERAL HOME LOGO SLOT ══
                    Renders THIS tenant's uploaded logo (the same one Settings →
                    Organization shows), then their initial, then the generic flame.
                    (LogoBox sizes any image to 64×64 with object-fit: contain)
                ═══════════════════════════════════════════════════════ */}
                <LogoBox>
                  {branding.logoUrl && !logoError ? (
                    <LogoImg
                      src={branding.logoUrl}
                      alt={`${tenantName || 'Organisation'} logo`}
                      onError={() => setLogoError(true)}
                    />
                  ) : tenantInitial ? (
                    <LogoMonogram>{tenantInitial}</LogoMonogram>
                  ) : (
                    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <circle cx="24" cy="24" r="22.5" stroke="#7c2b23" strokeWidth="1.6" />
                      <circle cx="24" cy="24" r="19" stroke="#7c2b23" strokeWidth=".8" opacity=".35" />
                      <g transform="translate(12 12)" stroke="#7c2b23" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </g>
                    </svg>
                  )}
                </LogoBox>
                <div>
                  <DhTitle>Postmortem Report Verification</DhTitle>
                  <DhSub>
                    {[tenantName, branding.location || branding.country].filter(Boolean).join(' · ')
                      || 'Official Verification Portal'}
                  </DhSub>
                </div>
              </Brand>
              <DhMeta>DATE <b>{liveDate}</b> · TIME <b>{liveTime}</b></DhMeta>
            </HeaderLeft>

            {/* replaces the QR code — keeps the confidential badge */}
            <SecureWrap>
              <SecureBox><ShieldCheck size={34} strokeWidth={1.5} /></SecureBox>
              <SecureLabel>Confidential Access</SecureLabel>
            </SecureWrap>
          </DocHeader>

          <TitleSection>
            <h1>Identity <em>Verification</em></h1>
            <p>Enter your details to verify your identity and securely access the postmortem report.</p>
          </TitleSection>

          <form onSubmit={handleVerify} noValidate>
            <Body>
              <SBar><span className="n">01</span><span className="t">Verify Identity</span></SBar>

              {error && (
                <NoteErr role="alert">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </NoteErr>
              )}

              {/* ── Toggle group ── */}
              <ToggleGroup>
                <ToggleBtn
                  type="button"
                  $active={searchType === 'phone'}
                  onClick={() => handleToggle('phone')}
                >
                  <Search size={13} /> <span>Phone</span>
                </ToggleBtn>
                <ToggleBtn
                  type="button"
                  $active={searchType === 'id'}
                  onClick={() => handleToggle('id')}
                >
                  <ShieldCheck size={13} /> <span>ID Number</span>
                </ToggleBtn>
                <ToggleBtn
                  type="button"
                  $active={searchType === 'deceased_id'}
                  onClick={() => handleToggle('deceased_id')}
                >
                  <AlertCircle size={13} /> <span>Deceased ID</span>
                </ToggleBtn>
              </ToggleGroup>

              {/* ── Input ── */}
              <FormGroup>
                <Label htmlFor="verifyInput">
                  {searchType === 'phone' ? 'Phone Number' :
                    searchType === 'id' ? 'ID Number' : 'Deceased ID'}
                </Label>
                <Field
                  id="verifyInput"
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                  }}
                  placeholder={
                    searchType === 'phone' ? '0712345678' :
                      searchType === 'id' ? '12345678' : 'MON-PET-XXXXXX-XXXXXX'
                  }
                  $error={!!error}
                  required
                  disabled={loading}
                  autoFocus
                />
              </FormGroup>
            </Body>

            <FormFooter>
              <Btn type="button" $ghost onClick={() => navigate(-1)}>Cancel</Btn>
              <Btn type="submit" $primary disabled={loading}>
                {loading ? (
                  <>
                    <Spinner />
                    Verifying…
                  </>
                ) : (
                  'Verify Identity'
                )}
              </Btn>
            </FormFooter>
          </form>

          {/* ── Dark footer — trust row lives here, like the request form values ── */}
          <ElegantFooter>
            <FooterTagline>
              Your information is used solely for verification and is never stored beyond this session.
            </FooterTagline>
            <FooterValues>
              <span><Lock size={11} /> Encrypted</span>
              <span><EyeOff size={11} /> Private</span>
              <span><Clock size={11} /> Session-Bound</span>
            </FooterValues>
            <FooterBar>
              <span>© {new Date().getFullYear()} RestPoint Funeral Management</span>
              <span>Official Postmortem Verification</span>
            </FooterBar>
          </ElegantFooter>

        </Card>
      </Shell>
    </>
  );
};

export default PostmortemVerifyPage;