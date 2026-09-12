import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { probeBridge, getBridgeUrls } from '../../utils/scannerBridge';
import { Printer } from '../../utils/icons/icons';

const DISMISS_KEY = 'restpoint.scannerBridgeDismissed';
const DL_URL_KEY = 'restpoint.scannerBridgeDownloadUrl';

// The installer is copied into client/public/downloads and served by the web app.
const defaultDownloadUrl = () => {
  try {
    const custom = localStorage.getItem(DL_URL_KEY);
    if (custom) return custom;
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://restpoint.co.ke';
    return `${origin}/downloads/Restpoint-Scanner-Bridge-Installer.exe`;
  } catch {
    return 'https://restpoint.co.ke/downloads/Restpoint-Scanner-Bridge-Installer.exe';
  }
};

const modalIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;
const scan = keyframes`
  0% { top: 12px; opacity: 1; }
  50% { top: calc(100% - 18px); opacity: 1; }
  51% { opacity: 0; }
  100% { top: 12px; opacity: 0; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(2, 6, 23, 0.76);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
`;

const Modal = styled.div`
  width: min(440px, 100%);
  overflow: hidden;
  color: #e2e8f0;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(2, 6, 23, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: ${modalIn} 0.35s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f8fafc;
  font: 600 14px 'Source Sans 3', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
  animation: ${pulse} 2s infinite;
`;

const HeaderId = styled.span`
  color: #64748b;
  font: 11px 'JetBrains Mono', monospace;
  letter-spacing: 1px;
`;

const ModalBody = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 24px 24px;

  @media (max-width: 420px) {
    align-items: flex-start;
    gap: 16px;
  }
`;

const Visualizer = styled.div`
  position: relative;
  display: flex;
  flex: 0 0 100px;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 120px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;

  &::before {
    content: '';
    position: absolute;
    inset: 15px;
    background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0 2px, transparent 2px 8px);
    border-radius: 2px;
  }

  @media (max-width: 360px) {
    flex-basis: 76px;
    width: 76px;
    height: 100px;
  }
`;

const ScanBeam = styled.span`
  position: absolute;
  right: 0;
  left: 0;
  z-index: 2;
  height: 6px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.2), #2dd4bf);
  box-shadow: 0 0 10px #2dd4bf;
  animation: ${scan} 2s infinite ease-in-out;
`;

const CloudIcon = styled.svg`
  z-index: 3;
  width: 32px;
  height: 32px;
  fill: none;
  stroke: #2dd4bf;
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(45, 212, 191, 0.5));
`;

const Readout = styled.div`
  flex: 1;
  min-width: 0;

  h3 { margin: 0 0 6px; color: #fff; font: 600 18px 'Source Sans 3', sans-serif; }
  p { margin: 0 0 16px; color: #94a3b8; font: 13px/1.5 'Source Sans 3', sans-serif; }
`;

const TechSpecs = styled.div`
  display: grid;
  gap: 4px;
  color: #64748b;
  font: 11px 'JetBrains Mono', monospace;

  div { display: flex; justify-content: space-between; gap: 8px; padding-bottom: 2px; border-bottom: 1px dashed rgba(255, 255, 255, 0.05); }
  span { color: #e2e8f0; text-align: right; }
  .warning { color: #f59e0b; }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
`;

const GhostBtn = styled.button`
  padding: 14px 20px;
  color: #64748b;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font: 600 14px 'Source Sans 3', sans-serif;
  cursor: pointer;
  &:hover { color: #e2e8f0; background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.2); }
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  color: #0a0c10;
  background: #2dd4bf;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(45, 212, 191, 0.3);
  font: 600 14px 'Source Sans 3', sans-serif;
  text-decoration: none;
  cursor: pointer;
  &:hover { background: #5eead4; box-shadow: 0 0 20px rgba(45, 212, 191, 0.5); }
`;

/**
 * "Install Scanner Bridge" prompt — render INSIDE the deceased list page.
 * Probes the local bridge once. If the agent is not running (and the user has
 * not dismissed this), it shows a focused install modal with a direct download
 * link and a short setup status readout.
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
    <Overlay onClick={dismiss} role="presentation">
      <Modal onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="scanner-bridge-title">
        <ModalHeader>
          <HeaderTitle><StatusDot /> Bridge Awaiting</HeaderTitle>
          <HeaderId>SYS-SCAN-404</HeaderId>
        </ModalHeader>

        <ModalBody>
          <Visualizer aria-hidden="true">
            <ScanBeam />
            <CloudIcon viewBox="0 0 24 24">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </CloudIcon>
          </Visualizer>

          <Readout>
            <h3 id="scanner-bridge-title">Install Scanner Bridge</h3>
            <p>Enable the hardware link to scan physical documents and route them securely to Restpoint.</p>
            <TechSpecs>
              <div>Target: <span>Restpoint cloud</span></div>
              <div>Protocol: <span>LocalSync v2</span></div>
              <div>Status: <span className="warning">Driver missing</span></div>
            </TechSpecs>
            {showSteps && (
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                Download and run the installer once. It starts hidden and runs automatically when you sign in.
                Bridge: {bridgeUrl || String(getBridgeUrls()[0])}.
              </p>
            )}
          </Readout>
        </ModalBody>

        <ModalFooter>
          <GhostBtn onClick={dismiss}>Dismiss</GhostBtn>
          {!showSteps && <GhostBtn onClick={() => setShowSteps(true)}>Details</GhostBtn>}
          <PrimaryBtn href={defaultDownloadUrl()} download>
            <Printer size={16} /> Install &amp; Connect
          </PrimaryBtn>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default ScannerBridgeBanner;