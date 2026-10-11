/* ==========================================================================
   Amani Cover — MEMBER PAYMENT PORTAL (Simplified Direct Pay)
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, LockKeyhole } from 'lucide-react';
import { formatPlanAmount, planFor } from './amaniData';
import { InsuranceApiError, startPayment, getPaymentStatus, getPaymentLink } from '../../../api/insuranceApi';

const formatKes = (value) => Number(value || 0).toLocaleString('en-KE');

const PAY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');
  
  .amani-pay { 
    width: 100vw; 
    margin-left: calc(50% - 50vw); 
    margin-right: calc(50% - 50vw); 
    box-sizing: border-box; 
    min-height: 100vh; min-height: 100svh; 
    background: #ffffff; 
    color: #293946; 
    font-family: 'Source Sans 3', sans-serif; 
    -webkit-font-smoothing: antialiased; 
  }
  
  .amani-pay .split-layout { display: flex; height: 100vh; height: 100svh; width: 100%; }
  
  /* ─── LEFT BRANDING PANEL ─── */
  .amani-pay .brand-panel {
    flex: 1;
    background: #173c5a;
    background-image: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
    border-right: 1px solid #102f49;
  }
  .amani-pay .brand-logo h1 { font-family: 'Merriweather', serif; font-size: 24px; line-height: 1.2; margin: 0; }
  .amani-pay .brand-logo span { font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-top: 4px; }
  
  .amani-pay .brand-center { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .amani-pay .brand-quote { font-family: 'Merriweather', serif; font-size: 34px; line-height: 1.4; max-width: 80%; }
  .amani-pay .brand-sub { margin-top: 24px; font-size: 16px; color: #cbd5e1; max-width: 60%; line-height: 1.6; }
  
  .amani-pay .brand-footer { font-size: 12px; color: #a8bdd9; display: flex; justify-content: space-between; align-items: center; }
  .amani-pay .security-badge { display: flex; align-items: center; gap: 8px; color: #a8bdd9; }
  
  /* ─── RIGHT ACTION PANEL ─── */
  .amani-pay .action-panel {
    flex: 1;
    background: #f4f7f8;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 48px;
    position: relative;
  }
  
  .amani-pay .action-container {
    width: 100%;
    max-width: 440px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #dce4e8;
    border-radius: 8px;
    padding: 48px 40px;
    box-shadow: 0 4px 24px rgba(23, 60, 90, 0.04);
  }
  
  .amani-pay .state-section { display: none; }
  .amani-pay .state-section.active { display: block; animation: amani-fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes amani-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  
  .amani-pay .status-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: #596b78; margin-bottom: 16px;
    display: block;
  }
  
  .amani-pay .amount-due {
    font-family: 'Merriweather', serif;
    font-size: 48px;
    font-weight: 700;
    color: #173c5a;
    margin-bottom: 8px;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .amani-pay .policy-info { font-size: 15px; color: #596b78; margin-bottom: 32px; }
  
  /* ─── BUTTONS ─── */
  .amani-pay .btn {
    width: 100%;
    padding: 16px 24px; border-radius: 4px;
    font-weight: 700; font-size: 16px; cursor: pointer;
    border: 1px solid #dce4e8; background: #ffffff;
    color: #293946; transition: 0.15s;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    font-family: 'Source Sans 3', sans-serif;
    letter-spacing: 0.02em;
  }
  .amani-pay .btn:hover:not(:disabled) { background: #f4f7f8; border-color: #547895; }
  .amani-pay .btn-primary { background: #173c5a; color: #ffffff; border-color: #173c5a; }
  .amani-pay .btn-primary:hover:not(:disabled) { background: #102f49; }
  .amani-pay .btn-success { background: #557565; color: #ffffff; border-color: #557565; }
  .amani-pay .btn-success:hover:not(:disabled) { background: #456454; }
  .amani-pay .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  /* ─── PROCESSING STATE ─── */
  .amani-pay .spinner-container { width: 56px; height: 56px; margin: 0 auto 32px; position: relative; }
  .amani-pay .spinner { width: 100%; height: 100%; border: 3px solid #f1f5f9; border-top-color: #173c5a; border-radius: 50%; animation: amani-spin 0.8s linear infinite; }
  @keyframes amani-spin { to { transform: rotate(360deg); } }
  
  .amani-pay .processing-title { font-family: 'Merriweather', serif; font-size: 24px; color: #173c5a; margin-bottom: 12px; }
  .amani-pay .processing-text { font-size: 15px; color: #596b78; line-height: 1.6; margin-bottom: 32px; max-width: 320px; margin-left: auto; margin-right: auto; }
  .amani-pay .phone-placeholder { font-weight: 700; color: #173c5a; border-bottom: 2px solid #173c5a; padding-bottom: 2px; }
  
  /* ─── SUCCESS STATE ─── */
  .amani-pay .success-icon-wrap { width: 72px; height: 72px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #557565; border-radius: 50%; background: #edf3ef; }
  .amani-pay .checkmark { width: 36px; height: 36px; stroke: #557565; stroke-width: 4; fill: none; stroke-dasharray: 50; stroke-dashoffset: 50; animation: amani-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
  @keyframes amani-draw { to { stroke-dashoffset: 0; } }
  
  .amani-pay .success-title { font-family: 'Merriweather', serif; font-size: 28px; color: #173c5a; margin-bottom: 16px; }
  .amani-pay .success-text { font-size: 15px; color: #596b78; line-height: 1.6; margin-bottom: 32px; max-width: 320px; margin-left: auto; margin-right: auto; }
  
  .amani-pay .receipt-box { background: #f4f7f8; border: 1px solid #f1f5f9; padding: 20px; border-radius: 4px; margin-bottom: 24px; text-align: left; }
  .amani-pay .receipt-row { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .amani-pay .receipt-row:last-child { border-bottom: none; }
  .amani-pay .receipt-label { color: #596b78; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; font-weight: 700; }
  .amani-pay .receipt-value { color: #173c5a; font-weight: 600; font-size: 15px; }
  
  /* ─── RESPONSIVE ─── */
  @media (max-width: 768px) {
    .amani-pay .split-layout { flex-direction: column; }
    .amani-pay .brand-panel { display: none; }
    .amani-pay .action-panel { padding: 16px; justify-content: flex-start; padding-top: 10vh; background: #ffffff; }
    .amani-pay .action-container { border: none; box-shadow: none; padding: 24px; }
  }
`;

export default function AmaniPayPortal() {
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [policy, setPolicy] = useState(null);

  // Dummy paymentCode for UI rendering. In production, this comes from useParams()
  const paymentCode = 'PC-10045';

  useEffect(() => {
    // Simulate fetching payment link details on load
    // In production: getPaymentLink(paymentCode).then(setPolicy)
    setPolicy({
      policyNumber: 'AMANI-10045',
      monthlyPremium: 500,
      coverType: 'Solo'
    });
  }, [paymentCode]);

  const dueNow = policy?.monthlyPremium || 500;

  async function beginPayment() {
    setPaymentState('starting');
    setPaymentError('');
    setPaymentReference('');
    setPaymentDetails(null);

    try {
      // Call your actual API
      const result = await startPayment({
        policyNumber: policy.policyNumber,
        policyCode: paymentCode,
        months: 1, // hardcoded to monthly for the simplified UI
      });

      if (!result?.reference) throw new Error('The payment service did not return a payment reference.');

      setPaymentReference(result.reference);
      setPaymentDetails(result);
      setPaymentState('pending');
    } catch (err) {
      setPaymentState('idle');
      setPaymentError(
        err instanceof InsuranceApiError && err.message
          ? err.message
          : 'We could not start the M-Pesa request. Please try again.'
      );
    }
  }

  // Poll for payment status when pending
  useEffect(() => {
    if (paymentState !== 'pending' || !paymentReference) return undefined;

    let active = true;
    let attempts = 0;
    let timer;

    const poll = async () => {
      attempts += 1;
      try {
        const result = await getPaymentStatus(paymentReference);
        if (!active) return;
        setPaymentDetails(result);
        if (result.status === 'paid') setPaymentState('paid');
        if (result.status === 'failed') setPaymentState('failed');
      } catch {
        // Keep polling through temporary network errors.
      }
      if (attempts >= 75 && timer) clearInterval(timer);
    };

    timer = setInterval(poll, 4000);
    poll();

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [paymentReference, paymentState]);

  function reset() {
    setPaymentState('idle');
    setPaymentReference('');
    setPaymentDetails(null);
    setPaymentError('');
  }

  return (
    <div className="amani-pay">
      <style>{PAY_STYLES}</style>

      <div className="split-layout">

        {/* LEFT PANEL: BRANDING */}
        <aside className="brand-panel">
          <div className="brand-logo">
            <h1>Montenzuma</h1>
            <span>Mona Lisa Funeral Home</span>
          </div>

          <div className="brand-center">
            <div className="brand-quote">"Providing dignity, respect, and peace of mind for your family's future."</div>
            <div className="brand-sub">Your Amani Cover ensures that during difficult times, financial burdens are the last thing your family needs to worry about.</div>
          </div>

          <div className="brand-footer">
            <span>© {new Date().getFullYear()} Montenzuma Mona Lisa</span>
            <div className="security-badge">
              <ShieldCheck size={14} />
              256-bit Secured Payment
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: PAYMENT ACTION */}
        <main className="action-panel">
          <div className="action-container">

            {/* STATE 1: IDLE (Ready to Pay) */}
            {paymentState === 'idle' && (
              <div className="state-section active">
                <span className="status-label">Premium Due</span>
                <div className="amount-due">Ksh {formatKes(dueNow)}</div>
                <div className="policy-info">Policy No: {policy?.policyNumber || 'Loading...'}</div>

                <button className="btn btn-primary" onClick={beginPayment} disabled={!policy}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20M6 14h4" /></svg>
                  Pay Ksh {formatKes(dueNow)} with M-Pesa
                </button>

                {paymentError && (
                  <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '16px' }}>{paymentError}</p>
                )}

                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#596b78', fontSize: '13px' }}>
                  <LockKeyhole size={14} />
                  <span>Secured by Safaricom Daraja API</span>
                </div>
              </div>
            )}

            {/* STATE 2: PROCESSING (Waiting for STK Push) */}
            {(paymentState === 'starting' || paymentState === 'pending') && (
              <div className="state-section active">
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
                <div className="processing-title">Awaiting PIN Entry</div>
                <div className="processing-text">
                  An M-Pesa prompt has been sent to your phone. Please enter your M-Pesa PIN to authorize the payment for policy <strong>{policy?.policyNumber}</strong>.
                  <br /><br />
                  Waiting for your response...
                </div>
                <button className="btn" disabled>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Processing Payment
                </button>
              </div>
            )}

            {/* STATE 3: SUCCESS (Payment Complete) */}
            {paymentState === 'paid' && (
              <div className="state-section active">
                <div className="success-icon-wrap">
                  <svg className="checkmark" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title">Payment Complete</div>
                <div className="success-text">
                  Your Amani Cover premium has been received. Your family is fully protected for this month.
                </div>

                <div className="receipt-box">
                  <div className="receipt-row">
                    <span className="receipt-label">Amount Paid</span>
                    <span className="receipt-value">Ksh {formatKes(paymentDetails?.amount || dueNow)}.00</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">M-Pesa Ref</span>
                    <span className="receipt-value">{paymentDetails?.receipt || 'N/A'}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Policy Number</span>
                    <span className="receipt-value">{policy?.policyNumber}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Cover Status</span>
                    <span className="receipt-value" style={{ color: '#557565' }}>Active Until Nov 1</span>
                  </div>
                </div>

                <button className="btn btn-success" onClick={reset}>
                  Finish
                </button>
              </div>
            )}

            {/* STATE 4: FAILED (Payment Failed) */}
            {paymentState === 'failed' && (
              <div className="state-section active">
                <div className="success-icon-wrap" style={{ borderColor: '#dc2626', background: '#fef2f2' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
                <div className="success-title" style={{ color: '#dc2626' }}>Payment Failed</div>
                <div className="success-text">
                  {paymentDetails?.failureReason || 'The M-Pesa request was cancelled or could not be completed.'}
                </div>
                <button className="btn btn-primary" onClick={reset}>
                  Try Again
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}