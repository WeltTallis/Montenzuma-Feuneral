import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './PostmortemQRPage.css';

const PostmortemQRPage = () => {
  const { slug } = useParams();
  const [qrValue, setQrValue] = useState('');

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  useEffect(() => {
    const baseUrl = window.location.origin;
    setQrValue(`${baseUrl}/tenant/${tenantSlug}/postmortem-verify`);
  }, [tenantSlug]);

  return (
    <div className="pm-page">
      <main className="pm-main">
        {/* Left Side - QR Code Only */}
        <div className="pm-left">
          <div className="qr-pulse">
            <div className="qr-outer">
              <div className="qr-corner tl"></div>
              <div className="qr-corner tr"></div>
              <div className="qr-corner bl"></div>
              <div className="qr-corner br"></div>
              <div className="qr-code-container">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#1A1612"
                />
              </div>
            </div>
          </div>

          <div className="scan-title">
            <h2>Scan to access postmortem results</h2>
          </div>
          <div className="scan-hint">
            Point your camera at the code above
            <br />
            For authorized personnel only
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostmortemQRPage;