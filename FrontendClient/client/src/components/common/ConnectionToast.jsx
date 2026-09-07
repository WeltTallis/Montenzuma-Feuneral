import React, { useEffect, useRef, useState } from 'react';



const TOAST_CSS = `
  .ioc-toast{position:fixed;bottom:32px;right:32px;background:#18181b;color:#fff;
    padding:20px 24px;border-radius:16px;border:1px solid rgba(255,255,255,.1);
    box-shadow:0 25px 50px -12px rgba(0,0,0,.8),0 0 30px rgba(225,29,72,.35);
    display:flex;align-items:center;gap:18px;z-index:99999;max-width:400px;
    transform:translateY(120px) scale(.9);opacity:0;visibility:hidden;
    transition:transform .4s cubic-bezier(.175,.885,.32,1.275),opacity .3s ease,visibility .3s ease,
      box-shadow .4s ease,border-color .4s ease}
  .ioc-toast.ioc-toast-visible{transform:translateY(0) scale(1);opacity:1;visibility:visible}
  .ioc-toast.ioc-toast-connected{box-shadow:0 25px 50px -12px rgba(0,0,0,.8),0 0 30px rgba(16,185,129,.35);
    border-color:rgba(16,185,129,.3)}
  .ioc-toast.ioc-toast-connected .ioc-toast-icon{background:linear-gradient(135deg,#059669,#047857);
    box-shadow:0 0 20px rgba(16,185,129,.6)}
  .ioc-toast.ioc-toast-connected .ioc-live-badge{background-color:#34d399;
    box-shadow:0 0 10px #34d399,0 0 20px #059669;animation:ioc-pulse-green 1.5s infinite}
  .ioc-toast-icon{background:linear-gradient(135deg,#e11d48,#9f1239);width:48px;height:48px;border-radius:14px;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    box-shadow:0 0 20px rgba(225,29,72,.6);transition:background .4s ease,box-shadow .4s ease}
  .ioc-toast-svg{width:26px;height:26px;stroke:#fff;stroke-width:2.5;stroke-linecap:round;
    stroke-linejoin:round;fill:none}
  .ioc-toast-content{display:flex;flex-direction:column;gap:4px}
  .ioc-toast-content strong{font-size:15px;font-weight:700;color:#fff;letter-spacing:-.01em;
    display:flex;align-items:center;gap:8px}
  .ioc-toast-content p{margin:0;font-size:13px;color:#a1a1aa;line-height:1.4}
  .ioc-live-badge{display:inline-block;width:8px;height:8px;background-color:#fb7185;border-radius:50%;
    box-shadow:0 0 10px #fb7185,0 0 20px #e11d48;animation:ioc-pulse-red 1.5s infinite}
  @keyframes ioc-pulse-red{0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(251,113,133,.7)}
    70%{transform:scale(1);box-shadow:0 0 0 8px rgba(251,113,133,0)}
    100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(251,113,133,0)}}
  @keyframes ioc-pulse-green{0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(52,211,153,.7)}
    70%{transform:scale(1);box-shadow:0 0 0 8px rgba(52,211,153,0)}
    100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(52,211,153,0)}}
  @media(max-width:520px){.ioc-toast{left:16px;right:16px;bottom:16px;max-width:none}}
`;

const WIFI_OFF = (
  <svg className="ioc-toast-svg" viewBox="0 0 24 24">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const CHECK = (
  <svg className="ioc-toast-svg" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ConnectionToast = () => {
  const [visible, setVisible] = useState(false);
  const [online, setOnline] = useState(true);
  const hideRef = useRef(null);

  useEffect(() => {
    const show = (isOnline) => {
      if (hideRef.current) clearTimeout(hideRef.current);
      setOnline(isOnline);
      setVisible(true);
      if (isOnline) {
        hideRef.current = setTimeout(() => setVisible(false), 3500);
      }
    };

    const handleOnline = () => show(true);
    const handleOffline = () => show(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, []);

  return (
    <>
      <style>{TOAST_CSS}</style>
      <div
        className={`ioc-toast${visible ? ' ioc-toast-visible' : ''}${online ? ' ioc-toast-connected' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="ioc-toast-icon">{online ? CHECK : WIFI_OFF}</div>
        <div className="ioc-toast-content">
          <strong>
            <span className="ioc-live-badge" />
            {online ? 'Back Online' : 'Connection Lost'}
          </strong>
          <p>
            {online
              ? 'Connection successfully restored.'
              : 'You are currently offline. Retrying connection…'}
          </p>
        </div>
      </div>
    </>
  );
};

export default ConnectionToast;