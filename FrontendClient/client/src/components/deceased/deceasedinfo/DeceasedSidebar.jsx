import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { C, getInitials, formatDate, getDaysInMorgue } from './theme';
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

/* ─── Horizontal mortuary progress stepper ─── */
const TimelineContainer = styled.div`
  position: relative;
  margin-top: 8px;
  display: flex;
  gap: 0;
  padding: 8px 0 4px;

  &::before {
    content: '';
    position: absolute;
    left: 8%;
    right: 8%;
    top: 25px;
    height: 2px;
    background: ${C.borderLight};
    border-radius: 2px;
  }

  @media (max-width: 560px) {
    overflow-x: auto;
    padding-bottom: 10px;
  }
`;

const TimelineItemRow = styled.div`
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  padding: 0 2px;
  text-align: center;
  z-index: 1;

  @media (max-width: 560px) {
    flex: 0 0 92px;
  }
`;

const TimelineDot = styled.div`
  position: relative;
  margin: 0 auto 10px;
  width: 20px;
  height: 20px;
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

  ${({ $active }) => $active && css`
    background: ${C.warning};
    border-color: ${C.warning};
    box-shadow: 0 0 0 4px white, 0 0 8px rgba(245, 158, 11, 0.6);
    animation: ${pulse} 2s infinite;
  `}
`;

const TimelineContent = styled.div`
  background: #fff;
  padding: 0;
`;

const TimelineText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${C.gray};
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${({ $completed }) => $completed && `color: ${C.success};`}
  ${({ $active }) => $active && `color: ${C.warning};`}
`;

const TimelineTime = styled.div`
  font-size: 9px;
  color: ${C.lightGray};
  font-weight: 500;
  margin-top: 4px;
  white-space: nowrap;

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
  justify-content: center;
  background: ${C.pendingBg};
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed ${C.borderLight};
`;

const QrImageBox = styled.div`
  width: 160px;
  box-sizing: border-box;
  background: white;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const QrId = styled.div`
  max-width: 100%;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  color: ${C.info};
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

const DeceasedSidebar = ({ deceased, postmortem, bodyStatus, age }) => {
  const name = deceased?.full_name || deceased?.name || 'Unknown';
  const sex = deceased?.sex || deceased?.gender || '';
  const isFemale = sex.toLowerCase() === 'female';
  const documentCount = Array.isArray(deceased?.documents) ? deceased.documents.length : 0;
  const releaseData = deceased?.releaseData || null;
  const daysInCare = getDaysInMorgue(deceased?.date_admitted || deceased?.created_at);
  const dailyRate = Number(deceased?.charges?.per_day ?? deceased?.charges?.dailyRate ?? deceased?.charges?.storage_rate ?? 0);
  const chargeSource = deceased?.charges?.source === 'home_default' || deceased?.charges?.is_default
    ? 'Home default'
    : 'Deceased-specific';
  const estimatedCareTotal = daysInCare * dailyRate;

  // ── Correct deceased ID & admission number ───────────────────────────
  // The deceased is looked up by ID, so we always resolve the canonical
  // deceased_id (falls back to the numeric id) and admission_number.
  const deceasedId = deceased?.deceased_id || deceased?.id || deceased?.deceasedId;
  const admissionNo = deceased?.admission_number || deceased?.admission_no;

  const tenantSlug = getTenantSlug();
  const profileUrl = typeof window !== 'undefined' && tenantSlug && deceasedId
    ? `${window.location.origin}/tenant/${encodeURIComponent(tenantSlug)}/deceased?id=${encodeURIComponent(deceasedId)}`
    : '';

  // ─── QR code encodes the profile URL keyed by the deceased ID ──────
  // Scanning the QR tag attached to the body opens this deceased's
  // profile page, looked up by ID via the ?id= query parameter.
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
        <h3>Care Charges</h3>
        <ChargeRow>
          <span>Days in care</span>
          <strong>{daysInCare} day{daysInCare === 1 ? '' : 's'}</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Daily rate</span>
          <strong>{dailyRate ? `KES ${dailyRate.toLocaleString()}` : 'Not set'}</strong>
        </ChargeRow>
        <ChargeRow>
          <span>Rate source</span>
          <strong>{dailyRate ? chargeSource : 'Not configured'}</strong>
        </ChargeRow>
        <ChargeRow $highlight>
          <span>Estimated care total</span>
          <strong>{`KES ${estimatedCareTotal.toLocaleString()}`}</strong>
        </ChargeRow>
      </SidebarSection>

      <SidebarSection>
        <h3>Notifications</h3>
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
            <TimelineText $completed={true}>Admitted</TimelineText>
            <TimelineTime $completed={true}>{formatDate(deceased?.created_at)}</TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
          <TimelineDot $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'} />
          <TimelineContent>
            <TimelineText $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
              Postmortem
            </TimelineText>
            <TimelineTime $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
              {postmortem?.status === 'completed' ? formatDate(postmortem.completed_at || postmortem.updated_at) :
               postmortem ? 'Pending' : '—'}
            </TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        <TimelineItemRow $completed={releaseData && releaseData.release_id} $active={!releaseData}>
          <TimelineDot $completed={releaseData && releaseData.release_id} $active={!releaseData} />
          <TimelineContent>
            <TimelineText $completed={releaseData && releaseData.release_id}>Released</TimelineText>
            <TimelineTime $completed={releaseData && releaseData.release_id} $active={!releaseData}>
              {releaseData && releaseData.release_id ? formatDate(releaseData.created_at) : 'Pending'}
            </TimelineTime>
          </TimelineContent>
        </TimelineItemRow>
        </TimelineContainer>
      </SidebarSection>

      <QrSection>
        <h3>Scan</h3>
        <QrContainer>
          <QrImageBox>
            <QRCodeSVG
              value={profileUrl || (deceasedId || 'NO-ID')}
              size={136}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor={C.black}
            />
            <QrId>{deceasedId || '—'}</QrId>
          </QrImageBox>
        </QrContainer>
      </QrSection>

    </SidebarCard>
  );
};

export default DeceasedSidebar;