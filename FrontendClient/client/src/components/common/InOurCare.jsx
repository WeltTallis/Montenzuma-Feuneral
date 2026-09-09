import React, { useEffect, useRef, useState } from 'react';

/**
 * InOurCare — the post-submission vigil page.
 *
 * After a successful deceased intake ("The register is signed") or body
 * release ("The journey home begins") this page takes over: a candle is
 * hand-drawn on canvas and lit in the deceased's memory, the words arrive
 * one by one, and a single Done button returns the user to the portal.
 *
 * Faithful React port of the standalone candle page: static canvas layer,
 * layered flame gradients, blue heart, ember catch, drifting sparks,
 * pointer-driven wind and touch pulse. Respects prefers-reduced-motion.
 */

const CSS = `
  .ioc-root{position:fixed;inset:0;z-index:9998;background:#0f0d0a;color:#ece3d1;
    font-family:'Karla','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;overflow:auto}
  .ioc-root ::selection{background:rgba(230,162,78,.38);color:inherit}
  .ioc-grain{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:.45;mix-blend-mode:soft-light;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")}
  .ioc-vigil{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;padding:10px 14px 10px}
  .ioc-candle{width:min(300px,74vw);aspect-ratio:300/430;display:block;margin-bottom:-14px;cursor:pointer;
    touch-action:pan-y;user-select:none;-webkit-user-select:none}
  .ioc-eyebrow{font:700 11px/1 'Karla',sans-serif;letter-spacing:.36em;color:#e6a24e;margin:20px 0 0}
  .ioc-name{margin:20px 0 0;font:italic 500 clamp(36px,7vw,56px)/1.08 'Cormorant Garamond',Georgia,serif;color:#ece3d1}
  .ioc-dates{margin:16px 0 0;font:600 11px/1.7 'Karla',sans-serif;letter-spacing:.3em;color:#a2937c}
  .ioc-ref{margin:12px 0 0;font:600 10px/1 'Karla',sans-serif;letter-spacing:.3em;color:rgba(162,147,124,.8);text-transform:uppercase}
  .ioc-message{margin:30px 0 0;font:italic 500 clamp(21px,4vw,29px)/1.35 'Cormorant Garamond',Georgia,serif;color:#f2c98c;max-width:20ch}
  .ioc-foot{margin:52px 0 0;font:italic 500 16px/1.75 'Cormorant Garamond',Georgia,serif;color:#a2937c}
  .ioc-done{margin-top:32px;font:700 12px/1 'Karla',sans-serif;letter-spacing:.32em;text-transform:uppercase;
    color:#e6a24e;background:transparent;border:1px solid rgba(230,162,78,.55);border-radius:9px;
    padding:16px 58px;cursor:pointer;transition:background .35s ease,color .35s ease,box-shadow .35s ease,transform .35s ease}
  .ioc-done:hover{background:#e6a24e;color:#0f0d0a;box-shadow:0 0 34px rgba(230,162,78,.35);transform:translateY(-1px)}
  .ioc-done:active{transform:translateY(0)}
  .ioc-rv{opacity:0;transform:translateY(16px);filter:blur(6px);
    transition:opacity .95s ease,transform .95s cubic-bezier(.22,.7,.25,1),filter .95s ease}
  .ioc-rv.ioc-in{opacity:1;transform:none;filter:none}
  @media(prefers-reduced-motion:reduce){.ioc-rv{transition:none;transform:none;filter:none;opacity:1}}
`;

// ─── Word helpers (years spelled out, possessives, ages) ───
const TAU = Math.PI * 2;
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || 'The Deceased';
const possessive = (n) => { const t = String(n).trim(); return /s$/i.test(t) ? t + '’' : t + '’s'; };

const words = (n) => {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[(n / 10) | 0] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[(n / 100) | 0] + ' hundred' + (n % 100 ? ' and ' + words(n % 100) : '');
  return '' + n;
};

const yearOf = (v) => {
  if (!v) return null;
  const m = String(v).match(/\d{4}/);
  return m ? +m[0] : null;
};

const ageWords = (born, passed) => {
  const by = yearOf(born);
  const py = yearOf(passed);
  if (by === null || py === null) return '';
  let n = py - by;
  if (String(born || '').length > 4 && String(passed || '').length > 4) {
    const b = new Date(born);
    const p = new Date(passed);
    if (!isNaN(b) && !isNaN(p)) {
      n = p.getFullYear() - b.getFullYear();
      if (p.getMonth() < b.getMonth() || (p.getMonth() === b.getMonth() && p.getDate() < b.getDate())) n--;
      if (n < 0 || isNaN(n)) n = py - by;
    }
  }
  if (n <= 0) return '';
  return `  ·  ${words(n)} years`;
};

