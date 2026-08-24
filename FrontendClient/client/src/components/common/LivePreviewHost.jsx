import React, { useEffect } from 'react';

/**
 * LivePreviewHost — wraps a real product module so it can be showcased as a
 * "live preview" on the landing page bento grid (modules/landing/imageCard.jsx).
 *
 * It is rendered INSIDE a sandboxed <iframe> served from /preview/:module.
 * The iframe isolation keeps module side-effects fully contained:
 *   - ReceptionPortal's global bootstrap CSS reset never touches the site
 *   - failed API calls / error toasts stay inside the frame
 * On mount it flags the session as "preview mode" so api/axios.js forceLogout()
 * skips its hard redirect to /login when an unauthenticated visitor's request
 * 401s — the module simply shows its own empty state instead.
 */
export default function LivePreviewHost({ children }) {
  useEffect(() => {
    sessionStorage.setItem('rpPreviewMode', '1');
    return () => {
      sessionStorage.removeItem('rpPreviewMode');
    };
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#FAF8F4' }}>
      {children}
    </div>
  );
}
