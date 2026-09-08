import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'


const COLOR_ROLES = ['Primary flower', 'Accent flower', 'Ribbon color', 'Foliage']

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');

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

/* ── Expanded / Detail ───────────────────────────────────────────────────── */
.expanded {
  position: fixed; inset: 0; z-index: 100;
  background: #0a0b0c; display: flex;
  animation: fadeIn 0.22s ease;
}
.detail-image-panel {
  position: sticky; top: 0;
  width: 52%; height: 100vh; flex-shrink: 0;
  height: 100dvh; /* Dynamic viewport height for mobile */
  overflow: hidden; background: #111;
}
.detail-image-panel img {
  width: 100%; height: 100%; object-fit: cover; object-position: center;
  display: block; animation: heroFade 0.7s ease forwards;
  filter: brightness(0.88);
}
.detail-image-panel .img-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(150deg, rgba(10,11,12,0.28) 0%, transparent 55%);
  pointer-events: none;
}
.detail-image-badge {
  position: absolute; bottom: 36px; left: 36px;
  animation: fadeUp 0.6s ease 0.2s both;
}
.detail-image-badge-tag {
  font-size: 9px; font-weight: 600; letter-spacing: 0.3em;
  text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 8px;
}
.detail-image-badge-name {
  font-family: 'Fraunces', serif; font-size: 24px; font-weight: 300;
  color: #fff; line-height: 1.1; letter-spacing: -0.01em;
}
.detail-image-badge-name em { font-style: italic; font-weight: 200; }

.detail-scroll-panel {
  flex: 1; height: 100vh; overflow-y: auto;
  height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex; flex-direction: column;
}
.detail-nav {
  position: sticky; top: 0; z-index: 10;
  padding: 22px 38px;
  background: rgba(10,11,12,0.92); backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: space-between;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 500;
  font-family: 'Inter', sans-serif;
  display: flex; align-items: center; gap: 8px;
  transition: color 0.2s; padding: 0;
}
.back-btn:hover { color: #fff; }

/* Story thumbnails in detail nav */
.detail-stories { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; max-width: 320px; }
.detail-stories::-webkit-scrollbar { display: none; }
.detail-story-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
  animation: storyFloat 3.2s ease-in-out infinite;
}
.detail-story-ring {
  border-radius: 50%; padding: 2px; transition: transform 0.25s;
}
.detail-story-ring.dsr-active {
  background: conic-gradient(rgba(255,255,255,0.9) 0deg, rgba(200,200,200,0.4) 90deg, rgba(255,255,255,0.9) 180deg, rgba(200,200,200,0.4) 270deg, rgba(255,255,255,0.9) 360deg);
  box-shadow: 0 0 10px rgba(255,255,255,0.2);
}
.detail-story-ring.dsr-selected { background: linear-gradient(135deg, #475A43, #6b8c64); }
.detail-story-ring.dsr-normal { background: rgba(255,255,255,0.14); }
.detail-story-inner {
  border-radius: 50%; overflow: hidden; border: 2px solid #0a0b0c; background: #1a1b1c;
}
.detail-story-inner img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.85); }
.detail-story-item:hover .detail-story-ring { transform: scale(1.08); }
.detail-story-item:hover .detail-story-inner img { filter: brightness(1); }

.detail-content { padding: 48px 38px 80px; flex: 1; }

/* Overview hero image in detail */
.detail-overview-img {
  width: 100%; height: 220px; border-radius: 10px; overflow: hidden;
  margin-bottom: 32px; background: #111;
  display: none;
}
.detail-overview-img img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: brightness(0.88);
}

.detail-eyebrow {
  font-size: 9px; font-weight: 600; letter-spacing: 0.3em;
  text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 14px;
}
.detail-title {
  font-family: 'Fraunces', serif; font-size: clamp(28px, 3vw, 38px);
  font-weight: 300; color: #fff; line-height: 1.1;
  margin-bottom: 16px; letter-spacing: -0.01em;
}
.detail-title em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.7); }
.detail-desc {
  font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.9;
  max-width: 480px; margin-bottom: 40px; font-weight: 300;
}

