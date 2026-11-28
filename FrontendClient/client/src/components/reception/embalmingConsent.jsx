import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReusableSignaturePad from '../../utils/signature/signaturepad';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { fetchWithCredentials } from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';
import { getAuthToken, getTenantSlug } from '../../utils/globalAuth';

/* Code 39 barcode helper */
const C39 = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

const drawBarcode = (canvas, value) => {
  if (!canvas) return '';
  let text = String(value || '').toUpperCase().replace(/[^0-9A-Z\-.\ $\/\+%]/g, '-');
  if (!text) text = 'AWAITING-ID';
  const seq = [];
  const chars = ('*' + text + '*').split('');
  for (let i = 0; i < chars.length; i++) {
    const pat = C39[chars[i]] || C39['-'];
    for (let j = 0; j < pat.length; j++) seq.push(pat.charAt(j) === 'w' ? 3 : 1);
    if (i < chars.length - 1) seq.push(1);
  }
  const units = seq.reduce((a, b) => a + b, 0);
  const unit = Math.max(1, Math.floor(230 / units));
  const w = units * unit;
  const h = 46;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#15171A';
  let x = 0;
  for (let k = 0; k < seq.length; k++) {
    if (k % 2 === 0) ctx.fillRect(x, 0, seq[k] * unit, h);
    x += seq[k] * unit;
  }
  return text;
};

/* ─── Reusable dashed fill-in field ───────────────────────────────── */
const FillField = ({ id, value, onChange, width, placeholder }) => {
  const filled = !!(value && String(value).trim());
  return (
    <span className={`ff${filled ? ' filled' : ''}`}>
      <input
        id={id}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: width || '12ch' }}
        autoComplete="off"
        spellCheck="false"
      />
      <svg className="tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
};

