import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * InOurCare — the post-submission vigil page.
 *
 * After a successful deceased intake ("The register is signed") or body
 * release ("The journey home begins") this page takes over: a candle is
 * hand-drawn on canvas and lit in the deceased's memory inside a black
 * room, the words arrive one by one, and a filled brass "Return home"
 * button flips the whole card over to a white "Welcome home." face.
 *
 * When the flip lands, onDone() hands control back to the portal — the
 * same contract as the old Done button, with the flip as the transition.
 * Esc mirrors the button from either face.
 *
 * Design notes (matching the approved standalone page):
 *  – Still flame: no flicker noise, no pointer wind, no sparks. The flame
 *    holds its shape with a barely-perceptible slow breath (<2% movement).
 *  – No dish under the candle: the pillar stands on a soft pool of shadow.
 *  – Palette: ink #1a1a1a · white #FFFFFF · line #e5e5e5 · gray #666666 ·
 *    verdigris #3D4F47 · brass #7A2F26 · success #475A43.
 *  – born / passed / reference are still accepted for interface
 *    compatibility, but the redesign no longer displays the dates or
 *    file-number lines.
 *
 * Respects prefers-reduced-motion.
 */

const CSS = `
  .ioc-root{position:fixed;inset:0;z-index:9998;background:#030303;color:#FFFFFF;
    font-family:'Karla','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
  .ioc-root ::selection{background:rgba(122,47,38,.4);color:inherit}
  .ioc-root button{font-family:inherit;cursor:pointer}

  /* ——— the card & the flip ——— */
  .ioc-scene{position:absolute;inset:0;perspective:2000px;perspective-origin:50% 45%}
  .ioc-flipper{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}
  .ioc-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
  /* the vigil · a black room, lit only by the flame */
  .ioc-face--vigil{background:radial-gradient(120% 92% at 50% 36%,#1a1a1a 0%,#0d0d0d 48%,#030303 100%)}
  /* home · white paper */
  .ioc-face--home{transform:rotateY(180deg);color:#1a1a1a;
    background:radial-gradient(120% 95% at 50% 0%,#FFFFFF 0%,#FAFAF8 55%,#EFEFED 100%)}
  .ioc-scroll{position:absolute;inset:0;overflow:auto;scrollbar-width:thin;
    scrollbar-color:rgba(102,102,102,.35) transparent}
  .ioc-scroll::-webkit-scrollbar{width:8px}
  .ioc-scroll::-webkit-scrollbar-thumb{background:rgba(102,102,102,.3);border-radius:4px}
  .ioc-face--vigil .ioc-scroll{scrollbar-color:rgba(255,255,255,.2) transparent}
  .ioc-face--vigil .ioc-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18)}

  .ioc-flipper.ioc-to-home{animation:iocFlipAway 1.05s cubic-bezier(.66,.05,.25,1) forwards}
  .ioc-flipper.ioc-to-vigil{animation:iocFlipBack 1.05s cubic-bezier(.66,.05,.25,1) forwards}
  @keyframes iocFlipAway{0%{transform:rotateY(0deg)}55%{transform:translateZ(-110px) rotateY(90deg)}100%{transform:rotateY(180deg)}}
  @keyframes iocFlipBack{0%{transform:rotateY(180deg)}55%{transform:translateZ(-110px) rotateY(90deg)}100%{transform:rotateY(0deg)}}
  /* the card catches less light while edge-on */
  .ioc-shade{position:absolute;inset:0;z-index:6;pointer-events:none;background:#000;opacity:0}
  .ioc-flipper.ioc-to-home .ioc-shade,.ioc-flipper.ioc-to-vigil .ioc-shade{animation:iocShade 1.05s ease}
  @keyframes iocShade{0%,100%{opacity:0}50%{opacity:.5}}

  .ioc-grain{position:absolute;inset:0;pointer-events:none;z-index:50;opacity:.28;mix-blend-mode:soft-light;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")}

  /* ——— the vigil · the candle alone, still ——— */
  .ioc-vigil{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;padding:24px 16px}
  .ioc-vigil>*{position:relative;z-index:1}
  .ioc-wrap{position:relative;width:min(192px,40vh)}
  .ioc-halo{position:absolute;left:50%;top:44%;width:130vmin;height:130vmin;border-radius:50%;z-index:0;
    transform:translate(-50%,-50%);opacity:0;pointer-events:none;will-change:opacity,transform;
    background:radial-gradient(circle,rgba(255,172,84,.18) 0%,rgba(255,150,70,.06) 38%,rgba(255,150,70,0) 65%)}
  .ioc-candle{position:relative;z-index:1;display:block;width:100%;aspect-ratio:300/430;margin-bottom:-24px;
    cursor:pointer;touch-action:pan-y;user-select:none;-webkit-user-select:none}
  .ioc-eyebrow{margin:10px 0 0;font:700 10px/1 'Karla',sans-serif;letter-spacing:.34em;
    text-transform:uppercase;color:#DFA291}
  .ioc-name{margin:10px 0 0;font:italic 500 clamp(28px,4.4vw,42px)/1.08 'Cormorant Garamond',Georgia,serif;color:#FFFFFF}
  .ioc-message{margin:14px 0 0;font:italic 500 clamp(18px,2.4vw,23px)/1.3 'Cormorant Garamond',Georgia,serif;
    color:#EBD9B4;max-width:26ch}

  /* ——— Return home · filled brass, square corners ——— */
  .ioc-btn{margin-top:24px;display:inline-flex;align-items:center;gap:12px;border:none;border-radius:0;
    padding:15px 30px 15px 25px;color:#FFFFFF;font:700 11px/1 'Karla',sans-serif;letter-spacing:.24em;
    text-transform:uppercase;-webkit-tap-highlight-color:transparent;
    background:linear-gradient(180deg,#8E382B 0%,#7A2F26 55%,#5C241D 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.32),
      0 16px 38px -14px rgba(122,47,38,.65),0 3px 8px rgba(0,0,0,.5);
    transition:transform .18s ease,box-shadow .3s ease,filter .3s ease}
  .ioc-btn-t{margin-right:-.24em}
  .ioc-btn svg{flex:none;transition:transform .35s cubic-bezier(.22,.7,.25,1)}
  .ioc-btn:hover{transform:translateY(-2px);filter:brightness(1.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.32),
      0 24px 50px -14px rgba(142,56,43,.75),0 4px 10px rgba(0,0,0,.55)}
  .ioc-btn:hover svg{transform:translateX(-4px)}
  .ioc-btn:active{transform:translateY(0)}
  .ioc-btn:focus-visible{outline:2px solid #DFA291;outline-offset:3px}

  /* ——— home · white, ink, gray ——— */
  .ioc-home{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;padding:32px 20px 72px}
  .ioc-home-brand{font:700 10px/1 'Karla',sans-serif;letter-spacing:.34em;text-transform:uppercase;color:#3D4F47}
  .ioc-home-flame{margin-top:20px;display:block}
  .ioc-home-title{margin:12px 0 0;font:italic 600 clamp(36px,5.4vw,56px)/1.05 'Cormorant Garamond',Georgia,serif;color:#1a1a1a}
  .ioc-home-sub{margin:12px 0 0;font:italic 500 clamp(16px,2.2vw,19px)/1.55 'Cormorant Garamond',Georgia,serif;color:#666666}
  .ioc-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#475A43;
    margin-right:8px;vertical-align:2px}
  .ioc-back{margin-top:28px;display:inline-flex;align-items:center;gap:11px;padding:14px 27px 14px 29px;
    background:transparent;border:1px solid rgba(61,79,71,.45);border-radius:0;color:#3D4F47;
    font:700 10.5px/1 'Karla',sans-serif;letter-spacing:.22em;text-transform:uppercase;
    -webkit-tap-highlight-color:transparent;
    transition:background .3s ease,color .3s ease,border-color .3s ease,transform .18s ease}
  .ioc-back-t{margin-left:-.22em}
  .ioc-back svg{flex:none;transition:transform .35s cubic-bezier(.22,.7,.25,1)}
  .ioc-back:hover{background:#3D4F47;border-color:#3D4F47;color:#FFFFFF}
  .ioc-back:hover svg{transform:translateX(4px)}
  .ioc-back:active{transform:translateY(1px)}
  .ioc-back:focus-visible{outline:2px solid #3D4F47;outline-offset:3px}
  .ioc-home-foot{position:absolute;left:0;right:0;bottom:0;padding:13px 16px 15px;border-top:1px solid #e5e5e5;
    text-align:center;font:600 9px/1 'Karla',sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#666666}

  /* ——— reveals ——— */
  .ioc-rv{opacity:0;transform:translateY(13px);filter:blur(5px);
    transition:opacity .85s ease,transform .85s cubic-bezier(.22,.7,.25,1),filter .85s ease}
  .ioc-rv.ioc-in{opacity:1;transform:none;filter:none}
  .ioc-face--home .ioc-ar{opacity:0;transform:translateY(10px);
    transition:opacity .6s ease var(--d,0s),transform .6s cubic-bezier(.22,.7,.25,1) var(--d,0s)}
  .ioc-face--home.ioc-arrived .ioc-ar{opacity:1;transform:none}

  @media (prefers-reduced-motion:reduce){
    .ioc-rv{transition:none;opacity:1;transform:none;filter:none}
    .ioc-face--home .ioc-ar{transition:none;opacity:1;transform:none}
    .ioc-flipper.ioc-to-home{animation:none;transform:rotateY(180deg)}
    .ioc-flipper.ioc-to-vigil{animation:none;transform:rotateY(0deg)}
    .ioc-flipper.ioc-to-home .ioc-shade,.ioc-flipper.ioc-to-vigil .ioc-shade{animation:none}
    .ioc-btn svg,.ioc-back svg{transition:none}
  }
`;

