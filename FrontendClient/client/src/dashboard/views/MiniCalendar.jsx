import { useState, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════
   Mini Activity Calendar — dashboard widget.
   Faithful React port of the "February Activity Calendar" prototype:
   dark ink accents (#1a1a2e), indigo selection, weekend headers in
   red, animated event dots, Month ⇄ Week toggle and an expandable
   events panel.

   Props:
     events  { 'YYYY-MM-DD': [{ n: name, t: time, c: colorClass }] }
             colorClass ∈ red | blue | green | orange | purple
     loading boolean
   ════════════════════════════════════════════════════════════════ */

const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const isWe = (d) => d === 0 || d === 6;

const CSS = `
  .mac *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans','Inter',system-ui,sans-serif}
  .mac{color:#1a1a2e;width:100%;max-width:272px}
  .mac .toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e4ea;margin-bottom:10px}
  .mac .toolbar-left{display:flex;align-items:center;gap:2px}
  .mac .view-toggle{display:flex;border:1px solid #e2e4ea;border-radius:7px;overflow:hidden}
  .mac .view-btn{border:none;background:#fff;color:#a0a3b1;font-size:11px;font-weight:600;padding:5px 11px;cursor:pointer;transition:all .15s}
  .mac .view-btn.active{background:#1a1a2e;color:#fff}
  .mac .view-btn:hover:not(.active){color:#555}
  .mac .today-btn{border:none;background:none;color:#6366f1;font-size:11px;font-weight:600;cursor:pointer;padding:5px 0 5px 8px;transition:opacity .15s}
  .mac .today-btn:hover{opacity:.6}
  .mac .nav-btn{width:28px;height:28px;border:none;border-radius:7px;background:#1a1a2e;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;transition:background .15s}
  .mac .nav-btn:hover{background:#33334d}
  .mac .month-label{font-size:16px;font-weight:700;letter-spacing:-.3px;margin-bottom:10px}
  .mac .month-label .yr{color:#a0a3b1;font-weight:500;margin-left:5px}
  .mac .weekdays{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:3px}
  .mac .weekdays span{text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#a0a3b1;padding-bottom:5px}
  .mac .weekdays span.wkend{color:#e05555}
  .mac .month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}
  .mac .day{position:relative;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;color:#1a1a2e;transition:background .12s;user-select:none;gap:2px}
  .mac .day:hover:not(.empty){background:#f4f5f7}
  .mac .day.empty{cursor:default}
  .mac .day.other-month{color:#d4d6de}
  .mac .day.today{background:#1a1a2e;color:#fff;font-weight:700}
  .mac .day.today:hover{background:#33334d}
  .mac .day.selected:not(.today){background:#eef0ff;outline:1.5px solid #6366f1;color:#4338ca;font-weight:700}
  .mac .dots{display:flex;gap:2px;height:5px;align-items:center}
  .mac .dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;animation:macpop .25s ease both}
  .mac .day.today .dot{opacity:.6}
  .mac .week-grid{display:flex;flex-direction:column;gap:2px}
  .mac .wk-row{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:background .12s}
  .mac .wk-row:hover{background:#f4f5f7}
  .mac .wk-row.today-row{background:#1a1a2e;color:#fff}
  .mac .wk-row.today-row:hover{background:#33334d}
  .mac .wk-row.sel-row:not(.today-row){background:#eef0ff;outline:1.5px solid #6366f1}
  .mac .wk-row.sel-row:not(.today-row) .wk-lbl,.mac .wk-row.sel-row:not(.today-row) .wk-num{color:#4338ca}
  .mac .wk-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#a0a3b1;width:30px;flex-shrink:0}
  .mac .wk-lbl.we{color:#e05555}
  .mac .today-row .wk-lbl{color:rgba(255,255,255,.55)}
  .mac .today-row .wk-lbl.we{color:rgba(224,85,85,.65)}
  .mac .wk-num{font-size:14px;font-weight:700;color:#1a1a2e;width:20px;flex-shrink:0}
  .mac .today-row .wk-num{color:#fff}
  .mac .wk-dots{display:flex;gap:3px;flex:1;align-items:center;height:5px}
  .mac .wk-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;animation:macpop .25s ease both}
  .mac .wk-cnt{font-size:10px;color:#a0a3b1;flex-shrink:0}
  .mac .today-row .wk-cnt{color:rgba(255,255,255,.45)}
  .mac .events-panel{background:#fff;border:1px solid #e2e4ea;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-top:10px;max-height:0;overflow:hidden;opacity:0;transition:max-height .3s ease,opacity .25s ease,padding .3s ease;padding:0 16px;width:100%}
  .mac .events-panel.open{max-height:280px;opacity:1;padding:14px 16px 16px}
  .mac .panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .mac .panel-head h3{font-size:12px;font-weight:700;margin:0}
  .mac .panel-head .badge{font-size:10px;font-weight:600;background:#f4f5f7;color:#555;padding:2px 8px;border-radius:20px}
  .mac .ev-item{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:7px;transition:background .12s}
  .mac .ev-item:hover{background:#f9f9fb}
  .mac .ev-bar{width:3px;height:20px;border-radius:3px;flex-shrink:0}
  .mac .ev-info{display:flex;flex-direction:column}
  .mac .ev-name{font-size:12px;font-weight:600}
  .mac .ev-time{font-size:10px;color:#a0a3b1}
  .mac .dot.red,.mac .ev-bar.red{background:#ef4444}
  .mac .dot.blue,.mac .ev-bar.blue{background:#3b82f6}
  .mac .dot.green,.mac .ev-bar.green{background:#22c55e}
  .mac .dot.orange,.mac .ev-bar.orange{background:#f59e0b}
  .mac .dot.purple,.mac .ev-bar.purple{background:#8b5cf6}
  @keyframes macpop{0%{transform:scale(0)}100%{transform:scale(1)}}
`;

export default function MiniActivityCalendar({ events = {}, loading = false, onPickDate }) {
  const now = new Date();
  const [view, setView] = useState("month");
  const [sel, setSel] = useState(null);
  const [vY, setVY] = useState(now.getFullYear());
  const [vM, setVM] = useState(now.getMonth());
  const [wStart, setWStart] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d;
  });

  const dk = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayKey = dk(now.getFullYear(), now.getMonth(), now.getDate());
  const gevs = (k) => events[k] || [];

  const monthCells = useMemo(() => {
    const fd = new Date(vY, vM, 1).getDay();
    const dim = new Date(vY, vM + 1, 0).getDate();
    const dip = new Date(vY, vM, 0).getDate();
    const cells = [];
    for (let i = fd - 1; i >= 0; i--) cells.push({ empty: true, n: dip - i });
    for (let d = 1; d <= dim; d++) {
      const k = dk(vY, vM, d);
      cells.push({ k, n: d, evs: gevs(k).slice(0, 3), today: k === todayKey, isSel: sel === k });
    }
    const rem = (fd + dim) % 7 === 0 ? 0 : 7 - ((fd + dim) % 7);
    for (let d = 1; d <= rem; d++) cells.push({ empty: true, n: d });
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vY, vM, sel, events, todayKey]);

  const weekRows = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(wStart); d.setDate(d.getDate() + i);
        const k = dk(d.getFullYear(), d.getMonth(), d.getDate());
        return {
          k, lbl: WD[d.getDay()], we: d.getDay() === 0 || d.getDay() === 6, n: d.getDate(),
          evs: gevs(k).slice(0, 4), count: (events[k] || []).length,
          today: k === todayKey, isSel: sel === k,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wStart, sel, events, todayKey]
  );

  const clearPanel = () => {
    setSel(null);
    onPickDate?.(null);
  };

  const navPrev = () => {
    if (view === "month") { if (vM === 0) { setVM(11); setVY((y) => y - 1); } else setVM((m) => m - 1); }
    else { const d = new Date(wStart); d.setDate(d.getDate() - 7); setWStart(d); }
    clearPanel();
  };

  const navNext = () => {
    if (view === "month") { if (vM === 11) { setVM(0); setVY((y) => y + 1); } else setVM((m) => m + 1); }
    else { const d = new Date(wStart); d.setDate(d.getDate() + 7); setWStart(d); }
    clearPanel();
  };

  const goToday = () => {
    setVY(now.getFullYear());
    setVM(now.getMonth());
    const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - s.getDay());
    setWStart(s);
    // Only pre-select today when it actually has activities — no empty panels
    setSel((events[todayKey] || []).length ? todayKey : null);
    // The day-breakdown panel always falls back to showing today
    onPickDate?.(todayKey);
  };

  const toggleView = (v) => {
    if (v === view) return;
    if (v === "week") {
      const fd = new Date(vY, vM, 1).getDay();
      setWStart(new Date(vY, vM, 1 - fd));
    }
    setView(v);
    clearPanel();
  };

  const pick = (k) => {
    // Days without activities are inert unless a parent listens for picks —
    // with a listener the day panel still opens (shows "no activity").
    if (!(events[k] || []).length && !onPickDate) { setSel(null); return; }
    if (sel === k) {
      setSel(null);
      onPickDate?.(null); // panel falls back to today
      return;
    }
    setSel(k);
    onPickDate?.(k);
  };

  let label;
  if (view === "month") {
    label = <>{MO[vM]}<span className="yr">{vY}</span></>;
  } else {
    const e = new Date(wStart); e.setDate(e.getDate() + 6);
    label = (
      <>
        {wStart.getMonth() === e.getMonth()
          ? `${MO[wStart.getMonth()]} ${wStart.getDate()} – ${e.getDate()}`
          : `${MO[wStart.getMonth()].slice(0, 3)} ${wStart.getDate()} – ${MO[e.getMonth()].slice(0, 3)} ${e.getDate()}`}
        <span className="yr">{e.getFullYear()}</span>
      </>
    );
  }

  const selEvs = sel ? gevs(sel) : [];
  const [sy, sm, sd] = sel ? sel.split("-").map(Number) : [0, 1, 0];

  return (
    <div className="mac" style={{ opacity: loading ? 0.45 : 1, transition: "opacity .2s" }}>
      <style>{CSS}</style>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="view-toggle">
            <button type="button" className={`view-btn${view === "month" ? " active" : ""}`} onClick={() => toggleView("month")}>Month</button>
            <button type="button" className={`view-btn${view === "week" ? " active" : ""}`} onClick={() => toggleView("week")}>Week</button>
          </div>
          <button type="button" className="today-btn" onClick={goToday}>Today</button>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button type="button" className="nav-btn" aria-label="Previous" onClick={navPrev}>‹</button>
          <button type="button" className="nav-btn" aria-label="Next" onClick={navNext}>›</button>
        </div>
      </div>

      <div className="month-label">{label}</div>

      <div className="weekdays">
        {WD.map((w, i) => (
          <span key={w} className={i === 0 || i === 6 ? "wkend" : ""}>{w}</span>
        ))}
      </div>

      {view === "month" ? (
        <div className="month-grid">
          {monthCells.map((c, i) =>
            c.empty ? (
              <div key={`e${i}`} className="day empty other-month"><span>{c.n}</span><div className="dots" /></div>
            ) : (
              <div
                key={c.k}
                role="button"
                tabIndex={0}
                className={`day${c.today ? " today" : ""}${c.isSel && !c.today ? " selected" : ""}`}
                onClick={() => pick(c.k)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(c.k); } }}
              >
                <span>{c.n}</span>
                <div className="dots">
                  {c.evs.map((ev, j) => (
                    <div key={j} className={`dot ${ev.c}`} style={{ animationDelay: `${j * 0.05}s` }} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="week-grid">
          {weekRows.map((r) => (
            <div
              key={r.k}
              role="button"
              tabIndex={0}
              className={`wk-row${r.today ? " today-row" : ""}${r.isSel && !r.today ? " sel-row" : ""}`}
              onClick={() => pick(r.k)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(r.k); } }}
            >
              <span className={`wk-lbl${r.we ? " we" : ""}`}>{r.lbl}</span>
              <span className="wk-num">{r.n}</span>
              <div className="wk-dots">
                {r.evs.map((ev, j) => (
                  <div key={j} className={`wk-dot ${ev.c}`} style={{ animationDelay: `${j * 0.04}s` }} />
                ))}
              </div>
              <span className="wk-cnt">{r.count ? `${r.count} act.` : ""}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`events-panel${sel ? " open" : ""}`} role="region" aria-live="polite">
        {sel && (
          <>
            <div className="panel-head">
              <h3>{MO[sm - 1]} {sd}</h3>
              <span className="badge">{selEvs.length} activit{selEvs.length !== 1 ? "ies" : "y"}</span>
            </div>
            {selEvs.map((ev, i) => (
              <div key={i} className="ev-item">
                <div className={`ev-bar ${ev.c}`} />
                <div className="ev-info">
                  <span className="ev-name">{ev.n}</span>
                  <span className="ev-time">{ev.t}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}