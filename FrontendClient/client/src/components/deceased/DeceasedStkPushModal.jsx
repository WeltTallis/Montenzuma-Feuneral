import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';
import { getTenantSlug } from '../../utils/globalAuth';
import './DeceasedStkPushModal.css';

const STATUS_POLL_INTERVAL_MS = 4000;
const MAX_STATUS_POLLS = 75;
const recordKey = record => String(record?.deceased_id || record?.deceasedId || record?.id || '');
const recordAdmission = record => record?.admission_number || record?.admission_no || '';

const deceasedName = record => record?.full_name || record?.name || 'Unnamed deceased';

// Daraja's AccountReference is limited to 12 characters. A request that is not
// attached to a deceased record still needs a unique reference so the payer can
// identify it on their M-Pesa statement.
const generalAccountReference = () => {
  const stamp = Date.now().toString(36).toUpperCase();
  return `GEN${stamp}`.slice(0, 12);
};

const DeceasedStkPushModal = ({ deceased, nextOfKin, onClose }) => {
  // The deceased record is optional. When the modal is opened from a list
  // (no record handed in) the request is sent as a general payment request
  // that is not attached to any deceased account.
  const selectedDeceased = deceased || null;
  const admissionNumber = recordAdmission(selectedDeceased);
  const deceasedId = recordKey(selectedDeceased);
  const initialKinName = nextOfKin?.full_name || nextOfKin?.name ||
    selectedDeceased?.contact_person || selectedDeceased?.next_of_kin_name || '';
  const initialPhone = nextOfKin?.contact || nextOfKin?.phone_number ||
    selectedDeceased?.phone_number || selectedDeceased?.tel_number || '';
  const [kinName, setKinName] = useState(initialKinName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestResult, setRequestResult] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [pollCount, setPollCount] = useState(0);
  const checkoutRequestId = requestResult?.CheckoutRequestID || requestResult?.checkoutRequestID || '';

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (paymentState !== 'pending' || !checkoutRequestId) return undefined;
    let active = true;
    let attempts = 0;
    let timer;
    const checkStatus = async () => {
      attempts += 1;
      if (active) setPollCount(attempts);
      try {
        const response = await api.get(`/mpesa/payment-status/${encodeURIComponent(checkoutRequestId)}`);
        if (!active) return;
        const status = String(response.data?.status || 'pending').toLowerCase();
        setRequestResult(previous => ({ ...previous, ...response.data }));
        if (status === 'paid' || status === 'failed') {
          setPaymentState(status);
          return;
        }
      } catch (statusError) {
        console.warn('[Deceased STK] Status check failed; will retry:', statusError?.response?.data || statusError.message);
      }

      if (active && attempts >= MAX_STATUS_POLLS) {
        if (timer) clearInterval(timer);
        setPaymentState(current => current === 'pending' ? 'delayed' : current);
      }
    };

    timer = setInterval(checkStatus, STATUS_POLL_INTERVAL_MS);
    checkStatus();
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [checkoutRequestId, paymentState]);

  const submit = async event => {
    event.preventDefault();
    setError('');

    const amountValue = Number(amount);
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!kinName.trim()) return setError('Enter the next-of-kin name.');
    if (!/^(?:\+?254|0)[17]\d{8}$/.test(cleanPhone)) return setError('Enter a valid Kenyan M-Pesa phone number, such as 0712 345 678.');
    if (!Number.isFinite(amountValue) || amountValue < 1) return setError('Enter a payment amount of at least KES 1.');

    setRequestResult(null);
    setPollCount(0);
    setPaymentState('starting');
    setBusy(true);
    try {
      // Without a deceased record the request is a general payment request:
      // it still collects the money but it is not credited to any deceased
      // account, so the backend is told to skip the deceased metadata.
      const accountReference = admissionNumber ? admissionNumber.slice(0, 12) : generalAccountReference();
      const transactionDesc = admissionNumber ? `Payment ${admissionNumber}`.slice(0, 30) : 'Payment request';
      const response = await api.post('/mpesa/stkpush', {
        amount: String(Math.round(amountValue)),
        phoneNumber: cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.startsWith('0') ? `254${cleanPhone.slice(1)}` : cleanPhone,
        accountReference,
        transactionDesc,
        deceasedId: deceasedId ? String(deceasedId) : '',
        admissionNumber: admissionNumber ? String(admissionNumber) : '',
        payerName: kinName.trim(),
        tenantSlug: getTenantSlug() || localStorage.getItem('tenantSlug') || '',
      });
      const result = response.data || {};
      if (result.ResponseCode && result.ResponseCode !== '0') {
        throw new Error(result.ResponseDescription || result.CustomerMessage || 'M-Pesa did not accept the STK request.');
      }
      setRequestResult(result);
      setPaymentState(result.CheckoutRequestID || result.checkoutRequestID ? 'pending' : 'delayed');
    } catch (requestError) {
      console.error('[Deceased STK] Failed to initiate payment:', requestError?.response?.data || requestError);
      setError(requestError?.response?.data?.error || requestError?.response?.data?.message || requestError.message || 'Could not send the STK push.');
      setPaymentState('idle');
    } finally {
      setBusy(false);
    }
  };

  // Reset the modal to a fresh form state so the user can correct
  // a wrong phone number / amount and send the STK push again.
  const handleRetry = useCallback(() => {
    setError('');
    setRequestResult(null);
    setPaymentState('idle');
    setPollCount(0);
    setPhoneNumber('');
    setAmount('');
    setBusy(false);
  }, []);

  const displayPhone = phoneNumber || '—';
  const hasDeceased = Boolean(selectedDeceased);
  const displayName = hasDeceased ? deceasedName(selectedDeceased) : 'General payment request';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const formattedAmount = `KES ${Math.round(Number(amount) || 0).toLocaleString('en-KE')}`;
  const statusTitle = paymentState === 'paid' ? 'Payment received' :
    paymentState === 'failed' ? 'Payment not completed' :
      paymentState === 'delayed' ? 'Still waiting for M-Pesa' : 'Waiting for payment';
  const resultDescription = paymentState === 'paid'
    ? (requestResult?.resultDescription || 'M-Pesa confirmed this payment.')
    : paymentState === 'failed'
      ? (requestResult?.resultDescription || requestResult?.ResultDesc || 'The request was cancelled or could not be completed. No payment was recorded.')
      : paymentState === 'delayed'
        ? 'We have not received confirmation yet. Check the payer’s M-Pesa messages before sending another request.'
        : hasDeceased
          ? 'Enter your M-Pesa PIN on the phone. The deceased’s account will only be updated after M-Pesa confirms the payment.'
          : 'Enter your M-Pesa PIN on the phone. The payment is only recorded after M-Pesa confirms it.';

  return (
    <div
      className="deceased-stk-scrim"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section className="deceased-stk-panel" role="dialog" aria-modal="true" aria-labelledby="deceased-stk-title">
        <header className={`deceased-stk-header${paymentState === 'failed' ? ' is-failure' : paymentState === 'delayed' ? ' is-waiting' : ''}`}>
          <div>
            {!requestResult && <div className="deceased-stk-brand"><i />M-Pesa payment</div>}
            <h2 id="deceased-stk-title">{requestResult ? statusTitle : 'Request a payment'}</h2>
            <p>{requestResult ? resultDescription : 'The payer receives a prompt on their phone and approves it with their M-Pesa PIN.'}</p>
          </div>
          <button className="deceased-stk-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <div className="deceased-stk-body">
          {requestResult ? (
            paymentState === 'pending' ? (
              <div className="deceased-stk-processing" role="status" aria-live="polite">
                <div className="deceased-stk-hero">
                  <div className="deceased-stk-hero-main">
                    <div className="deceased-stk-pulse" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="7" y="2" width="10" height="20" rx="2.5" />
                        <path d="M11 18h2" />
                      </svg>
                    </div>
                    <div>
                      <span className="deceased-stk-hero-label">Approve on {displayPhone}</span>
                      <strong className="deceased-stk-hero-amount">{formattedAmount}</strong>
                    </div>
                  </div>
                  <div className="deceased-stk-qr">
                    <div className="deceased-stk-qr-box">
                      <QRCodeSVG
                        value={checkoutRequestId}
                        size={96}
                        bgColor="#ffffff"
                        fgColor="#08261f"
                        level="M"
                        aria-label="M-Pesa checkout request reference"
                      />
                    </div>
                    <span>Request reference</span>
                  </div>
                </div>
                <div className="deceased-stk-progress" aria-label={`Payment confirmation check ${pollCount} of ${MAX_STATUS_POLLS}`}>
                  <div style={{ width: `${Math.max(4, (pollCount / MAX_STATUS_POLLS) * 100)}%` }} />
                </div>
                <ol className="deceased-stk-steps">
                  <li className="is-done"><span />Request sent to M-Pesa</li>
                  <li className={pollCount > 5 ? 'is-done' : 'is-active'}><span />Waiting for PIN on {displayPhone}</li>
                  <li className={pollCount > 5 ? 'is-active' : ''}><span />Confirming payment</li>
                </ol>
                <div className="deceased-stk-record-note">
                  <strong>{displayName}</strong>
                  <span>{hasDeceased ? `Admission ${admissionNumber || '—'} · ` : ''}{kinName.trim()}</span>
                </div>
                <p className="deceased-stk-secure-note">Payment is recorded only after M-Pesa confirms the transaction.</p>
              </div>
            ) : (
              <div className={`deceased-stk-result is-${paymentState === 'paid' ? 'success' : paymentState === 'failed' ? 'failure' : 'waiting'}`} role={paymentState === 'failed' ? 'alert' : 'status'} aria-live="polite">
                <div className="deceased-stk-result-icon" aria-hidden="true">
                  {paymentState === 'paid' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : paymentState === 'failed' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  ) : '…'}
                </div>
                <h3>{paymentState === 'paid'
                  ? `${formattedAmount} received`
                  : paymentState === 'failed' ? 'Payment was not received' : 'Confirmation is taking longer than expected'}</h3>
                <p>{paymentState === 'paid'
                  ? (hasDeceased
                    ? `The payment is now recorded on ${displayName}’s deceased record.`
                    : 'M-Pesa confirmed this payment.')
                  : resultDescription}</p>
                <dl className="deceased-stk-receipt">
                  {paymentState === 'paid' && (requestResult.receipt || requestResult.mpesaReceiptNumber || requestResult.MpesaReceiptNumber) && <div><dt>M-Pesa code</dt><dd className="deceased-stk-code">{requestResult.receipt || requestResult.mpesaReceiptNumber || requestResult.MpesaReceiptNumber}</dd></div>}
                  {hasDeceased && <div><dt>Deceased</dt><dd>{displayName}</dd></div>}
                  <div><dt>Paid by</dt><dd>{kinName.trim()}</dd></div>
                  <div><dt>Phone</dt><dd>{displayPhone}</dd></div>
                  {hasDeceased && <div><dt>Admission</dt><dd>{admissionNumber}</dd></div>}
                  <div className="deceased-stk-total">
                    <dt>{paymentState === 'paid' ? 'Amount paid' : 'Amount requested'}</dt>
                    <dd>{formattedAmount}</dd>
                  </div>
                </dl>
                {paymentState === 'delayed' && <p className="deceased-stk-secure-note">Do not send another request until you have checked whether this payment arrived.</p>}
              </div>
            )
          ) : (
            <>
              {hasDeceased ? (
                <div className="deceased-stk-record">
                  <div className="deceased-stk-avatar" aria-hidden="true">{initials}</div>
                  <div className="deceased-stk-record-text"><strong>{displayName}</strong><span>Admission {admissionNumber || '—'}</span></div>
                </div>
              ) : (
                <div className="deceased-stk-record">
                  <div className="deceased-stk-avatar" aria-hidden="true"><i className="fas fa-mobile-alt" /></div>
                  <div className="deceased-stk-record-text"><strong>General payment request</strong><span>Not attached to a deceased record</span></div>
                </div>
              )}
              <form id="deceased-stk-form" className="deceased-stk-form" onSubmit={submit}>
                <div className="deceased-stk-row">
                  <label>
                    <span>Next of kin name</span>
                    <input className="deceased-stk-input" value={kinName} onChange={event => setKinName(event.target.value)} autoComplete="name" required />
                  </label>
                  <label>
                    <span>M-Pesa phone number</span>
                    <input className="deceased-stk-input" type="tel" inputMode="tel" placeholder="0712 345 678" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} autoComplete="tel" required />
                  </label>
                </div>
                <label>
                  <span>Amount to pay</span>
                  <div className="deceased-stk-amount">
                    <span>KES</span>
                    <input className="deceased-stk-input" type="number" min="1" step="1" inputMode="numeric" placeholder="0" value={amount} onChange={event => setAmount(event.target.value)} required />
                  </div>
                </label>
                {error && <div className="deceased-stk-error" role="alert">{error}</div>}
                <p className="deceased-stk-secure-note">{hasDeceased
                  ? 'The payment is added to this deceased record only after M-Pesa confirms it.'
                  : 'This request is not linked to a deceased record. The payment is only recorded after M-Pesa confirms it.'}</p>
              </form>
            </>
          )}
        </div>

        {!requestResult && (
          <footer className="deceased-stk-footer">
            <button type="button" className="deceased-stk-button" onClick={onClose}>Cancel</button>
            {error ? (
              <button type="button" className="deceased-stk-button is-primary" onClick={handleRetry} disabled={busy}>
                {busy ? <><span className="deceased-stk-spinner" /> Sending request…</> : 'Try again'}
              </button>
            ) : (
              <button type="submit" form="deceased-stk-form" className="deceased-stk-button is-primary" disabled={busy}>
                {busy ? <><span className="deceased-stk-spinner" /> Sending request…</> : `Send request${Number(amount) > 0 ? ` · ${formattedAmount}` : ''}`}
              </button>
            )}
          </footer>
        )}
        {requestResult && paymentState !== 'pending' && (
          <footer className="deceased-stk-footer">
            {paymentState === 'failed' && (
              <button type="button" className="deceased-stk-button is-primary" onClick={handleRetry}>
                Try again
              </button>
            )}
            <button type="button" className="deceased-stk-button" onClick={onClose}>Done</button>
          </footer>
        )}
        {requestResult && paymentState === 'pending' && (
          <footer className="deceased-stk-footer">
            <button type="button" className="deceased-stk-button" onClick={onClose}>Close</button>
          </footer>
        )}
      </section>
    </div>
  );
};

export default DeceasedStkPushModal;
