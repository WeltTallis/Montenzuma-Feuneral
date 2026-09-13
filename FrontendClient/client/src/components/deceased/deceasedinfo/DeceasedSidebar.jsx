import React from 'react';
import styled from 'styled-components';
import { C, getInitials, getDaysInMorgue, formatDate } from './theme';

const SidebarCard = styled.div`
  background: white; border: 1px solid ${C.borderLight}; border-radius: 8px;
  padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky; top: 24px;
  @media (max-width: 900px) { position: static; }
`;

const SidebarHeader = styled.div`
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
  border-bottom: 1px solid ${C.borderLight}; padding-bottom: 16px;
`;

const AvatarLg = styled.div`
  width: 60px; height: 60px; border-radius: 50%; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 24px; flex-shrink: 0;
  font-family: 'Merriweather', serif;
  background: ${p => p.$female ? C.brown : C.black};
`;

const SidebarName = styled.div`
  font-family: 'Merriweather', serif; font-size: 18px; font-weight: 700; color: ${C.black};
`;
const SidebarMeta = styled.div`font-size: 12px; color: ${C.gray}; margin-top: 4px;`;

const StatGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: ${C.borderLight}; border: 1px solid ${C.borderLight};
  border-radius: 8px; overflow: hidden; margin-bottom: 24px;
`;

const StatBox = styled.div`background: white; padding: 12px 8px; text-align: center;`;
const StatValue = styled.div`
  font-size: 16px; font-weight: 700; color: ${p => p.$color || C.black};
`;
const StatLabel = styled.div`
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: ${C.gray}; margin-top: 4px;
`;

const ChargeRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px dashed ${C.borderLight}; font-size: 13px;
  color: ${C.mid};
  &:last-child { border-bottom: none; }
  strong { color: ${p => (p.$highlight ? C.danger : C.black)}; font-weight: 700; }
`;
const ChargeNote = styled.p`
  font-size: 11px; color: ${C.gray}; margin: 10px 0 0; line-height: 1.5;
`;

const SidebarSection = styled.div`
  margin-bottom: 24px;
  h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${C.black}; margin-bottom: 12px; letter-spacing: 0.05em; }
`;

const NotifItem = styled.div`
  display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${C.borderLight};
  &:last-child { border-bottom: none; }
`;
const NotifIcon = styled.div`
  width: 28px; height: 28px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 14px; font-weight: bold;
  background: ${p => p.$warning ? C.warningBg : C.infoBg};
  color: ${p => p.$warning ? C.warning : C.info};
`;
const NotifText = styled.div`font-size: 12px; color: ${C.mid}; line-height: 1.4;`;
const NotifTime = styled.div`font-size: 10px; color: ${C.lightGray}; margin-top: 2px;`;

const TimelineItem = styled.div`
  display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;
  padding: 12px;
  background: ${p => p.$completed ? 'rgba(16, 185, 129, 0.08)' : p.$active ? 'rgba(251, 191, 36, 0.08)' : '#f9fafb'};
  border-radius: 8px;
  border-left: 3px solid ${p => p.$completed ? '#10b981' : p.$active ? '#fbbf24' : '#e5e7eb'};
  transition: all 0.2s ease;
`;
const TimelineDot = styled.div`
  width: 14px; height: 14px; border-radius: 50%; margin-top: 3px; flex-shrink: 0;
  background: ${p => p.$done ? '#10b981' : p.$active ? '#fbbf24' : '#d1d5db'};
  box-shadow: ${p => p.$done ? '0 0 8px rgba(16, 185, 129, 0.6)' : p.$active ? '0 0 8px rgba(251, 191, 36, 0.6)' : 'none'};
  border: ${p => p.$done ? '2px solid #06b6d4' : p.$active ? '2px solid #f59e0b' : '2px solid #e5e7eb'};
`;
const TimelineText = styled.div`
  font-size: 13px; font-weight: 700; color: ${p => p.$muted ? C.gray : C.black};
  ${p => p.$completed && 'color: #10b981;'}
  ${p => p.$active && 'color: #f59e0b;'}
`;
const TimelineTime = styled.div`
  font-size: 11px; color: ${C.gray};
  font-weight: 600;
  ${p => p.$completed && 'color: #10b981;'}
  ${p => p.$active && 'color: #f59e0b;'}
`;

