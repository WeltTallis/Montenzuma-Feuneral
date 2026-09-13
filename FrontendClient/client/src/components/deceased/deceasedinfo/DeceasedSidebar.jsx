import React from 'react';
import styled, { keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { C, getInitials, getDaysInMorgue, formatDate } from './theme';
import { getTenantSlug } from '../../../utils/globalAuth';

/* ─── Pulse animation for active timeline dots ─── */
const pulse = keyframes`
  0%   { box-shadow: 0 0 0 4px white, 0 0 0 0 rgba(245, 158, 11, 0.5); }
  70%  { box-shadow: 0 0 0 4px white, 0 0 0 8px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 4px white, 0 0 0 0 rgba(245, 158, 11, 0); }
`;

/* ─── Sidebar Card ─── */
const SidebarCard = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 24px;
  width: 100%;
  max-width: 480px;

  @media (max-width: 900px) {
    position: static;
    max-width: 100%;
  }
`;

/* ─── Header ─── */
const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${C.borderLight};
  padding-bottom: 20px;
`;

const AvatarLg = styled.div`
  width: 64px; height: 64px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 26px;
  flex-shrink: 0;
  font-family: 'Merriweather', serif;
  background: ${p => p.$female ? C.brown : C.black};
`;

const SidebarName = styled.div`
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  color: ${C.black};
`;

const SidebarMeta = styled.div`
  font-size: 13px;
  color: ${C.gray};
  margin-top: 4px;
`;

const AdmissionBadge = styled.div`
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  color: ${C.info};
  background: ${C.infoBg};
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.03em;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: ${C.borderLight};
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const StatBox = styled.div`
  background: white;
  padding: 16px 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.$color || C.black};
`;

const StatLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${C.gray};
  margin-top: 4px;
`;

const ChargeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed ${C.borderLight};
  font-size: 14px;
  color: ${C.mid};
  &:last-of-type { border-bottom: none; }
  strong { color: ${p => (p.$highlight ? C.danger : C.black)}; font-weight: 700; }
`;
const ChargeNote = styled.p`
  font-size: 11px;
  color: ${C.gray};
  margin: 10px 0 0;
  line-height: 1.5;
`;

const SidebarSection = styled.div`
  margin-bottom: 28px;
  h3 {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${C.black};
    margin-bottom: 16px;
    letter-spacing: 0.05em;
  }
`;

const NotifItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${C.borderLight};
  &:last-of-type { border-bottom: none; }
`;

const NotifIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: bold;
  background: ${p => p.$warning ? C.warningBg : C.infoBg};
  color: ${p => p.$warning ? C.warning : C.info};
`;

const NotifText = styled.div`
  font-size: 13px;
  color: ${C.mid};
  line-height: 1.4;
`;

const NotifTime = styled.div`
  font-size: 11px;
  color: ${C.lightGray};
  margin-top: 2px;
`;

/* ─── Redesigned Vertical Timeline ─── */
const TimelineContainer = styled.div`
  position: relative;
  padding-left: 8px;
  margin-top: 8px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 12px;
    bottom: 12px;
    width: 2px;
    background: ${C.borderLight};
    border-radius: 2px;
  }
`;

const TimelineItemRow = styled.div`
  position: relative;
  padding: 10px 0 28px 48px;

  &:last-child { padding-bottom: 8px; }
`;

const TimelineDot = styled.div`
  position: absolute;
  left: 0;
  top: 12px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 5px solid #d1d5db;
  z-index: 2;
  box-shadow: 0 0 0 4px white;
  transition: all 0.2s ease;

  ${({ $completed }) => $completed && `
    background: ${C.success};
    border-color: ${C.success};
    box-shadow: 0 0 0 4px white, 0 0 8px rgba(16, 185, 129, 0.4);
  `}

  ${({ $active }) => $active && `
    background: ${C.warning};
    border-color: ${C.warning};
    box-shadow: 0 0 0 4px white, 0 0 8px rgba(245, 158, 11, 0.6);
    animation: ${pulse} 2s infinite;
  `}
