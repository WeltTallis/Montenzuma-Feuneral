import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenantSlug } from '../../../utils/globalAuth';
import { getTenantHeaders } from '../../../api/endpoints';
import env from '../../../utils/config/env';
import styled from 'styled-components';
import { C, formatDate } from './theme';

const SectionHead = styled.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${C.black};
  color: ${C.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${p => p.$mt0 && 'margin-top: 0;'}

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
  
  ${p => p.$body && `font-weight: 400; line-height: 1.6; font-size: 14px; color: ${C.mid};`}
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
`;

const PostmortemTab = ({ postmortem, deceasedId }) => {
  const navigate = useNavigate();
  const pm = postmortem || {};
  const tenantSlug = getTenantSlug();

  const hasData = pm.immediate_cause_of_death || pm.manner_of_death || pm.examination_summary;

  const openForm = () => {
    navigate(`/tenant/${tenantSlug}/postmortem-form/${deceasedId}`);
  };

  const generatePDF = async () => {
    try {
      const headers = getTenantHeaders();
      const url = `${env.FULL_API_URL}/postmortem/${deceasedId}/pdf`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'application/pdf',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to generate PDF (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, gap: 12 }}>
        {hasData && (
          <Btn onClick={openForm}>Edit Examination</Btn>
        )}
        <Btn $primary onClick={openForm}>
          {hasData ? '+ New Examination' : '+ Fill Examination Form'}
        </Btn>
      </div>

      <SectionHead $mt0 $primary><span>01</span> Official Determination of Death</SectionHead>
      <DetailGrid>
        <DetailItem $full><DetailLabel>Immediate Cause of Death</DetailLabel><DetailValue>{pm.immediate_cause_of_death || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Underlying Cause of Death</DetailLabel><DetailValue>{pm.underlying_cause_of_death || '—'}</DetailValue></DetailItem>
        
        {/* Only show when available, and make full width */}
        {pm.manner_of_death && (
          <DetailItem $full>
            <DetailLabel>Manner of Death</DetailLabel>
            <DetailValue>{pm.manner_of_death}</DetailValue>
          </DetailItem>
        )}
        
        {/* Only show when available, and make full width */}
        {pm.contributing_conditions && (
          <DetailItem $full>
            <DetailLabel>Contributing Conditions</DetailLabel>
            <DetailValue>{pm.contributing_conditions}</DetailValue>
          </DetailItem>
        )}
      </DetailGrid>

      <SectionHead><span>02</span> Pathologist Statement</SectionHead>
      <DetailGrid>
        <DetailItem $full>
          <DetailLabel>Examination Summary</DetailLabel>
          <DetailValue $body>{pm.examination_summary || 'No statement provided.'}</DetailValue>
        </DetailItem>
      </DetailGrid>

      <SectionHead><span>03</span> Examiner Details</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Examining Pathologist</DetailLabel><DetailValue>{pm.pathologist_name || pm.external_pathologist_name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Date Completed</DetailLabel><DetailValue>{formatDate(pm.completed_at || pm.updated_at)}</DetailValue></DetailItem>
      </DetailGrid>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12, flexWrap: 'wrap' }}>
        <Btn onClick={openForm}>Open Examination Form</Btn>
        <Btn $primary onClick={generatePDF}>Download PDF Report</Btn>
        <Btn onClick={() => navigate(-1)}>Sign Out</Btn>
      </div>
    </>
  );
};

export default PostmortemTab;