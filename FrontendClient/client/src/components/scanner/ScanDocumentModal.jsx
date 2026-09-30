import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { probeBridge, buildStartScanMessage, fetchScanGrant, authoriseSocket, listScanners } from '../../utils/scannerBridge';
import { notify } from '../../utils/notify';
import {
  Printer, X, Loader2, CheckCircle, AlertTriangle, FileText, RefreshCw,
} from '../../utils/icons/icons';

// ── palette — mirrors the deceased Charge Settings side panel ────────────────
const C = {

  black: '#0a0a0a', dark: '#1a1a1a', gray: '#777777', border: '#c8c8c8',
  borderLight: '#e0e0e0', bgField: '#f7f7f5', success: '#059669', successBg: '#ecfdf5',
  warning: '#d97706', warningBg: '#fef3c7', danger: '#dc2626', dangerBg: '#fef2f2',
  info: '#2563eb', infoBg: '#eff6ff',
  headFrom: '#0f3040', headTo: '#163f52', headLine: '#0b2936',

};


const FONT_SANS = "'Source Sans 3', -apple-system, sans-serif";
const FONT_SERIF = "'Merriweather', Georgia, serif";

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const SpinWrap = styled.span`
  display: inline-flex;
  animation: ${spin} 0.8s linear infinite;
`;
const popIn = keyframes`from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); }`;

const slideIn = keyframes`from { transform: translateX(100%); } to { transform: translateX(0); }`;
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

// ── panel chrome — identical to the deceased Charge Settings sidebar ─────────
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(10, 10, 10, 0.38);
  animation: ${fadeIn} 0.18s ease-out;
`;

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(520px, 100vw);
  height: 100vh;
  background: #ffffff;
  border-left: 1px solid ${C.border};
  box-shadow: -18px 0 44px -18px rgba(10, 10, 10, 0.35);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideIn} 0.2s ease-out;
`;

const Head = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
  flex-shrink: 0;
  background: linear-gradient(135deg, ${C.headFrom} 0%, ${C.headTo} 100%);
  border-bottom: 1px solid ${C.headLine};
  box-shadow: 0 8px 18px rgba(15, 48, 64, 0.16);
`;

const HeadIcon = styled.span`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
`;

const HeadTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${FONT_SERIF};
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
`;

const PanelSubtitle = styled.span`
  display: block;
  margin: 4px 0 0 52px;
  color: rgba(255, 255, 255, 0.72);
  font: 11px ${FONT_SANS};
  letter-spacing: 0.04em;
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: ${C.border} transparent;

  @media (max-width: 560px) {
    padding: 18px;
  }
`;

const CloseBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex: 0 0 auto;

  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.18); border-color: #fff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PanelFoot = styled.footer`
  padding: 14px 24px;
  border-top: 1px solid ${C.borderLight};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: #ffffff;
`;

const Btn = styled.button`
  flex: 1;
  padding: 12px 18px;
  border-radius: 8px;
  font: 700 13.5px ${FONT_SANS};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s ease-out, border-color 0.2s ease-out, color 0.2s ease-out;

  &:disabled { opacity: 0.55; cursor: wait; }
`;

const GhostBtn = styled(Btn)`
  background: #ffffff;
  border: 1px solid ${C.border};
  color: ${C.dark};

  &:hover:not(:disabled) { border-color: ${C.black}; color: ${C.black}; }
`;

const PrimaryBtn = styled(Btn)`
  background: ${C.black};
  color: #ffffff;
  border: none;

  &:hover:not(:disabled) { background: ${C.dark}; }
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

const ScannerIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z" fill="#334155" />
    <rect x="14" y="22" width="36" height="7" fill="#0f172a" />
    <path d="M8 46 L56 46 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 Z" fill="#1e293b" />
    <rect x="13" y="37" width="14" height="5" rx="1" fill="#10b981" />
    <circle cx="37" cy="40" r="2" fill="#64748b" /><circle cx="44" cy="40" r="2" fill="#64748b" />
  </svg>
);

const defaultScanName = (deceasedName) => {
  // Still used as the FALLBACK name when the staff member leaves the field
  // blank - buildStartScanMessage() omits documentName in that case and the
  // bridge falls back to its own timestamped name.
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  const who = String(deceasedName || 'document').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  return `Scan_${who}_${stamp}.pdf`;
};

/**
 * Scan-document modal for the deceased profile.
 * Opens the local Scanner Bridge (ws://localhost:8081), scans → PDF, and the
 * agent uploads DIRECTLY to the documents-service. Scanner-only by design:
 * there is NO manual/dummy file-upload fallback — if the bridge is missing
 * the modal shows the install prompt instead.
 */
