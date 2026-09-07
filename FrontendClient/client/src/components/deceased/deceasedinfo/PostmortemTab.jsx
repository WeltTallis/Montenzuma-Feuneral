import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../../../utils/context/socketContext';
import { getTenantSlug } from '../../../utils/globalAuth';
import { getTenantHeaders } from '../../../api/endpoints';
import { showToast } from '../../../utils/toast';

import { useNavigate } from 'react-router-dom';
import env from '../../../utils/config/env';
import notify from '../../../utils/notify';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import axios from 'axios';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';

/* -- Minimized styling, matching OverviewTab -- */
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
  ${p => p.$body && 'font-weight: 400; line-height: 1.6; font-size: 13px; color: #555;'}
`;

const Btn = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid ${C.border || '#e0e0e0'};
  background: white;
  color: ${C.dark || '#1a1a1a'};
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
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

const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  ${p => p.$status === 'sent' && `background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;`}
  ${p => p.$status === 'initiated' && `background: #fef3c7; color: #92400e; border: 1px solid #fde68a;`}
  ${p => p.$status === 'cancelled' && `background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; text-decoration: line-through;`}
`;

const EmptyNote = styled.p`
  font-size: 12px;
  color: ${C.gray};
  margin: 0 0 12px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const FormGroup = styled.div`
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FormLabel = styled.label`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`;

const FormInput = styled.input`
  height: 34px;
  width: 100%;
  border: 1px solid ${C.border || '#e0e0e0'};
  border-radius: 4px;
  padding: 0 10px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${C.dark || '#1a1a1a'};
  background: #ffffff;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${C.black};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  border: 1px solid ${C.border || '#e0e0e0'};
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${C.dark || '#1a1a1a'};
  background: #ffffff;
  box-sizing: border-box;
  resize: vertical;
  min-height: 56px;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${C.black};
  }
`;

/* ── Request modal (matches the FinancialsTab modal pattern) ── */
const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`;
const ModalCard = styled.div`
  background: #fff; border-radius: 8px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${C.borderLight};
  font-size: 16px; font-weight: 700; color: ${C.black};
`;
const ModalBody = styled.div` padding: 20px; `;
const ModalFoot = styled.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${C.borderLight};
`;
const CloseBtn = styled.button`
  background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: ${C.gray};
  &:hover { color: ${C.black}; }
`;
const ModalContext = styled.div`
  font-size: 12px; color: ${C.gray}; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 1px dashed ${C.borderLight};
  b { color: ${C.black}; }
`;
const ModalHint = styled.p`
  font-size: 11px; color: ${C.gray}; margin: 2px 0 0; line-height: 1.5;
