/* ==========================================================================
   Amani Cover — MEMBER PAYMENT PORTAL

   The payments SECTION of /amani/payments (AmaniPayments renders the page
   shell around this). A direct port of the standalone `amani/pay/` design
   prototype: the two-panel split (branded photo panel left, form right) and
   its lookup, searching and contribution-detail states.

   WHAT IS REAL AND WHAT IS NOT
   The `lookup → plan` transition calls the real insurance-service
   (POST /insurance/cover-check), which confirms whether an Amani Cover exists
   for the ID number typed. That endpoint returns only whether cover was found
   plus its type/status/count — never the holder's name, phone, email, group
   members or claims — so this portal cannot be used to look a person up.

   Payment links and the M-Pesa STK flow are connected to the insurance and
   M-Pesa services. Payment status is confirmed by the provider callback.

   THE AMOUNT IS NOT A GUESS
   This portal used to default every member to a hardcoded KES 2,000 whatever
   plan they held. It now derives the contribution from the plan the cover-check
   told us about (PLANS in amaniData.js): Solo 500, Family 1,000, Group from
   10,000 — so a Solo member is no longer quoted four times their real premium.
   The member picks monthly or quarterly on top of that.

   PORTING NOTES (prototype → this Vite SPA)
   • The prototype is a Next.js app; `pay/` is kept in the repo as the design
     source of truth but is NOT part of the module graph.
   • Its stylesheet imported Tailwind/shadcn globally. Here every rule is scoped
     under `.amani-pay` so it cannot leak into the host app.
   • Its <img src="/images/family-protection.png"> pointed at the prototype's own
     public folder. The image is now served from /amani/images/... through
     <FillImage>, so the browser downloads one correctly-sized WebP rather than
     the 1.5 MB PNG.
   • FULL-BLEED: the portal always occupies the full viewport — 100% width
     (breaks out of any parent max-width/padding) and min-height 100svh. The
     card chrome (rounded corners + drop shadow) is gone; the page background
     is plain white so the layout reads clean edge-to-edge.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, LockKeyhole, Phone, Search, ShieldCheck } from 'lucide-react';
import { CONTACT, formatPlanAmount, planFor } from './amaniData';
import { InsuranceApiError, checkCover, startPayment, getPaymentStatus, getPaymentLink } from '../../../api/insuranceApi';

const formatKes = (value) => Number(value || 0).toLocaleString('en-KE');

function normalizeKenyanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return '254' + digits.slice(1);
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return '';
}

/* Display-only mask for the processing state: 254740045355 -> "0740 *** 355".
   Never used to send anything — the raw number stays in `phoneNumber`. */
function maskPhone(value) {
  const digits = normalizeKenyanPhone(value);
  if (!digits) return '';
  return '0' + digits.slice(3, 6) + ' *** ' + digits.slice(-3);
}

/* How often a member may pay. `months` is how many monthly contributions one
   payment covers. Quarterly is three months at the monthly rate and carries NO
   discount on purpose: there is no pricing engine in this codebase, so
   advertising a "save X%" the backend cannot honour would be a false promise.
   If Amani wants a multi-month discount it belongs in PLANS as a real rate. */
const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', months: 1, hint: 'Every month' },
  { value: 'quarterly', label: 'Quarterly', months: 3, hint: 'Every 3 months' },
];

/* iPay-now split layout — BLUISH palette like the original portal:
   navy #173c5a / deep #102f49 / cobalt #547895 / slate #596b78 / line #dce4e8.
   Scoped under .amani-pay. The backend flow below is untouched — lookup,
   cover-check, startPayment and status polling all stay as they were. */
