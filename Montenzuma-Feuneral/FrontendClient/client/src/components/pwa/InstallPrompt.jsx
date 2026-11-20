import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone } from '../../utils/icons/icons';

/* ══════════════════════════════════════════════════════════════════════════
   PWA install prompt — built to actually appear on phones.

   Chromium (Android Chrome / Edge / Brave / Samsung, desktop Chrome) fires
   `beforeinstallprompt`; we capture it and replay it from our own Install
   button. iOS and browsers that withhold the event never see this banner —
   no manual download instructions are shown.
   ══════════════════════════════════════════════════════════════════════════ */

// The user's choice is stored in a COOKIE (not sessionStorage/localStorage):
// logout clears the auth storage but NOT cookies, so once the user accepts
// (or dismisses) the banner it stays quiet — it must not pop up again every
// time they land on the page or log back in.
//
// v3 of the cookie name: the previous build could not show on iOS at all and
// was easy to miss on Android, so any stale "dismissed" cookie from it is
// deliberately ignored — the fixed prompt gets one clean showing again.
const COOKIE_NAME = 'pwa-install-choice-v1';   // 'accepted' | 'dismissed'
const ACCEPT_MAX_AGE = 60 * 60 * 24 * 365;     // accepted  → 1 year (effectively forever)
const DISMISS_MAX_AGE = 60 * 60 * 24 * 7;      // "Not now" → 7 days
const SHOW_DELAY_MS = 4 * 1000;                // after the native prompt is captured

// ─── Early capture of beforeinstallprompt ────────────────────────────
// The browser fires `beforeinstallprompt` exactly ONCE per page load —
// frequently BEFORE React has finished mounting this component. A listener
// registered inside useEffect can miss it entirely, leaving the banner
// unable to appear. So we capture the event at module scope (evaluated as
// soon as the chunk loads) and hand it to the component when it mounts.
let capturedInstallEvent = null;
const earlyInstallListeners = new Set();

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        capturedInstallEvent = e;
        earlyInstallListeners.forEach((fn) => {
            try { fn(e); } catch { /* listener errors must not break others */ }
        });
    });
}

const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const setCookie = (name, value, maxAgeSeconds) => {
    try {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    } catch { /* cookies unavailable (private mode etc.) — banner just behaves as before */ }
};

