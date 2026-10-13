/* ==========================================================================
   Amani Cover — TRACK A CLAIM  (/amani/claims/track)

   Self-contained styling (renders correctly without Tailwind).

   SLEEK BY DESIGN — no card pile-up. The whole dashboard is hairlines and
   whitespace on white:
     1. Account strip — one 4-cell row between two hairlines: plan, email
        (when on file), members covered, claim reference.
     2. Submission — plain label/value grid of what was submitted + uploaded
        documents as light chips. Fields the claim record doesn't carry are
        hidden, never shown as "—".
     3. Progress — Received → Under review → Approved → Funds released.
        A rejected claim shows its reason above the stages.

   The lookup calls the real insurance-service: checkCover detects the
   ACCOUNT (plan / status / count, email when the API exposes it) and
   trackClaim brings the CLAIM itself.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, Phone, Search } from 'lucide-react';
import { CONTACT } from './amaniData';
import { InsuranceApiError, checkCover, trackClaim } from '../../../api/insuranceApi';
import { AmaniFooter, AmaniNav } from './AmaniUi';
import './AmaniCover.css';

const CLAIM_STAGES = ['Received', 'Under review', 'Approved', 'Funds released'];

const STAGE_OF = {
  submitted: 0,
  under_review: 1,
  approved: 2,
  settled: 3,
  rejected: 2,
};

const REJECTED_COPY =
  'We could not approve this claim. Please call our 24-hour line so we can talk it through with you.';

export default function AmaniTrackClaim() {
  const [status, setStatus] = useState('idle'); // idle | submitting | found | notfound | error
  const [claim, setClaim] = useState(null);
  const [policy, setPolicy] = useState(null); // what cover-check detected about the account
  const dashRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const idNumber = String(new FormData(event.currentTarget).get('idNumber') ?? '').trim();

    if (!idNumber) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      /* Ask about the ACCOUNT first; never let a failure here block the claim. */
      let account = null;
      try {
        const cover = await checkCover({ policyNumber: idNumber });
        if (cover?.found) {
          account = {
            coverType: cover.coverType,
            coverStatus: cover.status,
            coveredCount: cover.coveredCount,
            email: cover.email ?? null,
          };
        }
      } catch {
        account = null;
      }

      const result = await trackClaim({ policyNumber: idNumber });
      const first = result?.found ? result.claims?.[0] : null;

      if (first) {
        setPolicy(account);
        setClaim(first);
        setStatus('found');
      } else {
        setPolicy(null);
        setClaim(null);
        setStatus('notfound');
      }
    } catch (err) {
      setPolicy(null);
      setClaim(null);
      setStatus(err instanceof InsuranceApiError && err.status < 500 ? 'notfound' : 'error');
    }
  }

  /* Bring the dashboard into view once a claim is found. */
  useEffect(() => {
    if (status === 'found') dashRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [status]);

  const currentStage = claim ? (STAGE_OF[claim.status] ?? 1) : 0;
  const rejected = claim?.status === 'rejected';

  /* --- account strip values, defensive --- */
  const planLabel = policy?.coverType ? `Amani ${policy.coverType} Cover` : 'Amani Cover';
  const accActive = String(policy?.coverStatus || '').toLowerCase() === 'active';
  const accStatusText = policy?.coverStatus
    ? `${policy.coverStatus.charAt(0).toUpperCase()}${policy.coverStatus.slice(1)} · verified`
    : 'Verified';
  const membersText = policy?.coveredCount
    ? `${policy.coveredCount} ${policy.coveredCount === 1 ? 'person' : 'people'} covered`
    : null;

  /* --- submission details: only render what the record actually carries --- */
  const details = [
    ['Deceased', claim?.deceasedName],
    ['Date of death', claim?.dateOfDeath],
    ['Date of burial', claim?.dateOfBurial],
    ['Submitted by', claim?.claimantName],
    ['Relationship', claim?.relationship],
    ['Contact on claim', claim?.claimantPhone || claim?.phone],
  ].filter(([, value]) => Boolean(value));

  /* documents: accept strings or { name, uploaded } */
  const docs = (claim?.documents || []).map((doc) =>
    typeof doc === 'string' ? { name: doc, uploaded: true } : { name: doc.name, uploaded: doc.uploaded !== false },
  );

  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/claims/track" />
      <style>{`
        /* ═════════ top band: back, title, inline lookup ═════════ */
        .atk-band { background: linear-gradient(120deg, #e3f2f6, #fff 72%); border-bottom: 1px solid var(--ac-border); padding: 2.25rem 0 3.5rem; }
        .atk-wrap { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }
        @media (min-width: 1024px) { .atk-wrap { padding: 0 2.5rem; } }

        .atk-back { display: inline-flex; align-items: center; gap: .45rem; color: var(--ac-mutedfg); font-size: .85rem; font-weight: 500; text-decoration: none; transition: color .2s; }
        .atk-back:hover { color: var(--ac-primary); }

        .atk-eyebrow { display: inline-flex; align-items: center; gap: .5rem; margin: 2.25rem 0 0; font-size: .72rem; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--ac-accent); }
        .atk-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--ac-highlight); }

        .atk-title { margin: .9rem 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(2.3rem, 5vw, 3.4rem); font-weight: 500; line-height: 1.05; color: var(--ac-primary); }
        .atk-title em { font-style: italic; color: var(--ac-accent); }

        .atk-subtitle { max-width: 38rem; margin: 1rem 0 0; font-size: .98rem; line-height: 1.7; color: var(--ac-mutedfg); }

        .atk-lookup { display: flex; flex-direction: column; gap: .75rem; margin-top: 2.25rem; }
        @media (min-width: 640px) { .atk-lookup { flex-direction: row; } }

        .atk-input { flex: 1; height: 54px; padding: 0 1.15rem; border: 1px solid var(--ac-input); border-radius: 12px; background: #fff; color: var(--ac-ink); font: 500 .98rem 'Source Sans 3', sans-serif; transition: border-color .2s, box-shadow .2s; box-sizing: border-box; }
        .atk-input::placeholder { color: #9AA9B6; }
        .atk-input:focus { outline: none; border-color: var(--ac-accent); box-shadow: 0 0 0 4px rgba(14, 124, 155, .15); }
        .atk-input[aria-invalid="true"] { border-color: #D64545; }

        .atk-btn { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; height: 54px; padding: 0 1.75rem; border: 0; border-radius: 12px; background: var(--ac-primary); color: #fff; white-space: nowrap; font-size: .95rem; font-weight: 700; cursor: pointer; transition: background .2s, transform .2s, box-shadow .2s; }
        .atk-btn:hover:not(:disabled) { background: var(--ac-primary-hover); transform: translateY(-1px); box-shadow: 0 10px 22px -10px rgba(16, 45, 67, .5); }
        .atk-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .atk-btn:focus-visible { outline: 2px solid var(--ac-accent); outline-offset: 2px; }

        .atk-form-error { margin: .8rem 0 0; color: #B42318; font-size: .82rem; font-weight: 500; }
        .atk-alert { padding: 1rem 1.15rem; border: 1px solid #FECACA; border-radius: 12px; background: #FEF2F2; color: #991B1B; font-size: .87rem; font-weight: 500; line-height: 1.55; }
        .atk-alert a { color: inherit; }

        /* ═════════ results on plain white — hairlines, no cards ═════════ */
        .atk-main { padding: 2.75rem 0 5.5rem; }

        .atk-searching { display: flex; align-items: center; justify-content: center; gap: .8rem; padding: 3rem 0; color: var(--ac-mutedfg); font-size: .9rem; }
        .atk-spinner { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--ac-border); border-top-color: var(--ac-primary); animation: atk-spin .9s linear infinite; }
        @keyframes atk-spin { to { transform: rotate(360deg); } }

        .atk-notfound { max-width: 34rem; margin: 0 auto; text-align: center; }
        .atk-notfound h3 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; font-weight: 600; color: var(--ac-primary); }
        .atk-notfound p { margin: .5rem 0 0; font-size: .88rem; line-height: 1.6; color: var(--ac-mutedfg); }
        .atk-notfound a { color: var(--ac-primary); font-weight: 600; text-decoration: none; }
        .atk-notfound a:hover { text-decoration: underline; text-underline-offset: 3px; }

        /* ── 1. account strip: one row, hairline top + bottom ── */
        .atk-account { display: grid; grid-template-columns: repeat(4, 1fr); border-block: 1px solid var(--ac-border); }
        .atk-account > div { padding: 1.15rem 1.5rem 1.15rem 0; }
        .atk-account > div + div { border-left: 1px solid var(--ac-border); padding-left: 1.5rem; }
        @media (max-width: 860px) {
          .atk-account { grid-template-columns: 1fr 1fr; }
          .atk-account > div { padding-right: 1rem; }
          .atk-account > div:nth-child(3) { border-left: 0; padding-left: 0; }
          .atk-account > div:nth-child(even) { padding-left: 1.25rem; }
          .atk-account > div:nth-child(n+3) { border-top: 1px solid var(--ac-border); }
        }
        @media (max-width: 520px) {
          .atk-account { grid-template-columns: 1fr; }
          .atk-account > div + div { border-left: 0; padding-left: 0; border-top: 1px solid var(--ac-border); }
        }
        .atk-account__label { display: flex; align-items: center; gap: .4rem; font-size: .62rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--ac-accent); }
        .atk-account__dot { width: 7px; height: 7px; border-radius: 50%; background: #3E7A5E; }
        .atk-account__dot--amber { background: #C08A1E; }
        .atk-account__value { display: block; margin-top: .4rem; font-size: .95rem; font-weight: 700; color: var(--ac-primary); word-break: break-word; }
        .atk-account__value--muted { color: var(--ac-mutedfg); font-weight: 500; font-style: italic; }
        .atk-account__hint { display: block; margin-top: .15rem; font-size: .74rem; color: var(--ac-mutedfg); }

        /* ── shared section scaffolding ── */
        .atk-section { padding: 2.25rem 0; border-bottom: 1px solid var(--ac-border); }
        .atk-section:last-of-type { border-bottom: 0; padding-bottom: .5rem; }
        .atk-section__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem; }
        .atk-section__title { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; font-weight: 600; color: var(--ac-primary); }
        .atk-section__meta { font-size: .82rem; color: var(--ac-mutedfg); }
        .atk-ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; letter-spacing: .04em; color: var(--ac-mutedfg); }
        .atk-label { display: flex; align-items: center; gap: .5rem; margin: 1.9rem 0 1rem; font-size: .68rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--ac-accent); }
        .atk-label::after { content: ""; flex: 1; height: 1px; background: var(--ac-border); }

        /* ── 2. submission: label/value grid + document chips ── */
        .atk-grid { display: grid; grid-template-columns: 1fr; gap: 1rem 1.5rem; }
        @media (min-width: 640px) { .atk-grid { grid-template-columns: repeat(3, 1fr); } }
        .atk-grid__label { display: block; font-size: .62rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ac-mutedfg); }
        .atk-grid__value { display: block; margin-top: .25rem; font-size: .92rem; font-weight: 600; color: var(--ac-ink); }

        .atk-docs { display: flex; flex-wrap: wrap; gap: .55rem; }
        .atk-doc { display: inline-flex; align-items: center; gap: .5rem; padding: .5rem .8rem; border: 1px solid var(--ac-border); border-radius: 10px; font-size: .82rem; font-weight: 500; color: var(--ac-ink); }
        .atk-doc--pending { color: var(--ac-mutedfg); border-style: dashed; }
        .atk-doc svg { width: 13px; height: 13px; }
        .atk-doc--done svg { color: #3E7A5E; }
        .atk-doc--pending svg { color: #C08A1E; }

        /* ── 3. progress: reason + stepper ── */
        .atk-reason { display: flex; gap: .8rem; margin-bottom: 2rem; padding: 1.05rem 1.2rem; border: 1px solid #FECACA; border-radius: 12px; background: #FEF2F2; }
        .atk-reason__icon { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #B42318; color: #fff; font-weight: 700; font-size: .85rem; }
        .atk-reason__label { display: block; font-size: .68rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #B42318; }
        .atk-reason__text { margin: .3rem 0 0; color: #7F1D1D; font-size: .9rem; line-height: 1.6; }

        .atk-steps { display: flex; list-style: none; margin: 0; padding: 0; }
        .atk-step { position: relative; flex: 1; padding: 0 .5rem; text-align: center; }
        .atk-step + .atk-step::before { content: ""; position: absolute; top: 15px; left: calc(-50% + 20px); width: calc(100% - 40px); height: 2px; border-radius: 2px; background: var(--ac-border); }
        .atk-step.done + .atk-step::before, .atk-step.current + .atk-step::before { background: var(--ac-primary); }
        .atk-step.rejected + .atk-step::before { background: #B42318; }

        .atk-step__dot { position: relative; z-index: 1; display: grid; place-items: center; width: 32px; height: 32px; margin: 0 auto; border-radius: 50%; background: #fff; border: 2px solid var(--ac-border); color: #fff; }
        .atk-step.done .atk-step__dot, .atk-step.current .atk-step__dot { background: var(--ac-primary); border-color: var(--ac-primary); }
        .atk-step.current .atk-step__dot { box-shadow: 0 0 0 6px rgba(14, 124, 155, .16); }
        .atk-step.done .atk-step__dot svg { width: 14px; height: 14px; }
        .atk-step.rejected .atk-step__dot { background: #B42318; border-color: #B42318; }

        .atk-step__text { display: block; margin-top: .75rem; }
        .atk-step__name { display: block; font-size: .9rem; font-weight: 600; color: var(--ac-ink); }
        .atk-step.pending .atk-step__name { color: #9AA9B6; font-weight: 500; }
        .atk-step.rejected .atk-step__name { color: #B42318; }
        .atk-step__meta { display: block; margin-top: .15rem; font-size: .72rem; color: var(--ac-mutedfg); }

        @media (max-width: 620px) {
          .atk-steps { flex-direction: column; }
          .atk-step { display: flex; align-items: flex-start; gap: .9rem; text-align: left; padding: 0 0 1.5rem; }
          .atk-step:last-child { padding-bottom: 0; }
          .atk-step + .atk-step::before { left: 15px; top: 34px; width: 2px; height: calc(100% - 34px); }
          .atk-step__dot { margin: 0; flex-shrink: 0; }
          .atk-step__text { margin-top: .35rem; }
        }

        .atk-note { display: flex; align-items: flex-start; gap: .6rem; margin-top: 2.25rem; font-size: .85rem; line-height: 1.6; color: var(--ac-mutedfg); }
        .atk-note svg { flex-shrink: 0; width: 16px; height: 16px; margin-top: 2px; color: var(--ac-accent); }
        .atk-note a { color: var(--ac-primary); font-weight: 600; text-decoration: none; }
        .atk-note a:hover { text-decoration: underline; text-underline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) {
          .atk-spinner { animation: none; }
          .atk-btn { transition: none; }
        }
      `}</style>

      {/* ═════════ header band ═════════ */}
      <div className="atk-band amani-track-band">
        <div className="atk-wrap">
          <Link to="/amani/cover" className="atk-back">
            <ArrowLeft size={15} /> Back to Amani Cover
          </Link>

          <p className="atk-eyebrow">Claim tracking</p>
          <h1 className="atk-title">
            Where is <em>my claim?</em>
          </h1>
          <p className="atk-subtitle">
            Enter your National ID to open your claim dashboard — your account, what was submitted,
            and how far your claim has progressed.
          </p>

          <form onSubmit={handleSubmit} noValidate className="atk-lookup">
            <input
              id="idNumber"
              name="idNumber"
              required
              inputMode="numeric"
              autoComplete="off"
              spellCheck="false"
              className="atk-input"
              placeholder="National ID / policy number — e.g. 29384716"
              aria-label="National ID / policy number"
              aria-invalid={status === 'error'}
            />
            <button type="submit" disabled={status === 'submitting'} className="atk-btn">
              <Search size={17} aria-hidden="true" />
              {status === 'submitting' ? 'Checking…' : 'Check my claim'}
            </button>
          </form>

          {status === 'error' && (
            <p className="atk-form-error" role="alert">
              Something went wrong. Please try again, or call our 24-hour line at{' '}
              <a href={CONTACT.phoneHref} style={{ color: 'inherit' }}>{CONTACT.phone}</a>.
            </p>
          )}
        </div>
      </div>

      {/* ═════════ results — white, hairlines only ═════════ */}
      <main className="atk-main">
        <div className="atk-wrap">
          {status === 'submitting' && (
            <div className="atk-searching" role="status" aria-live="polite">
              <span className="atk-spinner" aria-hidden="true" />
              <span>Finding your account and claim…</span>
            </div>
          )}

          {status === 'notfound' && (
            <div className="atk-notfound">
              <h3>We couldn&rsquo;t find that claim.</h3>
              <p>
                Double-check the number on the policy card. If it still doesn&rsquo;t match,{' '}
                <a href={CONTACT.phoneHref}>call our 24-hour line on {CONTACT.phone}</a> and we will
                find it together.
              </p>
            </div>
          )}

          {status === 'found' && claim && (
            <div ref={dashRef} aria-live="polite">
              {/* ── 1. ACCOUNT ── */}
              <div className="atk-account">
                <div>
                  <span className="atk-account__label">
                    <span
                      className={`atk-account__dot${accActive ? '' : ' atk-account__dot--amber'}`}
                      aria-hidden="true"
                    />
                    Account
                  </span>
                  <span className="atk-account__value">{planLabel}</span>
                  <span className="atk-account__hint">{accStatusText}</span>
                </div>
                <div>
                  <span className="atk-account__label">Email</span>
                  {policy?.email ? (
                    <span className="atk-account__value">{policy.email}</span>
                  ) : (
                    <span className="atk-account__value atk-account__value--muted">No email on file</span>
                  )}
                  <span className="atk-account__hint">Claim updates sent here</span>
                </div>
                <div>
                  <span className="atk-account__label">Members covered</span>
                  {membersText ? (
                    <>
                      <span className="atk-account__value">{membersText}</span>
                      <span className="atk-account__hint">On this policy</span>
                    </>
                  ) : (
                    <span className="atk-account__value atk-account__value--muted">Not stated</span>
                  )}
                </div>
                <div>
                  <span className="atk-account__label">Claim reference</span>
                  <span className="atk-account__value">{claim.reference || claim.claimId || '—'}</span>
                  <span className="atk-account__hint">
                    {new Date(claim.submittedAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* ── 2. SUBMISSION — what was submitted / uploaded ── */}
              <section className="atk-section">
                <div className="atk-section__head">
                  <h2 className="atk-section__title">Submission{claim.deceasedName ? ` — ${claim.deceasedName}` : ''}</h2>
                  <span className="atk-section__meta">Details and documents received with this claim</span>
                </div>

                {details.length > 0 && (
                  <>
                    <p className="atk-label">Details submitted</p>
                    <div className="atk-grid">
                      {details.map(([label, value]) => (
                        <div key={label}>
                          <span className="atk-grid__label">{label}</span>
                          <span className="atk-grid__value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {docs.length > 0 && (
                  <>
                    <p className="atk-label">Documents uploaded</p>
                    <div className="atk-docs">
                      {docs.map((doc) => (
                        <span key={doc.name} className={`atk-doc ${doc.uploaded ? 'atk-doc--done' : 'atk-doc--pending'}`}>
                          {doc.uploaded ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                          {doc.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* ── 3. PROGRESS ── */}
              <section className="atk-section">
                <div className="atk-section__head">
                  <h2 className="atk-section__title">Progress</h2>
                  {rejected && <span className="atk-section__meta">This claim was not approved</span>}
                </div>

                {rejected && (
                  <div className="atk-reason" role="alert">
                    <span className="atk-reason__icon" aria-hidden="true">!</span>
                    <div>
                      <span className="atk-reason__label">Why it was not approved</span>
                      <p className="atk-reason__text">{claim.rejectionReason || REJECTED_COPY}</p>
                    </div>
                  </div>
                )}

                <ol className="atk-steps">
                  {CLAIM_STAGES.map((stage, i) => {
                    const state =
                      rejected && i === currentStage
                        ? 'rejected'
                        : i < currentStage ? 'done'
                          : i === currentStage ? 'current'
                            : 'pending';
                    const meta =
                      state === 'done' ? 'Completed'
                        : state === 'current' ? (rejected ? 'Not approved' : 'Current stage')
                          : 'Pending';
                    return (
                      <li key={stage} className={`atk-step ${state}`}>
                        <span className="atk-step__dot">
                          {state === 'done' && <Check aria-hidden="true" />}
                        </span>
                        <span className="atk-step__text">
                          <span className="atk-step__name">{stage}</span>
                          <span className="atk-step__meta">{meta}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <p className="atk-note">
                <Phone aria-hidden="true" />
                <span>
                  Your coordinator will call the number on the claim with updates. Any questions, call
                  our 24-hour line at <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
                </span>
              </p>
            </div>
          )}
        </div>
      </main>

      <AmaniFooter />

    </div>
  );
}