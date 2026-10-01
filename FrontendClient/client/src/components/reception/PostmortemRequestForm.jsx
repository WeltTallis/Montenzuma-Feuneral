import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import env from '../../utils/config/env';
import notify from '../../utils/notify';

// ─── Fonts ──────────────────────────────────────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  img, svg { display: block; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; background: none; border: 0; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

// ─── Design tokens ──────────────────────────────────────────────
const C = {
    ink: '#1a1611',
    ink2: '#5f584c',
    inkFaint: '#a39d90',
    line: '#e6e2d8',
    lineSoft: '#f1efe9',
    paper: '#faf9f6',
    ox: '#7c2b23',
    oxDeep: '#6a241e',
    green: '#3f5138',
    amber: '#a16207',
    red: '#b91c1c',
    ease: 'cubic-bezier(.32, .72, .24, 1)',
    sans: "'Saira', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
};

const BASE_URL = env.FULL_API_URL;

// ─── Animations ─────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeUp = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

// ─── Layout ─────────────────────────────────────────────────────
const Shell = styled.div`
    font-family: ${C.sans};
    background: #fff;
    color: ${C.ink};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-font-smoothing: antialiased;
    overflow-wrap: anywhere;
`;

const Card = styled.div`
    width: 100%;
    max-width: 860px;
    background: #fff;
    box-shadow: 0 2px 6px rgba(26,22,17,.04), 0 24px 60px -24px rgba(26,22,17,.14);
    animation: ${fadeIn} .5s ${C.ease} both;
    display: flex;
    flex-direction: column;

    @media (max-width: 600px) { min-height: 100vh; }
`;

const AccentLine = styled.div`
    height: 3px;
    background: linear-gradient(90deg, ${C.ox} 0 60%, ${C.ink} 60% 100%);
`;

// ─── Condolence (plain white — no background, no border) ────────
const Condolence = styled.div`
    text-align: center;
    padding: 16px 28px;
    font-size: 14.5px;
    line-height: 1.6;
    color: ${C.ink2};
`;

// ─── Document header (step 1 only) ──────────────────────────────
const DocHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 20px 40px;
    border-bottom: 1px solid ${C.lineSoft};

    @media (max-width: 640px) {
        flex-direction: row;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 20px;
    }
`;

const HeaderLeft = styled.div`
    display: flex; flex-direction: column; gap: 8px; min-width: 0;
    @media (max-width: 640px) { flex: 1; }
`;

const DhTitle = styled.div`
    font-size: 17px; font-weight: 600; letter-spacing: -.01em;
    @media (max-width: 640px) { font-size: 15px; }
`;

const DhMeta = styled.div`
    font-family: ${C.mono};
    font-size: .68rem;
    letter-spacing: .08em;
    color: ${C.inkFaint};

    b { color: ${C.ink2}; font-weight: 500; font-variant-numeric: tabular-nums; }
`;

const QrWrapper = styled.div`
    display: flex; flex-direction: column; align-items: center; gap: 8px; flex: none;
`;

const QrBox = styled.div`
    width: 92px; height: 92px; padding: 8px;
    border: 1px solid ${C.lineSoft};
    background: #fff;
    display: flex; align-items: center; justify-content: center;

    svg { width: 100%; height: 100%; display: block; }
    @media (max-width: 640px) { width: 70px; height: 70px; padding: 6px; }
`;

const QrLabel = styled.span`
    font-family: ${C.mono};
    font-size: .56rem; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
    color: ${C.ox};
    text-align: center;
    @media (max-width: 640px) { font-size: 8px; letter-spacing: .12em; }
`;

// ─── Title ──────────────────────────────────────────────────────
const TitleSection = styled.div`
    padding: 30px 40px 26px;
    text-align: center;

    h1 { font-size: 26px; font-weight: 600; letter-spacing: -.01em; }
    h1 em { font-style: italic; color: ${C.ox}; }
    p { font-size: 13.5px; color: ${C.ink2}; margin-top: 6px; }

    @media (max-width: 640px) {
        padding: 24px 20px 20px;
        h1 { font-size: 21px; }
    }
`;

// ─── Section bar (dark ink + mono label) ────────────────────────
const SBar = styled.div`
    display: flex; align-items: center; gap: .75rem;
    margin-bottom: 1.6rem;
    padding: .72rem 1.15rem;
    background: ${C.ink};
    border-radius: 3px;

    .n { font-family: ${C.mono}; font-size: .68rem; font-weight: 500; color: rgba(250,248,244,.42); }
    .t { font-family: ${C.mono}; font-size: .78rem; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #faf8f4; }
`;

// ─── Body / footer ──────────────────────────────────────────────
const Body = styled.div`
    padding: 28px 40px;
    @media (max-width: 640px) { padding: 22px 20px; }
`;

const FormFooter = styled.div`
    border-top: 1px solid ${C.lineSoft};
    padding: 18px 40px;
    background: #fff;
    display: flex; justify-content: flex-end; gap: 12px;

    @media (max-width: 640px) {
        padding: 14px 20px;
        flex-direction: column-reverse;
        button { width: 100%; justify-content: center; }
    }
`;

// ─── Form primitives (underline-only fields) ────────────────────
const FormGroup = styled.div`
    display: flex; flex-direction: column; gap: 9px; margin-bottom: 26px;
    &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
    font-size: .68rem; font-weight: 600;
    letter-spacing: .13em; text-transform: uppercase;
    color: ${C.ink2};
`;

const Field = styled.input`
    width: 100%; background: transparent;
    border: 0; border-bottom: 1px solid #ccc; border-radius: 0;
    padding: 10px 2px;
    font-size: 15px; color: ${C.ink};
    outline: none;
    transition: border-color .2s ${C.ease};
    animation: ${p => (p.$shake ? shake : 'none')} .4s ease;

    &::placeholder { color: ${C.inkFaint}; font-weight: 400; }
    &:hover { border-bottom-color: ${C.ink}; }
    &:focus { border-bottom-color: ${C.ox}; }
    ${p => p.$error && `border-bottom-color: ${C.red};`}
`;

const SelectField = styled.select`
    width: 100%; background: transparent;
    border: 0; border-bottom: 1px solid #ccc; border-radius: 0;
    padding: 10px 34px 10px 2px;
    font-size: 15px; color: ${C.ink};
    outline: none; cursor: pointer;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%235f584c' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 4px center;
    transition: border-color .2s ${C.ease};

    &:hover { border-bottom-color: ${C.ink}; }
    &:focus { border-bottom-color: ${C.ox}; }
`;

const TextareaField = styled.textarea`
    width: 100%; background: transparent;
    border: 0; border-bottom: 1px solid #ccc; border-radius: 0;
    padding: 10px 2px;
    font-size: 15px; color: ${C.ink};
    outline: none;
    resize: vertical; min-height: 110px; line-height: 1.6;
    transition: border-color .2s ${C.ease};

    &::placeholder { color: ${C.inkFaint}; font-weight: 400; }
    &:hover { border-bottom-color: ${C.ink}; }
    &:focus { border-bottom-color: ${C.ox}; }
`;

// ─── Notices (plain text — no background, no border) ────────────
const Hint = styled.p`
    font-size: 14px; line-height: 1.65;
    color: ${C.ink2}; margin-bottom: 26px;
    strong { color: ${C.ox}; font-weight: 600; }
`;

const NoteErr = styled.p`
    font-size: 14px; line-height: 1.55;
    color: ${C.red}; margin-bottom: 26px;
    animation: ${fadeUp} .25s ease both;
`;

const NoteOk = styled.p`
    font-size: 14px; line-height: 1.55;
    color: ${C.green}; margin-bottom: 26px;
    animation: ${fadeUp} .25s ease both;
`;

// ─── Case record (step 2) ───────────────────────────────────────
const CaseId = styled.div`
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; margin-bottom: 1.7rem;
`;

const CaseName = styled.h2`
    font-size: 26px; font-weight: 600;
    letter-spacing: -.01em; line-height: 1.2;
    @media (max-width: 640px) { font-size: 22px; }
`;

const CaseAdm = styled.div`
    font-family: ${C.mono};
    font-size: .82rem; font-weight: 700;
    letter-spacing: .07em;
    color: ${C.ox}; margin-top: 7px;

    span { color: ${C.inkFaint}; font-weight: 500; }
`;

const ChangeLink = styled.button`
    font-size: 12.5px; font-weight: 600;
    color: ${C.ink2};
    border-bottom: 1px solid ${C.line};
    padding-bottom: 1px; flex: none;
    white-space: nowrap;
    transition: all .15s;

    &:hover { color: ${C.ox}; border-color: ${C.ox}; }
`;

const CaseGrid = styled.dl`
    display: grid; grid-template-columns: 1fr 1fr;
    column-gap: 2.5rem; margin-bottom: 2.4rem;

    @media (max-width: 640px) { grid-template-columns: 1fr; column-gap: 0; }
`;

const CaseItem = styled.div`
    padding: 11px 0;
    border-bottom: 1px dashed ${C.line};

    dt {
        font-family: ${C.mono};
        font-size: .56rem; font-weight: 700;
        letter-spacing: .16em; text-transform: uppercase;
        color: ${C.inkFaint}; margin-bottom: 4px;
    }
    dd { font-size: 14.5px; font-weight: 500; font-variant-numeric: tabular-nums; }
`;

// ─── Priority (no background fills — ox underline) ──────────────
const Seg = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr);
    border-bottom: 1px solid ${C.line};
`;

const SegOpt = styled.button`
    position: relative;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 6px;
    font-size: 11.5px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    color: ${C.inkFaint};
    transition: color .2s ${C.ease};

    & + & { border-left: 1px solid ${C.lineSoft}; }

    .dot {
        width: 7px; height: 7px; border-radius: 50%; flex: none;
        transition: transform .2s ${C.ease};
        background: ${p => p.$val === 'normal' ? C.green : p.$val === 'urgent' ? C.amber : C.ox};
    }

    &:hover { color: ${C.ink2}; }

    ${p => p.$on && `
        color: ${C.ink};
        .dot { transform: scale(1.25); }
        &::after {
            content: '';
            position: absolute; left: 14%; right: 14%; bottom: -1px;
            height: 2px; background: ${C.ox};
        }
    `}
`;

// ─── Buttons ────────────────────────────────────────────────────
const Btn = styled.button`
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 12px 24px;
    font-size: 12.5px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    border: 1px solid transparent;
    transition: all .2s ${C.ease};

    &:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

    ${p => p.$ghost && `
        background: #fff; border-color: ${C.line}; color: ${C.ink2};
        &:hover:not(:disabled) { border-color: ${C.ink2}; color: ${C.ink}; }
    `}
    ${p => p.$primary && `
        background: ${C.ox}; color: #fff;
        box-shadow: 0 6px 16px -4px rgba(124,43,35,.4);
        &:hover:not(:disabled) {
            background: ${C.oxDeep}; transform: translateY(-1px);
            box-shadow: 0 10px 24px -4px rgba(124,43,35,.5);
        }
    `}
`;

const Spinner = styled.div`
    width: 14px; height: 14px; border-radius: 50%; flex: none;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    animation: ${spin} .7s linear infinite;
`;

// ─── Confirmation ───────────────────────────────────────────────
const Confirm = styled.div`
    text-align: center; padding: 14px 0 10px;

    h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    > p { font-size: 14.5px; color: ${C.ink2}; }

    .ref {
        font-family: ${C.mono};
        font-size: .8rem; font-weight: 700;
        letter-spacing: .1em; color: ${C.ox};
        border-top: 1px dashed ${C.line};
        border-bottom: 1px dashed ${C.line};
        display: inline-block;
        padding: 12px 28px; margin: 20px 0 4px;
    }

    .meta {
        display: flex; justify-content: center; gap: 26px; flex-wrap: wrap;
        margin-top: 16px;
        font-family: ${C.mono};
        font-size: .72rem; letter-spacing: .06em;
        color: ${C.inkFaint};
        b { color: ${C.ink}; font-weight: 600; }
    }
`;

// ─── Dark footer ────────────────────────────────────────────────
const ElegantFooter = styled.footer`
    position: relative;
    width: 100%; overflow: hidden;
    margin-top: auto;
    background: #14110d; color: #f3efe5;
    text-align: center;
    padding: 52px 24px 0;

    &::before, &::after {
        content: '';
        position: absolute; left: 50%; transform: translateX(-50%);
        border-radius: 50%; pointer-events: none;
    }
    &::before { bottom: -240px; width: 480px; height: 480px; border: 1.5px solid rgba(243,239,229,.08); }
    &::after  { bottom: -300px; width: 640px; height: 640px; border: 1px solid rgba(243,239,229,.05); }

    @media (max-width: 640px) { padding: 44px 20px 0; }
`;

const FooterTagline = styled.p`
    position: relative; z-index: 1;
    font-size: 19px; font-weight: 400;
    line-height: 1.55;
    color: rgba(243,239,229,.88);
    max-width: 44ch; margin: 0 auto;
`;

const FooterValues = styled.div`
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center; gap: 16px;
    max-width: 420px; margin: 24px auto 0;

    &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(243,239,229,.15); }

    span {
        font-family: ${C.mono};
        font-weight: 700; font-size: .58rem;
        letter-spacing: .26em; text-transform: uppercase;
        color: rgba(243,239,229,.6);
    }
`;

const FooterBar = styled.div`
    position: relative; z-index: 1;
    margin-top: 40px;
    border-top: 1px solid rgba(243,239,229,.1);
    display: flex; justify-content: space-between; align-items: center;
    gap: 10px; flex-wrap: wrap;
    padding: 18px 32px;
    font-size: 12.5px; font-weight: 500;
    color: rgba(243,239,229,.5);

    @media (max-width: 640px) {
        flex-direction: column; gap: 6px; padding: 16px 20px; text-align: center;
    }
`;

// ─── Component ──────────────────────────────────────────────────
export default function PostmortemRequestForm() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const tenantSlug =
        slug ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('tenantSlug')) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tenantSlug')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('selectedTenant')) ||
        'system_shared';

    const tenantHeaders = {
        'x-tenant-slug': tenantSlug,
        'x-branch-slug': tenantSlug,
        'x-branch-db': tenantSlug,
    };

    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${tenantSlug}/postmortem-verify`;

    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    const [identifier, setIdentifier] = useState('');
    const [lookupError, setLookupError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundCase, setFoundCase] = useState(null);
    const [shakeId, setShakeId] = useState(false);
    const [searchType, setSearchType] = useState('phone');

    const [form, setForm] = useState({ reason: '', requested_by: '', priority: 'normal' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

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

    const handleLookup = async (e) => {
        e.preventDefault();
        const q = identifier.trim();
        if (!q) { setLookupError('Please enter a deceased ID, next-of-kin phone, or ID number.'); return; }

        setIsSearching(true);
        setLookupError('');
        setFoundCase(null);

        const params = new URLSearchParams();
        if (searchType === 'phone') params.set('phone', q);
        else if (searchType === 'id_number') params.set('id_number', q);
        else if (searchType === 'admission_number') params.set('admission_number', q);

        try {
            const res = await axios.get(`${BASE_URL}/deceased/public/postmortem/search?${params.toString()}`, {
                headers: tenantHeaders,
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
            console.error('[PostmortemRequestForm] Search error:', err.response?.data || err.message);
            const msg = err.response?.data?.message;
            if (err.response?.status === 404) {
                setLookupError('No matching deceased record found. Please check the details and try again.');
            } else if (err.response?.status === 400 && msg?.includes('tenant')) {
                setLookupError('Tenant configuration issue. Please contact the system administrator.');
            } else {
                setLookupError(msg || 'Unable to search at this time. Please try again shortly.');
            }
            setShakeId(true);
            setTimeout(() => setShakeId(false), 500);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.reason || !form.requested_by) {
            notify.warning('Missing details', 'Please fill in all required fields.');
            return;
        }
        if (!foundCase?.deceased_id) {
            notify.warning('Case not found', 'Please go back and search again.');
            return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const res = await axios.post(
                `${BASE_URL}/deceased/public/postmortem/request`,
                {
                    deceased_id: foundCase.deceased_id,
                    reason: form.reason,
                    requested_by: form.requested_by,
                    priority: form.priority,
                    source: 'family_reception',
                },
                { headers: tenantHeaders }
            );

            if (res.data?.success) {
                setSubmitResult({ ok: true, msg: res.data?.message || 'Postmortem request submitted successfully.' });
            } else {
                setSubmitResult({ ok: false, msg: res.data?.message || 'Submission failed. Please try again.' });
            }
        } catch (err) {
            console.error('[PostmortemRequestForm] Submit error:', err.response?.data || err.message);
            const errData = err.response?.data;
            let msg;
            if (errData?.message) {
                msg = errData.message;
                if (errData.message.includes('Valid tenant required') || errData.message.includes('tenant')) {
                    msg = 'Unable to process this request for the current tenant. Please contact the system administrator.';
                }
            } else {
                msg = 'Failed to submit postmortem request. Please try again.';
            }
            setSubmitResult({ ok: false, msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDone = () => {
        setFoundCase(null);
        setIdentifier('');
        setSubmitResult(null);
        setForm({ reason: '', requested_by: '', priority: 'normal' });
        navigate('/receptionist');
    };

    const step1Done = !!foundCase;
    const step2Done = submitResult?.ok;

    const confirmRef = foundCase
        ? `PM-${new Date().getFullYear()}-${String(foundCase.admission_number || foundCase.deceased_id || '').slice(-4) || '0000'}`
        : '';

    return (
        <>
            <GlobalStyles />
            <Shell>
                <Card>

                    {/* ══════ STEP 1 — FIND CASE ══════ */}
                    {!step1Done && !step2Done && (
                        <>
                            <AccentLine aria-hidden="true" />
                            <Condolence>
                                We are deeply sorry for your loss. Please accept our heartfelt condolences.
                            </Condolence>

                            <DocHeader>
                                <HeaderLeft>
                                    <DhTitle>Postmortem Request Form</DhTitle>
                                    <DhMeta>DATE <b>{currentDate.toUpperCase()}</b> · TIME <b>{currentTime}</b></DhMeta>
                                </HeaderLeft>
                                <QrWrapper>
                                    <QrBox>
                                        <QRCodeSVG
                                            value={verifyUrl}
                                            size={88}
                                            level="H"
                                            includeMargin={false}
                                            bgColor="#FFFFFF"
                                            fgColor={C.ink}
                                        />
                                    </QrBox>
                                    <QrLabel>Scan for Results</QrLabel>
                                </QrWrapper>
                            </DocHeader>

                            <TitleSection>
                                <h1>Postmortem <em>Examination</em> Request</h1>
                                <p>Complete all fields accurately to authorize the procedure.</p>
                            </TitleSection>

                            <form onSubmit={handleLookup}>
                                <Body>
                                    <SBar><span className="n">01</span><span className="t">Locate Case</span></SBar>

                                    <Hint>
                                        Enter the <strong>Deceased Admission Number</strong>, the <strong>Next-of-Kin phone number</strong>,
                                        or the <strong>National ID</strong> to locate the case.
                                    </Hint>

                                    {lookupError && (
                                        <NoteErr role="alert">{lookupError}</NoteErr>
                                    )}

                                    <FormGroup>
                                        <Label htmlFor="searchType">Search By</Label>
                                        <SelectField
                                            id="searchType"
                                            value={searchType}
                                            onChange={e => { setSearchType(e.target.value); setLookupError(''); }}
                                        >
                                            <option value="phone">Next of Kin Phone</option>
                                            <option value="id_number">National ID</option>
                                            <option value="admission_number">Deceased Admission Number</option>
                                        </SelectField>
                                    </FormGroup>

                                    <FormGroup style={{ marginBottom: 0 }}>
                                        <Label htmlFor="identifier">
                                            {searchType === 'phone' ? 'Phone Number' : searchType === 'id_number' ? 'ID Number' : 'Admission Number'}
                                        </Label>
                                        <Field
                                            id="identifier"
                                            type="text"
                                            placeholder={searchType === 'phone' ? 'e.g. +254700000000' : searchType === 'id_number' ? 'e.g. 12345678' : 'e.g. MON-XXXXXX'}
                                            value={identifier}
                                            onChange={e => { setIdentifier(e.target.value); setLookupError(''); }}
                                            $shake={shakeId}
                                            $error={!!lookupError}
                                            required
                                        />
                                    </FormGroup>
                                </Body>

                                <FormFooter>
                                    <Btn type="button" $ghost onClick={() => window.history.back()}>Cancel</Btn>
                                    <Btn type="submit" $primary disabled={isSearching}>
                                        {isSearching ? <><Spinner /> Searching…</> : 'Find Case'}
                                    </Btn>
                                </FormFooter>
                            </form>
                        </>
                    )}

                    {/* ══════ STEP 2 — CASE FOUND (no top header) ══════ */}
                    {step1Done && !step2Done && (
                        <form onSubmit={handleSubmit}>
                            <Body>
                                <NoteOk>Case found — verify the record below, then complete your request.</NoteOk>

                                <SBar><span className="n">01</span><span className="t">Deceased Record</span></SBar>

                                <CaseId>
                                    <div>
                                        <CaseName>{foundCase.full_name || '—'}</CaseName>
                                        <CaseAdm><span>ADMISSION</span> {foundCase.admission_number || foundCase.deceased_id}</CaseAdm>
                                    </div>
                                    <ChangeLink type="button" onClick={() => { setFoundCase(null); setLookupError(''); }}>
                                        Change case
                                    </ChangeLink>
                                </CaseId>

                                <CaseGrid>
                                    {foundCase.date_of_death && (
                                        <CaseItem><dt>Date of Death</dt><dd>{foundCase.date_of_death}</dd></CaseItem>
                                    )}
                                    {foundCase.gender && (
                                        <CaseItem><dt>Gender</dt><dd>{foundCase.gender}</dd></CaseItem>
                                    )}
                                    {(foundCase.next_of_kin_name || foundCase.next_of_kin) && (
                                        <CaseItem><dt>Next of Kin</dt><dd>{foundCase.next_of_kin_name || foundCase.next_of_kin}</dd></CaseItem>
                                    )}
                                    {(foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number) && (
                                        <CaseItem><dt>Kin Contact</dt><dd>{foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number}</dd></CaseItem>
                                    )}
                                </CaseGrid>

                                <SBar><span className="n">02</span><span className="t">Request Details</span></SBar>

                                <FormGroup>
                                    <Label htmlFor="requested_by">Requesting Authority / Your Name</Label>
                                    <Field
                                        id="requested_by"
                                        type="text"
                                        placeholder="e.g. John Kamau (Son), Dr. Mwangi, Police Inspector Oloo"
                                        value={form.requested_by}
                                        onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))}
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label as="span">Priority</Label>
                                    <Seg role="radiogroup" aria-label="Priority">
                                        {[
                                            { val: 'normal', label: 'Normal' },
                                            { val: 'urgent', label: 'Urgent' },
                                            { val: 'emergency', label: 'Emergency' },
                                        ].map(opt => (
                                            <SegOpt
                                                key={opt.val}
                                                type="button"
                                                role="radio"
                                                aria-checked={form.priority === opt.val}
                                                $val={opt.val}
                                                $on={form.priority === opt.val}
                                                onClick={() => setForm(f => ({ ...f, priority: opt.val }))}
                                            >
                                                <span className="dot" /> {opt.label}
                                            </SegOpt>
                                        ))}
                                    </Seg>
                                </FormGroup>

                                <FormGroup style={{ marginBottom: 0 }}>
                                    <Label htmlFor="reason">Reason for Request</Label>
                                    <TextareaField
                                        id="reason"
                                        placeholder="Please describe the circumstances or reason for requesting the postmortem examination…"
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        required
                                    />
                                </FormGroup>
                            </Body>

                            <FormFooter>
                                <Btn type="button" $ghost onClick={() => { setFoundCase(null); setLookupError(''); }}>Back</Btn>
                                <Btn type="submit" $primary disabled={isSubmitting}>
                                    {isSubmitting ? <><Spinner /> Submitting…</> : 'Submit Request'}
                                </Btn>
                            </FormFooter>
                        </form>
                    )}

                    {/* ══════ STEP 3 — CONFIRMED ══════ */}
                    {step2Done && (
                        <>
                            <Body>
                                <Confirm>
                                    <h2>Request Submitted</h2>
                                    <p>The mortuary team will review your request and contact you shortly.</p>
                                    <div className="ref">REF · {confirmRef}</div>
                                    <div className="meta">
                                        <span>PRIORITY · <b style={{ textTransform: 'uppercase' }}>{form.priority}</b></span>
                                        <span>LOGGED · <b>{currentDate.toUpperCase()}</b></span>
                                    </div>
                                </Confirm>
                                <NoteOk style={{ margin: '20px 0 0' }}>
                                    <strong>Request Submitted.</strong> Scan the QR code on the form at any time to check the results.
                                </NoteOk>
                            </Body>
                            <FormFooter>
                                <Btn type="button" $ghost onClick={() => {
                                    setFoundCase(null);
                                    setIdentifier('');
                                    setSubmitResult(null);
                                    setForm({ reason: '', requested_by: '', priority: 'normal' });
                                }}>
                                    New Request
                                </Btn>
                                <Btn type="button" $primary onClick={handleDone}>Done</Btn>
                            </FormFooter>
                        </>
                    )}

                    {/* ── Dark footer ── */}
                    <ElegantFooter>
                        <FooterTagline>Received with dignity. Cared for with respect. Remembered with love.</FooterTagline>
                        <FooterValues>
                            <span>Dignity</span><span>Care</span><span>Respect</span>
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