/** Already running as an installed app? Then there is nothing to install. */
const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    const modes = ['standalone', 'fullscreen', 'minimal-ui'];
    const displayMode = modes.some((m) => {
        try { return window.matchMedia(`(display-mode: ${m})`).matches; } catch { return false; }
    });
    // iOS Safari exposes its own flag and reports display-mode inconsistently.
    return displayMode || window.navigator.standalone === true;
};

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [hideForever, setHideForever] = useState(false);
    const delayTimerRef = useRef(null);

    useEffect(() => {
        // Already installed, or the user already accepted/dismissed → stay quiet.
        if (isStandalone() || getCookie(COOKIE_NAME)) {
            setHideForever(true);
            return undefined;
        }

        const clearTimers = () => {
            if (delayTimerRef.current) { clearTimeout(delayTimerRef.current); delayTimerRef.current = null; }
        };

        // Shared handler — the event may arrive via the module-scope capture
        // above (if it fired before this effect ran) or live, right now.
        const handlePromptEvent = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Do NOT pop up immediately on landing — wait a few seconds so it
            // is not in the user's face the second the page loads.
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            delayTimerRef.current = setTimeout(() => setShowPrompt(true), SHOW_DELAY_MS);
        };

        // If the event already fired before mount, use the captured one now.
        if (capturedInstallEvent) handlePromptEvent(capturedInstallEvent);

        const handler = (e) => {
            // Only react to a LIVE event — a captured one is handled above.
            if (e === capturedInstallEvent) return;
            handlePromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        earlyInstallListeners.add(handler);

        // Installed from anywhere (including the browser's own mini-infobar).
        const installedHandler = () => {
            setHideForever(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            clearTimers();
            setCookie(COOKIE_NAME, 'accepted', ACCEPT_MAX_AGE);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            earlyInstallListeners.delete(handler);
            window.removeEventListener('appinstalled', installedHandler);
            clearTimers();
        };
    }, []);

    useEffect(() => {
        // If the app is launched from the home screen while this tab is still
        // open, the change of display-mode must silence the banner too.
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        let mq;
        try { mq = window.matchMedia('(display-mode: standalone)'); } catch { return undefined; }
        const onChange = (ev) => { if (ev.matches) { setHideForever(true); setShowPrompt(false); } };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else if (mq.removeListener) mq.removeListener(onChange);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowPrompt(false);
        if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
        if (outcome === 'accepted') {
            // User accepted the install → that should be it, never again.
            setCookie(COOKIE_NAME, 'accepted', ACCEPT_MAX_AGE);
        } else {
            // Backed out of the native dialog → quiet for a week.
            setCookie(COOKIE_NAME, 'dismissed', DISMISS_MAX_AGE);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
        // Dismissed → stay quiet for a week (survives logout & refreshes).
        setCookie(COOKIE_NAME, 'dismissed', DISMISS_MAX_AGE);
    };

    // Don't render if already installed, or there is no native prompt to replay.
    if (hideForever || !showPrompt || !deferredPrompt) return null;

    return (
        <div className="install-wrapper" role="dialog" aria-label="Install Rest Point">
            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .install-wrapper {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.85);
                    border: 1px solid rgba(250, 248, 244, 0.1);
                    border-radius: 12px;
                    padding: 1rem;
                    width: 280px;
                    max-width: calc(100vw - 24px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 115, 85, 0.1);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    z-index: 9998;
                    color: #FAF8F4;
                    font-family: 'Inter', sans-serif;
                    animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .install-header {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .install-icon-box {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(139, 115, 85, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #A98F6E;
                    flex-shrink: 0;
                }
                .install-title {
                    font-family: 'Fraunces', serif;
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #FAF8F4;
                    margin: 0 0 0.15rem 0;
                    line-height: 1.2;
                }
                .install-desc {
                    font-size: 0.75rem;
                    color: rgba(250, 248, 244, 0.6);
                    margin: 0;
                    line-height: 1.4;
                }
                .install-close {
                    background: none;
                    border: none;
                    color: rgba(250, 248, 244, 0.4);
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                    transition: color 0.2s;
                }
                .install-close:hover { color: #FAF8F4; }

                .install-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .btn-sm {
                    flex: 1;
                    min-height: 38px;
                    padding: 0.5rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.78rem;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.3rem;
                }
                .btn-install {
                    background: #8B7355;
                    color: #FAF8F4;
                    border: none;
                }
                .btn-install:hover {
                    background: #A98F6E;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
                }
                .btn-dismiss {
                    background: transparent;
                    color: rgba(250, 248, 244, 0.7);
                    border: 1px solid rgba(250, 248, 244, 0.15);
                }
                .btn-dismiss:hover {
                    color: #FAF8F4;
                    border-color: rgba(250, 248, 244, 0.4);
                }

                /* Phones: full-width sheet above the safe area, big tap targets. */
                @media (max-width: 480px) {
                    .install-wrapper {
                        left: 12px;
                        right: 12px;
                        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
                        width: auto;
                        max-width: none;
                        padding: 0.9rem;
                    }
            `}</style>
            <div className="install-header">
                <div className="install-icon-box">
                    <Smartphone size={18} />
                </div>
                <div>
                    <h3 className="install-title">Install App</h3>
                    <p className="install-desc">Add to home screen for quick access.</p>
                </div>
                <button className="install-close" onClick={handleDismiss} aria-label="Dismiss">
                    <X size={16} />
                </button>
            </div>

            <div className="install-actions">
                <button className="btn-sm btn-dismiss" onClick={handleDismiss}>
                    Not Now
                </button>
                <button className="btn-sm btn-install" onClick={handleInstall}>
                    <Download size={14} />
                    Install
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
