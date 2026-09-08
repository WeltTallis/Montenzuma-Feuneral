import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import api from '../../api/axios'
import Snowfall from './Snowfall'
import FlowerSnowBookingForm from './FlowerSnowBookingForm'
import ExpandedView from './FlowerDetail'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }
body {
  background: #0a0b0c;
  font-family: 'Inter', sans-serif;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

/* ── Animations ──────────────────────────────────────────────────────────── */
@keyframes heroFade { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
@keyframes storyFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0), 0 8px 32px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.5); }
}
@keyframes shimmer {
  from { background-position: -200% center; }
  to { background-position: 200% center; }
}

/* ── Swipe hint (browse) ────────────────────────────────────────────────── */
@keyframes hintPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.85; }
}
.browse-swipe-hint {
  position: absolute; top: 150px; left: 50%; transform: translateX(-50%);
  z-index: 10; font-size: 8.5px; font-weight: 600; letter-spacing: 0.3em;
  text-transform: uppercase; color: rgba(255,255,255,0.38); white-space: nowrap;
  display: flex; align-items: center; gap: 10px; pointer-events: none;
  animation: hintPulse 3.2s ease-in-out infinite;
  text-shadow: 0 1px 10px rgba(0,0,0,0.7);
}
.done-page { position: relative; }
.done-inner { position: relative; z-index: 6; }

/* candle animations */
@keyframes flicker {
  0%, 100% { transform: scaleX(1) scaleY(1) rotate(-1deg); opacity: 1; }
  20% { transform: scaleX(0.88) scaleY(1.06) rotate(2deg); opacity: 0.92; }
  40% { transform: scaleX(1.06) scaleY(0.96) rotate(-2deg); opacity: 1; }
  60% { transform: scaleX(0.94) scaleY(1.04) rotate(1deg); opacity: 0.95; }
  80% { transform: scaleX(1.02) scaleY(1.01) rotate(-1deg); opacity: 1; }
}
@keyframes candleGlow {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.08); }
}
@keyframes candleFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes wickFlicker { 0%, 100% { height: 14px; } 50% { height: 12px; } }

/* ── Browse ─────────────────────────────────────────────────────────────── */
.browse {
  position: relative; width: 100%; height: 100vh; overflow: hidden;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: #0a0b0c;
}
.browse-hero {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; animation: heroFade 1.4s ease forwards;
  filter: brightness(0.82) saturate(0.95);
}
.browse-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10,11,12,0.5) 0%,
    rgba(10,11,12,0.02) 30%,
    rgba(10,11,12,0.02) 55%,
    rgba(10,11,12,0.75) 100%
  );
}

/* ── Instagram-story strip ───────────────────────────────────────────────── */
.story-strip {
  position: absolute; top: 0; left: 0; right: 0; z-index: 20;
  padding: 28px 44px 0;
  display: flex; align-items: flex-start; gap: 20px;
  overflow-x: auto; scrollbar-width: none;
}
.story-strip::-webkit-scrollbar { display: none; }

.story-item {
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  background: none; border: none; cursor: pointer; padding: 0;
  flex-shrink: 0;
  /* floating animation — staggered via inline style */
  animation: storyFloat 3.2s ease-in-out infinite;
}