`;

const TimelineContent = styled.div`
  background: #fff;
  padding: 4px 0;
`;

const TimelineText = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${C.gray};
  line-height: 1.4;

  ${({ $completed }) => $completed && `color: ${C.success};`}
  ${({ $active }) => $active && `color: ${C.warning};`}
`;

const TimelineTime = styled.div`
  font-size: 13px;
  color: ${C.lightGray};
  font-weight: 500;
  margin-top: 4px;

  ${({ $completed }) => $completed && `color: ${C.success}; opacity: 0.8;`}
    ${({ $active }) => $active && `color: ${C.warning}; opacity: 0.9;`}
`;

/* ─── QR Code Section ─── */
const QrSection = styled.div`
  margin-top: 28px;
  border-top: 1px solid ${C.borderLight};
  padding-top: 24px;
`;

const QrContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  background: ${C.pendingBg};
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed ${C.borderLight};
`;

const QrImageBox = styled.div`
  width: 110px;
  height: 110px;
  background: white;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QrInfo = styled.div`
  h4 {
    font-family: 'Merriweather', serif;
    font-size: 15px;
    color: ${C.black};
    margin-bottom: 6px;
  }
  p {
    font-size: 12px;
    color: ${C.gray};
    line-height: 1.4;
    margin-bottom: 10px;
  }
`;

const QrId = styled.span`
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  color: ${C.info};
  background: ${C.infoBg};
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
`;

const PaymentBadge = styled.strong`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${p => {
    if (p.$status === 'Done') return 'white';
    if (p.$status === 'Not Recorded') return '#666';
    return 'white';
  }} !important;
  background-color: ${p => {
    if (p.$status === 'Done') return C.success;
    if (p.$status === 'Not Recorded') return '#f3f4f6';
    return C.warning;
  }} !important;
  box-shadow: ${p => {
    if (p.$status === 'Done') return '0 0 8px rgba(16, 185, 129, 0.4)';
    if (p.$status === 'Not Recorded') return 'none';
    return '0 0 8px rgba(245, 158, 11, 0.4)';
  }} !important;
`;

const StorageBadge = styled.strong`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: white !important;
  background-color: ${p => (p.$released ? C.success : C.warning)} !important;
  box-shadow: ${p => p.$released ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(245, 158, 11, 0.4)'} !important;
`;