const EmbalmingConsentForm = () => {
  const [adm, setAdm] = useState('');
  const [status, setStatus] = useState({ kind: '', text: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [fields, setFields] = useState({
    f_date: '',
    f_kname: '',
    f_rel: '',
    f_branch: '',
    f_deceased: '',
    f_recv: '',
    f_loc: '',
    f_smark: '',
    f_sname: '',
    f_sid: '',
    f_mname: '',
    f_mid: '',
  });
  const [mastDate, setMastDate] = useState('');
  const [accept, setAccept] = useState(false);
  const [msg, setMsg] = useState({ kind: '', html: '' });
  const [condolence, setCondolence] = useState('Our sincere condolences during this difficult time.');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [genLine, setGenLine] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const barcodeCanvasRef = useRef(null);
  const barcodeTextRef = useRef(null);
  const admNoRef = useRef(null);
  const searchTimerRef = useRef(null);
  const lastSearchedRef = useRef('');

  const FIELDS = ['f_date', 'f_kname', 'f_rel', 'f_branch', 'f_deceased', 'f_recv', 'f_loc', 'f_smark', 'f_sname', 'f_sid', 'f_mname', 'f_mid'];

  const QUOTES = [
    'Our sincere condolences during this difficult time.',
    'May the soul of the faithful departed, through the mercy of God, rest in peace.',
    'Those we love do not go away — they walk beside us every day.',
    'With deepest sympathy to the family and friends of the deceased.',
  ];

  /* ─── Condolence rotator ────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => {
        const next = (prev + 1) % QUOTES.length;
        setCondolence(QUOTES[next]);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Generated timestamp ───────────────────────────────────────── */
  useEffect(() => {
    const now = new Date();
    setGenLine(
      'Montezuma Monalisa Funeral Home Ltd — Generated ' +
        now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
        ' at ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    );
    setYear(now.getFullYear());
  }, []);

  /* ─── Barcode render ────────────────────────────────────────────── */
  const renderBarcode = useCallback((value) => {
    const shown = drawBarcode(barcodeCanvasRef.current, value);
    if (barcodeTextRef.current) barcodeTextRef.current.textContent = shown;
    if (admNoRef.current) admNoRef.current.textContent = shown;
  }, []);

  /* ─── Fill / clear records ─────────────────────────────────────── */
  const fillRecord = (rec) => {
    setFields({
      f_date: rec.consent_date || '',
      f_kname: rec.kin || '',
      f_rel: rec.relationship || '',
      f_branch: rec.branch || '',
      f_deceased: rec.deceased || '',
      f_recv: rec.received || '',
      f_loc: rec.location || '',
      f_smark: '',
      f_sname: rec.kin || '',
      f_sid: rec.kin_id || '',
      f_mname: rec.mortician || '',
      f_mid: rec.mortician_id || '',
    });
    setMastDate(rec.mast_date || rec.consent_date || '—');
  };

  /* ─── Fill record from API response ──────────────────────────────── */
  const fillRecordFromApi = (rec) => {
    setFields({
      f_date: rec.consent_date || rec.date_admitted || '',
      f_kname: rec.next_of_kin || rec.kin || '',
      f_rel: rec.relationship || '',
      f_branch: rec.branch || '',
      f_deceased: rec.full_name || rec.name_of_deceased || rec.deceased || '',
      f_recv: rec.date_admitted || rec.received || '',
      f_loc: rec.place_of_death || rec.death_location || rec.location || '',
      f_smark: '',
      f_sname: rec.next_of_kin || rec.kin || '',
      f_sid: rec.kin_id || rec.id_number || '',
      f_mname: rec.mortician || '',
      f_mid: rec.mortician_id || '',
    });
    setMastDate(rec.mast_date || rec.consent_date || rec.date_admitted || '—');
  };

  const clearDetails = () => {
    const empty = {};
    FIELDS.forEach((id) => (empty[id] = ''));
    setFields(empty);
    setMastDate('—');
  };

  /* ─── Search flow (debounced, real database lookup) ─────────────── */
  const doSearch = useCallback(async () => {
    const v = String(adm || '').trim().toUpperCase();
    renderBarcode(v);
    if (!v) {
      setFound(false);
      setIsSearching(false);
      lastSearchedRef.current = '';
      setStatus({ kind: '', text: '' });
      clearDetails();
      return;
    }
    setIsSearching(true);
    setFound(false);
    setStatus({
      kind: 'searching',
      text: '<span class="spinner"></span> Searching database...',
    });

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      const response = await fetchWithCredentials(
        env.FULL_API_URL + ENDPOINTS.BODYCHECKOUT.DECEASED_BY_ADMISSION(encodeURIComponent(v)),
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            Authorization: 'Bearer ' + token,
          },
        }
      );

      if (String(adm || '').trim().toUpperCase() !== v) return;

      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Record not found');
      }

      const rec = result.data;
      setFound(true);
      setIsSearching(false);
      lastSearchedRef.current = v;
      setStatus({
        kind: 'found',
        text: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Found',
      });
      fillRecordFromApi(rec);
    } catch (error) {
      if (String(adm || '').trim().toUpperCase() !== v) return;
      setFound(false);
      setIsSearching(false);
      setStatus({
        kind: 'notfound',
        text: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Not Found',
      });
      clearDetails();
    }
  }, [adm, renderBarcode]);
  const handleSubmit = () => {
    // Embalming consent is optional and independent of registration.
    // Only the admission number is needed to identify the record.
    // The signature is what completes the embalming consent.
    if (!adm.trim()) {
      setMsg({
        kind: 'error',
        html: '<b>Admission Number is required.</b> Please enter an admission number to look up or save the record.',
      });
      return;
    }
    const rec = fields.f_deceased.trim() || '\u2014';
    const hasSignature = !!signatureData;
    setMsg({
      kind: 'ok',
      html:
        hasSignature
          ? '<b>Embalming consent signed.</b> The embalming consent record for <b>' +
            rec +
            '</b> (Admission No. ' +
            (admNoRef.current?.textContent || adm) +
            ') is complete and ready to file.'
          : '<b>Record saved.</b> Admission No. ' +
            (admNoRef.current?.textContent || adm) +
            ' — embalming consent is optional. Sign the form when embalming is required.',
    });
  };
  /* ─── Initial state: empty — no auto search. User enters adm number manually. ─── */
  // Removed auto doSearch() on mount so the consent form does not pre-fill
  // and does not block registration. It is independent: search adm number,
  // auto-fill details, sign to complete embalming consent only when needed.
          font-size: 15px; line-height: 1.5; padding: 10px 12px 0;
        }
        .mono { font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; }
        .sheet {
          width: 100%; max-width: 1080px; margin: 0 auto; background: var(--white);
          position: relative; overflow: hidden; box-shadow: 0 2px 18px rgba(21, 23, 26, 0.08);
        }
        .watermark {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-family: Georgia, 'Times New Roman', serif; font-weight: 800;
          font-size: clamp(2.6rem, 9vw, 7rem); letter-spacing: 0.2em;
          text-transform: uppercase; white-space: nowrap;
          color: rgba(21, 23, 26, 0.022); pointer-events: none; z-index: 0;
        }
        .content { position: relative; z-index: 1; }
        .masthead { padding: 2.2rem clamp(16px, 4vw, 56px) 1.4rem; border-bottom: 1px solid var(--line); }
        .mast-main { display: flex; gap: 2.5rem; justify-content: space-between; flex-wrap: wrap; }
        .mast-left { flex: 1 1 340px; min-width: 0; }
        .mast-right { flex: 0 1 auto; min-width: 210px; display: flex; flex-direction: column; align-items: flex-end; gap: 1.1rem; }
        .site-name { margin: 0; font-size: clamp(1rem, 2.6vw, 1.3rem); font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.35; }
        .condolence { margin: 0.4rem 0 0; min-height: 1.5em; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 0.88rem; color: var(--muted); transition: opacity 0.6s ease; }
        .sec-label { display: block; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--brass); margin: 1.2rem 0 0.45rem; }
        .fac-line { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--ink); margin: 0.28rem 0; overflow-wrap: anywhere; }
        .fac-line svg { flex: none; color: var(--brass); }
        .date-block, .verify-block { text-align: right; }
        .date-label, .adm-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
        .date-value { font-size: 0.95rem; font-weight: 600; margin-top: 0.25rem; }
        .adm-no { font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 1.15rem; font-weight: 700; letter-spacing: 0.14em; margin-top: 0.25rem; }
        .bc-wrap { margin-top: 0.55rem; }
        .bc-wrap canvas { display: block; max-width: 100%; height: auto; }
        .bc-text { font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.62rem; letter-spacing: 0.34em; color: var(--ink); margin-top: 0.2rem; text-align: center; max-width: 240px; overflow: hidden; }
        .branches { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid var(--line); background: var(--bone); }
        .branches .b { padding: 0.8rem 1rem; font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); line-height: 1.8; text-align: center; }
        .branches .b + .b { border-left: 1px solid var(--line); }
        .branches .b b { color: var(--ink); display: block; letter-spacing: 0.1em; }
        @media (max-width: 768px) {
          .branches { grid-template-columns: 1fr; }
          .branches .b + .b { border-left: none; border-top: 1px solid var(--line); }
          .mast-right { align-items: flex-start; }
          .date-block, .verify-block { text-align: left; }
        }
        .form-body { padding: 2.6rem clamp(16px, 4vw, 56px) 1.5rem; }
        .section { margin-bottom: 3.2rem; }
        .section:last-child { margin-bottom: 0; }
        .section-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.8rem; padding: 0.7rem 1.2rem; background: var(--ink); border-radius: 4px; }
        .section-num { font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.7rem; color: rgba(250, 248, 244, 0.4); }
        .section-title { margin: 0; font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.78rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bone); }
        .label { display: block; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--brass); margin-bottom: 0.45rem; }
        .req { color: var(--red); }
        .search-wrap { position: relative; max-width: 480px; }
        .input-lg { width: 100%; height: 3rem; border: none; border-radius: 0; outline: none; box-shadow: none; background: transparent; padding: 0 7.5rem 0 0.25rem; font-family: inherit; font-size: 1.05rem; font-weight: 500; letter-spacing: 0.06em; color: var(--ink); text-transform: uppercase; border-bottom: 1.5px dashed var(--line-strong); transition: border-color 0.2s ease; }
        .input-lg:hover { border-bottom: 1.5px solid var(--ink); }
        .input-lg:focus { border-bottom: 1.5px solid var(--verdigris); }
        .input-lg.found { border-bottom: 2px solid var(--green); background: rgba(34, 197, 94, 0.07); border-radius: 4px 4px 0 0; padding-left: 0.5rem; }
        .search-status { position: absolute; right: 0.4rem; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 0.4rem; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; pointer-events: none; }
        .search-status.found { color: var(--green); }
        .search-status.notfound { color: var(--red); }
        .search-status.searching { color: var(--gray); }
        .spinner { width: 13px; height: 13px; border: 2px solid rgba(168, 162, 158, 0.35); border-top-color: var(--gray); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .field-hint { margin-top: 0.4rem; font-size: 0.7rem; color: var(--muted); line-height: 1.5; max-width: 480px; }
        .ff { position: relative; display: inline-flex; align-items: baseline; max-width: 100%; }
        .ff input { border: none; outline: none; background: transparent; border-bottom: 1px dashed var(--line-strong); padding: 0.05rem 1.15rem 0.05rem 0.35rem; font-family: inherit; font-size: 0.95rem; color: var(--pen); min-width: 6ch; transition: border-color 0.2s ease; }
        .ff input:hover { border-bottom: 1px solid var(--ink); }
        .ff input:focus { border-bottom: 1px solid var(--verdigris); }
        .ff .tick { position: absolute; right: 0; bottom: 0.32rem; color: var(--green); opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
        .ff.filled .tick { opacity: 1; }
        .consent { margin: 0; padding: 0; list-style: none; }
        .consent li { margin-bottom: 1.35rem; font-size: 0.95rem; line-height: 2.05; }
        .consent .lbl { font-weight: 700; }
        .clause-no { font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.66rem; font-weight: 700; color: var(--brass); margin-right: 0.55rem; }
        .date-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.6rem; }
        .date-row .d { font-size: 0.95rem; font-weight: 600; }
        .note { font-family: 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 0.95rem; color: var(--pen); transform: rotate(-4deg); opacity: 0.9; }
        .section.relative { position: relative; }
        .accept { display: flex; align-items: flex-start; gap: 0.85rem; cursor: pointer; user-select: none; margin: 1.6rem 0; }
        .accept input { appearance: none; -webkit-appearance: none; width: 21px; height: 21px; flex: none; margin-top: 0.1rem; position: relative; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--white); cursor: pointer; transition: all 0.15s ease; }
        .accept input:hover { border-color: var(--verdigris); }
        .accept input:checked { background: var(--verdigris); border-color: var(--verdigris); }
        .accept input:checked::after { content: ''; position: absolute; left: 7px; top: 3px; width: 5px; height: 10px; border: solid var(--bone); border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
        .accept-text { font-size: 0.88rem; font-weight: 600; line-height: 1.5; }
        .accept-small { display: block; margin-top: 0.15rem; font-size: 0.75rem; font-weight: 400; color: var(--gray); }
        .sig { display: inline-block; min-width: 10ch; padding: 0 0.6rem; border-bottom: 1px dashed var(--line-strong); color: var(--pen); font-family: 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 1.25em; line-height: 1.1; transform: rotate(-3deg); }
        .divider { height: 1px; background: var(--line); margin: 1.6rem 0; }
        .msg { display: none; margin-bottom: 1.5rem; padding: 0.8rem 1rem; border-radius: 4px; font-size: 0.82rem; line-height: 1.55; }
        .msg.error { display: block; background: rgba(176, 58, 46, 0.08); color: var(--red); border: 1px solid rgba(176, 58, 46, 0.25); }
        .msg.ok { display: block; background: rgba(34, 197, 94, 0.08); color: #15803D; border: 1px solid rgba(34, 197, 94, 0.3); }
        .actions { display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--line); }
        .btn { border: none; border-radius: 4px; padding: 0.95rem 1.8rem; font-size: 0.8rem; font-weight: 600; font-family: inherit; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease; }
        .btn-gold { background: var(--pine); color: var(--bone); border: 1px solid var(--pine); box-shadow: 0 2px 6px rgba(26, 42, 39, 0.25); }
        .btn-gold:hover { background: var(--pine-light); transform: translateY(-1px); }
        .btn-black { background: transparent; color: var(--ink); border: 1px solid var(--pine); }
        .btn-black:hover { background: var(--pine); color: var(--bone); transform: translateY(-1px); }
        .btn-primary { background: var(--maroon); color: var(--bone); }
        .btn-primary:hover { background: var(--maroon-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(114, 47, 55, 0.25); }
        @media (max-width: 768px) {
          .actions { flex-direction: column-reverse; }
          .actions .btn { width: 100%; }
        }
        .record-strip { margin: 2rem clamp(16px, 4vw, 56px) 0; padding: 0.9rem 1rem 0.4rem; border-top: 1px solid var(--line); text-align: center; font-family: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace; font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray); line-height: 1.8; }
        .elegant-footer { position: relative; overflow: hidden; background: var(--pine); color: var(--cream); text-align: center; padding: 56px 20px 0; margin-top: 2.5rem; }
        .elegant-footer::before, .elegant-footer::after { content: ''; position: absolute; left: 50%; bottom: -260px; transform: translateX(-50%); border-radius: 50%; pointer-events: none; }
        .elegant-footer::before { width: 520px; height: 520px; border: 1.5px solid rgba(233, 235, 221, 0.1); }
        .elegant-footer::after { width: 680px; height: 680px; bottom: -320px; border: 1px solid rgba(233, 235, 221, 0.06); }
        .leaf-mark { width: 44px; height: 44px; margin: 0 auto 18px; border-radius: 50%; background: rgba(237, 233, 219, 0.12); border: 1px solid rgba(237, 233, 219, 0.25); display: grid; place-items: center; }
        .footer-tagline { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 500; font-size: 1.25rem; line-height: 1.5; color: rgba(237, 233, 219, 0.82); max-width: 44ch; margin: 0 auto; }
        .footer-values { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 30px auto 0; max-width: 420px; }
        .footer-values::before, .footer-values::after { content: ''; flex: 1; height: 1px; background: rgba(237, 233, 219, 0.16); }
        .footer-value-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: rgba(205, 209, 191, 0.55); }
        .footer-value-dot { font-family: Georgia, serif; font-weight: 600; font-size: 1rem; color: rgba(205, 209, 191, 0.85); }
        .footer-bar { margin-top: 44px; border-top: 1px solid rgba(237, 233, 219, 0.12); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding: 18px 32px; font-size: 0.74rem; font-weight: 500; color: rgba(237, 233, 219, 0.42); }
        @media (max-width: 560px) {
          .elegant-footer { padding: 44px 20px 0; }
          .footer-bar { flex-direction: column; gap: 6px; padding: 16px 20px; text-align: center; }
        }

        /* ─── PRINT: one A4 page, white background, no body padding ─── */
        @media print {
          @page { size: A4 portrait; margin: 8mm; }

          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet { box-shadow: none; max-width: none; width: 100%; margin: 0; background: #fff; }

          /* hide non-paper elements */
          .actions, .search-status, .field-hint, .no-print, .elegant-footer, .msg { display: none !important; }

          /* undo mobile layout rules that trigger at A4 width */
          .branches { grid-template-columns: 1fr 1fr 1fr !important; }
          .branches .b + .b { border-left: 1px solid var(--line) !important; border-top: none !important; }
          .mast-main { flex-wrap: nowrap; gap: 1rem; }
          .mast-right { align-items: flex-end !important; }
          .date-block, .verify-block { text-align: right !important; }

          /* compact spacing so everything fits on one page */
          .masthead { padding: 0.8rem 1rem 0.6rem; }
          .sec-label { margin: 0.6rem 0 0.3rem; }
          .branches .b { padding: 0.4rem 0.5rem; line-height: 1.5; }
          .form-body { padding: 1rem 1rem 0.5rem; }
          .section { margin-bottom: 1.2rem; break-inside: avoid; }
          .section-head { margin-bottom: 0.8rem; padding: 0.4rem 0.8rem; }
          .date-row { margin-bottom: 0.8rem; }
          .consent li { margin-bottom: 0.6rem; line-height: 1.9; }
          .accept { margin: 0.8rem 0; }
          .divider { margin: 0.8rem 0; }
          .record-strip { margin: 0.8rem 1rem 0; padding-top: 0.5rem; }
          .input-lg.found { background: transparent; }
        }
      `}</style>

      <div className="sheet">
        <div className="watermark">Official Record</div>
        <div className="content">
          {/* Masthead */}
          <header className="masthead">
            <div className="mast-main">
              <div className="mast-left">
                <h1 className="site-name">Montezuma Monalisa Funeral Home Ltd · Head Office</h1>
                <p className={`condolence`} id="condolence">{condolence}</p>
                <span className="sec-label">Facility</span>
                <p className="fac-line">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  0722 268 566, 0722 827 652
                </p>
                <p className="fac-line">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  info@montezumamonalisa.com
                </p>
                <p className="fac-line">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  P.O. Box 51340 - 00200 Nairobi, Kenya
                </p>
              </div>
              <div className="mast-right">
                <div className="date-block">
                  <span className="date-label">Date of Consent</span>
                  <div className="date-value" id="mastDate">{mastDate}</div>
                </div>
                <div className="verify-block">
                  <span className="adm-label">Admission No.</span>
                  <div className="adm-no" id="admNo" ref={admNoRef}>{adm || '—'}</div>
                  <div className="bc-wrap">
                    <canvas id="barcode" ref={barcodeCanvasRef} aria-label="Admission number barcode" role="img"></canvas>
                    <div className="bc-text" id="bcText" ref={barcodeTextRef}>{adm || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Branch strip */}
          <div className="branches">
            <div className="b"><b>MBAGATHI WAY (HEAD OFFICE)</b>Opp. Forces Memorial Hospital<br />Tel: (020) 2346928 / 9, Fax: (020) 8068115</div>
            <div className="b"><b>CHAPEL OF REST · THIKA ROAD BRANCH</b>Opp. Shell Kabati<br />Tel: 0726 094 847</div>
            <div className="b"><b>MACHAKOS BRANCH</b>Opp. Governors Office<br />Tel: (020) 2672677/ 2111904</div>
          </div>

          <div className="form-body">
            {msg.kind && (
              <div className={`msg ${msg.kind}`} dangerouslySetInnerHTML={{ __html: msg.html }} />
            )}

            {/* Section 01 (screen only) */}
            <div className="section no-print">
              <div className="section-head"><span className="section-num">01</span><h2 className="section-title">Record Search &amp; Auto-fill</h2></div>
              <label className="label" htmlFor="adm">Admission Number <span className="req">*</span></label>
              <div className="search-wrap">
                <input
                  className={`input-lg${found ? ' found' : ''}`}
                  id="adm"
                  type="text"
                  placeholder="Start typing to search the database..."
                  value={adm}
                  onChange={handleAdmChange}
                  onKeyDown={handleAdmKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                />
                {status.kind && (
                  <span className={`search-status ${status.kind}`} dangerouslySetInnerHTML={{ __html: status.text }} />
                )}
              </div>
              <p className="field-hint">The record is looked up by admission number; when it is found every detail below is auto-filled (green tick on each field).</p>
            </div>

            {/* Section 02 */}
            <div className="section relative">
              <div className="section-head"><span className="section-num">02</span><h2 className="section-title">Consent for Embalming</h2></div>

              <div className="date-row">
                <span className="note">Already Embalmed.</span>
                <span className="d">
                  Date: <FillField id="f_date" value={fields.f_date} onChange={(v) => handleFieldChange('f_date', v)} width="15ch" />
                </span>
              </div>

              <ol className="consent">
                <li><span className="clause-no">1.</span>DR/MR/MRS/MISS <FillField id="f_kname" value={fields.f_kname} onChange={(v) => handleFieldChange('f_kname', v)} width="17ch" /> being the <FillField id="f_rel" value={fields.f_rel} onChange={(v) => handleFieldChange('f_rel', v)} width="10ch" /> <span className="lbl">(Relationship)</span></li>
                <li><span className="clause-no">2.</span>have consented and authorized Montezuma Monalisa Funeral Home <FillField id="f_branch" value={fields.f_branch} onChange={(v) => handleFieldChange('f_branch', v)} width="16ch" /> <span className="lbl">(Branch)</span></li>
                <li><span className="clause-no">3.</span>to Carry out Embalming of <FillField id="f_deceased" value={fields.f_deceased} onChange={(v) => handleFieldChange('f_deceased', v)} width="23ch" /> <span className="lbl">(Deceased)</span></li>
                <li><span className="clause-no">4.</span>Whose body was received on <FillField id="f_recv" value={fields.f_recv} onChange={(v) => handleFieldChange('f_recv', v)} width="15ch" /> <span className="lbl">(date)</span> From <FillField id="f_loc" value={fields.f_loc} onChange={(v) => handleFieldChange('f_loc', v)} width="13ch" /> <span className="lbl">(Location)</span></li>
              </ol>
            </div>

            {/* Section 03 */}
            <div className="section">
              <div className="section-head"><span className="section-num">03</span><h2 className="section-title">Consent Acceptance &amp; Sign-off</h2></div>

              <label className="accept">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                <span className="accept-text">I have read and accept this Embalming Consent.
                  <span className="accept-small">Signing this form makes it part of the official record of the deceased.</span>
                </span>
              </label>

              <div className="divider"></div>

              <ol className="consent">
                <li>
                  <span className="clause-no">A.</span>Signed.*{' '}
                  {signatureData ? (
                    <img src={signatureData} alt="Signature" style={{ height: 40, verticalAlign: 'middle', borderBottom: '1px dashed var(--line-strong)' }} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSignature(true)}
                      className="sig"
                      style={{ background: 'none', cursor: 'pointer', border: 'none', borderBottom: '1px dashed var(--line-strong)', padding: '0 0.6rem' }}
                    >
                      Tap to sign
                    </button>
                  )}{' '}
                  Name: <FillField id="f_sname" value={fields.f_sname} onChange={(v) => handleFieldChange('f_sname', v)} width="18ch" />{' '}
                  &nbsp;ID: <FillField id="f_sid" value={fields.f_sid} onChange={(v) => handleFieldChange('f_sid', v)} width="10ch" />
                </li>
                <li>
                  <span className="clause-no">B.</span>Mortician / Receptionist (Sign) <span className="sig">Valery</span> Name:{' '}
                  <FillField id="f_mname" value={fields.f_mname} onChange={(v) => handleFieldChange('f_mname', v)} width="11ch" />{' '}
                  &nbsp;ID: <FillField id="f_mid" value={fields.f_mid} onChange={(v) => handleFieldChange('f_mid', v)} width="10ch" />
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="actions">
              <button className="btn btn-gold" type="button" onClick={handleReset}>Reset Inputs</button>
              <button className="btn btn-black" type="button" onClick={handlePrint}>Print Record</button>
              <button className="btn btn-primary" type="button" onClick={handleSubmit}>Submit Consent</button>
            </div>
          </div>

          {/* Record info strip */}
          <div className="record-strip">
            <span id="genLine">{genLine}</span><br />
            - Official Embalming Consent Record -
          </div>

          {/* Footer (screen only) */}
          <footer className="elegant-footer">
            <div className="leaf-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#EDE9DB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="21" height="21">
                <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" />
                <path d="M4 20c4-6.5 8.5-10 13-12.5" />
              </svg>
            </div>
            <p className="footer-tagline">Received with dignity. Cared for with respect. Remembered with love.</p>
            <div className="footer-values">
              <span className="footer-value-label">Dignity</span><span className="footer-value-dot">·</span>
              <span className="footer-value-label">Care</span><span className="footer-value-dot">·</span>
              <span className="footer-value-label">Respect</span>
            </div>
            <div className="footer-bar">
              <span>© <span id="fyear">{year}</span> Montezuma Monalisa Funeral Home Ltd</span>
              <span>Official Embalming Consent Record</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignature && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignature(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              maxWidth: 540,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sign Below</h3>
            <ReusableSignaturePad
              onSave={(data) => {
                setSignatureData(data);
                setShowSignature(false);
              }}
              onCancel={() => setShowSignature(false)}
              width={480}
              height={200}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EmbalmingConsentForm;