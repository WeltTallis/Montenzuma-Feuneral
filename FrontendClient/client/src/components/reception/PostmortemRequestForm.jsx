import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import env from '../../utils/config/env';

// ─── Google Fonts ────────────────────────────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
`;

// ─── Design tokens (new palette) ────────────────────────────
const C = {
    paper: '#f3efe5',
    paper2: '#f7f4ec',
    ink: '#211d17',
    ink2: '#5d554a',
    hair: 'rgba(33, 29, 23, .16)',
    hair2: 'rgba(33, 29, 23, .38)',
    ox: '#7c2b23',
    moss: '#4d5f42',
    och: '#9a6a1e',
    ease: 'cubic-bezier(.32, .72, .24, 1)',
};

const BASE_URL = env.FULL_API_URL;

// ─── Animations ────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

// ─── Layout ────────────────────────────────────────────────────
const Shell = styled.div`
    font-family: 'Saira', sans-serif;
    background: radial-gradient(circle at top center, #efe9da 0%, #e6e0d0 100%);
    color: ${C.ink};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-font-smoothing: antialiased;
    padding: 0;
`;

const Card = styled.div`
    max-width: 860px;
    width: 100%;
    background: ${C.paper2};
    overflow: hidden;
    animation: ${fadeIn} 0.5s ${C.ease} both;
    border-radius: 0;

    @media (max-width: 600px) {
        margin: 0;
        border-radius: 0;
        min-height: 100vh;
    }
`;

// ─── Condolence Banner (no bottom border) ──────────────────────
const Banner = styled.div`
    background: linear-gradient(180deg, #1c1812 0%, #2a2520 100%);
    padding: 22px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
    /* bottom border removed */

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(circle at 20% 50%, rgba(154, 106, 30, .08), transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(124, 43, 35, .10), transparent 50%);
        pointer-events: none;
    }

    p {
        position: relative;
        font-family: 'Fraunces', serif;
        font-size: 17px;
        color: rgba(243, 239, 229, .94);
        font-weight: 400;
        font-style: italic;
        line-height: 1.55;
        letter-spacing: 0.01em;
        margin: 0;
    }

    .ornament {
        display: inline-block;
        margin: 0 14px;
        color: ${C.och};
        opacity: .6;
        font-size: 12px;
        vertical-align: middle;
    }

    @media (max-width: 600px) { padding: 18px 20px; }
`;

// ─── Document Header (QR + timestamp) ──────────────────────────
const DocHeader = styled.header`
    background: ${C.paper};
    padding: 30px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    border-bottom: 1px solid ${C.hair};

    @media (max-width: 600px) {
        flex-direction: column;
        padding: 24px;
        align-items: center;
        text-align: center;
    }
`;

const HeaderLeft = styled.div`display:flex;flex-direction:column;gap:14px;`;

const ReqIdBadge = styled.div`
    font-family: 'Saira', sans-serif;
    font-size: 19px;
    font-weight: 600;
    color: ${C.ink};
    letter-spacing: -.01em;
    display: flex;
    align-items: center;
    gap: 12px;

    i {
        color: ${C.och};
        font-size: 14px;
        width: 28px;
        height: 28px;
        background: rgba(154, 106, 30, .10);
        border-radius: 50%;
        display: grid;
        place-items: center;
    }
`;

const Timestamps = styled.div`
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
    @media (max-width: 600px) { justify-content: center; }
`;

const MetaItem = styled.div`
    font-size: 13px;
    color: ${C.ink2};
    display: flex;
    align-items: center;
    gap: 8px;

    i { color: ${C.och}; font-size: 11px; }
    span {
        font-weight: 600;
        color: ${C.ink};
        font-variant-numeric: tabular-nums;
    }
`;

const QrWrapper = styled.div`display:flex;flex-direction:column;align-items:center;gap:8px;`;

const QrBox = styled.div`
    width: 108px;
    height: 108px;
    padding: 8px;
    border: 1px solid ${C.hair2};
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(33, 29, 23, .08);
`;

const QrLabel = styled.span`
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .22em;
    color: ${C.moss};
    font-weight: 700;
`;

// ─── Title ──────────────────────────────────────────────────────
const TitleSection = styled.div`
    padding: 36px 40px 24px;
    text-align: center;
    background: ${C.paper2};

    h1 {
        font-family: 'Fraunces', serif;
        font-size: 30px;
        font-weight: 600;
        color: ${C.ink};
        margin: 0 0 8px;
        letter-spacing: -.01em;

        .accent {
            color: ${C.ox};
            font-style: italic;
        }
    }
    p {
        font-family: 'Fraunces', serif;
        font-size: 14px;
        color: ${C.ink2};
        font-style: italic;
        margin: 0;
    }

    @media (max-width: 600px) {
        padding: 24px 20px;
        h1 { font-size: 24px; }
    }
`;

// ─── Step indicator ─────────────────────────────────────────────
const Steps = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0 40px 32px;
    background: ${C.paper2};
`;

const Step = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: ${p => p.$active ? C.ink : p.$done ? C.moss : C.ink2};
    position: relative;
    z-index: 1;
`;

const StepNum = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 700;
    background: ${p => p.$active ? C.ink : p.$done ? C.moss : C.paper};
    color: ${p => (p.$active || p.$done) ? '#f3efe5' : C.ink2};
    box-shadow: ${p => p.$active
        ? `0 0 0 1px ${C.ink}, 0 6px 14px rgba(33, 29, 23, .25)`
        : p.$done
            ? `0 0 0 1px ${C.moss}, 0 4px 12px rgba(77, 95, 66, .3)`
            : `0 0 0 1px ${C.hair}`};
    transition: all 0.35s ${C.ease};
`;

const StepLine = styled.div`
    flex: 1;
    height: 2px;
    background: ${C.hair};
    margin: 0 -10px 22px;
    max-width: 80px;
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: ${C.moss};
        transform: scaleX(${p => p.$done ? 1 : 0});
        transform-origin: left;
        transition: transform .5s ${C.ease};
    }
`;

// ─── Form body ──────────────────────────────────────────────────
const Body = styled.div`
    padding: 32px 40px;
    background: ${C.paper};
    border-top: 1px solid ${C.hair};

    @media (max-width: 600px) { padding: 24px 20px; }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
    &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
    font-size: 11px;
    letter-spacing: .12em;
    text-transform: uppercase;
    font-weight: 700;
    color: ${C.moss};
    display: flex;
    align-items: center;
    gap: 8px;

    i {
        color: ${C.och};
        font-size: 11px;
        width: 18px;
        height: 18px;
        background: rgba(154, 106, 30, .10);
        display: grid;
        place-items: center;
    }
`;

const Input = styled.input`
    background: ${C.paper2};
    border: 1px solid ${p => p.$error ? C.ox : C.hair};
    padding: 14px 16px;
    font-family: 'Saira', sans-serif;
    font-size: 15px;
    color: ${C.ink};
    transition: all .2s ${C.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    animation: ${p => p.$shake ? shake : 'none'} .4s ease;

    &::placeholder { color: #a7a294; }
    &:focus {
        background: #fff;
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77, 95, 66, .12);
    }
`;

const Select = styled.select`
    background: ${C.paper2};
    border: 1px solid ${C.hair};
    padding: 14px 16px;
    font-family: 'Saira', sans-serif;
    font-size: 15px;
    color: ${C.ink};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    transition: all .2s ${C.ease};

    &:focus {
        background: #fff;
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77, 95, 66, .12);
    }
`;

const Textarea = styled.textarea`
    background: ${C.paper2};
    border: 1px solid ${C.hair};
    padding: 14px 16px;
    font-family: 'Fraunces', serif;
    font-size: 15px;
    color: ${C.ink};
    transition: all .2s ${C.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 130px;
    line-height: 1.6;

    &::placeholder { color: #a7a294; }
    &:focus {
        background: #fff;
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77, 95, 66, .12);
    }
`;

// ─── Alert boxes ────────────────────────────────────────────────
const Alert = styled.div`
    padding: 16px 20px;
    font-size: 14px;
    margin-bottom: 24px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    line-height: 1.55;
    background: ${p => p.$type === 'success'
        ? 'rgba(77, 95, 66, .10)'
        : p.$type === 'error'
            ? 'rgba(124, 43, 35, .08)'
            : 'rgba(154, 106, 30, .10)'};
    color: ${p => p.$type === 'success'
        ? '#2a3825'
        : p.$type === 'error'
            ? '#5a1f1a'
            : '#5a3f12'};
    border: 1px solid ${p => p.$type === 'success'
        ? 'rgba(77, 95, 66, .30)'
        : p.$type === 'error'
            ? 'rgba(124, 43, 35, .30)'
            : 'rgba(154, 106, 30, .25)'};

    i { flex-shrink: 0; margin-top: 2px; color: inherit; }
    i.fa-info-circle, i.fa-check-circle { color: ${p => p.$type === 'success' ? C.moss : p.$type === 'error' ? C.ox : C.och}; }
    i.fa-exclamation-triangle { color: ${C.ox}; }
    strong { font-weight: 700; }
`;

// ─── Found case card ─────────────────────────────────────────────
const CaseCard = styled.div`
    background: ${C.paper2};
    border: 1px solid ${C.hair};
    border-left: 3px solid ${C.moss};
    padding: 4px 20px;
    margin-bottom: 24px;
    animation: ${fadeIn} .3s ease both;
`;

const CaseTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 0 10px;
    border-bottom: 1px solid ${C.hair};
    margin-bottom: 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-weight: 700;
    color: ${C.moss};

    i { color: ${C.moss}; }
`;

const CaseRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    padding: 10px 0;
    border-bottom: 1px dashed ${C.hair};
    &:last-child { border-bottom: none; }
    span:first-child { color: ${C.ink2}; font-weight: 500; }
    span:last-child  { color: ${C.ink};   font-weight: 600; font-variant-numeric: tabular-nums; }
`;

// ─── Buttons ────────────────────────────────────────────────────
const FormFooter = styled.div`
    border-top: 1px solid ${C.hair};
    padding: 22px 40px;
    background: ${C.paper2};
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    @media (max-width: 600px) {
        padding: 16px 20px;
        flex-direction: column-reverse;
        button { width: 100%; justify-content: center; }
    }
`;

const Btn = styled.button`
    padding: 13px 26px;
    font-family: 'Saira', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s ${C.ease};
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid transparent;
    text-transform: uppercase;
    letter-spacing: .08em;

    &:disabled { opacity: .65; cursor: not-allowed; transform: none !important; }

    ${p => p.$ghost && `
        background: transparent;
        border-color: ${C.hair2};
        color: ${C.ink2};
        &:hover:not(:disabled) {
            border-color: ${C.ink2};
            color: ${C.ink};
            background: ${C.paper};
        }
    `}

    ${p => p.$primary && `
        background: ${C.ox};
        color: #f3efe5;
        box-shadow: 0 6px 16px -4px rgba(124, 43, 35, .45);
        &:hover:not(:disabled) {
            background: #6a241e;
            transform: translateY(-1px);
            box-shadow: 0 10px 24px -4px rgba(124, 43, 35, .55);
        }
        i { color: rgba(243, 239, 229, .85); }
    `}

    ${p => p.$done && `
        background: ${C.moss};
        color: #f3efe5;
        box-shadow: 0 6px 16px -4px rgba(77, 95, 66, .45);
        &:hover:not(:disabled) {
            background: #3e4d35;
            transform: translateY(-1px);
            box-shadow: 0 10px 24px -4px rgba(77, 95, 66, .55);
        }
        i { color: rgba(243, 239, 229, .85); }
    `}
`;

const Spinner = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(243, 239, 229, .35);
    border-top-color: #f3efe5;
    animation: ${spin} .7s linear infinite;
    flex-shrink: 0;
`;

// ─── Woodland Elegance Footer (no top border) ───────────────────
const ElegantFooter = styled.footer`
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #1a1611;
    color: #f3efe5;
    text-align: center;
    padding: 64px 20px 0;
    /* top border removed */
    box-sizing: border-box;

    &::before, &::after {
        content: '';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 50%;
        pointer-events: none;
    }
    &::before { bottom: -240px; width: 480px; height: 480px; border: 1.5px solid rgba(243, 239, 229, .08); }
    &::after  { bottom: -300px; width: 640px; height: 640px; border: 1px   solid rgba(243, 239, 229, .05); }

    @media (max-width: 560px) { padding: 44px 20px 0; }
`;

const LeafMark = styled.div`
    width: 50px;
    height: 50px;
    margin: 0 auto 22px;
    border-radius: 50%;
    background: rgba(243, 239, 229, .04);
    border: 1px solid rgba(154, 106, 30, .35);
    display: grid;
    place-items: center;
    position: relative;
    z-index: 1;
`;

const FooterTagline = styled.p`
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1.35rem;
    line-height: 1.55;
    color: rgba(243, 239, 229, .88);
    max-width: 44ch;
    margin: 0 auto;
    position: relative;
    z-index: 1;
`;

const FooterValues = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 32px auto 0;
    max-width: 420px;
    position: relative;
    z-index: 1;

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(243, 239, 229, .15);
    }
`;

const FooterValueLabel = styled.span`
    font-family: 'Saira', sans-serif;
    font-weight: 700;
    font-size: .66rem;
    letter-spacing: .26em;
    text-transform: uppercase;
    color: rgba(243, 239, 229, .65);
`;

const FooterValueDot = styled.b`
    font-family: 'Saira', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: ${C.och};
`;

const FooterBar = styled.div`
    margin-top: 48px;
    border-top: 1px solid rgba(243, 239, 229, .10);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 22px 32px;
    font-family: 'Saira', sans-serif;
    font-weight: 500;
    font-size: .76rem;
    color: rgba(243, 239, 229, .5);
    position: relative;
    z-index: 1;

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
    const navigate = useNavigate();

    const tenantSlug =
        slug ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('tenantSlug')) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tenantSlug')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('selectedTenant')) ||
        'system_shared';

    console.log('[PostmortemRequestForm] Resolved tenantSlug:', tenantSlug);

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
                headers: { 'x-tenant-slug': tenantSlug },
            });

            console.log('[PostmortemRequestForm] Search response:', JSON.stringify(res.data, null, 2));

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
            const res = await axios.post(
                `${BASE_URL}/deceased/public/postmortem/request`,
                {
                    deceased_id: foundCase.deceased_id,
                    reason: form.reason,
                    requested_by: form.requested_by,
                    priority: form.priority,
                    source: 'family_reception',
                },
                { headers: { 'x-tenant-slug': tenantSlug } }
            );

            console.log('[PostmortemRequestForm] Submit response:', JSON.stringify(res.data, null, 2));

            if (res.data?.success) {
                setSubmitResult({ ok: true, msg: res.data?.message || 'Postmortem request submitted successfully.' });
                setForm({ reason: '', requested_by: '', priority: 'normal' });
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

    return (
        <>
            <GlobalStyles />
            <Shell>
                <Card>

                    {/* ── Condolence Banner ── */}
                    <Banner>
                        <p>
                            <span className="ornament">❦</span>
                            We are deeply sorry for your loss. Please accept our heartfelt condolences.
                            <span className="ornament">❦</span>
                        </p>
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
                                    size={92}
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
                        <h1>Postmortem <span className="accent">Examination</span> Request</h1>
                        <p>Complete all fields accurately to authorize the procedure.</p>
                    </TitleSection>

                    {/* ─── Step indicator ─── */}
                    <Steps>
                        <Step $active={!step1Done} $done={step1Done}>
                            <StepNum $active={!step1Done} $done={step1Done}>
                                {step1Done ? <i className="fas fa-check" /> : '1'}
                            </StepNum>
                            Find Case
                        </Step>
                        <StepLine $done={step1Done} />
                        <Step $active={step1Done && !step2Done} $done={step2Done}>
                            <StepNum $active={step1Done && !step2Done} $done={step2Done}>
                                {step2Done ? <i className="fas fa-check" /> : '2'}
                            </StepNum>
                            Submit Request
                        </Step>
                        <StepLine $done={step2Done} />
                        <Step $active={false} $done={step2Done}>
                            <StepNum $done={step2Done}>
                                {step2Done ? <i className="fas fa-check" /> : '3'}
                            </StepNum>
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

                                <FormGroup style={{ marginBottom: 0 }}>
                                    <Label htmlFor="identifier">
                                        <i className="fas fa-search" />
                                        {searchType === 'phone' ? 'Phone Number' : searchType === 'id_number' ? 'ID Number' : 'Admission Number'}
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

                                <CaseCard>
                                    <CaseTitle>
                                        <i className="fas fa-user-tag" /> Deceased Record
                                    </CaseTitle>
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
                                <Btn type="button" $ghost onClick={() => {
                                    setFoundCase(null);
                                    setIdentifier('');
                                    setSubmitResult(null);
                                    setForm({ reason: '', requested_by: '', priority: 'normal' });
                                }}>
                                    <i className="fas fa-plus" /> New Request
                                </Btn>
                                <Btn type="button" $done onClick={handleDone}>
                                    <i className="fas fa-check-double" /> Done
                                </Btn>
                            </FormFooter>
                        </>
                    )}

                    {/* ── Woodland Elegance Footer ── */}
                    <ElegantFooter>
                        <LeafMark>
                            <svg viewBox="0 0 24 24" fill="none" stroke={C.och} strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
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