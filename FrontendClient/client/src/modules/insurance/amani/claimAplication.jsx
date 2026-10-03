import React, { useState, useEffect } from 'react';

const ClaimSubmissionForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        phone: '',
        relationship: '',
        policyNumber: '',
        deceasedName: '',
        deathDate: '',
        causeDeath: '',
        placeDeath: '',
        notes: '',
        docDeathCert: null,
        docClaimantId: null,
        docBurialPermit: null,
        confirm_accepted: false,
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fillStamp, setFillStamp] = useState('—');

    // Auto-update Date & Time
    useEffect(() => {
        const updateStamp = () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            setFillStamp(`${dateStr} ${timeStr}`);
        };
        updateStamp();
        const interval = setInterval(updateStamp, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files.length > 0 ? files[0] : null;
        setFormData((prev) => ({ ...prev, [name]: file }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateField(name);
    };

    const validateField = (name) => {
        let isValid = true;
        const value = formData[name];

        switch (name) {
            case 'fullName':
            case 'idNumber':
            case 'relationship':
            case 'policyNumber':
            case 'deceasedName':
            case 'causeDeath':
            case 'placeDeath':
                isValid = value.trim().length > 1;
                break;
            case 'phone':
                isValid = value.replace(/\D/g, '').length >= 9;
                break;
            case 'deathDate':
                isValid = value !== '';
                break;
            case 'docDeathCert':
            case 'docClaimantId':
            case 'docBurialPermit':
                isValid = value !== null;
                break;
            case 'confirm_accepted':
                isValid = value === true;
                break;
            default:
                break;
        }

        setErrors((prev) => ({ ...prev, [name]: isValid ? undefined : getErrorMessage(name) }));
        return isValid;
    };

    const getErrorMessage = (name) => {
        switch (name) {
            case 'fullName': return 'Full name is required.';
            case 'idNumber': return 'Valid ID is required.';
            case 'phone': return 'Valid phone required.';
            case 'relationship': return 'Relationship is required.';
            case 'policyNumber': return 'Policy number required.';
            case 'deceasedName': return 'Deceased name required.';
            case 'deathDate': return 'Date required.';
            case 'causeDeath': return 'Cause of death required.';
            case 'placeDeath': return 'Place of death required.';
            case 'docDeathCert': return 'Required document missing.';
            case 'docClaimantId': return 'Required document missing.';
            case 'docBurialPermit': return 'Required document missing.';
            case 'confirm_accepted': return 'Please tick the box to declare before submitting.';
            default: return 'This field is required.';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const fieldsToValidate = [
            'fullName', 'idNumber', 'phone', 'relationship', 'policyNumber',
            'deceasedName', 'deathDate', 'causeDeath', 'placeDeath',
            'docDeathCert', 'docClaimantId', 'docBurialPermit', 'confirm_accepted'
        ];

        let formIsValid = true;
        const newErrors = {};
        const newTouched = {};

        fieldsToValidate.forEach((field) => {
            newTouched[field] = true;
            let isValid = true;
            const value = formData[field];

            switch (field) {
                case 'fullName':
                case 'idNumber':
                case 'relationship':
                case 'policyNumber':
                case 'deceasedName':
                case 'causeDeath':
                case 'placeDeath':
                    isValid = value.trim().length > 1; break;
                case 'phone': isValid = value.replace(/\D/g, '').length >= 9; break;
                case 'deathDate': isValid = value !== ''; break;
                case 'docDeathCert':
                case 'docClaimantId':
                case 'docBurialPermit':
                    isValid = value !== null; break;
                case 'confirm_accepted': isValid = value === true; break;
                default: break;
            }

            if (!isValid) {
                newErrors[field] = getErrorMessage(field);
                formIsValid = false;
            }
        });

        setTouched(newTouched);
        setErrors(newErrors);

        if (!formIsValid) {
            const firstError = document.querySelector('.has-error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            alert('Claim submitted successfully!');
            setIsSubmitting(false);
            handleReset();
        }, 1500);
    };

    const handleReset = () => {
        setFormData({
            fullName: '', idNumber: '', phone: '', relationship: '',
            policyNumber: '', deceasedName: '', deathDate: '',
            causeDeath: '', placeDeath: '', notes: '',
            docDeathCert: null, docClaimantId: null, docBurialPermit: null,
            confirm_accepted: false,
        });
        setErrors({});
        setTouched({});
    };

    // Helper to determine input wrapper class
    const getInputWrapClass = (name) => {
        const baseClass = 'input-wrap';
        const value = formData[name];
        let isValid = false;

        switch (name) {
            case 'fullName':
            case 'idNumber':
            case 'relationship':
            case 'policyNumber':
            case 'deceasedName':
            case 'causeDeath':
            case 'placeDeath':
                isValid = value.trim().length > 1; break;
            case 'phone': isValid = value.replace(/\D/g, '').length >= 9; break;
            case 'deathDate': isValid = value !== ''; break;
            default: break;
        }

        let classes = baseClass;
        if (isValid && value) classes += ' is-valid';
        if (touched[name] && errors[name]) classes += ' has-error';
        return classes;
    };

    // Helper to determine file wrapper class
    const getFileWrapClass = (name) => {
        const baseClass = 'file-wrap';
        const value = formData[name];
        let classes = baseClass;
        if (value !== null) classes += ' is-valid';
        if (touched[name] && errors[name]) classes += ' has-error';
        return classes;
    };

    /* Every rule below is prefixed `.amani-claimform` (see the script that rewrote
       this sheet). That matters: as authored this stylesheet also declared
       `:root`, `*` and `body`, which from a single route would restyle the
       ENTIRE single-page app, and its `.container` rule collided with
       Bootstrap's global `.container`. Do not add an unprefixed rule. */
    const styles = `
    :root {
      --ink: #15171a;
      --bone: #ffffff;
      --bone2: #f8fafc;
      --brass: #5e6a73;
      --gray: #8a929b;
      --line: #e2e8f0;
      --error-red: #dc2626;
      --blue-primary: #0B3F8A;
      --blue-hover: #082c63;
      --blue-tick: #2563eb;
      --blue-bg: #eff6ff;
      --gutter: 96px;
      --gutter-tablet: 64px;
      --gutter-mobile: 32px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      background: var(--bone);
      font-family: 'Saira', sans-serif;
      color: var(--ink);
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--bone);
      position: relative;
      padding-bottom: 60px;
      overflow: hidden;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 8rem;
      font-weight: 800;
      color: rgba(15, 23, 42, 0.02);
      font-family: 'Fraunces', serif;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .content-wrapper { position: relative; z-index: 1; }

    /* === TOP DOCUMENT STRIP === */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem var(--gutter);
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--bone2);
      border-bottom: 1px solid var(--line);
    }
    .hdr-brand {
      font-family: 'Fraunces', serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .hdr-brand span { color: var(--blue-primary); font-weight: 700; }

    .hdr-right {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(11, 63, 138, 0.05);
    }
    .hdr-label {
      font-size: 0.65rem;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: var(--blue-primary);
      font-family: 'JetBrains Mono', monospace;
      opacity: 0.8;
    }
    .hdr-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--blue-primary);
    }

    /* === FORM INTRO: "Submit a Claim" & "What's Needed" === */
    .form-intro {
      padding: 4rem var(--gutter) 3rem;
      border-bottom: 1px solid var(--line);
      background: white;
    }
    .intro-title {
      font-family: 'Fraunces', serif;
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 500;
      color: var(--ink);
      margin: 0 0 1.5rem 0;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .intro-title span { color: var(--blue-primary); font-style: italic; }

    .intro-subtitle {
      font-size: 1.1rem;
      color: var(--gray);
      max-width: 700px;
      margin-bottom: 2.5rem;
      line-height: 1.6;
    }

    .checklist-card {
      background: var(--blue-bg);
      border: 1px solid #dbeafe;
      border-radius: 16px;
      padding: 2rem;
      max-width: 800px;
    }
    .checklist-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--blue-primary);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.95rem;
      color: var(--ink);
      font-weight: 500;
    }

    .form-body { padding: 3rem var(--gutter) 1.5rem var(--gutter); }
    .doc-section { margin-bottom: 4rem; }
    .doc-section:last-child { margin-bottom: 0; }

    .section-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--blue-primary);
      border-radius: 4px;
    }

    .section-num {
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'JetBrains Mono', monospace;
    }

    .section-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
      margin: 0;
    }

    .row {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
    }
    .row:last-child { margin-bottom: 0; }

    .col { flex: 1; min-width: 250px; }
    .col-2 { flex: 2; min-width: 400px; }
    .col-half { flex: 0.5; min-width: 120px; }

    .field-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--brass);
      margin-bottom: 0.75rem;
      font-family: 'Saira', sans-serif;
    }
    .req { color: var(--error-red); }
    .opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--gray); font-size: 0.7rem; margin-left: 4px;}

    .input-wrap { position: relative; width: 100%; display: flex; align-items: center; }

    .doc-input, .doc-textarea {
      width: 100%;
      border: none;
      border-bottom: 1.5px dashed #cbd5e1;
      background: transparent;
      outline: none;
      padding: 0 2.5rem 0.25rem 0;
      font-family: 'Saira', sans-serif;
      font-size: 1rem;
      font-weight: 400;
      color: var(--ink);
      transition: border-color 0.2s ease;
      box-sizing: border-box;
      appearance: none;
      -webkit-appearance: none;
    }

    .doc-input { height: 2.75rem; }
    .doc-textarea { 
      padding: 0.75rem 0; 
      min-height: 80px; 
      resize: vertical; 
      line-height: 1.5; 
    }

    .doc-input:focus, .doc-textarea:focus { border-bottom: 1.5px solid var(--blue-primary); }
    .doc-input::placeholder, .doc-textarea::placeholder { color: #94a3b8; font-weight: 400; }

    .tick-icon {
      position: absolute;
      right: 0.25rem;
      top: 1.25rem;
      transform: translateY(-50%);
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--blue-tick);
      color: white;
      display: none;
      place-items: center;
      pointer-events: none;
    }
    .doc-textarea + .tick-icon { top: 1.5rem; }
    .tick-icon svg { width: 16px; height: 16px; stroke-width: 2.5; }
    .input-wrap.is-valid .tick-icon { display: grid; }

    .err-msg { color: var(--error-red); font-size: 0.75rem; margin-top: 0.3rem; display: none; }
    .input-wrap.has-error .doc-input, .input-wrap.has-error .doc-textarea { border-bottom-color: var(--error-red); }
    .input-wrap.has-error .err-msg { display: block; }

    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .file-wrap {
      position: relative;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      padding: 1.5rem;
      background: var(--bone2);
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 180px;
    }

    .file-wrap:hover {
      border-color: var(--blue-primary);
      background: var(--blue-bg);
    }

    .file-wrap input[type="file"] {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .file-icon {
      width: 40px;
      height: 40px;
      margin-bottom: 1rem;
      color: var(--blue-primary);
      background: #dbeafe;
      border-radius: 50%;
      display: grid;
      place-items: center;
      transition: all 0.2s ease;
    }
    .file-wrap.is-valid .file-icon {
      background: var(--blue-tick);
      color: white;
    }

    .file-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--ink);
      margin-bottom: 0.25rem;
    }
    .file-sub {
      font-size: 0.75rem;
      color: var(--gray);
      word-break: break-all;
    }
    .file-wrap.is-valid .file-sub { color: var(--blue-tick); font-weight: 600; }
    .file-wrap.has-error { border-color: var(--error-red); background: #fef2f2; }
    .file-wrap.has-error .err-msg { display: block; }

    .confirm-block {
      margin-top: 2.5rem;
      padding: 1.1rem 1.3rem 1.25rem;
      background: var(--blue-bg);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      border-left: 3px solid var(--blue-primary);
    }
    .confirm-label { display: flex; align-items: flex-start; gap: 0.8rem; cursor: pointer; user-select: none; }
    .confirm-box {
      appearance: none;
      width: 22px;
      height: 22px;
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      background: var(--bone);
      position: relative;
      cursor: pointer;
      flex: none;
      margin-top: 0.05rem;
      transition: all 0.15s ease;
    }
    .confirm-box:checked { background: var(--blue-primary); border-color: var(--blue-primary); }
    .confirm-box:checked::after {
      content: '';
      position: absolute;
      left: 7px; top: 2px;
      width: 6px; height: 12px;
      border: solid white;
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
    }
    .confirm-text {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.5;
      color: var(--ink);
      padding-top: 0.1rem;
    }

    .actions-container {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--line);
      flex-wrap: wrap;
    }

    .btn {
      border: none;
      border-radius: 4px;
      padding: 1rem 2rem;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: 'Saira', sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .btn:disabled { background: #94a3b8 !important; cursor: not-allowed; opacity: 0.6; transform: none !important; box-shadow: none !important; }

    .btn-ghost { background: transparent; color: var(--gray); border: 1px solid var(--line); }
    .btn-ghost:hover { color: var(--blue-primary); border-color: var(--blue-primary); }

    .btn-secondary { background: #ffffff; color: var(--blue-primary); border: 1px solid var(--blue-primary); }
    .btn-secondary:hover { background: var(--blue-bg); transform: translateY(-1px); }

    .btn-primary { 
      background: var(--blue-primary); 
      color: #ffffff; 
      box-shadow: 0 4px 12px rgba(11, 63, 138, 0.15);
    }
    .btn-primary:hover { 
      background: var(--blue-hover); 
      transform: translateY(-1px); 
      box-shadow: 0 8px 20px rgba(11, 63, 138, 0.25); 
    }

    .record-strip {
      font-size: 0.65rem;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: var(--gray);
      font-family: 'JetBrains Mono', monospace;
      text-align: center;
      line-height: 1.7;
      margin: 2rem var(--gutter) 0;
      padding: 0.9rem 1rem 0.4rem;
      border-top: 1px solid var(--line);
    }

    @media (max-width: 1024px) {
      .doc-header, .form-body, .record-strip, .form-intro { padding-left: var(--gutter-tablet); padding-right: var(--gutter-tablet); }
      .col, .col-2, .col-half { flex: 1 1 100%; min-width: 100%; }
      .row { flex-direction: column; gap: 1.5rem; margin-bottom: 1.5rem; }
      .actions-container { flex-direction: column-reverse; }
      .actions-container .btn { width: 100%; }
      .checklist-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .doc-header, .form-body, .record-strip, .form-intro { padding-left: var(--gutter-mobile); padding-right: var(--gutter-mobile); }
      .hdr-right { width: 100%; justify-content: space-between; }
    }
  `;

    const TickSvg = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    return (
        <>
            <style>{styles}</style>

            <div className="container amani-claimform">
                <div className="watermark">OFFICIAL RECORD</div>

                <div className="content-wrapper">

                    {/* Form Intro: Submit a Claim & Checklist */}
                    <div className="form-intro">
                        <h1 className="intro-title">Submit a <span>Claim</span></h1>
                        <p className="intro-subtitle">
                            We are deeply sorry for your loss. Please complete the form below to initiate the claims process.
                            To ensure a smooth and swift review, please have the following information and documents ready before you begin.
                        </p>

                        <div className="checklist-card">
                            <div className="checklist-title">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', stroke: 'var(--blue-primary)' }}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                What you will need:
                            </div>
                            <div className="checklist-grid">
                                <div className="check-item">
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', stroke: 'var(--blue-tick)', flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                                    Claimant & Deceased ID details
                                </div>
                                <div className="check-item">
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', stroke: 'var(--blue-tick)', flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                                    Amani Cover Policy Number
                                </div>
                                <div className="check-item">
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', stroke: 'var(--blue-tick)', flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                                    Date, place, and cause of passing
                                </div>
                                <div className="check-item">
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', stroke: 'var(--blue-tick)', flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                                    Death Certificate & Burial Permit
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="form-body">
                        <form onSubmit={handleSubmit} noValidate>

                            {/* Section 1 */}
                            <section className="doc-section">
                                <div className="section-head">
                                    <span className="section-num">01</span>
                                    <h2 className="section-title">Claimant Information</h2>
                                </div>
                                <div className="row">
                                    <div className="col-2">
                                        <label className="field-label">Claimant Full Name <span className="req">*</span></label>
                                        <div className={getInputWrapClass('fullName')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="fullName"
                                                placeholder="Enter full legal name"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.fullName && <span className="err-msg">{errors.fullName}</span>}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <label className="field-label">Claimant ID Number <span className="req">*</span></label>
                                        <div className={getInputWrapClass('idNumber')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="idNumber"
                                                placeholder="National ID / Passport"
                                                value={formData.idNumber}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.idNumber && <span className="err-msg">{errors.idNumber}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col">
                                        <label className="field-label">Phone Number <span className="req">*</span></label>
                                        <div className={getInputWrapClass('phone')}>
                                            <input
                                                className="doc-input"
                                                type="tel"
                                                name="phone"
                                                placeholder="e.g., 0712345678"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.phone && <span className="err-msg">{errors.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <label className="field-label">Relationship to Deceased <span className="req">*</span></label>
                                        <div className={getInputWrapClass('relationship')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="relationship"
                                                placeholder="e.g., Spouse, Child"
                                                value={formData.relationship}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.relationship && <span className="err-msg">{errors.relationship}</span>}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section className="doc-section">
                                <div className="section-head">
                                    <span className="section-num">02</span>
                                    <h2 className="section-title">Policy & Incident Details</h2>
                                </div>
                                <div className="row">
                                    <div className="col">
                                        <label className="field-label">Policy / Cover Number <span className="req">*</span></label>
                                        <div className={getInputWrapClass('policyNumber')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="policyNumber"
                                                placeholder="e.g., AMN-2024-00123"
                                                value={formData.policyNumber}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.policyNumber && <span className="err-msg">{errors.policyNumber}</span>}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <label className="field-label">Deceased Full Name <span className="req">*</span></label>
                                        <div className={getInputWrapClass('deceasedName')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="deceasedName"
                                                placeholder="Name of the departed"
                                                value={formData.deceasedName}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.deceasedName && <span className="err-msg">{errors.deceasedName}</span>}
                                        </div>
                                    </div>
                                    <div className="col-half">
                                        <label className="field-label">Date of Death <span className="req">*</span></label>
                                        <div className={getInputWrapClass('deathDate')}>
                                            <input
                                                className="doc-input"
                                                type="date"
                                                name="deathDate"
                                                value={formData.deathDate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.deathDate && <span className="err-msg">{errors.deathDate}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-2">
                                        <label className="field-label">Cause of Death <span className="req">*</span></label>
                                        <div className={getInputWrapClass('causeDeath')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="causeDeath"
                                                placeholder="As certified on medical document"
                                                value={formData.causeDeath}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.causeDeath && <span className="err-msg">{errors.causeDeath}</span>}
                                        </div>
                                    </div>
                                    <div className="col">
                                        <label className="field-label">Place of Death <span className="req">*</span></label>
                                        <div className={getInputWrapClass('placeDeath')}>
                                            <input
                                                className="doc-input"
                                                type="text"
                                                name="placeDeath"
                                                placeholder="Hospital / Location"
                                                value={formData.placeDeath}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className="tick-icon"><TickSvg /></div>
                                            {errors.placeDeath && <span className="err-msg">{errors.placeDeath}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-2">
                                        <label className="field-label">Additional Notes <span className="opt">(Optional)</span></label>
                                        <div className="input-wrap">
                                            <textarea
                                                className="doc-textarea"
                                                name="notes"
                                                placeholder="Any other relevant information regarding the claim..."
                                                value={formData.notes}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section className="doc-section">
                                <div className="section-head">
                                    <span className="section-num">03</span>
                                    <h2 className="section-title">Attached Supporting Documents</h2>
                                </div>
                                <div className="file-grid">
                                    <div className={getFileWrapClass('docDeathCert')}>
                                        <input
                                            type="file"
                                            name="docDeathCert"
                                            accept=".pdf,.jpg,.png"
                                            onChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                        <div className="file-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        </div>
                                        <div className="file-title">Death Certificate</div>
                                        <div className="file-sub">
                                            {formData.docDeathCert ? formData.docDeathCert.name : 'Click to upload (PDF/JPG)'}
                                        </div>
                                        {errors.docDeathCert && <span className="err-msg" style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center' }}>{errors.docDeathCert}</span>}
                                    </div>

                                    <div className={getFileWrapClass('docClaimantId')}>
                                        <input
                                            type="file"
                                            name="docClaimantId"
                                            accept=".pdf,.jpg,.png"
                                            onChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                        <div className="file-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        </div>
                                        <div className="file-title">Claimant ID Copy</div>
                                        <div className="file-sub">
                                            {formData.docClaimantId ? formData.docClaimantId.name : 'Click to upload (PDF/JPG)'}
                                        </div>
                                        {errors.docClaimantId && <span className="err-msg" style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center' }}>{errors.docClaimantId}</span>}
                                    </div>

                                    <div className={getFileWrapClass('docBurialPermit')}>
                                        <input
                                            type="file"
                                            name="docBurialPermit"
                                            accept=".pdf,.jpg,.png"
                                            onChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                        <div className="file-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                                        </div>
                                        <div className="file-title">Burial Permit</div>
                                        <div className="file-sub">
                                            {formData.docBurialPermit ? formData.docBurialPermit.name : 'Click to upload (PDF/JPG)'}
                                        </div>
                                        {errors.docBurialPermit && <span className="err-msg" style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center' }}>{errors.docBurialPermit}</span>}
                                    </div>
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section className="doc-section">
                                <div className="section-head">
                                    <span className="section-num">04</span>
                                    <h2 className="section-title">Declaration & Sign-off</h2>
                                </div>

                                <div className="confirm-block" style={touched.confirm_accepted && errors.confirm_accepted ? { borderLeft: '3px solid var(--error-red)' } : {}}>
                                    <label className="confirm-label">
                                        <input
                                            className="confirm-box"
                                            type="checkbox"
                                            name="confirm_accepted"
                                            checked={formData.confirm_accepted}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        <span className="confirm-text">
                                            I confirm that the details recorded above are true and correct, and the attached documents are authentic.
                                        </span>
                                    </label>
                                    {touched.confirm_accepted && errors.confirm_accepted && (
                                        <span className="err-msg" style={{ display: 'block', marginLeft: '2.2rem', marginTop: '0.5rem', color: 'var(--error-red)', fontWeight: 500 }}>
                                            Please tick the box to declare before submitting.
                                        </span>
                                    )}
                                </div>
                            </section>

                            {/* Action Buttons */}
                            <div className="actions-container">
                                <button type="button" className="btn btn-ghost" onClick={handleReset}>
                                    Clear Form
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
                                    Cancel / Back
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                            Submitting Claim...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Submit Claim
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Record Strip */}
                    <div className="record-strip">
                        Montenzuma Monalisa Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        <br />
                        - Official Claim Record -
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClaimSubmissionForm;
