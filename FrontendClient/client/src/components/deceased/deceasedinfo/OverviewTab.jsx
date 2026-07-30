import React from 'react';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import env from '../../../utils/config/env';

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
    width: 100%; /* Full width bar */
  `}
`;

const DetailGrid = styled.div`
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Reduced minmax to pack tighter */
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
  
  ${p => p.$muted && `color: ${C.gray}; font-weight: 500;`}
`;

const StatusTag = styled.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 6px 12px;
  border-radius: 4px; 
  font-size: 12px; 
  font-weight: 700;
  background: ${p => p.$success ? C.successBg : C.warningBg};
  color: ${p => p.$success ? C.success : C.warning};
  border: 1px solid ${p => p.$success ? '#a7f3d0' : '#fde68a'};
`;

const OverviewTab = ({ deceased, nextOfKin }) => {
  const d = deceased || {};
  const name = d.full_name || d.name || 'Unknown';
  const sex = d.sex || d.gender || '';

  // Construct full signature URL
  const getSignatureUrl = (signaturePath) => {
    if (!signaturePath) return null;
    if (signaturePath.startsWith('data:image')) return signaturePath;
    if (signaturePath.startsWith('http')) return signaturePath;
    if (signaturePath.startsWith('/uploads/')) return `${env.API_GATEWAY_URL}${signaturePath}`;
    if (signaturePath.startsWith('uploads/')) return `${env.API_GATEWAY_URL}/${signaturePath}`;
    return `${env.API_GATEWAY_URL}/${signaturePath}`;
  };

  const signatureUrl = getSignatureUrl(d.signature);

  return (
    <>
      {/* Applied $primary to keep the black background only on the first header */}
      <SectionHead $mt0 $primary><span>01</span> Personal Information</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Full Legal Name</DetailLabel><DetailValue>{name}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>National ID Number</DetailLabel><DetailValue>{d.national_id || d.id_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Date of Birth</DetailLabel><DetailValue>{formatDate(d.date_of_birth || d.dob)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Age</DetailLabel><DetailValue>{d.age ? `${d.age} Years` : '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Sex</DetailLabel><DetailValue>{sex || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      {/* Default style used here (half underline) */}
      <SectionHead><span>02</span> Embalming & Body Status</SectionHead>
      <DetailGrid>
        <DetailItem>
          <DetailLabel>Embalming Status</DetailLabel>
          <DetailValue>
            <StatusTag $success={d.admission_status === 'embalmed'} $warning={d.admission_status !== 'embalmed'}>
              {d.admission_status === 'embalmed' ? '✓ Embalmed' : 'Pending Embalming'}
            </StatusTag>
          </DetailValue>
        </DetailItem>
        <DetailItem><DetailLabel>Date Admitted</DetailLabel><DetailValue>{formatDate(d.date_admitted)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Current Storage Location</DetailLabel><DetailValue>{d.chamber_assigned || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Body Status</DetailLabel><DetailValue>{d.body_status || 'In Morgue'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead><span>03</span> Next of Kin Details</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>NOK Full Name</DetailLabel><DetailValue>{nextOfKin?.full_name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Relationship</DetailLabel><DetailValue>{nextOfKin?.relationship || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Telephone Number</DetailLabel><DetailValue>{nextOfKin?.contact || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Alternative Phone</DetailLabel><DetailValue>{nextOfKin?.alternative_phone || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Physical Address</DetailLabel><DetailValue>{nextOfKin?.address || '—'}</DetailValue></DetailItem>
        
        {signatureUrl && (
          <DetailItem $full>
            <DetailLabel>Next of Kin Signature</DetailLabel>
            <DetailValue>
              <img 
                src={signatureUrl} 
                alt="Next of Kin Signature" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '150px', 
                  marginTop: '8px',
                  filter: 'grayscale(100%) contrast(1.2)' 
                }} 
              />
            </DetailValue>
          </DetailItem>
        )}
      </DetailGrid>
    </>
  );
};

export default OverviewTab;