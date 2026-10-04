/* ==========================================================================
   Amani Cover — PAYMENTS PAGE  (/amani/payments)

   FLOW
   1. The visitor types their policy number — which, for Amani Cover, IS their
      national ID number: the single thing printed on the policy card.
   2. We ask insurance-service whether cover exists for it
      (POST /insurance/cover-check). That endpoint returns ONLY whether cover
      was found plus its type/status/count — never the holder's name, phone,
      members or claims. So this page cannot become a way to look a person up.
   3. Only on a hit does the payment step appear.

   THERE IS STILL NO PAYMENT GATEWAY WIRED UP. Step 3 therefore shows the
   contribution instructions for that policy and records nothing. The paybill
   / bank details are marked PLACEHOLDER: fill them in from the real account
   before publishing, otherwise a customer could pay the wrong number.
   ========================================================================== */

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { CONTACT } from './amaniData';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import { InsuranceApiError, checkCover } from '../../../api/insuranceApi';
import './AmaniCover.css';

/** Policy status -> badge styling + a plain-English label. */
const STATUS_COPY = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  pending: { label: 'Under review', className: 'bg-amber-50 text-amber-900 border-amber-200' },
  rejected: { label: 'Not active', className: 'bg-red-50 text-red-800 border-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const METHODS = [
  {
    icon: Smartphone,
    title: 'M-Pesa',
    lines: [
      'Dial the USSD code we send you when your cover is activated.',
      'Send the contribution to the paybill number on your policy confirmation.',
    ],
    placeholder: true,
  },
  {
    icon: Building2,
    title: 'Bank transfer',
    lines: [
      'Transfer to the Montenzuma Monalisa Funeral Home account.',
      'Quote your policy number so the payment is matched to your cover.',
    ],
    placeholder: true,
  },
  {
    icon: Phone,
    title: 'By phone',
    lines: [
      `Call the branch on ${CONTACT.phone} and we will take the details with you.`,
      'Useful if you are paying on behalf of someone else.',
    ],
    placeholder: false,
  },
];

function CoverLookup({ onFound }) {
  const [policyNumber, setPolicyNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const value = policyNumber.trim();
    if (!value) {
      setError('Enter your policy number to continue.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await checkCover({ policyNumber: value });
      if (result?.found) {
        /* Keep what the visitor typed so the payment step can quote it back —
           the API deliberately never returns the holder's details, so the
           number they entered is the only identifier we hold. */
        onFound({
          policyNumber: value.toUpperCase(),
          coverType: result.coverType,
          status: result.status,
          coveredCount: result.coveredCount,
          message: result.message,
        });
      } else {
        setError(result?.message || 'We could not find a policy for that number.');
      }
    } catch (err) {
      if (err instanceof InsuranceApiError && err.status < 500) {
        setError(err.message);
      } else {
        setError(
          'We could not check that policy number just now. Please try again, or call us on ' +
            CONTACT.phone +
            '.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-ac-border bg-ac-card p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ac-primary/10 text-ac-primary">
          <Search className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-2xl text-ac-primary">Find your cover</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-ac-mutedfg">
            Enter the policy number from your policy card. On Amani Cover that is your national ID
            number — the same one you used when you applied.
          </p>
        </div>
      </div>

      <form className="mt-6" onSubmit={submit} noValidate>
        <label className="block text-sm font-medium text-ac-ink" htmlFor="pay-policy-number">
          Policy number
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="pay-policy-number"
            className="min-w-0 flex-1 rounded-xl border border-ac-input bg-ac-bg px-4 py-3 text-base text-ac-ink outline-none transition-colors placeholder:text-ac-mutedfg/60 focus:border-ac-primary"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
            placeholder="e.g. 29384716"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'pay-policy-error' : undefined}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ac-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-ac-primary/90 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Checking…
              </>
            ) : (
              <>
                Check my cover
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {error && (
          <p
            id="pay-policy-error"
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function PaymentPanel({ policy, onReset }) {
  const status = STATUS_COPY[policy.status] || {
    label: policy.status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <section className="rounded-[2rem] border border-ac-border bg-ac-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-2xl text-ac-primary">Make a payment</h2>
            <p className="mt-2 max-w-xl leading-relaxed text-ac-mutedfg">{policy.message}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Only what the public cover-check returns — no name, phone or members. */}
      <dl className="mt-6 grid gap-3 rounded-2xl bg-ac-bg p-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ac-mutedfg">Policy number</dt>
          <dd className="mt-1 font-mono text-sm font-medium text-ac-ink">{policy.policyNumber}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ac-mutedfg">Cover</dt>
          <dd className="mt-1 text-sm font-medium text-ac-ink">Amani {policy.coverType}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ac-mutedfg">People covered</dt>
          <dd className="mt-1 text-sm font-medium text-ac-ink">{policy.coveredCount}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {METHODS.map(({ icon: Icon, title, lines, placeholder }) => (
          <article key={title} className="rounded-2xl border border-ac-border bg-ac-bg p-5">
            <span className="grid size-9 place-items-center rounded-full bg-ac-primary/10 text-ac-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-serif text-lg text-ac-primary">{title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {lines.map((line) => (
                <li key={line} className="text-sm leading-6 text-ac-mutedfg">
                  {line}
                </li>
              ))}
            </ul>
            {placeholder && (
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ac-mutedfg">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-ac-accent" aria-hidden="true" />
                Paybill and account details are on your policy document.
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Quote the number back: the contribution has to be matched to this
          policy, and the visitor typed it, so it is the identifier we have. */}
      <p className="mt-5 flex items-start gap-2 rounded-xl border border-ac-border bg-ac-bg px-4 py-3 text-sm text-ac-mutedfg">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ac-primary" aria-hidden="true" />
        <span>
          When you pay, quote policy number{' '}
          <span className="font-mono font-medium text-ac-ink">{policy.policyNumber}</span> so we
          can match the contribution to your cover.
        </span>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={CONTACT.phoneHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ac-ink px-6 py-3 text-base font-medium text-white transition-colors hover:bg-ac-ink/90"
        >
          <Phone className="size-4" aria-hidden="true" />
          Pay by phone
        </a>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-ac-mutedfg underline underline-offset-4 transition-colors hover:text-ac-primary"
        >
          Check a different policy number
        </button>
      </div>
    </section>
  );
}

export default function AmaniPayments() {
  const [policy, setPolicy] = useState(null);

  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />

      <PageHeader
        eyebrow="Already covered?"
        title="Make a"
        accent="payment."
        intro="Keeping your Amani Cover up to date is simple. Check your policy below and we will show you how to contribute — or if you are unsure, call us and we will walk you through it."
      />

      <main className="px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Lookup first; the payment step only exists once cover is found. */}
          {policy ? (
            <PaymentPanel policy={policy} onReset={() => setPolicy(null)} />
          ) : (
            <CoverLookup onFound={setPolicy} />
          )}

          <section className="mt-10 rounded-[2rem] bg-ac-primary p-8 text-ac-onprimary sm:p-10">
            <h2 className="font-serif text-2xl">Need a hand?</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-ac-onprimary/80">
              Our care team will confirm your balance and take your payment details with you —
              clearly and kindly.
            </p>
            <address className="mt-7 grid gap-4 text-sm not-italic sm:grid-cols-3">
              <a href={CONTACT.phoneHref} className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Call</span>
                  {CONTACT.phone}
                </span>
              </a>
              <a href={CONTACT.emailHref} className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Email</span>
                  {CONTACT.email}
                </span>
              </a>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Visit</span>
                  {CONTACT.address}
                </span>
              </p>
            </address>
          </section>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}