const PAY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');
  .amani-pay { width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); box-sizing: border-box; padding: 20px; min-height: 100vh; min-height: 100svh; background: #ffffff; color: #293946; font-family: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  /* Whole-page padding: the shell (all page content) sits inset inside the
     white page with a light frame, so nothing runs to the viewport edge. */
  .amani-pay .payment-shell { box-sizing: border-box; display: flex; width: 100%; height: calc(100vh - 40px); height: calc(100svh - 40px); overflow: hidden; background: #ffffff; color: #293946; border: 1px solid #dce4e8; border-radius: 8px; }

  .amani-pay .brand-panel { position: relative; isolation: isolate; flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 48px; background: #173c5a; background-image: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%); color: #ffffff; border-right: 1px solid #102f49; }
  /* Navy brand panel — the old photo is hidden, not deleted. */
  .amani-pay .brand-panel__image, .amani-pay .brand-panel__shade { display: none; }
  .amani-pay .brand-panel__content { position: relative; z-index: 2; display: flex; min-height: 100%; flex-direction: column; justify-content: space-between; padding: 0; }
  .amani-pay .brand-logo h1, .amani-pay .brand-mark__name { font-family: 'Merriweather', Georgia, serif; font-size: 24px; font-weight: 700; line-height: 1.2; }
  .amani-pay .brand-logo span { display: block; margin-top: 4px; font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.15em; }
  .amani-pay .brand-mark { display: flex; align-items: center; gap: .7rem; }
  .amani-pay .hero-copy { max-width: 34rem; margin: auto 0; }
  .amani-pay .eyebrow, .amani-pay .form-heading__kicker { display: flex; align-items: center; gap: .45rem; color: #cbd5e1; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; }
  .amani-pay .hero-copy h1, .amani-pay .form-heading h2 { font-family: 'Merriweather', Georgia, serif; font-weight: 700; letter-spacing: 0; }
  .amani-pay .hero-copy h1 { margin: 1.5rem 0 1.45rem; font-size: 36px; font-weight: 400; line-height: 1.4; }
  .amani-pay .hero-copy h1 em { color: #ffffff; font-style: normal; }
  .amani-pay .hero-copy p { max-width: 34rem; color: #cbd5e1; font-size: 16px; line-height: 1.6; }
  .amani-pay .secure-pill { display: inline-flex; align-items: center; gap: 8px; margin-top: 2rem; color: #a8bdd9; font-size: 13px; }
  .amani-pay .secure-pill svg { color: #a8bdd9; }
  .amani-pay .brand-panel__footer { display: flex; align-items: center; justify-content: space-between; gap: .75rem; color: #a8bdd9; font-size: 12px; }
  .amani-pay .footer-dot { display: none; }

  .amani-pay .form-panel { display: flex; align-items: center; justify-content: center; background: #ffffff; padding: 48px; overflow-y: auto; }
  .amani-pay .form-panel__inner { width: min(100%, 440px); text-align: center; }
  .amani-pay .state-view { width: 100%; }
  .amani-pay .form-heading { max-width: 31rem; margin-left: auto; margin-right: auto; }
  .amani-pay .form-heading h2 { margin: .7rem 0 .65rem; color: #173c5a; font-size: 34px; font-weight: 700; line-height: 1.15; }
  .amani-pay .form-heading p { max-width: 29rem; margin: 0 auto; color: #596b78; font-size: 16px; line-height: 1.6; }
  .amani-pay .form-heading__kicker { color: #596b78; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .amani-pay .form-heading__kicker--green { color: #557565; }
  .amani-pay .payment-form { display: flex; flex-direction: column; gap: 16px; margin-top: 32px; text-align: left; }
  .amani-pay .field { display: flex; flex-direction: column; gap: 8px; color: #596b78; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; text-align: left; }
  .amani-pay .field input { width: 100%; height: 52px; border: 1px solid #dce4e8; border-radius: 4px; background: #f4f7f8; padding: 0 16px; color: #173c5a; font: 500 16px 'Source Sans 3', ui-sans-serif, system-ui, sans-serif; letter-spacing: 0; text-transform: none; transition: border-color .15s, background .15s; }
  .amani-pay .field input::placeholder { color: #9aa9ba; }
  .amani-pay .field input:focus { outline: none; border-color: #173c5a; background: #ffffff; }
  .amani-pay .field input[aria-invalid="true"] { border-color: #dc2626; }
  .amani-pay .pay-error { color: #dc2626; font-size: 14px; line-height: 1.5; margin: 0; text-align: left; }
  .amani-pay .pay-button { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 54px; padding: 14px 24px; border: 1px solid #173c5a; border-radius: 4px; background: #173c5a; color: #ffffff; cursor: pointer; font: 700 16px 'Source Sans 3', sans-serif; letter-spacing: .02em; transition: background .15s, border-color .15s; }
  .amani-pay .pay-button:hover:not(:disabled) { background: #102f49; border-color: #293946; }
  .amani-pay .pay-button:disabled { opacity: .5; cursor: not-allowed; }
  .amani-pay a.pay-button { text-decoration: none; }
  .amani-pay a.pay-button:hover { background: #102f49; }
  .amani-pay .payment-apply-link { display: block; margin-top: 16px; color: #596b78; font-size: 14px; font-weight: 600; text-align: center; text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .payment-contact-card { margin-top: 24px; padding: 24px; border: 1px solid #dce4e8; border-radius: 4px; background: #f4f7f8; text-align: center; }
  .amani-pay .payment-contact-card strong { display: block; color: #173c5a; font-family: 'Merriweather', Georgia, serif; font-size: 20px; font-weight: 700; }
  .amani-pay .payment-contact-card p { margin: 10px 0 12px; color: #596b78; font-size: 15px; line-height: 1.6; }
  .amani-pay .payment-contact-card small { color: #596b78; font-size: 13px; }

  .amani-pay .form-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; color: #596b78; font-size: 13px; text-align: center; }
  .amani-pay .form-note svg { color: #557565; }
  .amani-pay .payment-trust { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 28px; color: #596b78; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .amani-pay .payment-trust strong { color: #557565; font-size: 12px; letter-spacing: .04em; }
  .amani-pay .trust-divider { width: 1px; height: 14px; background: #dce4e8; }

  .amani-pay .centered-state { display: flex; align-items: center; flex-direction: column; text-align: center; }
  .amani-pay .form-heading--center { margin-top: 32px; }
  .amani-pay .form-heading--center p { max-width: 400px; }
  /* Mock-style waiting ring: gray track, black arc (like .spinner). */
  .amani-pay .pending-orbit { display: grid; width: 64px; height: 64px; margin: 0 auto 32px; place-items: center; border: 3px solid #f1f5f9; border-top-color: #547895; border-radius: 50%; animation: amanipay-spin .8s linear infinite; box-shadow: none; }
  .amani-pay .pending-orbit__dot { width: 0; height: 0; border: 0; animation: none; }
  @keyframes amanipay-spin { to { transform: rotate(360deg); } }

  /* Plan-found summary + receipt + history — sharp corners, gray/black tokens */
  .amani-pay .plan-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 32px; padding: 24px; border: 1px solid #dce4e8; border-radius: 4px; background: #f4f7f8; text-align: left; }
  .amani-pay .summary-label { display: block; color: #596b78; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .amani-pay .plan-summary strong { display: block; margin-top: 4px; color: #173c5a; font-size: 16px; }
  .amani-pay .plan-summary small { display: block; margin-top: 4px; color: #596b78; font-size: 13px; }
  .amani-pay .summary-amount { text-align: right; }
  .amani-pay .summary-amount strong { font-family: 'Merriweather', Georgia, serif; font-size: 34px; font-weight: 700; }

  .amani-pay .success-badge { display: grid; width: 80px; height: 80px; margin: 0 auto 24px; place-items: center; border: 2px solid #557565; border-radius: 50%; background: #edf3ef; color: #557565; }
  .amani-pay .receipt-card { display: flex; align-items: center; flex-direction: column; gap: 6px; width: 100%; margin: 32px 0; padding: 24px; border: 1px solid #f1f5f9; border-radius: 4px; background: #f4f7f8; text-align: left; }
  .amani-pay .receipt-card span { color: #596b78; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .amani-pay .receipt-card strong { color: #173c5a; font-family: 'Merriweather', Georgia, serif; font-size: 32px; font-weight: 700; }
  .amani-pay .receipt-card small { color: #596b78; font-family: monospace; font-size: 13px; }

  .amani-pay .contribution-history { width: 100%; margin-top: 6px; padding: 16px; border: 1px solid #dce4e8; border-radius: 4px; background: #f4f7f8; text-align: left; }
  .amani-pay .history-heading { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .amani-pay .history-heading h3 { margin-top: 4px; color: #173c5a; font-family: 'Merriweather', Georgia, serif; font-size: 18px; font-weight: 700; }
  .amani-pay .history-heading svg { color: #596b78; }
  .amani-pay .history-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
  .amani-pay .history-row div:last-child { text-align: right; }
  .amani-pay .history-row strong { display: block; color: #173c5a; font-size: 13px; }
  .amani-pay .history-row small { display: block; margin-top: 3px; color: #596b78; font-size: 11px; }
  .amani-pay .history-row--current strong:first-child { color: #557565; }
  .amani-pay .history-total { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 14px; color: #596b78; font-size: 12px; }
  .amani-pay .history-total strong { color: #173c5a; font-size: 14px; }

  .amani-pay .text-button { display: block; width: 100%; margin-top: 16px; border: 0; background: none; color: #596b78; cursor: pointer; font-size: 14px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .text-button:hover { color: #173c5a; }
  .amani-pay .secondary-button { width: 100%; min-height: 54px; margin-top: 32px; border: 1px solid #dce4e8; border-radius: 4px; background: #ffffff; color: #173c5a; cursor: pointer; font: 700 16px 'Source Sans 3', sans-serif; }
  .amani-pay .secondary-button:hover { border-color: #173c5a; background: #f4f7f8; }
  .amani-pay .mock-note { margin-top: 16px; padding: 12px 14px; border: 1px dashed #e0b64a; border-radius: 4px; background: #fffaeb; color: #7a5a08; font-size: 12px; line-height: 1.5; }

  /* Payment frequency picker — two big tap targets, monthly / quarterly. */
  .amani-pay .freq { margin-top: 24px; padding: 0; border: 0; text-align: left; }
  .amani-pay .field-legend { display: block; margin-bottom: 10px; color: #596b78; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .amani-pay .freq-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .amani-pay .freq-option { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 16px; border: 1px solid #dce4e8; border-radius: 4px; background: #f4f7f8; cursor: pointer; transition: border-color .15s, background .15s; }
  .amani-pay .freq-option:hover { border-color: #596b78; background: #ffffff; }
  .amani-pay .freq-option.is-active { border-color: #173c5a; background: #ffffff; box-shadow: 0 0 0 2px rgba(84,120,149,.18); }
  .amani-pay .freq-option input { position: absolute; opacity: 0; pointer-events: none; }
  /* Keyboard focus still needs a visible ring, since the input is invisible. */
  .amani-pay .freq-option:has(input:focus-visible) { outline: 2px solid #547895; outline-offset: 2px; }
  .amani-pay .freq-option__label { color: #173c5a; font-size: 14px; font-weight: 700; }
  .amani-pay .freq-option__hint { color: #596b78; font-size: 12px; }
  .amani-pay .freq-option__amount { margin-top: 4px; color: #596b78; font-size: 14px; font-weight: 700; }
  .amani-pay .freq-option.is-active .freq-option__amount { color: #173c5a; }

  /* ─── MOCK STATE BLOCKS (idle / processing / success / failure) ─── */
  .amani-pay .status-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #596b78; margin-bottom: 16px; }
  .amani-pay .amount-due { font-family: 'Merriweather', Georgia, serif; font-size: 54px; font-weight: 700; color: #173c5a; line-height: 1; letter-spacing: -.02em; margin-bottom: 8px; }
  .amani-pay .policy-info { font-size: 15px; color: #596b78; margin-bottom: 32px; }
  .amani-pay .btn { width: 100%; min-height: 54px; padding: 14px 24px; border-radius: 4px; font: 700 16px 'Source Sans 3', sans-serif; letter-spacing: .02em; cursor: pointer; border: 1px solid #dce4e8; background: #ffffff; color: #293946; display: inline-flex; align-items: center; justify-content: center; gap: 10px; transition: .15s; }
  .amani-pay .btn:hover:not(:disabled) { background: #f4f7f8; border-color: #596b78; }
  .amani-pay .btn-primary { background: #173c5a; color: #ffffff; border-color: #173c5a; }
  .amani-pay .btn-primary:hover:not(:disabled) { background: #102f49; }
  .amani-pay .btn-success { background: #557565; color: #ffffff; border-color: #557565; }
  .amani-pay .btn-success:hover:not(:disabled) { background: #456454; }
  .amani-pay .btn:disabled { opacity: .5; cursor: not-allowed; }
  .amani-pay .spinner-container { width: 64px; height: 64px; margin: 0 auto 32px; }
  .amani-pay .spinner { width: 100%; height: 100%; border: 3px solid #f1f5f9; border-top-color: #547895; border-radius: 50%; animation: amanipay-spin .8s linear infinite; }
  .amani-pay .processing-title { font-family: 'Merriweather', Georgia, serif; font-size: 28px; font-weight: 700; color: #173c5a; margin-bottom: 16px; }
  .amani-pay .processing-text { font-size: 16px; color: #596b78; line-height: 1.6; margin: 0 auto 32px; max-width: 380px; }
  .amani-pay .phone-placeholder { font-weight: 700; color: #173c5a; border-bottom: 2px solid #173c5a; padding-bottom: 2px; }
  .amani-pay .success-icon-wrap { width: 80px; height: 80px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #557565; border-radius: 50%; background: #edf3ef; }
  .amani-pay .checkmark { width: 40px; height: 40px; stroke: #557565; stroke-width: 4; fill: none; stroke-dasharray: 50; stroke-dashoffset: 50; animation: amanipay-draw .6s cubic-bezier(.65,0,.45,1) forwards; }
  @keyframes amanipay-draw { to { stroke-dashoffset: 0; } }
  .amani-pay .success-title { font-family: 'Merriweather', Georgia, serif; font-size: 32px; font-weight: 700; color: #173c5a; margin-bottom: 16px; }
  .amani-pay .success-text { font-size: 16px; color: #596b78; line-height: 1.6; margin: 0 auto 32px; max-width: 380px; }
  .amani-pay .fail-icon-wrap { width: 80px; height: 80px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #dc2626; border-radius: 50%; background: #fef2f2; color: #dc2626; font-size: 36px; font-weight: 700; }
  .amani-pay .fail-title { font-family: 'Merriweather', Georgia, serif; font-size: 30px; font-weight: 700; color: #173c5a; margin-bottom: 16px; }
  .amani-pay .receipt-box { background: #f4f7f8; border: 1px solid #f1f5f9; padding: 24px; border-radius: 4px; margin-bottom: 32px; text-align: left; }
  .amani-pay .receipt-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .amani-pay .receipt-row:last-child { border-bottom: none; }
  .amani-pay .receipt-label { color: #596b78; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; font-weight: 700; }
  .amani-pay .receipt-value { color: #173c5a; font-weight: 600; font-size: 15px; text-align: right; }
  .amani-pay .retry-hint { font-size: 13px; color: #557565; margin-top: 12px; }
  .amani-pay .ref-line { font-size: 13px; color: #596b78; margin-top: 16px; }

  /* Mock: brand panel hidden on mobile; action panel starts near the top. */
  @media (max-width: 768px) {
    .amani-pay { padding: 12px; }
    .amani-pay .payment-shell { display: block; height: auto; min-height: calc(100svh - 24px); }
    .amani-pay .brand-panel { display: none; }
    .amani-pay .form-panel { padding: 24px; justify-content: flex-start; padding-top: 8vh; }
    .amani-pay .plan-summary { flex-direction: column; align-items: flex-start; gap: 12px; }
    .amani-pay .summary-amount { text-align: left; }
    .amani-pay .freq-options { grid-template-columns: 1fr; }
  }
`;

export default function AmaniPayPortal() {
  const { code: paymentCode } = useParams();
  const automaticPaymentStarted = useRef(false);
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState('lookup');
  const [frequency, setFrequency] = useState('monthly');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    if (!paymentCode) return undefined;
    let active = true;
    getPaymentLink(paymentCode).then((result) => {
      if (!active) return;
      setPolicy({ policyCode: result.publicCode, policyNumber: result.policyNumber, coverType: result.coverType, monthlyPremium: result.monthlyPremium, coverStatus: result.status, coveredCount: result.coveredCount });
      setIdNumber(result.policyNumber || '');
      setStatus('plan');
    }).catch((err) => { if (active) { setStatus('lookup'); setError(err?.message || 'This payment link could not be found.'); } });
    return () => { active = false; };
  }, [paymentCode]);

  /* What cover-check returned for this number. Null until a hit. */
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');

  /* ---- the money, derived rather than guessed ----
     `policy.coverType` comes straight from the server, so the contribution
     follows the plan the member actually applied for. Until a policy is found
     there is nothing to quote, so the fallback is the Solo rate (the cheapest
     real plan) rather than an invented middle-of-the-road number. */
  const plan = planFor(policy?.coverType);
  const monthsCovered = FREQUENCIES.find((f) => f.value === frequency)?.months || 1;
  const monthlyRate = Number(policy?.monthlyPremium) || plan.monthly;
  const dueNow = monthlyRate * monthsCovered;

  /* ---- lookup: the ONE real call in this component ---- */
  async function findPlan(event) {
    event.preventDefault();
    const value = idNumber.trim();
    if (!value) {
      setError('Enter your National ID number to continue.');
      return;
    }

    setStatus('searching');
    setError('');

    try {
      const result = await checkCover({ policyNumber: value });
      if (result?.found) {
        setPolicy({
          policyNumber: value.toUpperCase(),
          coverType: result.coverType,
          coverStatus: result.status,
          coveredCount: result.coveredCount,
        });
        setStatus('plan');
      } else {
        setStatus('lookup');
        setError(result?.message || 'We could not find a cover for that ID number.');
      }
    } catch (err) {
      setStatus('lookup');
      setError(
        err instanceof InsuranceApiError && err.status < 500
          ? err.message
          : 'We could not check that ID number just now. Please try again, or call us on ' +
          CONTACT.phone +
          '.',
      );
    }
  }

  async function beginPayment(event) {
    event?.preventDefault();
    const normalizedPhone = phoneNumber ? normalizeKenyanPhone(phoneNumber) : '';
    if (phoneNumber && !normalizedPhone) {
      setPaymentError('Enter a valid Kenyan mobile number, such as 0712 345 678.');
      return;
    }
    if (!paymentCode && !normalizedPhone) {
      setPaymentError('Enter a valid Kenyan mobile number, such as 0712 345 678.');
      return;
    }
    if (policyInactive) {
      setPaymentError('Your application must be approved before you can pay.');
      return;
    }

    setPaymentState('starting');
    setPaymentError('');
    setPaymentReference('');
    setPaymentDetails(null);
    try {
      const result = await startPayment({
        policyNumber: policy.policyNumber,
        policyCode: paymentCode || policy.policyCode,
        phoneNumber: normalizedPhone,
        months: monthsCovered,
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
          : 'We could not start the M-Pesa request. Please try again or call ' + CONTACT.phone + '.',
      );
    }
  }

  useEffect(() => {
    if (!paymentCode || status !== 'plan' || !policy || automaticPaymentStarted.current) return;
    automaticPaymentStarted.current = true;
    beginPayment();
  }, [paymentCode, status, policy]);

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
        // Keep polling through temporary gateway or network errors.
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
    setStatus('lookup');
    setIdNumber('');
    setFrequency('monthly');
    setPhoneNumber('');
    setPaymentState('idle');
    setPaymentReference('');
    setPaymentDetails(null);
    setPaymentError('');
    setPolicy(null);
    setError('');
  }

  /* Only ever the last 4 digits — the design never showed the full ID back,
     and the full number is not something to echo into a receipt. */
  const memberRef = idNumber.length >= 4 ? idNumber.slice(-4) : '';
  const coverLabel = policy ? `Amani ${policy.coverType} Cover` : 'Amani Solo Cover';
  const applicationPending = String(policy?.coverStatus || '').toLowerCase() === 'pending';
  const policyInactive = policy && !['active', 'pending'].includes(String(policy.coverStatus || '').toLowerCase());

  return (
    <div className="amani-pay">
      <style>{PAY_STYLES}</style>

      <div className="payment-shell">
        {/* ---------- LEFT: solid-black brand panel (ipay mock layout) ---------- */}
        <section className="brand-panel" aria-label="Montenzuma Mona Lisa information">
          <div className="brand-panel__content">
            <div className="brand-logo">
              <h1>Montenzuma</h1>
              <span>Mona Lisa Funeral Home</span>
            </div>

            <div className="hero-copy">
              <h1>
                &ldquo;Providing dignity, respect, and peace of mind for your family&rsquo;s future.&rdquo;
              </h1>
              <p>Your Amani Cover ensures that during difficult times, financial burdens are the last thing your family needs to worry about.</p>
              <div className="secure-pill">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>256-bit Secured Payment</span>
              </div>
            </div>

            <div className="brand-panel__footer">
              <span>&copy; {new Date().getFullYear()} Montenzuma Mona Lisa</span>
            </div>
          </div>
        </section>

        {/* ---------- RIGHT: form panel ---------- */}
        <section className="form-panel" aria-label="Payment form">
          <div className="form-panel__inner">{/* ---- 1. LOOKUP ---- */}
            {status === 'lookup' && (
              <div className="state-view">
                <div className="form-heading">
                  <div className="form-heading__kicker">MEMBER PAYMENT PORTAL</div>
                  <h2>Find your cover</h2>
                  <p>
                    Enter your National ID and we&rsquo;ll securely look up your contribution
                    details.
                  </p>
                </div>

                <form onSubmit={findPlan} className="payment-form lookup-form">
                  <label className="field">
                    <span>National ID number</span>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      spellCheck="false"
                      value={idNumber}
                      onChange={(event) => setIdNumber(event.target.value)}
                      placeholder="Enter your ID number"
                      aria-label="National ID number"
                      aria-invalid={Boolean(error)}
                    />
                  </label>

                  <button className="pay-button" type="submit">
                    <Search size={18} aria-hidden="true" />
                    Find my plan
                  </button>
                </form>

                {error && (
                  <p className="pay-error" role="alert">
                    {error}
                  </p>
                )}

                <Link className="payment-apply-link" to="/amani/cover#plans">
                  New to Amani? Choose a cover and apply
                </Link>

                <div className="form-note">
                  <LockKeyhole size={14} aria-hidden="true" />
                  <span>Your details are private and secure.</span>
                </div>

                <div className="payment-trust">
                  <span>
                    <ShieldCheck size={13} aria-hidden="true" /> SECURE LOOKUP
                  </span>
                  <span className="trust-divider" />
                  <strong>AMANI COVER</strong>
                </div>
              </div>
            )}

            {/* ---- 2. SEARCHING ---- */}
            {status === 'searching' && (
              <div className="state-view centered-state" role="status" aria-live="polite">
                <div className="pending-orbit">
                  <div className="pending-orbit__dot" />
                </div>
                <div className="form-heading form-heading--center">
                  <div className="form-heading__kicker">SECURE LOOKUP</div>
                  <h2>Finding your cover</h2>
                  <p>We&rsquo;re checking your membership details. This will only take a moment.</p>
                </div>
              </div>
            )}

            {/* ---- 3. PLAN FOUND ---- */}
            {status === 'plan' && (
              <div className="state-view">
                <div className="form-heading">
                  <div className="form-heading__kicker form-heading__kicker--green">
                    {applicationPending ? 'APPLICATION PENDING' : 'PLAN FOUND'}
                  </div>
                  <h2>{applicationPending ? 'Application under review' : 'Contribution details'}</h2>
                  <p>{paymentCode ? 'We are sending a secure M-Pesa prompt to the phone number on your application.' : 'Review your contribution, then request a secure M-Pesa prompt on your phone.'}</p>
                </div>

                <div className="plan-summary plan-summary--large">
                  <div>
                    <span className="summary-label">YOUR PLAN</span>
                    <strong>{coverLabel}</strong>
                    {policy?.policyNumber && <small>Policy number: {policy.policyNumber}</small>}
                    {policy?.coveredCount > 1 && (
                      <small>
                        {policy.coveredCount} people covered
                        {policy?.coverStatus === 'pending' ? ' · under review' : ''}
                      </small>
                    )}
                    {memberRef && <small>Member ID ending {memberRef}</small>}
                  </div>
                  <div className="summary-amount">
                    <span className="summary-label">
                      CONTRIBUTION {monthsCovered > 1 ? `FOR ${monthsCovered} MONTHS` : 'PER MONTH'}
                    </span>
                    <strong>{formatPlanAmount(policy?.coverType, dueNow)}</strong>
                    {monthsCovered > 1 && (
                      <small>
                        {formatKes(monthlyRate)} x {monthsCovered} months
                      </small>
                    )}
                  </div>
                </div>

                {/* Contribution frequency updates the quoted amount above. */}
                <fieldset className="freq">
                  <legend className="field-legend">How often would you like to pay?</legend>
                  <div className="freq-options">
                    {FREQUENCIES.map((option) => (
                      <label
                        key={option.value}
                        className={`freq-option${frequency === option.value ? ' is-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="pay-frequency"
                          value={option.value}
                          checked={frequency === option.value}
                          onChange={() => setFrequency(option.value)}
                        />
                        <span className="freq-option__label">{option.label}</span>
                        <span className="freq-option__hint">{option.hint}</span>
                        <span className="freq-option__amount">
                          KES {formatKes(plan.monthly * option.months)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {policyInactive ? (
                  <div className="payment-contact-card" role="note">
                    <strong>{applicationPending ? 'Your application is under review' : 'This policy is not active'}</strong>
                    <p>This application is not active cover yet. Our team must approve it before a contribution can be paid.</p>
                    <a className="pay-button" href={CONTACT.phoneHref}><Phone size={18} aria-hidden="true" />Call {CONTACT.phone}</a>
                  </div>
                ) : paymentState === 'pending' ? (
                  <div className="payment-contact-card" role="status" aria-live="polite">
                    <div className="spinner-container" aria-hidden="true"><div className="spinner" /></div>
                    <strong>Awaiting PIN Entry</strong>
                    <p>
                      An M-Pesa prompt has been sent to your phone. Please enter your M-Pesa PIN to
                      authorize the payment for policy <strong>{policy?.policyNumber || idNumber}</strong>.
                    </p>
                    {maskPhone(phoneNumber)
                      ? <p>Waiting for your response on <span className="phone-placeholder">{maskPhone(phoneNumber)}</span>&hellip;</p>
                      : <p>Check the prompt on your registered M-Pesa number&hellip;</p>}
                    <small>Payment reference: {paymentReference}</small>
                    <button className="pay-button" type="button" disabled style={{ marginTop: 16 }}>
                      <Clock size={18} aria-hidden="true" /> Processing Payment
                    </button>
                  </div>
                ) : paymentState === 'paid' ? (
                  <div role="status" aria-live="polite">
                    <div className="success-icon-wrap" aria-hidden="true">
                      <svg className="checkmark" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="success-title">Payment Complete</div>
                    <p className="success-text">
                      Your Amani Cover premium has been received. Your family is protected for this period.
                    </p>
                    <div className="receipt-box">
                      <div className="receipt-row">
                        <span className="receipt-label">Amount Paid</span>
                        <span className="receipt-value">KES {formatKes(paymentDetails?.amount || dueNow)}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">M-Pesa Ref</span>
                        <span className="receipt-value">{paymentDetails?.receipt || '—'}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Policy Number</span>
                        <span className="receipt-value">{policy?.policyNumber || idNumber}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Payment Reference</span>
                        <span className="receipt-value">{paymentReference}</span>
                      </div>
                    </div>
                    <button className="btn btn-success" type="button" onClick={reset}>Finish</button>
                  </div>
                ) : paymentState === 'failed' ? (
                  <div role="alert">
                    <div className="fail-icon-wrap" aria-hidden="true">!</div>
                    <div className="fail-title">Payment Not Completed</div>
                    <p className="success-text">
                      {paymentDetails?.failureReason || paymentDetails?.resultDescription || 'The M-Pesa request was cancelled or could not be completed.'}
                    </p>
                    {paymentDetails?.retryable && <p className="retry-hint">You can safely try again &mdash; you were not charged.</p>}
                    <p className="ref-line">Payment reference: {paymentReference}</p>
                    <button className="pay-button" type="button" onClick={() => setPaymentState('idle')}>
                      {paymentDetails?.retryable ? 'Try again' : 'Start a new payment'}
                    </button>
                  </div>
                ) : (
                  <form className="payment-form" onSubmit={beginPayment}>
                    {!paymentCode && <label className="field">
                      <span>M-Pesa phone number</span>
                      <input required type="tel" inputMode="tel" autoComplete="tel" value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="e.g. 0712 345 678" aria-label="M-Pesa phone number"
                        aria-invalid={Boolean(paymentError)} />
                    </label>}
                    {paymentError && <p className="pay-error" role="alert">{paymentError}</p>}
                    <button className="pay-button" type="submit" disabled={paymentState === 'starting'}>
                      <Phone size={18} aria-hidden="true" />
                      {paymentState === 'starting' ? 'Requesting M-Pesa prompt…' : paymentCode ? 'Send M-Pesa prompt again' : 'Pay ' + formatPlanAmount(policy?.coverType, dueNow) + ' with M-Pesa'}
                    </button>
                    <p className="form-note">An STK prompt will be sent to your registered M-Pesa number. Your PIN is entered only on your phone.</p>
                  </form>
                )}

                {!paymentCode && <button className="text-button" type="button" onClick={reset}>
                  Use a different ID
                </button>}
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}
