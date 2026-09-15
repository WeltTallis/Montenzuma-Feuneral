import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import env from '../../utils/config/env';

// ─── Google Fonts ────────────────────────────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Karla:wght@400;500;700&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
`;

// ─── Design tokens ────────────────────────────────────────────
const C = {
    ink:       '#16211E',
    pine:      '#1F3D33',
    moss:      '#3E6257',
    gold:      '#C6A15B',
    goldSoft:  '#F3EBD9',
    cream:     '#F6F4EE',
    paper:     '#FFFFFF',
    line:      '#E6E1D5',
    lineSoft:  '#EFECE3',
    muted:     '#8B8677',
    text:      '#232A27',
    ease:      'cubic-bezier(.32, .72, .24, 1)',
    success:   '#1a6641',
    successBg: '#edf7f1',
    error:     '#9b2335',
    errorBg:   '#fdf2f4',
};

const BASE_URL = env.FULL_API_URL;

// ─── Animations ────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`to{transform:rotate(360deg)}`;
const shake  = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

// ─── Layout ────────────────────────────────────────────────────
const Shell = styled.div`
    font-family: 'Outfit', sans-serif;
    background: ${C.cream};
    color: ${C.text};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-font-smoothing: antialiased;
`;

const Card = styled.div`
    max-width: 2200px;
    width: 100%;
    background: ${C.paper};
    border-radius: 10px;
    box-shadow: 0 24px 60px -20px rgba(22,33,30,0.18);
    overflow: hidden;
    border: 1px solid ${C.line};
    margin: 40px 20px 0;
    animation: ${fadeIn} 0.4s ${C.ease} both;

    @media (max-width: 600px) {
        margin: 0;
        border-radius: 0;
        min-height: 100vh;
    }
`;

// ─── Condolence Banner ──────────────────────────────────────────
const Banner = styled.div`
    background: ${C.goldSoft};
    padding: 18px 40px;
    text-align: center;
    border-bottom: 1px solid ${C.line};

    p {
        font-family: 'Fraunces', serif;
        font-size: 15px;
        color: ${C.moss};
        font-weight: 500;
        font-style: italic;
        line-height: 1.4;
        margin: 0;
    }

    @media (max-width: 600px) { padding: 16px 20px; }
`;

// ─── Document Header (QR + timestamp) ──────────────────────────
const DocHeader = styled.header`
    background: ${C.paper};
    padding: 28px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid ${C.lineSoft};

    @media (max-width: 600px) {
        flex-direction: column;
        padding: 20px;
        align-items: center;
        text-align: center;
    }
`;

const HeaderLeft  = styled.div`display:flex;flex-direction:column;gap:14px;`;
const ReqIdBadge  = styled.div`font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:${C.ink};letter-spacing:.02em;display:flex;align-items:center;gap:10px;i{color:${C.gold};font-size:14px}`;
const Timestamps  = styled.div`display:flex;flex-direction:column;gap:7px;`;
const MetaItem    = styled.div`font-size:13px;color:${C.text};display:flex;align-items:center;gap:9px;i{color:${C.muted};font-size:12px;width:15px;text-align:center}span{font-weight:600;color:${C.ink};font-variant-numeric:tabular-nums}`;
const QrWrapper   = styled.div`display:flex;flex-direction:column;align-items:center;gap:8px;`;
const QrBox       = styled.div`width:156px;height:156px;padding:8px;border:1px solid ${C.line};border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.05);`;
const QrLabel     = styled.span`font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:${C.pine};font-weight:700;`;

// ─── Title ──────────────────────────────────────────────────────
const TitleSection = styled.div`
    padding: 28px 40px 20px;
    text-align: center;
    border-bottom: 1px solid ${C.lineSoft};

    h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: ${C.ink}; margin: 0 0 5px; }
    p  { font-size: 13px; color: ${C.muted}; font-style: italic; margin: 0; }

    @media (max-width: 600px) { padding: 20px; }