.tabs { display: flex; gap: 0; margin-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.tab {
  padding: 11px 18px 11px 0; background: none; border: none; cursor: pointer;
  font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
  text-transform: uppercase; color: rgba(255,255,255,0.22);
  font-family: 'Inter', sans-serif;
  border-bottom: 1px solid transparent; margin-bottom: -1px;
  transition: all 0.2s;
}
.tab:hover { color: rgba(255,255,255,0.6); }
.tab.active { color: #fff; border-bottom-color: rgba(255,255,255,0.65); }

.info-list { display: flex; flex-direction: column; }
.info-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 24px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.16em;
  text-transform: uppercase; color: rgba(255,255,255,0.28); flex-shrink: 0;
}
.info-val { font-size: 13px; color: rgba(255,255,255,0.78); font-weight: 400; text-align: right; }

/* Colors tab — text inputs */
.color-inputs { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.color-input-row { display: flex; flex-direction: column; gap: 6px; }
.color-input-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.18em;
  text-transform: uppercase; color: rgba(255,255,255,0.3);
}
.color-input-field {
  width: 100%; padding: 12px 14px;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  font-size: 13px; font-family: 'Fraunces', serif; font-style: italic;
  background: rgba(255,255,255,0.02); color: #fff; outline: none;
  transition: border-color 0.2s, background 0.2s;
  font-weight: 300;
}
.color-input-field:focus { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.03); }
.color-input-field::placeholder { color: rgba(255,255,255,0.18); font-style: italic; }

