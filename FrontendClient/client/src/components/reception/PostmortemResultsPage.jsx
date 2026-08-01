import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Download, AlertCircle, CheckCircle, User, Phone, FileText, Shield } from 'lucide-react';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  padding: 2rem 1rem;
  -webkit-font-smoothing: antialiased;
`;

const Sheet = styled.div`
  max-width: 850px;
  margin: 0 auto;
  background: #ffffff;
  box-shadow: 
    0 1px 3px rgba(0,0,0,0.05),
    0 10px 30px rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  border-radius: 4px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 12px;
    background: #1c4532;
    z-index: 10;
  }
  &::after {
    content: "";
    position: absolute;
    top: 12px;
    left: 0;
    right: 0;
    height: 4px;
    background: #bfa15f;
    z-index: 10;
  }
`;

const SheetInner = styled.div`
  padding: 4rem 4.5rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 2.5rem 1.75rem;
  }
`;

const Watermark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-family: 'Playfair Display', serif;
  font-size: 8rem;
  font-weight: 900;
  color: rgba(28, 69, 50, 0.03);
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
`;

const Letterhead = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
  padding-bottom: 2.5rem;
  border-bottom: 3px double #1a1a1a;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const LogoLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Logo = styled.div`
  width: 64px;
  height: 64px;
  border: 2px solid #1c4532;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1c4532;
  flex-shrink: 0;
`;

const LogoText = styled.div`
  h2 {
    font-family: 'Playfair Display', serif;
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: #1c4532;
    letter-spacing: 0.02em;
    line-height: 1.1;
  }

  .tagline {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #bfa15f;
    font-weight: 600;
    margin-top: 0.35rem;
    display: block;
  }

  .address {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.5rem;
    font-style: normal;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.4;
  }
`;

const LetterheadRight = styled.div`
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;

  @media (max-width: 768px) {
    text-align: left;
  }
`;

const RefLabel = styled.div`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const RefNumber = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const RefDate = styled.div`
  margin-top: 0.75rem;
  color: #6b7280;
`;

const Salutation = styled.div`
  font-size: 1rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const IntroText = styled.p`
  font-size: 1rem;
  margin-bottom: 2.5rem;
  max-width: 90%;
  line-height: 1.7;

  .highlight {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 700;
    color: #1c4532;
  }
`;

const DataSection = styled.div`
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
`;

const DataHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 700;
  color: #1c4532;
  margin-bottom: 1.25rem;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dotted #e5e7eb;

  &.full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6b7280;
    font-weight: 600;
  }

  span {
    font-size: 1.05rem;
    color: #1a1a1a;
    font-weight: 500;
  }
`;

const SummaryBox = styled.div`
  margin: 2rem 0;
  padding: 1.5rem 1.75rem;
  background: #f9fafb;
  border-left: 4px solid #bfa15f;
  position: relative;

  &::before {
    content: "§";
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    color: #bfa15f;
    position: absolute;
    top: 1rem;
    right: 1.25rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.7;
    color: #2a2a2a;
  }

  strong {
    display: block;
    margin-bottom: 0.5rem;
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    color: #1a1a1a;
  }
`;

const Signatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  margin-top: 4rem;
  margin-bottom: 2rem;
  position: relative;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const OfficialStamp = styled.div`
  position: absolute;
  top: -1.5rem;
  right: 2rem;
  width: 120px;
  height: 120px;
  border: 3px solid #1e3a8a;
  border-radius: 50%;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  transform: rotate(-12deg);
  opacity: 0.8;
  text-align: center;
  z-index: 5;
  background: rgba(255,255,255,0.8);

  &::before {
    content: "";
    position: absolute;
    inset: 6px;
    border: 1px solid #1e3a8a;
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    right: 1rem;
    width: 100px;
    height: 100px;
    font-size: 0.6rem;
  }
`;

const StampStar = styled.div`
  font-size: 1.2rem;
  margin: 0.25rem 0;
`;

const StampMain = styled.div`
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  font-weight: 900;
`;

const SigBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const SigScript = styled.div`
  font-family: 'Mr Dafoe', cursive;
  font-size: 2.8rem;
  color: #1e3a8a;
  line-height: 1;
  margin-bottom: 0.5rem;
  min-height: 50px;
`;

