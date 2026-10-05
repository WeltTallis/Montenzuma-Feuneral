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

  There is no Daraja / Safaricom payment endpoint in this codebase. The portal
  shows the verified contribution and hands off to the care team instead of
  pretending to send an M-Pesa prompt or confirm a payment.

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
   ========================================================================== */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, Phone, Search, ShieldCheck } from 'lucide-react';
import { CONTACT, formatPlanAmount, planFor } from './amaniData';
import { FillImage } from './AmaniUi';
import { InsuranceApiError, checkCover } from '../../../api/insuranceApi';

const formatKes = (value) => Number(value || 0).toLocaleString('en-KE');

/* How often a member may pay. `months` is how many monthly contributions one
   payment covers. Quarterly is three months at the monthly rate and carries NO
   discount on purpose: there is no pricing engine in this codebase, so
   advertising a "save X%" the backend cannot honour would be a false promise.
   If Amani wants a multi-month discount it belongs in PLANS as a real rate. */
const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', months: 1, hint: 'Every month' },
  { value: 'quarterly', label: 'Quarterly', months: 3, hint: 'Every 3 months' },
];

/* The prototype's stylesheet, scoped. Colours are its own design tokens
   (--navy/--cobalt/...), deliberately NOT the Amani ac-* palette: this
   screen is a member payment portal with its own identity, and mixing the
   two made the layout read as "a different product". */
