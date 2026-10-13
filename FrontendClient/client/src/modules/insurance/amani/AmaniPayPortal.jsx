/* ==========================================================================
   Amani Cover — MEMBER PAYMENT PORTAL

   The payments SECTION of /amani/payments (AmaniPayments renders the page
   shell around this). A focused find → review → pay flow with a progress
   stepper, a contribution summary and a compact single-column layout on mobile.

   WHAT IS REAL AND WHAT IS NOT
   The `lookup → plan` transition calls the real insurance-service
   (POST /insurance/cover-check), which confirms whether an Amani Cover exists
   for the ID number typed. That endpoint returns only whether cover was found
   plus its type/status/count — never the holder's name, phone, email, group
   members or claims — so this portal cannot be used to look a person up.

   Payment links and the M-Pesa STK flow are connected to the insurance and
   M-Pesa services. Payment status is confirmed by the provider callback.

   THE AMOUNT IS NOT A GUESS
   The contribution is derived from the plan the cover-check told us about
   (PLANS in amaniData.js): Solo 500, Family 1,000, Group from 10,000.
   The member picks monthly or quarterly on top of that.

   DESIGN (this revision)
   • Palette: deep navy + teal, aqua highlights, cool-mist page. No borders —
     separation comes from soft shadows and tinted fills.
   • Fonts match the main Amani site (Merriweather + Source Sans 3, loaded by
     AmaniCover.css).
   • Every rule is scoped under `.amani-pay` so nothing leaks into the host app.

   FIXES IN THIS REVISION
   • Full-bleed no longer uses width:100vw (it caused a horizontal scrollbar);
     the page colour is painted edge-to-edge with a clipped box-shadow instead.
   • Stepper: the "Pay" step now turns green-tick/done once payment succeeds
     (it used to stay "active" forever).
   • Polling no longer dies silently after ~5 minutes: the member gets a
     "still waiting" card with a "Check again" button.
   • On a payment link the summary no longer labels the POLICY number's last
     4 digits as "Member ID".
   • Dead branch removed (an "application pending" message inside the
     "policy not active" card could never render).
   • Pending "orbit" spinner was 100% wide (an oval); it is now a circle.
   • Dead CSS from the old two-panel prototype removed; duplicate media
     queries merged.
   • New optional prop `showTopbar` (default true). Pass `false` if
     AmaniPayments already renders <AmaniNav /> above the portal.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Clock, LockKeyhole, Phone, Search, ShieldCheck, X } from 'lucide-react';
import { CONTACT, formatPlanAmount, planFor } from './amaniData';
import { InsuranceApiError, checkCover, startPayment, getPaymentStatus, getPaymentLink } from '../../../api/insuranceApi';

const formatKes = (value) => Number(value || 0).toLocaleString('en-KE');

function normalizeKenyanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return '254' + digits.slice(1);
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return '';
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

/* Poll the payment status every 4s for up to 75 attempts (~5 minutes). */
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 75;

