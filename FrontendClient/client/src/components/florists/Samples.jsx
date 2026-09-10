// Samples.jsx
// Haute floral gallery: carousel + stories + detailed expanded view + snow booking form
// Connects to real flower-samples API and flower-bookings flow

import { useState, useRef, useCallback, useEffect } from "react";
import api from "../../api/axios";
import { getTenantId } from "../../utils/globalAuth";
import { Flower2 } from "../../utils/icons/icons";
import Snowfall from "./Snowfall";
import FlowerDetail from "./FlowerDetail";
import FlowerSnowBookingForm from "./FlowerSnowBookingForm";

/* ─── Snow palette ───────────────────────────────────────────────────────── */
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');
:root{
  --paper:#FBF8F4; --ink:#4A3B3C; --ink2:#7A6664; --ink3:#B09A94;
  --rosewood:#8B4557; --blush:#DCAEA6; --blush-xl:#F6E7E2;
  --gold:#C8A262; --hair:#E8E0DA; --hair2:#E0C9C0;
  --serif:'Fraunces',Georgia,serif; --sans:'Inter',sans-serif;
}
.mg-viewport{position:fixed;inset:0;overflow:hidden;background:#000;pointer-events:auto}
.mg-slide{position:absolute;inset:0;transition:opacity .5s ease}
.mg-slide img{width:100%;height:100%;object-fit:cover;display:block}
.mg-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,transparent 35%,transparent 55%,rgba(0,0,0,.75) 100%)}
.mg-stories{position:fixed;top:0;left:0;right:0;z-index:10;padding:20px 24px 12px;display:flex;gap:12px;overflow-x:auto;scrollbar-width:none}
.mg-stories::-webkit-scrollbar{display:none}
.mg-story-item{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;cursor:pointer;transition:transform .2s}
.mg-story-item:hover{transform:scale(1.06)}
.mg-story-ring{width:56px;height:56px;border-radius:50%;padding:2px;display:grid;place-items:center;transition:.25s}
.mg-story-ring.unseen{background:conic-gradient(var(--gold) 0deg,var(--blush-xl) 90deg,var(--gold) 180deg,var(--blush-xl) 270deg,var(--gold) 360deg);box-shadow:0 0 10px rgba(185,132,128,.35)}
.mg-story-ring.seen{background:rgba(255,255,255,.18)}
.mg-story-inner{width:48px;height:48px;border-radius:50%;border:2px solid var(--paper);overflow:hidden;display:grid;place-items:center}
.mg-story-inner img{width:100%;height:100%;object-fit:cover}
.mg-bottom{position:fixed;bottom:0;left:0;right:0;z-index:10;padding:32px 40px 40px;color:#fff}
.mg-badge{display:inline-block;margin-bottom:12px;padding:6px 16px;border-radius:999px;font:700 10px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase}
.mg-badge.premium{background:var(--gold);color:#fff}
.mg-badge.standard{background:rgba(251,246,241,.15);color:rgba(255,255,255,.85)}
.mg-type{font:400 11px/1.2 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.6}
.mg-name{font:400 clamp(2rem,5vw,2.8rem)/1.05 var(--serif);margin:6px 0 10px;letter-spacing:-.01em}
.mg-price{font:300 2rem var(--serif);color:var(--gold)}
.mg-actions{display:flex;align-items:end;justify-content:space-between}
.mg-btn{padding:14px 32px;border-radius:999px;cursor:pointer;font:600 13px 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;transition:opacity .2s;border:none}
.mg-btn.details{background:rgba(251,246,241,.9);color:var(--rosewood)}
.mg-btn.details:hover{opacity:.88}
.mg-dots{display:flex;justify-content:center;gap:8px;margin-top:24px}
.mg-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.3);transition:all .3s;cursor:pointer}
.mg-dot.active{width:22px;background:var(--gold)}
.mg-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:10;width:48px;height:48px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;cursor:pointer;background:rgba(0,0,0,.35);color:#fff;border:1px solid rgba(255,255,255,.15);transition:opacity .2s}
.mg-arrow:hover{opacity:.8}
.mg-arrow.left{left:24px}
.mg-arrow.right{right:24px}
.mg-empty{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--paper);text-align:center;padding:40px}
.mg-empty-icon{opacity:.35;margin-bottom:16px}
.mg-empty h3{font:400 22px var(--serif);color:var(--rosewood);margin-bottom:8px}
.mg-empty p{font:400 15px var(--sans);color:var(--ink3)}
@media (max-width:768px){.mg-bottom{padding:24px 20px 32px}.mg-name{font-size:1.6rem}.mg-price{font-size:1.5rem}.mg-arrow{width:42px;height:42px}}
`;

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Samples() {
  const [arrangements, setArrangements] = useState([]);
  const [current, setCurrent] = useState(0);
  const [detail, setDetail] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  const dragStart = useRef(null);
  const dragging = useRef(false);
  const viewedStories = useRef(new Set());

  // Load arrangements from API
  useEffect(() => {
    const load = async () => {
      try {
        const tenantId = getTenantId();
        const res = await api.get('/florist/flower-samples/', {
          params: { tenant_id: tenantId || undefined },
        });
        const data = res.data?.data || [];
        setArrangements(data);
      } catch (e) {
        console.error('Failed to load arrangements:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Build stories from actual arrangements
  const stories = arrangements.slice().reverse().map((a, i) => ({
    id: a.arrangement_id || i,
    label: (a.title || a.name || 'Arrangement').split(' ')[0],
    arrangementId: a.arrangement_id || a.id,
    img: a.images?.[0]?.url || a.images?.[0] || a.img || '',
    viewed: viewedStories.current.has(a.arrangement_id || i),
  }));

  const goTo = useCallback((idx) => {
    setCurrent(Math.max(0, Math.min(Math.max(arrangements.length - 1, 0), idx)));
  }, [arrangements.length]);

  const arr = arrangements[current] || null;

const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    dragging.current = false;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (dragStart.current === null) return;
    if (Math.abs(e.clientX - dragStart.current) > 6) dragging.current = true;
  };

  const onPointerUp = (e) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (dragging.current) {
      if (delta < -50) goTo(current + 1);
      else if (delta > 50) goTo(current - 1);
    } else {
      setDetail(arr);
    }
    dragStart.current = null;
    dragging.current = false;
  };

  const handleStoryClick = (s) => {
    viewedStories.current.add(s.id);
    const idx = arrangements.findIndex(a => (a.arrangement_id || a.id) === s.arrangementId);
    if (idx >= 0) {
      setCurrent(idx);
      setDetail(arrangements[idx]);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (detail || showBooking) return;
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, goTo, detail, showBooking]);

  const normalizedArrangements = arrangements.map(a => ({
    ...a,
    name: a.title || a.name,
    img: a.images?.[0]?.url || a.images?.[0] || a.img,
    desc: a.desc || a.description || '',
    title: a.title || a.name,
        portrait: a.images?.[0]?.url || a.images?.[0] || a.portrait || a.img,
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Snowfall count={24} opacity={0.5} colors={['#E8909B', '#F3B8AC', '#F6D3A0', '#BFD8A8']} />

      {loading ? (
        <div className="mg-empty">
          <Flower2 size={48} className="mg-empty-icon" />
          <h3>Loading arrangements...</h3>
        </div>
      ) : arrangements.length === 0 ? (
        <div className="mg-empty">
          <Flower2 size={48} className="mg-empty-icon" />
          <h3>No floral samples yet</h3>
          <p>Upload samples in the florist portal to showcase your arrangements here.</p>
        </div>
      ) : (
        <>
          <div className="mg-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {arrangements.map((a, i) => {
              const img = a.images?.[0]?.url || a.images?.[0] || a.img;
              return (
                <div key={a.arrangement_id || a.id} className="mg-slide" style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}>
                  <img src={img} alt={a.title || a.name || 'Arrangement'} draggable={false} />
                </div>
              );
            })}

            <div className="mg-vignette" />

            <div className="mg-stories">
              {stories.map((s) => {
                const isViewing = viewedStories.current.has(s.id);
                return (
                  <button key={s.id} className="mg-story-item" onClick={(e) => { e.stopPropagation(); handleStoryClick(s); }}>
                    <div className={`mg-story-ring ${isViewing ? "seen" : "unseen"}`}>
                      <div className="mg-story-inner">
                        <img src={s.img} alt={s.label} />
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: isViewing ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.85)' }}>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {current > 0 && (
              <button className="mg-arrow left" onClick={(e) => { e.stopPropagation(); goTo(current - 1); }} aria-label="Previous arrangement">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            {current < arrangements.length - 1 && (
              <button className="mg-arrow right" onClick={(e) => { e.stopPropagation(); goTo(current + 1); }} aria-label="Next arrangement">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}

            <div className="mg-bottom">
              {arr?.tag && (<div className={`mg-badge ${arr.tag === "Premium" ? "premium" : "standard"}`}>{arr.tag}</div>)}
              <p className="mg-type">{arr?.types?.[0] || arr?.type || 'Flower Arrangement'}</p>
              <h2 className="mg-name">{arr?.title || arr?.name || 'Arrangement'}</h2>
              <div className="mg-actions">
                <span className="mg-price">${arr?.price || '—'}</span>
                <button className="mg-btn details" onClick={(e) => { e.stopPropagation(); setDetail(arr); }}>View Details</button>
              </div>

              <div className="mg-dots">
                {arrangements.map((_, i) => (
                  <button key={i} className={`mg-dot ${i === current ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); goTo(i); }} />
                ))}
              </div>
            </div>
          </div>

          {detail && (
            <FlowerDetail
              activeId={detail.arrangement_id || detail.id}
              selectedIds={[detail.arrangement_id || detail.id]}
              onNavigate={(id) => {
                const idx = arrangements.findIndex(a => (a.arrangement_id || a.id) === id);
                if (idx >= 0) { setCurrent(idx); setDetail(arrangements[idx]); }
              }}
              onClose={() => setDetail(null)}
              onToggle={() => {}}
              onPreview={() => setShowBooking(true)}
              arrangements={normalizedArrangements}
            />
          )}

          {showBooking && (
            <FlowerSnowBookingForm
              open={showBooking}
              onBooked={() => setShowBooking(false)}
              onClose={() => setShowBooking(false)}
            />
          )}
        </>
      )}
    </>
  );
}