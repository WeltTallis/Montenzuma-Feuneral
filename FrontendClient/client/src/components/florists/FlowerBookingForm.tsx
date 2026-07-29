import React, { useState, useEffect } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────
const ARRANGEMENTS = [
  {
    id: 'wreath', name: 'White Rose Wreath', tag: 'Wreath', note: 'Classic · Eternal',
    desc: 'A hand-tied circular wreath of pristine white roses and eucalyptus. The circle form symbolizes unending love.',
    img: 'https://images.unsplash.com/photo-1758334587549-0c80dbf4dd3e?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1758334587549-0c80dbf4dd3e?w=800&h=1100&fit=crop&auto=format',
    size: '22–39 inches', flowers: "White roses, eucalyptus, baby's breath",
    weight: '8–15 lbs', display: '~3 ft tall on stand',
    w: '22–39"', h: '22–39"', d: '4–6"',
    placement: 'Hangs on a stand at approximately eye level. Ensure at least 3 feet clearance around the full diameter.',
  },
  {
    id: 'cross', name: 'Floral Cross', tag: 'Cross', note: 'Faith · Devotion',
    desc: 'A striking cross form built from deep crimson roses and white carnations. A declaration of faith and reverence.',
    img: 'https://images.unsplash.com/photo-1758334587520-a3b772cea4f5?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1758334587520-a3b772cea4f5?w=800&h=1100&fit=crop&auto=format',
    size: '30–36 inches', flowers: 'Red roses, white carnations, ivy',
    weight: '12–20 lbs', display: '~3.5 ft on pedestal',
    w: '18–24"', h: '30–36"', d: '6–8"',
    placement: 'Stands on a pedestal at the memorial site. Best positioned with a plain wall background.',
  },
  {
    id: 'standing', name: 'Standing Spray', tag: 'Spray', note: 'Graceful · Serene',
    desc: 'A tall, sweeping spray of ivory lilies and mixed greens on an easel stand. Quiet grace beside the casket.',
    img: 'https://images.unsplash.com/photo-1659170704583-962a35464921?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1659170704583-962a35464921?w=800&h=1100&fit=crop&auto=format',
    size: '36–48 inches', flowers: 'Ivory lilies, snapdragons, mixed greens',
    weight: '10–18 lbs', display: '~4.5 ft on easel',
    w: '18–24"', h: '36–48"', d: '12–16"',
    placement: 'Placed on a floor easel beside the casket or portrait. Allow 2 feet behind for the easel legs.',
  },
  {
    id: 'spray-entrance', name: 'Entrance Spray', tag: 'Display', note: 'Welcoming · Grand',
    desc: 'A full, lush arrangement framing the entrance of the service space. A gentle welcome for every mourner.',
    img: 'https://images.unsplash.com/photo-1759579059917-3277455b1e2c?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1759579059917-3277455b1e2c?w=800&h=1100&fit=crop&auto=format',
    size: 'Full entrance width', flowers: 'Seasonal whites and creams',
    weight: '15–25 lbs', display: '~4 ft, full width',
    w: '48–72"', h: '36–48"', d: '12–18"',
    placement: 'Framing the entrance doorway. May require two stands or a custom bracket depending on venue.',
  },
  {
    id: 'casket', name: 'Casket Spray', tag: 'Casket', note: 'Tender · Loving',
    desc: 'Soft pink roses and white hydrangeas draping across the casket lid. The most intimate of all tributes.',
    img: 'https://images.unsplash.com/photo-1687487055520-894d8fcc45a6?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1687487055520-894d8fcc45a6?w=800&h=1100&fit=crop&auto=format',
    size: 'Full casket length', flowers: 'Pink roses, hydrangeas, garden greenery',
    weight: '12–20 lbs', display: 'Full casket length',
    w: '18–24"', h: '8–12"', d: '60–80"',
    placement: 'Placed directly on the casket lid by the funeral home staff. Full casket length coverage.',
  },
  {
    id: 'bouquet', name: 'Sympathy Bouquet', tag: 'Bouquet', note: 'Intimate · Personal',
    desc: 'A hand-held bouquet of white lilies and cream freesias, wrapped in silk ribbon. Immeasurable in meaning.',
    img: 'https://images.unsplash.com/photo-1631407779166-86952be9dbd7?w=1600&h=1000&fit=crop&auto=format',
    portrait: 'https://images.unsplash.com/photo-1631407779166-86952be9dbd7?w=800&h=1100&fit=crop&auto=format',
    size: 'Hand-held', flowers: 'White lilies, cream freesias, satin ribbon',
    weight: '1–2 lbs', display: 'Hand-held',
    w: '8–12"', h: '12–16"', d: '8–12"',
    placement: 'Hand-held or placed on a small table. No floor space required. Ideal for graveside placement.',
  },
]