const PAY_STYLES = `
  .amani-pay {
    --pay-navy: #173c5a;
    --pay-navy-deep: #102f49;
    --pay-cobalt: #547895;
    --pay-ink: #293946;
    --pay-slate: #596b78;
    --pay-line: #dce4e8;
    --pay-wash: #f4f7f8;
    --pay-green: #557565;
    --pay-brass: #92764c;
  }

  /* EMBEDDED, NOT FULL-PAGE
     The prototype ran edge to edge at 100svh because it WAS the whole app.
     Here the portal is a section inside the normal Amani page, which already
     has a nav, a page header and a footer. Left at 100svh it would push the
     "Need a hand?" block a full screen further down, so the height is capped
     and the panel is rounded to sit in the page like the other Amani blocks.
     Everything inside keeps the prototype's proportions and spacing. */
  .amani-pay .payment-shell {
    display: grid;
    min-height: min(90svh, 42rem);
    grid-template-columns: minmax(360px, 0.95fr) minmax(460px, 1.05fr);
    overflow: hidden;
    border: 1px solid var(--pay-line);
    border-radius: 1.5rem;
    background: var(--pay-wash);
    color: var(--pay-ink);
    font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
    box-shadow: 0 18px 50px -24px rgba(16,47,73,.22);
  }

  .amani-pay .brand-panel {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background: linear-gradient(145deg, #274e6b 0%, var(--pay-navy) 62%, #102f49 100%);
    color: white;
  }
  .amani-pay .brand-panel__content { position: relative; z-index: 2; display: flex; min-height: 100%; flex-direction: column; padding: clamp(2rem, 5vw, 4.25rem); }
  .amani-pay .brand-panel__image { position: absolute; inset: 0; z-index: -3; width: 100%; height: 100%; object-fit: cover; object-position: 58% center; opacity: .82; }
  .amani-pay .brand-panel__shade { position: absolute; inset: 0; z-index: -2; background: linear-gradient(90deg, rgba(16,47,73,.94) 0%, rgba(23,60,90,.82) 48%, rgba(23,60,90,.48) 100%), linear-gradient(0deg, rgba(16,47,73,.66), transparent 60%); }
  .amani-pay .brand-mark { display: flex; align-items: center; gap: .7rem; }
  .amani-pay .brand-mark__name { font-size: 1.05rem; font-weight: 700; letter-spacing: -.02em; }
  .amani-pay .hero-copy { max-width: 33rem; margin: auto 0; padding: 5rem 0; }
  .amani-pay .eyebrow,
  .amani-pay .form-heading__kicker { display: flex; align-items: center; gap: .45rem; color: #ddcba5; font-size: .67rem; font-weight: 800; letter-spacing: .16em; }
  .amani-pay .hero-copy h1,
  .amani-pay .form-heading h2 { font-family: 'Cormorant Garamond', Georgia, serif; letter-spacing: 0; }
  .amani-pay .hero-copy h1 { margin: 1.5rem 0 1.45rem; font-size: 3.55rem; font-weight: 500; line-height: 1.02; }
  .amani-pay .hero-copy h1 em { color: #dfd0ad; font-style: italic; }
  .amani-pay .hero-copy p { max-width: 30rem; color: #e0e8ed; font-size: 1rem; line-height: 1.75; }
  .amani-pay .secure-pill { display: inline-flex; align-items: center; gap: .55rem; margin-top: 2.2rem; padding: .75rem 1rem; border: 1px solid #ffffff2d; border-radius: 999px; background: #ffffff0d; color: #e3efff; font-size: .75rem; backdrop-filter: blur(10px); }
  .amani-pay .secure-pill svg { color: #d5c19a; }
  .amani-pay .brand-panel__footer { display: flex; align-items: center; gap: .75rem; color: #a8bdd9; font-size: .7rem; letter-spacing: .02em; }
  .amani-pay .footer-dot { width: 3px; height: 3px; border-radius: 50%; background: #7f9abd; }

  .amani-pay .form-panel { display: flex; align-items: center; justify-content: center; background: #fbfcfc; padding: clamp(2rem, 5vw, 5rem); }
  .amani-pay .form-panel__inner { width: min(100%, 34rem); }
  .amani-pay .state-view { width: 100%; }
  .amani-pay .form-heading { max-width: 31rem; }
  .amani-pay .form-heading h2 { margin: .7rem 0 .65rem; color: var(--pay-navy-deep); font-size: 2.45rem; font-weight: 500; line-height: 1.08; }
  .amani-pay .form-heading p { max-width: 29rem; color: var(--pay-slate); font-size: .92rem; line-height: 1.6; }
  .amani-pay .form-heading__kicker { color: var(--pay-brass); }
  .amani-pay .form-heading__kicker--green { color: var(--pay-green); }
  .amani-pay .payment-form { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 2.4rem; }
  .amani-pay .field { display: flex; flex-direction: column; gap: .55rem; color: var(--pay-ink); font-size: .72rem; font-weight: 800; }
  .amani-pay .field input { width: 100%; height: 3.35rem; border: 1px solid var(--pay-line); border-radius: .65rem; background: var(--pay-wash); padding: 0 1rem; color: var(--pay-ink); font: 500 .95rem 'DM Sans', ui-sans-serif, system-ui, sans-serif; transition: border-color .2s, box-shadow .2s, background .2s; }
  .amani-pay .field input::placeholder { color: #9aa9ba; }
  .amani-pay .field input:focus { outline: none; border-color: var(--pay-cobalt); background: white; box-shadow: 0 0 0 4px rgba(84,120,149,.14); }
  .amani-pay .field input[aria-invalid="true"] { border-color: #d64545; }

  
  .amani-pay .pay-error { display: flex; gap: .45rem; margin-top: 1rem; color: #b42318; font-size: .78rem; line-height: 1.5; }
  .amani-pay .amount-input { display: flex; align-items: center; height: 3.35rem; border: 1px solid var(--pay-line); border-radius: .65rem; background: var(--pay-wash); padding-left: 1rem; transition: border-color .2s, box-shadow .2s, background .2s; }
  .amani-pay .amount-input:focus-within { border-color: var(--pay-cobalt); background: white; box-shadow: 0 0 0 4px rgba(84,120,149,.14); }
  .amani-pay .amount-input span { color: var(--pay-slate); font-size: .82rem; font-weight: 800; }
  .amani-pay .amount-input input { height: 100%; border: 0; background: transparent; padding-left: .7rem; }
  .amani-pay .amount-input input:focus { box-shadow: none; }

  .amani-pay .pay-button { display: flex; align-items: center; justify-content: center; gap: .65rem; width: 100%; height: 3.45rem; margin-top: .35rem; border: 0; border-radius: .65rem; background: var(--pay-navy); color: white; cursor: pointer; font-size: .92rem; font-weight: 800; transition: transform .2s, background .2s, box-shadow .2s; }
  .amani-pay .pay-button:hover:not(:disabled) { background: var(--pay-cobalt); box-shadow: 0 10px 22px rgba(23,60,90,.2); transform: translateY(-2px); }
  .amani-pay .pay-button:disabled { opacity: .6; cursor: not-allowed; }
  .amani-pay a.pay-button { text-decoration: none; }
  .amani-pay .payment-apply-link { display: block; margin-top: 1.2rem; color: var(--pay-cobalt); font-size: .82rem; font-weight: 800; text-align: center; text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .payment-contact-card { margin-top: 1.5rem; padding: 1.1rem; border: 1px solid var(--pay-line); border-radius: .85rem; background: var(--pay-wash); }
  .amani-pay .payment-contact-card strong { color: var(--pay-navy); font-size: .9rem; }
  .amani-pay .payment-contact-card p { margin: .45rem 0 1rem; color: var(--pay-slate); font-size: .78rem; line-height: 1.55; }

  .amani-pay .form-note { display: flex; align-items: center; justify-content: center; gap: .45rem; margin-top: 1.25rem; color: #8593a4; font-size: .7rem; }
  .amani-pay .form-note svg { color: var(--pay-green); }
  .amani-pay .payment-trust { display: flex; align-items: center; justify-content: center; gap: .8rem; margin-top: 2.8rem; color: #a0adbb; font-size: .59rem; font-weight: 800; letter-spacing: .12em; }
  .amani-pay .payment-trust strong { color: #18a875; font-size: .7rem; letter-spacing: .04em; }
  .amani-pay .trust-divider { width: 1px; height: .85rem; background: var(--pay-line); }

  .amani-pay .centered-state { display: flex; align-items: center; flex-direction: column; text-align: center; }
  .amani-pay .form-heading--center { margin-top: 2rem; }
  .amani-pay .form-heading--center p { max-width: 25rem; }
  .amani-pay .pending-orbit { display: grid; width: 6rem; height: 6rem; place-items: center; border: 1px solid #cfe0f5; border-radius: 50%; background: #f5f9ff; box-shadow: 0 0 0 12px #f5f9ff; animation: amanipay-pulse 1.8s ease-in-out infinite; }
  .amani-pay .pending-orbit__dot { width: 2.1rem; height: 2.1rem; border: 3px solid #d8e5f5; border-top-color: var(--pay-cobalt); border-radius: 50%; animation: amanipay-spin 1s linear infinite; }
  @keyframes amanipay-spin { to { transform: rotate(360deg); } }
  @keyframes amanipay-pulse { 50% { box-shadow: 0 0 0 20px #f5f9ff; } }

  /* Plan-found summary, receipt, history, secondary button */
  .amani-pay .plan-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding: 1.1rem 1.25rem; border: 1px solid #e1eee8; border-radius: .85rem; background: #f7fcf9; }
  .amani-pay .summary-label { display: block; color: #719080; font-size: .62rem; font-weight: 800; letter-spacing: .14em; }
  .amani-pay .plan-summary strong { display: block; margin-top: .3rem; color: var(--pay-ink); font-size: 1rem; }
  .amani-pay .plan-summary small { display: block; margin-top: .2rem; color: var(--pay-slate); font-size: .7rem; }
  .amani-pay .summary-amount { text-align: right; }
  .amani-pay .summary-amount strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.65rem; font-weight: 600; }

  .amani-pay .success-badge { display: grid; width: 5.75rem; height: 5.75rem; place-items: center; border-radius: 50%; background: #dff7ec; color: var(--pay-green); }
  .amani-pay .receipt-card { display: flex; align-items: center; flex-direction: column; gap: .35rem; width: 100%; margin: 2rem 0; padding: 1.2rem; border: 1px solid #e1eee8; border-radius: .75rem; background: #f7fcf9; }
  .amani-pay .receipt-card span { color: #719080; font-size: .62rem; font-weight: 800; letter-spacing: .14em; }
  .amani-pay .receipt-card strong { color: var(--pay-ink); font-family: Georgia, serif; font-size: 2rem; font-weight: 400; }
  .amani-pay .receipt-card small { color: #8aa395; font-family: monospace; font-size: .7rem; }

  .amani-pay .contribution-history { width: 100%; margin-top: .35rem; padding: 1rem; border: 1px solid var(--pay-line); border-radius: .85rem; background: #fbfcfe; text-align: left; }
  .amani-pay .history-heading { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: .75rem; border-bottom: 1px solid var(--pay-line); }
  .amani-pay .history-heading h3 { margin-top: .22rem; color: var(--pay-ink); font-family: Georgia, serif; font-size: 1.15rem; font-weight: 400; }
  .amani-pay .history-heading svg { color: var(--pay-cobalt); }
  .amani-pay .history-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 0; border-bottom: 1px solid #edf1f5; }
  .amani-pay .history-row div:last-child { text-align: right; }
  .amani-pay .history-row strong { display: block; color: var(--pay-ink); font-size: .78rem; }
  .amani-pay .history-row small { display: block; margin-top: .2rem; color: var(--pay-slate); font-size: .68rem; }
  .amani-pay .history-row--current strong:first-child { color: var(--pay-green); }
  .amani-pay .history-total { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-top: .85rem; color: var(--pay-slate); font-size: .72rem; }
  .amani-pay .history-total strong { color: var(--pay-navy); font-size: .9rem; }

  .amani-pay .text-button { display: block; width: 100%; margin-top: 1.1rem; border: 0; background: none; color: var(--pay-slate); cursor: pointer; font-size: .78rem; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .text-button:hover { color: var(--pay-cobalt); }
  .amani-pay .secondary-button { width: 100%; height: 3.2rem; margin-top: 2rem; border: 1px solid var(--pay-line); border-radius: .65rem; background: white; color: var(--pay-navy); cursor: pointer; font-weight: 800; }
  .amani-pay .secondary-button:hover { border-color: var(--pay-cobalt); background: var(--pay-wash); }
  .amani-pay .mock-note { margin-top: 1rem; padding: .7rem .9rem; border: 1px dashed #e0b64a; border-radius: .5rem; background: #fffaeb; color: #7a5a08; font-size: .72rem; line-height: 1.5; }

  /* Payment frequency picker — two big tap targets, monthly / quarterly. */
  .amani-pay .freq { margin-top: 1.4rem; padding: 0; border: 0; }
  .amani-pay .field-legend { margin-bottom: .55rem; color: var(--pay-ink); font-size: .72rem; font-weight: 800; }
  .amani-pay .freq-options { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
  .amani-pay .freq-option { position: relative; display: flex; flex-direction: column; gap: .18rem; padding: .85rem .95rem; border: 1px solid var(--pay-line); border-radius: .65rem; background: var(--pay-wash); cursor: pointer; transition: border-color .2s, background .2s, box-shadow .2s; }
  .amani-pay .freq-option:hover { border-color: #b9cde6; background: white; }
  .amani-pay .freq-option.is-active { border-color: var(--pay-cobalt); background: white; box-shadow: 0 0 0 3px #1f5fca14; }
  .amani-pay .freq-option input { position: absolute; opacity: 0; pointer-events: none; }
  /* Keyboard focus still needs a visible ring, since the input is invisible. */
  .amani-pay .freq-option:has(input:focus-visible) { outline: 2px solid var(--pay-cobalt); outline-offset: 2px; }
  .amani-pay .freq-option__label { color: var(--pay-ink); font-size: .82rem; font-weight: 800; }
  .amani-pay .freq-option__hint { color: var(--pay-slate); font-size: .66rem; }
  .amani-pay .freq-option__amount { margin-top: .3rem; color: var(--pay-navy); font-size: .88rem; font-weight: 800; }
  .amani-pay .freq-option.is-active .freq-option__amount { color: var(--pay-cobalt); }
  /* Stack earlier than the prototype's 760px. The two-panel grid needs ~820px
     of CONTENT width (360 + 460), and this portal sits inside the page's
     max-w-5xl with px-4 sm:px-6 lg:px-10 - so at 760px of viewport only ~712px
     was left and the columns squeezed. 900px is the first viewport width where
     both tracks still fit comfortably. */
  @media (max-width: 900px) {
    .amani-pay .payment-shell { display: block; min-height: 0; }
    .amani-pay .brand-panel { min-height: 21rem; }
    .amani-pay .brand-panel__content { padding: 1.7rem 1.5rem; }
    .amani-pay .hero-copy { padding: 2.5rem 0 1.75rem; }
    .amani-pay .hero-copy h1 { margin: 1rem 0; font-size: 2.7rem; }
    .amani-pay .hero-copy p { display: none; }
    .amani-pay .secure-pill { margin-top: 1.4rem; }
    .amani-pay .brand-panel__footer { display: none; }
    /* min-height:0 - the prototype's 38rem filled a whole viewport; as a
       stacked section the form should be exactly as tall as its content. */
    .amani-pay .form-panel { min-height: 0; padding: 2.75rem 1.5rem; }
    .amani-pay .plan-summary { flex-direction: column; align-items: flex-start; gap: .75rem; }
    .amani-pay .summary-amount { text-align: left; }
    .amani-pay .form-heading h2 { font-size: 2rem; }
    .amani-pay .freq-options { grid-template-columns: 1fr; }
  }
`;

