import React from 'react';
import styled from 'styled-components';
import { C, formatDate } from './theme';

const SectionHead = styled.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; /* Compacted from 24px */
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Tighter minmax */
  gap: 1.5rem 2rem; /* Compacted spacing */
  margin-bottom: 24px; /* Compacted from 32px */
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
  ${p => p.$hl && `
    color: #5F0F40;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: 0.01em;
    text-shadow: 0 0 12px rgba(95, 15, 64, 0.12);
  `}
`;

const AdmissionTab = ({ deceased }) => {
  const d = deceased || {};

  return (
    <>
      <SectionHead $mt0 $primary><span>01</span> Admission Specifics</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Admission Number</DetailLabel><DetailValue>{d.admission_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Date Admitted</DetailLabel><DetailValue $hl>{formatDate(d.date_admitted || d.created_at)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Time Received</DetailLabel><DetailValue>{d.time_received || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Receiving Officer</DetailLabel><DetailValue $hl>{d.receiving_officer || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Received From</DetailLabel><DetailValue>{d.received_from || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead><span>02</span> Death Specifics</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Date of Death</DetailLabel><DetailValue>{formatDate(d.date_of_death)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Place of Death</DetailLabel><DetailValue>{d.place_of_death || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Cause of Death</DetailLabel><DetailValue>{d.cause_of_death || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Permit Number</DetailLabel><DetailValue>{d.permit_number || '—'}</DetailValue></DetailItem>
      </DetailGrid>
    </>
  );
};

export default AdmissionTab;