const COLOR_SCHEMES = [
  { key: 'classic-white', name: 'Classic White', mood: 'Pure · Timeless', desc: 'Pristine white roses with silver eucalyptus', swatches: ['#FAFAFA', '#F0EDE8', '#D5CCBC', '#4A6741'] },
  { key: 'soft-pink', name: 'Soft Blush', mood: 'Tender · Gentle', desc: 'Gentle pinks with dusty miller and sage', swatches: ['#F4C2C2', '#FFE4E1', '#E8B4B8', '#7A8B6F'] },
  { key: 'deep-red', name: 'Deep Crimson', mood: 'Bold · Eternal', desc: 'Rich reds with dark ivy and burgundy ribbon', swatches: ['#8B1A1A', '#DC143C', '#5C1010', '#2D4A2D'] },
  { key: 'lavender', name: 'Lavender Mist', mood: 'Serene · Spiritual', desc: 'Soft lilacs with silver foliage accents', swatches: ['#B8A9C9', '#D4C5E2', '#9B8BB4', '#6B7B6B'] },
  { key: 'sunset-warm', name: 'Sunset Warmth', mood: 'Warm · Celebratory', desc: 'Peach and coral roses with golden touches', swatches: ['#E8A87C', '#FFD4A8', '#C17F59', '#6B7A3C'] },
  { key: 'ivory-gold', name: 'Ivory & Gold', mood: 'Elegant · Regal', desc: 'Cream roses with gold accents and deep greenery', swatches: ['#FFFFF0', '#F5DEB3', '#DAA520', '#3A5F3A'] },
]

