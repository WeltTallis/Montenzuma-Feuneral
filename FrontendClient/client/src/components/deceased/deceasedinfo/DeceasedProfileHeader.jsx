import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import bwipjs from '@bwip-js/browser';
import { C } from './theme';
import RouteOptimizer from '../../hearse/RouteOptimizer';
import axios from 'axios';

import env from '../../../utils/config/env';
const BASE_URL = `${env.FULL_API_URL}/deceased`;


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




useEffect(() => {
  const ROBOTS_CONTENT = 'noindex, nofollow, noarchive';
  let meta = document.querySelector('meta[name="robots"]');
  const previous = meta ? meta.getAttribute('content') : null;
  if (meta) {
    meta.setAttribute('content', ROBOTS_CONTENT);
  } else {
    meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = ROBOTS_CONTENT;
    document.head.appendChild(meta);
  }
  return () => {
    if (previous !== null) meta.setAttribute('content', previous);
    else meta.remove();
  };
}, []);




const RefreshDeceased = useCallback(async () => {

  if (!deceasedId) return;

  setLoading(true);

  try {
    const slug = getTenantSlug();
    const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
    const headers = {
      'x-tenant-slug': slug,
      'Authorization': `Bearer ${token}`,
    };

    // 1) Deceased core info
    let admissionNo = deceasedId;

    const decRes = await axios.get(`${BASE_URL}/${deceasedId}`, { headers });
    if (decRes.data?.data) {
      // Map backend fields to frontend field names
      const backendData = decRes.data.data;
      admissionNo = backendData.admission_number || backendData.admission_no || deceasedId;
      const mappedData = {
        ...backendData,
        // Map admission fields
        admission_no: backendData.admission_number,
        admission_time: backendData.time_received,
        admitted_by: backendData.receiving_officer,
        // Map death fields
        time_of_death: null, // Not in DB schema
        attending_physician: backendData.physician,
        // Map body/embalming fields
        embalmed: backendData.admission_status === 'embalmed',
        embalmed_date: null, // Not in DB schema
        storage_location: backendData.chamber_assigned,
        morgue_slot: backendData.chamber_assigned,
        body_condition: backendData.body_status,
        // Map contact fields
        tel_number: backendData.phone_number,
        tell_no: backendData.phone_number,
      };
      setDeceased(mappedData);
    }

    // 2) Postmortem
    try {
      const pmRes = await axios.get(`${BASE_URL}/postmortem/${deceasedId}`, { headers });
      if (pmRes.data?.data) setPostmortem(pmRes.data.data);
    } catch (e) { /* no postmortem yet */ }

    // 3) Next of kin
    try {
      const nokRes = await axios.get(`${BASE_URL}/${deceasedId}/next-of-kin`, { headers });
      const nokList = Array.isArray(nokRes.data?.data) ? nokRes.data.data : (nokRes.data?.data ? [nokRes.data.data] : []);
      if (nokList.length > 0) {
        // data is an array - use the first (primary) next of kin
        setNextOfKin(nokList[0]);
      } else {
        // FALLBACK: older registrations never wrote a next_of_kin row.
        // Synthesize one from the deceased record so the panel still shows
        // whatever kin details were captured at intake.
        const src = decRes.data?.data;
        if (src && (src.contact_person || src.phone_number || src.relationship || src.national_id)) {
          setNextOfKin({
            full_name: src.contact_person || '',
            relationship: src.relationship || '',
            contact: src.tel_number || src.phone_number || '',
            alternative_contact: src.alternative_phone || '',
            id_number: src.national_id || '',
            email: src.email || '',
            is_primary: 1,
            _synthetic: true, // read-only hint for UI
          });
        }
      }
    } catch (e) {
      // no nok endpoint/response — fall back to deceased fields
      const src = decRes.data?.data;
      if (src && (src.contact_person || src.phone_number || src.relationship || src.national_id)) {
        setNextOfKin({
          full_name: src.contact_person || '',
          relationship: src.relationship || '',
          contact: src.tel_number || src.phone_number || '',
          alternative_contact: src.alternative_phone || '',
          id_number: src.national_id || '',
          email: src.email || '',
          is_primary: 1,
          _synthetic: true,
        });
      }
    }

    // 4) Documents - fetch from documents service (through the API gateway)
    try {
      const tenantSlug = getTenantSlug();
      const docRes = await axios.get(`${env.FULL_API_URL}/documents/${deceasedId}`, {
        headers: {
          'x-tenant-slug': tenantSlug,
          'Authorization': token ? `Bearer ${token}` : ''
        },
        withCredentials: false
      });
      if (docRes.data?.files) {
        const formattedDocs = docRes.data.files.map(f => ({
          name: f.originalName,
          file_name: f.storedName || f.originalName,
          type: f.category || 'Document',
          created_at: f.uploadedAt || f.uploaded_at,
          document_id: f.documentId,
          url: f.url
        }));
        setDeceased(prev => prev ? { ...prev, documents: formattedDocs } : prev);
      } else if (docRes.data?.data) {
        setDeceased(prev => prev ? { ...prev, documents: docRes.data.data } : prev);
      }
    } catch (e) {
      console.warn('[DeceasedDetail] Documents service unavailable, showing empty list:', e.message);
      setDeceased(prev => prev ? { ...prev, documents: [] } : prev);
    }

    // 5) Charges / billing summary
    try {
      const billRes = await axios.get(`${BASE_URL}/billing-summary/${deceasedId}`, { headers });
      if (billRes.data?.data) {
        const bd = billRes.data.data;
        if (bd.charges) setCharges(Array.isArray(bd.charges) ? bd.charges : [bd.charges]);
        if (bd.payments) setPayments(Array.isArray(bd.payments) ? bd.payments : []);
      }
    } catch (e) {
      // Fallback to charges endpoint
      try {
        const chgRes = await axios.get(`${BASE_URL}/charges/${deceasedId}`, { headers });
        if (chgRes.data?.data) {
          setCharges(Array.isArray(chgRes.data.data) ? chgRes.data.data : [chgRes.data.data]);
        }
      } catch (e2) { /* no charges */ }
    }

    // 6) Charge settings (merged into deceased.charges so the sidebar's
    // "Daily storage rate" + storage charge always reflect the saved values)
    try {
      const csRes = await axios.get(`${BASE_URL}/charge-settings/${deceasedId}`, { headers });
      if (csRes.data?.data) {
        const cs = csRes.data.data;
        setDeceased(prev => prev ? {
          ...prev,
          charges: {
            storage_rate: parseFloat(cs.dailyRate ?? cs.daily_rate ?? cs.storage_rate ?? cs.per_day ?? prev?.charges?.storage_rate ?? 500),
            per_day: parseFloat(cs.dailyRate ?? cs.daily_rate ?? prev?.charges?.per_day ?? 500),
            per_hour: parseFloat(cs.hourlyRate ?? cs.hourly_rate ?? prev?.charges?.per_hour ?? 125),
            currency: cs.currency ?? prev?.charges?.currency ?? 'KES',
            rate_profile: cs.rateProfile ?? cs.rate_profile ?? 'standard',
            charge_type: cs.chargeType ?? cs.charge_type ?? 'daily',
            usd_rate: parseFloat(cs.usdRate ?? cs.usd_rate ?? prev?.charges?.usd_rate ?? 130),
            updated_at: cs.updatedAt ?? cs.updated_at ?? null
          }
        } : prev);
      }
    } catch (e) { /* charge settings optional */ }

    // 7) Release data for audit log + Release tab.
    // NOTE: the bodycheckout service mounts its router at /body-release and
    // the gateway forwards paths verbatim, so the old /bodycheckout/release/
    // ... path was always a 404. Fetch by admission number first, then fall
    // back to listing all releases and matching on admission number or name
    // (case-insensitive) so a case mismatch never blanks the Release tab.
    try {
      const relRes = await axios.get(
        `${env.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(admissionNo)}`,
        { headers }
      );
      if (relRes.data?.data) {
        setDeceased(prev => prev ? { ...prev, releaseData: relRes.data.data } : prev);
      } else {
        throw new Error('no release data by admission');
      }
    } catch (e) {
      try {
        const listRes = await axios.get(`${env.FULL_API_URL}/body-release/checkout`, { headers });
        const list = Array.isArray(listRes.data?.data) ? listRes.data.data : [];
        if (list.length > 0) {
          const norm = (s) => String(s || '').trim().toLowerCase();
          const adm = norm(admissionNo);
          const did = norm(deceasedId);
          const names = new Set([decRes.data?.data?.full_name, decRes.data?.data?.name,
          decRes.data?.data?.name_of_deceased].filter(Boolean).map(norm));
          const match = list.find((r) =>
            (adm && norm(r.admission_number) === adm) ||
            (did && norm(r.admission_number) === did) ||
            names.has(norm(r.name_of_deceased))
          );
          if (match) {
            setDeceased(prev => prev ? { ...prev, releaseData: match } : prev);
          }
        }
      } catch (e2) { /* no release yet */ }
    }

    // 7) Postmortem request lifecycle (Postmortem tab + Audit Log trail)
    try {
      const pmReqRes = await axios.get(`${env.FULL_API_URL}/postmortem-requests`, {
        headers,
        params: { deceased_id: deceasedId },
      });
      if (Array.isArray(pmReqRes.data?.data)) setRequests(pmReqRes.data.data);
    } catch (e) { /* no tracked requests yet */ }

  } catch (err) {
    console.error('Error fetching deceased detail:', err);
    showToast.error('Failed to load deceased details');
  } finally {
    setLoading(false);
  }
}, [deceasedId]);


const DeceasedProfileHeader = ({ deceased, onBack, onTabSwitch, onChargeSettingsClick }) => {
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
            <BarcodeCode style={{ fontWeight: 700, fontSize: 11 }}>{displayId}</BarcodeCode>
            <BarcodeCode style={{ fontWeight: 400, fontSize: 10, opacity: 0.7 }}>{admissionNo !== '—' ? admissionNo : 'AWAITING-ID'}</BarcodeCode>
          </div>
        </div>



        <HeaderActions>



          <RefreshBtn onClick={() => RefreshDeceased()}>
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