`;

/* Plain inline stat — no boxes, matching the minimized look */
const StatLine = ({ label, value, color }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
    <b style={{ fontSize: 14, color: color || C.black, fontWeight: 700 }}>{value}</b>
    <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', fontWeight: 700 }}>{label}</span>
  </span>
);

const PostmortemTab = ({ postmortem, deceasedId, deceasedName, deceasedAdmission, requests: requestsProp, onRequestsChanged }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const pm = postmortem || {};
  const tenantSlug = getTenantSlug();

  // Self-managed request tracking - fetches its own data unless a parent
  // supplies the `requests` prop explicitly.
  const [ownRequests, setOwnRequests] = useState([]);
  // Prefer the parent's copy when it has data; otherwise fall back to our own
  // fetch - the request list can never blank out because of a parent hiccup.
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
    requesting_authority: '',
    notes: ''
  });

  // Examiner-signature pad (same ReusableSignaturePad the deceased intake uses)
  const sigPadRef = useRef(null);
  const [newSignature, setNewSignature] = useState(null);
  const [savingSignature, setSavingSignature] = useState(false);

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

  // Always self-load as well - belt & suspenders alongside the parent's copy.
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

  const hasData = pm.immediate_cause_of_death || pm.manner_of_death || pm.examination_summary || pm.findings || pm.signature || pm.toxicology_findings;

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

  // ─── Examiner signature — renders the saved one + lets the officer capture/
  // update it right here, with the same signature pad the deceased intake uses.
  const signatureSrc = (() => {
    const sig = pm.signature || pm.signature_base64;
    if (!sig) return null;
    if (String(sig).startsWith('data:image') || /^https?:\/\//.test(String(sig))) return String(sig);
    if (String(sig).startsWith('/')) return `${env.API_GATEWAY_URL}${sig}`;
    // Plain base64 (older rows) → render as PNG data-URL
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(String(sig))) return `data:image/png;base64,${sig}`;
    return String(sig);
  })();

  const saveSignature = async () => {
    if (!pm?.id || !newSignature) { showToast.warning('Draw the examiner signature first.'); return; }
    setSavingSignature(true);
    try {
      const res = await axios.put(`${env.FULL_API_URL}/postmortem/${pm.id}`, { signature: newSignature }, { headers: getTenantHeaders() });
      if (res.data?.success) {
        showToast.success('Examiner signature saved');
        setNewSignature(null);
        sigPadRef.current?.clear();
        if (typeof onRequestsChanged === 'function') await onRequestsChanged();
      } else {
        throw new Error(res.data?.message || 'Failed to save signature');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || err.message || 'Failed to save signature');
    } finally {
      setSavingSignature(false);
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
        // Build the notification payload for the global bell
        const notifData = {
          id: res.data?.data?.id || `pm-request-${Date.now()}`,
          title: 'Postmortem Request Initiated',
          message: `Requested by ${requestForm.requested_by} for ${deceasedName || 'deceased'}`,
          fullContent: [
            `Deceased: ${deceasedName || 'Unknown'}`,
            `Admission No: ${deceasedAdmission || 'N/A'}`,
            `Requested By: ${requestForm.requested_by}`,
            requestForm.requesting_authority && `Authority: ${requestForm.requesting_authority}`,
            `Reason: ${requestForm.reason}`,
            requestForm.notes && `Notes: ${requestForm.notes}`,
          ].filter(Boolean).join('\n'),
          timestamp: new Date().toISOString(),
          priority: 'high',
          deceasedName,
          deceasedId,
          admissionNo: deceasedAdmission,
          requestedBy: requestForm.requested_by,
          reason: requestForm.reason,
        };

        // Emit to global notifications bell via socket
        if (socket) {
          socket.emit('postmortem-request-created', notifData);
        }

        // Rich toast popup with full details
        notify.success(
          'Postmortem Request Initiated',
          [
            `Who: ${requestForm.requested_by}`,
            `Deceased: ${deceasedName || 'Unknown'}`,
            `Admission: ${deceasedAdmission || 'N/A'}`,
          ].join(' · '),
          { dur: 6000 }
        );

        setShowRequestForm(false);
        setRequestForm({ reason: '', requested_by: '', requesting_authority: '', notes: '' });
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
      {/* 01 — Postmortem Requests */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <SectionHead $mt0 style={{ marginBottom: 0 }}><span>01</span> Postmortem Requests</SectionHead>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasData && <Btn onClick={openForm}>Edit Examination</Btn>}
          <Btn onClick={openForm}>{hasData ? '+ New Examination' : '+ Fill Examination Form'}</Btn>
          <Btn $primary onClick={openRequestForm}>+ Initiate Request</Btn>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '10px 0 14px' }}>
          <StatLine label="Requested" value={stats.initiated ?? 0} color="#d97706" />
          <StatLine label="Sent" value={stats.sent ?? 0} color="#2563eb" />
          <StatLine label="Completed" value={stats.official_completed ?? 0} color="#7c3aed" />
          <StatLine label="Cancelled" value={stats.cancelled ?? 0} color="#9ca3af" />
        </div>
      )}

      {showRequestForm && (
        <ModalOverlay onClick={() => setShowRequestForm(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <span>Initiate Postmortem Request</span>
              <CloseBtn onClick={() => setShowRequestForm(false)}>×</CloseBtn>
            </ModalHead>
            <form onSubmit={initiateRequest}>
              <ModalBody>
                <ModalContext>
                  Deceased record: <b>{deceasedName || `#${deceasedId}`}</b>
                </ModalContext>
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
                      list="pm-request-authorities"
                    />
                    <datalist id="pm-request-authorities">
                      <option value="Kenya Police" />
                      <option value="Directorate of Criminal Investigations (DCI)" />
                      <option value="Court Order" />
                      <option value="Hospital / Referring Facility" />
                      <option value="Family Request" />
                    </datalist>
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <FormLabel>Reason *</FormLabel>
                    <FormTextarea
                      rows={3}
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                      placeholder="Why is the postmortem being requested? (e.g. unclear cause of death, legal requirement, family request)"
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormTextarea
                      rows={2}
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                      placeholder="Optional notes — contact details, special instructions, deadlines..."
                    />
                  </FormGroup>
                </FormRow>
                <ModalHint>
                  Initiating creates a tracked request (status: initiated), marks the body as
                  "Postmortem Requested" and notifies the mortuary team. Use "Mark as Sent" once
                  the request reaches the requesting authority.
                </ModalHint>
              </ModalBody>
              <ModalFoot>
                <Btn type="button" onClick={() => setShowRequestForm(false)}>Cancel</Btn>
                <Btn $primary type="submit" disabled={submittingRequest}>
                  {submittingRequest ? 'Initiating...' : 'Initiate Request'}
                </Btn>
              </ModalFoot>
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {visibleRequests.length === 0 ? (
        <EmptyNote>No postmortem requests tracked yet.</EmptyNote>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {visibleRequests.map((r) => (
            <div
              key={r.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.borderLight || '#eeeceb'}`, flexWrap: 'wrap' }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.black }}>{r.request_ref || r.requested_by}</span>
                  <StatusChip $status={r.status}>{r.status}</StatusChip>
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 3, lineHeight: 1.6 }}>
                  Requested by <b>{r.requested_by || '—'}</b>
                  {r.requesting_authority ? <> · Authority: {r.requesting_authority}</> : null}
                  <br />
                  Reason: {r.reason || '—'} · Initiated {formatDate(r.created_at)}
                  {r.sent_at ? ` · Sent ${formatDate(r.sent_at)}` : ''}
                </div>
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
                  <span style={{ fontSize: 11, color: C.gray }}>Awaiting examination</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasData ? (
        <div style={{ marginTop: 16, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '18px 20px', background: C.bgSection }}>
          {/* 02 — Official Determination of Death */}
          <SectionHead $mt0><span>02</span> Official Determination of Death</SectionHead>
          <DetailGrid>
            <DetailItem $full><DetailLabel>Immediate Cause of Death</DetailLabel><DetailValue>{pm.immediate_cause_of_death || '—'}</DetailValue></DetailItem>
            <DetailItem $full><DetailLabel>Underlying Cause of Death</DetailLabel><DetailValue>{pm.underlying_cause_of_death || '—'}</DetailValue></DetailItem>
            {pm.manner_of_death && (
              <DetailItem><DetailLabel>Manner of Death</DetailLabel><DetailValue>{pm.manner_of_death}</DetailValue></DetailItem>
            )}
            {pm.contributing_conditions && (
              <DetailItem $full><DetailLabel>Contributing Conditions</DetailLabel><DetailValue>{pm.contributing_conditions}</DetailValue></DetailItem>
            )}
          </DetailGrid>

          {/* 03 — Assessment & Findings */}
          <SectionHead><span>03</span> Assessment &amp; Findings</SectionHead>
          <DetailGrid>
            <DetailItem $full>
              <DetailLabel>Examination Summary</DetailLabel>
              <DetailValue $body>{pm.examination_summary || 'No statement provided.'}</DetailValue>
            </DetailItem>

            {Array.isArray(pm.findings) && pm.findings.length > 0 && pm.findings.map((f, fi) => (
              <DetailItem key={fi}>
                <DetailLabel>{f.title || f.organ_system || `Finding ${fi + 1}`}</DetailLabel>
                <DetailValue $body>{f.description || f.details || JSON.stringify(f)}</DetailValue>
              </DetailItem>
            ))}

            {pm.head_findings && <DetailItem $full><DetailLabel>Head / CNS Findings</DetailLabel><DetailValue $body>{typeof pm.head_findings === 'string' ? pm.head_findings : JSON.stringify(pm.head_findings)}</DetailValue></DetailItem>}
            {pm.chest_findings && <DetailItem $full><DetailLabel>Chest Findings</DetailLabel><DetailValue $body>{typeof pm.chest_findings === 'string' ? pm.chest_findings : JSON.stringify(pm.chest_findings)}</DetailValue></DetailItem>}
            {pm.abdomen_findings && <DetailItem $full><DetailLabel>Abdominal Findings</DetailLabel><DetailValue $body>{typeof pm.abdomen_findings === 'string' ? pm.abdomen_findings : JSON.stringify(pm.abdomen_findings)}</DetailValue></DetailItem>}
            {pm.extremities_findings && <DetailItem $full><DetailLabel>Extremities Findings</DetailLabel><DetailValue $body>{typeof pm.extremities_findings === 'string' ? pm.extremities_findings : JSON.stringify(pm.extremities_findings)}</DetailValue></DetailItem>}
            {pm.toxicology_findings && <DetailItem $full><DetailLabel>Toxicology / Lab Findings</DetailLabel><DetailValue $body>{typeof pm.toxicology_findings === 'string' ? pm.toxicology_findings : JSON.stringify(pm.toxicology_findings)}</DetailValue></DetailItem>}
            {pm.custom_findings && <DetailItem $full><DetailLabel>Other Findings</DetailLabel><DetailValue $body>{typeof pm.custom_findings === 'string' ? pm.custom_findings : JSON.stringify(pm.custom_findings)}</DetailValue></DetailItem>}
          </DetailGrid>

          {/* 04 — Examiner Details */}
       <DetailGrid>
  <DetailItem>
    <DetailLabel>Examining Pathologist</DetailLabel>
    <DetailValue>
      {pm.pathologist_name || pm.external_pathologist_name || '—'}
    </DetailValue>
  </DetailItem>

  <DetailItem>
    <DetailLabel>Status</DetailLabel>
    <DetailValue>
      {pm.status
        ? String(pm.status)
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
        : 'Completed'}
    </DetailValue>
  </DetailItem>

  <DetailItem>
    <DetailLabel>Date Completed</DetailLabel>
    <DetailValue>
      {formatDate(pm.completed_at || pm.updated_at)}
    </DetailValue>
  </DetailItem>

  {pm.requesting_authority && (
    <DetailItem $full>
      <DetailLabel>Requesting Authority</DetailLabel>
      <DetailValue>{pm.requesting_authority}</DetailValue>
    </DetailItem>
  )}
</DetailGrid>

          {/* 05 — Examiner Signature (tab-style, like deceased intake) */}
          <SectionHead><span>05</span> Examiner Signature</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ border: `1px solid ${C.black}`, borderRadius: 8, padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                <span>Signature  Draw below</span>
                {signatureSrc ? <span style={{ color: C.success }}>✓ Signed</span> : <span style={{ color: C.gray }}>Not signed</span>}
              </div>
              <ReusableSignaturePad
                ref={sigPadRef}
                penColor="#0f33e7"
                placeholder="Draw examiner signature"
                onChange={(val) => setNewSignature(typeof val === 'string' ? val : null)}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                <Btn $primary onClick={saveSignature} disabled={savingSignature || !newSignature}>
                  {savingSignature ? 'Saving...' : 'Save Signature'}
                </Btn>
                <Btn onClick={() => { setNewSignature(null); sigPadRef.current?.clear(); }} disabled={!newSignature}>Clear</Btn>
              </div>
            </div>
            <div style={{ border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: 14, background: '#fff' }}>
              <DetailLabel>Current Signature on File</DetailLabel>
              {signatureSrc ? (
                <img src={signatureSrc} alt="Examiner Signature" style={{ maxWidth: '100%', maxHeight: 160, marginTop: 8, border: '1px dashed ' + C.borderLight, borderRadius: 8, padding: 6, background: '#fff', objectFit: 'contain' }} />
              ) : (
                <DetailValue style={{ color: '#999' }}>No signature captured yet.</DetailValue>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <Btn onClick={generatePDF}>Download PDF Report</Btn>
          </div>
        </div>
      ) : (
        <EmptyNote style={{ marginTop: 16 }}>
          No postmortem examination recorded yet.. Use «+ Fill Examination Form» to record the official assessment, or «+ Initiate Request» to track a pre-examination request.
        </EmptyNote>
      )}
    </>
  );
};

export default PostmortemTab;
