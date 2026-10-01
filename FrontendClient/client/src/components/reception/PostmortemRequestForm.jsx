import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import env from '../../utils/config/env';
import notify from '../../utils/notify';

// ─── Fonts + icon lib ───────────────────────────────────────────
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Saira:wght@400;500;600;700&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  img, svg { display: block; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; background: none; border: 0; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;

// ─── Design tokens (approved white theme) ───────────────────────
const C = {
    ink: '#211d17',
    ink2: '#5d554a',
    inkFaint: '#a7a294',
    line: '#e8e4da',
    lineSoft: '#f0ede5',
    paperSoft: '#fcfbf8',
    ox: '#7c2b23',
    oxDeep: '#6a241e',
    oxBg: '#faf0ee',
    moss: '#4d5f42',
    mossDeep: '#3e4d35',
    mossBg: '#f0f4ec',
    och: '#9a6a1e',
    ochBg: '#faf4e8',
    ease: 'cubic-bezier(.32, .72, .24, 1)',
    serif: "'Fraunces', Georgia, serif",
    sans: "'Saira', system-ui, sans-serif",
};

const BASE_URL = env.FULL_API_URL;

// ─── Animations ─────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeUp = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`;

// ─── Inline SVG icons (match the approved HTML) ─────────────────
const I = {
    Hash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 3 7 21M17 3l-2 18M4 8h17M3 16h17" /></svg>,
    Calendar: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
    Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
    Info: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
    Warn: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>,
    CheckCircle: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5.5" /></svg>,
    List: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>,
    Search: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
    SearchLg: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
    Close: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    Shield: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6l-8-3z" /></svg>,
    Flag: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4h13l-3 4 3 4H5" /></svg>,
    Align: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
    UserTag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>,
    ArrowLeft: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    Send: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-11 11M22 2 15 22l-4-9-9-4 20-7z" /></svg>,
    Plus: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
    Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5 5L20 6.5" /></svg>,
    CheckLg: () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5 5L20 6.5" /></svg>,
    DoubleCheck: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m2 12.5 5 5L19 5.5" /><path d="m13 17 2 2L23 11" /></svg>,
    Leaf: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" /><path d="M4 20c4-6.5 8.5-10 13-12.5" /></svg>,
};

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
    /* NO border — soft layered shadow only */
    box-shadow: 0 2px 6px rgba(33,29,23,.04), 0 24px 60px -24px rgba(33,29,23,.14);
    animation: ${fadeIn} .5s ${C.ease} both;
    display: flex;
    flex-direction: column;

    @media (max-width: 600px) {
        min-height: 100vh;
    }
`;

// Slim 3-color accent line at the very top
const AccentLine = styled.div`
    height: 3px;
    background: linear-gradient(90deg, ${C.moss} 0 33.3%, ${C.och} 33.3% 66.6%, ${C.ox} 66.6% 100%);
`;

// ─── Condolence strip (light, quiet) ────────────────────────────
const Condolence = styled.div`
    text-align: center;
    padding: 16px 28px;
    background: ${C.paperSoft};
    border-bottom: 1px solid ${C.lineSoft};

    p {
        font-family: ${C.serif};
        font-style: italic;
        font-size: 15.5px;
        line-height: 1.55;
        color: ${C.ink2};
    }
    .orn {
        color: ${C.och};
        opacity: .55;
        font-size: 11px;
        margin: 0 12px;
        vertical-align: middle;
    }

    @media (max-width: 600px) { p { font-size: 14px; } }
`;

// ─── Document header ────────────────────────────────────────────
const DocHeader = styled.header`
    background: #fff;
    padding: 22px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    border-bottom: 1px solid ${C.lineSoft};

    /* Mobile keeps the desktop ROW (title left, QR right) instead of stacking
       and centring everything. Stacking pushed the QR + date + time into three
       centred rows and wasted the full width of the card. */
    @media (max-width: 640px) {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 20px;
        text-align: left;
    }
`;

const HeaderLeft = styled.div`
    display: flex; flex-direction: column; gap: 12px; min-width: 0;
    /* Let the text column take the slack so the QR is pushed hard right and
       the two never collide on a narrow phone. */
    @media (max-width: 640px) { align-items: flex-start; flex: 1; gap: 10px; }
`;

const ReqIdBadge = styled.div`
    display: flex; align-items: center; gap: 12px;
    font-size: 19px; font-weight: 600; letter-spacing: -.01em;

    .ico {
        width: 30px; height: 30px; flex: none; border-radius: 50%;
        background: ${C.ochBg}; color: ${C.och};
        display: grid; place-items: center;
    }

    /* Left-aligned to START (was centred), and shrunk so the label still fits
       beside the QR on a 360px screen. */
    @media (max-width: 640px) {
        justify-content: flex-start;
        gap: 9px;
        font-size: 15px;
        .ico { width: 26px; height: 26px; }
    }
`;

const Timestamps = styled.div`
    display: flex; gap: 20px; flex-wrap: wrap;
    /* Date and time stay SIDE BY SIDE, hugging the start edge. */
    @media (max-width: 640px) { justify-content: flex-start; gap: 14px; }
`;

const MetaItem = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: ${C.ink2};

    svg { color: ${C.och}; flex: none; }
    b { color: ${C.ink}; font-weight: 600; font-variant-numeric: tabular-nums; }

    @media (max-width: 640px) { font-size: 12px; gap: 5px; }
`;

const QrWrapper = styled.div`
    display: flex; flex-direction: column; align-items: center; gap: 8px; flex: none;
`;

const QrBox = styled.div`
    width: 104px; height: 104px; padding: 8px;
    border: 1px solid ${C.lineSoft};
    background: #fff;
    box-shadow: 0 2px 8px rgba(33,29,23,.05);
    display: flex; align-items: center; justify-content: center;

    /* QRCodeSVG is rendered with a hard-coded size={88}, which would overflow
       the smaller mobile box. CSS width/height beat the SVG's own width/height
       attributes, so this scales it down and keeps it perfectly square —
       a squashed QR does not scan. */
    svg { width: 100%; height: 100%; display: block; }

    /* Shrink to 76px on phones so the whole row fits without wrapping. */
    @media (max-width: 640px) { width: 76px; height: 76px; padding: 6px; }
`;

const QrLabel = styled.span`
    font-size: 10px; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase;
    color: ${C.moss}; text-align: center;

    @media (max-width: 640px) { font-size: 8px; letter-spacing: .12em; }
`;

// ─── Title ──────────────────────────────────────────────────────
const TitleSection = styled.div`
    padding: 34px 40px 20px;
    text-align: center;

    h1 {
        font-family: ${C.serif}; font-weight: 600;
        font-size: 30px; letter-spacing: -.01em; margin-bottom: 8px;

        .accent { color: ${C.ox}; font-style: italic; }
    }
    p {
        font-family: ${C.serif}; font-style: italic;
        font-size: 14px; color: ${C.ink2};
    }

    @media (max-width: 640px) {
        padding: 26px 20px 16px;
        h1 { font-size: 24px; }
    }
`;

// ─── Step indicator ─────────────────────────────────────────────
const Steps = styled.div`
    display: flex; align-items: flex-start; justify-content: center;
    padding: 2px 40px 28px;
`;

const Step = styled.div`
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: ${p => (p.$active ? C.ink : p.$done ? C.moss : C.inkFaint)};
    position: relative; z-index: 1; text-align: center; min-width: 76px;

    .num {
        width: 34px; height: 34px; border-radius: 50%;
        display: grid; place-items: center; font-size: 13px; font-weight: 700;
        background: ${p => (p.$active ? C.ink : p.$done ? C.moss : '#fff')};
        color: ${p => (p.$active || p.$done) ? '#fff' : C.ink2};
        box-shadow: ${p => p.$active
        ? `0 0 0 1px ${C.ink}, 0 6px 14px rgba(33,29,23,.18)`
        : p.$done
            ? `0 0 0 1px ${C.moss}, 0 4px 12px rgba(77,95,66,.22)`
            : `0 0 0 1px ${C.line}`};
        transition: all .35s ${C.ease};
    }

    @media (max-width: 640px) {
        font-size: 9px; min-width: 60px;
        .num { width: 30px; height: 30px; font-size: 12px; }
    }
`;

const StepLine = styled.div`
    flex: 1; max-width: 80px; height: 2px;
    margin: 17px -8px 0;
    background: ${C.lineSoft};
    position: relative; overflow: hidden;

    &::after {
        content: '';
        position: absolute; inset: 0;
        background: ${C.moss};
        transform: scaleX(${p => (p.$done ? 1 : 0)});
        transform-origin: left;
        transition: transform .5s ${C.ease};
    }

    @media (max-width: 640px) { margin-top: 14px; }
`;

// ─── Form body / footer ─────────────────────────────────────────
const Body = styled.div`
    padding: 30px 40px;
    border-top: 1px solid ${C.lineSoft};

    @media (max-width: 640px) { padding: 24px 20px; }
`;

const FormFooter = styled.div`
    border-top: 1px solid ${C.lineSoft};
    padding: 20px 40px;
    background: ${C.paperSoft};
    display: flex; justify-content: flex-end; gap: 12px;

    @media (max-width: 640px) {
        padding: 16px 20px;
        flex-direction: column-reverse;
        button { width: 100%; justify-content: center; }
    }
`;

const FormGroup = styled.div`
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;
    &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    color: ${C.moss};

    .lico {
        width: 20px; height: 20px; flex: none;
        display: grid; place-items: center;
        background: ${C.ochBg}; color: ${C.och};
    }
`;

const Input = styled.input`
    width: 100%; background: #fff;
    border: 1px solid ${p => (p.$error ? C.ox : C.line)};
    padding: 14px 16px;
    font-size: 15px; color: ${C.ink};
    outline: none; border-radius: 0;
    transition: all .2s ${C.ease};
    animation: ${p => (p.$shake ? shake : 'none')} .4s ease;

    &::placeholder { color: ${C.inkFaint}; }
    &:focus {
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77,95,66,.10);
    }
`;

const Select = styled.select`
    width: 100%; background: #fff;
    border: 1px solid ${C.line};
    padding: 14px 42px 14px 16px;
    font-size: 15px; color: ${C.ink};
    outline: none; border-radius: 0; cursor: pointer;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%235d554a' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    transition: all .2s ${C.ease};

    &:focus {
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77,95,66,.10);
    }
`;

const Textarea = styled.textarea`
    width: 100%; background: #fff;
    border: 1px solid ${C.line};
    padding: 14px 16px;
    font-family: ${C.serif};
    font-size: 15px; color: ${C.ink};
    outline: none; border-radius: 0;
    resize: vertical; min-height: 130px; line-height: 1.6;
    transition: all .2s ${C.ease};

    &::placeholder { color: ${C.inkFaint}; }
    &:focus {
        border-color: ${C.moss};
        box-shadow: 0 0 0 4px rgba(77,95,66,.10);
    }
`;

// ─── Priority segmented control ─────────────────────────────────
const SegPriority = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
`;

const POpt = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 10px;
    border: 1px solid ${C.line}; background: #fff;
    font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: ${C.ink2};
    transition: all .2s ${C.ease};

    .dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: ${p => (p.$val === 'normal' ? C.moss : p.$val === 'urgent' ? C.och : C.ox)};
    }

    &:hover { border-color: ${C.ink2}; color: ${C.ink}; }

    ${p => p.$on && `
        background: ${p.$val === 'normal' ? C.mossBg : p.$val === 'urgent' ? C.ochBg : C.oxBg};
        border-color: ${p.$val === 'normal' ? C.moss : p.$val === 'urgent' ? C.och : C.ox};
        color: ${p.$val === 'normal' ? C.mossDeep : p.$val === 'urgent' ? '#5a3f12' : '#5a1f1a'};
    `}
`;

// ─── Alert boxes ────────────────────────────────────────────────
const Alert = styled.div`
    display: flex; align-items: flex-start; gap: 12px;
    padding: 15px 18px; margin-bottom: 24px;
    font-size: 14px; line-height: 1.55;
    border: 1px solid ${C.lineSoft};
    border-left: 3px solid ${C.inkFaint};
    /* Kept WHITE, not a saturated tint. These notices used to carry a full
       moss/och fill, which against the all-white card read as a heavy dark
       slab sitting on the form. The semantic colour now lives in the left
       accent + icon only, and the dark body text keeps its contrast. */
    background: #fff;
    color: ${C.ink};
    animation: ${fadeUp} .25s ease both;

    svg { flex: none; margin-top: 2px; }
    strong { font-weight: 700; }
    small { opacity: .8; display: block; margin-top: 4px; }

    ${p => p.$type === 'success' && `
        border-left-color: ${C.moss};
        svg { color: ${C.moss}; }
    `}
    ${p => p.$type === 'error' && `
        border-left-color: ${C.ox};
        svg { color: ${C.ox}; }
    `}
    ${p => !p.$type && `
        border-left-color: ${C.och};
        svg { color: ${C.och}; }
    `}
`;

// ─── Found case card ────────────────────────────────────────────
const CaseCard = styled.div`
    /* White, matching the card it sits on. It previously used paperSoft
       (#fcfbf8) with a moss left edge, which read as a filled block. */
    background: #fff;
    border: 1px solid ${C.lineSoft};
    border-left: 3px solid ${C.moss};
    padding: 4px 20px;
    margin-bottom: 24px;
    animation: ${fadeUp} .3s ease both;
`;

const CaseTitle = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 14px 0 10px;
    border-bottom: 1px solid ${C.lineSoft};
    margin-bottom: 4px;
    font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    color: ${C.moss};

    svg { color: ${C.moss}; }
`;

const CaseRow = styled.div`
    display: flex; justify-content: space-between; gap: 16px;
    padding: 10px 0; font-size: 14px;
    border-bottom: 1px dashed ${C.line};
    &:last-child { border-bottom: none; }

    .k { color: ${C.ink2}; font-weight: 500; }
    .v { color: ${C.ink}; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
`;

// ─── Buttons ────────────────────────────────────────────────────
const Btn = styled.button`
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    padding: 13px 26px;
    font-size: 13px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    border: 1px solid transparent;
    transition: all .2s ${C.ease};

    &:disabled { opacity: .65; cursor: not-allowed; transform: none !important; }

    ${p => p.$ghost && `
        background: #fff; border-color: ${C.line}; color: ${C.ink2};
        &:hover:not(:disabled) { border-color: ${C.ink2}; color: ${C.ink}; }
    `}
    ${p => p.$primary && `
        background: ${C.ox}; color: #fff;
        box-shadow: 0 6px 16px -4px rgba(124,43,35,.40);
        &:hover:not(:disabled) {
            background: ${C.oxDeep}; transform: translateY(-1px);
            box-shadow: 0 10px 24px -4px rgba(124,43,35,.50);
        }
    `}
    ${p => p.$done && `
        background: ${C.moss}; color: #fff;
        box-shadow: 0 6px 16px -4px rgba(77,95,66,.40);
        &:hover:not(:disabled) {
            background: ${C.mossDeep}; transform: translateY(-1px);
            box-shadow: 0 10px 24px -4px rgba(77,95,66,.50);
        }
    `}
`;

const Spinner = styled.div`
    width: 14px; height: 14px; border-radius: 50%; flex: none;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    animation: ${spin} .7s linear infinite;
`;

// ─── Confirmation hero ──────────────────────────────────────────
const ConfirmHero = styled.div`
    text-align: center; padding: 6px 0 22px;

    .ring {
        width: 88px; height: 88px; margin: 0 auto 20px; border-radius: 50%;
        background: ${C.mossBg}; border: 1px solid #d5e0cd;
        display: grid; place-items: center; color: ${C.moss};
        animation: ${fadeUp} .4s ${C.ease} both;
    }
    h2 { font-family: ${C.serif}; font-size: 1.6rem; font-weight: 600; margin-bottom: 6px; }
    > p { font-family: ${C.serif}; font-style: italic; color: ${C.ink2}; }
    .meta {
        display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;
        margin-top: 18px; font-size: 13px; color: ${C.ink2};
        b { color: ${C.ink}; font-variant-numeric: tabular-nums; }
    }
`;

// ─── Woodland Elegance Footer (dark) ────────────────────────────
const ElegantFooter = styled.footer`
    position: relative;
    width: 100%; overflow: hidden;
    margin-top: auto;
    background: #1a1611; color: #f3efe5;
    text-align: center;
    padding: 56px 24px 0;

    &::before, &::after {
        content: '';
        position: absolute; left: 50%; transform: translateX(-50%);
        border-radius: 50%; pointer-events: none;
    }
    &::before { bottom: -240px; width: 480px; height: 480px; border: 1.5px solid rgba(243,239,229,.08); }
    &::after  { bottom: -300px; width: 640px; height: 640px; border: 1px solid rgba(243,239,229,.05); }

    @media (max-width: 640px) { padding: 44px 20px 0; }
`;

const LeafMark = styled.div`
    width: 50px; height: 50px; margin: 0 auto 20px; border-radius: 50%;
    background: rgba(243,239,229,.04);
    border: 1px solid rgba(154,106,30,.35);
    display: grid; place-items: center;
    position: relative; z-index: 1;
    color: ${C.och};
`;

const FooterTagline = styled.p`
    font-family: ${C.serif}; font-style: italic; font-weight: 400;
    font-size: 1.25rem; line-height: 1.55;
    color: rgba(243,239,229,.88);
    max-width: 44ch; margin: 0 auto;
    position: relative; z-index: 1;
`;

const FooterValues = styled.div`
    display: flex; align-items: center; justify-content: center; gap: 16px;
    max-width: 420px; margin: 26px auto 0;
    position: relative; z-index: 1;

    &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(243,239,229,.15); }

    .vlabel {
        font-weight: 700; font-size: .64rem; letter-spacing: .26em; text-transform: uppercase;
        color: rgba(243,239,229,.65);
    }
    .vdot { color: ${C.och}; font-weight: 600; }
`;

const FooterBar = styled.div`
    position: relative; z-index: 1;
    margin-top: 42px;
    border-top: 1px solid rgba(243,239,229,.10);
    display: flex; justify-content: space-between; align-items: center;
    gap: 10px; flex-wrap: wrap;
    padding: 20px 32px;
    font-weight: 500; font-size: .76rem;
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

    // deceased-service picks the DATABASE from the branch headers when present
    // and falls back to x-tenant-slug — sending all three keeps them in agreement.
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

    // Cosmetic confirmation reference derived from the admission number.
    const confirmRef = foundCase
        ? `PM-${new Date().getFullYear()}-${String(foundCase.admission_number || foundCase.deceased_id || '').slice(-4) || '0000'}`
        : '';

    return (
        <>
            <GlobalStyles />
            <Shell>
                <Card>

                    <AccentLine aria-hidden="true" />

                    {/* ── Condolence strip (light) ── */}
                    <Condolence>
                        <p>
                            <span className="orn">❦</span>
                            We are deeply sorry for your loss. Please accept our heartfelt condolences.
                            <span className="orn">❦</span>
                        </p>
                    </Condolence>

                    {/* ── Document header ── */}
                    <DocHeader>
                        <HeaderLeft>
                            <ReqIdBadge>
                                <span className="ico"><I.Hash /></span>
                                Postmortem Request Form
                            </ReqIdBadge>
                            <Timestamps>
                                <MetaItem><I.Calendar /><b>{currentDate}</b></MetaItem>
                                <MetaItem><I.Clock /><b>{currentTime}</b></MetaItem>
                            </Timestamps>
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

                    {/* ── Title ── */}
                    <TitleSection>
                        <h1>Postmortem <span className="accent">Examination</span> Request</h1>
                        <p>Complete all fields accurately to authorize the procedure.</p>
                    </TitleSection>

                    {/* ─── Step indicator ─── */}
                    <Steps>
                        <Step $active={!step1Done && !step2Done} $done={step1Done}>
                            <div className="num">{step1Done ? <I.Check /> : '1'}</div>
                            Find Case
                        </Step>
                        <StepLine $done={step1Done} />
                        <Step $active={step1Done && !step2Done} $done={step2Done}>
                            <div className="num">{step2Done ? <I.Check /> : '2'}</div>
                            Submit Request
                        </Step>
                        <StepLine $done={step2Done} />
                        <Step $active={false} $done={step2Done}>
                            <div className="num">{step2Done ? <I.Check /> : '3'}</div>
                            Confirmed
                        </Step>
                    </Steps>

                    {/* ════════════ STEP 1 — Case lookup ════════════ */}
                    {!step1Done && !step2Done && (
                        <form onSubmit={handleLookup}>
                            <Body>
                                <Alert>
                                    <I.Info />
                                    <div>
                                        Enter the <strong>Deceased Admission Number</strong>, the <strong>Next-of-Kin phone number</strong>,
                                        or the <strong>National ID</strong> to locate the case.
                                    </div>
                                </Alert>

                                {lookupError && (
                                    <Alert $type="error" role="alert">
                                        <I.Warn />
                                        {lookupError}
                                    </Alert>
                                )}

                                <FormGroup>
                                    <Label htmlFor="searchType">
                                        <span className="lico"><I.List /></span>
                                        Search By
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
                                        <span className="lico"><I.Search /></span>
                                        {searchType === 'phone' ? 'Phone Number' : searchType === 'id_number' ? 'ID Number' : 'Admission Number'}
                                    </Label>
                                    <Input
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
                                <Btn type="button" $ghost onClick={() => window.history.back()}>
                                    <I.Close /> Cancel
                                </Btn>
                                <Btn type="submit" $primary disabled={isSearching}>
                                    {isSearching ? <><Spinner /> Searching…</> : <><I.SearchLg /> Find Case</>}
                                </Btn>
                            </FormFooter>
                        </form>
                    )}

                    {/* ════════════ STEP 2 — Request form ════════════ */}
                    {step1Done && !step2Done && (
                        <form onSubmit={handleSubmit}>
                            <Body>
                                <Alert $type="success">
                                    <I.CheckCircle />
                                    <div>Case found. Please review the details below and complete your request.</div>
                                </Alert>

                                <CaseCard>
                                    <CaseTitle>
                                        <I.UserTag /> Deceased Record
                                    </CaseTitle>
                                    <CaseRow>
                                        <span className="k">Full Name</span>
                                        <span className="v">{foundCase.full_name || '—'}</span>
                                    </CaseRow>
                                    <CaseRow>
                                        <span className="k">Admission No.</span>
                                        <span className="v">{foundCase.admission_number || foundCase.deceased_id}</span>
                                    </CaseRow>
                                    {foundCase.date_of_death && (
                                        <CaseRow>
                                            <span className="k">Date of Death</span>
                                            <span className="v">{foundCase.date_of_death}</span>
                                        </CaseRow>
                                    )}
                                    {foundCase.gender && (
                                        <CaseRow>
                                            <span className="k">Gender</span>
                                            <span className="v">{foundCase.gender}</span>
                                        </CaseRow>
                                    )}
                                    {(foundCase.next_of_kin_name || foundCase.next_of_kin) && (
                                        <CaseRow>
                                            <span className="k">Next of Kin</span>
                                            <span className="v">{foundCase.next_of_kin_name || foundCase.next_of_kin}</span>
                                        </CaseRow>
                                    )}
                                    {(foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number) && (
                                        <CaseRow>
                                            <span className="k">Kin Contact</span>
                                            <span className="v">{foundCase.next_of_kin_phone || foundCase.tell_no || foundCase.phone_number}</span>
                                        </CaseRow>
                                    )}
                                </CaseCard>

                                <FormGroup>
                                    <Label htmlFor="requested_by">
                                        <span className="lico"><I.Shield /></span>
                                        Requesting Authority / Your Name
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
                                    <Label as="span">
                                        <span className="lico"><I.Flag /></span>
                                        Priority
                                    </Label>
                                    <SegPriority role="radiogroup" aria-label="Priority">
                                        {[
                                            { val: 'normal', label: 'Normal' },
                                            { val: 'urgent', label: 'Urgent' },
                                            { val: 'emergency', label: 'Emergency' },
                                        ].map(opt => (
                                            <POpt
                                                key={opt.val}
                                                type="button"
                                                role="radio"
                                                aria-checked={form.priority === opt.val}
                                                $val={opt.val}
                                                $on={form.priority === opt.val}
                                                onClick={() => setForm(f => ({ ...f, priority: opt.val }))}
                                            >
                                                <span className="dot" /> {opt.label}
                                            </POpt>
                                        ))}
                                    </SegPriority>
                                </FormGroup>

                                <FormGroup style={{ marginBottom: 0 }}>
                                    <Label htmlFor="reason">
                                        <span className="lico"><I.Align /></span>
                                        Reason for Request
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
                                    <I.ArrowLeft /> Back
                                </Btn>
                                <Btn type="submit" $primary disabled={isSubmitting}>
                                    {isSubmitting ? <><Spinner /> Submitting…</> : <><I.Send /> Submit Request</>}
                                </Btn>
                            </FormFooter>
                        </form>
                    )}

                    {/* ════════════ STEP 3 — Confirmation ════════════ */}
                    {step2Done && (
                        <>
                            <Body>
                                <ConfirmHero>
                                    <div className="ring"><I.CheckLg /></div>
                                    <h2>Request Submitted</h2>
                                    <p>The mortuary team will review your request and contact you shortly.</p>
                                    <div className="meta">
                                        <span>Reference · <b>{confirmRef}</b></span>
                                        <span>Priority · <b style={{ textTransform: 'capitalize' }}>normal</b></span>
                                    </div>
                                </ConfirmHero>

                                <Alert $type="success" style={{ marginBottom: 0 }}>
                                    <I.CheckCircle />
                                    <div>
                                        <strong>Request Submitted.</strong><br />
                                        {submitResult.msg}
                                        <small>
                                            You can scan the QR code above at any time to check the results.
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
                                    <I.Plus /> New Request
                                </Btn>
                                <Btn type="button" $done onClick={handleDone}>
                                    <I.DoubleCheck /> Done
                                </Btn>
                            </FormFooter>
                        </>
                    )}

                    {/* ── Woodland Elegance Footer (dark) ── */}
                    <ElegantFooter>
                        <LeafMark>
                            <I.Leaf />
                        </LeafMark>

                        <FooterTagline>Received with dignity. Cared for with respect. Remembered with love.</FooterTagline>

                        <FooterValues>
                            <span className="vlabel">Dignity</span><span className="vdot">·</span>
                            <span className="vlabel">Care</span><span className="vdot">·</span>
                            <span className="vlabel">Respect</span>
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