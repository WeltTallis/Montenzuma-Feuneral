import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
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

const getPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top, event.pressure > 0 ? event.pressure : 0.5];
};

const drawStroke = (ctx, points, options) => {
  const outline = getStroke(points, options);
  if (outline.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);
  outline.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fill();
};

/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE-LEVEL SIGNATURE PAD - ULTRA SMOOTH
   ════════════════════════════════════════════════════════════════ */

const ReusableSignaturePad = forwardRef((props, ref) => {
  const {
    penColor = '#1a3a6b',
    penWidth = 2.5,
    backgroundColor = '#ffffff',
    placeholder = 'Sign here',
    disabled = false,
    showControls = true,
    showUndo = true,
    showClear = true,
    onChange,
    canvasProps = {},
    className = '',
    style = {},
  } = props;

  const wrapperRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const activeStrokeRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const historyRef = useRef([]);
  const [hasContent, setHasContent] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (!isClient) return;

   const measure = () => {
  if (!canvasContainerRef.current) return;
  const rect = canvasContainerRef.current.getBoundingClientRect();
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const w = Math.floor(rect.width) || 800;
  const h = Math.floor(rect.height) || 400;

  if (w > 0 && h > 0 && (w !== canvasSize.width || h !== canvasSize.height)) {
    setCanvasSize({ width: w * dpr, height: h * dpr });
    // Note: You'll also need to ensure the CSS width/height remains w/h
    // The CSS provided above uses width: 100%; height: 100%; which handles this automatically!
  }
};

    measure();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measure());
      if (canvasContainerRef.current) {
        observer.observe(canvasContainerRef.current);
      }
    }

    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
      if (observer) observer.disconnect();
    };
  }, [canvasSize.width, canvasSize.height, isClient]);

  const strokeOptions = {
    size: penWidth * 2.2,
    thinning: 0.55,
    smoothing: 0.85,
    streamline: 0.7,
    simulatePressure: true,
    start: { cap: true },
    end: { cap: true },
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    strokesRef.current.forEach(stroke => drawStroke(ctx, stroke, strokeOptions));
    if (activeStrokeRef.current) drawStroke(ctx, activeStrokeRef.current, strokeOptions);
  }, [penColor, penWidth]);

  useEffect(() => {
    redraw();
  }, [canvasSize, redraw]);

  const handleBegin = useCallback(() => {
    if (disabled || !isClient) return;
    try {
      historyRef.current.push(strokesRef.current.map(stroke => stroke.map(point => [...point])));
    } catch (e) {
      console.warn('Signature Pad: Could not save history state', e);
    }
  }, [disabled, isClient]);

  const handleEnd = useCallback(() => {
    if (disabled || !isClient) return;
    const stroke = activeStrokeRef.current;
    if (!stroke?.length) return;
    strokesRef.current.push(stroke);
    activeStrokeRef.current = null;
    redraw();
    setHasContent(true);
    if (onChange) {
      try {
        const data = canvasRef.current?.toDataURL() ?? null;
        onChange(data);
      } catch (e) {
        console.warn('Signature Pad: Error generating data URL', e);
      }
    }
  }, [disabled, onChange, isClient]);

  const handleClear = useCallback(() => {
    if (!isClient) return;
    strokesRef.current = [];
    activeStrokeRef.current = null;
    redraw();
    historyRef.current = [];
    setHasContent(false);
    if (onChange) onChange(null);
  }, [onChange, isClient]);

  const handleUndo = useCallback(() => {
    if (!isClient) return;
    if (historyRef.current.length === 0) {
      handleClear();
      return;
    }
    strokesRef.current = historyRef.current.pop();
    redraw();
    const empty = strokesRef.current.length === 0;
    setHasContent(!empty);
    if (onChange) onChange(empty ? null : canvasRef.current?.toDataURL() ?? null);
  }, [handleClear, onChange, isClient]);

  useImperativeHandle(ref, () => ({
    clear: handleClear,
    isEmpty: () => strokesRef.current.length === 0,
    toDataURL: mime => canvasRef.current?.toDataURL(mime || 'image/png') ?? null,
    toBlob: (cb, mime, q) => canvasRef.current?.toBlob(cb, mime, q),
    getTrimmedCanvas: () => canvasRef.current,
    fromDataURL: (url, opts) => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, opts?.width || canvas.width, opts?.height || canvas.height);
        setHasContent(true);
      };
      image.src = url;
    },
    undo: handleUndo,
  }), [handleClear, handleUndo]);

  if (!isClient) {
    return (
      <div
        ref={wrapperRef}
        className={`sp-wrapper ${disabled ? 'sp-disabled' : ''} ${className}`}
        style={style}
      >
        <div className="sp-canvas-container" ref={canvasContainerRef}>
          <div className="sp-placeholder">
            {Icons.pen}
            <span>{placeholder}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`sp-wrapper ${disabled ? 'sp-disabled' : ''} ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-label">
          {Icons.pen}
          <span>Signature</span>
        </div>
        <div className="sp-header-hint">Draw above</div>
      </div>

      {/* Canvas Area - Perfect Freehand rendering */}
      <div className="sp-canvas-container" ref={canvasContainerRef}>
        {!hasContent && (
          <div className="sp-placeholder">
            {Icons.pen}
            <span>{placeholder}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="sp-canvas"
          style={{ backgroundColor, ...canvasProps.style }}
          onPointerDown={event => {
            if (disabled) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            handleBegin();
            activeStrokeRef.current = [getPoint(event, event.currentTarget)];
            redraw();
          }}
          onPointerMove={event => {
            if (!activeStrokeRef.current) return;
            activeStrokeRef.current.push(getPoint(event, event.currentTarget));
            redraw();
          }}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
        />
      </div>

      {/* Bottom Label */}
      <div className="sp-line-label">
        <span>Signature</span>
        <span>—</span>
      </div>

      {/* Controls */}
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