const ScanDocumentModal = ({ deceasedId, deceasedName = '', onClose, onScanned }) => {
  const [phase, setPhase] = useState('probe'); // probe|ready|unavailable|scanning|uploading|success|error
  const [progress, setProgress] = useState(5);
  const [message, setMessage] = useState('');
  const [document, setDocument] = useState(null);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [bridgeInfo, setBridgeInfo] = useState(null);
  // Deliberately EMPTY. The staff member names the document themselves - a
  // pre-filled "Scan_Jane-Doe_2026-09-30-1423.pdf" was both noise and, because
  // it was easy to leave untouched, a pile of meaningless filenames in the
  // records. If they leave it blank the bridge generates one at scan time.
  const [documentName, setDocumentName] = useState('');
  // Scanners the local bridge can actually see, for the side panel.
  const [scanners, setScanners] = useState([]);
  // The cloud handshake is a separate, visible step from "socket open":
  // idle -> pending -> done | failed
  const [handshake, setHandshake] = useState('idle');
  const [bridgeId, setBridgeId] = useState('');

  useEffect(() => { probe(); }, []);

  const probe = async () => {
    const result = await probeBridge(4000);
    if (result.ok) {
      setBridgeUrl(result.url);
      setBridgeInfo(result.info || null);
      setBridgeId(result.info?.bridgeId || '');
      setPhase('ready');
      // The side panel shows the real devices behind the bridge, so a reception
      // PC with two scanners (or none plugged in) is obvious at a glance.
      const found = await listScanners(result.url);
      setScanners(found);
    } else {
      setPhase('unavailable');
    }
  };

  const detectedScannerName = bridgeInfo?.scannerName
    || bridgeInfo?.scanner_name
    || bridgeInfo?.deviceName
    || bridgeInfo?.device_name
    || bridgeInfo?.bridge?.scannerName
    || bridgeInfo?.bridge?.name;
  const scannerName = typeof detectedScannerName === 'string' && detectedScannerName.trim()
    ? detectedScannerName
    : 'Scanner Bridge connected';

  const startScan = () => {
    if (!deceasedId) { notify.error('Scan failed', 'Missing deceased ID'); return; }
    setPhase('scanning');
    setProgress(5);
    setMessage('Connecting to the scanner…');

    // The bridge will not drive the scanner until this tab has proved, via a
    // cloud-issued grant, that it is a genuine signed-in Restpoint session.
    // Fetching the grant before opening the socket also means the user gets a
    // clear "sign in first" message instead of an opaque bridge error.
    fetchScanGrant().then((result) => {
      if (!result.ok) {
        setPhase('error');
        setMessage(result.reason);
        return;
      }

      let ws;
      try { ws = new WebSocket(bridgeUrl || 'ws://localhost:8081'); }
      catch (e) {
        setPhase('error');
        setMessage('Cannot reach the Scanner Bridge. Is the local agent running?');
        return;
      }

      ws.onopen = async () => {
        setHandshake('pending');
        setMessage('Authorising this scanner with Restpoint…');
        const auth = await authoriseSocket(ws, result.grant);
        if (!auth.ok) {
          setHandshake('failed');
          setPhase('error');
          setMessage(auth.reason);
          try { ws.close(); } catch { /* ignore */ }
          return;
        }
        setHandshake('done');
        setBridgeId(auth.info?.bridgeId || '');
        setMessage('Starting the scanner…');
        const payload = buildStartScanMessage({
          deceasedId,
          documentName: documentName.trim() || undefined,
          sessionId: auth.sessionId,
        });
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        let data = {};
        try { data = JSON.parse(event.data); } catch { /* ignore non-json */ }
        switch (data.status) {
          case 'AUTHORISING':
            setMessage(data.message || 'Authorising this scanner with Restpoint…');
            break;
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
            setMessage(
              data.code === 'NOT_AUTHORISED'
                ? 'This scanner is not authorised. Please try again.'
                : (/spawnSync\s+naps2(?:\.exe)?\s+ENOENT/i.test(data.message || '')
                  ? 'NAPS2 is not installed or is not on PATH. For a hardware-free test, start the Scanner Bridge in mock mode with MOCK_SCAN=1.'
                  : (data.message || 'Scan failed. Please try again.'))
            );
            try { ws.close(); } catch { /* ignore */ }
            break;
          default: break;
        }
      };

      ws.onerror = () => {
        setPhase('error');
        setMessage('Cannot reach the Scanner Bridge. Is the local agent running?');
      };
    });
  };

  const resetForAnother = () => {
    setDocument(null);
    setProgress(5);
    setMessage('');
    setPhase(bridgeUrl ? 'ready' : 'unavailable');
  };

  const done = () => {
    if (typeof onScanned === 'function') onScanned(document || {});
    if (typeof onClose === 'function') onClose();
  };

  // ── shared little blocks ────────────────────────────────────────────────
  const metaFields = (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>
        Document name <span style={{ fontWeight: 400, color: C.gray }}>(optional)</span>
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          maxLength={120}
          placeholder="e.g. Grant of Probate"
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}
        />
        <span style={{ display: 'block', marginTop: 4, fontWeight: 400, fontSize: 11, color: C.gray }}>
          Leave blank and Restpoint will name it automatically.
        </span>
      </label>
    </div>
  );

  // Live status of the two things that can silently fail on a reception PC:
  // is the local agent reachable, and has the cloud actually authorised it.
  // Showing these separately is the difference between "it is broken" and
  // "the bridge is fine, you are just signed out".
  const linkRows = [
    {
      key: 'agent',
      label: 'Scanner Bridge',
      detail: bridgeUrl
        ? bridgeUrl.replace(/^wss?:\/\//, '')
        : 'Not detected on this computer',
      state: bridgeUrl ? 'ok' : 'bad',
    },
    {
      key: 'cloud',
      label: 'Restpoint cloud',
      detail: bridgeId ? `Authorised · bridge ${bridgeId.slice(0, 8)}` : 'Checks when you start a scan',
      state: handshake === 'done' ? 'ok' : handshake === 'failed' ? 'bad' : 'idle',
    },
  ];

  const linkIcon = (state) => {
    if (state === 'ok') return <CheckCircle size={14} />;
    if (state === 'bad') return <AlertTriangle size={14} />;
    return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 999, border: `2px solid ${C.border}` }} />;
  };
  const linkColour = (state) => (state === 'ok' ? C.success : state === 'bad' ? C.danger : C.gray);

  const sidePanel = (
    <div style={{ marginTop: 14, border: `1px solid ${C.borderLight}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: C.bgField, padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.gray, borderBottom: `1px solid ${C.borderLight}` }}>
        Detected scanners
      </div>

      {scanners.length > 0 ? (
        <div style={{ padding: '4px 0' }}>
          {scanners.map((s, i) => (
            <div key={s?.id || s?.name || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px' }}>
              <span style={{ color: s?.available === false ? C.gray : C.success, display: 'inline-flex' }}>
                <Printer size={14} />
              </span>
              <span style={{ fontSize: 13, color: C.dark, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s?.name || 'Scanner'}
              </span>
              {s?.driver ? (
                <span style={{ fontSize: 10, color: C.gray, border: `1px solid ${C.borderLight}`, borderRadius: 999, padding: '1px 7px' }}>
                  {s.driver}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '10px 12px', fontSize: 12, color: C.gray }}>
          {bridgeUrl
            ? 'No scanner detected. Check the USB cable and that the scanner is switched on.'
            : 'Install the Scanner Bridge to detect your scanner.'}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: '10px 12px', display: 'grid', gap: 9 }}>
        {linkRows.map((row) => (
          <div key={row.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ color: linkColour(row.state), display: 'inline-flex', marginTop: 1 }}>
              {handshake === 'pending' && row.key === 'cloud'
                ? <SpinWrap><Loader2 size={14} /></SpinWrap>
                : linkIcon(row.state)}
            </span>
            <span style={{ fontSize: 12, lineHeight: 1.35 }}>
              <span style={{ color: C.dark, fontWeight: 600 }}>{row.label}</span>
              <br />
              <span style={{ color: C.gray }}>{row.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const busy = phase === 'scanning' || phase === 'uploading' || phase === 'probe';

  // Footer actions — ghost + black primary, exactly like the Charge Settings panel
  let footActions = null;
  if (phase === 'ready') {
    footActions = (
      <>
        <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn type="button" onClick={startScan}>
          <Printer size={15} /> Scan Document
        </PrimaryBtn>
      </>
    );
  } else if (phase === 'unavailable') {
    footActions = (
      <>
        <GhostBtn type="button" onClick={onClose}>Close</GhostBtn>
        <PrimaryBtn type="button" onClick={probe}>
          <RefreshCw size={15} /> Check Again
        </PrimaryBtn>
      </>
    );
  } else if (phase === 'success') {
    footActions = (
      <>
        <GhostBtn type="button" onClick={resetForAnother}>
          <Printer size={15} /> Scan another
        </GhostBtn>
        <PrimaryBtn type="button" onClick={done}>
          <CheckCircle size={16} /> Done
        </PrimaryBtn>
      </>
    );
  } else if (phase === 'error') {
    footActions = (
      <>
        <GhostBtn type="button" onClick={onClose}>Close</GhostBtn>
        <PrimaryBtn type="button" onClick={resetForAnother}>
          <RefreshCw size={15} /> Try Again
        </PrimaryBtn>
      </>
    );
  }

  return (
    <Overlay onClick={busy ? undefined : onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Head>
          <div>
            <HeadTitle>
              <HeadIcon><ScannerIcon size={22} /></HeadIcon>
              Scan Document
            </HeadTitle>
            <PanelSubtitle>Capture and attach documents to this deceased profile</PanelSubtitle>
          </div>
          <CloseBtn onClick={onClose} disabled={busy} title="Close">
            <X size={14} />
          </CloseBtn>
        </Head>

        <PanelBody>
          {phase === 'probe' && (
            <StatusBox $kind="info">
              <SpinWrap><Loader2 size={16} /></SpinWrap>
              Checking for the local Scanner Bridge…
            </StatusBox>
          )}

          {phase === 'ready' && (
            <>
              <StatusBox $kind="info">
                <Printer size={16} />
                {scannerName}{bridgeUrl ? ` — ${bridgeUrl.replace(/^wss?:\/\//, '')}` : ''}.
              </StatusBox>
              <div style={{ background: C.bgField, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 13, color: C.dark }}>
                Place the document(s) face-up in the scanner tray, then press
                <strong> Scan Document</strong>. The pages are scanned to a PDF and
                uploaded straight to this deceased person's documents.
              </div>
              {metaFields}
              {sidePanel}
            </>
          )}

          {phase === 'unavailable' && (
            <>
              <StatusBox $kind="warning">
                <AlertTriangle size={16} />
                Scanner Bridge not found on this computer.
              </StatusBox>
              <div style={{ background: C.bgField, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 13, color: C.dark }}>
                <strong>Install Scanner Bridge</strong>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <a
                    href="/downloads/windows/Restpoint-Scanner-Bridge-Installer.exe"
                    download
                    style={{ color: C.info, fontWeight: 600 }}
                  >
                    Windows - download the installer
                  </a>
                  <span>
                    <a href="/downloads/macbook/Restpoint-Scanner-Bridge.pkg" download style={{ color: C.info, fontWeight: 600 }}>
                      macOS -  download the package
                    </a>
                  </span>
                </div>
              </div>

              {/* macOS will refuse to open an unsigned package on a double-click.
                  These are the two ways through it; the helper is the reliable
                  one because it also clears the "downloaded from the internet"
                  quarantine flag that blocks the agent binary afterwards. */}
              <div style={{ background: C.infoBg, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 12, color: C.dark, lineHeight: 1.5 }}>
                <strong>If macOS says &ldquo;cannot be opened because the developer cannot be verified&rdquo;:</strong>
                <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  <li>
                    Right click the downloaded <code>.pkg</code> &rarr; choose <strong>Open</strong> &rarr; <strong>Open</strong> again.
                  </li>
                  <li>
                    Or, more reliable: open <strong>Terminal</strong> (Spotlight &rarr; Terminal), drag the{' '}
                    <code>.pkg</code> onto the window and press Return, then run:
                  </li>
                </ol>
                <code style={{ display: 'block', marginTop: 6, padding: '8px 10px', background: '#fff', border: `1px solid ${C.borderLight}`, borderRadius: 6, fontSize: 12, userSelect: 'all' }}>
                  xattr -cr ./Restpoint-Scanner-Bridge.pkg && sudo installer -pkg ./Restpoint-Scanner-Bridge.pkg -target /
                </code>
                <div style={{ marginTop: 8, color: C.gray }}>
                  This is not a security risk: it clears the quarantine flag on that one file, exactly as
                  right-click &rarr; Open does.
                </div>
              </div>
              {metaFields}
            </>
          )}

          {(phase === 'scanning' || phase === 'uploading') && (
            <>
              <StatusBox $kind="info">
                <SpinWrap><Loader2 size={16} /></SpinWrap>
                {message}
              </StatusBox>
              <ProgressBar $w={progress}><div /></ProgressBar>
              <div style={{ fontSize: 12, color: C.gray, textAlign: 'center' }}>
                {phase === 'scanning' ? 'Holding the scanner… pages are being digitised.' : 'Sending the PDF to the documents service…'}
              </div>
              {sidePanel}
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
            </>
          )}

          {phase === 'error' && (
            <>
              <StatusBox $kind="error">
                <AlertTriangle size={16} />
                {message || 'Scan failed. Please try again.'}
              </StatusBox>
            </>
          )}
        </PanelBody>

        {footActions && <PanelFoot>{footActions}</PanelFoot>}
      </Panel>
    </Overlay>
  );
};

export default ScanDocumentModal;