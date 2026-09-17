import { useState, useEffect } from 'react';
import api from '../../api/axios';

/**
 * DemoRequestPanel — "Request Free Demo" slide-out panel pinned to the right edge
 * of the landing page.
 *
 * A vertical trigger tab slides a split-layout panel in from the right:
 *  - Left: image + concierge offer copy
 *  - Right: account-setup trial request form with a dynamic "multi-branch"
 *    field, then a success overlay once submitted.
 *
 * Styling is fully self-contained in a scoped <style> block (same pattern as
 * FloatingCTA.jsx). Font Awesome 6 is loaded globally via index.html.
 */
const DemoRequestPanel = () => {
  const [open, setOpen] = useState(false);
  const [branchType, setBranchType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    funeralHomeName: '',
    location: '',
    email: '',
    phone: '',
    branches: '',
  });

  // Lock page scroll while the panel is open so the background stays put.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      // Let the slide-out animation finish before resetting the success state.
      setTimeout(() => {
        setSubmitted(false);
        setSubmitting(false);
      }, 500);
    } else {
      setOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      type: 'trial_request',
      subject: '21-day free trial request',
      message: [
        `Funeral Home: ${form.funeralHomeName.trim()}`,
        `Location: ${form.location.trim()}`,
        `Email: ${form.email.trim()}`,
        `Phone: ${form.phone.trim()}`,
        `Branch Type: ${branchType || 'single'}`,
        branchType === 'multi' && form.branches.trim() ? `Branches: ${form.branches.trim()}` : '',
        'Trial: 21-day free trial',
      ].filter(Boolean).join('\n'),
      tenantName: 'Restpoint Landing Page',
      userEmail: form.email.trim(),
      userName: form.funeralHomeName.trim() || 'New lead',
    };

    try {
      await api.post('/support/tickets', payload, {
        headers: { 'x-tenant-slug': 'system_shared' },
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit free-trial request:', error);
      alert('We could not send your trial request right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        /* ============================================================
           REQUEST FREE DEMO — SLIDE-OUT PANEL
           (scoped with the "drp-" prefix to avoid collisions)
           ============================================================ */

        /* --- Vertical Trigger Tab (right edge) --- */
        .drp-trigger {
          position: fixed;
          top: 50%;
          right: 0;
          transform: translateY(-50%) rotate(90deg);
          transform-origin: right center;
          background: #0A0A0A;
          color: #C8B292;
          padding: 1.3rem 1.8rem; /* Increased padding for size */
          border-radius: 10px 0 0 10px;
          border: 1px solid rgba(169, 143, 110, 0.5);
          border-right: none;
          cursor: pointer;
          z-index: 1400;
          box-shadow: -8px 0 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(169, 143, 110, 0.2); /* Added glow */
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 0.8rem;
          font-family: 'Inter', sans-serif;
          margin-right: 15px; /* Pushed left off the edge to be visible */
        }
        .drp-trigger:hover {
          background: #A98F6E;
          color: #0A0A0A;
          padding-right: 2.2rem;
          box-shadow: -8px 0 25px rgba(0, 0, 0, 0.5), 0 0 25px rgba(169, 143, 110, 0.4);
        }
        .drp-trigger i {
          transform: rotate(-90deg);
          font-size: 1.1rem;
        }

        /* Pulsing dot on the trigger */
        .drp-dot {
          width: 0.6rem;
          height: 0.6rem;
          background: #A98F6E;
          border-radius: 50%;
          animation: drp-pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes drp-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(169, 143, 110, 0); }
          100% { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0); }
        }

        /* --- Backdrop Overlay --- */
        .drp-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1300;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .drp-backdrop.show {
          opacity: 1;
          pointer-events: auto;
        }

        /* --- Floating Close Button --- */
        .drp-close-fixed {
          position: fixed;
          top: 25px;
          right: 25px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0A0A0A;
          border: 1px solid rgba(169, 143, 110, 0.5);
          color: #A98F6E;
          font-size: 1.3rem;
          cursor: pointer;
          z-index: 1500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .drp-close-fixed.show {
          opacity: 1;
          pointer-events: auto;
        }
        .drp-close-fixed:hover {
          background: #A98F6E;
          color: #0A0A0A;
          transform: rotate(90deg);
        }

        /* --- Slide-out Panel --- */
        .drp-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 100%;
          max-width: 900px;
          background-color: #0A0A0A;
          transform: translateX(100%);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1400; /* Sits above backdrop */
          display: flex;
          box-shadow: -20px 0 50px rgba(0, 0, 0, 0.3);
          font-family: 'Inter', sans-serif;
          color: #FAF8F4;
          overflow: hidden;
        }
        .drp-panel.active { transform: translateX(0); }

        /* --- Image Side --- */
        .drp-image-side {
          width: 40%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
        }
        .drp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.95) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
        }
        .drp-badge-wrap { margin-bottom: 1rem; }
        .drp-badge {
          display: inline-block;
          padding: 0.4rem 0.75rem;
          background: rgba(169, 143, 110, 0.2);
          border: 1px solid rgba(169, 143, 110, 0.5);
          color: #C8B292;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .drp-title {
          font-family: 'Fraunces', serif;
          font-size: 2.25rem;
          line-height: 1.25;
          color: #FAF8F4;
          margin-bottom: 0.75rem;
        }
        .drp-title em { font-style: italic; }
        .drp-check-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .drp-check {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #FAF8F4;
        }
        .drp-check i { color: #A98F6E; }
        .drp-check span { font-size: 0.875rem; }
        .drp-divider {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(250, 248, 244, 0.1);
        }
        .drp-quote {
          color: #8A8A8A;
          font-size: 0.75rem;
          font-style: italic;
          line-height: 1.6;
        }
        .drp-quote-author {
          color: #C8B292;
          font-size: 0.875rem;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        /* --- Form Side --- */
        .drp-form-side {
          width: 60%;
          display: flex;
          flex-direction: column;
          background-image: radial-gradient(circle at 90% 10%, rgba(61, 79, 71, 0.15) 0%, transparent 50%);
          position: relative;
        }
        .drp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #222;
          flex-shrink: 0;
        }
        .drp-header-label {
          font-size: 0.75rem;
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0;
        }
        .drp-header-title {
          font-family: 'Fraunces', serif;
          font-size: 1.25rem;
          color: #FAF8F4;
          margin: 0.25rem 0 0;
        }
        .drp-close { /* Keeping original close style hidden in header if needed, but floating is primary */
          background: none;
          border: none;
          color: #8A8A8A;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.3s;
          display: none; 
        }
        .drp-close:hover { color: #ffffff; }

        .drp-body {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }
        .drp-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Inputs */
        .drp-label {
          font-size: 10px;
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }
        .drp-input, .drp-select, .drp-textarea {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(138, 138, 138, 0.3);
          padding: 0.75rem 0;
          color: #FAF8F4;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.3s;
          resize: none;
          font-family: 'Inter', sans-serif;
          border-radius: 0;
        }
        .drp-input:focus, .drp-select:focus, .drp-textarea:focus {
          border-bottom-color: #A98F6E;
        }
        .drp-input::placeholder, .drp-textarea::placeholder { color: #555; }

        .drp-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A98F6E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right center;
          background-size: 10px;
          padding-right: 24px;
        }
        .drp-select option { background: #141414; color: #FAF8F4; }

        /* Dynamic branch field */
        .drp-branch {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, margin-top 0.4s ease, opacity 0.3s ease;
          opacity: 0;
        }
        .drp-branch.active {
          max-height: 200px;
          margin-top: 1.5rem;
          opacity: 1;
        }

        .drp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .drp-submit {
          background: linear-gradient(135deg, #A98F6E 0%, #C8B292 100%);
          color: #0A0A0A;
          width: 100%;
          padding: 1rem;
          border-radius: 6px;
          border: none;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        .drp-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(169, 143, 110, 0.2);
        }
        .drp-submit:disabled {
          opacity: 0.6;
          cursor: default;
          transform: none;
          box-shadow: none;
        }

        .drp-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #555;
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        /* --- Success Overlay --- */
        .drp-success {
          display: none;
          position: absolute;
          inset: 0;
          background: #0A0A0A;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          z-index: 10;
        }
        .drp-success.show { display: flex; }
        .drp-success-icon {
          width: 4rem;
          height: 4rem;
          background: #3D4F47;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border: 1px solid #A98F6E;
        }
        .drp-success-icon i { color: #A98F6E; font-size: 1.5rem; }
        .drp-success-title {
          font-family: 'Fraunces', serif;
          font-size: 1.875rem;
          color: #FAF8F4;
          margin: 0 0 0.75rem;
        }
        .drp-success-text {
          color: #8A8A8A;
          max-width: 24rem;
          margin: 0 0 2rem;
          line-height: 1.7;
          font-size: 0.95rem;
        }
        .drp-success-close {
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 0.875rem;
          border: none;
          background: none;
          border-bottom: 1px solid #A98F6E;
          padding-bottom: 0.25rem;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .drp-image-side { display: none; }
          .drp-form-side { width: 100%; }
          .drp-panel { max-width: 100%; }
        }
        @media (max-width: 640px) {
          .drp-grid { grid-template-columns: 1fr; }
          .drp-overlay { padding: 2rem; }
          .drp-body { padding: 1.5rem; }
        }
      `}</style>

      {/* Vertical Trigger Button */}
      <button className="drp-trigger" onClick={toggle} aria-label="Request Free Demo" aria-expanded={open}>
        <span className="drp-dot" />
        Request Free Demo
        <i className="fas fa-arrow-left" aria-hidden="true" />
      </button>

      {/* Backdrop Overlay (Click to close) */}
      <div 
        className={`drp-backdrop ${open ? 'show' : ''}`} 
        onClick={toggle} 
        aria-hidden="true" 
      />

      {/* Floating Close Button */}
      <button 
        type="button" 
        className={`drp-close-fixed ${open ? 'show' : ''}`} 
        onClick={toggle} 
        aria-label="Close panel"
      >
        <i className="fas fa-times" aria-hidden="true" />
      </button>

      {/* The Panel Itself (Split Layout) */}
      <div className={`drp-panel ${open ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label="Request Free Demo">

        {/* Left Side: Image & Offer */}
        <div className="drp-image-side">
          <div className="drp-overlay">
            <div className="drp-badge-wrap">
              <span className="drp-badge">Concierge Onboarding</span>
            </div>
            <h2 className="drp-title">
              Experience <em>Restpoint</em> Risk-Free.
            </h2>
            <div className="drp-check-list">
              <div className="drp-check">
                <i className="fas fa-check-circle" aria-hidden="true" />
                <span>21-Day Free Trial</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="drp-form-side">

          {/* Form Content */}
          <div className="drp-body" style={{ paddingTop: '5rem' }}> {/* Added top padding to account for floating close button */}
            <form className="drp-form" onSubmit={handleSubmit}>
              <div>
                <label className="drp-label" htmlFor="drp-home-name">Funeral Home Name</label>
                <input id="drp-home-name" type="text" className="drp-input" placeholder="Sterling & Hayes Memorial" value={form.funeralHomeName} onChange={(e) => setForm((prev) => ({ ...prev, funeralHomeName: e.target.value }))} required />
              </div>

              <div>
                <label className="drp-label" htmlFor="drp-location">Location (City, Country)</label>
                <input id="drp-location" type="text" className="drp-input" placeholder="Nairobi, Kenya" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} required />
              </div>

              <div>
                <label className="drp-label" htmlFor="drp-branch-type">Establishment Scale</label>
                <select
                  id="drp-branch-type"
                  className="drp-select"
                  value={branchType}
                  onChange={(e) => setBranchType(e.target.value)}
                  required
                >
                  <option value="" disabled>Select branch type</option>
                  <option value="single">Single Branch</option>
                  <option value="multi">Multi-Branch Network</option>
                </select>
              </div>

              {/* Dynamic Multi-Branch Field */}
              <div className={`drp-branch ${branchType === 'multi' ? 'active' : ''}`}>
                <label className="drp-label" htmlFor="drp-branches">List All Branches</label>
                <textarea id="drp-branches" className="drp-textarea" rows="3" placeholder="e.g., Nairobi HQ, Mombasa Branch, Kisumu Branch" value={form.branches} onChange={(e) => setForm((prev) => ({ ...prev, branches: e.target.value }))} />
              </div>

              <div className="drp-grid">
                <div>
                  <label className="drp-label" htmlFor="drp-email">Work Email</label>
                  <input id="drp-email" type="email" className="drp-input" placeholder="director@sterling.com" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="drp-label" htmlFor="drp-phone">Phone Number</label>
                  <input id="drp-phone" type="tel" className="drp-input" placeholder="+254 712 345 678" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
                </div>
              </div>

              <div>
                <button type="submit" className="drp-submit" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Activate My Trial'}
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </button>
              </div>

              <div className="drp-note">
                <i className="fas fa-shield-halved" aria-hidden="true" />
                <span>No credit card required for 14-day trial</span>
              </div>

            </form>
          </div>

          {/* Success Message */}
          <div className={`drp-success ${submitted ? 'show' : ''}`}>
            <div className="drp-success-icon">
              <i className="fas fa-check" aria-hidden="true" />
            </div>
            <h3 className="drp-success-title">Trial Activated.</h3>
            <p className="drp-success-text">
              Thank you. We will set up your account and our concierge team will contact you shortly to begin onboarding.
            </p>
            <button type="button" className="drp-success-close" onClick={toggle}>
              Close Window
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DemoRequestPanel;