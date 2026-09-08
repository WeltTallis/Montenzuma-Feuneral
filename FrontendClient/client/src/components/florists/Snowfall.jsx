// Snowfall.jsx
// ── Flower Snow — gently drifting petals (self-contained styles) ──────────────
import { useMemo } from 'react'

const SNOWFALL_CSS = `
.snowfall { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 5; }
.snowflake {
  position: absolute; top: -6vh; left: var(--x, 50%);
  width: var(--s, 12px); height: var(--s, 12px);
  opacity: 0; will-change: transform, opacity;
  animation: petalFall var(--d, 16s) linear infinite;
  animation-delay: var(--dl, 0s);
}
.snowflake svg {
  width: 100%; height: 100%; display: block;
  animation: petalSway var(--sw, 3s) ease-in-out infinite alternate;
}
@keyframes petalFall {
  0%   { transform: translate3d(0, -8vh, 0); opacity: 0; }
  10%  { opacity: var(--po, 0.5); }
  88%  { opacity: var(--po, 0.5); }
  100% { transform: translate3d(var(--px, 24px), 108vh, 0); opacity: 0; }
}
@keyframes petalSway {
  from { transform: translateX(-9px) rotate(-26deg); }
  to   { transform: translateX(9px) rotate(30deg); }
}
@media (prefers-reduced-motion: reduce) { .snowfall { display: none; } }
`

const PETAL_COLORS = ['#FDF6EE', '#F3D9C8', '#E9C9C9', '#FFFFFF', '#DCE8D8']

export default function Snowfall({ count = 14, opacity = 0.5, colors = PETAL_COLORS }) {
  const flakes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() * 100).toFixed(2) + '%',
    s: Math.round(8 + Math.random() * 12),
    d: (11 + Math.random() * 16).toFixed(2) + 's',
    dl: (-Math.random() * 26).toFixed(2) + 's',
    px: Math.round(Math.random() * 60 - 30) + 'px',
    sw: (2.4 + Math.random() * 2.6).toFixed(2) + 's',
    po: (opacity * (0.45 + Math.random() * 0.55)).toFixed(2),
    c: colors[i % colors.length],
  })), [count, opacity, colors])

  return (
    <div className="snowfall" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: SNOWFALL_CSS }} />
      {flakes.map(f => (
        <span
          key={f.id}
          className="snowflake"
          style={{ '--x': f.x, '--s': f.s + 'px', '--d': f.d, '--dl': f.dl, '--px': f.px, '--po': f.po, '--sw': f.sw }}
        >
          <svg viewBox="0 0 20 20"><path d="M10 1C15 5 16 12 10 19 4 12 5 5 10 1Z" fill={f.c} /></svg>
        </span>
      ))}
    </div>
  )
}