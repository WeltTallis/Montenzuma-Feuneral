import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { ShieldCheck, Search, AlertCircle, Loader, Phone, Lock, EyeOff, Clock } from 'lucide-react';
import api from '../../api/axios';
import { getTenantHeaders } from '../../api/endpoints';

// ─── Google Fonts ────────────────────────────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// ─── Design tokens (new palette) ────────────────────────────
const C = {
  paper: '#f3efe5',
  paper2: '#f7f4ec',
  paper3: '#fdfbf5',
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

// ─── Animations ──────────────────────────────────────────────
const spin = keyframes`to{transform:rotate(360deg)}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;
const fadeIn = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;

// ─── Page Wrapper (full width, background matches card) ────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${C.paper3};  /* background matches card */
  font-family: 'Saira', sans-serif;
  color: ${C.ink};
  padding: 0;               /* no padding — full width */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow: hidden;

  /* Watermark behind content */
  &::before {
    content: 'VERIFIED';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-family: 'Fraunces', serif;
    font-size: 14rem;
    font-weight: 900;
    color: rgba(77, 95, 66, .035);
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: .05em;
    z-index: 0;
  }
`;

// ─── Top accent strip (thin moss line, no thick bars) ──────
const TopRule = styled.div`
  width: 100%;
  height: 1px;
  background: ${C.mossDeep};
  position: relative;
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 1px;
    background: ${C.och};
  }
`;

// ─── Sheet (full width, no radius) ─────────────────────────
const Sheet = styled.div`
  width: 100%;
  background: transparent;  /* card same as page bg — seamless */
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} .55s ${C.ease} both;
`;

const SheetInner = styled.div`
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  padding: 56px 24px 48px;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (min-height: 700px) {
    padding-top: 72px;
    padding-bottom: 64px;
  }
`;

// ─── Seal ──────────────────────────────────────────────────
const Seal = styled.div`
  width: 84px;
  height: 84px;
  margin: 0 auto 24px;
  border: 2px solid ${C.mossDeep};
  border-radius: 50%;
  background: ${C.paper2};
  display: grid;
  place-items: center;
  color: ${C.mossDeep};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 5px;
    border: 1px solid rgba(77, 95, 66, .35);
    border-radius: 50%;
  }

  svg {
    width: 32px;
    height: 32px;
    color: ${C.mossDeep};
  }
`;

const SealStamp = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: ${C.ox};
  color: ${C.paper};
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid ${C.paper3};
  transform: rotate(12deg);
`;

// ─── Eyebrow ───────────────────────────────────────────────
const Eyebrow = styled.div`
  text-align: center;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .3em;
  color: ${C.och};
  font-weight: 700;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;

  &::before, &::after {
    content: '';
    display: inline-block;
    width: 32px;
    height: 1px;
    background: ${C.och};
    vertical-align: middle;
    margin: 0 12px;
    opacity: .5;
  }
`;

// ─── Title & Subtitle ───────────────────────────────────────
const Title = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: 2.2rem;
  font-weight: 600;
  margin: 0 0 12px;
  letter-spacing: -.01em;
  color: ${C.ink};
  text-align: center;
  line-height: 1.15;

  .accent {
    color: ${C.mossDeep};
    font-style: italic;
  }
`;

const Subtitle = styled.p`
  color: ${C.ink2};
  font-family: 'Fraunces', serif;
  font-size: .95rem;
  margin: 0 auto 32px;
  line-height: 1.65;
  text-align: center;
  max-width: 40ch;
  font-style: italic;
`;

// ─── Toggle Group ──────────────────────────────────────────
const ToggleGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 1px solid ${C.hair};
`;

const ToggleBtn = styled.button`
  background: none;
  border: none;
  padding: 14px 8px;
  font-family: 'Saira', sans-serif;
  font-size: .78rem;
  font-weight: 700;
  color: ${p => p.$active ? C.ink : C.ink2};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 2px solid ${p => p.$active ? C.mossDeep : 'transparent'};
  margin-bottom: -1px;
  transition: all .2s ${C.ease};
  text-transform: uppercase;
  letter-spacing: .08em;

  svg {
    width: 13px;
    height: 13px;
    color: ${p => p.$active ? C.mossDeep : C.ink2};
    transition: color .2s ${C.ease};
  }

  &:hover {
    color: ${C.ink};
    svg { color: ${C.och}; }
  }

  @media (max-width: 480px) {
    font-size: .68rem;
    padding: 12px 4px;
    gap: 4px;
    span { display: ${p => p.$active ? 'inline' : 'none'}; }
  }
`;

// ─── Input Group ───────────────────────────────────────────
const InputGroup = styled.div`
  text-align: left;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .15em;
  color: ${C.moss};
  margin-bottom: 10px;
`;

const LabelIcon = styled.span`
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  background: rgba(154, 106, 30, .10);
  color: ${C.och};
  font-size: 10px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  > svg {
    position: absolute;
    left: 16px;
    color: ${C.ink2};
    pointer-events: none;
    width: 16px;
    height: 16px;
  }

  input {
    width: 100%;
    padding: 16px 16px 16px 46px;
    border: 1px solid ${C.hair};
    background: ${C.paper2};
    font-family: 'Saira', sans-serif;
    font-size: 15px;
    color: ${C.ink};
    outline: none;
    transition: all .2s ${C.ease};
    border-radius: 0;

    &::placeholder { color: #a7a294; }
    &:focus {
      background: #fff;
      border-color: ${C.moss};
      box-shadow: 0 0 0 4px rgba(77, 95, 66, .12);
    }
    &.error {
      border-color: ${C.ox};
      background: rgba(124, 43, 35, .04);
      animation: ${shake} .4s ease;
    }
    &:disabled {
      opacity: .6;
      cursor: not-allowed;
    }
  }
`;

// ─── Error Box ─────────────────────────────────────────────
const ErrorBox = styled.div`
  background: rgba(124, 43, 35, .08);
  border: 1px solid rgba(124, 43, 35, .25);
  border-left: 4px solid ${C.ox};
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #5a1f1a;
  margin-top: 16px;
  text-align: left;
  line-height: 1.5;
  border-radius: 0;

  svg {
    flex-shrink: 0;
    color: ${C.ox};
    width: 16px;
    height: 16px;
    margin-top: 1px;
  }
`;

// ─── Action Button ────────────────────────────────────────
const ActionButton = styled.button`
  background: ${C.ox};
  color: ${C.paper};
  border: 1px solid ${C.ox};
  padding: 16px;
  font-family: 'Saira', sans-serif;
  font-size: .82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .14em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all .2s ${C.ease};
  width: 100%;
  margin-top: 20px;
  border-radius: 0;
  box-shadow: 0 6px 16px -4px rgba(124, 43, 35, .35);

  &:hover:not(:disabled) {
    background: #6a241e;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px -4px rgba(124, 43, 35, .45);
  }

  svg {
    width: 14px;
    height: 14px;
    color: rgba(243, 239, 229, .9);
  }

  &:disabled {
    background: ${C.ink2};
    border-color: ${C.ink2};
    cursor: not-allowed;
    box-shadow: none;
    opacity: .7;
  }
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(243, 239, 229, .35);
  border-top-color: ${C.paper};
  animation: ${spin} .7s linear infinite;
  display: inline-block;
`;

// ─── Trust Footer ──────────────────────────────────────────
const TrustFooter = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px dashed ${C.hair};
  text-align: center;
  position: relative;
  z-index: 1;
`;

const TrustRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const TrustItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${C.ink2};
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .12em;

  svg {
    width: 11px;
    height: 11px;
    color: ${C.moss};
  }
`;

const TrustTagline = styled.p`
  margin-top: 16px;
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: .82rem;
  color: ${C.ink2};
  line-height: 1.5;
  max-width: 38ch;
  margin-left: auto;
  margin-right: auto;
`;

// ─── Component ──────────────────────────────────────────────
const PostmortemVerifyPage = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tenantSlug = 'montenzuma-monalisa-feuneral-home-nairobi';

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

      const response = await api.get('/deceased/public/postmortem/search', {
        params,
        headers: {
          'x-tenant-slug': tenantSlug
        }
      });

      if (response.data?.success && response.data?.data) {
        const { deceased, postmortem } = response.data.data;

        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const slugLocal = 'montenzuma-monalisa-feuneral-home-nairobi';

        const sessionData = {
          deceased: {
            ...deceased,
            signature: deceased?.signature || null,
            pathologist_signature: deceased?.pathologist_signature || null
          },
          postmortem,
          verifiedAt: new Date().toISOString(),
          searchType,
          searchValue: value
        };
        console.log('Storing session data with signature:', {
          signature: sessionData.deceased.signature,
          pathologist_signature: sessionData.deceased.pathologist_signature
        });
        sessionStorage.setItem(`postmortem_session_${sessionId}`, JSON.stringify(sessionData));

        navigate(`/tenant/${slugLocal}/postmortem/results/${sessionId}`, {
          state: sessionData
        });
      } else {
        setError('No record found. Please verify your details and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errMsg = err.response?.data?.message;
      if (errMsg) {
        setError(errMsg);
      } else if (err.response?.status === 404) {
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
      <PageWrapper>
        <TopRule />

        <Sheet>
          <SheetInner>

            {/* ─── Seal ─── */}
            <Seal>
              <ShieldCheck size={32} />
              <SealStamp>★</SealStamp>
            </Seal>

            <Eyebrow>Confidential Access</Eyebrow>

            <Title>Identity <span className="accent">Verification</span></Title>
            <Subtitle>
              Enter your details to verify your identity and securely access the postmortem report.
            </Subtitle>

            {/* ─── Toggle Group ─── */}
            <ToggleGroup>
              <ToggleBtn
                $active={searchType === 'phone'}
                onClick={() => handleToggle('phone')}
              >
                <Search size={13} /> <span>Phone</span>
              </ToggleBtn>
              <ToggleBtn
                $active={searchType === 'id'}
                onClick={() => handleToggle('id')}
              >
                <ShieldCheck size={13} /> <span>ID Number</span>
              </ToggleBtn>
              <ToggleBtn
                $active={searchType === 'deceased_id'}
                onClick={() => handleToggle('deceased_id')}
              >
                <AlertCircle size={13} /> <span>Deceased ID</span>
              </ToggleBtn>
            </ToggleGroup>

            {/* ─── Form ─── */}
            <form onSubmit={handleVerify}>
              <InputGroup>
                <Label htmlFor="verifyInput">
                  <LabelIcon><i className="fas fa-hashtag"></i></LabelIcon>
                  {searchType === 'phone' ? 'Phone Number' :
                    searchType === 'id' ? 'ID Number' : 'Deceased ID'}
                </Label>
                <InputWrapper>
                  {searchType === 'phone' && <Search size={16} />}
                  {searchType === 'id' && <ShieldCheck size={16} />}
                  {searchType === 'deceased_id' && <AlertCircle size={16} />}
                  <input
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
                    className={error ? 'error' : ''}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </InputWrapper>
              </InputGroup>

              {error && (
                <ErrorBox>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </ErrorBox>
              )}

              <ActionButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Verify Identity
                  </>
                )}
              </ActionButton>
            </form>

            {/* ─── Trust Footer ─── */}
            <TrustFooter>
              <TrustRow>
                <TrustItem><Lock size={11} /> Encrypted</TrustItem>
                <TrustItem><EyeOff size={11} /> Private</TrustItem>
                <TrustItem><Clock size={11} /> Session-Bound</TrustItem>
              </TrustRow>
              <TrustTagline>
                Your information is used solely for verification and is never stored beyond this session.
              </TrustTagline>
            </TrustFooter>

          </SheetInner>
        </Sheet>
      </PageWrapper>
    </>
  );
};

export default PostmortemVerifyPage;