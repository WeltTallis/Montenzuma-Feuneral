import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

/**
 * FOR FUNERAL DIRECTORS — "The Confirmation Moment"
 * -------------------------------------------------
 * Landing-page section: the candle-vs-green-tick live demo, rebuilt in the
 * platform's design language (Fraunces / Inter / JetBrains Mono, bone,
 * verdigris, brass, terracotta). The canvas candle engine is a faithful port
 * of the standalone demo — same physics, same interactions (cursor wind,
 * tap-to-flare, replay), mounted only while the "with your software" pane
 * is on screen.
 */

const DEMO = { name: 'Margaret Anne Whitlock', born: 1938, passed: 2025, age: 'eighty-seven' };
const firstName = (f) => f.trim().split(/\s+/)[0];
const possessive = (n) => { n = n.trim(); return /s$/i.test(n) ? n + '’' : n + '’s'; };

/* ── scroll reveal (same pattern as the rest of the landing page) ── */
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}
const Rv = ({ children, delay = 0, style = {} }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(26px)',
      transition: `opacity 0.9s cubic-bezier(0.22,0.7,0.25,1) ${delay}ms, transform 0.9s cubic-bezier(0.22,0.7,0.25,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
};

/* ── scoped styles — vars live on .dm-section, never on :root ── */
const DirectorsGlobalStyle = createGlobalStyle`
.dm-section{position:relative;background:var(--dm-bone,#FAF8F4);color:#1C1A17;overflow:hidden;
  padding:clamp(4rem,8vw,7.5rem) 0}
.dm-section::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.035;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.dm-section{--dm-ink:#0A0B0D;--dm-bone:#FAF8F4;--dm-bone2:#F3EFE6;--dm-brass:#8B7355;--dm-brassL:#A98F6E;
  --dm-verd:#3D4F47;--dm-verdD:#2E3F37;--dm-accent:#C77B5E;--dm-line:#E3DDD0;--dm-gray:#8A8780;
  --dm-night:#0C0F0D;--dm-hair:rgba(250,248,244,.14);
  --dm-serif:'Fraunces',Georgia,serif;--dm-sans:'Inter','Helvetica Neue',sans-serif;--dm-mono:'JetBrains Mono',monospace}
.dm-section ::selection{background:rgba(199,123,94,.25)}
.dm-wrap{position:relative;z-index:2;max-width:1060px;margin:0 auto;padding:0 clamp(1.5rem,4vw,2.5rem)}
.dm-kicker{display:inline-flex;align-items:center;gap:.6rem;font-family:var(--dm-mono);font-size:.7rem;
  letter-spacing:.2em;text-transform:uppercase;color:var(--dm-accent);font-weight:600}
.dm-kicker::before{content:'';width:24px;height:1px;background:var(--dm-accent)}
.dm-title{margin-top:1.4rem;font-family:var(--dm-serif);font-weight:300;
  font-size:clamp(2.4rem,5vw,4.2rem);line-height:1.04;letter-spacing:-.03em;color:var(--dm-ink);max-width:21ch}
.dm-title em{font-style:italic;color:var(--dm-accent)}
.dm-sub{margin-top:1.6rem;font-family:var(--dm-sans);font-size:1.08rem;line-height:1.85;
  color:rgba(0,0,0,.62);max-width:58ch}

/* ── the demo stage ── */
.dm-stage{margin-top:3.2rem}
.dm-seg{display:inline-flex;border:1px solid var(--dm-line);border-radius:4px;overflow:hidden;background:#fff}
.dm-segbtn{padding:.85rem 1.4rem;background:transparent;border:0;cursor:pointer;color:var(--dm-gray);
  font-family:var(--dm-mono);font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:.25s}
.dm-segbtn+.dm-segbtn{border-left:1px solid var(--dm-line)}
.dm-segbtn.on{background:var(--dm-verd);color:var(--dm-bone)}
.dm-segbtn:not(.on):hover{color:var(--dm-ink)}
.dm-browser{margin-top:1.4rem;border:1px solid var(--dm-line);border-radius:10px;overflow:hidden;
  background:#fff;box-shadow:0 24px 60px -30px rgba(28,26,23,.35)}
.dm-chrome{display:flex;align-items:center;gap:1rem;padding:.7rem 1rem;background:var(--dm-night);border-bottom:1px solid var(--dm-hair)}
.dm-dots{display:flex;gap:6px}
.dm-dots i{width:9px;height:9px;border-radius:50%;background:#39423A;display:block}
.dm-url{flex:1;max-width:420px;background:#080908;border:1px solid var(--dm-hair);border-radius:5px;
  padding:.45rem .9rem;font-family:var(--dm-mono);font-size:.68rem;color:rgba(250,248,244,.55);letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dm-screen{position:relative;min-height:540px}

/* the "typical software" pane — deliberately bland */
.dm-pane{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:2rem}
.dm-typical{background:#f4f4f4;color:#444;font-family:Arial,Helvetica,sans-serif}
.dm-tcard{text-align:center;max-width:340px}
.dm-tcheck{width:52px;height:52px;margin:0 auto;border-radius:50%;background:#4caf50;display:grid;place-items:center}
.dm-tcheck svg{width:24px;height:24px;stroke:#fff;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
.dm-tcard h4{margin-top:1.1rem;font:700 19px/1.3 Arial;color:#333}
.dm-tcard p{margin-top:.7rem;font:400 13px/1.65 Arial;color:#888}
.dm-tref{margin-top:.6rem;font:400 12px/1.6 Arial;color:#aaa}
.dm-tbtn{margin-top:1.2rem;display:inline-block;padding:.6rem 1.1rem;border:1px solid #ccc;border-radius:3px;
  background:#eee;color:#999;font:400 12px/1 Arial;cursor:default}
.dm-tpowered{margin-top:1.6rem;font:400 10px/1 Arial;color:#c2c2c2;letter-spacing:.04em}
/* the "with your software" pane — the candle */
.dm-ours{background:var(--dm-night);flex-direction:column;overflow:hidden}
.dm-ours::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.35;mix-blend-mode:soft-light;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")}
.dm-candle{width:190px;aspect-ratio:300/430;display:block;margin-bottom:-9px;cursor:pointer;touch-action:pan-y;user-select:none}
.dm-oeyebrow{font-family:var(--dm-mono);font-size:.6rem;font-weight:600;letter-spacing:.32em;color:var(--dm-brassL);text-transform:uppercase}
.dm-oname{margin-top:.7rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1.7rem,3.6vw,2.3rem);line-height:1.1;color:var(--dm-bone)}
.dm-odates{margin-top:.6rem;font-family:var(--dm-mono);font-size:.62rem;font-weight:600;letter-spacing:.26em;color:rgba(250,248,244,.55)}
.domsg{margin-top:1rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1rem,2.2vw,1.3rem);line-height:1.35;color:var(--dm-brassL);max-width:22ch;text-align:center}
.dm-orv{opacity:0;transform:translateY(14px);filter:blur(5px);
  transition:opacity .9s ease,transform .9s cubic-bezier(.22,.7,.25,1),filter .9s ease}
.dm-orv.in{opacity:1;transform:none;filter:none}

.dm-under{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.1rem;flex-wrap:wrap}
.dm-note{font-family:var(--dm-serif);font-style:italic;font-weight:500;font-size:.9rem;line-height:1.6;color:var(--dm-gray)}
.dm-replay{display:inline-flex;align-items:center;gap:.55rem;padding:.65rem 1.1rem;background:transparent;
  border:1px solid var(--dm-line);border-radius:4px;color:#1C1A17;cursor:pointer;
  font-family:var(--dm-mono);font-size:.64rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:.25s}
.dm-replay:hover{border-color:var(--dm-brass);color:var(--dm-brass)}
.dm-replay svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round}

/* ── selling points ── */
.dm-points{margin-top:4.2rem;display:grid;grid-template-columns:repeat(3,1fr);gap:2.2rem}
.dm-pt{border-top:1px solid var(--dm-line);padding-top:1.5rem}
.dm-pt svg{width:20px;height:20px;stroke:var(--dm-brass);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.dm-pt h5{margin-top:1rem;font-family:var(--dm-mono);font-size:.7rem;font-weight:600;
  letter-spacing:.16em;text-transform:uppercase;color:var(--dm-ink)}
.dm-pt p{margin-top:.6rem;font-family:var(--dm-sans);font-size:.92rem;line-height:1.75;color:rgba(0,0,0,.6)}

/* ── CTA + closer ── */
.dm-cta{margin-top:4.4rem;display:flex;gap:.9rem;flex-wrap:wrap;align-items:center}
.dm-btn{display:inline-flex;align-items:center;gap:.6rem;padding:1.05rem 1.6rem;border-radius:4px;cursor:pointer;
  font-family:var(--dm-mono);font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  text-decoration:none;border:1px solid transparent;transition:.25s}
.dm-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s}
.dm-btn:hover svg{transform:translateX(3px)}
.dm-solid{background:var(--dm-verd);color:var(--dm-bone)}
.dm-solid:hover{background:var(--dm-verdD)}
.dm-ghost{color:var(--dm-ink);border-color:var(--dm-line);background:transparent}
.dm-ghost:hover{border-color:var(--dm-gray)}
.dm-closer{margin-top:3.4rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1.15rem,2.6vw,1.55rem);line-height:1.5;color:rgba(0,0,0,.62);max-width:44ch}
.dm-closer b{color:var(--dm-brass);font-weight:500}

@media(max-width:760px){
  .dm-points{grid-template-columns:1fr;gap:1.6rem}
  .dm-screen{min-height:600px}
  .dm-under{justify-content:center}
}
@media(prefers-reduced-motion:reduce){
  .dm-orv,.dm-orv.in{transition:none;transform:none;filter:none;opacity:1}
}
`;
/* ═══════════════════════════════════════════════
   THE CANDLE ENGINE — faithful port of the demo.
   Module-level helpers; mutable state travels in `st`.
   ═══════════════════════════════════════════════ */
const TAU = Math.PI * 2;
const LW = 300, LH = 430, CX = 150, TOP = 238, BOT = 372, HW = 43, WICK_TOP = 226;

const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); };
function drip(g, x, y, len, w) {
  g.beginPath(); g.moveTo(x - w / 2, y);
  g.quadraticCurveTo(x - w / 2, y + len * .72, x, y + len);
  g.quadraticCurveTo(x + w / 2, y + len * .72, x + w / 2, y);
  g.quadraticCurveTo(x, y + 2.5, x - w / 2, y); g.fill();
}
function renderStatic(cw, ch, scl) {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'); g.setTransform(scl, 0, 0, scl, 0, 0);
  g.fillStyle = '#221a10'; ell(g, CX, 375, 80, 14); g.fill();
  g.strokeStyle = 'rgba(190,146,80,.55)'; g.lineWidth = 1.6; ell(g, CX, 375, 80, 14); g.stroke();
  g.fillStyle = '#120d07'; ell(g, CX, 373, 70, 10.5); g.fill();
  g.fillStyle = 'rgba(0,0,0,.6)'; ell(g, CX, 371, 46, 7); g.fill();
  const grd = g.createLinearGradient(CX - HW, 0, CX + HW, 0);
  grd.addColorStop(0, '#c9b48d'); grd.addColorStop(.16, '#ecdcb9'); grd.addColorStop(.5, '#f6ebd1');
  grd.addColorStop(.84, '#e3d0a9'); grd.addColorStop(1, '#bda87f');
  g.fillStyle = grd; g.beginPath();
  g.moveTo(CX - HW, TOP + 8); g.lineTo(CX - HW, BOT - 6); g.quadraticCurveTo(CX - HW, BOT, CX - HW + 6, BOT);
  g.lineTo(CX + HW - 6, BOT); g.quadraticCurveTo(CX + HW, BOT, CX + HW, BOT - 6); g.lineTo(CX + HW, TOP + 7);
  g.bezierCurveTo(CX + HW - 10, TOP + 2, CX + 24, TOP + 11, CX + 6, TOP + 3);
  g.bezierCurveTo(CX - 6, TOP - 3, CX - 22, TOP + 10, CX - HW + 2, TOP + 3);
  g.closePath(); g.fill();
  drip(g, CX - 33, TOP + 3, 20, 7); drip(g, CX + 30, TOP + 2, 12, 6); drip(g, CX - 10, TOP + 5, 8, 5);
  g.fillStyle = '#dcc79d'; ell(g, CX, TOP + 4, 37, 4.5); g.fill();
  g.fillStyle = '#c8b184'; ell(g, CX, TOP + 4.5, 30, 3); g.fill();
  return c;
}
function wickPath(g, lean) {
  const tx = CX + lean * 4, ty = WICK_TOP;
  g.strokeStyle = '#33261a'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(CX, TOP + 4); g.quadraticCurveTo(CX + lean * 2, (TOP + 4 + ty) / 2, tx, ty); g.stroke();
  g.fillStyle = '#171008'; g.beginPath(); g.arc(tx, ty, 2.4, 0, TAU); g.fill();
}
const n1 = (t) => (Math.sin(t * 6.3) + .6 * Math.sin(t * 11.1 + 1.7) + .35 * Math.sin(t * 19.3 + .6) + .5 * Math.sin(t * 1.7 + 3)) / 2.45;
function drawFrame(ctx, st, t, MOT) {
  const scl = st.scl;
  ctx.setTransform(scl, 0, 0, scl, 0, 0);
  ctx.clearRect(0, 0, LW, LH);
  const fl = n1(t) * MOT;
  const lean = (st.wind + Math.sin(t * .7) * .12 + Math.sin(t * 1.9 + 2) * .07) * MOT;
  const wTopX = CX + lean * 4;
  const H = (64 + st.pulse * 26) * (.2 + .8 * st.ig) * (1 + .055 * fl - .16 * Math.min(1, Math.abs(st.wind)));
  const sw = lean * 15 + fl * 2.4, baseY = WICK_TOP + 2;
  const tipX = wTopX + sw * .55, tipY = WICK_TOP + 2 - H;
  st.lastTip = { x: tipX, y: tipY };
  ctx.globalAlpha = .10 + .90 * st.ig; ctx.drawImage(st.staticLayer, 0, 0, LW, LH); ctx.globalAlpha = 1;
  wickPath(ctx, lean);
  ctx.globalCompositeOperation = 'lighter';
  if (st.ig > .02) {
    let g = ctx.createRadialGradient(wTopX, baseY - H * .45, 0, wTopX, baseY - H * .45, 300);
    g.addColorStop(0, `rgba(255,166,70,${.075 * st.ig})`); g.addColorStop(1, 'rgba(255,166,70,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);
    const gx = wTopX + sw * .4, gy = baseY - H * .4, gr = 95 + fl * 9 + st.pulse * 30;
    g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(255,176,84,${.30 * st.ig})`); g.addColorStop(.5, `rgba(255,140,50,${.10 * st.ig})`);
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(wTopX - 7.5, baseY);
    ctx.bezierCurveTo(wTopX - 9.5 + sw * .25, baseY - H * .42, tipX - 5, baseY - H * .68, tipX, tipY);
    ctx.bezierCurveTo(tipX + 5, baseY - H * .66, wTopX + 9.5 + sw * .25, baseY - H * .40, wTopX + 7.5, baseY);
    ctx.quadraticCurveTo(wTopX, baseY + 6, wTopX - 7.5, baseY);
    let fg = ctx.createLinearGradient(0, baseY + 4, 0, tipY);
    fg.addColorStop(0, `rgba(255,200,120,${.90 * st.ig})`); fg.addColorStop(.35, `rgba(255,158,54,${.85 * st.ig})`);
    fg.addColorStop(.75, `rgba(255,105,25,${.45 * st.ig})`); fg.addColorStop(1, 'rgba(255,70,10,0)');
    ctx.fillStyle = fg; ctx.fill();
    const cH = H * .55, cX = wTopX + sw * .75, cY = baseY - cH;
    ctx.beginPath();
    ctx.moveTo(wTopX - 4.6, baseY);
    ctx.bezierCurveTo(wTopX - 5.8 + sw * .2, baseY - cH * .5, cX - 2.6, baseY - cH * .75, cX, cY);
    ctx.bezierCurveTo(cX + 2.6, baseY - cH * .73, wTopX + 5.8 + sw * .2, baseY - cH * .48, wTopX + 4.6, baseY);
    ctx.quadraticCurveTo(wTopX, baseY + 4, wTopX - 4.6, baseY);
    let cg = ctx.createLinearGradient(0, baseY + 2, 0, cY);
    cg.addColorStop(0, `rgba(255,248,225,${.95 * st.ig})`); cg.addColorStop(.55, `rgba(255,220,150,${.55 * st.ig})`);
    cg.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = cg; ctx.fill();
    if (st.ig < .35) {
      const er = (2.5 + st.ig * 14) * 3;
      const eg = ctx.createRadialGradient(wTopX, WICK_TOP, 0, wTopX, WICK_TOP, er);
      eg.addColorStop(0, 'rgba(255,190,90,.95)'); eg.addColorStop(.4, 'rgba(255,110,25,.5)');
      eg.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(wTopX, WICK_TOP, er, 0, TAU); ctx.fill();
    }
    if (!st.RM && st.ig > .85 && Math.random() < .012 + Math.abs(st.wind) * .10 + st.pulse * .2 && st.embers.length < 26) {
      st.embers.push({
        x: tipX + (Math.random() - .5) * 6, y: tipY + 8, vx: (Math.random() - .5) * .3,
        vy: -(.45 + Math.random() * .6), life: 1, dk: .006 + Math.random() * .008, seed: Math.random() * 10
      });
    }
  }
  for (let i = st.embers.length - 1; i >= 0; i--) {
    const p = st.embers[i];
    p.x += p.vx + Math.sin(p.life * 9 + p.seed) * .35 + st.wind * .5; p.y += p.vy; p.vy *= .995; p.life -= p.dk;
    if (p.life <= 0) { st.embers.splice(i, 1); continue; }
    const a = p.life * p.life;
    ctx.fillStyle = `rgba(255,140,50,${.20 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2 * p.life + 1, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,214,140,${.90 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * p.life + .4, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}
export default function DirectorsMoment() {
  const [side, setSide] = useState('typical');
  const [litKey, setLitKey] = useState(0);
  const [stage, setStage] = useState(0); // 0–4: reveals the candle-pane text
  const cvsRef = useRef(null);
  const stRef = useRef({
    ig: 0, igT: 0, wind: 0, windT: 0, pulse: 0, embers: [],
    lastTip: { x: CX, y: WICK_TOP - 60 }, lastPX: null,
    scl: 1, staticLayer: null, t0: 0, raf: null,
    RM: (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  });

  const fit = useCallback(() => {
    const cvs = cvsRef.current, st = stRef.current;
    if (!cvs) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cvs.getBoundingClientRect();
    if (!r.width) return;
    cvs.width = Math.round(r.width * dpr);
    cvs.height = Math.round(r.width * dpr * LH / LW);
    st.scl = cvs.width / LW;
    st.staticLayer = renderStatic(cvs.width, cvs.height, st.scl);
  }, []);

  /* Engine lifecycle — runs while the candle pane is mounted. Re-runs on
     replay (litKey) so the candle relights from scratch. Cancels the raf and
     timers on cleanup, exactly like the standalone demo. */
  useEffect(() => {
    if (side !== 'ours') return;
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const st = stRef.current;
    const MOT = st.RM ? .25 : 1;
    st.ig = 0; st.igT = 0; st.embers = [];
    setStage(0);
    fit();
    if (!st.t0) st.t0 = performance.now();
    const loop = (now) => {
      const t = (now - st.t0) / 1000;
      st.ig += (st.igT - st.ig) * (st.RM ? .15 : .028);
      st.windT = Math.max(-2.4, Math.min(2.4, st.windT)) * .90;
      st.wind += (st.windT - st.wind) * .10;
      st.pulse *= .94;
      drawFrame(ctx, st, t, MOT);
      st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
    const timers = [
      setTimeout(() => { st.igT = 1; }, 450),
      ...[650, 1000, 1350, 1800].map((d, i) => setTimeout(() => setStage(i + 1), d)),
    ];
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(st.raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
    };
  }, [side, litKey, fit]);

  const showSide = (s) => { setSide(s); if (s === 'ours') setLitKey((k) => k + 1); };

  /* cursor = wind, tap = breath (same feel as the standalone demo) */
  const handlePaneMove = (e) => {
    const st = stRef.current, cvs = cvsRef.current;
    if (!cvs || st.ig < .3) return;
    const r = cvs.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * LW;
    const my = (e.clientY - r.top) / r.height * LH;
    if (st.lastPX !== null) {
      const dist = Math.hypot(mx - CX, my - (WICK_TOP - 30));
      if (dist < 190) st.windT += (e.clientX - st.lastPX) * .012 * (1 - dist / 190);
    }
    st.lastPX = e.clientX;
  };
  const handlePaneLeave = () => { stRef.current.lastPX = null; };
  const handleFlare = () => {
    const st = stRef.current;
    if (st.ig < .4) return;
    st.pulse = Math.min(1.3, st.pulse + .9);
    for (let i = 0; i < 7 && st.embers.length < 30; i++) {
      st.embers.push({
        x: st.lastTip.x + (Math.random() - .5) * 8, y: st.lastTip.y + 10,
        vx: (Math.random() - .5) * .8, vy: -(.7 + Math.random() * .9),
        life: 1, dk: .008 + Math.random() * .01, seed: Math.random() * 10,
      });
    }
  };
  return (
    <section className="dm-section" id="directors">
      <DirectorsGlobalStyle />
      <div className="dm-wrap">
        <Rv><p className="dm-kicker">For Funeral Directors</p></Rv>
        <Rv delay={90}>
          <h2 className="dm-title">The last screen a family sees shouldn't feel like <em>a receipt.</em></h2>
        </Rv>
        <Rv delay={150}>
          <p className="dm-sub">
            When a registration is complete, grief is at its loudest. Every other system answers that
            moment with a green tick. Yours answers it with a candle. Flip the switch below and watch what
            a family feels when it's your firm on the other side of the screen.
          </p>
        </Rv>

        <Rv delay={220}>
          <div className="dm-stage">
            <div className="dm-seg" role="group" aria-label="Compare the two experiences">
              <button type="button" className={`dm-segbtn${side === 'typical' ? ' on' : ''}`}
                aria-pressed={side === 'typical'} onClick={() => showSide('typical')}>Typical software</button>
              <button type="button" className={`dm-segbtn${side === 'ours' ? ' on' : ''}`}
                aria-pressed={side === 'ours'} onClick={() => showSide('ours')}>With  RestPoint software</button>
            </div>

            <div className="dm-browser">
              <div className="dm-chrome">
                <span className="dm-dots" aria-hidden="true"><i /><i /><i /></span>
                <span className="dm-url">
                  {side === 'typical'
                    ? 'funeralhome.com/registration — submitted'
                    : `funeralhome.com/in-memory-of-${firstName(DEMO.name).toLowerCase()}`}
                </span>
              </div>
              <div className="dm-screen">
                {side === 'typical' ? (
                  <div className="dm-pane dm-typical">
                    <div className="dm-tcard">
                      <div className="dm-tcheck" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7" /></svg></div>
                      <h4>Registration successful</h4>
                      <p>Your form has been submitted. Please do not reply to this message. A representative may contact you in 3–5 business days.</p>
                      <p className="dm-tref">Reference: #SB-2026-01147 · 12:22 PM</p>
                      <span className="dm-tbtn">Print this page</span>
                      <p className="dm-tpowered">Powered by GenericForms v2.3</p>
                    </div>
                  </div>
                ) : (
                  <div className="dm-pane dm-ours" onPointerMove={handlePaneMove} onPointerLeave={handlePaneLeave}>
                    <canvas ref={cvsRef} className="dm-candle" width={300} height={430}
                      role="img" aria-label="A candle lit in memory" onPointerDown={handleFlare} />
                    <p className={`dm-oeyebrow dm-orv${stage >= 1 ? ' in' : ''}`}>The register is signed</p>
                    <h4 className={`dm-oname dm-orv${stage >= 2 ? ' in' : ''}`}>{DEMO.name}</h4>
                    <p className={`dm-odates dm-orv${stage >= 3 ? ' in' : ''}`}>{DEMO.born} — {DEMO.passed}&nbsp;&nbsp;·&nbsp;&nbsp;{DEMO.age} years</p>
                    <p className={`domsg dm-orv${stage >= 4 ? ' in' : ''}`}>{possessive(firstName(DEMO.name))} story is now in our care.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dm-under">
              <p className="dm-note">This is the real thing live code, running in your browser right now. Try moving your cursor near the flame.</p>
              {side === 'ours' && (
                <button type="button" className="dm-replay" onClick={() => setLitKey((k) => k + 1)}>
                  <svg viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3" /></svg>
                  Light it again
                </button>
              )}
            </div>
          </div>
        </Rv>

        <div className="dm-points">
          <Rv>
            <div className="dm-pt">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" /><path d="M7 10.2 9.2 12.4 13.2 7.6" /></svg>
              <h5>Fully white label</h5>
              <p>Your firm's name, your colours, your words. The family only ever sees you  never us, never a vendor logo.</p>
            </div>
          </Rv>
          <Rv delay={110}>
            <div className="dm-pt">
              <svg viewBox="0 0 20 20"><path d="M8 12 12 8M7.5 9.5 5.4 11.6a3.2 3.2 0 0 0 4.5 4.5l2.1-2.1M12.5 10.5l2.1-2.1a3.2 3.2 0 0 0-4.5-4.5L8 6" /></svg>
              <h5>Plugs into what you already use</h5>
              <p>Your existing form passes the name and dates through a simple link. No migration, no retraining, live the same day.</p>
            </div>
          </Rv>
          <Rv delay={220}>
            <div className="dm-pt">
              <svg viewBox="0 0 20 20"><path d="M10 17S3.5 12.8 3.5 8.2C3.5 5.9 5.3 4 7.6 4c1 0 1.9.4 2.4 1.1C10.5 4.4 11.4 4 12.4 4c2.3 0 4.1 1.9 4.1 4.2C16.5 12.8 10 17 10 17z" /></svg>
              <h5>Nothing for families to do</h5>
              <p>No buttons to find, no text to read, no next steps. The page simply keeps the light on   and that's the point.</p>
            </div>
          </Rv>
        </div>

        <div className="dm-cta">
          <Rv>
            <a className="dm-btn dm-solid"
              href="mailto:hello@restpoint.co.ke?subject=Walkthrough%20—%20the%20confirmation%20moment">
              Book a 15-minute walkthrough
              <svg viewBox="0 0 16 16"><path d="M2.5 8h10.5M9 3.8 13.2 8 9 12.2" /></svg>
            </a>
          </Rv>
          <Rv delay={110}>
            <Link className="dm-btn dm-ghost" to="/memorial">Open the live memorial experience</Link>
          </Rv>
        </div>

        <Rv delay={150}>
          <p className="dm-closer">
            Families don't compare feature lists. They remember <b>how they were treated</b> — and they
            tell that story at every gathering for the next year.
          </p>
        </Rv>
      </div>
    </section>
  );
}
