import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import bwipjs from '@bwip-js/browser';
import { C } from './theme';
import RouteOptimizer from '../../hearse/RouteOptimizer';

const BackBtn = styled.button`
  font-size: 13px; font-weight: 600; color: #d93025; cursor: pointer;
  background: none; border: none; display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px; padding: 0; font-family: 'Source Sans 3', sans-serif;
  &:hover { color: #b91c1c; }
`;

const ProfileHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  padding-left: 12px;
  h2 { font-family: 'Merriweather', serif; font-size: 26px; font-weight: 900; color: ${C.black}; margin: 0 0 4px; }
  p { color: ${C.dark}; font-size: 14px; font-weight: 700; margin: 0; }
`;

const HeaderActions = styled.div`
  display: flex; gap: 12px; flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid ${C.border}; background: white; color: ${C.dark};
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: ${C.bgField}; border-color: ${C.gray}; }
  ${p => p.$primary && `background: ${C.black}; color: white; border-color: ${C.black};
    &:hover { background: ${C.dark}; }`}
  ${p => p.$danger && `background: ${C.danger}; color: white; border-color: ${C.danger};
    &:hover { background: #b91c1c; }`}
`;

const RouteCalcBtn = styled.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #0c2530; background: #0c2530; color: #ffffff;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #0d2d3a; border-color: #0d2d3a; }
`;

/* ─── Admission barcode (same Code128 configuration as the intake page) ─── */
const BarcodeBox = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: transparent; border: none; padding: 0; box-shadow: none;
`;
const BarcodeCode = styled.span`
  font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; color: ${C.black};
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
          height: 8,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: 'auto', height: '40px' }} />;
};

const DeceasedProfileHeader = ({ deceased, onBack, onTabSwitch, onChargeSettingsClick }) => {
  const navigate = useNavigate();
  const { id: deceasedId } = useParams();
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
            <BarcodeCode style={{ fontWeight: 700, fontSize: 11 }}>{displayId}</BarcodeCode>
            <BarcodeCode style={{ fontWeight: 400, fontSize: 10, opacity: 0.7 }}>{admissionNo !== '—' ? admissionNo : 'AWAITING-ID'}</BarcodeCode>
          </div>
        </div>
        <HeaderActions>
          <RouteCalcBtn onClick={() => setShowRouteOptimizer(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Route Calculations
          </RouteCalcBtn>
          <Btn>Scan Docs</Btn>
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