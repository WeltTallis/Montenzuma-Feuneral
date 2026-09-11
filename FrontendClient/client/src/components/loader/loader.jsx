import React from "react";

/**
 * GlobalLoader — a single, consistent loader used across the whole app.
 *
 * PERFORMANCE: Uses pure CSS animations — no JavaScript animation loops,
 * no requestAnimationFrame, no setState. The browser compositor handles
 * everything, keeping the main thread free for rendering.
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
  const current = SIZE[size] || SIZE.medium;
  const sw = current.spinner;
  const activeColor = COLOR_MAP[color] || color;
  const ringWidth = Math.max(2, Math.round(sw * 0.058));

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


    backdropFilter: "none",
WebkitBackdropFilter: "none",
   
    fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
    ...style,
  };

  return (
    <div style={wrapperStyle} className={className}>
      {/* Dual ring spinner — pure CSS animation */}
      <div style={{ width: sw, height: sw, position: "relative" }}>
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
                style={{
                  width: "40%",
                  height: "100%",
                  background: activeColor,
                  borderRadius: "2px",
                  animation: "loader-slide 1.2s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: activeColor,
                opacity: 0.35,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "1px",
              }}
            >
              …
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
      @keyframes loader-slide {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(150%); }
        100% { transform: translateX(400%); }
      }
    `}
  </style>
);

// Alias kept for backwards compatibility with existing consumers.
export const CoolLoader = Loader;

export default Loader;
