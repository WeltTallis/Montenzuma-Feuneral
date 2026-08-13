import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import './PostmortemQRPage.css';

const PostmortemQRPage = () => {
  const { slug } = useParams();
  const [qrValue, setQrValue] = useState('');
  const [copied, setCopied] = useState(false);

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  useEffect(() => {
    const baseUrl = window.location.origin;
    setQrValue(`${baseUrl}/tenant/${tenantSlug}/postmortem-verify`);
  }, [tenantSlug]);

  const verifyUrl = `${window.location.origin}/tenant/${tenantSlug}/postmortem-verify`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
    } catch (err) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = verifyUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2200);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' }).toUpperCase();
  const hour12 = today.getHours() % 12 || 12;
  const meridiem = today.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div className="pm-page">
      <main className="pm-main">
        <div className="boarding-pass-wrapper">
          {/* Left side - main ticket */}
          <div className="pass-main">
            <div className="header">
              <div className="header-top">
                <div className="airline-logo">
                  <div className="airline-icon">RP</div>
                  <div className="airline-name">RestPoint</div>
                </div>
                <div className="boarding-label">
                  Postmortem
                  <span>Access</span>
                </div>
              </div>
            </div>

            <div className="route-section">
              <div className="airport-code">
                <div className="code">QR</div>
                <div className="city">Scan To Verify</div>
              </div>
              <div className="route-line">
                <div className="line">
                  <span className="plane-icon"><ShieldCheck size={16} /></span>
                </div>
              </div>
              <div className="airport-code">
                <div className="code">VIEW</div>
                <div className="city">View Results</div>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <div className="label">Record</div>
                <div className="value">POSTMORTEM</div>
              </div>
              <div className="detail-item">
                <div className="label">Date</div>
                <div className="value">{dateStr}</div>
              </div>
              <div className="detail-item">
                <div className="label">Tenant</div>
                <div className="value">{tenantSlug.toUpperCase()}</div>
              </div>
            </div>

            <div className="passenger-section">
              <div className="passenger-info">
                <div className="label">Authorized Access</div>
                <div className="name">VIEW POSTMORTEM REPORT</div>
              </div>
              <div className="class-badge">Verified</div>
            </div>
            <div className="details-grid" style={{ borderTop: '1px solid #E3DDD0' }}>
              <div className="detail-item">
                <div className="label">QR Code</div>
                <div className="value highlight">Ready</div>
              </div>
              <div className="detail-item">
                <div className="label">Verify</div>
                <div className="value">Link Below</div>
              </div>
              <div className="detail-item">
                <div className="label">Share</div>
                <div className="value">Copy Link</div>
              </div>
            </div>

            <div className="footer-bar">
              <span>ISSUED BY RESTPOINT</span>
              <span>SECURE ACCESS</span>
            </div>
          </div>

          {/* Tear strip */}
          <div className="tear-strip">
            <div className="tear-dots">
              {Array.from({ length: 20 }).map((_, i) => <span key={i}></span>)}
            </div>
          </div>

          {/* Right side - stub */}
          <div className="pass-stub">
            <div className="stub-header">
              <span className="flight-no">PM-{tenantSlug.toUpperCase()}</span>
              <span className="date">{dateStr}</span>
            </div>

            <div className="stub-times">
              <div className="time-block">
                <div className="label">Issued</div>
                <div className="time">{hour12} <small>{meridiem}</small></div>
              </div>
              <div className="time-divider"></div>
              <div className="time-block">
                <div className="label">Access</div>
                <div className="time">24<span>/7</span></div>
              </div>
            </div>

            <div className="stub-details">
              <div className="stub-detail-row">
                <span className="label">From</span>
                <span className="value">VERIFY</span>
              </div>
              <div className="stub-detail-row">
                <span className="label">To</span>
                <span className="value">RESULTS</span>
              </div>
              <div className="stub-detail-row">
                <span className="label">Type</span>
                <span className="value">POSTMORTEM</span>
              </div>
              <div className="stub-detail-row">
                <span className="label">Status</span>
                <span className="value">SECURE</span>
              </div>
            </div>

            <div className="stub-passenger">
              <div className="label">Share With</div>
              <div className="name">Anyone / Next of Kin</div>
            </div>

            <div className="qr-section">
              <div className="qr-container">
                <QRCodeSVG
                  value={qrValue}
                  size={160}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#3D4F47"
                />
              </div>
              <div className="qr-label">Scan to verify &amp; view report</div>
            </div>

            <div className="stub-footer">
              <div className="stub-link-box">
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stub-link"
                  title="Open verify page"
                >
                  {verifyUrl}
                </a>
                <button className="pm-btn pm-btn-copy" onClick={handleCopy}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostmortemQRPage;
