import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getStroke } from 'perfect-freehand';
import './SignaturePad.css';

/* ═══════════════════════════════════════════════════════════════
   PROFESSIONAL SVG ICONS
   ════════════════════════════════════════════════════════════════ */

const Ic = ({ children, s = 16 }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const Icons = {
  pen: (
    <Ic s={18}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path d="M15 5l4 4" />
    </Ic>
  ),
  undo: (
    <Ic>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </Ic>
  ),
  clear: (
    <Ic>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Ic>
  ),
};

/* ═══════════════════════════════════════════════════════════════
   THE CURVE ENGINE — always on
   Raw pointer points are refit through cubic Hermite (Bézier)
   curves — the same mathematics fonts are built from — before
   ink is laid down. Every stroke flows like a glyph.
   ════════════════════════════════════════════════════════════════ */

const ENGINE = {
  streamline: 0.65,      /* exponential lag — removes hand jitter  */
  tension: 0.72,         /* Bézier curvature strength              */
  steps: 16,             /* resamples per segment                  */
  thinning: 0.62,        /* nib thick/thin contrast                */
  ffStreamline: 0.05,
  taperStart: 24,
  taperEnd: 36,
};

const STAMP_COLOR = '#a39d90';   /* faint mono timestamp */

/* ── pass 1: streamline (exponential lag removes hand jitter) ── */
function streamline(points, t) {
  if (points.length < 2 || t <= 0) return points.map(p => [...p]);
  const out = [[...points[0]]];
  let px = points[0][0], py = points[0][1], pp = points[0][2];
  const k = 1 - t;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    px += (p[0] - px) * k;
    py += (p[1] - py) * k;
    pp += (p[2] - pp) * k;
    out.push([px, py, pp]);
  }
  /* keep the true endpoint so the stroke ends where the pen lifted */
  out.push([...points[points.length - 1]]);
  return out;
}

/* ── pass 2: cubic Hermite (Bézier) refit + resampling ── */
function hermiteResample(points, tension, steps) {
  const n = points.length;
  if (n < 3) return points.map(p => [...p]);
  const out = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    const m1x = (p2[0] - p0[0]) * tension;
    const m1y = (p2[1] - p0[1]) * tension;
    const m2x = (p3[0] - p1[0]) * tension;
    const m2y = (p3[1] - p1[1]) * tension;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      out.push([
        h00 * p1[0] + h10 * m1x + h01 * p2[0] + h11 * m2x,
        h00 * p1[1] + h10 * m1y + h01 * p2[1] + h11 * m2y,
        p1[2] + (p2[2] - p1[2]) * t,   /* pressure interpolated along the curve */
      ]);
    }
  }
  out.push([...points[n - 1]]);
  return out;
}

function processPoints(points) {
  if (points.length < 3) return points.map(p => [...p]);
  return hermiteResample(streamline(points, ENGINE.streamline), ENGINE.tension, ENGINE.steps);
}

/* ── ink: perfect-freehand variable-width outline ── */
function drawStroke(ctx, stroke, color) {
  const pts = processPoints(stroke.points);
  if (!pts.length) return;

  const outline = getStroke(pts, {
    size: stroke.w * 3,
    thinning: ENGINE.thinning,
    smoothing: 0.5,
    streamline: ENGINE.ffStreamline,
    simulatePressure: true,
    start: { cap: true, taper: ENGINE.taperStart },
    end: { cap: true, taper: ENGINE.taperEnd },
  });

  if (outline.length > 1) {
    ctx.beginPath();
    ctx.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i][0], outline[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    return;
  }

  /* fallback: the processed points are already smooth — stroke them */
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.w * 2.2;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

/* ── sleek timestamp — under the line, right-aligned ── */
function drawTimestamp(ctx, w, h, signedAt) {
  if (!signedAt) return;
  const d = new Date(signedAt);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

  ctx.save();
  ctx.fillStyle = STAMP_COLOR;
  ctx.font = '500 9px "JetBrains Mono", monospace';
  try { ctx.letterSpacing = '1.5px'; } catch (e) { /* older browsers */ }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`SIGNED · ${date} · ${time}`, w - 28, h - 16);
  ctx.restore();
}

