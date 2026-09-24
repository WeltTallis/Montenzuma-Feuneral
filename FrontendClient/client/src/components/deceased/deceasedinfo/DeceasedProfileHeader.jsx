import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import RouteOptimizer from '../../hearse/RouteOptimizer';
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import bwipjs from '@bwip-js/browser';

// ─── Colors defined locally (no dependency on ./theme) ───
const COLORS = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  border: '#e0e0e0',
  borderLight: '#efefef',
  bgField: '#f7f7f5',
  white: '#ffffff',
  danger: '#dc2626',
  dangerDark: '#b91c1c',
  route: '#5F0F40',
  refresh: '#d97706',
  scanner: '#0F3040',
  charges: '#00296B',
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

// ─── One straight line, no background card ───
const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 0 12px;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 10px;
  }
`;

// ─── Barcode ───
const BarcodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const BarcodeFrame = styled.div`
  background: transparent;
  border: none;
  padding: 0;
  line-height: 0;
`;

const BarcodeId = styled.span`
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 10px;
  font-weight: 700;
  color: ${COLORS.black};
  white-space: nowrap;
  letter-spacing: 0.04em;
  text-align: center;
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

// ─── Divider ───
const Divider = styled.div`
  width: 1px;
  height: 56px;
  background: ${COLORS.border};
  flex-shrink: 0;

  @media (max-width: 640px) { display: none; }
`;

const Spacer = styled.div`
  flex: 1;

  @media (max-width: 640px) { display: none; }
`;

// ─── Base button ───
const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Inter', 'Source Sans 3', sans-serif;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  color: ${COLORS.dark};
  position: relative;
  overflow: hidden;
  min-height: 44px;

  &:hover { background: ${COLORS.bgField}; border-color: ${COLORS.gray}; }

  svg { width: 16px; height: 16px; flex-shrink: 0; }

  @media (max-width: 640px) {
    flex: 1;
    min-width: calc(50% - 5px);
  }

  ${(p) => p.$primary && `
    background: ${COLORS.charges}; color: #fff; border-color: ${COLORS.charges};
    &:hover { background: #001f50; }
  `}

  ${(p) => p.$danger && `
    background: ${COLORS.danger}; color: #fff; border-color: ${COLORS.danger};
    box-shadow: 0 2px 8px rgba(220,38,38,0.2);
    &:hover { background: ${COLORS.dangerDark}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
  `}

  ${(p) => p.$route && `
    background: ${COLORS.route}; color: #fff; border-color: ${COLORS.route};
    &:hover { background: #4a0b33; }
  `}

  ${(p) => p.$scanner && `
    background: ${COLORS.scanner}; color: #fff; border-color: ${COLORS.scanner};
    &::after {
      content: '';
      position: absolute;
      left: 0; right: 0; top: 0;
      height: 2px;
      background: rgba(16,185,129,0.9);
      box-shadow: 0 0 8px 1px rgba(16,185,129,0.6);
      animation: ${scanMove} 2s infinite ease-in-out;
      animation-play-state: paused;
      opacity: 0;
      pointer-events: none;
    }
  `}

  ${(p) => p.$scanning && `
    &::after { animation-play-state: running; }
  `}
`;

// ─── Refresh ───
const RefreshBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Inter', 'Source Sans 3', sans-serif;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid ${COLORS.refresh};
  background: ${COLORS.refresh};
  color: #ffffff;
  min-height: 44px;
  position: relative;
  overflow: hidden;

  &:hover { background: #b45309; border-color: #b45309; }
  &:disabled { cursor: progress; opacity: 0.7; }
  &[data-refreshing='true'] svg { animation: ${spin} 0.8s linear infinite; }

  svg { width: 16px; height: 16px; flex-shrink: 0; }

  @media (max-width: 640px) {
    flex: 1;
    min-width: calc(50% - 5px);
  }
`;

// ─── Back to List ───
const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Inter', 'Source Sans 3', sans-serif;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid ${COLORS.danger};
  background: #ffffff;
  color: ${COLORS.danger};
  min-height: 44px;

  &:hover { background: #fef2f2; border-color: ${COLORS.danger}; }

  svg { width: 16px; height: 16px; flex-shrink: 0; }

  @media (max-width: 640px) {
    flex: 1;
    min-width: calc(50% - 5px);
  }
`;

// ─── Component ───
const DeceasedProfileHeader = ({ deceased, onBack, onTabSwitch, onChargeSettingsClick, onRefresh, refreshing = false, onScanClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathParams = useParams();
  const deceasedId = searchParams.get('id') || pathParams.id;
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [scanning, setScanning] = useState(false);

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

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
    if (onScanClick) onScanClick();
  };

  return (
    <>
      {showRouteOptimizer && <RouteOptimizer onClose={() => setShowRouteOptimizer(false)} />}

      <HeaderBar>
        {/* Barcode */}
        <BarcodeSection>
          <BarcodeFrame>
            <Barcode value={admissionNo !== '—' ? admissionNo : 'AWAITING-ID'} />
          </BarcodeFrame>
          <BarcodeId>{displayId || '—'}</BarcodeId>
        </BarcodeSection>

        <Divider />
        <Spacer />

        {/* Refresh */}
        <RefreshBtn
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          data-refreshing={refreshing ? 'true' : 'false'}
          title="Reload this profile from the server"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </RefreshBtn>

        {/* Back to List */}
        <BackBtn onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to List
        </BackBtn>

        {/* Route */}
        <Btn $route onClick={() => setShowRouteOptimizer(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Route
        </Btn>

        {/* Scanner */}
        <Btn $scanner $scanning={scanning} onClick={handleScan} title="Scan a document and upload to this profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
            <path d="M7 12h10" />
          </svg>
          Scanner
        </Btn>

        {/* Charges */}
        {onChargeSettingsClick && (
          <Btn $primary onClick={onChargeSettingsClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-7.5L15 7m-6 6l-1.5 1.5M20.5 20.5L19 19m-10-10L7.5 7.5" />
            </svg>
            Charges
          </Btn>
        )}

        {/* Release Body */}
        <Btn $danger onClick={navigateToReleaseForm}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Release Body
        </Btn>
      </HeaderBar>
    </>
  );
};

export default DeceasedProfileHeader;