`;

// ─── Step indicator ─────────────────────────────────────────────
const Steps = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 18px 40px;
    background: ${C.cream};
    border-bottom: 1px solid ${C.line};
`;

const Step = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: ${p => p.$active ? C.pine : p.$done ? C.gold : C.muted};
`;

const StepNum = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    background: ${p => p.$active ? C.pine : p.$done ? C.gold : C.lineSoft};
    color: ${p => (p.$active || p.$done) ? '#fff' : C.muted};
    flex-shrink: 0;
`;

const StepLine = styled.div`
    flex: 1;
    height: 1px;
    background: ${p => p.$done ? C.gold : C.line};
    margin: 0 12px;
    max-width: 60px;
`;

// ─── Form body ──────────────────────────────────────────────────
const Body = styled.div`
    padding: 28px 40px;

    @media (max-width: 600px) { padding: 20px; }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
`;

const Label = styled.label`
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 700;
    color: ${C.moss};
    display: flex;
    align-items: center;
    gap: 7px;

    i { color: ${C.gold}; font-size: 11px; }
`;

const Input = styled.input`
    background: ${C.cream};
    border: 1px solid ${p => p.$error ? C.error : C.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${C.text};
    transition: all .2s ${C.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    animation: ${p => p.$shake ? shake : 'none'} .4s ease;

    &::placeholder { color: #a7a294; }
    &:focus { background: ${C.paper}; border-color: ${C.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
    &:read-only { opacity: .7; cursor: default; }
`;

const Select = styled.select`
    background: ${C.cream};
    border: 1px solid ${C.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${C.text};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    transition: all .2s ${C.ease};

    &:focus { background: ${C.paper}; border-color: ${C.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
`;

const Textarea = styled.textarea`
    background: ${C.cream};
    border: 1px solid ${C.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${C.text};
    transition: all .2s ${C.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 110px;
    line-height: 1.55;

    &::placeholder { color: #a7a294; }
    &:focus { background: ${C.paper}; border-color: ${C.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
`;

// ─── Alert boxes ────────────────────────────────────────────────
const Alert = styled.div`
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: ${p => p.$type === 'success' ? C.successBg : p.$type === 'error' ? C.errorBg : C.goldSoft};
    color:       ${p => p.$type === 'success' ? C.success    : p.$type === 'error' ? C.error    : C.pine};
    border: 1px solid ${p => p.$type === 'success' ? '#a3d4b5' : p.$type === 'error' ? '#e5b5bc' : C.line};

    i { flex-shrink: 0; margin-top: 1px; }
    strong { font-weight: 700; }
`;

// ─── Found case card ─────────────────────────────────────────────
const CaseCard = styled.div`
    background: ${C.cream};
    border: 1px solid ${C.line};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    animation: ${fadeIn} .3s ease both;
`;

const CaseRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 5px 0;
    border-bottom: 1px solid ${C.lineSoft};

    &:last-child { border-bottom: none; }

    span:first-child { color: ${C.muted}; font-weight: 500; }
    span:last-child  { color: ${C.ink};   font-weight: 600; }
`;

// ─── Buttons ────────────────────────────────────────────────────
const FormFooter = styled.div`
    border-top: 1px solid ${C.lineSoft};
    padding: 20px 40px;
    background: #fbfaf7;
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    @media (max-width: 600px) {
        padding: 16px 20px;
        flex-direction: column;
    }
`;

const Btn = styled.button`
    padding: 13px 26px;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s ${C.ease};
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid transparent;
    text-transform: uppercase;
    letter-spacing: .05em;

    &:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

    ${p => p.$ghost && `
        background: ${C.paper};
        border-color: ${C.line};
        color: ${C.muted};
        &:hover:not(:disabled) { border-color: ${C.moss}; color: ${C.pine}; }
    `}

    ${p => p.$primary && `
        background: ${C.ink};
        color: #EDEAE0;
        box-shadow: 0 4px 12px rgba(22,33,30,.15);
        &:hover:not(:disabled) { background: ${C.pine}; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(31,61,51,.2); }
        i { color: ${C.gold}; }
    `}

    ${p => p.$success && `
        background: ${C.success};
        color: #fff;
        box-shadow: 0 4px 12px rgba(26,102,65,.2);
    `}
