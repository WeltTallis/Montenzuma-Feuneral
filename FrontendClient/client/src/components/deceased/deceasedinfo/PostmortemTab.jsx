import React, { useCallback, useEffect, useState } from 'react';
import { getTenantSlug } from '../../../utils/globalAuth';
import { getTenantHeaders } from '../../../api/endpoints';
import { showToast } from '../../../utils/toast';
import { useNavigate } from 'react-router-dom';
import env from '../../../utils/config/env';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import axios from 'axios';


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

// --- Postmortem request tracking (before the official examination exists) ---
const RequestCard = styled.div`
  border: 1px solid ${C.borderLight || '#e0e0e0'};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #ffffff;
`;

const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  ${p => p.$status === 'sent' && `background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;`}
  ${p => p.$status === 'initiated' && `background: #fef3c7; color: #92400e; border: 1px solid #fde68a;`}
  ${p => p.$status === 'cancelled' && `background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; text-decoration: line-through;`}
`;

const RequestMeta = styled.div`
  font-size: 12px;
  color: ${C.gray};
  margin-top: 4px;
  line-height: 1.6;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FormGroup = styled.div`
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${C.gray};
`;

const FormInput = styled.input`
  height: 40px;
  width: 100%;
  border: 1px solid ${C.border || '#e0e0e0'};
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 14px;
  color: ${C.dark || '#1a1a1a'};
  background: #ffffff;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${C.black};
  }
`;

const EmptyNote = styled.p`
  font-size: 13px;
  color: ${C.gray};
  margin: 0 0 16px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const StatBox = styled.div`
  flex: 1;
  min-width: 150px;
  border: 1px solid ${C.borderLight || '#e0e0e0'};
  border-left: 3px solid ${p => p.$accent || C.black};
  border-radius: 4px;
  padding: 12px 16px;
  background: #fafaf9;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${C.black};
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${C.gray};
  margin-top: 4px;
