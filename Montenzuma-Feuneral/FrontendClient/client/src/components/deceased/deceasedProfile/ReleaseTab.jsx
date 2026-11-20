import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { C, formatDate, formatDateTime, formatTime12 } from './theme';
import api from '../../../api/axios';
import { getTenantHeaders } from '../../../api/endpoints';
import env from '../../../utils/config/env';

const SectionHead = styled.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  /* Default style: Half underline */
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${C.black};
  color: ${C.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${p => p.$mt0 && 'margin-top: 0;'}

  /* Primary style: Solid black background bar */
  ${p => p.$primary && `
    background: ${C.black};
    color: white;
    padding: 8px 16px;
    border-radius: 2px;
    border-bottom: none;
    width: 100%;
  `}
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px 24px;
  margin-bottom: 24px;
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem 2rem;
  margin-bottom: 24px;
`;

const Col = styled.div`
  min-width: 0;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: white;
  ${p => p.$full && 'grid-column: 1 / -1;'}
`;

const DetailLabel = styled.span`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${C.gray}; 
`;

const DetailValue = styled.div`
  font-size: 15px; 
  font-weight: 600; 
  color: ${C.black}; 
  word-break: break-word;
  line-height: 1.4;
  
  ${p => p.$muted && `color: ${C.gray}; font-weight: 500;`}
  ${p => p.$hl && `
    color: #5F0F40;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: 0.01em;
    text-shadow: 0 0 12px rgba(95, 15, 64, 0.12);
  `}
`;

const Btn = styled.button`
  padding: 8px 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${C.border || '#e0e0e0'}; 
  background: white; 
  color: ${C.dark || '#1a1a1a'};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${C.bgField || '#f7f7f5'}; 
    border-color: ${C.gray || '#777777'}; 
  }
  
  ${p => p.$primary && `
    background: ${C.black}; 
    color: white; 
    border-color: ${C.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
  
  ${p => p.$danger && `
    background: ${C.danger || '#ef4444'}; 
    color: white; 
    border-color: ${C.danger || '#ef4444'};
    &:hover { 
      background: #b91c1c; 
      border-color: #b91c1c;
    }
  `}
`;

const ChecklistItem = styled.div`
  display: flex; 
  align-items: center; 
  gap: 10px; 
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    
    &.success {
      background: ${C.successBg || '#d1fae5'};
      color: ${C.success || '#10b981'};
    }
    
    &.pending {
      background: ${C.bgField || '#f7f7f5'};
      color: ${C.gray || '#777777'};
      border: 1px solid ${C.borderLight || '#e0e0e0'};
    }
  }
  
  span {
    font-size: 14px;
    color: ${C.black};
    
    &.muted {
      color: ${C.gray};
    }
  }
`;

const isEnabledFlag = (value) => value === true || value === 1 || /^(1|true|yes)$/i.test(String(value || ''));

// MySQL DATE values may be serialized as an ISO instant at UTC midnight. A
// release/admission date is a calendar date, so keep the stored YYYY-MM-DD day.
const calendarDateValue = (value) => {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : value;
};

const formatReleaseMoment = (release) => {
  const date = release?.date_of_removal || release?.release_date;
  const time = release?.time_of_removal || release?.release_time;
  if (date && time) return `${formatDate(calendarDateValue(date))}, ${formatTime12(time)}`;
  if (date) {
    const recordedTime = release?.created_at ? formatTime12(release.created_at) : '';
    return recordedTime
      ? `${formatDate(calendarDateValue(date))}, ${recordedTime}`
      : formatDate(calendarDateValue(date));
  }
  return release?.created_at ? formatDateTime(release.created_at) : '';
};

const ReleaseTab = ({ deceased, deceasedId, refreshVersion = 0, branchSlug }) => {
  const navigate = useNavigate();
  const d = deceased || {};
  const admissionNumber = d.admission_number || d.admission_no || deceasedId;
  const deceasedName = d.full_name || d.name_of_deceased || d.name || d.fullname || '';
  const [releaseData, setReleaseData] = useState(d?.releaseData || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalizeRelease = () => {
    let slug = localStorage.getItem('tenantSlug') || '';
    if (!slug || slug === 'dashboard' || slug === 'default') {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      slug = user?.parentTenantSlug || user?.tenantSlug || slug;
    }
    navigate(`/${slug}/release-form/${deceasedId}`, {
      state: { deceasedData: deceased }
    });
  };

  // Always re-query the release row. The profile refresh changes refreshVersion,
  // and the admission/deceased identifiers can arrive after the first render,
  // so an "already loaded" early return would leave stale data.
  useEffect(() => {
    let cancelled = false;

    const fetchReleaseDetails = async () => {
      if (!deceasedId) return;

      setIsLoading(true);

      const headers = { ...getTenantHeaders(branchSlug) };
      const lookup = String(admissionNumber || deceasedId || '').trim();
      const norm = (value) => String(value || '').trim().toLowerCase();
      const names = new Set([norm(deceasedName)]);
      let foundRelease = null;
      let releaseLookupCompleted = false;

      // The by-admission endpoint is the canonical lookup. A 404 is expected for
      // profiles that have not been released yet, so continue to the list lookup.
      if (lookup) {
        try {
          const response = await api.get(
            `/body-release/by-admission/${encodeURIComponent(lookup)}`,
            { headers }
          );
          if (response.data?.success) {
            releaseLookupCompleted = true;
            if (response.data?.data) foundRelease = response.data.data;
          }
        } catch {
          // Not found or temporarily unavailable; the list lookup below is the
          // compatibility fallback used for existing branch/parent records.
        }
      }

      if (!foundRelease && lookup) {
        try {
          const response = await api.get('/body-release/checkout', {
            headers,
            params: { search: lookup, limit: 100 },
          });
          if (response.data?.success && Array.isArray(response.data.data)) {
            releaseLookupCompleted = true;
            const admissionKey = norm(lookup);
            const idKey = norm(deceasedId);
            foundRelease = response.data.data.find((release) => {
              const releaseAdmission = norm(release.admission_number);
              const releaseName = norm(release.name_of_deceased);
              return (admissionKey && (releaseAdmission === admissionKey || releaseAdmission === idKey)) ||
                (releaseName && names.has(releaseName));
            }) || null;
          }
        } catch (error) {
          console.error('Error fetching release details:', error);
        }
      }

      if (!cancelled) {
        if (foundRelease) setReleaseData(foundRelease);
        else if (releaseLookupCompleted) setReleaseData(null);
      }

      if (!cancelled) setIsLoading(false);
    };

    fetchReleaseDetails();
    return () => { cancelled = true; };
  }, [admissionNumber, deceasedId, deceasedName, refreshVersion, branchSlug]);

  return (
    <>
      {/* Status banner */}
      {releaseData ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '12px 16px', marginBottom: 24, borderRadius: 8,
          background: C.successBg || '#ecfdf5', border: `1px solid ${C.success || '#059669'}44`,
        }}>
          <i className="fas fa-check-circle" style={{ color: C.success || '#059669', fontSize: 18 }}></i>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: C.success || '#059669', fontSize: 14 }}>
              BODY RELEASED{releaseData?.release_id ? ` — ${releaseData.release_id}` : ''}
            </div>
            <div style={{ fontSize: 12, color: C.gray }}>
              {isLoading
                ? 'Refreshing release details…'
                : formatReleaseMoment(releaseData)
                  ? `Released on ${formatReleaseMoment(releaseData)}`
                  : 'Release details recorded'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '12px 16px', marginBottom: 24, borderRadius: 8,
          background: C.bgField || '#f7f7f5', border: `1px solid ${C.borderLight || '#e0e0e0'}`,
        }}>
          <i className="fas fa-clock" style={{ color: C.gray, fontSize: 16 }}></i>
          <div style={{ flex: 1, minWidth: 200, fontSize: 13, color: C.gray }}>
            {isLoading ? 'Refreshing release details…' : 'No body release has been recorded for this deceased yet.'}
          </div>
          {!isLoading && (
            <Btn $primary onClick={handleFinalizeRelease}>
              <i className="fas fa-door-open" style={{ fontSize: 12 }}></i> Start Release
            </Btn>
          )}
        </div>
      )}

          <TwoColGrid>
        <Col>
          <SectionHead $mt0><span>01</span> Release Details</SectionHead>
          <DetailGrid>
            <DetailItem><DetailLabel>Release ID</DetailLabel><DetailValue>{releaseData?.release_id || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Deceased</DetailLabel><DetailValue>{releaseData?.name_of_deceased || d.full_name || d.name_of_deceased || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Admission Date</DetailLabel><DetailValue $hl>{formatDate(calendarDateValue(d.date_admitted || d.admission_date || d.created_at))}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Released Date</DetailLabel><DetailValue>{releaseData ? (releaseData.date_of_removal || releaseData.release_date ? formatDate(calendarDateValue(releaseData.date_of_removal || releaseData.release_date)) : (releaseData.created_at ? formatDate(releaseData.created_at) : '—')) : '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Released Time</DetailLabel><DetailValue>{releaseData ? (releaseData.time_of_removal || releaseData.release_time ? formatTime12(releaseData.time_of_removal || releaseData.release_time) : (releaseData.created_at ? formatTime12(releaseData.created_at) : '—')) : '—'}</DetailValue></DetailItem>
          </DetailGrid>
        </Col>

        <Col>
          <SectionHead $mt0><span>02</span> Receiver / Next of Kin</SectionHead>
          <DetailGrid>
            <DetailItem><DetailLabel>Receiver (Body Collected By)</DetailLabel><DetailValue>{releaseData?.next_kin || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Relationship to Deceased</DetailLabel><DetailValue>{releaseData?.relationship || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Receiver ID Number</DetailLabel><DetailValue>{releaseData?.id_number || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Receiver Phone</DetailLabel><DetailValue>{releaseData?.tell_number || '—'}</DetailValue></DetailItem>
          </DetailGrid>
        </Col>
      </TwoColGrid>

      <SectionHead $mt0><span>03</span> Transport &amp; Release Officer</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Permit Number</DetailLabel><DetailValue>{releaseData?.permit_number || '—'}</DetailValue></DetailItem>
        <DetailItem>
          <DetailLabel>Mode of Transport</DetailLabel>
          <DetailValue>
            {releaseData?.mode_of_transport === 'outsourced'
              ? 'Outsourced Hearse'
              : releaseData?.mode_of_transport || '—'}
          </DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Vehicle Plate Number</DetailLabel>
          <DetailValue>
            {releaseData?.mode_of_transport === 'outsourced'
              ? 'Not required — outsourced hearse'
              : releaseData?.plate_number || '—'}
          </DetailValue>
        </DetailItem>
        <DetailItem><DetailLabel>Final Destination / Location</DetailLabel><DetailValue>{releaseData?.final_destination || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Released By (Staff)</DetailLabel><DetailValue>{releaseData?.staff_name || releaseData?.received_by || releaseData?.released_by || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Recorded On</DetailLabel><DetailValue>{releaseData?.created_at ? formatDateTime(releaseData.created_at) : '—'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead $mt0><span>04</span> Verification &amp; Handover Notes</SectionHead>
      <DetailGrid>
        <DetailItem>
          <DetailLabel>Payments Cleared</DetailLabel>
          <DetailValue>
            {releaseData ? 'Yes — everything paid' : '—'}
          </DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Terms Accepted</DetailLabel>
          <DetailValue>{releaseData ? (isEnabledFlag(releaseData.terms_accepted) ? 'Yes' : 'No') : '—'}</DetailValue>
        </DetailItem>
      </DetailGrid>

      {(releaseData?.signature || releaseData?.staff_signature) && (
        <Col style={{ marginBottom: 24 }}>
          <SectionHead $mt0><span>05</span> Authorizing Signatures</SectionHead>
          <DetailGrid $cols>
            {releaseData?.signature && (
              <DetailItem>
                <DetailLabel>Next of Kin Signature</DetailLabel>
                <img
                  src={/^(data:|https?:\/\/)/.test(releaseData.signature) ? releaseData.signature : `${env.API_GATEWAY_URL}${releaseData.signature.startsWith('/') ? '' : '/'}${releaseData.signature}`}
                  alt="Next of Kin Signature"
                  style={{ maxHeight: 200, maxWidth: 2200, width: '100%', objectFit: 'contain', background: 'white', padding: 8 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </DetailItem>
            )}
            {releaseData?.staff_signature && (
              <DetailItem>
                <DetailLabel>Staff Signature</DetailLabel>
                <img
                  src={/^(data:|https?:\/\/)/.test(releaseData.staff_signature) ? releaseData.staff_signature : `${env.API_GATEWAY_URL}${releaseData.staff_signature.startsWith('/') ? '' : '/'}${releaseData.staff_signature}`}
                  alt="Staff Signature"
                  style={{ maxHeight: 170, maxWidth: 460, width: '100%', objectFit: 'contain', background: 'white', border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: 8 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </DetailItem>
            )}
          </DetailGrid>
        </Col>
      )}
    </>
  );
};

export default ReleaseTab;