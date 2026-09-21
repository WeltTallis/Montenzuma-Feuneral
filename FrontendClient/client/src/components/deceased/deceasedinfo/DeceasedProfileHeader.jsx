import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import RouteOptimizer from '../../hearse/RouteOptimizer';
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import bwipjs from '@bwip-js/browser';
import { C } from './theme';

// Scanning line animation
const scanMove = keyframes`
  0% { top: 0; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const BackBtn = styled.button`
  font-size: 13px; font-weight: 600; color: #d93025; cursor: pointer;
  background: none; border: none; display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px; padding: 8px; font-family: 'Source Sans 3', sans-serif;
  &:hover { color: #b91c1c; }
`;

const ProfileHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  padding-left: 12px;
  h2 { font-family: 'Merriweather', serif; font-size: 26px; font-weight: 900; color: ${C.black}; margin: 0 0 4px; }
  p { color: ${C.dark}; font-size: 14px; font-weight: 700; margin: 0; }

  /* Mobile: stack barcode above the action buttons so the buttons never scatter */
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    align-content: flex-start;
  }
`;

const HeaderActions = styled.div`
  display: flex; gap: 12px; flex-wrap: wrap;

  /* Mobile: buttons stack full-width instead of wrapping into scattered rows */
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
`;

const Btn = styled.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid ${C.border}; background: white; color: ${C.dark};
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  position: relative; 
  overflow: hidden; 

  &:hover { background: ${C.bgField}; border-color: ${C.gray}; }
  ${p => p.$primary && `background: ${C.black}; color: white; border-color: ${C.black};
    &:hover { background: ${C.dark}; }`}
  ${p => p.$danger && `background: ${C.danger}; color: white; border-color: ${C.danger};
    &:hover { background: #b91c1c; }`}
  
  /* Base scanning line (hidden/paused by default) */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px; 
    background: rgba(16, 185, 129, 0.8); 
    box-shadow: 0 0 8px 1px rgba(16, 185, 129, 0.7); 
    top: 0;
    pointer-events: none; 
    animation: ${scanMove} 2s infinite ease-in-out;
    animation-play-state: paused; 
    opacity: 0;
  }

  /* Play the scanning line only when $scan prop is true */
  ${p => p.$scan && `
    &::after {
      animation-play-state: running;
    }
  `}
`;

const RouteCalcBtn = styled.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid  #5F0F40 ; background:  #5F0F40   ; color: #ffffff;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #5F0F40  ; border-color: #5F0F40; }
`;


const RefreshBtn = styled.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #d97706; background: #d97706; color: #000000;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #d97706; border-color: #d97706; }
`;



/* ─── Admission barcode (same Code128 configuration as the intake page) ─── */
const BarcodeBox = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: transparent; border: none; padding: 0; box-shadow: none;
`;
const BarcodeCode = styled.span`
  font-family: 'Courier New', monospace; font-size: 10px; font-weight: 800;
  letter-spacing: 0.08em; color: #00296B; white-space: nowrap;
`;

const Barcode = ({ value }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: value || 'AWAITING-ID',
          scale: 2,
          height: 6,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: 'auto', height: 'auto', maxWidth: '100%' }} />
};





const DeceasedProfileHeader = ({ deceased, onBack, onTabSwitch, onChargeSettingsClick, onRefresh, onScanClick }) => {
  const navigate = useNavigate();
  // Read the deceased identifier from the query string (?id=XXX); fall back to the path param.
  const [searchParams] = useSearchParams();
  const pathParams = useParams();
  const deceasedId = searchParams.get('id') || pathParams.id;
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const displayId = deceased?.deceased_id || deceased?.id;
  const admissionNo = deceased?.admission_number || deceased?.admission_no || '—';
  const navigateToReleaseForm = () => {
    let slug = localStorage.getItem('tenantSlug') || '';
    if (!slug || slug === 'dashboard' || slug === 'default') {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      slug = user?.parentTenantSlug || user?.tenantSlug || slug;
    }
    navigate(`/tenant/${slug}/release-form/${deceasedId || displayId}`, {
      state: { deceasedData: deceased }
    });
  };

  return (
    <>
      {showRouteOptimizer && <RouteOptimizer onClose={() => setShowRouteOptimizer(false)} />}
      <BackBtn onClick={onBack}>← Back to List</BackBtn>
      <ProfileHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Barcode at top-left */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BarcodeBox title="Admission barcode">
              <Barcode value={admissionNo !== '—' ? admissionNo : 'AWAITING-ID'} />
            </BarcodeBox>
            <BarcodeCode style={{ fontWeight: 700, fontSize: 9, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>{displayId}</BarcodeCode>
            <BarcodeCode style={{ fontWeight: 700, fontSize: 9, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>{admissionNo !== '—' ? admissionNo : 'AWAITING-ID'}</BarcodeCode>
          </div>
        </div>

        <HeaderActions>
          <RefreshBtn onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Refresh
          </RefreshBtn>

          <RouteCalcBtn onClick={() => setShowRouteOptimizer(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Route Calculations
          </RouteCalcBtn>

          <Btn $scan onClick={onScanClick} title="Scan a paper document and upload it straight to this profile's documents">
            <svg width="14" height="14" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="5">
              <path d="M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z" transform="translate(1,0)" />
            </svg>
            Scan Docs
          </Btn>

          {onChargeSettingsClick && (
            <Btn $primary onClick={onChargeSettingsClick}>⚙️ Charge Settings</Btn>
          )}
          <Btn $danger onClick={navigateToReleaseForm}>Release Body</Btn>
        </HeaderActions>

      </ProfileHeader>
    </>
  );
};

export default DeceasedProfileHeader;