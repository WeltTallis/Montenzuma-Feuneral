import React, { useState, useEffect } from "react";
import { Building2, LogOut, Flower2, FileText, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
                
// ─── Animations & base ────────────────────────────────────────────────────────
const CSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold: #c4a97d;
    --parch: #ede5d5;
    --ash: #7a7060;
    --deep-ash: #4a4438;
    --ground: #000000; 
  }   



  body { background: var(--ground); }

  .gd { font-family: 'Gilda Display', 'Georgia', serif; }
  .js { font-family: 'Jost', system-ui, sans-serif; }

  /* ── Candle ── */
  @keyframes flicker {
    0%   { transform: translateX(-50%) scaleX(1)    scaleY(1)    rotate(-1.8deg); opacity: 1; }
    20%  { transform: translateX(-50%) scaleX(0.85) scaleY(1.08) rotate(1.5deg);  opacity: .96; }
    45%  { transform: translateX(-50%) scaleX(1.08) scaleY(0.92) rotate(-.7deg);  opacity: 1; }
    70%  { transform: translateX(-50%) scaleX(0.92) scaleY(1.04) rotate(1.2deg);  opacity: .98; }
    100% { transform: translateX(-50%) scaleX(1)    scaleY(1.01) rotate(-1.8deg); opacity: 1; }
  }
  @keyframes glow-orb {
    0%, 100% { opacity: .25; transform: scale(1); }
    50%       { opacity: .5;  transform: scale(1.22); }
  }

  /* ── Status dot ── */
  @keyframes breathe {
    0%, 100% { opacity: 1; }
    50%       { opacity: .2; }
  }

  /* ── Overlay ── */
  @keyframes veil-in  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes spin     { to   { transform: rotate(360deg) } }

  /* ── Cards ── */
  @keyframes rise {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .svc-card {
    position: relative;
    border-radius: 16px;
    cursor: pointer;
    padding: 28px 24px 26px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: hidden;
    border: 1px solid rgba(196,169,125,0.11);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
    transition:
      transform .3s cubic-bezier(.4,0,.2,1),
      box-shadow .3s cubic-bezier(.4,0,.2,1),
      border-color .3s ease;
    animation: rise .55s ease both;
    outline: none;
  }
  .svc-card:hover {
    transform: translateY(-6px);
    border-color: rgba(196,169,125,0.32);
    box-shadow: 0 25px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .svc-card:active { transform: translateY(-2px) scale(.98); }

  /* shimmer on hover */
  .svc-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.06) 0%, transparent 70%);
    opacity: 0;
    transition: opacity .3s ease;
    pointer-events: none;
  }
  .svc-card:hover::after { opacity: 1; }

  /* arrow fade-in */
  .card-arrow {
    opacity: 0;
    transition: opacity .24s ease, transform .24s ease;
  }
  .svc-card:hover .card-arrow {
    opacity: 1;
    transform: translate(3px, -3px);
  }

  /* bracket opacity transition */
  .bracket-corner { transition: border-color .28s ease; }

  ::-webkit-scrollbar { width: 0; }
