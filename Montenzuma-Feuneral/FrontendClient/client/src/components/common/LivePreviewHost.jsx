import React, { Component, useEffect } from 'react';

class PreviewErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#FAF8F4', color: '#15171A', fontFamily: "'Space Grotesk', sans-serif" }}>
        <section style={{ maxWidth: 560, textAlign: 'center' }}>
          <p style={{ color: '#8B7355', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Preview unavailable</p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0.75rem 0 1rem' }}>Let us show you in person.</h1>
          <p style={{ color: '#6B6862', lineHeight: 1.7, marginBottom: '1.5rem' }}>This preview could not load right now. Your live Rest Point workspace is still ready for a guided walkthrough.</p>
          <a href="/" style={{ display: 'inline-block', padding: '0.85rem 1.4rem', borderRadius: 8, background: '#15171A', color: '#FAF8F4', textDecoration: 'none', fontWeight: 600 }}>Back to Rest Point</a>
        </section>
      </main>
    );
  }
}

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
    <PreviewErrorBoundary>
      <div style={{ width: '100%', minHeight: '100vh', background: '#FAF8F4' }}>
        {children}
      </div>
    </PreviewErrorBoundary>
  );
}
