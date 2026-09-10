import { useState, useRef, useCallback, useEffect } from "react";

const ARRANGEMENTS = [
  { id: 1, name: "White Serenity Casket Spray", type: "Casket Spray", price: "$485", priceVal: 485, description: "Full white roses, calla lilies, and gypsophila in a flowing symmetrical spray.", img: "https://images.unsplash.com/photo-1704438563862-49be6f537b0f?w=1600&h=1200&fit=crop&auto=format", tag: "Most Requested" },
  { id: 2, name: "Garden of Peace Standing Wreath", type: "Standing Wreath", price: "$320", priceVal: 320, description: "Mixed whites and blush florals arranged in a 36 circular standing tribute.", img: "https://images.unsplash.com/photo-1574599191796-a7780cc45f21?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 3, name: "Eternal Light Altar Arrangement", type: "Altar Display", price: "$275", priceVal: 275, description: "Tall ivory lilies and white carnations set in a crystal-glass pedestal vase.", img: "https://images.unsplash.com/photo-1758334587571-d3dd723c9f46?w=1600&h=1200&fit=crop&auto=format", tag: "New" },
  { id: 4, name: "Soft Blush Memorial Bouquet", type: "Hand Bouquet", price: "$145", priceVal: 145, description: "A graceful hand-tied bouquet of blush roses, soft ferns, and white freesia.", img: "https://images.unsplash.com/photo-1581720848095-2b72764b08a2?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 5, name: "Tranquil Waters Cross", type: "Floral Cross", price: "$395", priceVal: 395, description: "White chrysanthemums and stephanotis shaped into a 42 standing floral cross.", img: "https://images.unsplash.com/photo-1607161067490-a5abf9f02409?w=1600&h=1200&fit=crop&auto=format", tag: null },
  { id: 6, name: "Ivory Grace Heart Tribute", type: "Heart Shape", price: "$440", priceVal: 440, description: "A full ivory and cream heart display of roses and spray carnations, 36 wide.", img: "https://images.unsplash.com/photo-1605070071667-4ce1a48d3d13?w=1600&h=1200&fit=crop&auto=format", tag: "Premium" },
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
        <button onClick={onClose} className="self-end mt-8 mr-8 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-60 transition-opacity" style={{ background: "#E8E2D6", color: "#3D3A35", fontSize: 17 }}>?</button>
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
                {["Fresh seasonal blooms", "Same-day arrangement", "Delivery to venue", "Dedicated floral consultant"].map((inc) => (<li key={inc} className="flex items-center gap-2 text-sm" style={{ color: "#3D3A35" }}><span style={{ color: "#A85D6E" }}>?</span> {inc}</li>))}
              </ul>
            </div>
            <button onClick={() => setStep("book")} className="w-full py-4 rounded-2xl text-sm uppercase tracking-widest mt-auto hover:opacity-85 transition-opacity" style={{ background: "#8B4557", color: "#fff" }}>Request This Arrangement</button>
          </>)}
          {step === "book" && (<>
            <button onClick={() => setStep("detail")} className="text-xs uppercase tracking-widest mb-6 flex items-center gap-1.5 hover:opacity-60 transition-opacity" style={{ color: "#7A7568" }}>? Back</button>
            <p className="text-xs uppercase tracking-[0.22em] mb-2" style={{ color: "#7A7568" }}>{item.type}</p>
            <h2 className="text-3xl leading-tight mb-8" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#1C1B19", fontWeight: 400 }}>{item.name}</h2>
            <div className="space-y-5">
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Your Full Name</label><input className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19" }} placeholder="e.g. Margaret Ellis" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Service Date</label><input type="date" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19", colorScheme: "light" }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#7A7568" }}>Notes or Dedication</label><textarea className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" rows={4} style={{ background: "#EFEAE0", border: "1px solid #DDD6C8", color: "#1C1B19" }} placeholder="Any special wishes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <button onClick={handleConfirmBooking} className="mt-8 w-full py-4 rounded-2xl text-sm uppercase tracking-widest transition-opacity" style={{ background: canSubmit ? "#8B4557" : "#E8E2D6", color: canSubmit ? "#fff" : "#7A7568", cursor: canSubmit ? "pointer" : "not-allowed" }}>Confirm Booking</button>
          </>)}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "#F5E6E8" }}><span style={{ color: "#8B4557", fontSize: 24 }}>?</span></div>
              <h2 className="text-3xl mb-4" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#1C1B19", fontWeight: 400 }}>Booking Received</h2>
              <p className="text-sm mb-2" style={{ color: "#7A7568" }}>Thank you, <span style={{ color: "#8B4557" }}>{form.name}</span>.</p>
              <p className="text-lg mb-2 italic" style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#3D3A35" }}>{item.name}</p>
              <p className="text-sm mb-10" style={{ color: "#7A7568" }}>has been requested for {form.date}.<br />Our coordinator will confirm shortly.</p>
              <button onClick={onClose} className="px-10 py-3 rounded-2xl text-sm uppercase tracking-widest hover:opacity-85 transition-opacity" style={{ background: "#8B4557", color: "#fff" }}>Return to Gallery</button>
            </div>
          )}
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
