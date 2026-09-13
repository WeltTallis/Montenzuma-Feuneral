// Samples.jsx
// Haute floral gallery: carousel + stories + detailed expanded view + snow booking form
// Connects to real flower-samples API and flower-bookings flow

import { useState, useRef, useCallback, useEffect } from "react";
import api from "../../api/axios";
import { getTenantId } from "../../utils/globalAuth";
import { Flower2 } from "../../utils/icons/icons";
import Snowfall from "./Snowfall";
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
.mg-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .5s ease;overflow:hidden;background:#0d090b}
.mg-slide img{width:min(100%,1600px);height:100%;object-fit:contain;background:rgba(12,10,12,.22);display:block;user-select:none;-webkit-user-drag:none}
.mg-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,transparent 35%,transparent 55%,rgba(0,0,0,.75) 100%)}
.mg-stories{position:fixed;top:14px;left:18px;right:18px;z-index:10;display:flex;align-items:flex-start;gap:10px;overflow-x:auto;scrollbar-width:none;padding:10px 6px 8px}
.mg-stories::-webkit-scrollbar{display:none}
.mg-story-item{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;cursor:pointer;transition:transform .2s;max-width:74px;background:transparent;border:none;padding:0;box-shadow:none}
.mg-story-item:hover{transform:translateY(-1px)}
.mg-story-ring{width:56px;height:56px;border-radius:50%;padding:2px;display:grid;place-items:center;transition:.25s;background:rgba(255,255,255,.08)}
.mg-story-ring.unseen{background:conic-gradient(var(--gold) 0deg,var(--blush-xl) 90deg,var(--gold) 180deg,var(--blush-xl) 270deg,var(--gold) 360deg);box-shadow:0 0 0 1px rgba(255,255,255,.18),0 10px 24px rgba(181,118,116,.28)}
.mg-story-ring.seen{background:rgba(255,255,255,.14)}
.mg-story-inner{width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.72);overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.06)}
.mg-story-inner img{width:100%;height:100%;object-fit:cover;display:block}
.mg-story-label{font:700 10px/1.1 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.8);max-width:72px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-add-story{position:fixed;right:18px;top:18px;z-index:12;padding:11px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.24);background:rgba(16,12,14,.42);backdrop-filter:blur(10px);color:#fff;cursor:pointer;font:700 10px 'Inter',sans-serif;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 18px 32px rgba(0,0,0,.25)}
.mg-add-story:hover{background:rgba(139,69,87,.8)}
.mg-bottom{position:fixed;bottom:0;left:0;right:0;z-index:10;padding:32px 40px 40px;color:#fff}
.mg-badge{display:inline-block;margin-bottom:12px;padding:6px 16px;border-radius:999px;font:700 10px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase}
.mg-badge.premium{background:var(--gold);color:#fff}
.mg-badge.standard{background:rgba(251,246,241,.15);color:rgba(255,255,255,.85)}
.mg-type{font:400 11px/1.2 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.6}
.mg-name{font:400 clamp(2rem,5vw,2.8rem)/1.05 var(--serif);margin:6px 0 10px;letter-spacing:-.01em}
.mg-price{font:300 2rem var(--serif);color:var(--gold)}
.mg-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:12px}
.mg-btn{width:52px;height:52px;border-radius:50%;cursor:pointer;display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.12);color:#fff;transition:transform .2s,background .2s;border:none;box-shadow:0 18px 32px rgba(0,0,0,.2)}
.mg-btn:hover{transform:translateY(-1px);background:rgba(255,255,255,.18)}
.mg-btn svg{width:22px;height:22px}
.mg-btn.selected{background:rgba(200,162,98,.9);border-color:rgba(200,162,98,.9)}
.mg-recommendations{position:fixed;right:24px;bottom:120px;z-index:12;width:min(320px,calc(100vw - 32px));background:rgba(20,15,16,0.52);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px;box-shadow:0 24px 55px rgba(0,0,0,.25)}
.mg-recommendations-head{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#fff;margin-bottom:10px}
.mg-recommendations-head span{font:700 10px 'Inter',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.85)}
.mg-recommendations-head button{border:none;background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:7px 10px;font:700 9px 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
.mg-recommendations-grid{display:flex;flex-direction:column;gap:8px}
.mg-recommendation-item{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px;cursor:pointer;text-align:left;color:#fff}
.mg-recommendation-item img{width:52px;height:52px;object-fit:cover;border-radius:10px}
.mg-recommendation-body{display:flex;flex-direction:column;gap:4px;min-width:0}
.mg-recommendation-body strong{font:600 12px 'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-recommendation-body span{font:400 10px 'Inter',sans-serif;color:rgba(255,255,255,.7)}
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
  const [recommendations, setRecommendations] = useState([]);
  const [current, setCurrent] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const dragStart = useRef(null);
  const dragging = useRef(false);
  const viewedStories = useRef(new Set());
  const storyRailRef = useRef(null);

  const toggleCart = useCallback((id) => {
    const arrangementId = String(id || '');
    setSelectedIds((prev) => {
      if (!arrangementId) return prev;
      return prev.includes(arrangementId)
        ? prev.filter((item) => item !== arrangementId)
        : [...prev, arrangementId];
    });
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      const tenantId = getTenantId();
      const res = await api.get('/florist/flower-samples/recommendations', {
        params: { tenant_id: tenantId || undefined, limit: 4 },
      });
      setRecommendations(res.data?.data || []);
    } catch (error) {
      console.warn('Failed to load recommendations:', error);
      setRecommendations([]);
    }
  }, []);

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
    loadRecommendations();
  }, [loadRecommendations]);

  // Build stories from actual arrangements
  const stories = arrangements.map((a, i) => ({
    id: a.id || a.arrangement_id || i,
    label: (a.title || a.name || 'Arrangement').split(' ')[0],
    arrangementId: a.arrangement_id || a.id,
    img: a.images?.[0]?.url || a.images?.[0] || a.img || '',
    viewed: viewedStories.current.has(a.id || a.arrangement_id || i),
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
    }
    dragStart.current = null;
    dragging.current = false;
  };

  const handleStoryClick = (s) => {
    viewedStories.current.add(s.id);
    const idx = arrangements.findIndex(a => (a.arrangement_id || a.id) === s.arrangementId);
    if (idx >= 0) {
      setCurrent(idx);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (showBooking) return;
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, goTo, showBooking]);

  const normalizedArrangements = arrangements.map(a => ({
    ...a,
    id: a.arrangement_id || a.id,
    arrangement_id: a.arrangement_id || a.id,
    name: a.title || a.name,
    img: a.images?.[0]?.url || a.images?.[0] || a.img,
    desc: a.desc || a.description || '',
    title: a.title || a.name,
    portrait: a.images?.[0]?.url || a.images?.[0] || a.portrait || a.img,
  }));

  const openBookingFlow = useCallback(() => {
    setShowBooking(true);
  }, []);

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

            <div ref={storyRailRef} className="mg-stories" onWheel={(e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}>
              {stories.map((s) => {
                const isViewing = viewedStories.current.has(s.id);
                return (
                  <button key={s.id} className="mg-story-item" onClick={(e) => { e.stopPropagation(); handleStoryClick(s); }}>
                    <div className={`mg-story-ring ${isViewing ? "seen" : "unseen"}`}>
                      <div className="mg-story-inner">
                        <img src={s.img} alt={s.label} />
                      </div>
                    </div>
                    <span className="mg-story-label" style={{ opacity: isViewing ? 0.5 : 1 }}>{s.label}</span>
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
                <button
                  className={`mg-btn ${selectedIds.includes(arr?.arrangement_id || arr?.id) ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCart(arr?.arrangement_id || arr?.id);
                  }}
                  aria-label={selectedIds.includes(arr?.arrangement_id || arr?.id) ? "Remove from cart" : "Add to cart"}
                  title={selectedIds.includes(arr?.arrangement_id || arr?.id) ? "Remove from cart" : "Add to cart"}
                >
                  {selectedIds.includes(arr?.arrangement_id || arr?.id) ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12.5l4.1 4.1L19 2.5" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </button>
              </div>

              <div className="mg-dots">
                {arrangements.map((_, i) => (
                  <button key={i} className={`mg-dot ${i === current ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); goTo(i); }} />
                ))}
              </div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mg-recommendations">
              <div className="mg-recommendations-head">
                <span>Most booked now</span>
                <button onClick={openBookingFlow}>Complete booking</button>
              </div>
              <div className="mg-recommendations-grid">
                {recommendations.map((item) => (
                  <button
                    key={item.arrangement_id || item.id}
                    className="mg-recommendation-item"
                    onClick={() => {
                      const idx = arrangements.findIndex((a) => (a.arrangement_id || a.id) === (item.arrangement_id || item.id));
                      if (idx >= 0) {
                        setCurrent(idx);
                      }
                    }}
                  >
                    <img src={item.images?.[0]?.url || item.images?.[0] || item.img || ''} alt={item.title || item.name || 'Recommended arrangement'} />
                    <div className="mg-recommendation-body">
                      <strong>{item.title || item.name}</strong>
                      <span>{item.recommendation_reason || 'Popular choice'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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