/* pointer point in CSS-pixel space (DPR handled via canvas transform) */
const getPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return [
    event.clientX - rect.left,
    event.clientY - rect.top,
    event.pressure > 0 ? event.pressure : 0.5,
  ];
};

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE PAD — full width · Bézier engine · ink blue
   ════════════════════════════════════════════════════════════════ */

const ReusableSignaturePad = forwardRef((props, ref) => {
  const {
    penColor = '#0f33e7',       /* ink — blue */
    penWidth = 2.5,             /* medium — locked default */
    backgroundColor = '#ffffff',
    placeholder = 'Sign here',
    disabled = false,
    showControls = true,
    showUndo = true,
    showClear = true,
    showTimestamp = true,
    onChange,
    canvasProps = {},
    className = '',
    style = {},
  } = props;

  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const strokesRef = useRef([]);        /* raw: [{ w, points:[[x,y,p],...] }] */
  const activeStrokeRef = useRef(null);
  const historyRef = useRef([]);
  const signedAtRef = useRef(null);     /* timestamp of last completed stroke */
  const sizeRef = useRef({ w: 0, h: 0 });

  const [isClient, setIsClient] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });   /* CSS px */

  useEffect(() => {
    setIsClient(true);
  }, []);

  /* ── measure stage (CSS px) + observe resizes ── */
  useEffect(() => {
    if (!isClient) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0 && (w !== sizeRef.current.w || h !== sizeRef.current.h)) {
        sizeRef.current = { w, h };
        setSize({ w, h });
      }
    };

    measure();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      if (containerRef.current) observer.observe(containerRef.current);
    }
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
      if (observer) observer.disconnect();
    };
  }, [isClient]);

  /* ── redraw: strokes (Bézier engine) + timestamp ── */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    const ctx = canvas.getContext('2d');
    const dpr = canvas.width / w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    strokesRef.current.forEach(s => drawStroke(ctx, s, penColor));
    if (activeStrokeRef.current) drawStroke(ctx, activeStrokeRef.current, penColor);
    if (showTimestamp) drawTimestamp(ctx, w, h, signedAtRef.current);
  }, [penColor, showTimestamp]);

  /* ── size the canvas at device resolution ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isClient || !size.w || !size.h) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    redraw();
  }, [size, isClient, redraw]);

  /* re-render once the mono font is actually loaded */
  useEffect(() => {
    if (!isClient || !document.fonts?.ready) return;
    document.fonts.ready.then(() => redraw()).catch(() => {});
  }, [isClient, redraw]);

  /* ── handlers ── */
  const handleBegin = useCallback(() => {
    if (disabled || !isClient) return;
    try {
      historyRef.current.push(
        strokesRef.current.map(s => ({ w: s.w, points: s.points.map(p => [...p]) }))
      );
    } catch (e) {
      console.warn('Signature Pad: Could not save history state', e);
    }
  }, [disabled, isClient]);

  const emitChange = useCallback(() => {
    if (!onChange) return;
    try {
      onChange(canvasRef.current?.toDataURL('image/png') ?? null);
    } catch (e) {
      console.warn('Signature Pad: Error generating data URL', e);
    }
  }, [onChange]);

  const handleEnd = useCallback(() => {
    if (disabled || !isClient) return;
    const stroke = activeStrokeRef.current;
    if (!stroke?.points.length) return;
    strokesRef.current.push(stroke);
    activeStrokeRef.current = null;
    signedAtRef.current = new Date();   /* stamp refreshes to the last stroke */
    redraw();
    setHasContent(true);
    emitChange();
  }, [disabled, isClient, redraw, emitChange]);

  const handleClear = useCallback(() => {
    if (!isClient) return;
    strokesRef.current = [];
    activeStrokeRef.current = null;
    historyRef.current = [];
    signedAtRef.current = null;
    redraw();
    setHasContent(false);
    if (onChange) onChange(null);
  }, [isClient, redraw, onChange]);

  const handleUndo = useCallback(() => {
    if (!isClient) return;
    if (historyRef.current.length === 0) {
      handleClear();
      return;
    }
    strokesRef.current = historyRef.current.pop();
    if (strokesRef.current.length === 0) signedAtRef.current = null;
    redraw();
    const empty = strokesRef.current.length === 0;
    setHasContent(!empty);
    emitChange();
  }, [handleClear, isClient, redraw, emitChange]);

  /* Ctrl/Cmd + Z */
  useEffect(() => {
    if (!isClient) return;
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && strokesRef.current.length) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isClient, handleUndo]);

  /* ── public API ── */
  useImperativeHandle(ref, () => ({
    clear: handleClear,
    undo: handleUndo,
    isEmpty: () => strokesRef.current.length === 0,
    toDataURL: mime => canvasRef.current?.toDataURL(mime || 'image/png') ?? null,
    toBlob: (cb, mime, q) => canvasRef.current?.toBlob(cb, mime, q),
    getTrimmedCanvas: () => canvasRef.current,
    getSignedAt: () => signedAtRef.current,
    fromDataURL: (url, opts) => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { w, h } = sizeRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = canvas.width / Math.max(w, 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(image, 0, 0, opts?.width || w, opts?.height || h);
        setHasContent(true);
        if (!signedAtRef.current) signedAtRef.current = new Date();
      };
      image.src = url;
    },
  }), [handleClear, handleUndo]);

  if (!isClient) {
    return (
      <div
        ref={wrapperRef}
        className={`sp-wrapper ${disabled ? 'sp-disabled' : ''} ${className}`}
        style={style}
      >
        <div className="sp-stage" ref={containerRef}>
          <div className="sp-line" aria-hidden="true" />
          <div className="sp-placeholder">
            {Icons.pen}
            <span>{placeholder}</span>
          </div>
        </div>
        {showControls && (
          <div className="sp-controls">
            {showUndo && (
              <button type="button" className="sp-btn sp-btn-secondary" disabled>
                {Icons.undo} Undo
              </button>
            )}
            {showClear && (
              <button type="button" className="sp-btn sp-btn-danger" disabled>
                {Icons.clear} Clear
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`sp-wrapper ${disabled ? 'sp-disabled' : ''} ${className}`}
      style={style}
    >
      {/* ── full-width signing stage ── */}
      <div className="sp-stage" ref={containerRef}>
        {!hasContent && (
          <div className="sp-placeholder" aria-hidden="true">
            {Icons.pen}
            <span>{placeholder}</span>
          </div>
        )}

        <div className="sp-line" aria-hidden="true" />

        <canvas
          {...canvasProps}
          ref={canvasRef}
          className="sp-canvas"
          style={{ backgroundColor, ...canvasProps.style }}
          onPointerDown={event => {
            if (disabled) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            handleBegin();
            activeStrokeRef.current = { w: penWidth, points: [getPoint(event, event.currentTarget)] };
            redraw();
          }}
          onPointerMove={event => {
            if (!activeStrokeRef.current) return;
            const p = getPoint(event, event.currentTarget);
            const last = activeStrokeRef.current.points[activeStrokeRef.current.points.length - 1];
            if (Math.abs(p[0] - last[0]) < .5 && Math.abs(p[1] - last[1]) < .5) return; /* dedupe jitter */
            activeStrokeRef.current.points.push(p);
            redraw();
          }}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
        />
      </div>

      {/* ── sleek controls ── */}
      {showControls && (
        <div className="sp-controls">
          {showUndo && (
            <button
              type="button"
              className="sp-btn sp-btn-secondary"
              onClick={handleUndo}
              disabled={!hasContent}
              title="Undo last stroke (Ctrl+Z)"
            >
              {Icons.undo} Undo
            </button>
          )}
          {showClear && (
            <button
              type="button"
              className="sp-btn sp-btn-danger"
              onClick={handleClear}
              disabled={!hasContent}
              title="Clear signature"
            >
              {Icons.clear} Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ReusableSignaturePad.displayName = 'ReusableSignaturePad';

export default ReusableSignaturePad;