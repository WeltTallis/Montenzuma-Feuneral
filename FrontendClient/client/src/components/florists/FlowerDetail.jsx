// FlowerDetail.jsx
// ── Expanded arrangement view — botanical rosewood & cream ────────────────────
// Imported and used by Samples.jsx as <ExpandedView />. Includes swipe
// navigation (← / → between arrangements · swipe down to close), the floating
// booking cart, and all of its own styles.

import { useState, useEffect, useRef, useCallback } from 'react'

const DETAIL_CSS = `
/* ── Expanded / Detail — botanical palette ────────────────────────────────── */
.expanded {
  position: fixed; inset: 0; z-index: 100;
  background: #FBF6F1; display: flex;
  animation: fadeIn 0.22s ease;
}
.detail-image-panel {
  position: sticky; top: 0;
  width: 52%; height: 100vh; flex-shrink: 0;
  height: 100dvh; /* Dynamic viewport height for mobile */
  overflow: hidden; background: #F0E3DC;
  touch-action: pan-y;
}
.detail-image-panel.dragging { cursor: grabbing; }
.detail-image-drag { position: absolute; inset: 0; will-change: transform; }
.detail-image-panel img {
  width: 100%; height: 100%; object-fit: cover; object-position: center;
  display: block; animation: heroFade 0.7s ease forwards;
  filter: brightness(0.94) saturate(0.98);
}
.detail-image-panel .img-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(150deg, rgba(251,246,241,0.18) 0%, transparent 55%);
  pointer-events: none;
}
.detail-image-badge { position: absolute; bottom: 36px; left: 36px; animation: fadeUp 0.6s ease 0.2s both; }
.detail-image-badge-tag {
  font: 600 9px 'Karla', sans-serif; letter-spacing: 0.3em; text-transform: uppercase;
  color: rgba(255,255,255,0.85); margin-bottom: 8px; text-shadow: 0 1px 8px rgba(74,59,60,0.55);
}
.detail-image-badge-name {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 600;
  color: #fff; line-height: 1.1; letter-spacing: -0.01em; text-shadow: 0 2px 12px rgba(74,59,60,0.6);
}
.detail-image-badge-name em { font-style: italic; font-weight: 500; }
.detail-scroll-panel {
  flex: 1; height: 100vh; overflow-y: auto;
  height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex; flex-direction: column;
}
.detail-nav {
  position: sticky; top: 0; z-index: 10;
  padding: 22px 38px;
  background: rgba(251,246,241,0.92); backdrop-filter: blur(18px);
  border-bottom: 1px solid #F0E3DC;
  display: flex; align-items: center; justify-content: space-between;
}
.back-btn {
  background: none; border: none; cursor: pointer;
  color: #7A6664; font: 500 12px 'Karla', sans-serif;
  display: flex; align-items: center; gap: 8px;
  transition: color 0.2s; padding: 0;
}
.back-btn:hover { color: #6B4045; }
.detail-stories { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; max-width: 320px; }
.detail-stories::-webkit-scrollbar { display: none; }
.detail-story-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
  animation: storyFloat 3.2s ease-in-out infinite;
}
.detail-story-ring { border-radius: 50%; padding: 2px; transition: transform 0.25s; }
.detail-story-ring.dsr-active {
  background: conic-gradient(#B98480 0deg, #E0C9C0 90deg, #B98480 180deg, #E0C9C0 270deg, #B98480 360deg);
  box-shadow: 0 0 10px rgba(185,132,128,0.35);
}
.detail-story-ring.dsr-selected { background: linear-gradient(135deg, #6B4045, #B98480); }
.detail-story-ring.dsr-normal { background: rgba(107,64,69,0.18); }
.detail-story-inner { border-radius: 50%; overflow: hidden; border: 2px solid #FBF6F1; background: #F6E7E2; }
.detail-story-inner img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.92); }
.detail-story-item:hover .detail-story-ring { transform: scale(1.08); }
.detail-story-item:hover .detail-story-inner img { filter: brightness(1); }

/* swipe affordances */
.swipe-hint {
  position: absolute; top: 50%; transform: translateY(-50%); z-index: 15;
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(74,59,60,0.45); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.85); cursor: pointer;
  font-size: 18px; line-height: 1; padding: 0 0 3px;
  font-family: 'Cormorant Garamond', serif; user-select: none;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.swipe-hint:hover { background: rgba(107,64,69,0.85); color: #fff; transform: translateY(-50%) scale(1.07); }
.swipe-hint.prev { left: 16px; }
.swipe-hint.next { right: 16px; }
.swipe-counter {
  position: absolute; top: 18px; right: 18px; z-index: 15;
  padding: 5px 12px; border-radius: 20px;
  background: rgba(74,59,60,0.5); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  font: 600 10px 'Karla', sans-serif; letter-spacing: 0.14em;
  color: rgba(255,255,255,0.85); font-variant-numeric: tabular-nums;
}
.swipe-down-hint {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 15; display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.8); font: 600 8px 'Karla', sans-serif;
  letter-spacing: 0.24em; text-transform: uppercase; white-space: nowrap;
  pointer-events: none; animation: hintPulse 2.6s ease-in-out infinite;
  text-shadow: 0 1px 8px rgba(74,59,60,0.65);
}
* { -webkit-tap-highlight-color: transparent; }
button:focus-visible, [role="button"]:focus-visible { outline: 2px solid #B98480; outline-offset: 2px; }
@keyframes lovePop { 0% { transform: scale(0.4); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }
.love-col {
  position: absolute; right: 16px; bottom: 130px; z-index: 15;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.love-btn {
  width: 42px; height: 42px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.28); background: rgba(74,59,60,0.45);
  backdrop-filter: blur(8px); color: #fff;
  display: grid; place-items: center; cursor: pointer;
  transition: transform 0.2s, background 0.2s; padding: 0;
}
.love-btn svg { width: 19px; height: 19px; }
.love-btn:hover { transform: scale(1.08); }
.love-btn.is-liked { background: #C8264A; border-color: transparent; }
.love-btn.is-liked svg { animation: lovePop 0.35s cubic-bezier(0.16,1,0.3,1); }
.love-num { font: 600 11px 'Karla', sans-serif; color: #fff; text-shadow: 0 1px 6px rgba(74,59,60,0.6); font-variant-numeric: tabular-nums; }

/* TikTok-style floating hearts — rise + fade from the ♥ button on every tap */
@keyframes floatHeart {
  0% { transform: translate3d(0, 0, 0) scale(0.5) rotate(0deg); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: translate3d(var(--fhx, 14px), -120px, 0) scale(1.15) rotate(var(--fhr, 18deg)); opacity: 0; }
}
.float-heart {
  position: absolute; right: 6px; bottom: 44px; z-index: 16;
  width: var(--fhs, 18px); height: var(--fhs, 18px);
  color: #C8264A; pointer-events: none;
  animation: floatHeart var(--fhd, 1.1s) cubic-bezier(0.2,0.6,0.4,1) forwards;
}
.float-heart svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 2px 5px rgba(200,38,74,0.45)); }
@media (prefers-reduced-motion: reduce) { .float-heart { display: none; } }

/* content */
.detail-content { padding: 48px 38px 80px; flex: 1; }
.detail-overview-img {
  width: 100%; height: 220px; border-radius: 10px; overflow: hidden;
  margin-bottom: 32px; background: #F0E3DC; display: none;
}
.detail-overview-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.detail-eyebrow {
  font: 600 9px 'Karla', sans-serif; letter-spacing: 0.3em;
  text-transform: uppercase; color: #B98480; margin-bottom: 14px;
}
.detail-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(28px, 3vw, 38px); font-weight: 600; color: #6B4045;
  line-height: 1.1; margin-bottom: 16px; letter-spacing: 0;
}
.detail-title em { font-style: italic; font-weight: 500; color: #B98480; }
.detail-desc { font-size: 13px; color: #7A6664; line-height: 1.9; max-width: 480px; margin-bottom: 40px; font-weight: 400; }

.tabs { display: flex; gap: 0; margin-bottom: 32px; border-bottom: 1px solid #F0E3DC; }
.tab {
  padding: 11px 18px 11px 0; background: none; border: none; cursor: pointer;
  font: 600 10px 'Karla', sans-serif; letter-spacing: 0.16em; text-transform: uppercase;
  color: #B09A94; border-bottom: 1px solid transparent; margin-bottom: -1px;
  transition: all 0.2s;
}
.tab:hover { color: #6B4045; }
.tab.active { color: #6B4045; border-bottom-color: #B98480; }

.info-list { display: flex; flex-direction: column; }
.info-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 16px 0; border-bottom: 1px solid #F0E3DC; gap: 24px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  font: 600 9px 'Karla', sans-serif; letter-spacing: 0.16em;
  text-transform: uppercase; color: #7A6664; flex-shrink: 0;
}
.info-val { font-size: 13px; color: #4A3B3C; font-weight: 400; text-align: right; }

/* Colors tab — text inputs */
.color-inputs { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.color-input-row { display: flex; flex-direction: column; gap: 6px; }
.color-input-label { font: 600 9px 'Karla', sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #7A6664; }
.color-input-field {
  width: 100%; padding: 12px 14px;
  border: 1px solid #E0C9C0; border-radius: 8px;
  font: italic 500 14px 'Cormorant Garamond', Georgia, serif;
  background: #FFFEFB; color: #4A3B3C; outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.color-input-field:focus { border-color: #B98480; background: #fff; }
.color-input-field::placeholder { color: #B09A94; font-style: italic; }

/* Dimensions */
.dim-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: #F0E3DC;
  margin-bottom: 24px; border-radius: 10px; overflow: hidden;
}
.dim-cell { padding: 18px 12px; background: #FBF6F1; text-align: center; }
.dim-label { font: 600 9px 'Karla', sans-serif; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6664; margin-bottom: 8px; }
.dim-val { font-size: 15px; color: #6B4045; font-weight: 600; font-family: 'Cormorant Garamond', Georgia, serif; }
.placement { padding: 20px 22px; border-radius: 10px; border: 1px solid #F0E3DC; background: #F6E7E2; }
.placement-label { font: 600 9px 'Karla', sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #B98480; margin-bottom: 10px; }
.placement-text { font-size: 13px; color: #7A6664; line-height: 1.9; margin: 0; font-weight: 400; }

.detail-footer {
  display: flex; gap: 10px; margin-top: 44px;
  padding-top: 26px; border-top: 1px solid #F0E3DC;
}
.btn {
  padding: 13px 24px; border-radius: 8px; cursor: pointer;
  font: 600 10px 'Karla', sans-serif; letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: all 0.22s ease; border: 1px solid transparent;
  white-space: nowrap;
}
.btn-primary { flex: 1; background: #6B4045; color: #FBF3EE; border: none; }
.btn-primary:hover { background: #573438; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(107,64,69,0.35); }
.btn-primary.is-sel { background: rgba(107,64,69,0.12); color: #6B4045; border: 1px solid rgba(107,64,69,0.4); }
.btn-primary.is-sel:hover { border-color: #6B4045; background: rgba(107,64,69,0.18); box-shadow: none; }
.btn-ghost { background: #FFFEFB; color: #7A6664; border: 1px solid #E0C9C0; }
.btn-ghost:hover { color: #6B4045; border-color: #B98480; }

/* small floating booking cart (bottom right) */
.fs-cart {
  position: fixed; bottom: 24px; right: 24px; z-index: 150;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px 12px 14px; border-radius: 999px; border: none;
  background: #6B4045; color: #F3E6DC; cursor: pointer;
  font: 700 .72rem 'Karla', sans-serif; letter-spacing: .16em; text-transform: uppercase;
  box-shadow: 0 12px 30px rgba(107,64,69,0.4); transition: all 0.22s;
  animation: fadeIn 0.3s ease;
}
.fs-cart:hover { background: #573438; transform: translateY(-2px); }
.fs-cart-icon { width: 18px; height: 18px; display: grid; place-items: center; }
.fs-cart-icon svg { width: 18px; height: 18px; }
.fs-cart-count {
  min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px;
  background: #C8A262; color: #fff; font-size: 11px; font-weight: 700;
  display: grid; place-items: center;
}

@media (max-width: 900px) {
  .expanded { flex-direction: column; overflow-y: auto; }
  .detail-image-panel { width: 100%; height: 60vw; min-height: 240px; position: relative; flex-shrink: 0; }
  .detail-scroll-panel { height: auto; overflow-y: visible; }
  .detail-nav { position: relative; padding: 16px 22px; }
  .detail-content { padding: 32px 22px 60px; }
  .detail-overview-img { display: block; }
  .fs-cart { bottom: 18px; right: 18px; }
}
`

