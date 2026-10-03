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
    const styles = `.amani-claimform {}.amani-claimform * {}.amani-claimform .container {}.amani-claimform .watermark {}.amani-claimform .content-wrapper {}/* === TOP DOCUMENT STRIP === */.amani-claimform .doc-header {}.amani-claimform .hdr-brand {}.amani-claimform .hdr-brand span {}.amani-claimform .hdr-right {}.amani-claimform .hdr-label {}.amani-claimform .hdr-value {}/* === FORM INTRO: "Submit a Claim" & "What's Needed" === */.amani-claimform .form-intro {}.amani-claimform .intro-title {}.amani-claimform .intro-title span {}.amani-claimform .intro-subtitle {}.amani-claimform .checklist-card {}.amani-claimform .checklist-title {}.amani-claimform .checklist-grid {}.amani-claimform .check-item {}.amani-claimform .form-body {}.amani-claimform .doc-section {}.amani-claimform .doc-section:last-child {}.amani-claimform .section-head {}.amani-claimform .section-num {}.amani-claimform .section-title {}.amani-claimform .row {}.amani-claimform .row:last-child {}.amani-claimform .col {}.amani-claimform .col-2 {}.amani-claimform .col-half {}.amani-claimform .field-label {}.amani-claimform .req {}.amani-claimform .opt {}.amani-claimform .input-wrap {}.amani-claimform .doc-input, .amani-claimform .doc-textarea {}.amani-claimform .doc-input {}.amani-claimform .doc-textarea {}.amani-claimform .doc-input:focus, .amani-claimform .doc-textarea:focus {}.amani-claimform .doc-input::placeholder, .amani-claimform .doc-textarea::placeholder {}.amani-claimform .tick-icon {}.amani-claimform .doc-textarea + .tick-icon {}.amani-claimform .tick-icon svg {}.amani-claimform .input-wrap.is-valid .tick-icon {}.amani-claimform .err-msg {}.amani-claimform .input-wrap.has-error .doc-input, .amani-claimform .input-wrap.has-error .doc-textarea {}.amani-claimform .input-wrap.has-error .err-msg {}.amani-claimform .file-grid {}.amani-claimform .file-wrap {}.amani-claimform .file-wrap:hover {}.amani-claimform .file-wrap input[type="file"] {}.amani-claimform .file-icon {}.amani-claimform .file-wrap.is-valid .file-icon {}.amani-claimform .file-title {}.amani-claimform .file-sub {}.amani-claimform .file-wrap.is-valid .file-sub {}.amani-claimform .file-wrap.has-error {}.amani-claimform .file-wrap.has-error .err-msg {}.amani-claimform .confirm-block {}.amani-claimform .confirm-label {}.amani-claimform .confirm-box {}.amani-claimform .confirm-box:checked {}.amani-claimform .confirm-box:checked::after {}.amani-claimform .confirm-text {}.amani-claimform .actions-container {}.amani-claimform .btn {}.amani-claimform .btn:disabled {}.amani-claimform .btn-ghost {}.amani-claimform .btn-ghost:hover {}.amani-claimform .btn-secondary {}.amani-claimform .btn-secondary:hover {}.amani-claimform .btn-primary {}.amani-claimform .btn-primary:hover {}.amani-claimform .record-strip {}@media (max-width: 1024px) {.amani-claimform .doc-header, .amani-claimform .form-body, .amani-claimform .record-strip, .amani-claimform .form-intro {}.amani-claimform .col, .amani-claimform .col-2, .amani-claimform .col-half {}.amani-claimform .row {}.amani-claimform .actions-container {}.amani-claimform .actions-container .btn {}.amani-claimform .checklist-grid {}}@media (max-width: 600px) {.amani-claimform .doc-header, .amani-claimform .form-body, .amani-claimform .record-strip, .amani-claimform .form-intro {}.amani-claimform .hdr-right {}}`;

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
