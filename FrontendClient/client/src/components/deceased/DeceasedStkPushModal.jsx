import React, { useState } from 'react';
import api from '../../api/axios';
import { getTenantSlug } from '../../utils/globalAuth';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 12000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(15, 23, 42, .58)',
};

const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 7,
  fontSize: 14,
  boxSizing: 'border-box',
};

const DeceasedStkPushModal = ({ deceased, nextOfKin, onClose }) => {
  const admissionNumber = deceased?.admission_number || deceased?.admission_no || '';
  const deceasedId = deceased?.deceased_id || deceased?.deceasedId || deceased?.id || '';
  const initialKinName = nextOfKin?.full_name || nextOfKin?.name ||
    deceased?.contact_person || deceased?.next_of_kin_name || '';
  const initialPhone = nextOfKin?.contact || nextOfKin?.phone_number ||
    deceased?.phone_number || deceased?.tel_number || '';
  const [kinName, setKinName] = useState(initialKinName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const amountValue = Number(amount);
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!deceasedId) return setError('This deceased record is missing its ID.');
    if (!admissionNumber) return setError('This deceased record is missing its admission number.');
    if (!kinName.trim()) return setError('Enter the next-of-kin name.');
    if (!/^(?:\+?254|0)[17]\d{8}$/.test(cleanPhone)) return setError('Enter a valid Kenyan M-Pesa phone number.');
    if (!Number.isFinite(amountValue) || amountValue < 1) return setError('Enter a payment amount of at least KES 1.');

    setBusy(true);
    try {
      const response = await api.post('/mpesa/stkpush', {
        amount: String(Math.round(amountValue)),
        phoneNumber: cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.startsWith('0') ? `254${cleanPhone.slice(1)}` : cleanPhone,
        accountReference: admissionNumber.slice(0, 12),
        transactionDesc: `Payment ${admissionNumber}`.slice(0, 30),
        deceasedId: String(deceasedId),
        admissionNumber: String(admissionNumber),
        payerName: kinName.trim(),
        tenantSlug: getTenantSlug() || localStorage.getItem('tenantSlug') || '',
      });
      const result = response.data || {};
      if (result.ResponseCode && result.ResponseCode !== '0') {
        throw new Error(result.ResponseDescription || result.CustomerMessage || 'M-Pesa did not accept the STK request.');
      }
      setMessage(result.CustomerMessage || 'STK push sent. The payment will appear on this deceased record after M-Pesa confirms it.');
    } catch (requestError) {
      console.error('[Deceased STK] Failed to initiate payment:', requestError?.response?.data || requestError);
      setError(requestError?.response?.data?.error || requestError?.response?.data?.message || requestError.message || 'Could not send the STK push.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} role="presentation" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="deceased-stk-title" style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 id="deceased-stk-title" style={{ margin: 0, fontSize: 21 }}>Send M-Pesa STK Push</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>Payment is linked to this deceased record after M-Pesa confirms it.</p>
          </div>
          <button type="button" aria-label="Close" disabled={busy} onClick={onClose} style={{ border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        {message ? (
          <div role="status" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: 14, borderRadius: 8 }}>
            <strong>{message}</strong>
            <p style={{ margin: '12px 0 0', fontSize: 13 }}>Admission number: {admissionNumber} · Payer: {kinName.trim()}</p>
            <button type="button" onClick={onClose} style={{ ...fieldStyle, marginTop: 16, border: 0, background: '#047857', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Deceased
              <input style={{ ...fieldStyle, background: '#f8fafc' }} value={deceased?.full_name || deceased?.name || '—'} readOnly />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Admission number
              <input style={{ ...fieldStyle, background: '#f8fafc' }} value={admissionNumber} readOnly />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Kin name
              <input style={fieldStyle} value={kinName} onChange={event => setKinName(event.target.value)} required autoComplete="name" />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Kin M-Pesa phone number
              <input style={fieldStyle} type="tel" inputMode="tel" placeholder="0712 345 678" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} required autoComplete="tel" />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Payment amount (KES)
              <input style={fieldStyle} type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} required />
            </label>
            {error && <div role="alert" style={{ padding: 11, color: '#991b1b', background: '#fef2f2', borderRadius: 7, fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" disabled={busy} onClick={onClose} style={{ ...fieldStyle, width: 'auto', cursor: 'pointer', background: '#fff' }}>Cancel</button>
              <button type="submit" disabled={busy} style={{ ...fieldStyle, width: 'auto', minWidth: 140, cursor: busy ? 'wait' : 'pointer', border: 0, background: '#047857', color: '#fff', fontWeight: 700 }}>{busy ? 'Sending…' : 'Send STK Push'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default DeceasedStkPushModal;