/* ==========================================================================
   Amani Cover — TRACK A CLAIM  (/amani/claims/track)
   
   Self-contained styling to ensure it renders correctly without Tailwind.
   ========================================================================== */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowLeft } from 'lucide-react';
import { CONTACT } from './amaniData';
import { InsuranceApiError, trackClaim } from '../../../api/insuranceApi';

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
  const [status, setStatus] = useState('idle');
  const [claim, setClaim] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const idNumber = String(new FormData(event.currentTarget).get('idNumber') ?? '').trim();

    if (!idNumber) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const result = await trackClaim({ policyNumber: idNumber });
      const first = result?.found ? result.claims?.[0] : null;

      if (first) {
        setClaim(first);
        setStatus('found');
      } else {
        setClaim(null);
        setStatus('notfound');
      }
    } catch (err) {
      setClaim(null);
      setStatus(err instanceof InsuranceApiError && err.status < 500 ? 'notfound' : 'error');
    }
  }

  const currentStage = claim ? (STAGE_OF[claim.status] ?? 1) : 0;
  const rejected = claim?.status === 'rejected';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');
        
        .amani-track-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
          font-family: 'Inter', sans-serif;
    
          color: #0F172A;
          min-height: 80vh;
        }
        .amani-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748B;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .amani-back-link:hover { color: #0B3F8A; }
        
        .amani-eyebrow {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #2563EB;
          margin-bottom: 1rem;
        }
        .amani-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          line-height: 1.05;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: #0B3F8A;
          margin-bottom: 1.5rem;
        }
        .amani-title em { font-style: italic; color: #2563EB; }
        .amani-subtitle {
          max-width: 600px;
          line-height: 1.6;
          color: #64748B;
          font-size: 1rem;
          margin-bottom: 3rem;
        }
        
        .amani-form { margin-bottom: 2.5rem; }
        .amani-form-group { margin-bottom: 1.5rem; }
        .amani-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: #0B3F8A;
          margin-bottom: 0.75rem;
        }
        .amani-input {
          width: 100%;
          height: 56px;
          padding: 0 1.25rem;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          background: #FFFFFF;
          font-size: 1rem;
          color: #0F172A;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .amani-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        
        .amani-submit-btn {
          height: 52px;
          padding: 0 2rem;
          background: #0B3F8A;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(11, 63, 138, 0.2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .amani-submit-btn:hover { background: #072E63; transform: translateY(-1px); }
        .amani-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        
        .amani-alert-error {
          background: #FEF2F2;
          color: #991B1B;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 2rem;
          border: 1px solid #FEE2E2;
        }
        
        .amani-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 32px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(11, 63, 138, 0.08);
        }
        .amani-card-title {
          font-family: 'Fraunces', serif;
          font-size: 1.8rem;
          color: #0B3F8A;
          margin-bottom: 0.5rem;
        }
        .amani-card-sub {
          font-size: 0.9rem;
          color: #64748B;
          margin-bottom: 2rem;
        }
        
        .amani-timeline {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .amani-t-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding-bottom: 2rem;
        }
        .amani-t-item:last-child { padding-bottom: 0; }
        .amani-t-line {
          position: absolute;
          left: 11px;
          top: 24px;
          bottom: -8px;
          width: 2px;
          background: #E2E8F0;
        }
        .amani-t-item:last-child .amani-t-line { display: none; }
        
        .amani-t-dot {
          position: relative;
          z-index: 2;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .amani-t-dot.done { background: #2563EB; border-color: #2563EB; }
        .amani-t-dot.current { 
          background: #2563EB; 
          border-color: #2563EB; 
          box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.2); 
        }
        
        .amani-t-content { padding-top: 2px; }
        .amani-t-stage {
          font-size: 1rem;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 0.25rem;
        }
        .amani-t-stage.pending { color: #94A3B8; font-weight: 500; }
        .amani-t-stage.current { color: #0B3F8A; }
        .amani-t-meta { font-size: 0.85rem; color: #64748B; }
        .amani-current-tag {
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #2563EB;
        }
      `}</style>

      <div className="amani-track-page">
        <Link to="/amani/cover" className="amani-back-link">
          <ArrowLeft size={16} /> Back to Amani Cover
        </Link>

        <p className="amani-eyebrow">Claim tracking</p>
        <h2 className="amani-title">
          Where is <em>my claim?</em>
        </h2>
        <p className="amani-subtitle">
          Know where your claim stands. Your claim moves through four stages, and your coordinator keeps you informed at every one of them. Enter your National ID / policy number to see how far your claim has progressed.
        </p>

        <form onSubmit={handleSubmit} className="amani-form">
          <div className="amani-form-group">
            <label htmlFor="idNumber" className="amani-label">
              National ID / policy number
            </label>
            <input
              id="idNumber"
              name="idNumber"
              required
              inputMode="numeric"
              autoComplete="off"
              spellCheck="false"
              className="amani-input"
              placeholder="e.g. 29384716"
            />
          </div>

          {status === 'error' && (
            <div className="amani-alert-error">
              Something went wrong. Please try again, or call our 24-hour line at {CONTACT.phone}.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="amani-submit-btn"
          >
            {status === 'submitting' ? 'Checking…' : 'Check my claim'}
          </button>
        </form>

        {status === 'notfound' && (
          <div className="amani-card">
            <h3 className="amani-card-title">We couldn&rsquo;t find that claim.</h3>
            <p className="amani-card-sub">
              Double-check the number on the policy card. If it still doesn&rsquo;t match, call our
              24-hour line at{' '}
              <a href={CONTACT.phoneHref} style={{ color: '#2563EB', fontWeight: '500', textDecoration: 'none' }}>
                {CONTACT.phone}
              </a>{' '}
              and we will find it together.
            </p>
          </div>
        )}

        {status === 'found' && claim && (
          <div className="amani-card">
            <h3 className="amani-card-title">Claim for {claim.deceasedName}</h3>
            <p className="amani-card-sub">
              Submitted{' '}
              {new Date(claim.submittedAt).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            {rejected && (
              <div className="amani-alert-error" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                {REJECTED_COPY}
              </div>
            )}

            <ol className="amani-timeline">
              {CLAIM_STAGES.map((stage, i) => {
                const state = i < currentStage ? 'done' : i === currentStage ? 'current' : 'pending';
                return (
                  <li key={stage} className="amani-t-item">
                    {i < CLAIM_STAGES.length - 1 && <div className="amani-t-line" />}
                    <span className={`amani-t-dot ${state}`}></span>
                    <div className="amani-t-content">
                      <div className={`amani-t-stage ${state}`}>
                        {stage}
                        {state === 'current' && !rejected && (
                          <span className="amani-current-tag">— current stage</span>
                        )}
                      </div>
                      <div className="amani-t-meta">
                        {state === 'done' && 'Completed'}
                        {state === 'pending' && 'Pending'}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', color: '#64748B' }}>
              <Phone size={16} style={{ marginTop: '2px', color: '#2563EB', flexShrink: 0 }} />
              <span>
                Your coordinator will call the number on the claim with updates. Any questions, call
                our 24-hour line at{' '}
                <a href={CONTACT.phoneHref} style={{ color: '#2563EB', fontWeight: '500', textDecoration: 'none' }}>
                  {CONTACT.phone}
                </a>.
              </span>
            </p>
          </div>
        )}
      </div>
    </>
  );
}