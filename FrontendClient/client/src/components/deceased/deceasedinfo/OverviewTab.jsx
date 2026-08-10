import React, { useState } from 'react';
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

// -------------------------------------------------------------------
// Signature display
// -------------------------------------------------------------------
// Signatures are stored either as inline data-URIs or as file paths
// under /uploads/... which are served by the dedicated uploads-service
// (port 5012 in dev) - publicly, no auth required.
const SignatureDisplay = ({ path }) => {
  const [failed, setFailed] = useState(false);

  const buildUrl = (p) => {
    if (!p) return null;
    // Inline data URI or absolute URL - use as-is
    if (p.startsWith('data:image') || p.startsWith('http')) return p;
    // Relative /uploads/... path -> serve from the uploads-service
    const clean = p.replace(/^\/+/, '');
    return `${env.UPLOADS_URL}/${clean}`;
  };

  const src = buildUrl(path);

  if (!path) return null;

  return failed
    ? <a href={src} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.info }}>Click to view signature ↗</a>
    : <img src={src} alt="Next of Kin Signature" onError={() => setFailed(true)} style={{ maxWidth: '100%', maxHeight: 150, marginTop: 8, filter: 'grayscale(100%) contrast(1.2)' }} />;
};

const OverviewTab = ({ deceased, nextOfKin }) => {
  const d = deceased || {};
  const nok = nextOfKin || {};
  const name = d.full_name || d.name || 'Unknown';
  const sex = d.sex || d.gender || '';
  const signaturePath = d.signature || nok.signature;

  return (
    <>
      {/* Applied $primary to keep the black background only on the first header */}
      <SectionHead $mt0 $primary><span>01</span> Personal Information</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Full Legal Name</DetailLabel><DetailValue>{name}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Age</DetailLabel><DetailValue>{d.age ? `${d.age} Years` : '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Sex</DetailLabel><DetailValue>{sex || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      {/* Default style used here (half underline) */}
      <SectionHead><span>02</span> Admission & Body Status</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Date Admitted</DetailLabel><DetailValue>{formatDate(d.date_admitted)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Body Status</DetailLabel><DetailValue>{d.body_status || 'In Morgue'}</DetailValue></DetailItem>
      </DetailGrid>

      <SectionHead><span>03</span> Next of Kin Details</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>NOK Full Name</DetailLabel><DetailValue>{nok.full_name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>National ID Number</DetailLabel><DetailValue>{nok.id_number || d.national_id || d.id_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Relationship</DetailLabel><DetailValue>{nok.relationship || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Telephone Number</DetailLabel><DetailValue>{nok.contact || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Alternative Phone</DetailLabel><DetailValue>{nok.alternative_phone || '—'}</DetailValue></DetailItem>

        <DetailItem $full>
          <DetailLabel>Next of Kin Signature</DetailLabel>
          {signaturePath ? <SignatureDisplay path={signaturePath} /> : <DetailValue $muted>—</DetailValue>}
        </DetailItem>
      </DetailGrid>
    </>
  );
};

export default OverviewTab;
