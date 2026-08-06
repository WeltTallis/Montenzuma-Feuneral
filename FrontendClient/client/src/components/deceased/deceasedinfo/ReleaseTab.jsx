import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import api from '../../../api/axios';
import { getTenantHeaders } from '../../../api/endpoints';

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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 1.5rem 2rem; 
  margin-bottom: 24px;
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
        const tenantSlug = localStorage.getItem('tenantSlug');
        const admissionNumber = d.admission_number || d.admission_no || deceasedId;
        
        // Try 1: Fetch by admission number (most reliable)
        try {
          const byAdmissionRes = await api.get(`/body-release/by-admission/${admissionNumber}`, {
            headers: {
              ...getTenantHeaders(),
              'x-tenant-slug': tenantSlug
            }
          });
          if (byAdmissionRes.data?.success && byAdmissionRes.data?.data) {
            setReleaseData(byAdmissionRes.data.data);
            setIsLoading(false);
            return;
          }
        } catch (e) { /* not found by admission */ }

        // Try 2: Fetch by deceased ID
        try {
          const directResponse = await api.get(`/body-release/checkout/${deceasedId}`, {
            headers: {
              ...getTenantHeaders(),
              'x-tenant-slug': tenantSlug
            }
          });
          if (directResponse.data?.success && directResponse.data?.data) {
            setReleaseData(directResponse.data.data);
            setIsLoading(false);
            return;
          }
        } catch (e) { /* not found by id */ }

        // Try 3: Fetch all releases and find by admission_number or name
        const response = await api.get('/body-release/checkout', {
          headers: {
            ...getTenantHeaders(),
            'x-tenant-slug': tenantSlug
          }
        });
        
        if (response.data?.success && response.data?.data) {
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
      <SectionHead $mt0 $primary><span>01</span> Release Details</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Scheduled Release Date</DetailLabel><DetailValue>{releaseData?.date_of_removal ? formatDate(releaseData.date_of_removal) : 'Not scheduled'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Scheduled Release Time</DetailLabel><DetailValue>{releaseData?.time_of_removal || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Authorized By (NOK)</DetailLabel><DetailValue>{releaseData?.next_kin || nextOfKin?.full_name || nextOfKin?.name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Relationship to Deceased</DetailLabel><DetailValue>{releaseData?.relationship || nextOfKin?.relationship || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead><span>02</span> Transportation Details</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Permit Number</DetailLabel><DetailValue>{releaseData?.permit_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Mode of Transport</DetailLabel><DetailValue>{releaseData?.mode_of_transport || 'Hearse / Van'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Transport Carrier / Driver Name</DetailLabel><DetailValue>{releaseData?.transport_carrier || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Final Destination</DetailLabel><DetailValue>{releaseData?.final_destination || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead><span>03</span> Release Checklist</SectionHead>
      <div style={{ marginBottom: '40px' }}>
        <ChecklistItem>
          <div className="icon success">✓</div>
          <span>All financials cleared (or payment plan agreed)</span>
        </ChecklistItem>
        <ChecklistItem>
          <div className="icon success">✓</div>
          <span>Burial permit obtained</span>
        </ChecklistItem>
        <ChecklistItem>
          <div className="icon pending">○</div>
          <span className="muted">Identification by Next of Kin (Pending)</span>
        </ChecklistItem>
      </div>

      {/* Sleek, borderless final authorization area */}
      <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px 0', borderTop: `1px solid ${C.borderLight || '#e0e0e0'}` }}>
        <h3 style={{ fontFamily: "'Merriweather', serif", marginBottom: '8px', color: C.black, fontSize: '18px' }}>Final Authorization</h3>
        <p style={{ color: C.gray, marginBottom: '24px', fontSize: '14px' }}>Ensure all checklist items are complete before releasing the body.</p>
        <Btn $danger style={{ padding: '12px 32px', fontSize: '14px' }} onClick={handleFinalizeRelease}>
          Finalize & Release Body
        </Btn>
      </div>
    </>
  );
};

export default ReleaseTab;