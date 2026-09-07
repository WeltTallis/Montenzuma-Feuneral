import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { C, formatDate } from './theme';
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
  grid-template-columns: ${p => p.$cols ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))'}; 
  gap: 1.5rem 2rem; 
  margin-bottom: 24px;
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
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

const ReleaseTab = ({ deceased, nextOfKin, deceasedId }) => {
  const navigate = useNavigate();
  const d = deceased || {};
  const [releaseData, setReleaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalizeRelease = () => {
    let slug = localStorage.getItem('tenantSlug') || '';
    if (!slug || slug === 'dashboard' || slug === 'default') {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      slug = user?.parentTenantSlug || user?.tenantSlug || slug;
    }
    navigate(`/tenant/${slug}/release-form/${deceasedId}`, {
      state: { deceasedData: deceased }
    });
  };

  // Fetch release data
  useEffect(() => {
    const fetchReleaseData = async () => {
      if (!deceasedId) return;

      setIsLoading(true);
      try {
        // getTenantHeaders() already carries the auth token + tenant slug.
        // The backend matches releases saved under either the branch or the
        // parent organisation slug, so no manual slug override is needed.
        const admissionNumber = d.admission_number || d.admission_no || deceasedId;
        const headers = { ...getTenantHeaders() };

        // Try 1: Fetch by admission number (most reliable)
        try {
          const byAdmissionRes = await api.get(
            `/body-release/by-admission/${encodeURIComponent(admissionNumber)}`,
            { headers }
          );
          if (byAdmissionRes.data?.success && byAdmissionRes.data?.data) {
            setReleaseData(byAdmissionRes.data.data);
            return;
          }
        } catch (e) { /* not found by admission */ }

        // Try 2: List all releases and match by admission number or name
        const response = await api.get('/body-release/checkout', { headers });
        if (response.data?.success && Array.isArray(response.data?.data)) {
          const deceasedRelease = response.data.data.find((release) =>
            release.admission_number === admissionNumber ||
            release.admission_number === deceasedId ||
            release.name_of_deceased === d.full_name ||
            release.name_of_deceased === d.name_of_deceased
          );
          if (deceasedRelease) {
            setReleaseData(deceasedRelease);
          }
        }
      } catch (error) {
        console.error('Error fetching release data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleaseData();
  }, [deceasedId, d.full_name, d.name_of_deceased, d.admission_number, d.admission_no]);

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
              BODY RELEASED{releaseData.release_id ? ` — ${releaseData.release_id}` : ''}
            </div>
            <div style={{ fontSize: 12, color: C.gray }}>
              {releaseData.created_at ? `Released on ${formatDate(releaseData.created_at)}` : ''}
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
            No body release has been recorded for this deceased yet.
          </div>
          <Btn $primary onClick={handleFinalizeRelease}>
            <i className="fas fa-door-open" style={{ fontSize: 12 }}></i> Start Release
          </Btn>
        </div>
      )}

      <TwoColGrid>
        <Col>
          <SectionHead $mt0 $primary><span>01</span> Release Details</SectionHead>
          <DetailGrid $cols>
            <DetailItem><DetailLabel>Release ID</DetailLabel><DetailValue>{releaseData?.release_id || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Deceased</DetailLabel><DetailValue>{releaseData?.name_of_deceased || d.full_name || d.name_of_deceased || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Scheduled Release Date</DetailLabel><DetailValue>{releaseData?.date_of_removal ? formatDate(releaseData.date_of_removal) : 'Not scheduled'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Scheduled Release Time</DetailLabel><DetailValue>{releaseData?.time_of_removal || '—'}</DetailValue></DetailItem>
          </DetailGrid>
        </Col>

        <Col>
          <SectionHead $mt0><span>02</span> Receiver / Next of Kin</SectionHead>
          <DetailGrid $cols>
            <DetailItem><DetailLabel>Authorized By (NOK)</DetailLabel><DetailValue>{releaseData?.next_kin || nextOfKin?.full_name || nextOfKin?.name || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Relationship to Deceased</DetailLabel><DetailValue>{releaseData?.relationship || nextOfKin?.relationship || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Receiver ID Number</DetailLabel><DetailValue>{releaseData?.id_number || nextOfKin?.id_number || '—'}</DetailValue></DetailItem>
            <DetailItem><DetailLabel>Receiver Phone</DetailLabel><DetailValue>{releaseData?.tell_number || nextOfKin?.contact || '—'}</DetailValue></DetailItem>
          </DetailGrid>
        </Col>
      </TwoColGrid>

      <SectionHead $mt0><span>03</span> Transport &amp; Release Officer</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Permit Number</DetailLabel><DetailValue>{releaseData?.permit_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Mode of Transport</DetailLabel><DetailValue>{releaseData?.mode_of_transport || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Released By (Staff)</DetailLabel><DetailValue>{releaseData?.received_by || releaseData?.staff_name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Recorded On</DetailLabel><DetailValue>{releaseData?.created_at ? formatDate(releaseData.created_at) : '—'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead $mt0><span>04</span> Verification &amp; Handover Notes</SectionHead>
      <DetailGrid>
        <DetailItem>
          <DetailLabel>Payments Cleared</DetailLabel>
          <DetailValue>{releaseData ? (releaseData.everything_paid ? 'Yes — everything paid' : 'Not marked as fully paid') : '—'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Terms Accepted</DetailLabel>
          <DetailValue>{releaseData ? (releaseData.terms_accepted ? 'Yes' : 'No') : '—'}</DetailValue>
        </DetailItem>
        <DetailItem $full>
          <DetailLabel>Items Returned with Body</DetailLabel>
          <DetailValue $muted>{releaseData?.items_returned || 'None recorded'}</DetailValue>
        </DetailItem>
        <DetailItem $full>
          <DetailLabel>Notes</DetailLabel>
          <DetailValue $muted>{releaseData?.notes || 'No notes recorded'}</DetailValue>
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
                  style={{ maxHeight: 170, maxWidth: 460, width: '100%', objectFit: 'contain', background: 'white', border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: 8 }}
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