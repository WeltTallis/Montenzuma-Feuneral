import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { probeBridge, buildStartScanMessage } from '../../utils/scannerBridge';
import api from '../../api/axios';
import { notify } from '../../utils/notify';
import {
  Printer, Upload, X, Loader2, CheckCircle, AlertTriangle, FileText, RefreshCw,
} from '../../utils/icons/icons';

// ── palette (matches deceased theme) ─────────────────────────────────────────
const C = {
  black: '#0a0a0a', dark: '#1a1a1a', gray: '#777777', border: '#c8c8c8',
  borderLight: '#e0e0e0', bgField: '#f7f7f5', success: '#059669', successBg: '#ecfdf5',
  warning: '#d97706', warningBg: '#fef3c7', danger: '#dc2626', dangerBg: '#fef2f2',
  info: '#2563eb', infoBg: '#eff6ff',
};

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const popIn = keyframes`from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); }`;

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 120;
  background: rgba(10, 10, 10, 0.55);
  display: flex; align-items: center; justify-content: center;
  animation: ${keyframes`from { opacity: 0; } to { opacity: 1; }`} 0.18s ease-out;
`;

const Panel = styled.div`
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid ${C.border};
  box-shadow: 0 22px 44px -14px rgba(10, 10, 10, 0.35);
  animation: ${popIn} 0.2s ease-out;
  padding: 22px 24px;
`;

const Head = styled.div`
  display: flex; align-items: center; gap: 10px; justify-content: space-between;
  h3 { font-family: 'Source Sans 3', sans-serif; font-size: 17px; font-weight: 700; color: ${C.black}; margin: 0; display: flex; align-items: center; gap: 8px; }
`;

const CloseBtn = styled.button`
  width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${C.border};
  background: white; color: ${C.gray}; cursor: pointer; display: grid; place-items: center;
  &:hover { color: ${C.black}; border-color: ${C.black}; }
`;

const StatusBox = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 14px; width: 100%;
  ${(p) => p.$kind === 'success' && `background: ${C.successBg}; color: ${C.success};`}
  ${(p) => p.$kind === 'error' && `background: ${C.dangerBg}; color: ${C.danger};`}
  ${(p) => p.$kind === 'info' && `background: ${C.infoBg}; color: ${C.info};`}
  ${(p) => p.$kind === 'warning' && `background: ${C.warningBg}; color: ${C.warning};`}
  padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid ${C.borderLight};
`;

const ProgressBar = styled.div`
  height: 5px; background: #e5e7eb; border-radius: 3px; margin: 10px 0; overflow: hidden;
  > div { height: 100%; background: ${C.black}; width: ${p => p.$w}%; transition: width 0.3s ease; }
`;

const ScannerIcon = () => (
  <svg width="42" height="42" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z" fill="#334155" />
    <rect x="14" y="22" width="36" height="7" fill="#0f172a" />
    <path d="M8 46 L56 46 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 Z" fill="#1e293b" />
    <rect x="13" y="37" width="14" height="5" rx="1" fill="#10b981" />
    <circle cx="37" cy="40" r="2" fill="#64748b" /><circle cx="44" cy="40" r="2" fill="#64748b" />
  </svg>
);

// ── direct upload to the documents-service (manual fallback) ────────────────
const uploadFileDirect = async ({ file, deceasedId, documentName, category }) => {
  const formData = new FormData();
  formData.append('document', file);
  if (documentName) formData.append('documentName', documentName);
  if (category) formData.append('category', category);

  const headers = { 'Content-Type': null };
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
    if (slug) headers['x-tenant-slug'] = slug;
  } catch { /* localStorage unavailable */ }

  const res = await api.post(`/documents/upload/${encodeURIComponent(deceasedId)}`, formData, {
    headers,
    withCredentials: false,
  });
  return res.data;
};

const defaultScanName = (deceasedName) => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  const who = String(deceasedName || 'document').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  return `Scan_${who}_${stamp}.pdf`;
};