// ─── Name helpers (possessives for the message line) ───
const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || 'The Deceased';
const possessive = (n) => { const t = String(n).trim(); return /s$/i.test(t) ? t + '’' : t + '’s'; };

const InOurCare = ({ mode = 'intake', name, born, passed, reference, brand = 'Wren & Sons', onDone }) => {
  const canvasRef = useRef(null);
  const haloRef = useRef(null);
  const flipperRef = useRef(null);
  const btnHomeRef = useRef(null);
  const btnBackRef = useRef(null);
  const clockRef = useRef(null);

  const [step, setStep] = useState(0);
  const [side, setSide] = useState('vigil');        // which face is current
  const [visible, setVisible] = useState('vigil');  // which faces stay in the tab order
  const [arrived, setArrived] = useState(false);    // cascades the home face in

  const sideRef = useRef('vigil');
  const flippingRef = useRef(false);
  const timersRef = useRef({});

  // Fonts (Cormorant Garamond + Karla) are loaded once, app-wide, from
  // src/index.css — do not re-request them here.

  // The wick catches, then the words arrive — staggered reveals.
  useEffect(() => {
    const delays = [650, 1050, 1400, 1850];
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Update the tab title while the vigil is on screen, restore on leave.
  useEffect(() => {
    const prev = document.title;
    document.title = `${firstName(name)} — in our care`;
    return () => { document.title = prev; };
  }, [name]);

  // ─── THE CANDLE — still, hand-drawn on canvas ───
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const halo = haloRef.current;
    const ctx = cvs.getContext('2d');
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TAU = Math.PI * 2;
    const LW = 300, LH = 430, CX = 150;
    const TOP = 238, BOT = 372, HW = 43, WICK_TOP = 226;
    let dpr = 1, scl = 1, staticLayer = null;
    let ig = 0, igT = 0, pulse = 0;
    let raf = 0;
    const t0 = performance.now();

    const drip = (g, x, y, len, w) => {
      g.beginPath();
      g.moveTo(x - w / 2, y);
      g.quadraticCurveTo(x - w / 2, y + len * 0.72, x, y + len);
      g.quadraticCurveTo(x + w / 2, y + len * 0.72, x + w / 2, y);
      g.quadraticCurveTo(x, y + 2.5, x - w / 2, y);
      g.fill();
    };

    /* the pillar alone — no dish, just a soft pool of shadow beneath */
    const renderStatic = () => {
      const c = document.createElement('canvas');
      c.width = cvs.width; c.height = cvs.height;
      const g = c.getContext('2d');
      g.setTransform(scl, 0, 0, scl, 0, 0);

      g.save();
      g.translate(CX, BOT + 4);
      g.scale(1, 0.17);
      const sh = g.createRadialGradient(0, 0, 2, 0, 0, 62);
      sh.addColorStop(0, 'rgba(0,0,0,.5)');
      sh.addColorStop(0.55, 'rgba(0,0,0,.24)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sh;
      g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill();
      g.restore();

      const grd = g.createLinearGradient(CX - HW, 0, CX + HW, 0);
      grd.addColorStop(0, '#c9b48d'); grd.addColorStop(0.16, '#ecdcb9'); grd.addColorStop(0.5, '#f6ebd1');
      grd.addColorStop(0.84, '#e3d0a9'); grd.addColorStop(1, '#bda87f');
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

      g.fillStyle = '#dcc79d';
      g.beginPath(); g.ellipse(CX, TOP + 4, 37, 4.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#c8b184';
      g.beginPath(); g.ellipse(CX, TOP + 4.5, 30, 3, 0, 0, TAU); g.fill();
      return c;
    };

    const drawWick = (g, lean) => {
      const bx = CX, by = TOP + 4, tx = CX + lean * 4, ty = WICK_TOP;
      g.strokeStyle = '#33261a'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(CX + lean * 2, (by + ty) / 2, tx, ty); g.stroke();
      g.fillStyle = '#171008'; g.beginPath(); g.arc(tx, ty, 2.4, 0, TAU); g.fill();
    };

    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cvs.offsetWidth || cvs.getBoundingClientRect().width;
      if (!w) return;
      cvs.width = Math.round(w * dpr);
      cvs.height = Math.round(w * dpr * LH / LW);
      scl = cvs.width / LW;
      staticLayer = renderStatic();
    };

    const draw = (t) => {
      ctx.setTransform(scl, 0, 0, scl, 0, 0);
      ctx.clearRect(0, 0, LW, LH);

      /* a slow breath, not a dance — under 2% movement */
      const fl = RM ? 0 : 0.016 * Math.sin(t * 0.85) + 0.007 * Math.sin(t * 0.31 + 1.3);
      const lean = RM ? 0 : 0.02 * Math.sin(t * 0.27);
      const wTopX = CX + lean * 4;
      const H = (64 + pulse * 9) * (0.2 + 0.8 * ig) * (1 + fl);
      const sw = lean * 15;
      const baseX = wTopX, baseY = WICK_TOP + 2;
      const tipX = wTopX + sw * 0.55, tipY = WICK_TOP + 2 - H;

      ctx.globalAlpha = 0.10 + 0.90 * ig;
      ctx.drawImage(staticLayer, 0, 0, LW, LH);
      ctx.globalAlpha = 1;
      drawWick(ctx, lean);

      ctx.globalCompositeOperation = 'lighter';
      if (ig > 0.02) {
        /* ambient light in the room */
        let g = ctx.createRadialGradient(wTopX, baseY - H * 0.45, 0, wTopX, baseY - H * 0.45, 300);
        g.addColorStop(0, `rgba(255,166,70,${0.075 * ig})`); g.addColorStop(1, 'rgba(255,166,70,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);

        /* the flame's own glow */
        const gx = baseX + sw * 0.4, gy = baseY - H * 0.4, gr = 95 + pulse * 24;
        g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, `rgba(255,176,84,${0.30 * ig})`);
        g.addColorStop(0.5, `rgba(255,140,50,${0.10 * ig})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();

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

        /* the faint blue heart of the flame */
        ctx.save(); ctx.translate(baseX, baseY + 1); ctx.scale(1, 1.7);
        const bh = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
        bh.addColorStop(0, `rgba(120,160,255,${0.34 * ig})`); bh.addColorStop(1, 'rgba(120,160,255,0)');
        ctx.fillStyle = bh; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.restore();

        /* the ember catch, while the wick takes the flame */
        if (ig < 0.35) {
          const er = (2.5 + ig * 14) * 3;
          const eg = ctx.createRadialGradient(wTopX, WICK_TOP, 0, wTopX, WICK_TOP, er);
          eg.addColorStop(0, 'rgba(255,190,90,.95)'); eg.addColorStop(0.4, 'rgba(255,110,25,.5)');
          eg.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(wTopX, WICK_TOP, er, 0, TAU); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      /* the room glows with the light — steady, faintly alive */
      if (halo) {
        const li = Math.max(0, ig * (0.82 + 0.18 * fl));
        halo.style.opacity = (li * 0.9).toFixed(3);
        const s = 1 + 0.02 * fl + 0.1 * pulse;
        halo.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`;
      }
    };

    const loop = (now) => {
      const t = (now - t0) / 1000;
      ig += (igT - ig) * 0.028;
      pulse *= 0.94;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    /* touching the flame gives it one soft breath of brightness */
    const onDown = () => {
      if (ig < 0.4) return;
      pulse = Math.min(0.6, pulse + 0.45);
    };

    fit();
    window.addEventListener('resize', fit);
    cvs.addEventListener('pointerdown', onDown);
    const igTimer = setTimeout(() => { igT = 1; }, 450);   /* the wick catches, once */
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(igTimer);
      window.removeEventListener('resize', fit);
      cvs.removeEventListener('pointerdown', onDown);
    };
  }, []);

  // ─── THE FLIP — Return home turns the card over ───
  const flipTo = useCallback((target) => {
    if (flippingRef.current || target === sideRef.current) return;
    flippingRef.current = true;

    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = RM ? 60 : 1080;

    setArrived(false);                        // replay the cascade next visit
    setVisible('both');                       // keep both faces live mid-flip

    const el = flipperRef.current;
    if (el) {
      el.classList.remove('ioc-to-home', 'ioc-to-vigil');
      void el.offsetWidth;                    // restart the keyframes
      el.classList.add(target === 'home' ? 'ioc-to-home' : 'ioc-to-vigil');
    }

    sideRef.current = target;
    setSide(target);

    clearTimeout(timersRef.current.arrive);
    clearTimeout(timersRef.current.land);
    if (target === 'home') {
      timersRef.current.arrive = setTimeout(() => setArrived(true), RM ? 0 : 420);
    }
    timersRef.current.land = setTimeout(() => {
      flippingRef.current = false;
      setVisible(target);                     // the departed face leaves the tab order
      (target === 'home' ? btnBackRef : btnHomeRef).current?.focus({ preventScroll: true });
      if (target === 'home' && onDone) onDone();   // the card has landed — hand over
    }, dur);
  }, [onDone]);

  // Esc mirrors whichever way you're facing.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') flipTo(sideRef.current === 'vigil' ? 'home' : 'vigil');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipTo]);

  // Clear any pending flip timers on unmount.
  useEffect(() => () => {
    Object.keys(timersRef.current).forEach((k) => clearTimeout(timersRef.current[k]));
    timersRef.current = {};
  }, []);

  // The office clock on the home face.
  useEffect(() => {
    if (side !== 'home') return undefined;
    const el = clockRef.current;
    const tick = () => {
      if (!el) return;
      const d = new Date();
      el.textContent = `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`
        + ` · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    };
    tick();
    const iv = setInterval(tick, 10000);
    return () => clearInterval(iv);
  }, [side]);

  const first = firstName(name);
  const label = mode === 'release' ? 'The journey home begins' : 'The register is signed';
  const message = mode === 'release'
    ? `${possessive(first)} journey home has begun.`
    : `${possessive(first)} memory is now held with care.`;
  const rv = (k) => `ioc-rv${step > k ? ' ioc-in' : ''}`;

  return (
    <div className="ioc-root">
      <style>{CSS}</style>
      <div className="ioc-scene">
        <div className="ioc-flipper" ref={flipperRef}>

          {/* FRONT · the candle, still, in the black room */}
          <section
            className="ioc-face ioc-face--vigil"
            style={{ visibility: visible === 'home' ? 'hidden' : 'visible' }}
            aria-label="In our care"
          >
            <div className="ioc-scroll">
              <div className="ioc-vigil">
                <div className="ioc-wrap">
                  <div className="ioc-halo" ref={haloRef} aria-hidden="true" />
                  <canvas
                    ref={canvasRef}
                    className="ioc-candle"
                    width="300"
                    height="430"
                    role="img"
                    aria-label={`A candle lit in memory of ${first}`}
                  />
                </div>
                <p className={`ioc-eyebrow ${rv(0)}`}>{label}</p>
                <h1 className={`ioc-name ${rv(1)}`}>{name || 'The Deceased'}</h1>
                <p className={`ioc-message ${rv(2)}`} aria-live="polite">{message}</p>
                <button type="button" className={`ioc-btn ${rv(3)}`} ref={btnHomeRef} onClick={() => flipTo('home')}>
                  <svg width="22" height="10" viewBox="0 0 24 10" fill="none" aria-hidden="true">
                    <path d="M24 5H2M8 1 2 5l6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="ioc-btn-t">Return home</span>
                </button>
              </div>
            </div>
            <div className="ioc-shade" aria-hidden="true" />
          </section>

          {/* BACK · home, on white paper */}
          <section
            className={`ioc-face ioc-face--home${arrived ? ' ioc-arrived' : ''}`}
            style={{ visibility: visible === 'vigil' ? 'hidden' : 'visible' }}
            aria-label="Home"
          >
            <div className="ioc-scroll">
              <div className="ioc-home">
                <p className="ioc-home-brand ioc-ar" style={{ '--d': '0s' }}>{brand}</p>
                <svg className="ioc-home-flame ioc-ar" style={{ '--d': '.08s' }} width="14" height="20" viewBox="0 0 16 22" aria-hidden="true">
                  <path d="M8 1C11 5 13 8.2 13 12.2a5 5 0 0 1-10 0C3 8.2 5 5 8 1Z" fill="#7A2F26" />
                  <path d="M8 8c1.5 2 2.4 3.4 2.4 5a2.4 2.4 0 0 1-4.8 0c0-1.6.9-3 2.4-5Z" fill="#FFFFFF" />
                </svg>
                <h2 className="ioc-home-title ioc-ar" style={{ '--d': '.16s' }}>Welcome home.</h2>
                <p className="ioc-home-sub ioc-ar" style={{ '--d': '.26s' }}>
                  <span className="ioc-dot" aria-hidden="true" />The vigil light still burns.<br />Return to it whenever you wish.
                </p>
                <button type="button" className="ioc-back ioc-ar" style={{ '--d': '.36s' }} ref={btnBackRef} onClick={() => flipTo('vigil')}>
                  <span className="ioc-back-t">Back to the vigil</span>
                  <svg width="22" height="10" viewBox="0 0 24 10" fill="none" aria-hidden="true">
                    <path d="M0 5h22M16 1l6 4-6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="ioc-home-foot ioc-ar" style={{ '--d': '.46s' }} ref={clockRef}>—</p>
            <div className="ioc-shade" aria-hidden="true" />
          </section>

        </div>
      </div>
      <div className="ioc-grain" aria-hidden="true" />
    </div>
  );
};

export default InOurCare;