/* Dimensions */
.dim-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: rgba(255,255,255,0.04);
  margin-bottom: 24px; border-radius: 10px; overflow: hidden;
}
.dim-cell { padding: 18px 12px; background: #0a0b0c; text-align: center; }
.dim-label { font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 8px; }
.dim-val { font-size: 14px; color: #fff; font-weight: 300; font-family: 'Fraunces', serif; }
.placement { padding: 20px 22px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01); }
.placement-label { font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 10px; }
.placement-text { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.9; margin: 0; font-weight: 300; }

.detail-footer {
  display: flex; gap: 10px; margin-top: 44px;
  padding-top: 26px; border-top: 1px solid rgba(255,255,255,0.05);
}
.btn {
  padding: 13px 24px; border-radius: 8px; cursor: pointer;
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
  text-transform: uppercase; font-family: 'Inter', sans-serif;
  transition: all 0.22s ease; border: 1px solid transparent;
  white-space: nowrap;
}
.btn-primary { flex: 1; background: #475A43; color: #fff; border: none; }
.btn-primary:hover { background: #556A50; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(71,90,67,0.4); }
.btn-primary.is-sel { background: rgba(71,90,67,0.15); color: rgba(255,255,255,0.7); border: 1px solid rgba(71,90,67,0.4); }
.btn-primary.is-sel:hover { border-color: rgba(71,90,67,0.7); background: rgba(71,90,67,0.2); box-shadow: none; }
.btn-ghost { background: transparent; color: rgba(255,255,255,0.38); border: 1px solid rgba(255,255,255,0.08); }
.btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.25); }

/* ── Form ────────────────────────────────────────────────────────────────── */
.form-page {
  min-height: 100vh; background: #0a0b0c; padding: 80px 24px;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex; justify-content: center; font-family: 'Inter', sans-serif;
  animation: fadeIn 0.4s ease; overflow-y: auto;
}
.form-inner { max-width: 580px; width: 100%; }
.form-back {
  background: none; border: none; cursor: pointer; font-size: 12px;
  color: rgba(255,255,255,0.32); margin-bottom: 44px; padding: 0;
  display: flex; align-items: center; gap: 8px; font-weight: 500;
  transition: color 0.2s; font-family: 'Inter', sans-serif;
}
.form-back:hover { color: #fff; }
.form-title {
  font-family: 'Fraunces', serif; font-size: 36px; font-weight: 300;
  color: #fff; margin-bottom: 8px; line-height: 1.15; letter-spacing: -0.01em;
}
.form-title em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.6); }
.form-sub { font-size: 13px; color: rgba(255,255,255,0.28); margin-bottom: 36px; font-weight: 300; }
.form-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 40px; }
.form-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 12px 5px 5px;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  font-size: 11px; color: rgba(255,255,255,0.62);
  background: rgba(255,255,255,0.02);
}
.form-chip img { width: 36px; height: 26px; border-radius: 5px; object-fit: cover; filter: brightness(0.9); }
.form-label {
  font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.28);
  letter-spacing: 0.18em; text-transform: uppercase;
  display: block; margin-bottom: 7px;
}
.form-input {
  width: 100%; padding: 13px 15px;
  border: 1px solid rgba(255,255,255,0.07); border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif;
  background: rgba(255,255,255,0.02); color: #fff; outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.form-input:focus { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.03); }
.form-input::placeholder { color: rgba(255,255,255,0.16); }
.form-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 26px 0; }
.form-section-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.4); margin-bottom: 16px; letter-spacing: 0.1em; text-transform: uppercase; }
.form-submit {
  width: 100%; padding: 15px 0; border-radius: 8px; border: none;
  background: #475A43; color: #fff; font-size: 11px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.14em; text-transform: uppercase;
  font-family: 'Inter', sans-serif; transition: all 0.22s; margin-top: 16px;
}
.form-submit:hover { background: #556A50; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(71,90,67,0.35); }

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
  .expanded { flex-direction: column; overflow-y: auto; }
  .detail-image-panel { width: 100%; height: 60vw; min-height: 240px; position: relative; flex-shrink: 0; }
  .detail-scroll-panel { height: auto; overflow-y: visible; }
  .detail-nav { position: relative; padding: 16px 22px; }
  .detail-content { padding: 32px 22px 60px; }
  .detail-overview-img { display: block; }
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

// ── Story Item ────────────────────────────────────────────────────────────────
function StoryItem({ arrangement, isActive, isSelected, size, animDelay, onClick }) {
  const ringCls = 'story-ring-wrap ' + (isActive ? 'sr-unseen' : isSelected ? 'sr-selected' : 'sr-seen')
  return (
    <button
      className={'story-item' + (isSelected ? ' is-sel' : '')}
      onClick={onClick}
      style={{ animationDelay: `${animDelay}s` }}
      aria-label={arrangement.name || arrangement.title}
    >
      <div className={ringCls} style={{ width: size + 6, height: size + 6, position: 'relative' }}>
        <div className="story-inner" style={{ width: size, height: size }}>
          <img src={arrangement.portrait || arrangement.img} alt={arrangement.name || arrangement.title} />
        </div>
        {isSelected && <div className="story-check">✓</div>}
      </div>
      <span className="story-label">{arrangement.tag}</span>
    </button>
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
function BrowseScreen({ selectedIds, onOpen, onRemove, onPreview, arrangements = [], loading = false }) {
  const [bgIdx, setBgIdx] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
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

  return (
    <div className="browse">
      {bg && <img key={bgIdx} className="browse-hero" src={bg.img || bg.portrait} alt={bg.name || bg.title} />}
      <div className="browse-overlay" />

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
            size={72}
            animDelay={i * 0.18}
            onClick={() => onOpen(a.id)}
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

// ── Color Inputs ──────────────────────────────────────────────────────────────
function ColorInputs() {
  const [colors, setColors] = useState({})

  return (
    <div className="color-inputs">
      {COLOR_ROLES.map(role => (
        <div key={role} className="color-input-row">
          <div className="color-input-label">{role}</div>
          <input
            className="color-input-field"
            value={colors[role] || ''}
            placeholder={role === 'Ribbon color' ? 'e.g. ivory white' : role === 'Primary flower' ? 'e.g. white roses' : role === 'Accent flower' ? 'e.g. pink carnations' : 'e.g. silver eucalyptus'}
            onChange={e => setColors(c => ({ ...c, [role]: e.target.value }))}
          />
        </div>
      ))}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', lineHeight: 1.7, marginTop: 4, fontStyle: 'italic' }}>
        Write in any color or flower name — our florist will match your request as closely as possible.
      </p>
    </div>
  )
}

// ── Expanded / Detail ─────────────────────────────────────────────────────────
function ExpandedView({ activeId, selectedIds, onNavigate, onClose, onToggle, onPreview, arrangements = [] }) {
  const [tab, setTab] = useState('overview')
  const allArrangements = arrangements
  const arr = allArrangements.find(a => a.id === activeId)
  const isSel = selectedIds.includes(activeId)

  useEffect(() => { setTab('overview') }, [activeId])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!arr) return null

  return (
    <div className="expanded">
      {/* Left: image */}
      <div className="detail-image-panel">
        <img key={activeId} src={arr.img || arr.portrait} alt={arr.name || arr.title} />
        <div className="img-overlay" />
        <div className="detail-image-badge">
          <div className="detail-image-badge-tag">{arr.tag} · {arr.note}</div>
          <div className="detail-image-badge-name">
            {(arr.name || arr.title).split(' ').slice(0, -1).join(' ')} <em>{(arr.name || arr.title).split(' ').slice(-1)}</em>
          </div>
        </div>
      </div>

      {/* Right: scrollable info */}
      <div className="detail-scroll-panel">
        <div className="detail-nav">
          <button className="back-btn" onClick={onClose}>← All arrangements</button>
          <div className="detail-stories">
            {allArrangements.map((a, i) => {
              const ringCls = 'detail-story-ring ' + (a.id === activeId ? 'dsr-active' : selectedIds.includes(a.id) ? 'dsr-selected' : 'dsr-normal')
              return (
                <button
                  key={a.id}
                  className="detail-story-item"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  onClick={() => onNavigate(a.id)}
                  aria-label={a.name || a.title}
                >
                  <div className={ringCls} style={{ padding: 2 }}>
                    <div className="detail-story-inner" style={{ width: 36, height: 36 }}>
                      <img src={a.portrait || a.img} alt={a.name || a.title} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="detail-content" key={activeId}>
          {/* Mobile-only overview image */}
          <div className="detail-overview-img">
            <img src={arr.img || arr.portrait} alt={arr.name || arr.title} />
          </div>

          <div className="detail-eyebrow">{arr.tag} · {arr.note}</div>
          <h2 className="detail-title">{arr.name || arr.title}</h2>
          <p className="detail-desc">{arr.desc}</p>

          <div className="tabs">
          {['overview', 'colors', 'dimensions'].map(t => (
              <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="info-list">
              {[['Size', arr.size], ['Flowers', arr.flowers], ['Weight', arr.weight], ['Display', arr.display]].map(([l, v]) => (
                <div key={l} className="info-row">
                  <div className="info-label">{l}</div>
                  <div className="info-val">{v}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'colors' && <ColorInputs />}

          {tab === 'dimensions' && (
            <>
              <div className="dim-grid">
                {[['Width', arr.w], ['Height', arr.h], ['Depth', arr.d], ['Weight', arr.weight], ['Display', arr.display], ['Size', arr.size]].map(([l, v]) => (
                  <div key={l} className="dim-cell">
                    <div className="dim-label">{l}</div>
                    <div className="dim-val">{v}</div>
                  </div>
                ))}
              </div>
              <div className="placement">
                <div className="placement-label">Placement Guide</div>
                <p className="placement-text">{arr.placement}</p>
              </div>
            </>
          )}

          <div className="detail-footer">
            <button className="btn btn-ghost" onClick={onClose}>← Back</button>
            {selectedIds.length > 0 && (
              <button className="btn btn-ghost" onClick={() => { onClose(); onPreview() }}>
                Booking ({selectedIds.length})
              </button>
            )}
            <button
              className={'btn btn-primary' + (isSel ? ' is-sel' : '')}
              onClick={() => onToggle(activeId)}
            >
              {isSel ? '✓ Remove' : '+ Add to Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({ selected, quantities, onBack, onDone, arrangements = [] }) {
  const [form, setForm] = useState({ deceased: '', date: '', location: '', yourName: '', phone: '', email: '', message: '', notes: '' })
  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)
  const allArrangements = arrangements

  const field = (key, placeholder, type = 'text') => ({
    className: 'form-input', type, value: form[key], placeholder,
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const submit = async (e) => {
    e.preventDefault()
    if (!selected.length) { alert('Please select at least one arrangement.'); return }
    try {
      const names = selected.map(id => {
        const arr = allArrangements.find(a => a.id === id)
        return (arr?.name || arr?.title || 'Arrangement') + ' ×' + (quantities[id] || 1)
      }).join(', ')
      await api.post('/florist/bookings', {
        arrangement_name: names,
        deceased_name: form.deceased || null,
        booked_by: form.yourName || null,
        funeral_home: form.location || null,
        date: form.date || null,
        phone: form.phone || null,
        email: form.email || null,
        card_message: form.message || null,
        quantity: totalItems,
        special_instructions: form.notes || null
      })
      onDone(form)
    } catch (error) {
      alert(error.friendlyMessage || 'Failed to submit. Please try again.')
    }
  }

  return (
    <div className="form-page">
      <form className="form-inner" onSubmit={submit}>
        <button type="button" className="form-back" onClick={onBack}>← Back to arrangements</button>
        <h1 className="form-title">Complete Your <em>Booking</em></h1>
        <p className="form-sub">{totalItems} arrangement{totalItems !== 1 ? 's' : ''} selected</p>

        <div className="form-chips">
          {selected.map(id => {
            const a = allArrangements.find(x => x.id === id)
            if (!a) return null
            return (
              <div key={id} className="form-chip">
                <img src={a.img || a.portrait} alt="" />
                {a.name || a.title} ×{quantities[id] || 1}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label className="form-label">Name of Deceased</label><input {...field('deceased', 'Full name')} /></div>
          <div><label className="form-label">Service Date</label><input {...field('date', '', 'date')} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label className="form-label">Funeral Home / Location</label><input {...field('location', 'Name and address of the venue')} /></div>
        <div className="form-divider" />
        <div className="form-section-label">Your Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label className="form-label">Your Name</label><input {...field('yourName', 'First and last name')} /></div>
          <div><label className="form-label">Phone</label><input {...field('phone', '(555) 000-0000', 'tel')} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label className="form-label">Email</label><input {...field('email', 'your@email.com', 'email')} /></div>
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Card Message</label>
          <textarea className="form-input" value={form.message} placeholder="Message for the sympathy card…" rows={3}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical', lineHeight: 1.65 }} />
        </div>
        <div style={{ marginBottom: 32 }}>
          <label className="form-label">Special Instructions <span style={{ opacity: 0.4, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <textarea className="form-input" value={form.notes} placeholder="Any special requests or delivery notes…" rows={3}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical', lineHeight: 1.65 }} />
        </div>
        <button type="submit" className="form-submit">Submit Booking — {totalItems} Arrangement{totalItems !== 1 ? 's' : ''}</button>
      </form>
    </div>
  )
}

// ── Done Screen ───────────────────────────────────────────────────────────────
function DoneScreen({ totalItems, deceased, onReset }) {
  return (
    <div className="done-page">
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
  const [step, setStep] = useState('browse')
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState([])
  const [quantities, setQuantities] = useState({})
  const [doneForm, setDoneForm] = useState({})
  const [arrangements, setArrangements] = useState([])
  const [loading, setLoading] = useState(true)

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

  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {step === 'browse' && (
        <>
          <BrowseScreen
            selectedIds={selected}
            onOpen={id => setExpandedId(id)}
            onRemove={remove}
            onPreview={() => setStep('form')}
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
              onPreview={() => setStep('form')}
              arrangements={arrangements}
            />
          )}
        </>
      )}

      {step === 'form' && (
        <BookingForm
          selected={selected}
          quantities={quantities}
          arrangements={arrangements}
          onBack={() => setStep('browse')}
          onDone={f => { setDoneForm(f); setStep('done') }}
        />
      )}

      {step === 'done' && (
        <DoneScreen
          totalItems={totalItems}
          deceased={doneForm.deceased || ''}
          onReset={() => { setStep('browse'); setSelected([]); setQuantities({}); setExpandedId(null) }}
        />
      )}
    </>
  )
}
