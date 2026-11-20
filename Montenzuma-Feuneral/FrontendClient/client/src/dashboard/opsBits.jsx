import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { careCfg, daysInCare, fmtDate, initials, todayKey } from "./opsData";

/* ══════════════════════════════════════════════════════════════════════════
   Shared presentational primitives used by every dashboard view.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── tooltips ───────────────────────────────────────────────────────────── */

/** Attach to any element to give it the reference design's hover card.
 *  Spread onto the element:  <div {...tipProps("Deceased", "12 cases", "Click")}> */
export const tipProps = (title, val, sub) => ({
  "data-tip-t": title || "",
  "data-tip-v": val || "",
  "data-tip-s": sub || "",
});

/**
 * Document-level hover tracking (mirrors the reference's single mousemove
 * listener). Updates are capped to one per animation frame.
 */
export function useTooltip() {
  const [tip, setTip] = useState(null);
  const rafRef = useRef(0);
  const pending = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const el = e.target && e.target.closest ? e.target.closest("[data-tip-t]") : null;
      if (!el) {
        pending.current = null;
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
        setTip((p) => (p ? null : p));
        return;
      }
      pending.current = {
        t: el.getAttribute("data-tip-t") || "",
        v: el.getAttribute("data-tip-v") || "",
        s: el.getAttribute("data-tip-s") || "",
        x: e.clientX + 14,
        y: e.clientY + 16,
      };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (pending.current) setTip(pending.current);
      });
    };
    const onLeave = () => setTip(null);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return tip;
}

/** The floating card itself — clamps to the viewport after every render. */
export function TipBox({ tip }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    let x = tip.x;
    let y = tip.y;
    if (x + r.width > window.innerWidth - 8) x = tip.x - r.width - 26;
    if (y + r.height > window.innerHeight - 8) y = tip.y - r.height - 26;
    el.style.left = `${Math.max(8, x)}px`;
    el.style.top = `${Math.max(8, y)}px`;
  });

  if (!tip) return null;
  return (
    <div ref={ref} className="tip" style={{ display: "block", left: tip.x, top: tip.y }}>
      {tip.t ? <b>{tip.t}</b> : null}
      {tip.v ? <>{tip.t ? " — " : ""}{tip.v}</> : null}
      {tip.s ? <span className="tsub">{tip.s}</span> : null}
    </div>
  );
}

/* ── case chips ─────────────────────────────────────────────────────────── */

/** Initials tile tinted by the case's current care state. */
export function Avatar({ c }) {
  const cfg = careCfg(c);
  return (
    <span className="mav" style={{ background: cfg.bg, color: cfg.c }}>
      {initials(c.name)}
    </span>
  );
}

/** Status dot + label, with the "days in care" line underneath. */
export function StatusChip({ c, sub }) {
  const cfg = careCfg(c);
  const d = daysInCare(c);
  const text = sub !== undefined
    ? sub
    : c.admDate && c.admDate > todayKey()
      ? `from ${fmtDate(c.admDate)}`
      : d != null
        ? `${d} days in care`
        : "";
  return (
    <>
      <span className="st" style={{ color: cfg.c }}>
        <i style={{ background: cfg.c }} />
        {cfg.label}
      </span>
      {text ? <div className="stdays">{text}</div> : null}
    </>
  );
}

/* ── animated counters ──────────────────────────────────────────────────── */

/** Eases a figure up from zero whenever the value changes. */
export function CountUp({ value }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{n}</>;
}

/** Renders a calcStats insight: plain strings plus `{ b }` bold segments. */
export function InsightText({ parts = [] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string"
          ? <span key={i}>{part}</span>
          : <b key={i}>{part.b}</b>
      )}
    </>
  );
}