const SigLine = styled.div`
  border-top: 2px solid #1a1a1a;
  padding-top: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SigName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a1a;
`;

const SigTitle = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

const SigMeta = styled.div`
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
`;

const FooterActions = styled.div`
  margin-top: 3rem;
  padding-top: 2.5rem;
  border-top: 1px dashed #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
`;

const VerificationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 1rem 1.5rem;
  border-radius: 6px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const VbLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const VbIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #1c4532;
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
    color: #1c4532;
    font-size: 0.9rem;
  }

  span {
    font-size: 0.75rem;
    color: #4b5563;
    font-family: 'JetBrains Mono', monospace;
  }
`;

const VbRight = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: #6b7280;
  font-family: 'JetBrains Mono', monospace;

  @media (max-width: 768px) {
    text-align: left;
  }
`;

const BtnRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  flex: 1;
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$primary ? `
    background: #1c4532;
    color: white;
    border: 1px solid #1c4532;
    &:hover {
      background: #11281d;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(28, 69, 50, 0.15);
    }
  ` : `
    background: transparent;
    color: #1a1a1a;
    border: 1px solid #d1d5db;
    &:hover {
      background: #f9fafb;
      border-color: #1a1a1a;
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

const PostmortemResultsPage = () => {
  const { sessionId, slug } = useParams();
  const location = useLocation();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatureError, setSignatureError] = useState(false);

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
      alert(`Unable to download PDF: ${error.message}. Please try again or contact support.`);
    }
  };

  const handleBackToVerify = () => {
    window.location.href = '/postmortem-verify';
  };

  if (loading) {
    return (
      <PageWrapper>
        <Sheet>
          <SheetInner style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '1.25rem', color: '#888' }}>Loading report...</div>
          </SheetInner>
        </Sheet>
      </PageWrapper>
    );
  }

  if (!reportData) {
    return (
      <PageWrapper>
        <Sheet>
          <SheetInner style={{ textAlign: 'center', padding: '4rem 0' }}>
            <AlertCircle size={48} color="#9b2c2c" style={{ marginBottom: '1rem' }} />
            <h2>Session Expired</h2>
            <p style={{ color: '#888', marginBottom: '2rem' }}>Please verify your identity again to access the report.</p>
            <Button $primary onClick={handleBackToVerify}>
              Back to Verification
            </Button>
          </SheetInner>
        </Sheet>
      </PageWrapper>
    );
  }

  const { deceased, postmortem, verifiedAt } = reportData;
  const status = postmortem?.status || 'completed';
  // Format tenant name from slug (e.g., "montenzuma-monalisa-feuneral-home-nairobi" -> "Montenzuma Monalisa Feuneral Home Nairobi")
  const formatTenantName = (slugStr) => {
    if (!slugStr || slugStr === 'default' || slugStr === 'system_shared') return 'Rest Point Funeral Home';
    return slugStr
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Use tenant data from reportData if available, otherwise format from slug
  const tenantName = reportData?.tenant?.name || reportData?.deceased?.tenant_name || (slug ? formatTenantName(slug) : 'Rest Point Funeral Home');
  const tenantAddress = reportData?.tenant?.address || reportData?.deceased?.tenant_address || 'Nairobi, Kenya';
  const tenantPhone = reportData?.tenant?.phone || reportData?.deceased?.tenant_phone || '';
  const tenantEmail = reportData?.tenant?.email || reportData?.deceased?.tenant_email || '';

  return (
    <PageWrapper>
      <Sheet>
        <Watermark>CONFIDENTIAL</Watermark>
        
        <SheetInner>
          {/* Letterhead */}
          <Letterhead>
            <LogoLeft>
              <Logo>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style={{ width: '36px', height: '36px' }}>
                  <path d="M12 2v20M12 2c-2.5 0-5 1.5-5 4 0 2.5 2.5 4 5 4M12 2c2.5 0 5 1.5 5 4 0 2.5-2.5 4-5 4M12 22c-2.5 0-5-1.5-5-4 0-2.5 2.5-4 5-4M12 22c2.5 0 5-1.5 5-4 0-2.5-2.5-4-5-4" />
                </svg>
              </Logo>
              <LogoText>
                <h2>{tenantName}</h2>
                <span className="tagline">Mortuary & Bereavement Services</span>
                <address className="address">
                  {tenantAddress}{tenantPhone ? <><br />Tel: {tenantPhone}</> : null}{tenantEmail ? <> · {tenantEmail}</> : null}
                </address>
              </LogoText>
            </LogoLeft>
            <LetterheadRight>
              <RefLabel>Case Reference</RefLabel>
              <RefNumber>{deceased?.admission_number || 'N/A'}</RefNumber>
              <RefDate>Issued: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</RefDate>
            </LetterheadRight>
          </Letterhead>

          {/* Body */}
          <div className="letter-body">
            <Salutation>
              <strong>To the Family of {deceased?.full_name || 'the Deceased'},</strong>
            </Salutation>
            
            <IntroText>
              Please find enclosed the official postmortem examination report regarding the passing of <span className="highlight">{deceased?.full_name || 'the Deceased'}</span>. This document has been prepared by the attending pathologist and formally verified by our records department. We extend our deepest sympathies during this difficult time.
            </IntroText>

            {/* Section 1 - Decedent Information */}
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
                  <span>{deceased?.date_of_birth ? new Date(deceased.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                </InfoRow>
                <InfoRow>
                  <label>Date of Death</label>
                  <span>{deceased?.date_of_death ? new Date(deceased.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                </InfoRow>
                <InfoRow>
                  <label>Age & Gender</label>
                  <span>{deceased?.age ? `${deceased.age} Years` : 'N/A'} · {deceased?.gender || 'N/A'}</span>
                </InfoRow>
                <InfoRow>
                  <label>Place of Death</label>
                  <span>{deceased?.place_of_death || 'N/A'}</span>
                </InfoRow>
              </InfoGrid>
            </DataSection>

            {/* Section 2 - Next of Kin */}
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

            {/* Section 3 - Examination Details */}
            <DataSection>
              <DataHeading>
                <FileText />
                Examination Details & Findings
              </DataHeading>
              <InfoGrid>
                <InfoRow>
                  <label>Examination Date</label>
                  <span>{postmortem?.completed_at ? new Date(postmortem.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
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

            {/* Signatures */}
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
                    const signatureUrl = reportData?.deceased?.signature || reportData?.deceased?.pathologist_signature || reportData?.postmortem?.pathologist_signature;
                    console.log('[PostmortemResults] Signature URL:', signatureUrl, 'Full reportData:', reportData);
                    if (signatureUrl && !signatureError) {
                      const absoluteUrl = signatureUrl.startsWith('http') 
                        ? signatureUrl 
                        : `${window.location.origin}${signatureUrl.startsWith('/') ? '' : '/'}${signatureUrl}`;
                      return <img src={absoluteUrl} alt="Pathologist Signature" style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} onError={() => setSignatureError(true)} />;
                    }
                    return postmortem?.pathologist_name || 'Pathologist';
                  })()}
                </SigScript>
                <SigLine />
                <SigName>{postmortem?.pathologist_name || 'Attending Pathologist'}</SigName>
                <SigTitle>{postmortem?.pathologist_credentials || 'Pathologist'}</SigTitle>
                <SigMeta>
                  {postmortem?.pathologist_license ? `License: ${postmortem.pathologist_license}` : ''}{postmortem?.pathologist_license ? <br /> : null}
                  Signed: {postmortem?.completed_at ? new Date(postmortem.completed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </SigMeta>
              </SigBlock>

              <SigBlock>
                <SigScript>{deceased?.next_of_kin_name || 'Next of Kin'}</SigScript>
                <SigLine />
                <SigName>{deceased?.next_of_kin_name || 'Next of Kin'}</SigName>
                <SigTitle>Next of Kin / Authorizing Party</SigTitle>
                <SigMeta>
                  ID: {deceased?.next_of_kin_id_number || deceased?.national_id || 'N/A'}<br />
                  Verified: {new Date(verifiedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </SigMeta>
              </SigBlock>
            </Signatures>

            {/* Footer / Actions */}
            <FooterActions>
              <VerificationBar>
                <VbLeft>
                  <VbIcon>
                    <Shield size={18} />
                  </VbIcon>
                  <VbText>
                    <strong>Digitally Verified & Authenticated</strong>
                    <span>Session: {sessionId} · Status: {status}</span>
                  </VbText>
                </VbLeft>
                <VbRight>
                  TIMESTAMP<br />
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
  );
};

export default PostmortemResultsPage;