// ── Global CSS ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
::-webkit-scrollbar { width: 4px; height: 0; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

@keyframes heroFade   { from { opacity:0; transform: scale(1.05); } to { opacity:1; transform: scale(1); } }
@keyframes fadeUp     { from { opacity:0; transform: translateY(22px); } to { opacity:1; transform: translateY(0); } }
@keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
@keyframes scaleIn    { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
@keyframes stackPop   { 0% { transform:scale(0.5); opacity:0; } 65% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
@keyframes shimmer    { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
@keyframes ringPulse  { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(200,169,110,0.5); } 50% { opacity:0.85; box-shadow:0 0 0 6px rgba(200,169,110,0); } }
@keyframes slideDetailIn { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
@keyframes petalFall  { 0% { transform:translateY(-10vh) rotate(0deg); opacity:0; } 8% { opacity:0.5; } 92% { opacity:0.35; } 100% { transform:translateY(110vh) rotate(600deg); opacity:0; } }

/* Petals */
.petal { position:fixed; pointer-events:none; z-index:9999; opacity:0; animation:petalFall linear infinite; font-style:normal; }
.petal:nth-child(1) { left:5%;  animation-duration:10s;  animation-delay:0s;   font-size:13px; }
.petal:nth-child(2) { left:17%; animation-duration:13s;  animation-delay:2.5s; font-size:17px; }
.petal:nth-child(3) { left:30%; animation-duration:9s;   animation-delay:5s;   font-size:11px; }
.petal:nth-child(4) { left:44%; animation-duration:14s;  animation-delay:1.2s; font-size:15px; }
.petal:nth-child(5) { left:57%; animation-duration:11s;  animation-delay:3.7s; font-size:19px; }
.petal:nth-child(6) { left:70%; animation-duration:8.5s; animation-delay:6s;   font-size:12px; }
.petal:nth-child(7) { left:82%; animation-duration:12s;  animation-delay:0.8s; font-size:21px; }
.petal:nth-child(8) { left:92%; animation-duration:10.5s;animation-delay:4s;   font-size:14px; }

/* ── Browse ─────────────────────────────────────────────────────────────── */
.browse { position:relative; width:100%; height:100vh; overflow:hidden; background:#07111c; font-family:'Inter',sans-serif; }

.browse-hero { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; animation:heroFade 1.4s ease forwards; filter:brightness(0.45) saturate(0.75); }

.browse-overlay {
  position:absolute; inset:0;
  background:linear-gradient(160deg, rgba(7,17,28,0.75) 0%, rgba(7,17,28,0.1) 40%, rgba(7,17,28,0.72) 85%, rgba(7,17,28,0.95) 100%);
}

/* Story strip */
.story-strip {
  position:absolute; top:0; left:0; right:0; z-index:20;
  padding:20px 32px 18px;
  background:linear-gradient(to bottom, rgba(7,17,28,0.88) 0%, rgba(7,17,28,0) 100%);
  display:flex; align-items:flex-start; gap:18px;
  overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;
}
.story-strip::-webkit-scrollbar { display:none; }

.story-item {
  display:flex; flex-direction:column; align-items:center; gap:7px;
  background:none; border:none; cursor:pointer; padding:0;
  flex-shrink:0; position:relative;
  transition:transform 0.25s ease;
}
.story-item:hover { transform:translateY(-3px); }

.story-ring {
  border-radius:50%; padding:3.5px;
  transition:all 0.35s ease;
}
.story-ring.s-active {
  background:conic-gradient(#C8A96E 0deg, #F5DFA0 90deg, #C8A96E 180deg, #E5C276 270deg, #C8A96E 360deg);
  animation:ringPulse 2.4s ease-in-out infinite;
}
.story-ring.s-selected { background:linear-gradient(140deg,#C8A96E,#DAA550,#C8A96E); }
.story-ring.s-normal { background:rgba(255,255,255,0.18); }
.story-ring.s-active-sel {
  background:conic-gradient(#C8A96E 0deg, #F5DFA0 90deg, #C8A96E 180deg, #E5C276 270deg, #C8A96E 360deg);
  animation:ringPulse 2.4s ease-in-out infinite;
}

.story-inner-wrap { width:100%; height:100%; border-radius:50%; overflow:hidden; border:2.5px solid #07111c; }
.story-inner-wrap img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; display:block; }
.story-item:hover .story-inner-wrap img { transform:scale(1.1); }

.story-check-badge {
  position:absolute; top:-1px; right:-1px;
  width:22px; height:22px; border-radius:50%;
  background:#C8A96E; border:2.5px solid #07111c;
  display:flex; align-items:center; justify-content:center;
  font-size:8px; color:#07111c; font-weight:900;
  animation:scaleIn 0.3s cubic-bezier(0.16,1,0.3,1);
}

.story-label-tag {
  font-size:8.5px; font-weight:700; letter-spacing:0.09em;
  text-transform:uppercase; color:rgba(255,255,255,0.38);
  text-align:center; max-width:72px; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; transition:color 0.2s;
}
.story-item:hover .story-label-tag { color:#C8A96E; }
.story-item.story-is-sel .story-label-tag { color:#C8A96E; }

/* Browse wordmark */
.browse-wordmark {
  position:absolute; bottom:52px; left:44px; z-index:10; animation:fadeUp 0.9s ease;
}

/* Browse center */
.browse-center {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-52%);
  text-align:center; pointer-events:none; animation:fadeUp 1s ease;
  width:min(600px, 92vw);
}

/* ── Selected stack ──────────────────────────────────────────────────────── */
.sel-stack {
  position:fixed; bottom:28px; right:28px; z-index:200;
  display:flex; align-items:center; gap:16px;
  animation:fadeIn 0.35s ease;
}
.sel-circles { position:relative; flex-shrink:0; }
.sel-circle {
  position:absolute; border-radius:50%;
  overflow:hidden; border:2.5px solid #07111c;
  box-shadow:0 4px 20px rgba(0,0,0,0.55);
  animation:stackPop 0.35s cubic-bezier(0.16,1,0.3,1);
}
.sel-circle img { width:100%; height:100%; object-fit:cover; display:block; }
.sel-more {
  position:absolute; border-radius:50%;
  background:rgba(10,20,34,0.96); border:2px solid #C8A96E;
  display:flex; align-items:center; justify-content:center;
  font-size:10px; color:#C8A96E; font-weight:800; font-family:'Inter',sans-serif;
}
.sel-cta {
  padding:13px 24px; border-radius:60px;
  background:linear-gradient(135deg,#C8A96E,#DAA550);
  color:#07111c; font-size:11px; font-weight:800;
  letter-spacing:0.12em; text-transform:uppercase;
  font-family:'Inter',sans-serif; border:none; cursor:pointer;
  white-space:nowrap; transition:all 0.22s ease;
  box-shadow:0 8px 32px rgba(200,169,110,0.42);
}
.sel-cta:hover { transform:translateY(-2px); box-shadow:0 14px 44px rgba(200,169,110,0.55); }

/* ── Detail page ─────────────────────────────────────────────────────────── */
.detail-page {
  display:grid; grid-template-columns:54% 46%;
  height:100vh; overflow:hidden;
  background:#07111c; font-family:'Inter',sans-serif;
  animation:fadeIn 0.4s ease;
}
.detail-left { position:relative; overflow:hidden; }
.detail-left-img { width:100%; height:100%; object-fit:cover; animation:heroFade 0.9s ease forwards; display:block; }
.detail-left-overlay {
  position:absolute; inset:0;
  background:
    linear-gradient(to right, transparent 55%, rgba(7,17,28,0.96) 100%),
    linear-gradient(to bottom, rgba(7,17,28,0.72) 0%, transparent 25%);
}
.detail-left-story {
  position:absolute; top:0; left:0; right:0;
  padding:20px 24px 16px;
  background:linear-gradient(to bottom, rgba(7,17,28,0.88) 0%, transparent 100%);
  display:flex; align-items:flex-start; gap:14px;
  overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;
}
.detail-left-story::-webkit-scrollbar { display:none; }
.detail-back-btn {
  display:flex; align-items:center; gap:7px;
  padding:9px 16px; border-radius:60px;
  border:1px solid rgba(255,255,255,0.2);
  background:rgba(7,17,28,0.65); backdrop-filter:blur(12px);
  color:rgba(255,255,255,0.78); font-size:10px; font-weight:700;
  cursor:pointer; font-family:'Inter',sans-serif;
  letter-spacing:0.08em; text-transform:uppercase;
  transition:all 0.2s ease; white-space:nowrap; flex-shrink:0;
}
.detail-back-btn:hover { background:rgba(7,17,28,0.9); color:#fff; border-color:rgba(255,255,255,0.42); }

.detail-right {
  overflow-y:auto; background:#0a1828; display:flex; flex-direction:column;
  border-left:1px solid rgba(255,255,255,0.05);
}
.detail-right-inner { padding:44px 40px; display:flex; flex-direction:column; min-height:100%; animation:slideDetailIn 0.45s cubic-bezier(0.16,1,0.3,1); }

.d-supertitle { font-size:9px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#C8A96E; margin-bottom:10px; }
.d-title { font-family:'Fraunces',serif; font-size:38px; font-weight:400; color:#fff; line-height:1.1; margin:0 0 16px; }
.d-desc {
  font-size:14px; color:rgba(255,255,255,0.52); line-height:1.88;
  border-left:2px solid rgba(200,169,110,0.28); padding-left:16px;
  margin-bottom:28px;
}

.d-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:22px; flex-shrink:0; }
.d-tab {
  padding:12px 20px; border:none; background:none;
  font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
  cursor:pointer; font-family:'Inter',sans-serif; color:rgba(255,255,255,0.28);
  border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.2s;
}
.d-tab:hover { color:rgba(255,255,255,0.6); }
.d-tab.d-tab-active { color:#fff; border-bottom-color:#C8A96E; }

.d-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.d-info-card {
  padding:16px 18px; background:rgba(255,255,255,0.03);
  border-radius:12px; border:1px solid rgba(255,255,255,0.05);
}
.d-info-label { font-size:8px; font-weight:700; color:#C8A96E; text-transform:uppercase; letter-spacing:0.14em; margin-bottom:7px; }
.d-info-val { font-size:13px; color:#fff; font-weight:500; line-height:1.4; }

.d-scheme-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:20px; }
.d-scheme-btn {
  padding:12px; border-radius:10px;
  border:1.5px solid rgba(255,255,255,0.07);
  background:rgba(255,255,255,0.03); cursor:pointer; text-align:left; transition:all 0.18s;
}
.d-scheme-btn:hover { border-color:rgba(200,169,110,0.4); }
.d-scheme-btn.d-scheme-active { border-color:#C8A96E; background:rgba(200,169,110,0.08); }

.d-dim-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:16px; }
.d-dim-card {
  padding:16px 10px; background:rgba(255,255,255,0.03);
  border-radius:10px; border:1px solid rgba(255,255,255,0.05); text-align:center;
}

.d-placement-box {
  padding:18px 20px; background:rgba(200,169,110,0.05);
  border-radius:12px; border:1px solid rgba(200,169,110,0.15);
}

.d-footer {
  margin-top:auto; padding-top:28px; border-top:1px solid rgba(255,255,255,0.06);
  display:flex; gap:10px; align-items:center; flex-shrink:0;
}
.btn-add-booking {
  flex:1; padding:14px 0; border-radius:60px; border:none;
  background:#C8A96E; color:#07111c; font-size:11px; font-weight:800;
  cursor:pointer; letter-spacing:0.12em; text-transform:uppercase;
  font-family:'Inter',sans-serif; transition:all 0.22s;
  box-shadow:0 8px 28px rgba(200,169,110,0.3);
  position:relative; overflow:hidden;
}
.btn-add-booking::after {
  content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
  transform:skewX(-20deg); animation:shimmer 3s ease-in-out infinite;
}
.btn-add-booking:hover { background:#DAA550; transform:translateY(-2px); box-shadow:0 14px 40px rgba(200,169,110,0.5); }
.btn-remove-booking {
  flex:1; padding:14px 0; border-radius:60px;
  border:1.5px solid rgba(100,180,120,0.38);
  background:rgba(42,90,56,0.75); color:#fff; font-size:11px; font-weight:800;
  cursor:pointer; letter-spacing:0.12em; text-transform:uppercase;
  font-family:'Inter',sans-serif; transition:all 0.22s;
}
.btn-remove-booking:hover { background:rgba(58,107,70,0.9); transform:translateY(-2px); }
.btn-ghost-sm {
  padding:13px 18px; border-radius:60px;
  border:1px solid rgba(255,255,255,0.14);
  background:transparent; color:rgba(255,255,255,0.38);
  font-size:11px; font-weight:700; cursor:pointer;
  letter-spacing:0.1em; text-transform:uppercase;
  font-family:'Inter',sans-serif; transition:all 0.2s;
}
.btn-ghost-sm:hover { border-color:rgba(255,255,255,0.38); color:#fff; }

/* ── Form ────────────────────────────────────────────────────────────────── */
.form-page { min-height:100vh; background:#F5F0E8; padding:40px 24px; display:flex; justify-content:center; font-family:'Inter',sans-serif; animation:fadeIn 0.4s ease; }
.form-inner { max-width:580px; width:100%; }
.form-back-btn {
  background:none; border:none; cursor:pointer; font-size:12px; color:#8C9477;
  margin-bottom:28px; display:flex; align-items:center; gap:6px;
  font-family:'Inter',sans-serif; font-weight:500; padding:0; transition:color 0.15s;
}
.form-back-btn:hover { color:#181310; }
.form-input {
  width:100%; padding:13px 16px; border:1px solid #DDD8D0; border-radius:10px;
  font-size:14px; font-family:'Inter',sans-serif;
  background:#fff; color:#181310; outline:none;
  transition:border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus { border-color:#14283A; box-shadow:0 0 0 3px rgba(20,40,58,0.09); }
.form-label { font-size:10px; font-weight:700; color:#8C9477; letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:6px; }
.form-submit {
  width:100%; padding:16px 0; border-radius:60px; border:none;
  background:#14283A; color:#fff; font-size:12px; font-weight:700;
  cursor:pointer; letter-spacing:0.12em; text-transform:uppercase;
  font-family:'Inter',sans-serif; transition:all 0.22s;
  box-shadow:0 8px 24px -6px rgba(20,40,58,0.3);
}
.form-submit:hover { background:#1E3A52; transform:translateY(-2px); }

/* Mini selected chips */
.form-sel-chip {
  display:flex; align-items:center; gap:6px;
  padding:5px 10px 5px 5px;
  background:rgba(20,40,58,0.07); border-radius:20px;
  font-size:11px; color:#181310; font-weight:500;
}

/* ── Done ────────────────────────────────────────────────────────────────── */
.done-page { min-height:100vh; background:#F5F0E8; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; padding:24px; }
.done-inner { max-width:460px; text-align:center; animation:fadeUp 0.5s ease; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width:920px) {
  .detail-page { grid-template-columns:1fr; grid-template-rows:44vh 1fr; height:auto; min-height:100vh; overflow:visible; }
  .detail-left { height:44vh; }
  .detail-left-overlay { background:linear-gradient(to bottom, rgba(7,17,28,0.72) 0%, transparent 30%, rgba(7,17,28,0.7) 100%); }
  .detail-right { overflow-y:visible; border-left:none; border-top:1px solid rgba(255,255,255,0.05); }
  .detail-right-inner { padding:28px 24px 32px; }
  .d-title { font-size:30px; }
  .d-scheme-grid { grid-template-columns:repeat(2,1fr); }
  .d-dim-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width:620px) {
  .story-strip { gap:12px; padding:16px 16px 14px; }
  .browse-wordmark { left:24px; bottom:40px; }
  .browse-center { top:52%; }
  .sel-stack { bottom:20px; right:16px; }
  .d-info-grid { grid-template-columns:1fr; }
  .detail-left-story { gap:10px; padding:16px 16px 12px; }
}
`

// ── Story Item ────────────────────────────────────────────────────────────────
function StoryItem({ arrangement, isActive, isSelected, ringSize, onClick }: {
  arrangement: typeof ARRANGEMENTS[0]
  isActive: boolean; isSelected: boolean; ringSize: number; onClick: () => void
}) {
  let ringClass = 'story-ring '
  if (isActive && isSelected) ringClass += 's-active-sel'
  else if (isActive) ringClass += 's-active'
  else if (isSelected) ringClass += 's-selected'
  else ringClass += 's-normal'

  return (
    <button
      className={`story-item${isSelected ? ' story-is-sel' : ''}`}
      onClick={onClick}
    >
      <div className={ringClass} style={{ width: ringSize, height: ringSize }}>
        <div className="story-inner-wrap">
          <img src={arrangement.portrait} alt={arrangement.name} />
        </div>
      </div>
      {isSelected && <div className="story-check-badge">✓</div>}
      <span className="story-label-tag">{arrangement.tag}</span>
    </button>
  )
}

// ── Selected Stack ────────────────────────────────────────────────────────────
function SelectedStack({ selectedIds, quantities, onContinue }: {
  selectedIds: string[]; quantities: Record<string, number>; onContinue: () => void
}) {
  if (!selectedIds.length) return null
  const total = selectedIds.reduce((s, id) => s + (quantities[id] || 1), 0)
  const visible = selectedIds.slice(0, 4)
  const extra = selectedIds.length - 4
  const sz = 54
  const offset = 30
  const totalW = visible.length * offset + (sz - offset) + (extra > 0 ? offset : 0)

  return (
    <div className="sel-stack">
      <div className="sel-circles" style={{ width: totalW, height: sz }}>
        {visible.map((id, i) => {
          const a = ARRANGEMENTS.find(x => x.id === id)!
          return (
            <div key={id} className="sel-circle" style={{ left: i * offset, width: sz, height: sz, zIndex: visible.length - i }}>
              <img src={a.portrait} alt={a.name} />
            </div>
          )
        })}
        {extra > 0 && (
          <div className="sel-more" style={{ left: 4 * offset, width: sz, height: sz, zIndex: 0 }}>+{extra}</div>
        )}
      </div>
      <button className="sel-cta" onClick={onContinue}>
        Continue · {total} {total === 1 ? 'piece' : 'pieces'}
      </button>
    </div>
  )
}

// ── Browse Screen ─────────────────────────────────────────────────────────────
function BrowseScreen({ selectedIds, onOpen }: { selectedIds: string[]; onOpen: (id: string) => void }) {
  const [bgIdx, setBgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % ARRANGEMENTS.length), 5200)
    return () => clearInterval(t)
  }, [])

  const bg = ARRANGEMENTS[bgIdx]

  return (
    <div className="browse">
      <img key={bgIdx} className="browse-hero" src={bg.img} alt={bg.name} />
      <div className="browse-overlay" />

      {/* Story strip */}
      <div className="story-strip">
        {ARRANGEMENTS.map(a => (
          <StoryItem
            key={a.id}
            arrangement={a}
            isActive={false}
            isSelected={selectedIds.includes(a.id)}
            ringSize={78}
            onClick={() => onOpen(a.id)}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="browse-center">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#C8A96E', marginBottom: 18, fontFamily: "'Inter',sans-serif" }}>
          Funeral Floral Arrangements
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(34px, 5.5vw, 58px)', fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
          Choose your<br /><em style={{ fontStyle: 'italic', fontWeight: 300 }}>floral tribute</em>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, fontFamily: "'Inter',sans-serif", maxWidth: 400, margin: '0 auto' }}>
          Tap an arrangement above to explore details and add to your service booking.
        </p>
      </div>

      {/* Wordmark */}
      <div className="browse-wordmark">
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
          Floral Tributes
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginTop: 3, fontFamily: "'Inter',sans-serif" }}>
          Est. since care began
        </div>
      </div>
    </div>
  )
}

// ── Detail Page ───────────────────────────────────────────────────────────────
function DetailPage({ activeId, selectedIds, onNavigate, onBack, onToggle }: {
  activeId: string; selectedIds: string[];
  onNavigate: (id: string) => void; onBack: () => void; onToggle: (id: string) => void
}) {
  const [tab, setTab] = useState<'overview' | 'colors' | 'dimensions'>('overview')
  const [scheme, setScheme] = useState(COLOR_SCHEMES[0])
  const arr = ARRANGEMENTS.find(a => a.id === activeId)!
  const isSel = selectedIds.includes(activeId)

  useEffect(() => { setTab('overview') }, [activeId])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onBack])

  return (
    <div className="detail-page">
      {/* LEFT: image panel */}
      <div className="detail-left">
        <img key={activeId} className="detail-left-img" src={arr.portrait} alt={arr.name} />
        <div className="detail-left-overlay" />

        {/* Story strip overlay on image */}
        <div className="detail-left-story">
          <button className="detail-back-btn" onClick={onBack}>
            ← Back
          </button>
          {ARRANGEMENTS.map(a => (
            <StoryItem
              key={a.id}
              arrangement={a}
              isActive={a.id === activeId}
              isSelected={selectedIds.includes(a.id)}
              ringSize={58}
              onClick={() => onNavigate(a.id)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: content panel */}
      <div className="detail-right">
        <div className="detail-right-inner" key={activeId}>
          <div className="d-supertitle">{arr.tag} · {arr.note}</div>
          <h2 className="d-title">{arr.name}</h2>
          <p className="d-desc">{arr.desc}</p>

          {/* Tabs */}
          <div className="d-tabs">
            {(['overview', 'colors', 'dimensions'] as const).map(t => (
              <button key={t} className={`d-tab${tab === t ? ' d-tab-active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1 }} key={tab}>
            {tab === 'overview' && (
              <div className="d-info-grid">
                {[['Size', arr.size], ['Flowers', arr.flowers], ['Weight', arr.weight], ['Display', arr.display]].map(([l, v]) => (
                  <div key={l} className="d-info-card">
                    <div className="d-info-label">{l}</div>
                    <div className="d-info-val">{v}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'colors' && (
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>
                  Select a palette to visualize this arrangement.
                </p>
                <div className="d-scheme-grid">
                  {COLOR_SCHEMES.map(s => (
                    <button key={s.key} className={`d-scheme-btn${scheme.key === s.key ? ' d-scheme-active' : ''}`} onClick={() => setScheme(s)}>
                      <div style={{ display: 'flex', gap: 3, marginBottom: 9 }}>
                        {s.swatches.map((c, i) => (
                          <div key={i} style={{ flex: 1, height: 22, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 2, fontFamily: "'Inter',sans-serif" }}>{s.name}</div>
                      <div style={{ fontSize: 8, color: '#C8A96E', fontWeight: 600, letterSpacing: '0.08em', fontFamily: "'Inter',sans-serif" }}>{s.mood}</div>
                    </button>
                  ))}
                </div>
                <div style={{ padding: '16px 18px', background: 'rgba(200,169,110,0.06)', borderRadius: 12, border: '1px solid rgba(200,169,110,0.16)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#C8A96E', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
                    {scheme.name} — {scheme.desc}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {['Primary', 'Accent', 'Ribbon', 'Foliage'].map((label, i) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 9, background: scheme.swatches[i], border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }} />
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', textAlign: 'center', fontFamily: "'Inter',sans-serif" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'dimensions' && (
              <div>
                <div className="d-dim-grid">
                  {[['Width', arr.w, '↔'], ['Height', arr.h, '↕'], ['Depth', arr.d, '⇥'], ['Weight', arr.weight, '⚖'], ['Display', arr.display, '◻'], ['Placement', arr.size, '📍']].map(([l, v, icon]) => (
                    <div key={l} className="d-dim-card">
                      <div style={{ fontSize: 18, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#C8A96E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontFamily: "'Inter',sans-serif" }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, fontFamily: "'Inter',sans-serif" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="d-placement-box">
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#C8A96E', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>Placement Guide</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.82, margin: 0, fontFamily: "'Inter',sans-serif" }}>{arr.placement}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="d-footer">
            <button className="btn-ghost-sm" onClick={onBack}>← Back</button>
            <button
              className={isSel ? 'btn-remove-booking' : 'btn-add-booking'}
              onClick={() => onToggle(activeId)}
            >
              {isSel ? '✓ Remove from Booking' : '+ Add to Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({ selected, quantities, onBack, onDone }: {
  selected: string[]; quantities: Record<string, number>;
  onBack: () => void; onDone: (f: Record<string, string>) => void
}) {
  const [form, setForm] = useState({ deceased: '', date: '', location: '', yourName: '', phone: '', email: '', message: '', notes: '' })
  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)

  const field = (key: keyof typeof form, placeholder: string, type = 'text') => ({
    className: 'form-input', type, value: form[key], placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected.length) { alert('Please select at least one arrangement.'); return }
    try {
      const names = selected.map(id => `${ARRANGEMENTS.find(a => a.id === id)!.name} ×${quantities[id] || 1}`).join(', ')
      await fetch('/api/v1/restpoint/florist/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': localStorage.getItem('tenantSlug') || 'default' },
        body: JSON.stringify({ arrangement_name: names, deceased_name: form.deceased, booked_by: form.yourName, funeral_home: form.location, date: form.date, phone: form.phone, email: form.email, card_message: form.message, quantity: totalItems, special_instructions: form.notes }),
      })
      onDone(form)
    } catch { alert('Failed to submit. Please try again.') }
  }

  return (
    <div className="form-page">
      <form className="form-inner" onSubmit={submit}>
        <button type="button" className="form-back-btn" onClick={onBack}>← Back to arrangements</button>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 500, color: '#181310', marginBottom: 4 }}>Complete Your Booking</h1>
        <p style={{ fontSize: 13, color: '#8C9477', marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>{totalItems} arrangement{totalItems !== 1 ? 's' : ''} selected</p>

        {/* Selected chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {selected.map(id => {
            const a = ARRANGEMENTS.find(x => x.id === id)!
            return (
              <div key={id} className="form-sel-chip">
                <img src={a.portrait} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
                {a.name} ×{quantities[id] || 1}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div><label className="form-label">Name of Deceased</label><input {...field('deceased', 'Full name')} /></div>
          <div><label className="form-label">Service Date</label><input {...field('date', '', 'date')} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label className="form-label">Funeral Home / Location</label><input {...field('location', 'Name and address of the service venue')} /></div>
        <div style={{ height: 1, background: '#E8E0D4', margin: '20px 0' }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: '#181310', marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>Your Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <div><label className="form-label">Your Name</label><input {...field('yourName', 'First and last name')} /></div>
          <div><label className="form-label">Phone</label><input {...field('phone', '(555) 000-0000', 'tel')} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label className="form-label">Email</label><input {...field('email', 'your@email.com', 'email')} /></div>
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Card Message</label>
          <textarea className="form-input" value={form.message} placeholder="Message to be printed on the sympathy card…" rows={3}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical', lineHeight: 1.65 }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label className="form-label">Special Instructions</label>
          <textarea className="form-input" value={form.notes} placeholder="Any special requests, delivery instructions…" rows={3}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical', lineHeight: 1.65 }} />
        </div>
        <button type="submit" className="form-submit">Submit Booking — {totalItems} Arrangement{totalItems !== 1 ? 's' : ''}</button>
      </form>
    </div>
  )
}

// ── Done Screen ───────────────────────────────────────────────────────────────
function DoneScreen({ totalItems, deceased, onReset }: { totalItems: number; deceased: string; onReset: () => void }) {
  return (
    <div className="done-page">
      <div className="done-inner">
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#14283A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: 26, color: '#C8A96E', animation: 'scaleIn 0.4s ease' }}>✦</div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 500, color: '#181310', marginBottom: 12, lineHeight: 1.2 }}>
          Your booking<br /><em style={{ color: '#14283A' }}>has been received.</em>
        </h1>
        <p style={{ fontSize: 14, color: '#6B6358', lineHeight: 1.8, marginBottom: 32, fontFamily: "'Inter',sans-serif" }}>
          We will confirm your <strong style={{ color: '#181310' }}>{totalItems} arrangement{totalItems !== 1 ? 's' : ''}</strong>
          {deceased ? <> for <strong style={{ color: '#181310' }}>{deceased}</strong></> : ' for the service'} within a few hours.
        </p>
        <button
          onClick={onReset}
          style={{ padding: '13px 28px', borderRadius: 60, border: 'none', background: '#14283A', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", transition: 'all 0.22s', boxShadow: '0 8px 24px -6px rgba(20,40,58,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1E3A52'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#14283A'; e.currentTarget.style.transform = '' }}
        >
          Start a new booking
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState<'browse' | 'detail' | 'form' | 'done'>('browse')
  const [activeId, setActiveId] = useState<string>(ARRANGEMENTS[0].id)
  const [selected, setSelected] = useState<string[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [doneForm, setDoneForm] = useState<Record<string, string>>({})

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        setQuantities(q => { const n = { ...q }; delete n[id]; return n })
        return prev.filter(x => x !== id)
      }
      setQuantities(q => ({ ...q, [id]: 1 }))
      return [...prev, id]
    })
  }

  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Ambient petals */}
      {(step === 'browse' || step === 'detail') && (
        <>
          <span className="petal">🌸</span><span className="petal">🩷</span>
          <span className="petal">✿</span><span className="petal">❀</span>
          <span className="petal">🤍</span><span className="petal">🌸</span>
          <span className="petal">✿</span><span className="petal">❀</span>
        </>
      )}

      {step === 'browse' && (
        <BrowseScreen
          selectedIds={selected}
          onOpen={id => { setActiveId(id); setStep('detail') }}
        />
      )}

      {step === 'detail' && (
        <DetailPage
          activeId={activeId}
          selectedIds={selected}
          onNavigate={id => setActiveId(id)}
          onBack={() => setStep('browse')}
          onToggle={toggle}
        />
      )}

      {step === 'form' && (
        <BookingForm
          selected={selected}
          quantities={quantities}
          onBack={() => setStep('browse')}
          onDone={f => { setDoneForm(f); setStep('done') }}
        />
      )}

      {step === 'done' && (
        <DoneScreen
          totalItems={totalItems}
          deceased={doneForm.deceased || ''}
          onReset={() => { setStep('browse'); setSelected([]); setQuantities({}) }}
        />
      )}

      {/* Persistent selected stack — visible on browse + detail */}
      {(step === 'browse' || step === 'detail') && (
        <SelectedStack
          selectedIds={selected}
          quantities={quantities}
          onContinue={() => setStep('form')}
        />
      )}
    </>
  )
}