const COLOR_ROLES = ['Primary flower', 'Accent flower', 'Ribbon color', 'Foliage']

// ── Colors tab — text inputs ──────────────────────────────────────────────────
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
      <p style={{ fontSize: 12, color: '#B09A94', lineHeight: 1.7, marginTop: 4, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Write in any color or flower name — our florist will match your request as closely as possible.
      </p>
    </div>
  )
}

// ── Expanded / Detail view ────────────────────────────────────────────────────
// Compact count formatter — 999 → "999" · 1000 → "1k" · 14500 → "14.5k" · 2M → "2M"
const fmtDetailCount = (n) => {
  const v = Number(n) || 0
  if (v >= 1000000) return `${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`
  return String(v)
}

export default function ExpandedView({ activeId, selectedIds, onNavigate, onClose, onToggle, onPreview, arrangements = [], likes = {}, likedIds = [], onToggleLike }) {
  const [tab, setTab] = useState('overview')
  const allArrangements = arrangements
  const arr = allArrangements.find(a => a.id === activeId)
  const isSel = selectedIds.includes(activeId)
  const idx = allArrangements.findIndex(a => a.id === activeId)
  const count = allArrangements.length

  // ── Swipe navigation state ──
  const touchRef = useRef(null)
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })

  useEffect(() => { setTab('overview'); setDrag({ x: 0, y: 0, active: false }) }, [activeId])

  const goPrev = useCallback(() => {
    if (count > 1) onNavigate(allArrangements[(idx - 1 + count) % count].id)
  }, [allArrangements, count, idx, onNavigate])
  const goNext = useCallback(() => {
    if (count > 1) onNavigate(allArrangements[(idx + 1) % count].id)
  }, [allArrangements, count, idx, onNavigate])

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, goPrev, goNext])

  // ── Swipe: ← / → move between arrangements · swipe down closes ──
  const onTouchStart = (e) => {
    touchRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, last: { x: 0, y: 0 } }
    setDrag({ x: 0, y: 0, active: true })
  }
  const onTouchMove = (e) => {
    if (!touchRef.current) return
    const dx = e.touches[0].clientX - touchRef.current.sx
    const dy = e.touches[0].clientY - touchRef.current.sy
    touchRef.current.last = { x: dx, y: dy }
    // Visual drag follows HORIZONTAL movement only — vertical swipes belong to
    // page scroll, so the layout never scatters while scrolling up/down.
    if (Math.abs(dx) > Math.abs(dy) + 6) setDrag({ x: dx, y: 0, active: true })
    else if (Math.abs(dy) > Math.abs(dx)) setDrag({ x: 0, y: 0, active: false })
  }
  const onTouchEnd = () => {
    const last = (touchRef.current && touchRef.current.last) || { x: 0, y: 0 }
    touchRef.current = null
    setDrag({ x: 0, y: 0, active: false })
    const SWIPE = 60
    if (Math.abs(last.x) > Math.abs(last.y) && Math.abs(last.x) > SWIPE) {
      if (last.x < -SWIPE) goNext()      // swipe left → next arrangement
      else if (last.x > SWIPE) goPrev()  // swipe right → previous arrangement
    }
  }

  if (!arr) return null

  return (
    <div className="expanded">
      {/* Left: image — swipe ← / → to browse · swipe down to close */}
      <div
        className={'detail-image-panel' + (drag.active ? ' dragging' : '')}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="detail-image-drag"
          style={{
            transform: `translate3d(${drag.x * 0.18}px, 0, 0)`,
            transition: drag.active ? 'none' : 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <img key={activeId} src={arr.img || arr.portrait} alt={arr.name || arr.title} />
        </div>
        <div className="img-overlay" />
        {count > 1 && (
          <>
            <button className="swipe-hint prev" onClick={goPrev} aria-label="Previous arrangement">‹</button>
            <button className="swipe-hint next" onClick={goNext} aria-label="Next arrangement">›</button>
            <div className="swipe-counter">{idx + 1} / {count}</div>
          </>
        )}
        <div className="swipe-down-hint"><span>‹ ›</span><span>swipe to browse</span></div>
        <div className="love-col">
          <button
            className={'love-btn' + (likedIds.includes(activeId) ? ' is-liked' : '')}
            onClick={() => onToggleLike(activeId)}
            aria-label="Love this arrangement"
          >
            <svg viewBox="0 0 24 24" fill={likedIds.includes(activeId) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5S4.9 16 3.2 11.6C2 8.6 3.7 5.5 6.8 5.5c2 0 3.6 1.2 4.4 2.9L12 10l.8-1.6c.8-1.7 2.4-2.9 4.4-2.9 3.1 0 4.8 3.1 3.6 6.1C19.1 16 12 20.5 12 20.5Z" /></svg>
          </button>
                    <span className="love-num">{fmtDetailCount(likes[activeId] ?? 0)}</span>
        </div>
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
            <button
              className={'btn btn-primary' + (isSel ? ' is-sel' : '')}
              onClick={() => onToggle(activeId)}
            >
              {isSel ? '✓ Remove' : '+ Add to Booking'}
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <button className="fs-cart" onClick={() => { onClose(); onPreview() }} aria-label="Go to booking">
          <span className="fs-cart-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" />
              <path d="M4 20c4-6.5 8.5-10 13-12.5" />
            </svg>
          </span>
          <span>Booking</span>
          <span className="fs-cart-count">{selectedIds.length}</span>
        </button>
      )}
    </div>
  )
}