`;

// ── Corner bracket ornament ─────────────────────────────────────────────────
function Brackets({ hover }) {
  const c = hover ? "rgba(196,169,125,0.7)" : "rgba(196,169,125,0.22)";
  const base = {
    position: "absolute", width: 14, height: 14,
    borderColor: c, borderStyle: "solid", transition: "border-color .28s ease",
  };
  return (
    <>
      <div className="bracket-corner" style={{ ...base, top: 0, left: 0, borderWidth: "1px 0 0 1px" }} />
      <div className="bracket-corner" style={{ ...base, top: 0, right: 0, borderWidth: "1px 1px 0 0" }} />
      <div className="bracket-corner" style={{ ...base, bottom: 0, left: 0, borderWidth: "0 0 1px 1px" }} />
      <div className="bracket-corner" style={{ ...base, bottom: 0, right: 0, borderWidth: "0 1px 1px 0" }} />
    </>
  );
}

// ── Candle ─────────────────────────────────────────────────────────────────
function Candle({ size = 1 }) {
  const s = size;
  return (
    <div style={{ position: "relative", width: 20 * s, height: 84 * s, flexShrink: 0 }}>
      {/* ambient glow */}
      <div style={{
        position: "absolute", top: -20 * s, left: "50%", transform: "translateX(-50%)",
        width: 62 * s, height: 62 * s, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(232,160,48,0.15) 0%, transparent 70%)",
        animation: "glow-orb 2.8s ease-in-out infinite", pointerEvents: "none",
      }} />
      {/* flame */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        width: 9 * s, height: 17 * s,
        background: "linear-gradient(to top, #c07824 0%, #e8a030 32%, #f8d878 68%, #fefae2 100%)",
        borderRadius: "50% 50% 22% 22% / 56% 56% 44% 44%",
        transformOrigin: "bottom center",
        animation: "flicker 2.2s ease-in-out infinite alternate",
        boxShadow: `0 0 ${12*s}px ${5*s}px rgba(232,160,48,.38), 0 0 ${4*s}px ${2*s}px rgba(248,216,100,.55)`,
        zIndex: 2,
      }} />
      {/* wick */}
      <div style={{
        position: "absolute", top: 16 * s, left: "50%", transform: "translateX(-50%)",
        width: 1.5, height: 5 * s,
        background: "#1e1208", borderRadius: 1, zIndex: 1,
      }} />
      {/* wax body */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: 18 * s, height: 64 * s,
        background: "linear-gradient(168deg, #f2ece0 0%, #e2dbd0 30%, #c8c2b5 68%, #b5afa4 100%)",
        borderRadius: `${2*s}px ${2*s}px ${s}px ${s}px`,
        boxShadow: `inset ${-4*s}px 0 ${8*s}px rgba(0,0,0,.22), inset ${s}px 0 ${4*s}px rgba(255,255,255,.08), 0 ${2*s}px ${16*s}px rgba(0,0,0,.55)`,
      }}>
        <div style={{
          position: "absolute", top: 5 * s, left: 4 * s,
          width: 2, height: `52%`,
          background: "rgba(255,255,255,.17)", borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

// ── Service cards (Refined rich dark tints of your colors) ───────────────────
const CARDS = [
  {
    num: "01", 
    Icon: Building2, 
    iconColor: "#f1faee", 
    iconBg: "rgba(241, 250, 238, 0.1)",
    title: "Body Admission",   
    sub: "Respectful reception & formal registration",
    // Rich dark tint of #22333b
    bg: "linear-gradient(155deg, #1a262e 0%, #000000 100%)", 
    delay: "0ms",
  },
  {
    num: "02", 
    Icon: LogOut,    
    iconColor: "#669bbc", 
    iconBg: "rgba(102, 155, 188, 0.12)",
    title: "Body Release",     
    sub: "Dignified coordination of departure",
    // Rich dark tint of #003049
    bg: "linear-gradient(155deg, #002436 0%, #000000 100%)", 
    delay: "70ms",
  },
  {
    num: "03", 
    Icon: Flower2,   
    iconColor: "#e63946", 
    iconBg: "rgba(230, 57, 70, 0.15)",
    title: "Flower Arrangements", 
    sub: "Bespoke floral tributes & wreaths",
    // Rich dark red tint
    bg: "linear-gradient(155deg, #3d0d12 0%, #000000 100%)", 
    delay: "140ms",
  },
  {
    num: "04", 
    Icon: FileText,  
    iconColor: "#fdf0d5", 
    iconBg: "rgba(253, 240, 213, 0.1)",
    title: "Postmortem Records", 
    sub: "Secure access to medical reports",
    // Rich dark cream/olive tint
    bg: "linear-gradient(155deg, #1c2018 0%, #000000 100%)", 
    delay: "210ms",
  },
];

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState({ clock: "--:-- --", date: "", greet: "Welcome" });
  const [hovered, setHovered] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const h = n.getHours(), m = n.getMinutes().toString().padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      const h12 = (h % 12 || 12);
      const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const MON  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let g = "Good morning";
      if (h >= 12 && h < 17) g = "Good afternoon";
      else if (h >= 17) g = "Good evening";
      setT({ clock: `${h12}:${m} ${ap}`, date: `${DAYS[n.getDay()]}, ${n.getDate()} ${MON[n.getMonth()]}`, greet: g });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setShowOverlay(true);

    setTimeout(() => {
      let redirectPath = '/';
      if (serviceName === 'Body Admission') redirectPath = `/tenant/${tenantSlug}/deceased/register`;
      else if (serviceName === 'Body Release') redirectPath = `/tenant/${tenantSlug}/release-form/new`;
      else if (serviceName === 'Flower Arrangements') redirectPath = `/tenant/${tenantSlug}/flowers/new`;
      else if (serviceName === 'Postmortem Records') redirectPath = `/tenant/${tenantSlug}/postmortem-qr`;

      navigate(redirectPath);
      setShowOverlay(false);
      setSelectedService(null);
    }, 2200);
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Purely Black Main Background */}
      <div style={{ minHeight: "100vh", background: "#000000" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div style={{
          position: "relative",
          height: 400,
          overflow: "hidden",
          background: "#000000", 
        }}>
          {/* atmospheric photo */}
          <img
            src="https://plus.unsplash.com/premium_photo-1676068243733-df1880c2aef8?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="White lily memorial"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 55%",
              opacity: 0.8, // Made visible
              filter: "grayscale(10%) brightness(0.9)", 
            }}
          />
          {/* gradient overlays */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, hsla(0, 10%, 10%, 0.98) 0%, rgba(5, 1, 1, 0.6) 50%, rgba(4, 4, 1, 0.4) 100%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 60%)",
          }} />

          {/* content inside hero - Increased maxWidth for tablet centering */}
          <div style={{
            position: "relative", zIndex: 2,
            maxWidth: 720, margin: "0 auto",
            padding: "10spx 10px 0",
            height: "100%",
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
          }}>
            {/* top nav row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                className="js"
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  border: "1px solid rgba(196,169,125,0.2)",
                  background: "rgba(196,169,125,0.05)",
                  color: "#c4a97d", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                  transition: "all .2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(196,169,125,0.12)";
                  e.currentTarget.style.borderColor = "rgba(196,169,125,0.5)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(196,169,125,0.05)";
                  e.currentTarget.style.borderColor = "rgba(196,169,125,0.2)";
                }}
                onClick={() => navigate(`/tenant/${tenantSlug}/all-deceased`, { replace: true })}
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>

              {/* wordmark */}
              <div style={{ textAlign: "center" }}>
                <div className="js" style={{
                  fontSize: 10, letterSpacing: "6px", textTransform: "uppercase",
                  color: "rgb(254, 254, 254)", fontWeight: 400, lineHeight: 1,
                }}>
                  Montezuma Funeral Home
                </div>
                <div style={{
                  width: "100%", height: 1, marginTop: 7,
                  background: "linear-gradient(to right, transparent, rgba(196,169,125,.4), transparent)",
                }} />
             
              </div>

              {/* time + status */}
              <div style={{ textAlign: "right" }}>
                <div className="gd" style={{ fontSize: 16, color: "#ede5d5", letterSpacing: ".3px" }}>
                  {t.clock}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#4a8048",
                    animation: "breathe 2.5s ease-in-out infinite",
                  }} />
                  <span className="js" style={{
                    fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase",
                    color: "rgb(241, 241, 240)", fontWeight: 300,
                  }}>
                    Available
                  </span>
                </div>
              </div>
            </div>

            {/* greeting — bottom of hero */}
            <div style={{ paddingBottom: 34 }}>
              <p className="js" style={{
                fontSize: 11, letterSpacing: "4px", textTransform: "uppercase",
                color: "#5a5040", fontWeight: 300, marginBottom: 12,
              }}>
                {t.date}
              </p>
              <h1 className="gd" style={{
                fontSize: 46, color: "#ede5d5",
                letterSpacing: "-0.5px", lineHeight: 1.1,
                fontStyle: "italic",
              }}>
                {t.greet}.
              </h1>
            </div>
          </div>
        </div>

        {/* ── Body - Increased maxWidth for tablet centering ───────────────── */}
        <div style={{
          maxWidth: 720, margin: "0 auto",
          padding: "0 32px 64px",
        }}>

          {/* sympathy panel */}
          <div style={{
            marginTop: 32, marginBottom: 36,
            borderRadius: 18,
            border: "1px solid rgba(196,169,125,.16)",
            background: "#000000", 
            padding: "32px 30px",
            display: "flex", alignItems: "center", gap: 28,
            boxShadow: "0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.025)",
            position: "relative", overflow: "hidden",
          }}>
            {/* top shimmer */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(to right, transparent 8%, rgba(196,169,125,.35) 50%, transparent 92%)",
            }} />
            <Candle />
            <div>
              <h2 className="gd" style={{
                fontSize: 22, color: "#ede5d5",
                fontStyle: "italic", letterSpacing: "-.1px", lineHeight: 1.2,
                marginBottom: 10,
              }}>
                With Deepest Sympathies
              </h2>
              <p className="js" style={{
                fontSize: 13.5, color: "#9a8e7a", fontWeight: 300,
                lineHeight: 1.7, letterSpacing: ".1px",
              }}>
                We are honoured to receive you. Our team stands ready to assist your family with the utmost care and discretion.
              </p>
            </div>
          </div>

          {/* section label */}
          <div style={{ marginBottom: 16 }}>
            <span className="js" style={{
              fontSize: 9.5, letterSpacing: "5px", textTransform: "uppercase",
              color: "#6a604e", fontWeight: 500,
            }}>
              Select a Service
            </span>
          </div>

          {/* 2×2 cards - gap increased slightly for wider layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {CARDS.map(c => {
              const isHov = hovered === c.num;
              return (
                <div
                  key={c.num}
                  className="svc-card"
                  style={{
                    background: c.bg, 
                    animationDelay: c.delay,
                  }}
                  onMouseEnter={() => setHovered(c.num)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleServiceClick(c.title)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && handleServiceClick(c.title)}
                >
                  <Brackets hover={isHov} />

                  {/* ghost numeral */}
                  <div className="gd" style={{
                    position: "absolute", bottom: -14, right: 10,
                    fontSize: 76, fontStyle: "italic",
                    color: `rgba(255,255,255, ${isHov ? 0.06 : 0.03})`,
                    lineHeight: 1, pointerEvents: "none",
                    userSelect: "none",
                    transition: "color .3s ease",
                  }}>
                    {c.num}
                  </div>

                  {/* top row: icon + arrow */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14,
                      background: c.iconBg,
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), 0 4px 8px rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <c.Icon size={22} strokeWidth={1.4} color={c.iconColor} />
                    </div>
                    <div className="card-arrow">
                      <ArrowUpRight size={18} color="#c4a97d" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* thin gold rule */}
                  <div style={{
                    height: 1,
                    background: `linear-gradient(to right, rgba(196,169,125, ${isHov ? 0.4 : 0.15}), transparent)`,
                    transition: "background .3s ease",
                  }} />

                  {/* text */}
                  <div>
                    <div className="gd" style={{
                      fontSize: 19, color: "#f2f2f2",
                      letterSpacing: "-.1px", lineHeight: 1.25,
                      marginBottom: 6,
                    }}>
                      {c.title}
                    </div>
                    <div className="js" style={{
                      fontSize: 12.5, color: "#94897a", fontWeight: 300,
                      lineHeight: 1.5, letterSpacing: ".1px",
                    }}>
                      {c.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footer */}
          <div style={{ marginTop: 60, textAlign: "center" }}>
            <div style={{
              height: 1, marginBottom: 24,
              background: "linear-gradient(to right, transparent, rgba(196,169,125,.1), transparent)",
            }} />

            {/* ornament */}
            <div className="gd" style={{
              fontSize: 12, color: "rgba(196,169,125,.25)",
              letterSpacing: "7px", marginBottom: 16,
            }}>
              ✦ &nbsp; ✦ &nbsp; ✦
            </div>

            <p className="js" style={{
              fontSize: 12, color: "#5a5040", fontWeight: 300,
              lineHeight: 1.8, marginBottom: 12, letterSpacing: ".2px",
            }}>
              For immediate assistance, our family care team is available at all hours,<br />
              without exception.
            </p>
            <p className="js" style={{
              fontSize: 9, color: "#3a342c", letterSpacing: "4px",
              textTransform: "uppercase", fontWeight: 400,
            }}>
              © Montezuma Funeral Home &nbsp;·&nbsp; Private & Confidential
            </p>
          </div>
        </div>
      </div>

      {/* ── Veil overlay ── */}
      {showOverlay && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,.97)", 
          backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          animation: "veil-in .35s ease forwards",
        }}>
          {/* spinning gold ring */}
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "1px solid rgba(196,169,125,.1)",
            borderTopColor: "#c4a97d",
            animation: "spin 1.1s linear infinite",
            marginBottom: 32,
          }} />
          <div className="gd" style={{
            fontSize: 24, fontStyle: "italic", color: "#ede5d5",
            letterSpacing: "-.2px", marginBottom: 12,
          }}>
            {selectedService}
          </div>
          <div className="js" style={{
            fontSize: 10, color: "#5a5040",
            letterSpacing: "4px", textTransform: "uppercase", fontWeight: 300,
          }}>
            Preparing your session
          </div>
        </div>
      )}
    </>
  );
}