`;

const Spinner = styled.div`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    animation: ${spin} .8s linear infinite;
    flex-shrink: 0;
`;

// ─── Woodland Elegance Footer ─────────────────────────────────────
const ElegantFooter = styled.footer`
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #2F3A32;
    color: #E9EBDD;
    text-align: center;
    padding: 56px 20px 0;
    border-top: none;
    box-sizing: border-box;

    &::before {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -260px;
        transform: translateX(-50%);
        width: 520px;
        height: 520px;
        border-radius: 50%;
        border: 1.5px solid rgba(233,235,221,.10);
        pointer-events: none;
    }
    &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -320px;
        transform: translateX(-50%);
        width: 680px;
        height: 680px;
        border-radius: 50%;
        border: 1px solid rgba(233,235,221,.06);
        pointer-events: none;
    }

    @media (max-width: 560px) { padding: 44px 20px 0; }
`;

const LeafMark = styled.div`
    width: 44px;
    height: 44px;
    margin: 0 auto 18px;
    border-radius: 50%;
    background: rgba(237,233,219,.12);
    border: 1px solid rgba(237,233,219,.25);
    display: grid;
    place-items: center;
`;

const FooterTagline = styled.p`
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.5;
    color: rgba(237,233,219,.82);
    max-width: 44ch;
    margin: 0 auto;
`;

const FooterValues = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 30px auto 0;
    max-width: 420px;

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(237,233,219,.16);
    }
`;

const FooterValueLabel = styled.span`
    font-family: 'Karla','Segoe UI',sans-serif;
    font-weight: 700;
    font-size: .64rem;
    letter-spacing: .26em;
    text-transform: uppercase;
    color: rgba(205,209,191,.55);
`;

const FooterValueDot = styled.b`
    font-family: 'Cormorant Garamond',Georgia,serif;
    font-weight: 600;
    font-size: 1rem;
    color: rgba(205,209,191,.85);
`;

const FooterBar = styled.div`
    margin-top: 44px;
    border-top: 1px solid rgba(237,233,219,.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 18px 32px;
    font-family: 'Karla','Segoe UI',sans-serif;
    font-weight: 500;
    font-size: .76rem;
    color: rgba(237,233,219,.42);

    @media (max-width: 560px) {
        flex-direction: column;
        gap: 6px;
        padding: 16px 20px;
        text-align: center;
    }
`;