export default function AmaniPayPortal() {
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState('lookup');
  const [frequency, setFrequency] = useState('monthly');

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
  const monthlyRate = plan.monthly;
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

  function reset() {
    setStatus('lookup');
    setIdNumber('');
    setFrequency('monthly');
    setPolicy(null);
    setError('');
  }

  /* Only ever the last 4 digits — the design never showed the full ID back,
     and the full number is not something to echo into a receipt. */
  const memberRef = idNumber.length >= 4 ? idNumber.slice(-4) : '';
  const coverLabel = policy ? `Amani ${policy.coverType} Cover` : 'Amani Solo Cover';
  const applicationPending = String(policy?.coverStatus || '').toLowerCase() === 'pending';

  return (
    <div className="amani-pay">
      <style>{PAY_STYLES}</style>

      <div className="payment-shell">
      {/* ---------- LEFT: branded photo panel ---------- */}
      <section className="brand-panel" aria-label="Amani Cover information">
        <FillImage
          className="brand-panel__image"
          src="/amani/images/family-protection.png"
          alt="Family holding hands in a warm, reassuring moment"
          sizes="(max-width: 760px) 100vw, 46vw"
        />
        <div className="brand-panel__shade" />

        <div className="brand-panel__content">
          <div className="brand-mark">
            <span className="brand-mark__name">Amani Cover</span>
          </div>

          <div className="hero-copy">
            <div className="eyebrow">FUNERAL INSURANCE</div>
            <h1>
              Protect what
              <br />
              <em>matters most.</em>
            </h1>
            <p>Simple, dignified cover for your family, with clear contributions and a real team to help.</p>
            <div className="secure-pill">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>Trusted family protection</span>
            </div>
          </div>

          <div className="brand-panel__footer">
            <span>Montenzuma Monalisa Funeral Home</span>
            <span className="footer-dot" />
            <span>Since 1998</span>
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
                <p>Review your plan and contribution. Our team can confirm your payment steps.</p>
              </div>

              <div className="plan-summary plan-summary--large">
                <div>
                  <span className="summary-label">YOUR PLAN</span>
                  <strong>{coverLabel}</strong>
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

              <div className="payment-contact-card" role="note">
                <strong>{applicationPending ? 'Your application is under review' : 'Need to make a contribution?'}</strong>
                <p>
                  {applicationPending
                    ? 'This application is not active cover yet. Call our team to confirm its status and next steps.'
                    : 'Online payment is not available here yet. No payment has been taken. Call our team for the current payment steps.'}
                </p>
                <a className="pay-button" href={CONTACT.phoneHref}>
                  <Phone size={18} aria-hidden="true" />
                  Call {CONTACT.phone}
                </a>
              </div>

              <button className="text-button" type="button" onClick={reset}>
                Use a different ID
              </button>
            </div>
          )}

        </div>
      </section>
      </div>
    </div>
  );
}