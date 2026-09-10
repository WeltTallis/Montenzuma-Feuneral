import { useState, useRef, useCallback, useEffect } from "react";

const ARRANGEMENTS = [
  { id: 1, name: "White Serenity Casket Spray", type: "Casket Spray", price: "$485", priceVal: 485, description: "Full white roses, calla lilies, and gypsophila in a flowing symmetrical spray. Crafted to honor with grace and tenderness.", img: "https://images.unsplash.com/photo-1704438563862-49be6f537b0f?w=1600&h=1200&fit=crop&auto=format", tag: "Most Requested" },
  { id: 2, name: "Garden of Peace Standing Wreath", type: "Standing Wreath", price: "$320", priceVal: 320, description: "Mixed whites and blush florals arranged in a 36″ circular standing tribute, evoking quiet meadow solace.", img: "https://images.unsplash.com/photo-1574599191796-a7780cc45f21?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 3, name: "Eternal Light Altar Arrangement", type: "Altar Display", price: "$275", priceVal: 275, description: "Tall ivory lilies and white carnations set in a crystal-glass pedestal vase for the service altar.", img: "https://images.unsplash.com/photo-1758334587571-d3dd723c9f46?w=1600&h=1200&fit=crop&auto=format", tag: "New" },
  { id: 4, name: "Soft Blush Memorial Bouquet", type: "Hand Bouquet", price: "$145", priceVal: 145, description: "A graceful hand-tied bouquet of blush roses, soft ferns, and white freesia — gentle as remembrance.", img: "https://images.unsplash.com/photo-1581720848095-2b72764b08a2?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 5, name: "Tranquil Waters Cross", type: "Floral Cross", price: "$395", priceVal: 395, description: "White chrysanthemums and stephanotis shaped into a 42″ standing floral cross of quiet devotion.", img: "https://images.unsplash.com/photo-1607161067490-a5abf9f02409?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 6, name: "Ivory Grace Heart Tribute", type: "Heart Shape", price: "$440", priceVal: 440, description: "A full ivory and cream heart display of roses and spray carnations, 36″ wide — love made visible.", img: "https://images.unsplash.com/photo-1605070071667-4ce1a48d3d13?w=1600&h=1200&fit=crop&auto=format", tag: "Premium" },
];

const STORIES = [
  { id: 1, label: "Serenity", arrangementId: 1, img: "https://images.unsplash.com/photo-1704438563862-49be6f537b0f?w=160&h=160&fit=crop&auto=format", viewed: false },
  { id: 2, label: "Eternal", arrangementId: 2, img: "https://images.unsplash.com/photo-1574599191796-a7780cc45f21?w=160&h=160&fit=crop&auto=format", viewed: false },
  { id: 3, label: "Grace", arrangementId: 3, img: "https://images.unsplash.com/photo-1758334587571-d3dd723c9f46?w=160&h=160&fit=crop&auto=format", viewed: true },
  { id: 4, label: "Tranquil", arrangementId: 4, img: "https://images.unsplash.com/photo-1581720848095-2b72764b08a2?w=160&h=160&fit=crop&auto=format", viewed: false },
  { id: 5, label: "Solace", arrangementId: 5, img: "https://images.unsplash.com/photo-1607161067490-a5abf9f02409?w=160&h=160&fit=crop&auto=format", viewed: true },
  { id: 6, label: "Ivory", arrangementId: 6, img: "https://images.unsplash.com/photo-1605070071667-4ce1a48d3d13?w=160&h=160&fit=crop&auto=format", viewed: false },
];

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');`;

function DetailView({ item, onClose, onBook }) {
  const [step, setStep] = useState("detail");
  const [form, setForm] = useState({ name: "", date: "", notes: "" });
  const canSubmit = form.name.trim() !== "" && form.date !== "";
  const handleConfirmBooking = () => {
    if (!canSubmit) return;
    if (onBook) onBook({ arrangementId: item.id, arrangementName: item.name, price: item.priceVal, customerName: form.name, serviceDate: form.date, notes: form.notes });
    setStep("done");
  };
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "#FBF8F3", fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="w-1/2 h-full relative flex-shrink-0 hidden md:block">
        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, transparent 65%, #FBF8F3)" }} />
        {item.tag && <div className="absolute top-8 left-8 px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ background: item.tag === "Premium" ? "#C8A262" : "#F5E6E8", color: item.tag === "Premium" ? "#fff" : "#8B4557" }}>{item.tag}</div>}
      </div>
      <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: "#FBF8F3" }}>
        <button onClick={onClose} className="self-end mt-8 mr-8 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-60 transition-opacity" style={{ background: "#E8E2D6", color: "#3D3A35", fontSize: 17 }}>✕</button>
        <div className="px-10 pb-12 flex flex-col flex-1">
          {step === "detail" && (<>
            <p className="text-xs uppercase tracking-[0.22em] mb-3" style={{ color: "#7A7568" }}>{item.type}</p>
            <h2 className="text-4xl leading-tight mb-4" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#1C1B19", fontWeight: 400 }}>{item.name}</h2>
            <span className="text-3xl mb-6" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#8B4557", fontWeight: 300 }}>{item.price}</span>
            <div className="h-px my-6" style={{ background: "#E8E2D6" }} />
            <p className="text-base leading-relaxed mb-8" style={{ color: "#3D3A35", lineHeight: 1.8 }}>{item.description}</p>
            <div className="rounded-2xl p-5 mb-8" style={{ background: "#F5E6E8", border: "1px solid #DDD6C8" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#7A7568" }}>Includes</p>
              <ul className="space-y-2">
                {["Fresh seasonal blooms", "Same-day arrangement", "Delivery to venue", "Dedicated floral consultant"].map((inc) => (<li key={inc} className="flex items-center gap-2 text-sm" style={{ color: "#3D3A35" }}><span style={{ color: "#A85D6E" }}>✦</span> {inc}</li>))}
              </ul>
            </div>
            <button onClick={() => setStep("book")} className="w-full py-4 rounded-2xl text-sm uppercase tracking-widest mt-auto hover:opacity-85 transition-opacity" style={{ background: "#8B4557", color: "#fff" }}>Request This Arrangement</button>
          </>)}
          {step === "book" && (<>
            <button onClick={() => setStep("detail")} className="text-xs uppercase tracking-widest mb-6 flex items-center gap-1.5 hover:opacity-60 transition-opacity" style={{ color: "#7A7568" }}>← Back</button>
            <p className="text-xs uppercase tracking-[0.22em] mb-2" style={{ color: "#7A7568" }}>{item.type}</p>
            <h2 className="text-3xl leading-tight mb-8" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#1C1B19", fontWeight: 400 }}>{item.name}</h2>
            <div className="space-y-5">
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Your Full Name</label><input className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19" }} placeholder="e.g. Margaret Ellis" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Service Date</label><input type="date" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19", colorScheme: "light" }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Notes or Dedication</label><textarea className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" rows={4} style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19" }} placeholder="Any special wishes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <button onClick={handleConfirmBooking} className="mt-8 w-full py-4 rounded-2xl text-sm uppercase tracking-widest transition-opacity" style={{ background: canSubmit ? "#8B4557" : "#E8E2D6", color: canSubmit ? "#fff" : "#7A7568", cursor: canSubmit ? "pointer" : "not-allowed" }}>Confirm Booking</button>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default function Samples() {
  const [current, setCurrent] = useState(0);
  const [detail, setDetail] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [viewedStories, setViewedStories] = useState(new Set(STORIES.filter((s) => s.viewed).map((s) => s.id)));
  const dragStart = useRef(null);
  const dragging = useRef(false);
  const containerRef = useRef(null);
  const goTo = useCallback((idx) => { setCurrent(Math.max(0, Math.min(ARRANGEMENTS.length - 1, idx))); }, []);
  const onPointerDown = (e) => { dragStart.current = e.clientX; dragging.current = false; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPointerMove = (e) => { if (dragStart.current === null) return; if (Math.abs(e.clientX - dragStart.current) > 6) dragging.current = true; };
  const onPointerUp = (e) => { if (dragStart.current === null) return; const delta = e.clientX - dragStart.current; if (dragging.current) { if (delta < -50) goTo(current + 1); else if (delta > 50) goTo(current - 1); } else { setDetail(ARRANGEMENTS[current]); } dragStart.current = null; dragging.current = false; };
  const handleStoryClick = (s) => { setViewedStories((prev) => new Set([...prev, s.id])); const arr = ARRANGEMENTS.find((a) => a.id === s.arrangementId); if (arr) setDetail(arr); };
  useEffect(() => { const handler = (e) => { if (e.key === "ArrowRight") goTo(current + 1); if (e.key === "ArrowLeft") goTo(current - 1); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [current, goTo]);
  const arr = ARRANGEMENTS[current];
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {detail && <DetailView item={detail} onClose={() => setDetail(null)} onBook={(data) => { setBookingData(data); setDetail(null); }} />}
      {bookingData && (<div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}><div className="w-full max-w-lg mx-4 rounded-2xl p-8" style={{ background: "#FBF8F3" }}><h2 className="text-2xl mb-4" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#1C1B19" }}>Complete Booking</h2><p className="mb-4" style={{ color: "#3D3A35" }}>Arrangement: {bookingData.arrangementName}</p><p className="mb-4" style={{ color: "#8B4557", fontSize: 24 }}>${bookingData.price}</p><button onClick={() => { alert("Booking confirmed!"); setBookingData(null); }} className="w-full py-4 rounded-2xl text-sm uppercase tracking-widest" style={{ background: "#8B4557", color: "#fff" }}>Confirm</button><button onClick={() => setBookingData(null)} className="w-full mt-2 py-2 text-sm" style={{ color: "#7A7568" }}>Cancel</button></div></div>)}
      <div ref={containerRef} className="fixed inset-0 overflow-hidden select-none cursor-pointer" style={{ background: "#000" }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        {ARRANGEMENTS.map((a, i) => (<div key={a.id} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}><img src={a.img} alt={a.name} className="w-full h-full object-cover" draggable={false} /></div>))}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
        <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-6 pb-2"><div className="flex gap-5 overflow-x-auto">
          {STORIES.map((s) => { const viewed = viewedStories.has(s.id); return (<button key={s.id} onClick={(e) => { e.stopPropagation(); handleStoryClick(s); }} className="flex flex-col items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"><div style={{ padding: "2.5px", borderRadius: "9999px", background: viewed ? "rgba(255,255,255,0.2)" : "conic-gradient(#C8A262 0deg 310deg, rgba(255,255,255,0.18) 310deg)" }}><div className="w-[58px] h-[58px] rounded-full overflow-hidden" style={{ border: "2.5px solid rgba(0,0,0,0.4)", filter: viewed ? "grayscale(0.6) brightness(0.55)" : "none" }}><img src={s.img} alt={s.label} className="w-full h-full object-cover" /></div></div><span className="text-[11px] tracking-wide drop-shadow" style={{ color: viewed ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)" }}>{s.label}</span></button>); })}
        </div></div>
        {current > 0 && <button onClick={(e) => { e.stopPropagation(); goTo(current - 1); }} className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>}
        {current < ARRANGEMENTS.length - 1 && <button onClick={(e) => { e.stopPropagation(); goTo(current + 1); }} className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-12">
          {arr.tag && <div className="inline-block mb-3 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-widest" style={{ background: arr.tag === "Premium" ? "#C8A262" : "rgba(255,255,255,0.15)", color: "#fff" }}>{arr.tag}</div>}
          <p className="text-xs uppercase tracking-[0.2em] mb-2 drop-shadow" style={{ color: "rgba(255,255,255,0.5)" }}>{arr.type}</p>
          <h2 className="text-5xl leading-tight mb-3 drop-shadow-lg" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#fff", fontWeight: 400 }}>{arr.name}</h2>
          <div className="flex items-end justify-between">
            <span className="text-3xl drop-shadow" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#C8A262", fontWeight: 300 }}>{arr.price}</span>
            <button onClick={(e) => { e.stopPropagation(); setDetail(arr); }} className="px-8 py-3 rounded-full text-sm uppercase tracking-widest hover:opacity-85 transition-opacity" style={{ background: "rgba(251,246,241,0.92)", color: "#8B4557" }}>View Details</button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            {ARRANGEMENTS.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }} className="rounded-full transition-all duration-300" style={{ width: i === current ? 24 : 7, height: 7, background: i === current ? "#C8A262" : "rgba(255,255,255,0.3)" }} />))}
          </div>
        </div>
      </div>
    </div>
  );
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

/* ── Story items ──────────────────────────────────────────────────────────── */
* { -webkit-tap-highlight-color: transparent; }
button:focus-visible, [role="button"]:focus-visible { outline: 2px solid #B98480; outline-offset: 2px; }

/* ── Floating add-to-booking button (left side, knows current view) ────────── */
.add-float {
  position: fixed; bottom: 28px; left: 28px; z-index: 200;
  display: flex; align-items: center; gap: 12px;
  animation: fadeIn 0.3s ease;
}
  .float-add {
    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    z-index: 20; width: 52px; height: 52px; border-radius: 50%;
    background: #6B4045; color: #FBF3EE; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(107,64,69,0.4); display: flex; align-items: center;
    justify-content: center; transition: transform .2s, box-shadow .2s;
    animation: fadeIn 0.4s ease;
  }
  .float-add:hover { transform: translateY(-50%) scale(1.06); box-shadow: 0 6px 28px rgba(107,64,69,0.55); }
  .float-add:active { transform: translateY(-50%) scale(0.94); }
  .float-add svg { width: 22px; height: 22px; }
  .float-add-label {
    position: absolute; right: 12px; top: calc(50% + 30px);
    font: 500 10px 'Karla', sans-serif; color: rgba(255,255,255,0.7);
    letter-spacing: 0.05em; white-space: nowrap; pointer-events: none;
  }
.add-float-btn {
  padding: 12px 22px; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; border: none; cursor: pointer;
  box-shadow: 0 8px 28px rgba(71,90,67,0.4);
  transition: all 0.2s; display: flex; align-items: center; gap: 8px;
}
.add-float-btn:hover { background: #556A50; transform: translateY(-1px); }
.add-float-btn.is-added { background: #C8A262; }
.add-float-btn .add-icon { font-size: 14px; font-weight: 700; line-height: 1; }

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

// ── Story Item — tap to view · single add button on left ───────────────────
function StoryItem({ arrangement, isActive, isSelected, size, animDelay, onClick }) {
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
        <div className="story-inner" style={{ width: size, height: size }}>          <img src={arrangement.portrait || arrangement.img} alt={arrangement.name || arrangement.title} />
        </div>
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
function BrowseScreen({ selectedIds, onOpen, onAdd, onRemove, onPreview, arrangements = [], loading = false }) {
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
  const currentId = bg?.id

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
    const SWIPE = 100
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
            size={72}
            animDelay={i * 0.18}
            onClick={() => onOpen(a.id)}
            onAdd={() => onAdd(a.id)}
          />
        ))}
      
        {/* Floating Add button — selects current hero sample */}
        {allArrangements.length > 0 && (
          <>
            <button
              className="float-add"
              onClick={() => { const a = allArrangements[bgIdx]; if (a) onAdd(a.id) }}
              aria-label="Add current flower to booking"
              title={allArrangements[bgIdx] ? 'Add ' + allArrangements[bgIdx].name : 'Add current flower'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="float-add-label">Add</span>
          </>
        )}
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
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState([])
  const [quantities, setQuantities] = useState({})
  const [arrangements, setArrangements] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)


  // Fetch flower arrangements from the backend API
  useEffect(() => {
    let cancelled = false
    const loadArrangements = async () => {
      try {
        const tenantSlug = localStorage.getItem('tenantSlug') || 'system_shared';
        const res = await api.get('/florist/flower-samples', {
          params: { tenant_slug: tenantSlug }
        });
        const data = res.data;
        if (!cancelled && data.success && Array.isArray(data.data)) {
          const transformed = data.data.map((sample, index) => {
            const firstImage = sample.images && sample.images.length > 0
              ? (typeof sample.images[0] === 'string' ? sample.images[0] : sample.images[0].url)
              : null;
            const sid = String(sample.sample_id || `arr-${index}`)
            return {
              id: sid,
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
        } else if (!cancelled) {
          setArrangements([]);
        }
      } catch (e) {
        console.error('Failed to load flower samples:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadArrangements();
    return () => { cancelled = true }
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
        onBooked={() => { setSelected([]); setQuantities({}); navigate('/flower-samples') }}
        onClose={() => setBookingOpen(false)}
      />
    </>
  )
}
