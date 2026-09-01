import { useState, useEffect } from 'react';

/**
 * FloatingCTA — Readily accessible WhatsApp + ringing Call buttons pinned to the
 * bottom-left of the landing page.
 *
 * Scroll behavior: the widget fades out while the user is scrolling and fades
 * back in ~400ms after they stop (no scroll events for that long).
 */
const FloatingCTA = () => {
  const [visible, setVisible] = useState(true);
  const [waOpen, setWaOpen] = useState(false);

  useEffect(() => {
    let timer = null;
    const onScroll = () => {
      setVisible(false);
      setWaOpen(false); // close the chat popup while scrolling
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(true), 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
  }, []);

  const waHref = 'https://wa.me/254740045355?text=Hello%2C%20I%20have%20a%20question';
  const telHref = 'tel:0740045355';

  return (
    <>
      <style>{`
        /* Basic page styling context */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        /* --- FLOATING WIDGET STYLES --- */
                .floating-container {
          position: fixed;
          bottom: 30px;
          right: 30px; /* Pinned to bottom-right */
          z-index: 9999;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
                    align-items: flex-end; /* Align to right */
          gap: 15px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        /* Fade out animation when scrolling */
        .floating-container.hidden {
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none; /* Prevent clicks when hidden */
        }

        .floating-block {
          position: relative;
        }

        .floating-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          position: relative;
          transition: transform 0.3s ease, background-color 0.3s ease;
          text-decoration: none;
        }

        .floating-btn::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          z-index: -1;
          animation: pulse 2s infinite;
        }

        .whatsapp-btn { background-color: #25D366; }
        .whatsapp-btn::before { background-color: #25D366; }
        .whatsapp-btn:hover { background-color: #1ebe57; }

        .call-btn { background-color: #007bff; }
        .call-btn::before { background-color: #007bff; }
        .call-btn:hover { background-color: #0056b3; }

        /* --- RINGING ANIMATION FOR CALL ICON --- */
        .call-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          animation: shake 0.8s ease-in-out infinite; 
          transform-origin: 50% 50%;
        }

        .ringing-dots {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-left: 2px;
        }

        .ringing-dots span {
          display: block;
          background-color: white;
          border-radius: 50%;
          animation: blink 1s infinite both;
        }
        .ringing-dots span:nth-child(1) { width: 3px; height: 3px; animation-delay: 0.1s; }
        .ringing-dots span:nth-child(2) { width: 4px; height: 4px; animation-delay: 0.3s; }
        .ringing-dots span:nth-child(3) { width: 5px; height: 5px; animation-delay: 0.5s; }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }

        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        /* --- SMALL TOOLTIP FOR CALL BUTTON --- */
        .tooltip-text {
          position: absolute;
          left: 65px; /* sits just outside the right of the button */
          top: 50%;
          transform: translateY(-50%);
          background-color: #333;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        /* Small arrow pointing left towards the button */
        .tooltip-text::after {
          content: "";
          position: absolute;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 6px 6px 0;
          border-style: solid;
          border-color: transparent #333 transparent transparent;
        }

        .call-btn:hover .tooltip-text {
          opacity: 1;
          visibility: visible;
        }

        /* --- CHAT POPUP FOR WHATSAPP BUTTON --- */
        .popup-box {
          position: absolute;
          bottom: 60px;
          left: 0;
          width: 300px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .popup-box.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .popup-header {
          color: white;
          padding: 15px;
          display: flex;
          align-items: center;
        }
        .whatsapp-header { background-color: #075E54; }

        .avatar {
          width: 40px;
          height: 40px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 10px;
          overflow: hidden;
        }

        .header-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .header-info span { font-size: 12px; color: #d1d7db; }
        .header-info span::before { content: "● "; color: #25D366; }

        .popup-body { background-color: #ECE5DD; padding: 15px; min-height: 80px; }

        .popup-message {
          background-color: white;
          padding: 10px 15px;
          border-radius: 8px;
          max-width: 85%;
          font-size: 14px;
          color: #333;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          position: relative;
        }
        .popup-message::after {
          content: "";
          position: absolute;
          left: -8px;
          top: 10px;
          border-width: 6px 8px 6px 0;
          border-style: solid;
          border-color: transparent white transparent transparent;
        }

        .popup-footer { padding: 15px; background-color: white; }

        .action-btn {
          display: block;
          width: 100%;
          padding: 12px;
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 15px;
          transition: background-color 0.3s;
        }
        .action-whatsapp { background-color: #25D366; }
        .action-whatsapp:hover { background-color: #1ebe57; }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      <div className={`floating-container ${visible ? '' : 'hidden'}`}>
        
        {/* ================= WHATSAPP BLOCK ================= */}
        <div 
          className="floating-block"
          onMouseEnter={() => setWaOpen(true)}
          onMouseLeave={() => setWaOpen(false)}
        >
          <div className={`popup-box ${waOpen ? 'open' : ''}`}>
            <div className="popup-header whatsapp-header">
              <div className="avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="25" height="25">
                  <path fill="#075E54" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C82.7 304 0 382.8 0 481.3C0 497.7 13.3 512 29.7 512H418.3c16.4 0 29.7-14.3 29.7-30.7C448 382.8 365.3 304 269.7 304H178.3z"/>
                </svg>
              </div>
              <div className="header-info">
                <h3>WhatsApp Support</h3>
                <span>Online</span>
              </div>
            </div>
            <div className="popup-body">
              <div className="popup-message">Hi there 👋 <br /> Chat with us on WhatsApp!</div>
            </div>
            <div className="popup-footer">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="action-btn action-whatsapp">
                Start Chat
              </a>
            </div>
          </div>

          <a href={waHref} target="_blank" rel="noopener noreferrer" className="floating-btn whatsapp-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="28" height="28">
              <path fill="#ffffff" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-119.3 0-216 96.7-216 216 0 38.1 9.9 75.3 28.9 108.7L32 480l118.9-31.2c32.4 17.7 68.8 27 106.1 27h.1c119.3 0 216-96.7 216-216 0-59.3-25.2-115.1-67.2-157.1zM223.9 438.6c-31.7 0-62.9-8.5-90.1-24.6l-6.5-3.9-68.1 17.9 18.2-66.5-4.2-6.8c-17.5-27.9-26.7-60.2-26.7-93.6 0-97.8 79.6-177.4 177.4-177.4 47.4 0 91.9 18.5 125.4 52 33.5 33.6 52 78.1 52 125.5 0 97.8-79.6 177.4-177.4 177.4z"/>
            </svg>
          </a>
        </div>

        {/* ================= CALL BLOCK ================= */}
        <div className="floating-block">
          <span className="tooltip-text">Call: 0740045355</span>

          <a href={telHref} className="floating-btn call-btn">
            <div className="call-content">
              {/* Real White Phone Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24">
                <path fill="#ffffff" d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/>
              </svg>
              {/* Blinking Sound Wave Dots */}
              <div className="ringing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </a>
        </div>

      </div>
    </>
  );
};

export default FloatingCTA;