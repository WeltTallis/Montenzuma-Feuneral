import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
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
  const sigCanvas = useRef(null);
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
      const w = Math.floor(rect.width) || 800;
      const h = Math.floor(rect.height) || 400;

      if (w > 0 && h > 0 && (w !== canvasSize.width || h !== canvasSize.height)) {
        let existingData = null;
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          try {
            existingData = sigCanvas.current.toDataURL();
          } catch (e) { /* ignore */ }
        }

        setCanvasSize({ width: w, height: h });

        if (existingData) {
          requestAnimationFrame(() => {
            try {
              sigCanvas.current?.fromDataURL(existingData, {
                width: w,
                height: h,
                ratio: 1,
              });
            } catch (e) { /* ignore */ }
          });
        }
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

  useImperativeHandle(ref, () => ({
    clear: handleClear,
    isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
    toDataURL: (mime, includeBg) => sigCanvas.current?.toDataURL(mime, includeBg) ?? null,
    toBlob: (cb, mime, q) => sigCanvas.current?.toBlob(cb, mime, q),
    getTrimmedCanvas: () => sigCanvas.current?.getTrimmedCanvas(),
    fromDataURL: (url, opts) => {
      if (sigCanvas.current) {
        sigCanvas.current.fromDataURL(url, opts);
        setHasContent(true);
      }
    },
    undo: handleUndo,
  }));

  const handleBegin = useCallback(() => {
    if (disabled || !isClient) return;
    try {
      const currentData = sigCanvas.current?.toDataURL();
      if (currentData) {
        historyRef.current.push(currentData);
      }
    } catch (e) {
      console.warn('Signature Pad: Could not save history state', e);
    }
  }, [disabled, isClient]);

  const handleEnd = useCallback(() => {
    if (disabled || !isClient) return;
    setHasContent(true);
    if (onChange) {
      try {
        const data = sigCanvas.current?.toDataURL() ?? null;
        onChange(data);
      } catch (e) {
        console.warn('Signature Pad: Error generating data URL', e);
      }
    }
  }, [disabled, onChange, isClient]);

  const handleClear = useCallback(() => {
    if (!isClient) return;
    sigCanvas.current?.clear();
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
    const prevState = historyRef.current.pop();
    if (sigCanvas.current) {
      sigCanvas.current.fromDataURL(prevState, {
        width: sigCanvas.current.getCanvas().width,
        height: sigCanvas.current.getCanvas().height,
        ratio: 1,
      });

      if (sigCanvas.current.isEmpty()) {
        setHasContent(false);
        if (onChange) onChange(null);
      } else {
        if (onChange) onChange(prevState);
      }
    }
  }, [handleClear, onChange, isClient]);

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

      {/* Canvas Area - ULTRA SMOOTH EXECUTIVE SETTINGS */}
      <div className="sp-canvas-container" ref={canvasContainerRef}>
        {!hasContent && (
          <div className="sp-placeholder">
            {Icons.pen}
            <span>{placeholder}</span>
          </div>
        )}

        <ReactSignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'sp-canvas',
            ...canvasProps,
          }}
          penColor={penColor}
          dotSize={penWidth}
          // ─── ULTRA SMOOTH EXECUTIVE SETTINGS ───
          minWidth={penWidth * 0.3}       // Very thin at high speed
          maxWidth={penWidth * 2.0}       // Thick at slow speed (executive feel)
          velocityFilterWeight={0.35}     // Highly responsive = buttery smooth
          backgroundColor={backgroundColor}
          onBegin={handleBegin}
          onEnd={handleEnd}
          throttle={5}                   // Maximum smoothness
          clearOnResize={false}
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