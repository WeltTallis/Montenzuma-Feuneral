import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import RouteOptimizer from '../../hearse/RouteOptimizer';
import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import bwipjs from '@bwip-js/browser';
import DeceasedStkPushModal from '../DeceasedStkPushModal';

// ─── Colors defined locally (fixes styled-components error #12) ───
const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  border: '#e0e0e0',
  bgField: '#f7f7f5',
  white: '#ffffff',
  danger: '#dc2626',
  dangerDark: '#b91c1c',
  route: '#5F0F40',
  refresh: '#d97706',
  charges: '#000000ff',
  chargesDark: '#000000ff',
  scanner: '#0F3040',
  scannerDark: '#0c2530',
};

// ─── Animations ───
const scanMove = keyframes`
  0% { top: 0; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ─── Back button (above the header bar) ───
const BackBtn = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: ${C.danger};
  cursor: pointer;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { color: ${C.dangerDark}; }
`;

// ─── Profile header — barcode left, buttons right ───
const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  padding-left: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    align-content: flex-start;
  }
`;

// ─── Button group ───
const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
`;

// ─── Base button ───
const Btn = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid ${C.border};
  background: ${C.white};
  color: ${C.dark};
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  position: relative;
  overflow: hidden;

  &:hover { background: ${C.bgField}; border-color: ${C.gray}; }

  ${(p) => p.$primary && css`
    background: ${C.charges};
    color: white;
    border-color: ${C.charges};
    &:hover { background: ${C.chargesDark}; }
  `}

  ${(p) => p.$danger && css`
    background: ${C.danger};
    color: white;
    border-color: ${C.danger};
    &:hover { background: ${C.dangerDark}; }
  `}

  ${(p) => p.$route && css`
    background: ${C.route};
    color: white;
    border-color: ${C.route};
    &:hover { background: #4a0b33; }
  `}

  ${(p) => p.$scanner && css`
    background: ${C.scanner};
    color: white;
    border-color: ${C.scanner};
    &:hover { background: ${C.scannerDark}; }
  `}

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

  ${(p) => p.$scan && css`
    &::after {
      animation-play-state: running;
    }
  `}
`;

// ─── Refresh button ───
const RefreshBtn = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid ${C.refresh};
  background: ${C.refresh};
  color: #ffffff;
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;

  &:hover { background: #b45309; border-color: #b45309; }
  &:disabled { cursor: progress; opacity: 0.75; }
  &[data-refreshing='true'] svg { animation: ${spin} 0.8s linear infinite; }
`;

// ─── Barcode ───
const BarcodeBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
`;

const BarcodeCode = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #00296B;
  white-space: nowrap;
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

  return <canvas ref={canvasRef} style={{ display: 'block', width: 'auto', height: 'auto', maxWidth: '100%' }} />;
};

// ─── Component ───
const DeceasedProfileHeader = ({ deceased, nextOfKin, onBack, onTabSwitch, onChargeSettingsClick, onRefresh, refreshing = false, onScanClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathParams = useParams();
  const deceasedId = searchParams.get('id') || pathParams.id;
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showStkPush, setShowStkPush] = useState(false);

  const displayId = deceased?.deceased_id || deceased?.id;
  const admissionNo = deceased?.admission_number || deceased?.admission_no || '—';

  const navigateToReleaseForm = () => {
    let slug = localStorage.getItem('tenantSlug') || '';
    if (!slug || slug === 'dashboard' || slug === 'default') {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      slug = user?.parentTenantSlug || user?.tenantSlug || slug;
    }
    navigate(`/${slug}/release-form/${deceasedId || displayId}`, {
      state: { deceasedData: deceased }
    });
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
    if (onScanClick) onScanClick();
  };

  return (
    <>
      {showRouteOptimizer && <RouteOptimizer onClose={() => setShowRouteOptimizer(false)} />}
      {showStkPush && <DeceasedStkPushModal deceased={deceased} nextOfKin={nextOfKin} onClose={() => setShowStkPush(false)} />}

      <BackBtn onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to List
      </BackBtn>

      <ProfileHeader>
        {/* Barcode at top-left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BarcodeBox title="Admission barcode">
              <Barcode value={admissionNo !== '—' ? admissionNo : 'AWAITING-ID'} />
            </BarcodeBox>
            <BarcodeCode style={{ fontWeight: 700, fontSize: 9, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {displayId}
            </BarcodeCode>
            <BarcodeCode style={{ fontWeight: 700, fontSize: 9, color: '#000000', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {admissionNo !== '—' ? admissionNo : 'AWAITING-ID'}
            </BarcodeCode>
          </div>
        </div>

        {/* Action buttons at top-right */}
        <HeaderActions>
          <Btn $primary type="button" onClick={() => setShowStkPush(true)} disabled={!deceased}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M8 6h8M9 18h6" />
            </svg>
            STK Push
          </Btn>

          <RefreshBtn
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            data-refreshing={refreshing ? 'true' : 'false'}
            title="Reload this profile from the server"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </RefreshBtn>

          <Btn $route onClick={() => setShowRouteOptimizer(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Route Calculations
          </Btn>

          <Btn $scanner $scan={scanning} onClick={handleScan} title="Scan a paper document and upload it straight to this profile's documents">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
              <path d="M7 12h10" />
            </svg>
            Scanner
          </Btn>

          {onChargeSettingsClick && (
            <Btn $primary onClick={onChargeSettingsClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-7.5L15 7m-6 6l-1.5 1.5M20.5 20.5L19 19m-10-10L7.5 7.5" />
              </svg>
              Charge Settings
            </Btn>
          )}

          <Btn $danger onClick={navigateToReleaseForm}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Release Body
          </Btn>
        </HeaderActions>
      </ProfileHeader>
    </>
  );
};

export default DeceasedProfileHeader;