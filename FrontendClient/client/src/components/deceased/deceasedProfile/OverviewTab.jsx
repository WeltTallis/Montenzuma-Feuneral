
import { rebaseUploadUrl } from '../../../utils/tenantResolver/tenantBranding';
import React, { useState } from 'react';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import env from '../../../utils/config/env';


const SectionHead = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 3px;
  border-bottom: 2px solid ${C.black};
  color: ${C.black};
  width: fit-content;
  span { opacity: 0.45; font-size: 9px; }
  ${p => p.$mt0 && 'margin-top: 0;'}
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${p => p.$full && 'grid-column: 1 / -1;'}
`;

const DetailLabel = styled.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`;

const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${C.black};
  word-break: break-word;
  line-height: 1.35;
  ${p => p.$mono && 'font-family: ui-monospace, monospace; font-size: 13px;'}
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
    if (p.startsWith('data:image')) return p;
    if (p.startsWith('http')) return rebaseUploadUrl(p);
    if (p.startsWith('/')) return `${env.UPLOADS_URL}${p}`;
    const clean = p.replace(/^\/+/, '');
    return `${env.UPLOADS_URL}/${clean}`;
  };

  const src = buildUrl(path);
  if (!path) return null;

  return failed
    ? <a href={src} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#1a73e8' }}>Click to view signature ↗</a>
    : <img src={src} alt="Next of Kin Signature" onError={() => setFailed(true)} style={{ maxWidth: '100%', maxHeight: 220, marginTop: 6, background: '#fff', padding: 6, objectFit: 'contain' }} />;
};

const OverviewTab = ({ deceased, nextOfKin }) => {
  const d = deceased || {};
  const nok = nextOfKin || {};
  const signaturePath = d.signature || nok.signature;
  const deceasedName = d.full_name || d.name || 'Unknown';

  return (
    <>
      {/* Deceased Name — Julius Sans One, top-left */}
      <DetailItem $full style={{ marginBottom: '20px' }}>
        <DetailLabel style={{ fontSize: 11, opacity: 0.55 }}>Deceased Name</DetailLabel>
        <DetailValue style={{ color: '#00296B', fontSize: 24, fontWeight: 400, fontFamily: "'Julius Sans One', serif", lineHeight: 1.25, marginBottom: 8 }}>{deceasedName}</DetailValue>
      </DetailItem>

      {/* 01 — Admission */}
      <SectionHead $mt0><span>01</span> Admission</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>Admission Number</DetailLabel><DetailValue $mono>{d.admission_number || d.admission_no || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Date Admitted</DetailLabel><DetailValue>{formatDate(d.date_admitted || d.created_at)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Time Received</DetailLabel><DetailValue $mono>{d.time_received || d.admission_time || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Receiving Officer</DetailLabel><DetailValue>{d.receiving_officer || d.admitted_by || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Body Status</DetailLabel><DetailValue>{d.body_status || d.body_condition || 'In Morgue'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Received From</DetailLabel><DetailValue>{d.received_from || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Date of Death</DetailLabel><DetailValue>{formatDate(d.date_of_death)}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Place of Death</DetailLabel><DetailValue>{d.place_of_death || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Permit Number</DetailLabel><DetailValue $mono>{d.permit_number || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Cause of Death</DetailLabel><DetailValue>{d.cause_of_death || '—'}</DetailValue></DetailItem>
      </DetailGrid>

      {/* 02 — Next of Kin */}
      <SectionHead><span>03</span> Next of Kin</SectionHead>
      <DetailGrid>
        <DetailItem><DetailLabel>NOK Name</DetailLabel><DetailValue>{nok.full_name || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Relationship</DetailLabel><DetailValue>{nok.relationship || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>National ID</DetailLabel><DetailValue $mono>{nok.id_number || d.national_id || d.id_number || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Telephone</DetailLabel><DetailValue>{nok.contact || '—'}</DetailValue></DetailItem>
        <DetailItem><DetailLabel>Alt. Phone</DetailLabel><DetailValue>{nok.alternative_phone || '—'}</DetailValue></DetailItem>
        <DetailItem $full><DetailLabel>Signature</DetailLabel>{signaturePath ? <SignatureDisplay path={signaturePath} /> : <DetailValue style={{ color: '#999' }}>—</DetailValue>}</DetailItem>
      </DetailGrid>
    </>
  );
};

export default OverviewTab;
