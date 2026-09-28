import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone, MoreVertical, Share2, Plus } from '../../utils/icons/icons';

/* ══════════════════════════════════════════════════════════════════════════
   PWA install prompt — built to actually appear on phones.

   Three paths, because no single API covers every mobile browser:

     1. NATIVE — Chromium (Android Chrome / Edge / Brave / Samsung, desktop
        Chrome). The browser fires `beforeinstallprompt`; we capture it and
        replay it from our own Install button.
     2. iOS    — Safari / Chrome / Firefox on iOS NEVER fire that event, so the
        banner teaches the Share → "Add to Home Screen" gesture instead.
     3. MANUAL — a Chromium browser that has not (or will not) fire the event
        gets the browser-menu instructions instead.

   Paths 2 and 3 are why the previous banner looked "broken on mobile": it only
   rendered when `beforeinstallprompt` reached us, and that event is never
   fired on iOS and is a one-shot event on Android (it can also be withheld
   entirely when an installability criterion — icon size, manifest — is off).
   ══════════════════════════════════════════════════════════════════════════ */

// The user's choice is stored in a COOKIE (not sessionStorage/localStorage):
// logout clears the auth storage but NOT cookies, so once the user accepts
// (or dismisses) the banner it stays quiet — it must not pop up again every
// time they land on the page or log back in.
//
// v3 of the cookie name: the previous build could not show on iOS at all and
// was easy to miss on Android, so any stale "dismissed" cookie from it is
// deliberately ignored — the fixed prompt gets one clean showing again.
const COOKIE_NAME = 'pwa-install-choice-v3';   // 'accepted' | 'dismissed'
const ACCEPT_MAX_AGE = 60 * 60 * 24 * 365;     // accepted  → 1 year (effectively forever)
const DISMISS_MAX_AGE = 60 * 60 * 24 * 7;      // "Not now" → 7 days
const SHOW_DELAY_MS = 4 * 1000;                // after the native prompt is captured
const PROBE_DELAY_MS = 12 * 1000;              // no native event → manual instructions

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

/** iPhone / iPad (including iPadOS, which reports itself as a Mac). */
const isIosDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return ua.includes('Macintosh') && typeof document !== 'undefined' && 'ontouchend' in document;
};

/** A phone/tablet — the devices where a home-screen install is worth offering.
 *  Desktop visitors are never nagged with manual instructions. */