/* Scoped stylesheet. Tokens are the portal's own (--pay-*). */
const PAY_STYLES = `
  .amani-pay {
    --pay-navy: #0b2e4a;
    --pay-navy-deep: #071f33;
    --pay-mid: #0e5a78;
    --pay-teal: #0e7c9b;
    --pay-teal-ink: #0a6882;
    --pay-aqua: #8ed8e6;
    --pay-ink: #12263a;
    --pay-slate: #5a7080;
    --pay-mist: #f5f9fb;
    --pay-tint: #e3f2f6;
    --pay-tint-hover: #d3ecf2;
    --pay-field: #eef4f7;
    --pay-white: #ffffff;
    --pay-green: #15803d;
    --pay-green-soft: #e8f6ec;
    --pay-red: #c0392b;
    --pay-red-soft: #fcebe9;
    --pay-amber: #8a6100;
    --pay-amber-soft: #fff4d6;
    --pay-shadow: 0 1px 2px rgba(11,46,74,.05), 0 14px 36px rgba(11,46,74,.09);
    --pay-serif: 'Merriweather', Georgia, 'Times New Roman', serif;
    --pay-sans: 'Source Sans 3', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;

    position: relative;
    min-height: 100svh;
    color: var(--pay-ink);
    font-family: var(--pay-sans);
    background-color: var(--pay-mist);
    background-image:
      radial-gradient(900px 380px at 50% -120px, #d9edf3 0%, transparent 70%),
      radial-gradient(500px 300px at 100% 0, #e3f3f7 0%, transparent 70%);
    background-repeat: no-repeat;
    /* Full-bleed without width:100vw (which adds a horizontal scrollbar):
       paint the page colour far past both edges, then clip it to the viewport. */
    box-shadow: 0 0 0 100vmax var(--pay-mist);
    clip-path: inset(0 -100vmax);
  }
  .amani-pay *, .amani-pay *::before, .amani-pay *::after { box-sizing: border-box; }
  .amani-pay :focus-visible { outline: 3px solid rgba(14,124,155,.45); outline-offset: 2px; }

  /* ---------- top bar ---------- */
  .amani-pay .portal-topbar,
  .amani-pay .portal-main { width: min(100%, 1080px); margin: 0 auto; padding-right: 24px; padding-left: 24px; }
  .amani-pay .portal-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 20px; padding-bottom: 20px; }
  .amani-pay .portal-brand { display: inline-flex; align-items: center; gap: 12px; color: var(--pay-navy-deep); text-decoration: none; }
  .amani-pay .portal-brand__mark { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 14px; background: linear-gradient(135deg, var(--pay-navy), var(--pay-teal)); color: #fff; box-shadow: 0 6px 16px rgba(14,124,155,.3); }
  .amani-pay .portal-brand__name { font-family: var(--pay-serif); font-size: 1.15rem; font-weight: 700; line-height: 1.1; }
  .amani-pay .portal-brand__sub { display: block; margin-top: .3rem; color: var(--pay-slate); font-family: var(--pay-sans); font-size: .62rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .amani-pay .portal-help { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: #fff; color: var(--pay-navy); box-shadow: 0 4px 16px rgba(11,46,74,.07); font-size: .85rem; font-weight: 700; text-decoration: none; transition: background .2s, box-shadow .2s; }
  .amani-pay .portal-help:hover { background: var(--pay-tint); box-shadow: 0 6px 20px rgba(11,46,74,.12); }
  .amani-pay .portal-help svg { color: var(--pay-teal); }

  /* ---------- page ---------- */
  .amani-pay .portal-main { padding-top: 8px; padding-bottom: 64px; }
  .amani-pay.no-topbar .portal-main { padding-top: 32px; }
  .amani-pay .portal-intro { max-width: 640px; margin: 12px auto 30px; text-align: center; }
  .amani-pay .portal-intro h1 { margin: 0; color: var(--pay-navy-deep); font-family: var(--pay-serif); font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 400; line-height: 1.22; letter-spacing: -.02em; text-wrap: balance; }
  .amani-pay .portal-intro h1 em { color: var(--pay-teal); font-style: italic; }
  .amani-pay .portal-intro p { margin: 14px 0 0; color: var(--pay-slate); font-size: 1.02rem; line-height: 1.6; }

  /* ---------- stepper ---------- */
  .amani-pay .portal-stepper { display: flex; max-width: 560px; margin: 0 auto 26px; padding: 0; list-style: none; }
  .amani-pay .portal-stepper li { position: relative; display: flex; flex: 1; flex-direction: column; align-items: center; gap: 9px; color: var(--pay-slate); font-size: .78rem; font-weight: 700; text-align: center; }
  .amani-pay .portal-stepper li::before { position: absolute; top: 16px; right: calc(50% + 22px); left: calc(-50% + 22px); height: 3px; border-radius: 3px; background: #d8e6ec; content: ''; transition: background .3s; }
  .amani-pay .portal-stepper li:first-child::before { display: none; }
  .amani-pay .portal-stepper li.is-active,
  .amani-pay .portal-stepper li.is-done { color: var(--pay-navy); }
  .amani-pay .portal-stepper__dot { z-index: 1; display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: #fff; color: var(--pay-slate); box-shadow: 0 2px 8px rgba(11,46,74,.1); font-size: .82rem; font-weight: 800; transition: all .3s; }
  .amani-pay .portal-stepper li.is-active .portal-stepper__dot { background: var(--pay-navy); color: #fff; box-shadow: 0 0 0 6px rgba(14,124,155,.18); }
  .amani-pay .portal-stepper li.is-done .portal-stepper__dot { background: var(--pay-teal); color: #fff; box-shadow: 0 4px 12px rgba(14,124,155,.35); }
  .amani-pay .portal-stepper li.is-done::before,
  .amani-pay .portal-stepper li.is-active::before { background: var(--pay-teal); }

  /* ---------- layout ---------- */
  .amani-pay .payment-shell { display: grid; width: 100%; max-width: 580px; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 22px; margin: 0 auto; }
  .amani-pay .payment-shell.has-summary { max-width: 1040px; grid-template-columns: minmax(0, 1fr) 350px; }
  .amani-pay .form-panel { min-width: 0; }
  .amani-pay .form-panel__inner { width: 100%; padding: clamp(24px, 4vw, 40px); border-radius: 22px; background: #fff; box-shadow: var(--pay-shadow); }
  .amani-pay .state-view { width: 100%; }

  /* ---------- headings ---------- */
  .amani-pay .form-heading { max-width: 31rem; }
  .amani-pay .form-heading__kicker { display: flex; align-items: center; gap: .45rem; color: var(--pay-teal-ink); font-size: .72rem; font-weight: 800; letter-spacing: .14em; }
  .amani-pay .form-heading__kicker--green { color: var(--pay-green); }
  .amani-pay .form-heading h2 { margin: .65rem 0 .6rem; color: var(--pay-navy-deep); font-family: var(--pay-serif); font-size: clamp(1.5rem, 3vw, 1.85rem); font-weight: 400; line-height: 1.25; letter-spacing: -.01em; }
  .amani-pay .form-heading p { max-width: 29rem; margin: 0; color: var(--pay-slate); font-size: .98rem; line-height: 1.65; }
  .amani-pay .form-heading--center { margin-top: 2rem; }
  .amani-pay .form-heading--center p { max-width: 25rem; margin-inline: auto; }

  /* ---------- fields ---------- */
  .amani-pay .payment-form { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 2rem; }
  .amani-pay .field { display: flex; flex-direction: column; gap: .55rem; color: var(--pay-ink); font-size: .82rem; font-weight: 700; }
  .amani-pay .field input { width: 100%; height: 3.4rem; padding: 0 1.1rem; border: 0; border-radius: .9rem; background: var(--pay-field); color: var(--pay-ink); font: 500 1rem var(--pay-sans); transition: background .2s, box-shadow .2s; }
  .amani-pay .field input::placeholder { color: #8fa3b3; }
  .amani-pay .field input:focus { outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(14,124,155,.35); }
  .amani-pay .field input[aria-invalid="true"] { background: var(--pay-red-soft); box-shadow: 0 0 0 2px rgba(192,57,43,.55); }
  .amani-pay .pay-error { display: flex; gap: .45rem; margin: 0; padding: .75rem .95rem; border-radius: .8rem; background: var(--pay-red-soft); color: var(--pay-red); font-size: .86rem; line-height: 1.5; }
  .amani-pay .lookup-form + .pay-error { margin-top: 1rem; }

  /* ---------- buttons ---------- */
  .amani-pay .pay-button { display: flex; align-items: center; justify-content: center; gap: .65rem; width: 100%; height: 3.4rem; margin-top: .35rem; border: 0; border-radius: .95rem; background: linear-gradient(135deg, var(--pay-navy) 0%, var(--pay-mid) 60%, var(--pay-teal) 140%); box-shadow: 0 10px 22px rgba(11,46,74,.22); color: #fff; cursor: pointer; font: 700 .98rem var(--pay-sans); transition: transform .18s, box-shadow .2s, filter .2s; }
  .amani-pay .pay-button:hover:not(:disabled) { box-shadow: 0 16px 30px rgba(14,124,155,.32); filter: brightness(1.08); transform: translateY(-2px); }
  .amani-pay .pay-button:active:not(:disabled) { transform: translateY(0); }
  .amani-pay .pay-button:disabled { opacity: .6; cursor: not-allowed; }
  .amani-pay a.pay-button { color: #fff; text-decoration: none; }
  .amani-pay .pay-button--soft { background: #fff; box-shadow: 0 4px 14px rgba(11,46,74,.1); color: var(--pay-navy); }
  .amani-pay .pay-button--soft:hover:not(:disabled) { background: var(--pay-tint); box-shadow: 0 8px 20px rgba(11,46,74,.14); filter: none; }
  .amani-pay .payment-apply-link { display: block; margin-top: 1.3rem; color: var(--pay-teal-ink); font-size: .92rem; font-weight: 700; text-align: center; text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .payment-apply-link:hover { color: var(--pay-navy); }
  .amani-pay .text-button { display: block; width: 100%; margin-top: 1.1rem; padding: .4rem; border: 0; background: none; color: var(--pay-slate); cursor: pointer; font: 600 .88rem var(--pay-sans); text-decoration: underline; text-underline-offset: 3px; }
  .amani-pay .text-button:hover { color: var(--pay-teal); }

  .amani-pay .form-note { display: flex; align-items: center; justify-content: center; gap: .45rem; margin: 1.1rem 0 0; color: #7a8d9c; font-size: .8rem; line-height: 1.5; text-align: center; }
  .amani-pay .form-note svg { flex: none; color: var(--pay-green); }
  .amani-pay .payment-trust { display: flex; align-items: center; justify-content: center; gap: .8rem; margin-top: 2rem; padding-top: 0; color: #8fa3b3; font-size: .66rem; font-weight: 800; letter-spacing: .12em; }
  .amani-pay .payment-trust span { display: inline-flex; align-items: center; gap: .35rem; }
  .amani-pay .payment-trust strong { color: var(--pay-teal-ink); font-size: .72rem; letter-spacing: .06em; }
  .amani-pay .trust-divider { width: 4px; height: 4px; border-radius: 50%; background: #c3d3dc; }

  /* ---------- waiting spinner ---------- */
  .amani-pay .centered-state { display: flex; align-items: center; flex-direction: column; text-align: center; }
  .amani-pay .pending-orbit { display: grid; width: 6rem; height: 6rem; margin: 0 auto; place-items: center; border-radius: 50%; background: var(--pay-tint); box-shadow: 0 0 0 12px #f0f8fa; animation: amanipay-pulse 1.8s ease-in-out infinite; }
  .amani-pay .pending-orbit__dot { width: 2.2rem; height: 2.2rem; border: 3px solid #c9e3ea; border-top-color: var(--pay-teal); border-radius: 50%; animation: amanipay-spin 1s linear infinite; }
  @keyframes amanipay-spin { to { transform: rotate(360deg); } }
  @keyframes amanipay-pulse { 50% { box-shadow: 0 0 0 20px #f0f8fa; } }

  /* ---------- frequency picker ---------- */
  .amani-pay .freq { min-width: 0; margin: 1.8rem 0 0; padding: 0; border: 0; }
  .amani-pay .field-legend { margin-bottom: .7rem; padding: 0; color: var(--pay-ink); font-size: .82rem; font-weight: 700; }
  .amani-pay .freq-options { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
  .amani-pay .freq-option { position: relative; display: flex; flex-direction: column; gap: .2rem; padding: 1rem 1.1rem; border-radius: 1rem; background: var(--pay-field); cursor: pointer; transition: background .2s, box-shadow .2s, transform .18s; }
  .amani-pay .freq-option:hover { background: var(--pay-tint); }
  .amani-pay .freq-option:has(input:disabled) { cursor: not-allowed; opacity: .7; }
  .amani-pay .freq-option input { position: absolute; opacity: 0; pointer-events: none; }
  .amani-pay .freq-option:has(input:focus-visible) { outline: 3px solid rgba(14,124,155,.45); outline-offset: 2px; }
  .amani-pay .freq-option__label { color: var(--pay-ink); font-size: .95rem; font-weight: 700; }
  .amani-pay .freq-option__hint { color: var(--pay-slate); font-size: .78rem; }
  .amani-pay .freq-option__amount { margin-top: .4rem; color: var(--pay-navy); font-size: 1.02rem; font-weight: 800; }
  /* Selected = filled navy card (clear without needing a border). */
  .amani-pay .freq-option.is-active { background: linear-gradient(135deg, var(--pay-navy), var(--pay-mid)); box-shadow: 0 10px 24px rgba(11,46,74,.24); }
  .amani-pay .freq-option.is-active .freq-option__label,
  .amani-pay .freq-option.is-active .freq-option__amount { color: #fff; }
  .amani-pay .freq-option.is-active .freq-option__hint { color: #b9dbe6; }

  /* ---------- status cards ---------- */
  .amani-pay .payment-contact-card { margin-top: 1.6rem; padding: 1.25rem; border-radius: 1.1rem; background: var(--pay-tint); }
  .amani-pay .payment-contact-card strong { color: var(--pay-navy); font-size: 1rem; }
  .amani-pay .payment-contact-card p { margin: .5rem 0 1rem; color: var(--pay-slate); font-size: .9rem; line-height: 1.6; }
  .amani-pay .payment-contact-card small { display: block; margin-top: .3rem; color: var(--pay-slate); font: 600 .78rem var(--pay-sans); overflow-wrap: anywhere; }
  .amani-pay .payment-contact-card .pay-button { margin-top: .6rem; }
  .amani-pay .payment-contact-card--paid { background: var(--pay-green-soft); }
  .amani-pay .payment-contact-card--failed { background: var(--pay-red-soft); }
  .amani-pay .payment-contact-card--delayed { background: var(--pay-amber-soft); }
  .amani-pay .payment-result-heading { display: flex; align-items: center; gap: .85rem; }
  .amani-pay .payment-result-icon { display: grid; flex: 0 0 2.9rem; width: 2.9rem; height: 2.9rem; place-items: center; border-radius: .9rem; }
  .amani-pay .payment-result-icon--paid { background: #cfeedb; color: var(--pay-green); }
  .amani-pay .payment-result-icon--failed { background: #f9d3cf; color: var(--pay-red); }
  .amani-pay .payment-result-icon--delayed { background: #ffe8a8; color: var(--pay-amber); }
  .amani-pay .payment-result-label { display: block; margin-bottom: .2rem; font-size: .66rem; font-weight: 800; letter-spacing: .12em; }
  .amani-pay .payment-result-label--paid { color: var(--pay-green); }
  .amani-pay .payment-result-label--failed { color: var(--pay-red); }
  .amani-pay .payment-result-label--delayed { color: var(--pay-amber); }

  /* ---------- summary ---------- */
  .amani-pay .portal-summary { position: sticky; top: 20px; overflow: hidden; padding: 28px; border-radius: 22px; background: linear-gradient(160deg, var(--pay-navy-deep), var(--pay-navy) 55%, #14507a); box-shadow: var(--pay-shadow); color: #fff; }
  .amani-pay .portal-summary::after { position: absolute; top: -70px; right: -70px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(142,216,230,.28), transparent 70%); content: ''; pointer-events: none; }
  .amani-pay .portal-summary > * { position: relative; z-index: 1; }
  .amani-pay .portal-summary__eyebrow { display: block; color: var(--pay-aqua); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .amani-pay .portal-summary__heading { margin: .45rem 0 0; color: #fff; font-family: var(--pay-serif); font-size: 1.35rem; font-weight: 400; line-height: 1.3; }
  .amani-pay .portal-summary__status { display: inline-flex; align-items: center; gap: .45rem; margin-top: .9rem; padding: .3rem .8rem; border-radius: 999px; background: rgba(255,255,255,.13); color: #fff; font-size: .74rem; font-weight: 700; }
  .amani-pay .portal-summary__status::before { width: 7px; height: 7px; border-radius: 50%; background: #5fd49a; content: ''; }
  .amani-pay .portal-summary__status--pending::before { background: #f3c566; }
  .amani-pay .portal-summary__status--off::before { background: #ff8a80; }
  .amani-pay .portal-summary__rows { margin-top: 1.4rem; padding: .35rem 0; border-radius: 1rem; background: rgba(255,255,255,.07); }
  .amani-pay .portal-summary__row { display: flex; justify-content: space-between; gap: 14px; padding: .7rem 1rem; color: #c9deea; font-size: .88rem; }
  .amani-pay .portal-summary__row strong { color: #fff; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
  .amani-pay .portal-summary__total { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 1.3rem; color: var(--pay-aqua); font-size: .74rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .amani-pay .portal-summary__total strong { color: #fff; font-family: var(--pay-serif); font-size: 1.7rem; font-weight: 400; letter-spacing: 0; text-transform: none; line-height: 1; }

  /* ---------- responsive ---------- */
  @media (max-width: 900px) {
    .amani-pay .payment-shell.has-summary { max-width: 580px; grid-template-columns: minmax(0, 1fr); }
    .amani-pay .portal-summary { position: static; order: -1; }
  }
  @media (max-width: 520px) {
    .amani-pay .portal-topbar,
    .amani-pay .portal-main { padding-right: 16px; padding-left: 16px; }
    .amani-pay .portal-help { padding: 11px; }
    .amani-pay .portal-help span { display: none; }
    .amani-pay .portal-stepper li { font-size: .7rem; }
    .amani-pay .payment-shell.has-summary { gap: 16px; }
    .amani-pay .form-panel__inner,
    .amani-pay .portal-summary { border-radius: 18px; }
    .amani-pay .freq-options { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    .amani-pay *, .amani-pay *::before, .amani-pay *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

export default function AmaniPayPortal({ showTopbar = true }) {
  const { code: paymentCode } = useParams();
  const hasDirectPaymentLink = Boolean(paymentCode);
  const automaticPaymentStarted = useRef(false);

  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState(hasDirectPaymentLink ? 'loading' : 'lookup');
  const [frequency, setFrequency] = useState('monthly');
  const [phoneNumber, setPhoneNumber] = useState('');
  /* idle | starting | pending | delayed | paid | failed */
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  /* What cover-check (or the payment link) returned. Null until a hit. */
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');

  /* ---- direct payment link: /amani/pay/:code ---- */
  useEffect(() => {
    if (!paymentCode) return undefined;
    let active = true;
    setStatus('loading');
    getPaymentLink(paymentCode)
      .then((result) => {
        if (!active) return;
        setPolicy({
          policyCode: result.publicCode,
          policyNumber: result.policyNumber,
          coverType: result.coverType,
          monthlyPremium: result.monthlyPremium,
          coverStatus: result.status,
          coveredCount: result.coveredCount,
        });
        setIdNumber(result.policyNumber || '');
        setStatus('plan');
      })
      .catch((err) => {
        if (active) {
          setStatus('lookup');
          setError(err?.message || 'This payment link could not be found.');
        }
      });
    return () => {
      active = false;
    };
  }, [paymentCode]);

  /* ---- the money, derived rather than guessed ----
     `policy.coverType` comes straight from the server, so the contribution
     follows the plan the member actually applied for. Until a policy is found
     there is nothing to quote, so the fallback is the Solo rate (the cheapest
     real plan) rather than an invented middle-of-the-road number. */
  const plan = planFor(policy?.coverType);
  const monthsCovered = FREQUENCIES.find((f) => f.value === frequency)?.months || 1;
  const monthlyRate = Number(policy?.monthlyPremium) || plan.monthly;
  const dueNow = monthlyRate * monthsCovered;

  const coverStatus = String(policy?.coverStatus || '').toLowerCase();
  const applicationPending = coverStatus === 'pending';
  const policyInactive = Boolean(policy) && !['active', 'pending'].includes(coverStatus);

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
          : 'We could not check that ID number just now. Please try again, or call us on ' + CONTACT.phone + '.',
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
      setPaymentError('This policy is not active, so a contribution cannot be paid yet.');
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

  /* Payment link: fire the STK prompt once, as soon as the policy has loaded. */
  useEffect(() => {
    if (!paymentCode || status !== 'plan' || !policy || automaticPaymentStarted.current) return;
    automaticPaymentStarted.current = true;
    beginPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentCode, status, policy]);

  /* Poll for the provider callback result. After MAX_POLLS we stop and move to
     'delayed' (instead of spinning forever) so the member can check again. */
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
      if (active && attempts >= MAX_POLLS) {
        if (timer) clearInterval(timer);
        setPaymentState((current) => (current === 'pending' ? 'delayed' : current));
      }
    };
    timer = setInterval(poll, POLL_INTERVAL_MS);
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

  /* Only ever the last 4 digits of the National ID — the full number is not
     something to echo back. On a payment link `idNumber` is the POLICY number,
     not an ID, so it is never shown as a "Member ID". */
  const memberRef = !hasDirectPaymentLink && idNumber.length >= 4 ? idNumber.slice(-4) : '';
  const coverLabel = policy ? `Amani ${policy.coverType} Cover` : 'Amani Solo Cover';
  const paymentStarted = ['starting', 'pending', 'delayed', 'paid', 'failed'].includes(paymentState);
  const activeStep = paymentStarted ? 3 : policy ? 2 : 1;

  return (
    <div className={`amani-pay${showTopbar ? '' : ' no-topbar'}`}>
      <style>{PAY_STYLES}</style>

      {showTopbar && (
        <header className="portal-topbar">
          <Link className="portal-brand" to="/amani/cover" aria-label="Amani Cover home">
            <span className="portal-brand__mark"><ShieldCheck size={22} aria-hidden="true" /></span>
            <span className="portal-brand__name">
              Amani Cover<span className="portal-brand__sub">Funeral Insurance</span>
            </span>
          </Link>
          <a className="portal-help" href={CONTACT.phoneHref}>
            <Phone size={16} aria-hidden="true" />
            <span>Need help? Call us</span>
          </a>
        </header>
      )}

      <main className="portal-main">
        <div className="portal-intro">
          <h1>Pay your contribution, <em>in a minute.</em></h1>
          <p>Keep your family&rsquo;s cover active with a secure M-Pesa payment.</p>
        </div>

        <ol className="portal-stepper" aria-label="Payment progress">
          {['Find cover', 'Review', 'Pay'].map((label, index) => {
            const step = index + 1;
            const isDone = step < activeStep || (paymentState === 'paid' && step === 3);
            const stepClass = isDone ? 'is-done' : step === activeStep ? 'is-active' : '';
            return (
              <li key={label} className={stepClass} aria-current={step === activeStep && !isDone ? 'step' : undefined}>
                <span className="portal-stepper__dot">{isDone ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : step}</span>
                {label}
              </li>
            );
          })}
        </ol>

        <div className={`payment-shell${policy ? ' has-summary' : ''}`}>
          {/* ---------- Payment form ---------- */}
          <section className="form-panel" aria-label="Payment form">
            <div className="form-panel__inner">
              {/* ---- 0. LOADING (payment link) ---- */}
              {status === 'loading' && (
                <div className="state-view centered-state" role="status" aria-live="polite">
                  <div className="pending-orbit">
                    <div className="pending-orbit__dot" />
                  </div>
                  <div className="form-heading form-heading--center">
                    <div className="form-heading__kicker" style={{ justifyContent: 'center' }}>SECURE PAYMENT LINK</div>
                    <h2>Loading your payment</h2>
                    <p>We are retrieving the policy details and sending the M-Pesa prompt for this cover.</p>
                  </div>
                </div>
              )}

              {/* ---- 1. LOOKUP ---- */}
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
                    <div className="form-heading__kicker" style={{ justifyContent: 'center' }}>SECURE LOOKUP</div>
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
                    <p>
                      {paymentCode
                        ? 'We are sending a secure M-Pesa prompt to the phone number on your application.'
                        : 'Review your contribution, then request a secure M-Pesa prompt on your phone.'}
                    </p>
                  </div>

                  {/* Contribution frequency updates the amount in the summary. */}
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
                            disabled={paymentStarted || hasDirectPaymentLink}
                            onChange={() => setFrequency(option.value)}
                          />
                          <span className="freq-option__label">{option.label}</span>
                          <span className="freq-option__hint">{option.hint}</span>
                          <span className="freq-option__amount">KES {formatKes(monthlyRate * option.months)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {policyInactive ? (
                    <div className="payment-contact-card" role="note">
                      <strong>This policy is not active</strong>
                      <p>A contribution can only be paid on an active policy. Please call our team and we will help you get it sorted.</p>
                      <a className="pay-button" href={CONTACT.phoneHref}>
                        <Phone size={18} aria-hidden="true" />
                        Call {CONTACT.phone}
                      </a>
                    </div>
                  ) : paymentState === 'pending' ? (
                    <div className="payment-contact-card" role="status" aria-live="polite">
                      <strong>Approve the M-Pesa prompt on your phone</strong>
                      <p>Enter your M-Pesa PIN to complete this contribution. We are checking for confirmation automatically.</p>
                      <small>Payment reference: {paymentReference}</small>
                      {paymentDetails?.receipt && <p>M-Pesa receipt: <strong>{paymentDetails.receipt}</strong></p>}
                    </div>
                  ) : paymentState === 'delayed' ? (
                    <div className="payment-contact-card payment-contact-card--delayed" role="status" aria-live="polite">
                      <div className="payment-result-heading">
                        <span className="payment-result-icon payment-result-icon--delayed"><Clock size={22} aria-hidden="true" /></span>
                        <div>
                          <span className="payment-result-label payment-result-label--delayed">STILL WAITING</span>
                          <strong>We haven&rsquo;t received confirmation yet</strong>
                        </div>
                      </div>
                      <p>
                        If you approved the prompt, the confirmation may just be delayed. Please do not pay again
                        until you have checked your M-Pesa messages. You can check again, or call us on {CONTACT.phone}.
                      </p>
                      <small>Payment reference: {paymentReference}</small>
                      <button className="pay-button" type="button" onClick={() => setPaymentState('pending')}>
                        Check again
                      </button>
                    </div>
                  ) : paymentState === 'paid' ? (
                    <div className="payment-contact-card payment-contact-card--paid" role="status" aria-live="polite">
                      <div className="payment-result-heading">
                        <span className="payment-result-icon payment-result-icon--paid"><Check size={22} strokeWidth={3} aria-hidden="true" /></span>
                        <div>
                          <span className="payment-result-label payment-result-label--paid">PAYMENT CONFIRMED</span>
                          <strong>Payment received</strong>
                        </div>
                      </div>
                      <p>Your contribution has been confirmed.</p>
                      <small>Payment reference: {paymentReference}</small>
                      {paymentDetails?.receipt && <p>M-Pesa receipt: <strong>{paymentDetails.receipt}</strong></p>}
                    </div>
                  ) : paymentState === 'failed' ? (
                    <div className="payment-contact-card payment-contact-card--failed" role="alert">
                      <div className="payment-result-heading">
                        <span className="payment-result-icon payment-result-icon--failed"><X size={22} strokeWidth={3} aria-hidden="true" /></span>
                        <div>
                          <span className="payment-result-label payment-result-label--failed">PAYMENT FAILED</span>
                          <strong>Payment was not completed</strong>
                        </div>
                      </div>
                      <p>{paymentDetails?.resultDescription || 'The M-Pesa request was cancelled or could not be completed.'}</p>
                      <button className="pay-button" type="button" onClick={() => setPaymentState('idle')}>
                        Try again
                      </button>
                    </div>
                  ) : (
                    <form className="payment-form" onSubmit={beginPayment}>
                      {!paymentCode && (
                        <label className="field">
                          <span>M-Pesa phone number</span>
                          <input
                            required
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phoneNumber}
                            onChange={(event) => setPhoneNumber(event.target.value)}
                            placeholder="e.g. 0712 345 678"
                            aria-label="M-Pesa phone number"
                            aria-invalid={Boolean(paymentError)}
                          />
                        </label>
                      )}
                      {paymentError && <p className="pay-error" role="alert">{paymentError}</p>}
                      <button className="pay-button" type="submit" disabled={paymentState === 'starting'}>
                        <Phone size={18} aria-hidden="true" />
                        {paymentState === 'starting'
                          ? 'Requesting M-Pesa prompt…'
                          : paymentCode
                            ? 'Send M-Pesa prompt again'
                            : 'Pay ' + formatPlanAmount(policy?.coverType, dueNow) + ' with M-Pesa'}
                      </button>
                      <p className="form-note">An STK prompt will be sent to your registered M-Pesa number. Your PIN is entered only on your phone.</p>
                    </form>
                  )}

                  {!paymentCode && (
                    <button className="text-button" type="button" onClick={reset}>
                      Use a different ID
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ---------- Contribution summary ---------- */}
          {policy && (
            <aside className="portal-summary" aria-label="Contribution summary">
              <span className="portal-summary__eyebrow">Your contribution</span>
              <h2 className="portal-summary__heading">{coverLabel}</h2>
              <span
                className={`portal-summary__status${applicationPending ? ' portal-summary__status--pending' : policyInactive ? ' portal-summary__status--off' : ''}`}
              >
                {applicationPending ? 'Under review' : policyInactive ? 'Not active' : 'Active cover'}
              </span>

              <div className="portal-summary__rows">
                <div className="portal-summary__row"><span>Policy number</span><strong>{policy.policyNumber}</strong></div>
                {memberRef && <div className="portal-summary__row"><span>Member ID</span><strong>•••• {memberRef}</strong></div>}
                <div className="portal-summary__row"><span>People covered</span><strong>{policy.coveredCount || 1}</strong></div>
                <div className="portal-summary__row"><span>Monthly rate</span><strong>{formatPlanAmount(policy.coverType, monthlyRate)}</strong></div>
                <div className="portal-summary__row"><span>Payment period</span><strong>{monthsCovered > 1 ? `${monthsCovered} months` : 'Monthly'}</strong></div>
              </div>

              <div className="portal-summary__total">
                <span>Amount due</span>
                <strong>{formatPlanAmount(policy.coverType, dueNow)}</strong>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}