/* Ring container — IG gradient ring */
.story-ring-wrap {
  border-radius: 50%;
  padding: 2.5px;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  position: relative;
}
.story-ring-wrap.sr-unseen {
  background: conic-gradient(
    rgba(255,255,255,0.85) 0deg,
    rgba(200,200,200,0.5) 90deg,
    rgba(255,255,255,0.85) 180deg,
    rgba(200,200,200,0.5) 270deg,
    rgba(255,255,255,0.85) 360deg
  );
  box-shadow: 0 0 14px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.6);
  animation: storyFloat 3.2s ease-in-out infinite, ringPulse 2.8s ease-in-out infinite;
}
.story-ring-wrap.sr-seen {
  background: rgba(255,255,255,0.18);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.story-ring-wrap.sr-selected {
  background: linear-gradient(135deg, #475A43 0%, #6b8c64 50%, #475A43 100%);
  box-shadow: 0 0 18px rgba(71,90,67,0.5), 0 8px 24px rgba(0,0,0,0.6);
}
.story-item:hover .story-ring-wrap { transform: scale(1.06); }

.story-inner {
  width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
  border: 2.5px solid #0a0b0c;
  background: #1a1b1c;
}
.story-inner img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: brightness(0.88);
  transition: filter 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.story-item:hover .story-inner img { filter: brightness(1.05); transform: scale(1.1); }
.story-item.is-sel .story-inner img { filter: brightness(0.95); }

.story-check {
  position: absolute; top: 0; right: 0;
  width: 20px; height: 20px; border-radius: 50%;
  background: #475A43; border: 2px solid #0a0b0c;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #fff; font-weight: 700;
  animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1);
}
.story-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgba(255,255,255,0.5);
  text-align: center; transition: color 0.2s;
  max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.story-item:hover .story-label { color: rgba(255,255,255,0.95); }
.story-item.is-sel .story-label { color: rgba(255,255,255,0.9); }

/* ── Story action chips — quick ＋add & TikTok-style love ────────────────── */
* { -webkit-tap-highlight-color: transparent; }
button:focus-visible, [role="button"]:focus-visible { outline: 2px solid #B98480; outline-offset: 2px; }
@keyframes lovePop { 0% { transform: scale(0.4); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }
.story-add {
  position: absolute; top: -5px; right: -5px; z-index: 3;
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid #0a0b0c; background: #475A43; color: #fff;
  font: 700 15px/1 'Inter', sans-serif; display: grid; place-items: center;
  cursor: pointer; padding: 0; transition: transform 0.2s, background 0.2s;
}
.story-add:hover { transform: scale(1.12); }
.story-add.is-added { background: #C8A262; }
.story-love {
  position: absolute; bottom: -7px; right: -7px; z-index: 3;
  height: 22px; padding: 0 8px 0 6px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16); background: rgba(10,11,12,0.72);
  color: #fff; font: 600 10px 'Inter', sans-serif;
  display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.story-love svg { width: 11px; height: 11px; flex: none; }
.story-love:hover { transform: scale(1.08); }
.story-love.is-liked { background: #C8264A; border-color: transparent; }
.story-love.is-liked svg { animation: lovePop 0.35s cubic-bezier(0.16,1,0.3,1); }
.love-count { font-variant-numeric: tabular-nums; }

/* ── Browse title — bottom left ──────────────────────────────────────────── */
.browse-title-block {
  position: absolute; bottom: 52px; left: 48px; z-index: 10;
  animation: fadeUp 1.2s cubic-bezier(0.16,1,0.3,1);
}
.browse-name-tag {
  font-size: 9px; font-weight: 600; letter-spacing: 0.35em;
  text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px;
}
.browse-headline {
  font-family: 'Fraunces', serif; font-weight: 200;
  font-size: clamp(34px, 5vw, 54px); line-height: 1.05;
  color: #fff; letter-spacing: -0.02em;
}
.browse-headline em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.65); }

/* ── Wordmark ─────────────────────────────────────────────────────────────── */
.wordmark {
  position: absolute; bottom: 52px; right: 48px; z-index: 10;
  text-align: right; animation: fadeUp 1.4s cubic-bezier(0.16,1,0.3,1);
}
.wordmark-name {
  font-family: 'Fraunces', serif; font-size: 14px; font-weight: 300;
  color: rgba(255,255,255,0.3); letter-spacing: 0.04em;
}
.wordmark-sub {
  font-size: 8px; font-weight: 500; letter-spacing: 0.28em;
  color: rgba(255,255,255,0.14); text-transform: uppercase; margin-top: 4px;
}

/* ── Home preview drawer ─────────────────────────────────────────────────── */
.home-preview {
  position: absolute; bottom: 0; right: 0; z-index: 30;
  width: 290px; max-height: 72vh;
  max-height: 72dvh; /* Dynamic viewport height for mobile */
  background: rgba(8,9,10,0.94); backdrop-filter: blur(22px);
  border-left: 1px solid rgba(255,255,255,0.07);
  border-top: 1px solid rgba(255,255,255,0.07);
  border-top-left-radius: 14px;
  display: flex; flex-direction: column;
  animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
}
.home-preview-header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.home-preview-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
}
.home-preview-count { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); }
.home-preview-list { flex: 1; overflow-y: auto; padding: 10px 0; }
.home-preview-row {
  display: flex; align-items: center; gap: 12px; padding: 8px 18px;
  transition: background 0.15s;
}
.home-preview-row:hover { background: rgba(255,255,255,0.025); }
.home-preview-thumb {
  width: 54px; height: 40px; border-radius: 6px;
  object-fit: cover; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.07);
  filter: brightness(0.9);
}
.home-preview-info { flex: 1; min-width: 0; }
.home-preview-name {
  font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.85);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.home-preview-tag { font-size: 9px; color: rgba(255,255,255,0.28); margin-top: 2px; }