const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry/i.test(ua)) return true;
    try {
        return window.matchMedia('(any-pointer: coarse)').matches && window.innerWidth <= 1024;
    } catch {
        return false;
    }
};

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    // 'native' → we hold the browser's own prompt; 'ios' / 'manual' → instructions.
    const [kind, setKind] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [hideForever, setHideForever] = useState(false);
    const delayTimerRef = useRef(null);
    const probeTimerRef = useRef(null);

    useEffect(() => {
        // Already installed, or the user already accepted/dismissed → stay quiet.
        if (isStandalone() || getCookie(COOKIE_NAME)) {
            setHideForever(true);
            return undefined;
        }

        const clearTimers = () => {
            if (delayTimerRef.current) { clearTimeout(delayTimerRef.current); delayTimerRef.current = null; }
            if (probeTimerRef.current) { clearTimeout(probeTimerRef.current); probeTimerRef.current = null; }
        };

        const reveal = (nextKind) => {
            setKind((current) => {
                // Never downgrade an already-revealed native prompt.
                if (current === 'native') return current;
                return nextKind;
            });
            setShowPrompt(true);
        };

        // Shared handler — the event may arrive via the module-scope capture
        // above (if it fired before this effect ran) or live, right now.
        const handlePromptEvent = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (probeTimerRef.current) { clearTimeout(probeTimerRef.current); probeTimerRef.current = null; }
            // Do NOT pop up immediately on landing — wait a few seconds so it
            // is not in the user's face the second the page loads.
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            delayTimerRef.current = setTimeout(() => reveal('native'), SHOW_DELAY_MS);
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

        // ── Fallback: no native event on a phone → show how to install it ──
        // Covers iOS (never supported) and Android Chromium browsers where the
        // event is withheld (criteria not met yet, or it already fired once).
        if (isIosDevice() || isMobileDevice()) {
            probeTimerRef.current = setTimeout(() => {
                reveal(isIosDevice() ? 'ios' : 'manual');
            }, PROBE_DELAY_MS);
        }

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
        if (probeTimerRef.current) clearTimeout(probeTimerRef.current);
        // Dismissed → stay quiet for a week (survives logout & refreshes).
        setCookie(COOKIE_NAME, 'dismissed', DISMISS_MAX_AGE);
    };

    // Don't render if already installed, or the prompt should not show.
    if (hideForever || !showPrompt) return null;

    const native = kind === 'native' && !!deferredPrompt;
    const ios = kind === 'ios';
    const showSteps = ios || (kind === 'manual' && !native);

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

                .install-steps {
                    list-style: none;
                    margin: 0 0 1rem 0;
                    padding: 0.75rem;
                    border-radius: 8px;
                    background: rgba(250, 248, 244, 0.06);
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                }
                .install-step {
                    display: flex;
                    gap: 0.55rem;
                    align-items: flex-start;
                    font-size: 0.74rem;
                    line-height: 1.4;
                    color: rgba(250, 248, 244, 0.82);
                }
                .install-step-icon {
                    flex-shrink: 0;
                    color: #A98F6E;
                    margin-top: 1px;
                }
                .install-step strong { color: #FAF8F4; font-weight: 600; }

                .install-actions {
                    display: flex;
                    gap: 0.5rem;
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
                    .install-step { font-size: 0.78rem; }
                    .btn-sm { min-height: 44px; font-size: 0.82rem; }
                }
            `}</style>
            <div className="install-header">
                <div className="install-icon-box">
                    <Smartphone size={18} />
                </div>
                <div>
                    <h3 className="install-title">
                        {ios ? 'Add to Home Screen' : 'Install App'}
                    </h3>
                    <p className="install-desc">
                        {ios
                            ? 'Install Rest Point on this iPhone or iPad — no app store needed.'
                            : native
                                ? 'Add to home screen for quick access.'
                                : 'Install Rest Point straight from your browser menu.'}
                    </p>
                </div>
                <button className="install-close" onClick={handleDismiss} aria-label="Dismiss">
                    <X size={16} />
                </button>
            </div>

            {showSteps && (
                <ol className="install-steps">
                    <li className="install-step">
                        <span className="install-step-icon"><Share2 size={14} /></span>
                        <span>
                            {ios
                                ? <>Tap the <strong>Share</strong> icon in Safari&rsquo;s toolbar.</>
                                : <>Open the browser menu <strong>(⋮ / ⋯)</strong> at the top-right.</>}
                        </span>
                    </li>
                    <li className="install-step">
                        <span className="install-step-icon"><Plus size={14} /></span>
                        <span>
                            {ios
                                ? <>Scroll the share sheet and tap <strong>Add to Home Screen</strong>.</>
                                : <>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>}
                        </span>
                    </li>
                    <li className="install-step">
                        <span className="install-step-icon"><MoreVertical size={14} /></span>
                        <span>Confirm — Rest Point then opens like a normal app.</span>
                    </li>
                </ol>
            )}

            <div className="install-actions">
                <button className="btn-sm btn-dismiss" onClick={handleDismiss}>
                    Not Now
                </button>
                {native ? (
                    <button className="btn-sm btn-install" onClick={handleInstall}>
                        <Download size={14} />
                        Install
                    </button>
                ) : (
                    <button className="btn-sm btn-install" onClick={handleDismiss}>
                        <Download size={14} />
                        Got it
                    </button>
                )}
            </div>
        </div>
    );
};

export default InstallPrompt;