/**
 * Scan-document modal for the deceased profile.
 * Opens the local Scanner Bridge (ws://localhost:8081), scans → PDF, and the
 * agent uploads DIRECTLY to the documents-service. Falls back to a manual file
 * upload (also straight to the documents-service) when no bridge is installed.
 */
const ScanDocumentModal = ({ deceasedId, deceasedName = '', onClose, onScanned }) => {
  const [phase, setPhase] = useState('probe'); // probe|ready|unavailable|scanning|uploading|success|error
  const [progress, setProgress] = useState(5);
  const [message, setMessage] = useState('');
  const [document, setDocument] = useState(null);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [documentName, setDocumentName] = useState(() => defaultScanName(deceasedName));
  const [category, setCategory] = useState('Scan');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { probe(); }, []);

  const probe = async () => {
    const result = await probeBridge(4000);
    if (result.ok) { setBridgeUrl(result.url); setPhase('ready'); }
    else setPhase('unavailable');
  };

  const startScan = () => {
    if (!deceasedId) { notify.error('Scan failed', 'Missing deceased ID'); return; }
    setPhase('scanning');
    setProgress(5);
    setMessage('Connecting to the scanner…');

    let ws;
    try { ws = new WebSocket(bridgeUrl || 'ws://localhost:8081'); }
    catch (e) {
      setPhase('error');
      setMessage('Cannot reach the Scanner Bridge. Is the local agent running?');
      return;
    }

    ws.onopen = () => {
      const payload = buildStartScanMessage({ deceasedId, documentName: documentName || undefined, category });
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      let data = {};
      try { data = JSON.parse(event.data); } catch { /* ignore non-json */ }
      switch (data.status) {
        case 'SCANNING':
          setPhase('scanning');
          setProgress(typeof data.progress === 'number' ? data.progress : 50);
          setMessage(data.message || 'Scanning…');
          break;
        case 'UPLOADING':
          setPhase('uploading');
          setProgress(85);
          setMessage(data.message || 'Uploading to the documents service…');
          break;
        case 'COMPLETE':
          setProgress(100);
          setDocument(data.document || null);
          setPhase('success');
          setMessage(data.message || 'Document scanned and uploaded successfully!');
          try { ws.close(); } catch { /* ignore */ }
          break;
        case 'ERROR':
          setPhase('error');
          setMessage(data.message || 'Scan failed. Please try again.');
          try { ws.close(); } catch { /* ignore */ }
          break;
        default: break;
      }
    };

    ws.onerror = () => {
      setPhase('error');
      setMessage('Cannot reach the Scanner Bridge. Is the local agent running?');
    };
  };

  const resetForAnother = () => {
    setDocument(null);
    setProgress(5);
    setMessage('');
    setPhase(bridgeUrl ? 'ready' : 'unavailable');
  };

  const handleManualFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!deceasedId) { notify.error('Upload failed', 'Missing deceased ID'); return; }
    setUploading(true);
    setPhase('uploading');
    setMessage('Uploading to the documents service…');
    try {
      const res = await uploadFileDirect({ file, deceasedId, documentName: documentName || file.name, category });
      setDocument(res?.data || res || { name: file.name });
      setPhase('success');
      setMessage(res?.message || 'Document uploaded successfully!');
      notify.success('Uploaded', res?.message || 'Document uploaded to the documents service.');
    } catch (err) {
      setPhase('error');
      setMessage(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const done = () => {
    if (typeof onScanned === 'function') onScanned(document || {});
    if (typeof onClose === 'function') onClose();
  };

  // ── shared little blocks ────────────────────────────────────────────────
  const metaFields = (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>
        Document name
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}
        />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}
        >
          {['Scan', 'General', 'Death Certificate', 'Medical', 'Police Report', 'ID / Passport', 'Release Forms', 'Other'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    </div>
  );

  const primaryBtn = {
    background: C.black, color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'Source Sans 3', sans-serif",
  };
  const ghostBtn = {
    background: '#fff', color: C.dark, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 16px', fontSize: 13.5, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={handleManualFile}
      style={{ display: 'none' }}
    />
  );

  const busy = phase === 'scanning' || phase === 'uploading' || uploading || phase === 'probe';

  return (
    <Overlay onClick={busy ? undefined : onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Head>
          <h3><ScannerIcon /> Scan Document</h3>
          <CloseBtn onClick={onClose} disabled={busy} title="Close">
            <X size={14} />
          </CloseBtn>
        </Head>

        {phase === 'probe' && (
          <StatusBox $kind="info">
            <Loader2 size={16} className="spinner" style={{ animation: `${spin} 0.8s linear infinite` }} />
            Checking for the local Scanner Bridge…
          </StatusBox>
        )}

        {phase === 'ready' && (
          <>
            <StatusBox $kind="info">
              <Printer size={16} />
              Scanner Bridge connected{bridgeUrl ? ` — ${bridgeUrl.replace(/^ws:\/\//, '')}` : ''}.
            </StatusBox>
            <div style={{ background: C.bgField, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 13, color: C.dark }}>
              Place the document(s) face-up in the scanner tray, then press
              <strong> Scan Document</strong>. The pages are scanned to a PDF and
              uploaded straight to this deceased person's documents.
            </div>
            {metaFields}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button style={{ ...primaryBtn, flex: 1 }} onClick={startScan}>
                <Printer size={16} /> Scan Document
              </button>
              <button style={ghostBtn} onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} /> Upload a file instead
              </button>
            </div>
            {hiddenFileInput}
          </>
        )}

        {phase === 'unavailable' && (
          <>
            <StatusBox $kind="warning">
              <AlertTriangle size={16} />
              Scanner Bridge not found on this computer.
            </StatusBox>
            <div style={{ background: C.bgField, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 13, color: C.dark }}>
              <strong>Install Scanner Bridge</strong> to scan straight from Restpoint
              (no HP software or scanner buttons needed). Download the app at
              <code>{`${typeof window !== 'undefined' && window.location ? window.location.origin : 'https://restpoint.co.ke'}/downloads/restpoint-Scanner-Bridge-app`}</code>
              and run <code>node dist/agent.js</code> on this computer.
            </div>
            {metaFields}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button style={{ ...primaryBtn, flex: 1 }} onClick={probe}>
                <RefreshCw size={15} /> Check Again
              </button>
              <button style={ghostBtn} onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} /> Upload a scanned file instead
              </button>
            </div>
            {hiddenFileInput}
          </>
        )}

        {(phase === 'scanning' || phase === 'uploading') && (
          <>
            <StatusBox $kind="info">
              <Loader2 size={16} className="spinner" style={{ animation: `${spin} 0.8s linear infinite` }} />
              {message}
            </StatusBox>
            <ProgressBar $w={progress}><div /></ProgressBar>
            <div style={{ fontSize: 12, color: C.gray, textAlign: 'center' }}>
              {phase === 'scanning' ? 'Holding the scanner… pages are being digitised.' : 'Sending the PDF to the documents service…'}
            </div>
          </>
        )}

        {phase === 'success' && (
          <>
            <StatusBox $kind="success">
              <CheckCircle size={16} />
              {message || 'Document scanned and uploaded successfully!'}
            </StatusBox>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 13, color: C.dark, background: C.bgField, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px' }}>
              <FileText size={15} />
              <span>
                <strong>{document?.original_name || document?.name || documentName || 'Scanned document'}</strong>
                {document?.file_size ? ` · ${Math.max(1, Math.round(document.file_size / 1024))} KB` : ''}
                {' '}· uploaded to this profile's documents.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={ghostBtn} onClick={resetForAnother}>
                <Printer size={15} /> Scan another
              </button>
              <button style={{ ...primaryBtn, flex: 1 }} onClick={done}>
                <CheckCircle size={16} /> Done
              </button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <StatusBox $kind="error">
              <AlertTriangle size={16} />
              {message || 'Scan failed. Please try again.'}
            </StatusBox>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button style={ghostBtn} onClick={resetForAnother}>
                <RefreshCw size={15} /> Try Again
              </button>
              <button style={ghostBtn} onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} /> Upload a file instead
              </button>
            </div>
            {hiddenFileInput}
          </>
        )}
      </Panel>
    </Overlay>
  );
};

export default ScanDocumentModal;