import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BODY = "'Space Grotesk', sans-serif";
const HEAD = "'Space Grotesk', sans-serif";

/* ── Inline icon set ───────────────────────────────────────── */
function Icon({ size = 14, sw = 2.25, color = "currentColor", children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
        {children}
      </g>
    </svg>
  );
}
const ArrowLeftIcon = (p) => (<Icon {...p}><path d="m12 19l-7-7l7-7m7 7H5" /></Icon>);
const ArrowUpRightIcon = (p) => (<Icon {...p}><path d="M7 7h10v10M7 17L17 7" /></Icon>);
const Building2Icon = (p) => (<Icon {...p}>
  <path d="M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3" />
  <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
  <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
</Icon>);
const LogOutIcon = (p) => (<Icon {...p}><path d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></Icon>);
const Flower2Icon = (p) => (<Icon {...p}>
  <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" />
  <circle cx="12" cy="8" r="2" />
  <path d="M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5" />
</Icon>);
const FileTextIcon = (p) => (<Icon {...p}>
  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
  <path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" />
</Icon>);
const SparklesIcon = (p) => (<Icon {...p}>
  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4" />
  <circle cx="4" cy="20" r="2" />
</Icon>);

const CARDS = [
  { 
    num: "01", 
    title: "Body Admission", 
    sub: "Respectful reception & formal registration of the deceased", 
    accent: "#00d9ff", 
    bg: "linear-gradient(145deg, #0f1820 0%, #050709 100%)", 
    border: "#00d9ff40", 
    topRule: "linear-gradient(to right, transparent 5%, #00d9ff70 50%, transparent 95%)", 
    ghost: "#00d9ff12", 
    Icon: Building2Icon 
  },
  { 
    num: "02", 
    title: "Body Release", 
    sub: "Dignified coordination of the final departure", 
    accent: "#ff006e", 
    bg: "linear-gradient(145deg, #1f0a15 0%, #0a0305 100%)", 
    border: "#ff006e40", 
    topRule: "linear-gradient(to right, transparent 5%, #ff006e70 50%, transparent 95%)", 
    ghost: "#ff006e12", 
    Icon: LogOutIcon 
  },
  { 
    num: "03", 
    title: "Flower Arrangements", 
    sub: "Bespoke floral tributes, wreaths & memorial displays", 
    accent: "#00d9ff", 
    bg: "linear-gradient(145deg, #0a1520 0%, #050709 100%)", 
    border: "#00d9ff40", 
    topRule: "linear-gradient(to right, transparent 5%, #00d9ff70 50%, transparent 95%)", 
    ghost: "#00d9ff12", 
    Icon: Flower2Icon 
  },
  { 
    num: "04", 
    title: "Postmortem Records", 
    sub: "Secure access to medical documentation & reports", 
    accent: "#ff006e", 
    bg: "linear-gradient(145deg, #180a14 0%, #070304 100%)", 
    border: "#ff006e40", 
    topRule: "linear-gradient(to right, transparent 5%, #ff006e70 50%, transparent 95%)", 
    ghost: "#ff006e12", 
    Icon: FileTextIcon 
  },
];

export default function App() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState({ greet: "Good morning" });
  const [selectedService, setSelectedService] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const tenantSlug = slug || localStorage.getItem("tenantSlug") || "system_shared";

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      let g = "Good morning";
      if (h >= 12 && h < 17) g = "Good afternoon";
      else if (h >= 17) g = "Good evening";
      setT({ greet: g });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setShowOverlay(true);
    setTimeout(() => {
      let redirectPath = "/";
      if (serviceName === "Body Admission") redirectPath = `/tenant/${tenantSlug}/deceased/register`;
      else if (serviceName === "Body Release") redirectPath = `/tenant/${tenantSlug}/release-form/new`;
      else if (serviceName === "Flower Arrangements") redirectPath = `/tenant/${tenantSlug}/flowers/new`;
      else if (serviceName === "Postmortem Records") redirectPath = `/tenant/${tenantSlug}/postmortem-qr`;
      navigate(redirectPath);
      setShowOverlay(false);
      setSelectedService(null);
    }, 1400);
  };

  return (
    <>
      <div style={{ background: "#050507", minHeight: 1100, maxWidth: 1440, margin: "0 auto", width: "100%", fontFamily: BODY }}>
        {/* ── Hero ── */}
        <div className="rp-hero" style={{ position: "relative", overflow: "hidden", height: 320 }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <img
              src="https://storage.googleapis.com/banani-generated-images/generated-images/913b17cd-4eec-4aa5-9807-da8e838ce6ec.jpg"
              alt="Montezuma Funeral Home chapel"
              style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "16/6" }}
            />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.85) 45%, rgba(5,5,7,0.4) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,7,1) 0%, rgba(5,5,7,0) 55%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,217,255,0.08) 0%, transparent 60%)" }} />

          <div className="rp-top" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 48px 0" }}>
            <button
              className="rp-back"
              onClick={() => navigate(`/tenant/${tenantSlug}/all-deceased`, { replace: true })}
              style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, color: "#00d9ff", background: "transparent", border: "none", padding: "4px 0", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, cursor: "pointer" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 14, height: 14 }}>
                <ArrowLeftIcon size={14} color="currentColor" sw={3.4} />
              </span>
            </button>

            <div className="rp-wordmark" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div className="rp-name" style={{ fontSize: 18, letterSpacing: 6, textTransform: "uppercase", color: "#e8e8eb", fontWeight: 600, fontFamily: HEAD }}>Montezuma Funeral Home</div>
              <div style={{ width: 128, height: 1, background: "linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent)" }} />
              <div className="rp-tag" style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#8a8a95", fontWeight: 500, fontFamily: BODY }}>Receptionist Portal</div>
            </div>

            <div className="rp-time" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d9ff" }} />
                <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#6a8a95", fontWeight: 500, fontFamily: BODY }}>Available</span>
              </div>
            </div>
          </div>

          <div className="rp-bottom" style={{ position: "absolute", bottom: 0, left: 0, zIndex: 10, padding: "0 48px 40px" }}>
            <div style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#5a5a65", fontWeight: 500, fontFamily: BODY, marginBottom: 8 }}>{t.greet}</div>
            <h1 className="rp-title" style={{ fontFamily: HEAD, fontSize: 52, color: "#e8e8eb", lineHeight: 1.05, letterSpacing: -0.5, fontStyle: "italic", fontWeight: 600, margin: 0 }}>Welcome back.</h1>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="rp-body" style={{ padding: "0 48px 64px", background: "#050507" }}>
          {/* services header */}
          <div className="rp-svc-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 7, textTransform: "uppercase", color: "#5a5a65", fontWeight: 600, fontFamily: BODY, marginBottom: 4 }}>Services</div>
              <h3 style={{ fontFamily: HEAD, fontSize: 28, color: "#00d9ff", fontStyle: "italic", fontWeight: 600, margin: 0 }}>Select a Service to Begin</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8a8a95", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, fontFamily: BODY }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 14, height: 14 }}>
                <SparklesIcon size={14} color="currentColor" sw={3.4} />
              </span>
              <span>4 Available</span>
            </div>
          </div>

          {/* service cards */}
          <div className="rp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            {CARDS.map((c) => (
              <button key={c.num} onClick={() => handleServiceClick(c.title)} className="rp-card-btn" style={{ textAlign: "left", padding: 0, background: "transparent", border: 0, width: "100%", fontFamily: "inherit", cursor: "pointer", display: "block" }}>
                <div className="rp-card" style={{ position: "relative", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", background: c.bg, border: `1.5px solid ${c.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)", padding: "36px 32px 30px", minHeight: 280 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: c.topRule }} />
                  <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: `2px solid ${c.accent}`, borderLeft: `2px solid ${c.accent}` }} />
                  <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: `2px solid ${c.accent}`, borderRight: `2px solid ${c.accent}` }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: `2px solid ${c.accent}`, borderLeft: `2px solid ${c.accent}` }} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: `2px solid ${c.accent}`, borderRight: `2px solid ${c.accent}` }} />
                  <div style={{ position: "absolute", bottom: 4, right: 8, fontFamily: HEAD, fontSize: 100, fontStyle: "italic", color: c.ghost, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{c.num}</div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, position: "relative", zIndex: 1 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: `${c.accent}22`, border: `1.5px solid ${c.accent}50`, boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <c.Icon size={26} sw={1.85} color={c.accent} />
                    </div>
                    <div style={{ fontFamily: HEAD, fontSize: 28, color: c.accent, fontStyle: "italic", opacity: 0.6 }}>{c.num}</div>
                  </div>
                  <div style={{ marginBottom: 24, height: 4, background: `linear-gradient(to right, ${c.accent}60, transparent)` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 22, color: "#f0ebe3", letterSpacing: "-0.3px", lineHeight: 1.3, fontWeight: 500, marginBottom: 12 }}>{c.title}</div>
                    <div style={{ fontFamily: BODY, fontSize: 13.5, color: "#a89a88", fontWeight: 300, lineHeight: 1.7 }}>{c.sub}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 8, position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: c.accent }}>
                      <span style={{ fontFamily: BODY, fontSize: 12, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 500, opacity: 0.9 }}>Continue</span>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 16, height: 16 }}>
                        <ArrowUpRightIcon size={16} color="currentColor" sw={2.25} />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* veil overlay */}
      {showOverlay && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.97)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(0,217,255,0.1)", borderTopColor: "#00d9ff", marginBottom: 32, animation: "reception-spin 1.1s linear infinite" }} />
          <div style={{ fontFamily: HEAD, fontSize: 24, fontStyle: "italic", color: "#e8e8eb", letterSpacing: "-0.2px", marginBottom: 12 }}>{selectedService}</div>
          <div style={{ fontFamily: BODY, fontSize: 10, color: "#5a5a65", letterSpacing: 4, textTransform: "uppercase", fontWeight: 300 }}>Preparing your session</div>
        </div>
      )}
      <style>{`
        @keyframes reception-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .rp-hero { height: 280px !important; }
          .rp-top { padding: 28px 32px 0 !important; }
          .rp-bottom { padding: 0 32px 40px !important; }
          .rp-body { padding: 0 32px 56px !important; }
          .rp-title { font-size: 44px !important; }
          .rp-name { font-size: 15px !important; letter-spacing: 3px !important; }
          .rp-grid { gap: 22px !important; }
        }

        @media (max-width: 880px) {
          .rp-hero { height: 260px !important; }
          .rp-top { flex-wrap: wrap !important; row-gap: 12px !important; padding: 22px 24px 0 !important; }
          .rp-back { flex: 1 !important; }
          .rp-time { flex: 1 !important; align-items: flex-end !important; }
          .rp-wordmark { order: 3 !important; flex-basis: 100% !important; margin-top: 6px !important; }
          .rp-bottom { padding: 0 24px 36px !important; }
          .rp-body { padding: 0 24px 48px !important; }
          .rp-title { font-size: 38px !important; }
          .rp-name { font-size: 13px !important; letter-spacing: 2px !important; }
          .rp-grid { gap: 20px !important; }
          .rp-grid .rp-card { min-height: 250px !important; padding: 28px 24px 24px !important; }
        }

        @media (max-width: 720px) {
          .rp-hero { height: 240px !important; }
          .rp-top { padding: 20px 20px 0 !important; }
          .rp-bottom { padding: 0 20px 32px !important; }
          .rp-body { padding: 0 20px 48px !important; }
          .rp-title { font-size: 34px !important; }
          .rp-name { font-size: 14px !important; letter-spacing: 3px !important; text-align: center !important; }
          .rp-grid { grid-template-columns: 1fr !important; }
          .rp-svc-head { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .rp-grid .rp-card { min-height: 240px !important; }
        }

        @media (max-width: 480px) {
          .rp-hero { height: 200px !important; }
          .rp-top { flex-wrap: wrap !important; row-gap: 12px !important; padding: 16px 16px 0 !important; }
          .rp-back { flex: 1 !important; }
          .rp-time { flex: 1 !important; align-items: flex-end !important; }
          .rp-wordmark { order: 3 !important; flex-basis: 100% !important; margin-top: 6px !important; }
          .rp-title { font-size: 28px !important; }
          .rp-name { font-size: 12px !important; letter-spacing: 2px !important; }
          .rp-tag { font-size: 8px !important; letter-spacing: 2px !important; }
          .rp-bottom { padding: 0 16px 28px !important; }
          .rp-body { padding: 0 16px 32px !important; }
          .rp-grid .rp-card { min-height: 200px !important; padding: 24px 20px 20px !important; }
        }
      `}</style>
    </>
  );
}