.home-preview-remove {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.18); font-size: 16px; padding: 2px 4px;
  transition: color 0.15s; flex-shrink: 0; line-height: 1;
}
.home-preview-remove:hover { color: rgba(255,255,255,0.65); }
.home-preview-footer {
  padding: 14px 18px;
  border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.home-preview-cta {
  width: 100%; padding: 13px 0; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
  text-transform: uppercase; border: none; cursor: pointer;
  transition: all 0.2s;
}
.home-preview-cta:hover { background: #556A50; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(71,90,67,0.35); }

/* Float badge */
.sel-float {
  position: fixed; bottom: 28px; right: 28px; z-index: 200;
  display: flex; align-items: center; gap: 12px;
  animation: fadeIn 0.3s ease;
}
.sel-float-faces { display: flex; }
.sel-float-face {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  border: 2px solid #0a0b0c; margin-left: -10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.sel-float-face:first-child { margin-left: 0; }
.sel-float-face img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.9); }
.sel-float-btn {
  padding: 11px 20px; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; border: none; cursor: pointer;
  box-shadow: 0 8px 28px rgba(71,90,67,0.4);
  transition: all 0.2s;
}
.sel-float-btn:hover { background: #556A50; transform: translateY(-1px); }

/* Expanded / Detail view moved to ./FlowerDetail.jsx */

/* detail styles (tabs, info rows, colors, dimensions, buttons) moved to ./FlowerDetail.jsx */

/* ── Form ────────────────────────────────────────────────────────────────── */
/* booking form styles moved to ./FlowerSnowBookingForm.jsx */

/* ── Done / Candle screen ──────────────────────────────────────────────── */
.done-page {
  min-height: 100vh; background: #080909;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex; align-items: center; justify-content: center;
  padding: 24px; font-family: 'Inter', sans-serif;
}
.done-inner {
  max-width: 420px; text-align: center;
  animation: candleFadeUp 0.8s cubic-bezier(0.16,1,0.3,1);
}

/* Candle */
.candle-wrap {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 44px; position: relative;
}
.candle-glow {
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,210,120,0.35) 0%, rgba(255,180,60,0.12) 50%, transparent 75%);
  position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
  animation: candleGlow 2.2s ease-in-out infinite;
}
.candle-flame-wrap {
  position: relative; z-index: 2; margin-bottom: 2px;
  animation: flicker 2.8s ease-in-out infinite;
  transform-origin: bottom center;
}
.candle-flame {
  width: 18px; height: 28px; margin: 0 auto;
  background: linear-gradient(180deg, #fff5cc 0%, #ffd060 30%, #ff9020 70%, rgba(255,100,20,0.2) 100%);
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
  position: relative;
}
.candle-flame::after {
  content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,220,100,0.4) 100%);
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
}
.candle-wick {
  width: 2px; height: 12px; background: #3a2a1a;
  margin: 0 auto; border-radius: 1px; position: relative; z-index: 2;
  animation: wickFlicker 2.8s ease-in-out infinite;
}
.candle-body {
  width: 28px; border-radius: 3px 3px 2px 2px; position: relative;
  background: linear-gradient(180deg, #f5f0e8 0%, #e8dfc8 40%, #d4c9a8 100%);
  box-shadow: inset -3px 0 8px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.4);
}
.candle-drip {
  position: absolute; top: -6px; left: 6px;
  width: 6px; height: 10px;
  background: rgba(245,240,232,0.9);
  border-radius: 0 0 4px 4px;
}
.candle-base {
  width: 36px; height: 5px; border-radius: 2px;
  background: linear-gradient(180deg, #c8b890 0%, #b8a878 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.done-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.35em;
  text-transform: uppercase; color: rgba(255,255,255,0.2); margin-bottom: 20px;
}
.done-sorry {
  font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300;
  color: rgba(255,255,255,0.85); line-height: 1.3;
  margin-bottom: 12px; letter-spacing: -0.01em;
}
.done-sorry em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.55); }
.done-title {
  font-family: 'Fraunces', serif; font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.45); margin-bottom: 22px; line-height: 1.5;
}
.done-text { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.9; margin-bottom: 36px; font-weight: 300; }
.done-text strong { color: rgba(255,255,255,0.7); font-weight: 500; }
.done-divider {
  width: 32px; height: 1px; background: rgba(255,255,255,0.12);
  margin: 0 auto 28px;
}
.done-btn {
  padding: 13px 28px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent;
  color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 600; cursor: pointer;
  letter-spacing: 0.14em; text-transform: uppercase;
  font-family: 'Inter', sans-serif; transition: all 0.22s;
}
.done-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

