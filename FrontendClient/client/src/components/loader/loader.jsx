import React, { useEffect, useRef } from "react";

/**
 * GlobalLoader — a single, consistent loader used across the whole app.
 *
 * It reproduces exactly the Rest Point loader design:
 *   • a dual counter-rotating ring spinner
 *   • an uppercase "Loading" caption
 *   • an animated progress bar
 *   • a live percentage that eases in/out (slow start → fast middle → slow end)
 *
 * Backwards compatible with the previous shared loader API:
 *   <Loader text="Loading…" size="medium|small|large|xlarge" color="primary|#" overlay fullScreen />
 * `CoolLoader` and `GlobalLoaderStyles` named exports are also provided.
 */
const SIZE = {
  small: { spinner: 34 },
  medium: { spinner: 52 },
  large: { spinner: 72 },
  xlarge: { spinner: 92 },
};

// Named colors from the previous shared loader (backwards compatible).
const COLOR_MAP = {
  primary: "#0e3345",
  brass: "#A98F6E",
  verdigris: "#4D6359",
  accent: "#C77B5E",
  ink: "#15171A",
  bone: "#FAF8F4",
  secondary: "#4D6359",
};

const Loader = ({
  text = "Loading",
  color = "#0e3345",
  size = "medium",
  overlay = true,
  fullScreen = true,
  className = "",
  showProgress = true,
  autoRestart = true,
  style,
}) => {
  const fillRef = useRef(null);
  const pctRef = useRef(null);
  const current = SIZE[size] || SIZE.medium;
  const sw = current.spinner;
  // Resolve named colors, fall back to a literal hex/rgb when not recognised.
  const activeColor = COLOR_MAP[color] || color;
  // Keep border proportionally thicker on larger spinners (matching the 3px @52px reference).
  const ringWidth = Math.max(2, Math.round(sw * 0.058));

  // Animated progress — same easing program as the reference loader.
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let p = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      // Ease-in-out feel: slow start, fast middle, slow end.
      const speed = p < 20 ? 0.6 : p < 60 ? 1.2 : p < 85 ? 0.7 : 0.3;
      p = Math.min(100, p + speed + Math.random() * 0.4);
      const r = Math.round(p);
      if (fillRef.current) fillRef.current.style.width = r + "%";
      if (pctRef.current) pctRef.current.textContent = r + "%";

      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else if (autoRestart) {
        timer = setTimeout(() => {
          if (!stopped) {
            p = 0;
            raf = requestAnimationFrame(tick);
          }
        }, 1400);
      }
    };

    timer = setTimeout(() => {
      if (!stopped) raf = requestAnimationFrame(tick);
    }, 400);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [autoRestart]);

  const wrapperStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "36px",
    boxSizing: "border-box",
    zIndex: 9999,
    position: fullScreen ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: overlay ? "rgba(249, 250, 251, 0.6)" : "transparent",
    backdropFilter: overlay ? "blur(6px)" : "none",
    WebkitBackdropFilter: overlay ? "blur(6px)" : "none",
    fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
    ...style,
  };

  return (
    <div style={wrapperStyle} className={className}>
      {/* Dual ring spinner */}
      <div style={{ width: sw, height: sw, position: "relative" }}>
        {/* Outer faint ring — counter-rotates */}
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "1.5px solid transparent",
            borderBottomColor: "rgba(14, 51, 69, 0.15)",
            animation: "rpspin-reverse 2.4s linear infinite",
          }}
        />
        {/* Main spinning arc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${ringWidth}px solid rgba(14, 51, 69, 0.08)`,
            borderTopColor: activeColor,
            animation: "rpspin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 300,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: activeColor,
            opacity: 0.5,
          }}
        >
          {text}
        </span>

        {showProgress && (
          <>
            <div
              style={{
                width: "120px",
                height: "2px",
                background: "rgba(14, 51, 69, 0.08)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                ref={fillRef}
                style={{
                  width: "0%",
                  height: "100%",
                  background: activeColor,
                  borderRadius: "2px",
                  transition: "width 0.25s ease",
                }}
              />
            </div>
            <span
              ref={pctRef}
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: activeColor,
                opacity: 0.35,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "1px",
              }}
            >
              0%
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// Global keyframe animations required by the loader.
export const GlobalLoaderStyles = () => (
  <style>
    {`
      @keyframes rpspin {
        to { transform: rotate(360deg); }
      }
      @keyframes rpspin-reverse {
        to { transform: rotate(-360deg); }
      }
    `}
  </style>
);

// Alias kept for backwards compatibility with existing consumers.
export const CoolLoader = Loader;

export default Loader;