const InOurCare = ({ mode = 'intake', name, born, passed, reference, onDone }) => {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);

  // Load the vigil fonts once (Cormorant Garamond + Karla).
  useEffect(() => {
    const id = 'inourcare-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Karla:ital,wght@0,400;0,500;0,600;0,700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // The wick catches, then the words arrive — staggered reveals.
  useEffect(() => {
    const delays = [550, 900, 1250, 1700, 2500, 3000];
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Update the tab title while the vigil is on screen, restore on leave.
  useEffect(() => {
    const prev = document.title;
    document.title = `${firstName(name)} — in our care`;
    return () => { document.title = prev; };
  }, [name]);

  // ─── THE CANDLE — hand-drawn on canvas ───
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MOT = RM ? 0.25 : 1;
    const LW = 300, LH = 430, CX = 150;
    const TOP = 238, BOT = 372, HW = 43, WICK_TOP = 226;
    let dpr = 1, scl = 1, staticLayer = null;
    let ig = 0, igT = 0;
    let wind = 0, windT = 0, lastPX = null, pulse = 0;
    let embers = [], raf = 0, t0 = performance.now();
    let lastTip = { x: CX, y: WICK_TOP - 60 };

    const ellipse = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); };

    const drip = (g, x, y, len, w) => {
      g.beginPath();
      g.moveTo(x - w / 2, y);
      g.quadraticCurveTo(x - w / 2, y + len * 0.72, x, y + len);
      g.quadraticCurveTo(x + w / 2, y + len * 0.72, x + w / 2, y);
      g.quadraticCurveTo(x, y + 2.5, x - w / 2, y);
      g.fill();
    };

    const renderStatic = () => {
      const c = document.createElement('canvas');
      c.width = cvs.width; c.height = cvs.height;
      const g = c.getContext('2d');
      g.setTransform(scl, 0, 0, scl, 0, 0);

      /* brass dish */
      g.fillStyle = '#221a10'; ellipse(g, CX, 375, 80, 14); g.fill();
      g.strokeStyle = 'rgba(190,146,80,.55)'; g.lineWidth = 1.6; ellipse(g, CX, 375, 80, 14); g.stroke();
      g.fillStyle = '#120d07'; ellipse(g, CX, 373, 70, 10.5); g.fill();
      g.strokeStyle = 'rgba(230,180,100,.32)'; g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(CX, 375, 80, 14, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.6)'; ellipse(g, CX, 371, 46, 7); g.fill();

      /* pillar */
      const grd = g.createLinearGradient(CX - HW, 0, CX + HW, 0);
      grd.addColorStop(0, '#c9b48d'); grd.addColorStop(.16, '#ecdcb9'); grd.addColorStop(.5, '#f6ebd1');
      grd.addColorStop(.84, '#e3d0a9'); grd.addColorStop(1, '#bda87f');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(CX - HW, TOP + 8);
      g.lineTo(CX - HW, BOT - 6); g.quadraticCurveTo(CX - HW, BOT, CX - HW + 6, BOT);
      g.lineTo(CX + HW - 6, BOT); g.quadraticCurveTo(CX + HW, BOT, CX + HW, BOT - 6);
      g.lineTo(CX + HW, TOP + 7);
      g.bezierCurveTo(CX + HW - 10, TOP + 2, CX + 24, TOP + 11, CX + 6, TOP + 3);
      g.bezierCurveTo(CX - 6, TOP - 3, CX - 22, TOP + 10, CX - HW + 2, TOP + 3);
      g.closePath(); g.fill();

      drip(g, CX - 33, TOP + 3, 20, 7);
      drip(g, CX + 30, TOP + 2, 12, 6);
      drip(g, CX - 10, TOP + 5, 8, 5);

      g.fillStyle = '#dcc79d'; ellipse(g, CX, TOP + 4, 37, 4.5); g.fill();
      g.fillStyle = '#c8b184'; ellipse(g, CX, TOP + 4.5, 30, 3); g.fill();
      return c;
    };

    const drawWick = (g, lean) => {
      const bx = CX, by = TOP + 4, tx = CX + lean * 4, ty = WICK_TOP;
      g.strokeStyle = '#33261a'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(CX + lean * 2, (by + ty) / 2, tx, ty); g.stroke();
      g.fillStyle = '#171008'; g.beginPath(); g.arc(tx, ty, 2.4, 0, TAU); g.fill();
    };

    const n1 = (t) => (
      (Math.sin(t * 6.3) + .6 * Math.sin(t * 11.1 + 1.7) + .35 * Math.sin(t * 19.3 + .6) + .5 * Math.sin(t * 1.7 + 3)) / 2.45
    );

    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cvs.getBoundingClientRect();
      cvs.width = Math.round(r.width * dpr);
      cvs.height = Math.round(r.width * dpr * LH / LW);
      scl = cvs.width / LW;
      staticLayer = renderStatic();
    };

    const draw = (t) => {
      ctx.setTransform(scl, 0, 0, scl, 0, 0);
      ctx.clearRect(0, 0, LW, LH);

      const fl = n1(t) * MOT;
      const lean = (wind + Math.sin(t * 0.7) * 0.12 + Math.sin(t * 1.9 + 2) * 0.07) * MOT;
      const wTopX = CX + lean * 4;
      const H = (64 + pulse * 26) * (0.2 + 0.8 * ig) * (1 + 0.055 * fl - 0.16 * Math.min(1, Math.abs(wind)));
      const sw = lean * 15 + fl * 2.4;
      const baseX = wTopX, baseY = WICK_TOP + 2;
      const tipX = wTopX + sw * 0.55, tipY = WICK_TOP + 2 - H;
      lastTip = { x: tipX, y: tipY };

      ctx.globalAlpha = 0.10 + 0.90 * ig;
      ctx.drawImage(staticLayer, 0, 0, LW, LH);
      ctx.globalAlpha = 1;
      drawWick(ctx, lean);

      ctx.globalCompositeOperation = 'lighter';
      if (ig > 0.02) {
        let g = ctx.createRadialGradient(wTopX, baseY - H * 0.45, 0, wTopX, baseY - H * 0.45, 300);
        g.addColorStop(0, `rgba(255,166,70,${0.075 * ig})`); g.addColorStop(1, 'rgba(255,166,70,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);

        const gx = baseX + sw * 0.4, gy = baseY - H * 0.4, gr = 95 + fl * 9 + pulse * 30;
        g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, `rgba(255,176,84,${0.30 * ig})`);
        g.addColorStop(.5, `rgba(255,140,50,${0.10 * ig})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();

        const pr = 150 + pulse * 40 + fl * 8;
        const pg = ctx.createRadialGradient(CX, 394, 0, CX, 394, pr);
        pg.addColorStop(0, `rgba(255,170,80,${0.16 * ig})`); pg.addColorStop(1, 'rgba(255,170,80,0)');
        ctx.save(); ctx.translate(CX, 394); ctx.scale(1, 0.22); ctx.translate(-CX, -394);
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(CX, 394, pr, 0, TAU); ctx.fill(); ctx.restore();

        /* outer flame */
        ctx.beginPath();
        ctx.moveTo(baseX - 7.5, baseY);
        ctx.bezierCurveTo(baseX - 9.5 + sw * 0.25, baseY - H * 0.42, tipX - 5, baseY - H * 0.68, tipX, tipY);
        ctx.bezierCurveTo(tipX + 5, baseY - H * 0.66, baseX + 9.5 + sw * 0.25, baseY - H * 0.40, baseX + 7.5, baseY);
        ctx.quadraticCurveTo(baseX, baseY + 6, baseX - 7.5, baseY);
        const fg = ctx.createLinearGradient(0, baseY + 4, 0, tipY);
        fg.addColorStop(0, `rgba(255,200,120,${0.90 * ig})`);
        fg.addColorStop(0.35, `rgba(255,158,54,${0.85 * ig})`);
        fg.addColorStop(0.75, `rgba(255,105,25,${0.45 * ig})`);
        fg.addColorStop(1, 'rgba(255,70,10,0)');
        ctx.fillStyle = fg; ctx.fill();

        /* hot inner core */
        const cH = H * 0.55, cX = baseX + sw * 0.75, cY = baseY - cH;
        ctx.beginPath();
        ctx.moveTo(baseX - 4.6, baseY);
        ctx.bezierCurveTo(baseX - 5.8 + sw * 0.2, baseY - cH * 0.5, cX - 2.6, baseY - cH * 0.75, cX, cY);
        ctx.bezierCurveTo(cX + 2.6, baseY - cH * 0.73, baseX + 5.8 + sw * 0.2, baseY - cH * 0.48, baseX + 4.6, baseY);
        ctx.quadraticCurveTo(baseX, baseY + 4, baseX - 4.6, baseY);
        const cg = ctx.createLinearGradient(0, baseY + 2, 0, cY);
        cg.addColorStop(0, `rgba(255,248,225,${0.95 * ig})`);
        cg.addColorStop(0.55, `rgba(255,220,150,${0.55 * ig})`);
        cg.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = cg; ctx.fill();

        /* the faint blue heart */
        ctx.save(); ctx.translate(baseX, baseY + 1); ctx.scale(1, 1.7);
        const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
        bg.addColorStop(0, `rgba(120,160,255,${0.34 * ig})`); bg.addColorStop(1, 'rgba(120,160,255,0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.restore();

        /* ember before the flame takes hold */
        if (ig < 0.35) {
          const er = (2.5 + ig * 14) * 3;
          const eg = ctx.createRadialGradient(wTopX, WICK_TOP, 0, wTopX, WICK_TOP, er);
          eg.addColorStop(0, 'rgba(255,190,90,.95)'); eg.addColorStop(.4, 'rgba(255,110,25,.5)');
          eg.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(wTopX, WICK_TOP, er, 0, TAU); ctx.fill();
        }
        /* sparks */
        if (!RM && ig > 0.85 && Math.random() < 0.012 + Math.abs(wind) * 0.10 + pulse * 0.2 && embers.length < 26) {
          embers.push({
            x: tipX + (Math.random() - .5) * 6, y: tipY + 8, vx: (Math.random() - .5) * .3,
            vy: -(0.45 + Math.random() * 0.6), life: 1, dk: 0.006 + Math.random() * 0.008, seed: Math.random() * 10,
          });
        }
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.x += p.vx + Math.sin(p.life * 9 + p.seed) * 0.35 + wind * 0.5;
        p.y += p.vy; p.vy *= 0.995; p.life -= p.dk;
        if (p.life <= 0) { embers.splice(i, 1); continue; }
        const a = p.life * p.life;
        ctx.fillStyle = `rgba(255,140,50,${0.20 * a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.2 * p.life + 1, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,214,140,${0.90 * a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * p.life + 0.4, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now) => {
      const t = (now - t0) / 1000;
      ig += (igT - ig) * (RM ? 0.15 : 0.028);
      windT = Math.max(-2.4, Math.min(2.4, windT)) * 0.90;
      wind += (windT - wind) * 0.10;
      pulse *= 0.94;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    /* the flame feels the air your cursor moves */
    const onMove = (e) => {
      if (ig < 0.3) return;
      const r = cvs.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width * LW;
      const my = (e.clientY - r.top) / r.height * LH;
      if (lastPX !== null) {
        const dist = Math.hypot(mx - CX, my - (WICK_TOP - 30));
        const R = 190;
        if (dist < R) windT += (e.clientX - lastPX) * 0.012 * (1 - dist / R);
      }
      lastPX = e.clientX;
    };

    /* touch the flame gently and it breathes */
    const onDown = () => {
      if (ig < 0.4) return;
      pulse = Math.min(1.3, pulse + 0.9);
      for (let i = 0; i < 7 && embers.length < 30; i++) {
        embers.push({
          x: lastTip.x + (Math.random() - .5) * 8, y: lastTip.y + 10, vx: (Math.random() - .5) * .8,
          vy: -(0.7 + Math.random() * 0.9), life: 1, dk: 0.008 + Math.random() * 0.01, seed: Math.random() * 10,
        });
      }
    };

    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('pointermove', onMove);
    cvs.addEventListener('pointerdown', onDown);
    const igTimer = setTimeout(() => { igT = 1; }, 500);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(igTimer);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointermove', onMove);
      cvs.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const first = firstName(name);
  const label = mode === 'release' ? 'THE JOURNEY HOME BEGINS' : 'THE REGISTER IS SIGNED';
  const message = mode === 'release'
    ? `${possessive(first)} journey home has begun.`
    : `${possessive(first)}  memory is now held with care.`;
  const by = yearOf(born);
  const py = yearOf(passed);
  const dateLine = (by || '') + (by && py ? ' — ' : '') + (py || '') + ageWords(born, passed);
  const rv = (k) => `ioc-rv${step > k ? ' ioc-in' : ''}`;

  return (
    <div className="ioc-root">
      <style>{CSS}</style>
      <div className="ioc-grain" aria-hidden="true" />
      <section className="ioc-vigil">
        <canvas
          ref={canvasRef}
          className="ioc-candle"
          width="300"
          height="430"
          role="img"
          aria-label="A candle lit in memory"
        />
        <p className={`ioc-eyebrow ${rv(0)}`}>{label}</p>
        <h1 className={`ioc-name ${rv(1)}`}>{name || 'The Deceased'}</h1>
        {dateLine ? <p className={`ioc-dates ${rv(2)}`}>{dateLine}</p> : null}
        {reference ? <p className={`ioc-ref ${rv(2)}`}>File {reference}</p> : null}
        <p className={`ioc-message ${rv(3)}`} aria-live="polite">{message}</p>
        <p className={`ioc-foot ${rv(4)}`}>
          Take whatever time you need.<br />This page will keep the light on for you.
        </p>
        <button type="button" className={`ioc-done ${rv(5)}`} onClick={onDone}>
          Done
        </button>
      </section>
    </div>
  );
};

export default InOurCare;