const DeceasedSidebar = ({ deceased, postmortem, bodyStatus, totalCharges, totalPaid = 0, balance = 0, age }) => {
  const name = deceased?.full_name || deceased?.name || 'Unknown';
  const sex = deceased?.sex || deceased?.gender || '';
  const isFemale = sex.toLowerCase() === 'female';
  const daysInMorgue = getDaysInMorgue(deceased?.date_admitted || deceased?.admission_date || deceased?.created_at);
  const documentCount = Array.isArray(deceased?.documents) ? deceased.documents.length : 0;
  const releaseData = deceased?.releaseData || null;
  
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

  return (
    <SidebarCard>
      <SidebarHeader>
        <AvatarLg $female={isFemale}>{getInitials(name)}</AvatarLg>
        <div>
          <SidebarName>{name}</SidebarName>
          <SidebarMeta>{sex ? `${sex}, ` : ''}{age ? `${age} Years` : ''}</SidebarMeta>
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
          <strong style={{ 
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: '700',
            fontSize: '12px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: paymentStatus === 'Done' ? 'white' : paymentStatus === 'Not Recorded' ? '#666' : 'white',
            backgroundColor: paymentStatus === 'Done' ? '#10b981' : paymentStatus === 'Not Recorded' ? '#f3f4f6' : '#f59e0b',
            boxShadow: paymentStatus === 'Done' ? '0 0 8px rgba(16, 185, 129, 0.4)' : paymentStatus === 'Not Recorded' ? 'none' : '0 0 8px rgba(245, 158, 11, 0.4)'
          }}>
            {paymentStatus === 'Done' && '✓ '}{paymentStatus}
          </strong>
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
          <strong style={{ 
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: '700',
            fontSize: '12px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: bodyStatus === 'Released' ? 'white' : 'white',
            backgroundColor: bodyStatus === 'Released' ? '#10b981' : '#f59e0b',
            boxShadow: bodyStatus === 'Released' ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(245, 158, 11, 0.4)'
          }}>
            {bodyStatus === 'Released' && '✓ '}{bodyStatus === 'In Morgue' || bodyStatus === 'Active' ? 'In Storage' : 'Released'}
          </strong>
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
        <TimelineItem $completed>
          <TimelineDot $done />
          <div>
            <TimelineText $completed>Admitted to Morgue</TimelineText>
            <TimelineTime $completed>{formatDate(deceased?.created_at)}</TimelineTime>
          </div>
        </TimelineItem>
        <TimelineItem $completed={deceased?.embalmed} $active={!deceased?.embalmed}>
          <TimelineDot $done={deceased?.embalmed} $active={!deceased?.embalmed} />
          <div>
            <TimelineText $completed={deceased?.embalmed} $active={!deceased?.embalmed}>{deceased?.embalmed ? '✓ Embalmed' : 'Body Awaiting Embalming'}</TimelineText>
            <TimelineTime $completed={deceased?.embalmed} $active={!deceased?.embalmed}>{deceased?.embalmed ? formatDate(deceased?.embalmed_date) : 'Pending'}</TimelineTime>
          </div>
        </TimelineItem>
        <TimelineItem $completed={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'}>
          <TimelineDot $done={postmortem?.status === 'completed'} $active={postmortem?.status === 'pending' || postmortem?.status === 'in_progress'} />
          <div>
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
          </div>
        </TimelineItem>
        <TimelineItem $completed={releaseData && releaseData.release_id} $active={bodyStatus === 'In Morgue' || bodyStatus === 'Active'}>
          <TimelineDot $active={bodyStatus === 'In Morgue' || bodyStatus === 'Active'} $done={releaseData && releaseData.release_id} />
          <div>
            <TimelineText $completed={releaseData && releaseData.release_id}>{releaseData && releaseData.release_id ? '✓ Body Released' : 'In Storage (' + (bodyStatus || 'Normal') + ')'}</TimelineText>
            <TimelineTime $completed={releaseData && releaseData.release_id} $active={!releaseData && (bodyStatus === 'In Morgue' || bodyStatus === 'Active')}>{releaseData && releaseData.release_id ? 'Complete' : 'Currently Active'}</TimelineTime>
          </div>
        </TimelineItem>
        <TimelineItem $completed={releaseData && releaseData.release_id} $active={!releaseData}>
          <TimelineDot $done={releaseData && releaseData.release_id} $active={!releaseData} />
          <div>
            <TimelineText $completed={releaseData && releaseData.release_id}>{releaseData && releaseData.release_id ? '✓ Released to Family' : 'Released to Family'}</TimelineText>
            <TimelineTime $completed={releaseData && releaseData.release_id} $active={!releaseData}>
              {releaseData && releaseData.release_id ? `${formatDate(releaseData.created_at)}` : 'Pending'}
            </TimelineTime>
          </div>
        </TimelineItem>
      </SidebarSection>
    </SidebarCard>
  );
};

export default DeceasedSidebar;