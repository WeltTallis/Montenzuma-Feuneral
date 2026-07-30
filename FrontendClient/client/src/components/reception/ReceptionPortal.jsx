import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flame, Building2, LogOut, Flower2, ArrowLeft, FileText } from 'lucide-react';
import QRCodeModal from './QRCodeModal';
import './ReceptionPortal.css';

const ReceptionPortal = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('--:--');
  const [currentDate, setCurrentDate] = useState('Loading...');
  const [greeting, setGreeting] = useState('Good morning');
  const [selectedService, setSelectedService] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [deceasedId, setDeceasedId] = useState('ADM-2025-00472');
  
  // Remove unused imports and functions
  // const getQRCodeValue = () => {
  //   return `${window.location.origin}/tenant/${tenantSlug}/portal/reports/${deceasedId}`;
  // };

  // Get tenant slug from URL params or localStorage
  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Time format: 10:42 AM
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentTime(timeString);

      // Date format: Monday, October 23
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = now.getDate();

      setCurrentDate(`${dayName}, ${monthName} ${dateNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = "Good morning";

    if (hour >= 12 && hour < 17) {
      greetingText = "Good afternoon";
    } else if (hour >= 17) {
      greetingText = "Good evening";
    }

    setGreeting(greetingText);
  }, []);

  const handleServiceClick = (serviceName) => {
    console.log('Navigating to:', serviceName, 'with slug:', tenantSlug);
    setSelectedService(serviceName);
    setShowOverlay(true);

    setTimeout(() => {
      // Tenant-aware navigation - only for receptionist services
      let redirectPath = '/';
      if (serviceName === 'Body Admission') redirectPath = `/tenant/${tenantSlug}/deceased/register`;
      else if (serviceName === 'Body Release') redirectPath = `/tenant/${tenantSlug}/release-form`;
      else if (serviceName === 'Flower Bookings') redirectPath = `/tenant/${tenantSlug}/flowers/new`;

      console.log('Final redirect path:', redirectPath);
      // Use replace to avoid back button issues
      navigate(redirectPath, { replace: true });
      setShowOverlay(false);
      setSelectedService(null);
    }, 2200);
  };

  const handlePostmortemClick = () => {
    navigate(`/tenant/${tenantSlug}/postmortem-qr`, { replace: true });
  };

  const handleDownloadPDF = () => {
    showToast('Downloading postmortem report as PDF...');
    setTimeout(() => {
      showToast('Report downloaded successfully');
    }, 1500);
  };

  const handleViewResults = () => {
    setShowQRModal(false);
    navigate(`/tenant/${tenantSlug}/postmortem-results`, { replace: true });
  };

  const showToast = (message) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2C2820;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <div className="app-container">
      {/* Header with back button */}
      <header className="app-header">
        <div>
          <button className="back-icon-btn" onClick={() => navigate(`/tenant/${tenantSlug}/all-deceased`, { replace: true })}>
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="time-block">
          <div className="live-time">{currentTime}</div>
          <div className="live-date">{currentDate}</div>
        </div>
        <div className="status-badge">
          <div className="status-dot"></div>
          <span className="status-text">Available 24/7</span>
        </div>
      </header>

      {/* Dynamic Greeting */}
      <div className="greeting-block">
        <h1 className="greeting-text">{greeting}</h1>
        <p className="greeting-sub">Welcome to Lee Funeral Home. How may we assist you today?</p>
      </div>

      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-icon">
          <div className="hero-flame"></div>
        </div>
        <h2 className="hero-title">With Deepest Sympathies</h2>
        <p className="hero-subtitle">We are deeply sorry for your loss. Our team is available to guide you through every step, at any hour.</p>
      </div>

      {/* Controls Grid */}
      <div className="controls-title">Select a Service</div>

      <div className="controls-grid">
        {/* Card 1: Body Admission */}
        <div
          className="service-card card-admission"
          onClick={() => handleServiceClick('Body Admission')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-icon">
            <Building2 size={24} strokeWidth={1.5} />
          </div>
          <div className="card-content">
            <div className="card-title">Body Admission</div>
            <div className="card-sub">Respectful reception</div>
          </div>
        </div>

        {/* Card 2: Body Release */}
        <div
          className="service-card card-release"
          onClick={() => handleServiceClick('Body Release')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-icon">
            <LogOut size={24} strokeWidth={1.5} />
          </div>
          <div className="card-content">
            <div className="card-title">Body Release</div>
            <div className="card-sub">Coordinated release</div>
          </div>
        </div>

        {/* Card 3: Flower Bookings */}
        <div
          className="service-card card-flowers"
          onClick={() => handleServiceClick('Flower Bookings')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-icon">
            <Flower2 size={24} strokeWidth={1.5} />
          </div>
          <div className="card-content">
            <div className="card-title">Flower Bookings</div>
            <div className="card-sub">Arrange floral tributes & wreaths</div>
          </div>
        </div>

        {/* Card 4: Postmortem Results */}
        <div
          className="service-card card-postmortem"
          onClick={handlePostmortemClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-icon">
            <FileText size={24} strokeWidth={1.5} />
          </div>
          <div className="card-content">
            <div className="card-title">Postmortem Results</div>
            <div className="card-sub">View & share autopsy reports</div>
          </div>
        </div>
      </div>

      {/* Dedicated Footer */}
      <footer className="app-footer">
        <p className="footer-text">If you require immediate assistance, please call our 24/7 line.</p>
        <p className="footer-copy">© Lee Funeral Home • Secure Reception Portal</p>
      </footer>

      {/* App-style Loading Overlay */}
      {showOverlay && (
        <div className="overlay active">
          <div className="overlay-icon"></div>
          <p className="overlay-text">Connecting to {selectedService}</p>
          <p className="overlay-sub">Please wait a moment...</p>
        </div>
      )}

      {/* QR Code Modal for Postmortem Results */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setShowQRModal(false)}>
              <X size={24} />
            </button>
            <div className="qr-modal-header">
              <QrCode size={32} />
              <h2>Postmortem Results Access</h2>
              <p>Scan QR code to view or download results</p>
            </div>
            <div className="qr-modal-body">
              <div className="qr-code-container">
                <QRCodeSVG
                  value={getQRCodeValue()}
                  size={250}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#2C2820"
                />
              </div>
              <div className="qr-info-section">
                <div className="qr-id-input">
                  <label>Deceased ID:</label>
                  <input
                    type="text"
                    value={deceasedId}
                    onChange={(e) => setDeceasedId(e.target.value.toUpperCase())}
                    placeholder="ADM-2025-00472"
                  />
                </div>
                <div className="qr-url-display">
                  <strong>Scan URL:</strong>
                  <code>{getQRCodeValue()}</code>
                </div>
              </div>
            </div>
            <div className="qr-modal-actions">
              <button className="qr-btn qr-btn-secondary" onClick={handleViewResults}>
                <Eye size={18} />
                View Results
              </button>
              <button className="qr-btn qr-btn-primary" onClick={handleDownloadPDF}>
                <Download size={18} />
                Download PDF
              </button>
            </div>
            <div className="qr-modal-footer">
              <p>Clients can scan this QR code with their phone camera to access postmortem results</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionPortal;