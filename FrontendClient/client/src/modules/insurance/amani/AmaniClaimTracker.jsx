/* ==========================================================================
   Amani Cover — TRACK MY CLAIM

   Sits under the claim form on /amani/claims so a bereaved family can check
   on a claim they have already filed, instead of having to phone the branch.

   Built in the Amani theme (the same --ac-* palette and type as
   AmaniCover.css and the claim form) rather than the standalone prototype's
   blue, so it reads as part of the same product.

   WHY THE SCREEN LOOKS THE WAY IT DOES
   The person using this has just lost someone. So: a plain question, a single
   input, no jargon, no ticking counters, and a timeline that says what happens
   NEXT as well as what has happened. Every status carries a plain-English
   sentence — "Under review" on its own tells a grieving family nothing.

   PRIVACY
   The lookup is by policy number (= the holder's national ID, per migration
   001), the same credential the payment portal uses. The endpoint returns a
   short reference, the status, the deceased's name and the claim's own dates,
   and nothing else: no claimant identity, no cause or place of death, no
   review notes, no document links. See trackClaim in insuranceController.ts.
   ========================================================================== */

import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Clock3, Loader2, Search } from 'lucide-react';
import { CONTACT } from './amaniData';
import { InsuranceApiError, trackClaim } from '../../../api/insuranceApi';
import './AmaniCover.css';

/* The five stored statuses (migration 003) mapped to what a family is told and
   how far along the bar sits. `step` is the index into STEPS below, so the bar
   and the timeline can never disagree with each other.
   Anything unrecognised falls through to UNKNOWN_STATUS rather than rendering
   blank — a status added on the server later must still show something. */
const STATUS = {
  submitted: {
    label: 'Received',
    tone: 'amber',
    step: 1,
    blurb: 'We have your claim and it is in the queue for review.',
  },
  under_review: {
    label: 'Under review',
    tone: 'blue',
    step: 2,
    blurb: 'Our care team is going through the documents you sent us.',
  },
  approved: {
    label: 'Approved',
    tone: 'green',
    step: 3,
    blurb: 'Your claim has been approved and is being prepared for payment.',
  },
  settled: {
    label: 'Paid out',
    tone: 'green',
    step: 4,
    blurb: 'The payment has been released. Please check the account you gave us.',
  },
  rejected: {
    label: 'Not approved',
    tone: 'red',
    step: 3,
    blurb: 'We could not approve this claim. Please call us so we can talk it through.',
  },
};

const UNKNOWN_STATUS = {
  label: 'In progress',
  tone: 'blue',
  step: 2,
  blurb: 'This claim is being handled. Please call us if you need an update.',
};

/* The four milestones on the timeline. Dates come off the claim where one
   actually exists, so the rail shows facts rather than invented estimates. */

export default function AmaniClaimTracker() {
  const [policyNumber, setPolicyNumber] = useState('');
  const [claims, setClaims] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function lookup(event) {
    event.preventDefault();
    const value = policyNumber.trim();
    if (!value) {
      setError('Enter the number from the policy card to continue.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await trackClaim({ policyNumber: value });
      if (result?.found) {
        setClaims(result.claims || []);
      } else {
        setClaims(null);
        setError(result?.message || 'We could not find a claim for that number.');
      }
    } catch (err) {
      setClaims(null);
      setError(
        err instanceof InsuranceApiError && err.status < 500
          ? err.message
          : 'We could not check that just now. Please try again, or call us on ' +
              CONTACT.phone +
              '.',
      );
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setClaims(null);
    setPolicyNumber('');
    setError('');
  }

  const hasResults = Array.isArray(claims) && claims.length > 0;

  return (
    <section className="ct" aria-labelledby="ct-heading">
      <style>{TRACKER_STYLES}</style>
      <style>{TRACKER_RESULT_STYLES}</style>

      <div className="ct-card">
        {!hasResults ? (
          <>
            <p className="ct-eyebrow">Already submitted a claim?</p>
            <h2 id="ct-heading" className="ct-title">
              Track my claim
            </h2>
            <p className="ct-intro">
              Enter the number from the policy card and we will show you where your claim has got
              to. There is no account to remember and nothing to sign in to.
            </p>

            <form onSubmit={lookup} className="ct-form">
              <label className="ct-field">
                <span>Policy / Cover number</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck="false"
                  value={policyNumber}
                  onChange={(event) => setPolicyNumber(event.target.value)}
                  placeholder="e.g. 29384716"
                  aria-label="Policy or cover number"
                  aria-invalid={Boolean(error)}
                  disabled={busy}
                />
              </label>
              <button className="ct-submit" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 size={18} className="ct-spin" aria-hidden="true" />
                    Looking up&hellip;
                  </>
                ) : (
                  <>
                    <Search size={18} aria-hidden="true" />
                    Track my claim
                  </>
                )}
              </button>
            </form>

            {error && (
              <p className="ct-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <p className="ct-note">
              <Clock3 size={14} aria-hidden="true" />
              <span>
                We only show the progress of the claim &mdash; never your documents or personal
                details.
              </span>
            </p>
          </>
        ) : (
          <TrackerResults claims={claims} onStartOver={startOver} />
        )}
      </div>
    </section>
  );
}

/* The result screen. Split out so the lookup form above stays readable, and so
   a policy with several claims on it simply renders this once per claim. */
function TrackerResults({ claims, onStartOver }) {
  return (
    <>
      <button className="ct-back" type="button" onClick={onStartOver}>
        <ArrowLeft size={15} aria-hidden="true" />
        Track a different claim
      </button>

      {claims.length > 1 && (
        <p className="ct-intro">
          We found {claims.length} claims under that number. The most recent is first.
        </p>
      )}

      {claims.map((claim) => {
        const status = statusFor(claim.status);
        const submitted = formatDay(claim.submittedAt);
        const died = formatDay(claim.deathDate);
        const updated = formatDay(claim.updatedAt);

        return (
          <article className="ct-result" key={claim.reference}>
            <header className="ct-result-head">
              <div>
                <span className="ct-status-label">Current status</span>
                <h3 className={`ct-status tone-text-${status.tone}`}>{status.label}</h3>
                <p className="ct-blurb">{status.blurb}</p>
              </div>
              <span className={`ct-pill tone-${status.tone}`}>{status.label}</span>
            </header>

            {/* Progress bar. The bar is decorative; the timeline below carries
                the detail and role=progressbar carries the value for AT. */}
            <div
              className="ct-bar"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={status.step}
              aria-label={`Claim progress: step ${status.step} of ${STEPS.length}`}
            >
              <span
                className={`ct-bar-fill tone-bg-${status.tone}`}
                style={{ width: `${(status.step / STEPS.length) * 100}%` }}
              />
            </div>

            <dl className="ct-facts">
              <div>
                <dt>Reference</dt>
                <dd className="ct-mono">{claim.reference}</dd>
              </div>
              {claim.deceasedName && (
                <div>
                  <dt>For</dt>
                  <dd>{claim.deceasedName}</dd>
                </div>
              )}
              {died && (
                <div>
                  <dt>Date of death</dt>
                  <dd>{died}</dd>
                </div>
              )}
              {submitted && (
                <div>
                  <dt>Submitted</dt>
                  <dd>{submitted}</dd>
                </div>
              )}
            </dl>

            <ol className="ct-timeline">
              {STEPS.map((step, index) => {
                const number = index + 1;
                const done = number < status.step;
                const current = number === status.step;
                const state = done ? 'done' : current ? 'current' : 'todo';

                /* Only milestones we genuinely have a date for get one; the
                   rest stay undated rather than showing a made-up estimate. */
                const date =
                  number === 1
                    ? submitted
                    : current && updated
                      ? updated
                      : null;

                return (
                  <li className={`ct-step is-${state}`} key={step.key}>
                    <span className="ct-dot" aria-hidden="true">
                      {done ? <Check size={13} /> : null}
                    </span>
                    <div>
                      <p className="ct-step-title">
                        {step.title}
                        {current && <span className="ct-now">Now</span>}
                      </p>
                      <p className="ct-step-desc">{step.desc}</p>
                      {date && <p className="ct-step-date">{date}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="ct-help">
              Need anything changed? Call us on <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> and
              quote <strong>{claim.reference}</strong>.
            </p>
          </article>
        );
      })}
    </>
  );
}

/* ==========================================================================
   Tracker styles, scoped under `.ct` so they cannot leak into the claim form
   above or the rest of the app. Built on the page's own --ac-* palette.
   ========================================================================== */
const TRACKER_STYLES = `
  .ct { display: block; width: 100%; padding: 0 1rem 4rem; }
  .ct-card { width: min(100%, 44rem); margin: 0 auto; padding: 2rem 1.25rem; border: 1px solid var(--ac-border, #dde5f0); border-radius: 1.5rem; background: var(--ac-card, #fff); box-shadow: 0 18px 50px -30px rgba(0, 41, 107, 0.35); }

  .ct-eyebrow { margin: 0 0 .5rem; color: var(--ac-accent, #1f56c4); font-size: .7rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
  .ct-title { margin: 0 0 .6rem; color: var(--ac-primary, #00296b); font-family: Georgia, 'Times New Roman', serif; font-size: clamp(1.7rem, 4vw, 2.25rem); font-weight: 400; line-height: 1.1; }
  .ct-intro { margin: 0 0 1.5rem; color: var(--ac-mutedfg, #4a5a66); font-size: .93rem; line-height: 1.65; }

  .ct-form { display: flex; flex-direction: column; gap: 1rem; }
  .ct-field { display: flex; flex-direction: column; gap: .45rem; color: var(--ac-ink, #0f3040); font-size: .72rem; font-weight: 800; }
  .ct-field input { width: 100%; height: 3.2rem; padding: 0 1rem; border: 1px solid var(--ac-input, #cfd9e8); border-radius: .65rem; background: #fbfcfe; color: var(--ac-ink, #0f3040); font: 500 .95rem/1 Arial, sans-serif; transition: border-color .2s, box-shadow .2s, background .2s; }
  .ct-field input::placeholder { color: #94a3b8; }
  .ct-field input:focus { outline: none; border-color: var(--ac-ring, #1f56c4); background: #fff; box-shadow: 0 0 0 4px rgba(31, 86, 196, .1); }
  .ct-field input[aria-invalid="true"] { border-color: #d64545; }

  .ct-submit { display: flex; align-items: center; justify-content: center; gap: .6rem; width: 100%; height: 3.35rem; border: 0; border-radius: .65rem; background: var(--ac-primary, #00296b); color: #fff; cursor: pointer; font-size: .92rem; font-weight: 800; transition: transform .2s, background .2s, box-shadow .2s; }
  .ct-submit:hover:not(:disabled) { background: var(--ac-accent, #1f56c4); box-shadow: 0 10px 22px rgba(0, 41, 107, .22); transform: translateY(-2px); }
  .ct-submit:disabled { opacity: .65; cursor: not-allowed; }
  .ct-spin { animation: ct-spin 1s linear infinite; }
  @keyframes ct-spin { to { transform: rotate(360deg); } }

  .ct-error { display: flex; align-items: flex-start; gap: .5rem; margin: 1rem 0 0; padding: .8rem .95rem; border: 1px solid #f3c9c9; border-radius: .6rem; background: #fdf3f3; color: #9b2222; font-size: .82rem; line-height: 1.5; }
  .ct-error svg { flex-shrink: 0; margin-top: .1rem; }

  .ct-note { display: flex; align-items: flex-start; gap: .5rem; margin: 1.25rem 0 0; color: var(--ac-mutedfg, #4a5a66); font-size: .75rem; line-height: 1.55; }
  .ct-note svg { flex-shrink: 0; margin-top: .1rem; color: var(--ac-accent, #1f56c4); }

  /* ---- results ---- */
  .ct-back { display: inline-flex; align-items: center; gap: .4rem; margin: 0 0 1.25rem; padding: 0; border: 0; background: none; color: var(--ac-accent, #1f56c4); cursor: pointer; font-size: .8rem; font-weight: 700; }
  .ct-back:hover { text-decoration: underline; text-underline-offset: 3px; }

  .ct-result { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--ac-border, #dde5f0); }
  .ct-result:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }

  .ct-result-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.2rem; border-radius: .85rem; background: #f7f9fc; }
  .ct-status-label { display: block; color: var(--ac-mutedfg, #4a5a66); font-size: .62rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .ct-status { margin: .35rem 0 .3rem; font-family: Georgia, serif; font-size: 1.5rem; font-weight: 400; }
  .ct-blurb { margin: 0; max-width: 30rem; color: var(--ac-mutedfg, #4a5a66); font-size: .84rem; line-height: 1.55; }

  .ct-pill { flex-shrink: 0; padding: .35rem .8rem; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; }
  .tone-amber.ct-pill { background: #fef3c7; color: #92400e; }
  .tone-blue.ct-pill  { background: #dbeafe; color: #1e40af; }
  .tone-green.ct-pill { background: #dcfce7; color: #166534; }
  .tone-red.ct-pill   { background: #fee2e2; color: #991b1b; }

  .tone-text-amber { color: #b45309; }
  .tone-text-blue  { color: #1d4ed8; }
  .tone-text-green { color: #15803d; }
  .tone-text-red   { color: #b91c1c; }
  .tone-bg-amber   { background: #f59e0b; }
  .tone-bg-blue    { background: #2563eb; }
  .tone-bg-green   { background: #16a34a; }
  .tone-bg-red     { background: #dc2626; }

  .ct-bar { height: .45rem; margin: 1.1rem 0 1.4rem; overflow: hidden; border-radius: 999px; background: var(--ac-border, #dde5f0); }
  .ct-bar-fill { display: block; height: 100%; border-radius: 999px; transition: width .5s ease; }

  .ct-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .9rem 1.2rem; margin: 0 0 1.6rem; padding: 1.1rem 1.2rem; border: 1px solid var(--ac-border, #dde5f0); border-radius: .8rem; background: #fbfcfe; }
  .ct-facts dt { color: var(--ac-mutedfg, #4a5a66); font-size: .64rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .ct-facts dd { margin: .3rem 0 0; color: var(--ac-ink, #0f3040); font-size: .9rem; font-weight: 600; }
  .ct-mono { font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace; letter-spacing: .02em; }
`;

/* Timeline + help styles live in a second block so the lookup screen above and
   the result screen below can be read independently. */
const TRACKER_RESULT_STYLES = `
  .ct-timeline { margin: 0; padding: 0; list-style: none; }
  .ct-step { position: relative; display: grid; grid-template-columns: 1.75rem 1fr; gap: .9rem; padding-bottom: 1.4rem; }
  .ct-step:last-child { padding-bottom: 0; }
  /* Connector line between the dots; absent after the final one. */
  .ct-step:not(:last-child)::before { content: ''; position: absolute; top: 1.6rem; bottom: 0; left: .82rem; width: 2px; background: var(--ac-border, #dde5f0); }
  .ct-step.is-done:not(:last-child)::before { background: #16a34a; }

  .ct-dot { display: grid; width: 1.7rem; height: 1.7rem; place-items: center; border: 2px solid var(--ac-border, #dde5f0); border-radius: 50%; background: #fff; color: #fff; }
  .ct-step.is-done .ct-dot { border-color: #16a34a; background: #16a34a; }
  .ct-step.is-current .ct-dot { border-color: var(--ac-accent, #1f56c4); box-shadow: 0 0 0 4px rgba(31, 86, 196, .14); }

  .ct-step-title { display: flex; align-items: center; gap: .5rem; margin: .25rem 0 .2rem; color: var(--ac-ink, #0f3040); font-size: .92rem; font-weight: 700; }
  .ct-step.is-todo .ct-step-title { color: var(--ac-mutedfg, #4a5a66); font-weight: 600; }
  .ct-now { padding: .1rem .5rem; border-radius: 999px; background: var(--ac-accent, #1f56c4); color: #fff; font-size: .6rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .ct-step-desc { margin: 0; color: var(--ac-mutedfg, #4a5a66); font-size: .8rem; line-height: 1.55; }
  .ct-step-date { margin: .3rem 0 0; color: var(--ac-accent, #1f56c4); font-size: .72rem; font-weight: 700; }

  .ct-help { margin: 1.6rem 0 0; padding: .85rem 1rem; border-radius: .7rem; background: #f2f6fc; color: var(--ac-mutedfg, #4a5a66); font-size: .8rem; line-height: 1.6; }
  .ct-help a { color: var(--ac-accent, #1f56c4); font-weight: 700; }
  .ct-help strong { font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace; color: var(--ac-ink, #0f3040); }

  @media (max-width: 560px) {
    .ct-card { padding: 1.5rem 1.1rem; }
    .ct-result-head { flex-direction: column; gap: .7rem; }
    .ct-pill { align-self: flex-start; }
  }
`;
