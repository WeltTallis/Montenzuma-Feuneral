// Samples.jsx
// Haute floral gallery: carousel + stories + detailed expanded view + snow booking form
// Connects to real flower-samples API and flower-bookings flow

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import { getTenantId, getTenantSlug } from "../../utils/globalAuth";
import { Flower2 } from "../../utils/icons/icons";
import Snowfall from "./Snowfall";
import FlowerSnowBookingForm from "./FlowerSnowBookingForm";

/* ─── Snow palette ───────────────────────────────────────────────────────── */
const CSS = `:root{
  --paper:#FBF8F4; --ink:#4A3B3C; --ink2:#7A6664; --ink3:#B09A94;
  --rosewood:#8B4557; --blush:#DCAEA6; --blush-xl:#F6E7E2;
  --gold:#C8A262; --hair:#E8E0DA; --hair2:#E0C9C0;
  --serif:'Fraunces',Georgia,serif; --sans:'Inter',sans-serif;
}
.mg-viewport{position:fixed;inset:0;width:100vw;height:100vh;margin:0;border-radius:0;overflow:hidden;background:radial-gradient(circle at top, rgba(118,89,75,.35), rgba(11,8,9,.78) 45%, rgba(0,0,0,1) 100%);pointer-events:auto;box-shadow:none;border:none;touch-action:pan-y}
.mg-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .45s ease, transform .45s ease;overflow:hidden;background:#0d090b;will-change:opacity,transform}
.mg-slide img{width:100%;height:100%;object-fit:cover;background:rgba(12,10,12,.22);display:block;user-select:none;-webkit-user-drag:none;image-rendering:auto;filter:saturate(1.08) contrast(1.06)}
.mg-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.58) 0%,rgba(0,0,0,.18) 28%,rgba(0,0,0,.12) 52%,rgba(0,0,0,.76) 100%)}
.mg-stories{position:fixed;top:14px;left:18px;right:18px;z-index:10;display:flex;align-items:flex-start;gap:10px;overflow-x:auto;scrollbar-width:none;padding:10px 6px 8px;scroll-behavior:smooth;background:linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,0));border-radius:18px}
.mg-stories::-webkit-scrollbar{display:none}
.mg-story-item{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;cursor:pointer;transition:transform .2s;max-width:74px;background:transparent;border:none;padding:0;box-shadow:none}
.mg-story-item:hover{transform:translateY(-1px)}
.mg-story-ring{width:52px;height:52px;border-radius:50%;padding:0;display:grid;place-items:center;transition:.25s;background:transparent;overflow:hidden}
.mg-story-ring.unseen{background:transparent}
.mg-story-ring.seen{background:transparent}
.mg-story-inner{width:52px;height:52px;border-radius:50%;border:none;overflow:hidden;display:grid;place-items:center;background:transparent}
.mg-story-inner img{width:100%;height:100%;object-fit:cover;display:block}
.mg-story-label{font:700 10px/1.1 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.8);max-width:72px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-add-story{position:fixed;right:18px;top:18px;z-index:12;padding:11px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.24);background:rgba(16,12,14,.42);backdrop-filter:blur(10px);color:#fff;cursor:pointer;font:700 10px 'Inter',sans-serif;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 18px 32px rgba(0,0,0,.25)}
.mg-add-story:hover{background:rgba(139,69,87,.8)}
.mg-bottom{position:absolute;left:0;right:0;bottom:0;z-index:10;padding:28px 32px 34px;color:#fff;background:linear-gradient(180deg,transparent 0%, rgba(0,0,0,.18) 24%, rgba(0,0,0,.48) 100%)}
.mg-badge{display:inline-block;margin-bottom:12px;padding:6px 16px;border-radius:999px;font:700 10px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase}
.mg-badge.premium{background:var(--gold);color:#fff}
.mg-badge.standard{background:rgba(251,246,241,.15);color:rgba(255,255,255,.85)}
.mg-type{font:400 11px/1.2 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.6}
.mg-name{font:400 clamp(2rem,5vw,2.8rem)/1.05 var(--serif);margin:6px 0 10px;letter-spacing:-.01em;text-shadow:0 8px 24px rgba(0,0,0,.3)}
.mg-price{font:300 2rem var(--serif);color:var(--gold)}
.mg-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:12px}
.mg-btn{width:52px;height:52px;border-radius:0;cursor:pointer;display:grid;place-items:center;border:1px solid #573438;background:#573438;color:#fff;transition:all .18s ease;border:none;box-shadow:0 18px 32px rgba(0,0,0,.2)}
.mg-btn:hover{transform:translateY(-1px);background:#6d4447}
.mg-btn svg{width:22px;height:22px}
.mg-btn.selected{background:#f6f0eb;border-color:#f6f0eb;color:#171310;box-shadow:0 12px 20px rgba(246,240,235,.2)}
/* The "Most booked now" recommendations block was removed — it floated a fixed
   overlay over the bottom bar and duplicated every card (title twice + "Booked
   N times" + its own + button), exactly the rubbish the user asked to delete.
   It is intentionally dead now; keeping the comment (not the rules) so nobody
   re-adds them. */
.mg-dots{display:flex;justify-content:center;gap:8px;margin-top:24px}
.mg-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.3);transition:all .3s;cursor:pointer}
.mg-dot.active{width:22px;background:var(--gold)}
/* ── Continue booking ──────────────────────────────────────────────────────────
   An INLINE button that sits in the normal-flow bottom bar beside the single "+".
   There is deliberately NO floating tray / chip list here any more: browsing the
   gallery should show nothing but the arrangement, the one "+", and — once
   something is actually added — this button. The old floating cart bar
   (position:absolute; right:20px; bottom:118px) also permanently collided with
   the recommendations panel at right:24px/bottom:120px, which is why both were
   overlapping and stealing each other's clicks. */
.mg-continue{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:52px;padding:0 20px;border:none;border-radius:0;background:#f6f0eb;color:#191612;font:800 9px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .18s ease;white-space:nowrap}
.mg-continue:hover{background:#8b4557;color:#fff}
.mg-empty{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at top, rgba(255,255,255,.96), rgba(242,236,231,.92) 38%, rgba(228,220,214,.94) 100%);text-align:center;padding:40px}
.mg-empty-icon{opacity:.45;margin-bottom:16px;color:#8b4557}
.mg-empty h3{font:400 26px var(--serif);color:#4d3a38;margin:0 0 8px}
.mg-empty p{font:400 15px var(--sans);color:#7d6661;max-width:30rem;line-height:1.6}
.load-container{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F8F9FB;background-image:radial-gradient(#E2E8F0 1px,transparent 1px);background-size:24px 24px;text-align:center;padding:40px}
.load-icon-wrapper{width:72px;height:72px;margin:0 auto 1.5rem;background:#FFFFFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(255,61,127,.25);border:1px solid #FFECEF}
.load-flower{width:36px;height:36px}
.load-container h3{font-family:'Inter',sans-serif;color:#1E293B;font-size:1.6rem;margin:0 0 1.5rem 0;font-weight:600;letter-spacing:-.5px}
.load-track{width:100%;height:8px;background:#E2E8F0;border-radius:999px;overflow:hidden;position:relative}
.load-fill{position:absolute;top:0;left:0;height:100%;width:40%;border-radius:999px;background:linear-gradient(90deg,#FF3D7F,#FF6B35,#FFC107,#00E676);box-shadow:0 0 12px rgba(255,61,127,.7),0 0 6px rgba(0,230,118,.5);animation:load-slide 1.8s cubic-bezier(.65,.05,.36,1) infinite}
.load-fill::after{content:'';position:absolute;top:0;left:0;right:0;height:50%;border-radius:999px 999px 0 0;background:linear-gradient(to bottom,rgba(255,255,255,.6),transparent)}
@keyframes load-slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@media (max-width:768px){.mg-bottom{padding:24px 20px 32px}.mg-name{font-size:1.6rem}.mg-price{font-size:1.5rem}.mg-arrow{width:42px;height:42px}} 
`;

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Samples() {
  const { slug } = useParams();
  const tenantSlug = slug || getTenantSlug();
  const [arrangements, setArrangements] = useState([]);
  const [recommendations, setRecommendations] = useState([]); // kept (empty) so the booking flow's data shape is untouched — the floating "Most booked now" panel that consumed it is gone
  const [current, setCurrent] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const dragStart = useRef(null);
  const dragging = useRef(false);
  const viewedStories = useRef(new Set());
  const storyRailRef = useRef(null);

  const pickPrimaryImage = useCallback((entry) => {
    const list = Array.isArray(entry?.images) ? entry.images : [];
    if (list.length === 0) {
      return entry?.image || entry?.img || entry?.portrait || entry?.images?.[0]?.url || '';
    }

    const sorted = [...list].sort((a, b) => {
      const aPrimary = Number(a?.is_primary) || 0;
      const bPrimary = Number(b?.is_primary) || 0;
      const aOrder = Number(a?.order ?? 0) || 0;
      const bOrder = Number(b?.order ?? 0) || 0;
      if (aPrimary !== bPrimary) return bPrimary - aPrimary;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return 0;
    });

    const chosen = sorted.find((img) => typeof img?.url === 'string' && img.url.trim()) || sorted[0];
    return chosen?.url || entry?.image || entry?.img || entry?.portrait || '';
  }, []);

  /* THE one canonical id for a sample.
     flower_samples has BOTH `arrangement_id` (VARCHAR, e.g. "ARR-123456-A1B2C3")
     and `id` (INT AUTO_INCREMENT). The gallery stored selections as STRINGS but
     several read sites compared the RAW value, so any row that fell back to the
     numeric `id` never matched: the "+" stayed looking un-picked, the visitor
     tapped it again, and the item was toggled back OFF. That is exactly the
     "I can only ever seem to select one" behaviour. Everything that keys off a
     sample now goes through here so the two representations can never diverge. */
  const sampleKey = useCallback((a) => String(a?.arrangement_id || a?.id || ''), []);

  const isPicked = useCallback((a) => {
    const key = sampleKey(a);
    return !!key && selectedIds.includes(key);
  }, [sampleKey, selectedIds]);

  const toggleCart = useCallback((id) => {
    const arrangementId = String(id || '');
    if (!arrangementId) return;

    setSelectedIds((prev) => {
      const isSelected = prev.includes(arrangementId);
      if (isSelected) {
        return prev.filter((item) => item !== arrangementId);
      }
      return [...prev, arrangementId];
    });
  }, []);

  /* The floating "Most booked now" panel was removed entirely: it duplicated the
     gallery cards (same titles twice, "Booked N times" under each) and hovered as
     a fixed overlay over the bottom bar. No fetch is needed any more — the state
     above stays an empty placeholder so nothing downstream breaks. */
  const loadRecommendations = useCallback(async () => {
    setRecommendations([]);
  }, []);

  // Load arrangements from API
  useEffect(() => {
    const load = async () => {
      try {
        const tenantId = getTenantId();
        const res = await api.get('/florist/flower-samples/', {
          params: { tenant_id: tenantId || undefined },
          headers: tenantSlug ? { 'x-tenant-slug': tenantSlug } : undefined,
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
  }, [loadRecommendations, tenantSlug]);

  // Build stories from actual arrangements
  const stories = arrangements.map((a, i) => ({
    id: a.id || a.arrangement_id || i,
    label: (a.title || a.name || 'Arrangement').split(' ')[0],
    arrangementId: sampleKey(a),
    img: pickPrimaryImage(a),
    viewed: viewedStories.current.has(a.id || a.arrangement_id || i),
  }));

  const goTo = useCallback((idx) => {
    if (arrangements.length <= 1) return;
    // Loop around: going past the end wraps to the start, going before the start wraps to the end
    const len = arrangements.length;
    const looped = ((idx % len) + len) % len;
    setCurrent(looped);
  }, [arrangements.length]);

  const arr = arrangements[current] || null;

  const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    dragging.current = false;
    if (e.currentTarget && e.pointerId !== undefined) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
  };

  const onPointerMove = (e) => {
    if (dragStart.current === null) return;
    if (Math.abs(e.clientX - dragStart.current) > 18) dragging.current = true;
  };

  const onPointerUp = (e) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (dragging.current) {
      if (delta < -32) goTo(current + 1);
      else if (delta > 32) goTo(current - 1);
    }
    dragStart.current = null;
    dragging.current = false;
  };

  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      dragStart.current = e.touches[0].clientX;
      dragging.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (dragStart.current === null || !e.touches?.[0]) return;
    if (Math.abs(e.touches[0].clientX - dragStart.current) > 18) dragging.current = true;
  };

  const onTouchEnd = (e) => {
    if (dragStart.current === null) return;
    const touchX = e.changedTouches?.[0]?.clientX ?? dragStart.current;
    const delta = touchX - dragStart.current;
    if (dragging.current) {
      if (delta < -32) goTo(current + 1);
      else if (delta > 32) goTo(current - 1);
    }
    dragStart.current = null;
    dragging.current = false;
  };

  const handleStoryClick = (s) => {
    viewedStories.current.add(s.id);
    const idx = arrangements.findIndex(a => sampleKey(a) === s.arrangementId);
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
    img: pickPrimaryImage(a),
    desc: a.desc || a.description || '',
    title: a.title || a.name,
    portrait: pickPrimaryImage(a),
  }));

  /* The full sample records behind the current selection — these ride into the
     booking form so the booking keeps the real arrangement (id, photos,
     types/colors) instead of degrading to "Custom Arrangement". Keyed with the
     same sampleKey the "+" buttons use, so what the visitor picked is exactly
     what the booking receives — and EVERY pick survives, not just one. */
  const selectedArrangements = useMemo(() => {
    if (!selectedIds.length) return [];
    const picked = new Set(selectedIds.map(String));
    return arrangements.filter(a => picked.has(sampleKey(a)));
  }, [arrangements, selectedIds, sampleKey]);

  /* Opening the booking flow must NEVER pick an arrangement on the user's behalf.
     It used to fall back to whatever slide happened to be on screen, so someone
     who merely browsed the gallery and tapped "Complete booking" silently
     ordered that slide. Selection is now explicit — the "+" on a slide or on a
     recommendation card — so an empty selection really is empty. */
  const openBookingFlow = useCallback(() => {
    setShowBooking(true);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Snowfall count={24} opacity={0.5} colors={['#E8909B', '#F3B8AC', '#F6D3A0', '#BFD8A8']} />

      {loading ? (
        <div className="load-container">
          <div className="load-icon-wrapper">
            <svg className="load-flower" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C13.5 5 13.5 8 12 11C10.5 8 10.5 5 12 2Z" stroke="#FF3D7F" />
              <path d="M12 22C10.5 19 10.5 16 12 13C13.5 16 13.5 19 12 22Z" stroke="#FF3D7F" />
              <path d="M2 12C5 10.5 8 10.5 11 12C8 13.5 5 13.5 2 12Z" stroke="#00E676" />
              <path d="M22 12C19 13.5 16 13.5 13 12C16 10.5 19 10.5 22 12Z" stroke="#00E676" />
              <circle cx="12" cy="12" r="2" fill="#FFC107" stroke="none" />
            </svg>
          </div>
          <h3>Loading Feed</h3>
          <div className="load-track">
            <div className="load-fill"></div>
          </div>
        </div>
      ) : arrangements.length === 0 ? (
        <div className="mg-empty">
          <Flower2 size={48} className="mg-empty-icon" />
          <h3>No floral samples yet</h3>
          <p>Upload samples in the florist portal to showcase your arrangements here.</p>
        </div>
      ) : (
        <>
          <div
            className="mg-viewport"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {arrangements.map((a, i) => {
              const img = pickPrimaryImage(a);
              return (
                <div key={sampleKey(a) || i} className="mg-slide" style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none", transform: i === current ? 'scale(1)' : 'scale(1.02)' }}>
                  <img src={img} alt={a.title || a.name || 'Arrangement'} draggable={false} loading="eager" decoding="async" />
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

            <div className="mg-bottom">
              {/* No tray / chip list / floating modal here. The bottom bar carries
                  only the arrangement, the single "+" and — once at least one
                  arrangement is added — the inline "Continue booking (N)" button
                  beside it. */}

              {arr?.tag && (<div className={`mg-badge ${arr.tag === "Premium" ? "premium" : "standard"}`}>{arr.tag}</div>)}
              <p className="mg-type">{arr?.types?.[0] || arr?.type || 'Flower Arrangement'}</p>
              <h2 className="mg-name">{arr?.title || arr?.name || 'Arrangement'}</h2>
              <div className="mg-actions">
                {/* The ONE add control. Swipe/browse, tap "+" on each arrangement
                    you want — every tap adds, a tap on an added one removes it.
                    Multiple arrangements can be held at once; this is a toggle,
                    not a radio. */}
                <button
                  className={`mg-btn ${isPicked(arr) ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCart(sampleKey(arr));
                  }}
                  aria-label={isPicked(arr) ? `Remove ${arr?.title || 'arrangement'} from booking` : `Add ${arr?.title || 'arrangement'} to booking`}
                  title={isPicked(arr) ? "Remove from booking" : "Add to booking"}
                  aria-pressed={isPicked(arr)}
                  style={{ transition: 'all 0.12s ease-out' }}
                >
                  {isPicked(arr) ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12.5l4.1 4.1L19 2.5" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </button>
                {/* Plain inline text button — same row as the "+", no chips, no
                    floating modal. Appears only once something has been added. */}
                {selectedArrangements.length > 0 && (
                  <button type="button" className="mg-continue" onClick={openBookingFlow}>
                    Continue booking ({selectedArrangements.length})
                  </button>
                )}
              </div>

              <div className="mg-dots">
                {arrangements.map((_, i) => (
                  <button key={i} className={`mg-dot ${i === current ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); goTo(i); }} />
                ))}
              </div>
            </div>
          </div>

          {/* The floating "Most booked now" panel used to live here. It was a
              fixed overlay that duplicated the gallery and cluttered the screen
              with repeated titles plus its own add buttons — removed entirely at
              the user's request. Selection now happens only through the single
              "+" in the bottom bar. */}

          {showBooking && (
            <FlowerSnowBookingForm
              open={showBooking}
              tenantSlug={tenantSlug}
              selectedArrangements={selectedArrangements}
              onBooked={() => { setShowBooking(false); setSelectedIds([]); }}
              onClose={() => setShowBooking(false)}
            />
          )}
        </>
      )}
    </>
  );
}