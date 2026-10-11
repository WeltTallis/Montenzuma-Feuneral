import React, { useEffect, useState } from 'react';
import { insuranceApi } from '../../../api/insuranceApi';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

export default function MemberDrawer({ member, onClose }) {
  const [sendingSms, setSendingSms] = useState(false);
  const [smsMsg, setSmsMsg] = useState(null);

  useEffect(() => {
    if (!member) return undefined;
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [member, onClose]);

  if (!member) return null;

  const handleSendLink = async () => {
    if (!member.policyNumber) return;
    setSendingSms(true);
    setSmsMsg(null);
    try {
      await insuranceApi.sendPolicySms(member.policyNumber, {
        phone: member.phone,
        type: 'monthly_payment',
      });
      setSmsMsg({ type: 'success', text: `Payment link SMS sent to ${member.phone}!` });
    } catch (err) {
      setSmsMsg({ type: 'error', text: err?.message || 'Could not send SMS.' });
    } finally {
      setSendingSms(false);
    }
  };

  const facts = [
    ['Policy number', member.policyNumber],
    ['Phone', member.phone],
    ['Cover type', member.coverType],
    ['People covered', member.coveredCount],
    ['Status', member.status],
    ['Member since', member.createdAt ? new Date(member.createdAt).toLocaleDateString() : null]
  ];

  return (
    <div className="insdash-drawer-layer" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="insdash-drawer" aria-label={`${member.fullName || 'Member'} profile`}>
        <div className="insdash-drawer-top">
          <span className="insdash-drawer-tag">MEMBER PROFILE</span>
          <button onClick={onClose} aria-label="Close profile">×</button>
        </div>
        <div className="insdash-profile">
          <span className="insdash-avatar insdash-avatar-large">{initials(member.fullName)}</span>
          <h2>{member.fullName || 'Unnamed member'}</h2>
          <p>{member.policyNumber || 'Policy number unavailable'}</p>
          <span className={`insdash-status insdash-status-${String(member.status || 'unknown').toLowerCase()}`}>
            {member.status || 'Unknown'}
          </span>
        </div>
        <div className="insdash-drawer-section">
          <p className="insdash-eyebrow">COVER DETAILS</p>
          {facts.map(([label, value]) => (
            <div className="insdash-fact" key={label}>
              <span>{label}</span>
              <b>{value || '—'}</b>
            </div>
          ))}
        </div>
        <div className="insdash-drawer-note">
          <b>Monthly Payment Link (SMS)</b>
          <p>Send an instant M-Pesa payment link SMS directly to {member.fullName || 'this member'} for their monthly insurance contribution.</p>
          {smsMsg && (
            <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: smsMsg.type === 'success' ? '#e8f5e9' : '#ffebee', color: smsMsg.type === 'success' ? '#1b5e20' : '#c62828' }}>
              {smsMsg.text}
            </div>
          )}
          <button
            type="button"
            className="insdash-button insdash-button-dark"
            style={{ marginTop: '10px', width: '100%', justifyContent: 'center', cursor: 'pointer' }}
            onClick={handleSendLink}
            disabled={sendingSms}
          >
            {sendingSms ? 'Sending SMS…' : '📱 Send Monthly Payment Link (SMS)'}
          </button>
        </div>
        {member.paymentLink && (
          <a className="insdash-button insdash-button-dark insdash-payment-link" href={member.paymentLink} target="_blank" rel="noreferrer">
            Open payment link ↗
          </a>
        )}
      </aside>
    </div>
  );
}