`;

const PostmortemTab = ({ postmortem, deceasedId, requests: requestsProp, onRequestsChanged }) => {
  const navigate = useNavigate();
  const pm = postmortem || {};
  const tenantSlug = getTenantSlug();

  // Self-managed request tracking - fetches its own data unless a parent
  // supplies the `requests` prop explicitly.
  const [ownRequests, setOwnRequests] = useState([]);
  // Prefer the parent's copy when it has data; otherwise fall back to our own
  // fetch — the request list can never blank out because of a parent hiccup.
  const visibleRequests =
    requestsProp && requestsProp.length > 0 ? requestsProp
      : ownRequests.length > 0 ? ownRequests
        : (requestsProp || ownRequests);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [actingRequestId, setActingRequestId] = useState(null);
  const [requestForm, setRequestForm] = useState({
    reason: '',
    requested_by: '',
    requesting_authority: ''
  });

  // Tenant-wide postmortem analytics (requested vs carried out)
  const [stats, setStats] = useState(null);
  const loadStats = useCallback(() => {
    return axios.get(`${env.FULL_API_URL}/postmortem-requests/stats`, { headers: getTenantHeaders() })
      .then((res) => { if (res.data?.success) setStats(res.data.data || null); })
      .catch(() => { /* stats are optional */ });
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const loadRequests = useCallback(async () => {
    if (!deceasedId) return;
    try {
      const res = await axios.get(`${env.FULL_API_URL}/postmortem-requests`, {
        headers: getTenantHeaders(),
        params: { deceased_id: deceasedId },
      });
      if (Array.isArray(res.data?.data)) setOwnRequests(res.data.data);
    } catch (e) { /* no tracked requests yet */ }
  }, [deceasedId]);

  // Always self-load as well — belt & suspenders alongside the parent's copy.
  useEffect(() => { loadRequests(); }, [loadRequests]);

  const openRequestForm = () => {
    // Prefill "Requested By" with the signed-in user so every request card,
    // notification and audit entry shows WHO requested the postmortem.
    let defaultBy = '';
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      defaultBy = [u.first_name, u.last_name].filter(Boolean).join(' ')
        || u.full_name || u.name || u.username || u.email || '';
    } catch { /* no user record */ }
    setRequestForm((f) => ({ ...f, requested_by: f.requested_by || defaultBy }));
    setShowRequestForm(true);
  };

  const refreshRequests = async () => {
    try { if (onRequestsChanged) await onRequestsChanged(); } catch { /* parent refresh optional */ }
    await Promise.all([loadRequests(), loadStats()]);
  };

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

  // --- Tracked request actions (before the official examination exists) ---
  const initiateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.reason || !requestForm.requested_by) {
      showToast.error('Requested-by and reason are required');
      return;
    }
    setSubmittingRequest(true);
    try {
      const res = await axios.post(
        `${env.FULL_API_URL}/postmortem-requests`,
        { deceased_id: deceasedId, ...requestForm },
        { headers: getTenantHeaders() }
      );
      if (res.data?.success) {
        showToast.success('Postmortem request initiated');
        setShowRequestForm(false);
        setRequestForm({ reason: '', requested_by: '', requesting_authority: '' });
        await refreshRequests();
      } else {
        throw new Error(res.data?.message || 'Failed to initiate request');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || err.message || 'Failed to initiate postmortem request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const sendRequest = async (id) => {
    setActingRequestId(id);
    try {
      const res = await axios.post(
        `${env.FULL_API_URL}/postmortem-requests/${id}/send`,
        {},
        { headers: getTenantHeaders() }
      );
      if (res.data?.success) {
        showToast.success('Marked as sent - postmortem is now pending');
        await refreshRequests();
      } else {
        throw new Error(res.data?.message || 'Failed to send request');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || err.message || 'Failed to send postmortem request');
    } finally {
      setActingRequestId(null);
    }
  };

  const cancelRequest = async (id) => {
    setActingRequestId(id);
    try {
      const res = await axios.put(
        `${env.FULL_API_URL}/postmortem-requests/${id}/status`,
        { status: 'cancelled' },
        { headers: getTenantHeaders() }
      );
      if (res.data?.success) {
        showToast.success('Postmortem request cancelled');
        await refreshRequests();
      } else {
        throw new Error(res.data?.message || 'Failed to cancel request');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || err.message || 'Failed to cancel postmortem request');
    } finally {
      setActingRequestId(null);
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

      {/* --- 00: Pre-examination request tracking --- */}
      <SectionHead $mt0><span>00</span> Postmortem Requests</SectionHead>

      {stats && (
        <StatsRow>
          <StatBox $accent="#d97706">
            <StatValue>{stats.initiated ?? 0}</StatValue>
            <StatLabel>Requested Now</StatLabel>
          </StatBox>
          <StatBox $accent="#2563eb">
            <StatValue>{stats.sent ?? 0}</StatValue>
            <StatLabel>Sent · Awaiting Exam</StatLabel>
          </StatBox>
          <StatBox $accent="#7c3aed">
            <StatValue>{stats.official_completed ?? 0}</StatValue>
            <StatLabel>Completed Exams</StatLabel>
          </StatBox>
          <StatBox $accent="#6b7280">
            <StatValue>{stats.cancelled ?? 0}</StatValue>
            <StatLabel>Cancelled</StatLabel>
          </StatBox>
        </StatsRow>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <EmptyNote style={{ marginBottom: 0 }}>
          Track who requested a postmortem before the official examination is carried out.
        </EmptyNote>
        {!showRequestForm && (
          <Btn onClick={openRequestForm}>+ Initiate Request</Btn>
        )}
      </div>

      {showRequestForm && (
        <form
          onSubmit={initiateRequest}
          style={{ border: `1px solid ${C.borderLight || '#e0e0e0'}`, borderRadius: 4, padding: 16, marginBottom: 20 }}
        >
          <FormRow>
            <FormGroup>
              <FormLabel>Requested By *</FormLabel>
              <FormInput
                value={requestForm.requested_by}
                onChange={(e) => setRequestForm({ ...requestForm, requested_by: e.target.value })}
                placeholder="e.g. Jane Wambui (Family)"
                required
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Requesting Authority</FormLabel>
              <FormInput
                value={requestForm.requesting_authority}
                onChange={(e) => setRequestForm({ ...requestForm, requesting_authority: e.target.value })}
                placeholder="e.g. Kenyatta National Hospital"
              />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup style={{ flex: 2 }}>
              <FormLabel>Reason *</FormLabel>
              <FormInput
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                placeholder="Why is the postmortem being requested?"
                required
              />
            </FormGroup>
          </FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Btn type="button" onClick={() => setShowRequestForm(false)}>Cancel</Btn>
            <Btn $primary type="submit" disabled={submittingRequest}>
              {submittingRequest ? 'Initiating...' : 'Initiate Request'}
            </Btn>
          </div>
        </form>
      )}

      {visibleRequests.length === 0 && !showRequestForm ? (
        <EmptyNote>No postmortem requests tracked yet.</EmptyNote>
      ) : (
        visibleRequests.map((r) => (
          <RequestCard key={r.id}>
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{r.request_ref || r.requested_by}</strong>
                <StatusChip $status={r.status}>{r.status}</StatusChip>
              </div>
              <RequestMeta>
                Requested by <strong>{r.requested_by || '—'}</strong>
                {r.requesting_authority ? <> · Authority: {r.requesting_authority}</> : null}
                <br />
                Reason: {r.reason || '—'}
                <br />
                Initiated {formatDate(r.created_at)}
                {r.sent_at ? ` · Sent ${formatDate(r.sent_at)}` : ''}
              </RequestMeta>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {r.status === 'initiated' && (
                <>
                  <Btn $primary onClick={() => sendRequest(r.id)} disabled={actingRequestId === r.id}>
                    {actingRequestId === r.id ? 'Sending...' : 'Mark as Sent'}
                  </Btn>
                  <Btn onClick={() => cancelRequest(r.id)} disabled={actingRequestId === r.id}>Cancel</Btn>
                </>
              )}
              {r.status === 'sent' && (
                <span style={{ fontSize: 12, color: C.gray }}>Sent to authority · awaiting examination</span>
              )}
            </div>
          </RequestCard>
        ))
      )}

      <SectionHead $primary><span>01</span> Official Determination of Death</SectionHead>
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