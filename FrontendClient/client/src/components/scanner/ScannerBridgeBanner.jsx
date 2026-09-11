import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { probeBridge, getBridgeUrls } from '../../utils/scannerBridge';
import { Printer } from '../../utils/icons/icons';

const DISMISS_KEY = 'restpoint.scannerBridgeDismissed';
const DL_URL_KEY = 'restpoint.scannerBridgeDownloadUrl';

// Download page for the Scanner Bridge app — hosted at
//   https://<domain>/downloads/restpoint-Scanner-Bridge-app
const defaultDownloadUrl = () => {
  try {
    const custom = localStorage.getItem(DL_URL_KEY);
    if (custom) return custom;
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://restpoint.co.ke';
    return `${origin}/downloads/restpoint-Scanner-Bridge-app`;
  } catch {
    return 'https://restpoint.co.ke/downloads/restpoint-Scanner-Bridge-app';
  }
};

// ── cookie-style banner (per the accepted design) ────────────────────────────
const Banner = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 760px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  box-shadow: 0 18px 40px -10px rgba(15, 23, 42, 0.18);
  z-index: 98;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 14px 18px;
  animation: ${keyframes`from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; }`} 0.35s ease-out;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px 18px 12px;
    width: calc(100% - 24px);
  }
`;

const IconWrap = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
`;

const TextArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
  font-family: 'Source Sans 3', sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: #ecfdf5;
  color: #047857;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  @media (max-width: 640px) { width: 100%; flex-direction: row-reverse; flex-wrap: wrap; }
`;

const GhostBtn = styled.button`
  background: transparent;
  color: #64748b;
  border: 1px solid transparent;
  padding: 7px 12px;
  border-radius: 8px;
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 600;
  font-size: 12.5px;
  cursor: pointer;
  &:hover { background: #f1f5f9; color: #0f172a; }
`;

const PrimaryBtn = styled.a`
  background: #0f172a;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 600;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  &:hover { background: #1e293b; }
`;

const StepsBox = styled.div`
  margin: 10px 0 0;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-size: 12px;
  line-height: 1.6;
  pre { font-family: 'JetBrains Mono', monospace; background: #0f172a; color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; }
`;

const ScannerIcon = () => (
  <svg width="26" height="26" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z" fill="#334155" />
    <rect x="14" y="22" width="36" height="7" fill="#0f172a" />
    <path d="M8 46 L56 46 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 Z" fill="#1e293b" />
    <rect x="13" y="37" width="14" height="5" rx="1" fill="#10b981" />
    <circle cx="37" cy="40" r="2" fill="#64748b" /><circle cx="44" cy="40" r="2" fill="#64748b" />
  </svg>
);

/**
 * "Install Scanner Bridge" prompt — render INSIDE the deceased list page.
 * Probes the local bridge once. If the agent is not running (and the user has
 * not dismissed this), it shows a bottom cookie-style banner with a download
 * link + quick-install steps.
 */
const ScannerBridgeBanner = ({ onReady }) => {
  const [phase, setPhase] = useState('checking'); // checking | ok | missing | dismissed
  const [showSteps, setShowSteps] = useState(false);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const probeRef = useRef(0);

  const isDismissed = () => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  };

  const runProbe = useCallback(async () => {
    const id = ++probeRef.current;
    setPhase('checking');
    const result = await probeBridge(4000);
    if (id !== probeRef.current) return; // stale probe
    if (result.ok) {
      setBridgeUrl(result.url);
      setPhase('ok');
      if (onReady) onReady(result);
    } else if (isDismissed()) {
      setPhase('dismissed');
    } else {
      setPhase('missing');
    }
  }, [onReady]);

  useEffect(() => { runProbe(); }, [runProbe]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setPhase('dismissed');
  };

  if (phase === 'ok' || phase === 'checking' || phase === 'dismissed') return null;

  return (
    <Banner>
      <IconWrap><ScannerIcon /></IconWrap>

      <TextArea>
        <Title>Install Scanner Bridge <Badge>Required</Badge></Title>
        <Subtitle>
          To scan documents directly to Restpoint from this computer, run the local
          Scanner Bridge agent. It wakes the scanner, produces the PDF and uploads it
          to the deceased's documents automatically.
        </Subtitle>

        {showSteps && (
          <StepsBox>
            <strong>Quick install (this computer only — front desk PC):</strong>
            <ol style={{ margin: '4px 0 8px 0', paddingLeft: 16 }}>
              <li><span>Copy <code>dist/agent.js</code> to this computer and install the free NAPS2 scanner driver (TWAIN/WIA/eSCL).</span></li>
              <li><span>Run it once and leave it running in the background:</span></li>
            </ol>
            <pre>{'node dist/agent.js'}</pre>
            <div style={{ marginTop: 6, color: '#64748b' }}>
              Bridge address: {bridgeUrl || String(getBridgeUrls()[0])} — then click
              <strong>'Scan Docs'</strong> on any deceased profile.
            </div>
          </StepsBox>
        )}
      </TextArea>

      <Actions>
        <GhostBtn onClick={dismiss}>Not Now</GhostBtn>
        {!showSteps && <GhostBtn onClick={() => setShowSteps(true)}>How to install</GhostBtn>}
        <PrimaryBtn href={defaultDownloadUrl()} target="_blank" rel="noopener noreferrer">
          <Printer size={14} /> Download App
        </PrimaryBtn>
      </Actions>
    </Banner>
  );
};

export default ScannerBridgeBanner;