@media (max-width: 900px) {
  .story-strip { padding: 22px 22px 0; gap: 16px; }
  .browse-title-block { left: 24px; bottom: 32px; }
  .wordmark { right: 24px; bottom: 32px; }
  .home-preview { width: 100%; border-left: none; border-top-left-radius: 14px; border-top-right-radius: 14px; }
}

`

// ── Candle ────────────────────────────────────────────────────────────────────
function Candle({ height = 68 }) {
  return (
    <div className="candle-wrap">
      <div className="candle-glow" />
      <div className="candle-flame-wrap">
        <div className="candle-flame" />
      </div>
      <div className="candle-wick" />
      <div className="candle-body" style={{ height }}>
        <div className="candle-drip" />
      </div>
      <div className="candle-base" />
    </div>
  )
}

// ── Story Item — tap to view · ＋ adds to booking · ♥ loves ───────────────────
function StoryItem({ arrangement, isActive, isSelected, isLiked, likeCount, size, animDelay, onClick, onAdd, onLike }) {
  const ringCls = 'story-ring-wrap ' + (isActive ? 'sr-unseen' : isSelected ? 'sr-selected' : 'sr-seen')
  return (
    <div
      className={'story-item' + (isSelected ? ' is-sel' : '')}
      onClick={onClick}
      style={{ animationDelay: `${animDelay}s` }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={(arrangement.name || arrangement.title) + ' — view details'}
    >
      <div className={ringCls} style={{ width: size + 6, height: size + 6, position: 'relative' }}>
        <div className="story-inner" style={{ width: size, height: size }}>
          <img src={arrangement.portrait || arrangement.img} alt={arrangement.name || arrangement.title} />
        </div>
        <button
          className={'story-add' + (isSelected ? ' is-added' : '')}
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          aria-label={isSelected ? 'Remove from booking' : 'Add to booking'}
        >
          {isSelected ? '✓' : '+'}
        </button>
        <button
          className={'story-love' + (isLiked ? ' is-liked' : '')}
          onClick={(e) => { e.stopPropagation(); onLike() }}
          aria-label="Love this arrangement"
        >
          <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5S4.9 16 3.2 11.6C2 8.6 3.7 5.5 6.8 5.5c2 0 3.6 1.2 4.4 2.9L12 10l.8-1.6c.8-1.7 2.4-2.9 4.4-2.9 3.1 0 4.8 3.1 3.6 6.1C19.1 16 12 20.5 12 20.5Z" /></svg>
          {likeCount > 0 && <span className="love-count">{likeCount > 999 ? (likeCount / 1000).toFixed(1) + 'k' : likeCount}</span>}
        </button>
      </div>
      <span className="story-label">{arrangement.tag}</span>
    </div>
  )
}

// ── Home Preview Panel ────────────────────────────────────────────────────────
function HomePreview({ selectedIds, onRemove, onProceed, arrangements = [] }) {
  if (!selectedIds.length) return null
  const allArrangements = arrangements
  return (
    <div className="home-preview">
      <div className="home-preview-header">
        <span className="home-preview-label">Your Selections</span>
        <span className="home-preview-count">{selectedIds.length} arrangement{selectedIds.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="home-preview-list">
          {selectedIds.map(id => {
            const a = allArrangements.find(x => x.id === id)
            if (!a) return null
            return (
            <div key={id} className="home-preview-row">
              <img className="home-preview-thumb" src={a.img || a.portrait} alt={a.name || a.title} />
              <div className="home-preview-info">
                <div className="home-preview-name">{a.name || a.title}</div>
                <div className="home-preview-tag">{a.note || a.tag}</div>
              </div>
              <button className="home-preview-remove" onClick={() => onRemove(id)}>×</button>
            </div>
          )
        })}
      </div>
      <div className="home-preview-footer">
        <button className="home-preview-cta" onClick={onProceed}>Continue to Booking →</button>
      </div>
    </div>
  )
}

// ── Browse Screen ─────────────────────────────────────────────────────────────
function BrowseScreen({ selectedIds, onOpen, onAdd, onLike, likes = {}, likedIds = [], onPreview, arrangements = [], loading = false }) {
  const [bgIdx, setBgIdx] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const touchRef = useRef(null)
  const allArrangements = arrangements

  useEffect(() => {
    if (allArrangements.length === 0) return
    const t = setInterval(() => setBgIdx(i => (i + 1) % allArrangements.length), 6000)
    return () => clearInterval(t)
  }, [allArrangements.length])

  useEffect(() => {
    if (selectedIds.length > 0) setShowPreview(true)
    if (selectedIds.length === 0) setShowPreview(false)
  }, [selectedIds.length])

  const bg = allArrangements[bgIdx] || allArrangements[0]

  // ── Swipe: ← / → cycles the hero · swipe up opens the arrangement ──
  const onTouchStart = (e) => {
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      onUi: !!(e.target.closest && e.target.closest('.story-strip, .home-preview, .sel-float, button')),
    }
  }
  const onTouchEnd = (e) => {
    if (!touchRef.current || touchRef.current.onUi) { touchRef.current = null; return }
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    const SWIPE = 70
    if (allArrangements.length && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE) {
      setBgIdx(i => dx < 0 ? (i + 1) % allArrangements.length : (i - 1 + allArrangements.length) % allArrangements.length)
    }
    // (vertical swipes belong to page scroll — never hijack them)
  }

  return (
    <div className="browse" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {bg && <img key={bgIdx} className="browse-hero" src={bg.img || bg.portrait} alt={bg.name || bg.title} />}
      <div className="browse-overlay" />
      <Snowfall count={14} opacity={0.5} />
      <div className="browse-swipe-hint">‹ swipe ›</div>

      {loading && allArrangements.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading arrangements…
        </div>
      )}

      {!loading && allArrangements.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 12 }}>No arrangements yet</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 420, lineHeight: 1.6, fontSize: 14 }}>
            The funeral home hasn&apos;t uploaded any flower arrangements at the moment. Please check back soon.
          </p>
        </div>
      )}

      <div className="story-strip">
        {allArrangements.map((a, i) => (
          <StoryItem
            key={a.id}
            arrangement={a}
            isActive={i === bgIdx}
            isSelected={selectedIds.includes(a.id)}
            isLiked={likedIds.includes(a.id)}
            likeCount={likes[a.id] ?? 0}
            size={72}
            animDelay={i * 0.18}
            onClick={() => onOpen(a.id)}
            onAdd={() => onAdd(a.id)}
            onLike={() => onLike(a.id)}
          />
        ))}
      </div>

      <div className="browse-title-block">
        <div className="browse-name-tag">Floral Tributes</div>
        <h1 className="browse-headline">
          Choose your<br /><em>floral tribute</em>
        </h1>
      </div>

      <div className="wordmark">
        <div className="wordmark-name">Memorial Florals</div>
        <div className="wordmark-sub">Est. since care began</div>
      </div>

      {showPreview && selectedIds.length > 0 && (
        <HomePreview selectedIds={selectedIds} onRemove={onRemove} onProceed={onPreview} arrangements={allArrangements} />
      )}

      {!showPreview && selectedIds.length > 0 && (
        <div className="sel-float">
          <div className="sel-float-faces">
            {selectedIds.slice(0, 3).map(id => {
              const a = allArrangements.find(x => x.id === id)
              if (!a) return null
              return (
                <div key={id} className="sel-float-face">
                  <img src={a.portrait || a.img} alt={a.name || a.title} />
                </div>
              )
            })}
          </div>
          <button className="sel-float-btn" onClick={() => setShowPreview(true)}>
            View Selections · {selectedIds.length}
          </button>
        </div>
      )}
    </div>
  )
}

// ColorInputs, ExpandedView and the booking form now live in their own files:
//   ./FlowerDetail.jsx  ·  ./FlowerSnowBookingForm.jsx  ·  ./Snowfall.jsx

// ── Done Screen ───────────────────────────────────────────────────────────────
function DoneScreen({ totalItems, deceased, onReset }) {
  return (
    <div className="done-page">
      <Snowfall count={12} opacity={0.4} />
      <div className="done-inner">
        <Candle height={72} />
        <div className="done-label">Memorial Florals</div>
        <div className="done-sorry">
          We are so <em>deeply sorry</em><br />for your loss.
        </div>
        <div className="done-divider" />
        <div className="done-title">
          Your booking has been received.
        </div>
        <p className="done-text">
          We will lovingly prepare your{' '}
          <strong>{totalItems} arrangement{totalItems !== 1 ? 's' : ''}</strong>
          {deceased ? <> for <strong>{deceased}</strong></> : ' for the service'}.{' '}
          Our team will confirm within a few hours and is here for any questions.
        </p>
        <button className="done-btn" onClick={onReset}>Start a new booking</button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState([])
  const [quantities, setQuantities] = useState({})
  const [arrangements, setArrangements] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)

  // ── Loves — TikTok-style hearts ──
  const [likes, setLikes] = useState({})
  const [likedIds, setLikedIds] = useState([])
  const baseLikesRef = useRef({})
  baseLikesRef.current = useMemo(() => {
    const m = {}
    arrangements.forEach(a => {
      const seed = String(a.id).split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)
      m[a.id] = 48 + (seed * 37) % 420
    })
    return m
  }, [arrangements])

  const toggleLike = useCallback((id) => {
    setLikedIds(prev => {
      const has = prev.includes(id)
      setLikes(m => ({ ...m, [id]: Math.max(0, (m[id] ?? baseLikesRef.current[id] ?? 0) + (has ? -1 : 1)) }))
      return has ? prev.filter(x => x !== id) : [...prev, id]
    })
  }, [])

  // Fetch flower arrangements from backend API
  useEffect(() => {
    const loadArrangements = async () => {
      try {
        const tenantSlug = localStorage.getItem('tenantSlug') || 'system_shared';
        const res = await api.get('/florist/flower-samples', {
          params: { tenant_slug: tenantSlug }
        });
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          const transformed = data.data.map((sample, index) => {
            const firstImage = sample.images && sample.images.length > 0
              ? (typeof sample.images[0] === 'string' ? sample.images[0] : sample.images[0].url)
              : null;
            return {
              id: sample.sample_id || `arr-${index}`,
              name: sample.title,
              img: firstImage || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&h=1000',
              portrait: firstImage || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&h=1200',
              tag: sample.types && sample.types.length > 0 ? sample.types[0] : 'Arrangement',
              note: sample.price != null ? `$${Number(sample.price).toLocaleString()}` : 'Custom arrangement',
              desc: sample.description || 'A beautiful floral arrangement.',
              size: 'Standard',
              flowers: sample.description || 'Fresh flowers',
              weight: '5–10 lbs',
              display: 'Standard display',
              w: '18–24"',
              h: '12–18"',
              d: '12–18"',
              placement: 'Place at the memorial service.',
              price: sample.price != null ? Number(sample.price) : null,
            };
          });
          setArrangements(transformed);
        } else {
          setArrangements([]);
        }
      } catch (e) {
        console.error('Failed to load flower samples:', e);
      } finally {
        setLoading(false);
      }
    };
    loadArrangements();
  }, []);

  const toggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        setQuantities(q => { const n = { ...q }; delete n[id]; return n })
        return prev.filter(x => x !== id)
      }
      setQuantities(q => ({ ...q, [id]: 1 }))
      return [...prev, id]
    })
  }

  const remove = (id) => {
    setSelected(prev => prev.filter(x => x !== id))
    setQuantities(q => { const n = { ...q }; delete n[id]; return n })
  }

  const openBooking = useCallback(() => setBookingOpen(true), [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <BrowseScreen
        selectedIds={selected}
        onOpen={id => setExpandedId(id)}
        onAdd={toggle}
        onLike={toggleLike}
        likes={likes}
        likedIds={likedIds}
        onRemove={remove}
        onPreview={openBooking}
        arrangements={arrangements}
        loading={loading}
      />

      {expandedId && (
        <ExpandedView
          activeId={expandedId}
          selectedIds={selected}
          onNavigate={setExpandedId}
          onClose={() => setExpandedId(null)}
          onToggle={toggle}
          onLike={toggleLike}
          likes={likes}
          likedIds={likedIds}
          onPreview={openBooking}
          arrangements={arrangements}
        />
      )}

      {/* Booking slides in as a side panel over the current view */}
      <FlowerSnowBookingForm
        open={bookingOpen}
        selected={selected}
        quantities={quantities}
        arrangements={arrangements}
        onQtyChange={(id, q) => setQuantities(prev => ({ ...prev, [id]: Math.max(1, q) }))}
        onRemove={remove}
        onBooked={() => { setSelected([]); setQuantities({}) }}
        onClose={() => setBookingOpen(false)}
      />
    </>
  )
}