// ─── Component ──────────────────────────────────────────────────
export default function PostmortemRequestForm() {
    const { slug } = useParams();
    const tenantSlug  = slug || (typeof localStorage !== 'undefined' && localStorage.getItem('tenantSlug')) || 'system_shared';
    const verifyUrl   = `${typeof window !== 'undefined' ? window.location.origin : ''}/tenant/${tenantSlug}/postmortem-verify`;

    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    // Step 1 state — lookup
    const [identifier, setIdentifier]   = useState('');
    const [lookupError, setLookupError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundCase, setFoundCase]     = useState(null); // null = not found yet
    const [shakeId, setShakeId]         = useState(false);
    const [searchType, setSearchType]   = useState('phone'); // phone, id_number, admission_number

    // Step 2 state — request form
    const [form, setForm] = useState({ reason: '', requested_by: '', priority: 'normal' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null); // {ok, msg}

    // Timestamp ticker
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        };
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, []);

    // ── Step 1: Lookup ───────────────────────────────────────────
    const handleLookup = async (e) => {
        e.preventDefault();
        const q = identifier.trim();
        if (!q) { setLookupError('Please enter a deceased ID, next-of-kin phone, or ID number.'); return; }

        setIsSearching(true);
        setLookupError('');
        setFoundCase(null);

        // Build search params based on selected search type
        const params = new URLSearchParams();
        if (searchType === 'phone') {
            params.set('phone', q);
        } else if (searchType === 'id_number') {
            params.set('id_number', q);
        } else if (searchType === 'admission_number') {
            params.set('admission_number', q);
        }

        try {
            const res = await axios.get(`${BASE_URL}/public/postmortem/search?${params.toString()}`, {
                headers: { 'x-tenant-slug': tenantSlug },
            });

            const record = res.data?.data?.deceased || res.data?.deceased || res.data?.data;
            if (record && (record.deceased_id || record.full_name)) {
                setFoundCase(record);
            } else {
                setLookupError('No matching deceased record found. Please check the details and try again.');
                setShakeId(true);
                setTimeout(() => setShakeId(false), 500);
            }
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 404) {
                setLookupError('No matching deceased record found. Please check the details and try again.');
            } else {
                setLookupError(msg || 'Unable to search at this time. Please try again shortly.');
            }
            setShakeId(true);
            setTimeout(() => setShakeId(false), 500);
        } finally {
            setIsSearching(false);
        }
    };


    // ── Step 2: Submit request ───────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.reason || !form.requested_by) {
            alert('Please fill in all required fields.');
            return;
        }
        if (!foundCase?.deceased_id) {
            alert('Case not found. Please go back and search again.');
            return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            // POST to the public route (no Bearer token needed)
            const res = await axios.post(
                `${BASE_URL}/public/postmortem/request`,
                {
                    deceased_id:  foundCase.deceased_id,
                    reason:       form.reason,
                    requested_by: form.requested_by,
                    priority:     form.priority,
                    source:       'family_reception', // tag so staff know it came from the portal
                },
                { headers: { 'x-tenant-slug': tenantSlug } }
            );

            if (res.data?.success) {
                setSubmitResult({ ok: true, msg: res.data?.message || 'Postmortem request submitted successfully.' });
                setForm({ reason: '', requested_by: '', priority: 'normal' });
            } else {
                setSubmitResult({ ok: false, msg: res.data?.message || 'Submission failed. Please try again.' });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit postmortem request. Please try again.';
            setSubmitResult({ ok: false, msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const step1Done = !!foundCase;
    const step2Done = submitResult?.ok;

    return (
        <>
            <GlobalStyles />
            <Shell>
                <Card>

                    {/* ── Condolence Banner ── */}
                    <Banner>
                        <p>We are deeply sorry for your loss. Please accept our heartfelt condolences.</p>
                    </Banner>

                    {/* ── Document Header ── */}
                    <DocHeader>
                        <HeaderLeft>
                            <ReqIdBadge>
                                <i className="fas fa-hashtag" /> Postmortem Request Form
                            </ReqIdBadge>
                            <Timestamps>
                                <MetaItem><i className="fas fa-calendar-alt" /><span>{currentDate}</span></MetaItem>
                                <MetaItem><i className="fas fa-clock" /><span>{currentTime}</span></MetaItem>
                            </Timestamps>
                        </HeaderLeft>
                        <QrWrapper>
                            <QrBox>
                                <QRCodeSVG
                                    value={verifyUrl}
                                    size={140}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#FFFFFF"
                                    fgColor={C.ink}
                                />
                            </QrBox>
                            <QrLabel>Scan for Results</QrLabel>
                        </QrWrapper>
                    </DocHeader>

                    {/* ── Title ── */}
                    <TitleSection>
                        <h1>Postmortem Examination Request</h1>
                        <p>Complete all fields accurately to authorize the procedure.</p>
                    </TitleSection>

                    {/* ── Step indicator ── */}
                    <Steps>
                        <Step $active={!step1Done} $done={step1Done}>
                            <StepNum $active={!step1Done} $done={step1Done}>{step1Done ? '✓' : '1'}</StepNum>
                            Find Case
                        </Step>
                        <StepLine $done={step1Done} />
                        <Step $active={step1Done && !step2Done} $done={step2Done}>
                            <StepNum $active={step1Done && !step2Done} $done={step2Done}>{step2Done ? '✓' : '2'}</StepNum>
                            Submit Request
                        </Step>
                        <StepLine $done={step2Done} />
                        <Step $active={false} $done={step2Done}>
                            <StepNum $done={step2Done}>{step2Done ? '✓' : '3'}</StepNum>
                            Confirmed
                        </Step>
                    </Steps>

                    {/* ════════════════════════════════════════════
                        STEP 1 — Case lookup
                    ════════════════════════════════════════════ */}
                    {!step1Done && !step2Done && (
                        <form onSubmit={handleLookup}>
                            <Body>
                                <Alert>
                                    <i className="fas fa-info-circle" />
                                    <div>
                                        Enter the <strong>Deceased Admission Number</strong>, the <strong>Next-of-Kin phone number</strong>,
                                        or the <strong>National ID</strong> to locate the case.
                                    </div>
                                </Alert>

                                {lookupError && (
                                    <Alert $type="error">
                                        <i className="fas fa-exclamation-triangle" />
                                        {lookupError}
                                    </Alert>
                                )}

                                <FormGroup>
                                    <Label htmlFor="searchType">
                                        <i className="fas fa-list" /> Search By
                                    </Label>
                                    <Select
                                        id="searchType"
                                        value={searchType}
                                        onChange={e => { setSearchType(e.target.value); setLookupError(''); }}
                                    >
                                        <option value="phone">Next of Kin Phone</option>
                                        <option value="id_number">National ID</option>
                                        <option value="admission_number">Deceased Admission Number</option>
                                    </Select>
                                </FormGroup>

                                <FormGroup>
                                    <Label htmlFor="identifier">
                                        <i className="fas fa-search" /> {searchType === 'phone' ? 'Phone Number' : searchType === 'id_number' ? 'ID Number' : 'Admission Number'}
                                    </Label>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        placeholder={searchType === 'phone' ? 'e.g. +254700000000' : searchType === 'id_number' ? 'e.g. 12345678' : 'e.g. MON-XXXXXX'}
                                        value={identifier}
                                        onChange={e => { setIdentifier(e.target.value); setLookupError(''); }}
                                        $shake={shakeId}
                                        required
                                    />
                                </FormGroup>
                            </Body>

                            <FormFooter>
                                <Btn type="button" $ghost onClick={() => window.history.back()}>
                                    <i className="fas fa-times" /> Cancel
                                </Btn>
                                <Btn type="submit" $primary disabled={isSearching}>
                                    {isSearching ? <><Spinner /> Searching…</> : <><i className="fas fa-search" /> Find Case</>}
                                </Btn>
                            </FormFooter>
                        </form>
                    )}

                    {/* ════════════════════════════════════════════
                        STEP 2 — Request form (case found)
                    ════════════════════════════════════════════ */}
                    {step1Done && !step2Done && (
                        <form onSubmit={handleSubmit}>
                            <Body>
                                <Alert $type="success">
                                    <i className="fas fa-check-circle" />
                                    <div>Case found. Please review the details below and complete your request.</div>
                                </Alert>

                                {/* Found case summary */}
                                <CaseCard>
                                    <CaseRow>
                                        <span>Full Name</span>
                                        <span>{foundCase.full_name || '—'}</span>
                                    </CaseRow>
                                    <CaseRow>
                                        <span>Admission No.</span>
                                        <span>{foundCase.admission_number || foundCase.deceased_id}</span>
                                    </CaseRow>
                                    {foundCase.date_of_death && (
                                        <CaseRow>
                                            <span>Date of Death</span>
                                            <span>{foundCase.date_of_death}</span>
                                        </CaseRow>
                                    )}
                                    {foundCase.gender && (
                                        <CaseRow>
                                            <span>Gender</span>
                                            <span>{foundCase.gender}</span>
                                        </CaseRow>
                                    )}
                                    {(foundCase.next_of_kin_name || foundCase.next_of_kin) && (
                                        <CaseRow>
                                            <span>Next of Kin</span>
                                            <span>{foundCase.next_of_kin_name || foundCase.next_of_kin}</span>
                                        </CaseRow>
                                    )}
                                    {(foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number) && (
                                        <CaseRow>
                                            <span>Kin Contact</span>
                                            <span>{foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number}</span>
                                        </CaseRow>
                                    )}
                                </CaseCard>

                                {/* Hidden — deceased_id is used in submit */}
                                <FormGroup>
                                    <Label htmlFor="requested_by">
                                        <i className="fas fa-user-shield" /> Requesting Authority / Your Name
                                    </Label>
                                    <Input
                                        id="requested_by"
                                        type="text"
                                        placeholder="e.g. John Kamau (Son), Dr. Mwangi, Police Inspector Oloo"
                                        value={form.requested_by}
                                        onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))}
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label htmlFor="priority">
                                        <i className="fas fa-flag" /> Priority
                                    </Label>
                                    <Select
                                        id="priority"
                                        value={form.priority}
                                        onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="emergency">Emergency</option>
                                    </Select>
                                </FormGroup>

                                <FormGroup style={{ marginBottom: 0 }}>
                                    <Label htmlFor="reason">
                                        <i className="fas fa-align-left" /> Reason for Request
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Please describe the circumstances or reason for requesting the postmortem examination…"
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        required
                                    />
                                </FormGroup>
                            </Body>

                            <FormFooter>
                                <Btn type="button" $ghost onClick={() => { setFoundCase(null); setLookupError(''); }}>
                                    <i className="fas fa-arrow-left" /> Back
                                </Btn>
                                <Btn type="submit" $primary disabled={isSubmitting}>
                                    {isSubmitting ? <><Spinner /> Submitting…</> : <><i className="fas fa-paper-plane" /> Submit Request</>}
                                </Btn>
                            </FormFooter>
                        </form>
                    )}

                    {/* ════════════════════════════════════════════
                        STEP 3 — Confirmation
                    ════════════════════════════════════════════ */}
                    {step2Done && (
                        <>
                            <Body>
                                <Alert $type="success">
                                    <i className="fas fa-check-circle" />
                                    <div>
                                        <strong>Request Submitted.</strong><br />
                                        {submitResult.msg}<br />
                                        <small style={{ opacity: .8, marginTop: 4, display: 'block' }}>
                                            The mortuary team will review your request and contact you shortly.
                                            You can scan the QR code above to check the results later.
                                        </small>
                                    </div>
                                </Alert>
                            </Body>
                            <FormFooter>
                                <Btn $primary onClick={() => { setFoundCase(null); setIdentifier(''); setSubmitResult(null); }}>
                                    <i className="fas fa-plus" /> New Request
                                </Btn>
                            </FormFooter>
                        </>
                    )}

                    {/* ── Woodland Elegance Footer (same as deceased intake) ── */}
                    <ElegantFooter>
                        <LeafMark>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#EDE9DB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="21" height="21">
                                <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" />
                                <path d="M4 20c4-6.5 8.5-10 13-12.5" />
                            </svg>
                        </LeafMark>

                        <FooterTagline>Received with dignity. Cared for with respect. Remembered with love.</FooterTagline>

                        <FooterValues>
                            <FooterValueLabel>Dignity</FooterValueLabel><FooterValueDot>·</FooterValueDot>
                            <FooterValueLabel>Care</FooterValueLabel><FooterValueDot>·</FooterValueDot>
                            <FooterValueLabel>Respect</FooterValueLabel>
                        </FooterValues>

                        <FooterBar>
                            <span>© {new Date().getFullYear()} RestPoint Funeral Management</span>
                            <span>Official Postmortem Request</span>
                        </FooterBar>
                    </ElegantFooter>

                </Card>
            </Shell>
        </>
    );
}