const DeceasedSidebar = ({ deceased, postmortem, bodyStatus, totalCharges, totalPaid = 0, balance = 0, age }) => {
  const name = deceased?.full_name || deceased?.name || 'Unknown';
  const sex = deceased?.sex || deceased?.gender || '';
  const isFemale = sex.toLowerCase() === 'female';
  const daysInMorgue = getDaysInMorgue(deceased?.date_admitted || deceased?.admission_date || deceased?.created_at);
  const documentCount = Array.isArray(deceased?.documents) ? deceased.documents.length : 0;
  const releaseData = deceased?.releaseData || null;

  // ── Correct deceased ID & admission number ───────────────────────────
  // The deceased is looked up by ID, so we always resolve the canonical
  // deceased_id (falls back to the numeric id) and admission_number.
  const deceasedId = deceased?.deceased_id || deceased?.id || deceased?.deceasedId;
  const admissionNo = deceased?.admission_number || deceased?.admission_no;

  let paymentStatus = 'Not Recorded';
  if (totalCharges > 0) {
    paymentStatus = Number(balance) <= 0 ? 'Done' : 'Pending';
  }

  // ─── Days → charges counter ─────────────────────────────────────────
  // The sidebar counts how many days the body has been in the morgue and
  // the storage charge those days accrue at the tenant's daily rate
  // (Charge Settings → "Storage Rate (Ksh/day)", default KES 500/day).
  const dailyRate = parseFloat(deceased?.charges?.storage_rate) || 500;
  const storageCharge = Math.round(daysInMorgue * dailyRate);

  // ─── QR code encodes the profile URL keyed by the deceased ID ──────
  // Scanning the QR tag attached to the body opens this deceased's
  // profile page, looked up by ID via the ?id= query parameter.
  const tenantSlug = getTenantSlug();
  const profileUrl = typeof window !== 'undefined' && tenantSlug && deceasedId
    ? `${window.location.origin}/tenant/${encodeURIComponent(tenantSlug)}/deceased?id=${encodeURIComponent(deceasedId)}`
    : '';

  return (
    <SidebarCard>
      <SidebarHeader>
        <AvatarLg $female={isFemale}>{getInitials(name)}</AvatarLg>
        <div>
          <SidebarName>{name}</SidebarName>
          <SidebarMeta>{sex ? `${sex}, ` : ''}{age ? `${age} Years` : ''}</SidebarMeta>
          <AdmissionBadge>Admission: {admissionNo || '—'}</AdmissionBadge>
        </div>
      </SidebarHeader>

      <StatGrid>
        <StatBox>
          <StatValue $color={C.warning}>{daysInMorgue}</StatValue>
          <StatLabel>Days in Morgue</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue>{age || '—'}</StatValue>
          <StatLabel>Age</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue>{totalCharges && totalCharges > 0 ? (Math.round(totalCharges / 1000)) : '0'}K</StatValue>
          <StatLabel>Charges (KES)</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue $color={C.danger}>{balance && balance > 0 ? (Math.round(balance / 1000)) : '0'}K</StatValue>
          <StatLabel>Balance (KES)</StatLabel>
        </StatBox>
      </StatGrid>

      <SidebarSection>
        <h3>Storage Charges</h3>
        <ChargeRow>
          <span>Days in morgue</span>
          <strong>{daysInMorgue} day{daysInMorgue === 1 ? '' : 's'}</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Daily storage rate</span>
          <strong>KES {dailyRate.toLocaleString()}</strong>
        </ChargeRow>
        <ChargeRow $highlight>
          <span>Storage charge so far</span>
          <strong>KES {storageCharge.toLocaleString()}</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Total charges (all services)</span>
          <strong>{totalCharges && totalCharges > 0 ? (Math.round(totalCharges / 1000)) : '0'}K</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Balance</span>
          <strong>{balance && balance > 0 ? (Math.round(balance / 1000)) : '0'}K</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Payment status</span>
          <PaymentBadge $status={paymentStatus}>
            {paymentStatus === 'Done' && '✓ '}{paymentStatus}
          </PaymentBadge>
        </ChargeRow>
        <ChargeRow>
          <span>Paid so far</span>
          <strong>{totalPaid && totalPaid > 0 ? (Math.round(totalPaid / 1000)) : '0'}K</strong>
        </ChargeRow>
        <ChargeNote>
          Storage charge = days in morgue × daily rate (set under Charge Settings).
          Embalming and extra charges are listed under the Financials tab.
        </ChargeNote>
      </SidebarSection>

      <SidebarSection>
        <h3>Documents & Storage</h3>
        <ChargeRow>
          <span>Documents Uploaded</span>
          <strong>{documentCount} file{documentCount !== 1 ? 's' : ''}</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Body Storage Status</span>
          <StorageBadge $released={bodyStatus === 'Released'}>
            {bodyStatus === 'Released' && '✓ '}{bodyStatus === 'In Morgue' || bodyStatus === 'Active' ? 'In Storage' : 'Released'}
          </StorageBadge>
        </ChargeRow>
      </SidebarSection>

      <SidebarSection>
        <h3>Notifications</h3>
        {daysInMorgue > 7 && (
          <NotifItem>
            <NotifIcon $warning>!</NotifIcon>
            <div>
              <NotifText>Body has been in the morgue for {daysInMorgue} days. Please contact next of kin.</NotifText>
              <NotifTime>Active</NotifTime>
            </div>
          </NotifItem>
        )}
        <NotifItem>
          <NotifIcon $info>i</NotifIcon>
          <div>
            <NotifText>Record status: {bodyStatus}</NotifText>
            <NotifTime>Updated {formatDate(deceased?.updated_at)}</NotifTime>
          </div>
        </NotifItem>
      </SidebarSection>

      <SidebarSection>
        <h3>Mortuary Progress</h3>
        <TimelineContainer>
        <TimelineItemRow $completed={true}>
          <TimelineDot $completed={true} />
          <TimelineContent>
            <TimelineText $completed={true}>Admitted to Morgue</TimelineText>
            <TimelineTime $completed={true}>{formatDate(deceased?.created_at)}</TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={deceased?.embalmed} $active={!deceased?.embalmed}>
          <TimelineDot $completed={deceased?.embalmed} $active={!deceased?.embalmed} />
          <TimelineContent>
            <TimelineText $completed={deceased?.embalmed} $active={!deceased?.embalmed}>{deceased?.embalmed ? '✓ Embalmed' : 'Body Awaiting Embalming'}</TimelineText>
            <TimelineTime $completed={deceased?.embalmed} $active={!deceased?.embalmed}>{deceased?.embalmed ? formatDate(deceased?.embalmed_date) : 'Pending'}</TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
          <TimelineDot $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'} />
          <TimelineContent>
            <TimelineText $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
              Postmortem {postmortem ?
                (postmortem.status === 'completed' ? '✓ Completed' :
                 postmortem.status === 'pending' ? 'In Progress' :
                 postmortem.status === 'in_progress' ? 'In Progress' : 'Requested') :
                'Not Requested'}
            </TimelineText>
            <TimelineTime $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
              {postmortem?.status === 'completed' ? formatDate(postmortem.completed_at || postmortem.updated_at) :
               postmortem?.status === 'pending' || postmortem?.status === 'in_progress' ? 'Awaiting Results' :
               postmortem ? formatDate(postmortem.requested_at || postmortem.created_at) : '—'}
            </TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={releaseData && releaseData.release_id} $active={bodyStatus === 'In Morgue' || bodyStatus === 'Active'}>
          <TimelineDot $completed={releaseData && releaseData.release_id} $active={bodyStatus === 'In Morgue' || bodyStatus === 'Active'} />
          <TimelineContent>
            <TimelineText $completed={releaseData && releaseData.release_id}>{releaseData && releaseData.release_id ? '✓ Body Released' : 'In Storage (' + (bodyStatus || 'Normal') + ')'}</TimelineText>
            <TimelineTime $completed={releaseData && releaseData.release_id} $active={!releaseData && (bodyStatus === 'In Morgue' || bodyStatus === 'Active')}>{releaseData && releaseData.release_id ? 'Complete' : 'Currently Active'}</TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={releaseData && releaseData.release_id} $active={!releaseData}>
          <TimelineDot $completed={releaseData && releaseData.release_id} $active={!releaseData} />
          <TimelineContent>
            <TimelineText $completed={releaseData && releaseData.release_id}>{releaseData && releaseData.release_id ? '✓ Released to Family' : 'Released to Family'}</TimelineText>
            <TimelineTime $completed={releaseData && releaseData.release_id} $active={!releaseData}>
              {releaseData && releaseData.release_id ? `${formatDate(releaseData.created_at)}` : 'Pending'}
            </TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        </TimelineContainer>
      </SidebarSection>

      {/* ─── QR Code Section ──────────────────────────────────────────────
          The QR tag encodes the deceased's profile URL keyed by their ID.
          Scanning it opens the profile (deceased by ID). ───────────────── */}
      <QrSection>
        <h3>Body Identification</h3>
        <QrContainer>
          <QrImageBox>
            <QRCodeSVG
              value={profileUrl || (deceasedId || 'NO-ID')}
              size={110}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor={C.black}
            />
          </QrImageBox>
          <QrInfo>
            <h4>Scan to View Profile</h4>
            <p>Scan the QR tag attached to the body to open this deceased's profile.</p>
            <QrId>Deceased ID: {deceasedId || '—'}</QrId>
          </QrInfo>
        </QrContainer>
      </QrSection>

    </SidebarCard>
  );
};

export default DeceasedSidebar;