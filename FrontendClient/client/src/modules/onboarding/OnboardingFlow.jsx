import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Upload, Plus, Trash2, Check, AlertCircle, Phone } from '../../utils/icons/icons';
import api from '../../api/axios';
import { io } from 'socket.io-client';
import Footer from '../../components/layout/Footer';
import env from '../../utils/config/env';
import { getSocketAuth, refreshSocketAuth } from '../../utils/socket/socketAuth';

const C = {
  ink: '#08090A',
  inkSoft: '#111315',
  inkBorder: 'rgba(255,255,255,0.08)',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  line: '#E5E7EB',
  lineDark: '#D1D5DB',
  text: '#111827',
  textDim: '#6B7280',
  textMute: '#9CA3AF',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisGlow: 'rgba(61, 79, 71, 0.15)',
  gray: '#6B6862',
  red: '#9B4A3F',
  redBg: '#F7ECE9',
  success: '#475A43',
  successBg: '#EEF3EC',
};

const STEPS = [
  { key: 'org', label: 'Org Details', description: 'Basic information' },
  { key: 'security', label: 'Security', description: 'Create password' },
  { key: 'review', label: 'Review', description: 'Verify & confirm' },
];

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}$/.test(phone.replace(/\s/g, ''));

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('8+ characters');
  if (!/[A-Z]/.test(password)) errors.push('1 uppercase');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('1 special char');
  return errors;
};

const getPasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  return strength;
};

const getPasswordStrengthColor = (strength) => {
  if (strength === 0) return C.gray;
  if (strength === 1) return C.red;
  if (strength === 2) return C.brass;
  return C.verdigris;
};

const getPasswordStrengthText = (strength) => {
  const texts = ['Enter password', 'Weak', 'Medium', 'Strong'];
  return texts[strength] || 'Strong';
};

const Spinner = () => <span className="spinner" />;

const AlertMessage = ({ type, text }) => {
  if (!text) return null;
  const config = {
    error: { bg: C.redBg, border: C.red, color: C.red },
    success: { bg: C.successBg, border: C.success, color: C.success },
  };
  const style = config[type] || config.error;
  return (
    <div className="alert-message" style={{ background: style.bg, borderColor: style.border, color: style.color }}>
      <AlertCircle size={16} />
      <span>{text}</span>
    </div>
  );
};

const PasswordInput = ({ label, value, onChange, showPassword, onToggle, hasError, errorMessage, disabled, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="form-group">
      <label className="form-label">{label} <span style={{ color: C.red }}>*</span></label>
      <div className="input-wrapper" style={{ border: `1px solid ${hasError ? C.red : isFocused ? C.verdigris : C.lineDark}`, boxShadow: isFocused ? `0 0 0 4px ${C.verdigrisGlow}` : 'none' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input"
          style={{ paddingRight: '2.5rem' }}
        />
        <button type="button" onClick={onToggle} disabled={disabled} className="input-icon-btn">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {errorMessage && <span className="form-error">{errorMessage}</span>}
    </div>
  );
};

const StepIndicator = ({ currentStep }) => {
  return (
    <div className="progress-header">
      <div className="progress-steps">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <React.Fragment key={step.key}>
              <div className="step-node">
                <div className={`step-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                  {isCompleted ? <Check size={14} /> : index + 1}
                </div>
                <span className={`step-text ${isCurrent ? 'active' : ''}`}>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && <div className={`step-line ${index < currentStep ? 'active' : ''}`}></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const FileUpload = ({ label, preview, onUpload, error }) => {
  const handleClick = () => document.getElementById('file-upload').click();

  return (
    <div className="form-group full">
      <label className="form-label">{label} <span style={{ color: C.red }}>*</span></label>
      <div onClick={handleClick} className="upload-area" style={{ border: `1.5px dashed ${error ? C.red : preview ? C.verdigris : C.lineDark}` }}>
        <div className="upload-preview">
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <Upload size={20} color={C.textMute} />
          )}
        </div>
        <div className="upload-text">
          <span className="upload-title">{preview ? 'Logo uploaded. Click to replace.' : 'Click to upload or drag and drop'}</span>
          <span className="upload-sub">SVG, PNG, JPG (max 10MB)</span>
        </div>
      </div>
      <input id="file-upload" type="file" accept="image/jpeg,image/png,image/jpg,image/svg+xml" onChange={onUpload} style={{ display: 'none' }} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

const ReviewItem = ({ label, value }) => (
  <div className="review-item">
    <span className="review-label">{label}</span>
    <span className="review-value">{value || '—'}</span>
  </div>
);

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [socket, setSocket] = useState(null);
  const [progress, setProgress] = useState({ step: '', percent: 0, details: '' });

  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    phoneNumber: '', // Added Phone Number
    location: '',
    password: '',
    verifyPassword: '',
    branchName: '',
    deploymentType: 'single',
  });

  const [branches, setBranches] = useState([{ name: '', location: '' }]);
  const [errors, setErrors] = useState({});

  const goLogin = () => navigate('/login');
  const goTerms = () => navigate('/terms');

  useEffect(() => {
    if (!env.SOCKET_URL) return;
    const newSocket = io(env.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      // Attach handshake auth when a session token already exists (pre-login
      // onboarding may have none — the socketio-service accepts that in dev).
      auth: getSocketAuth(),
    });

    // Re-read credentials before every reconnect so retries never replay a
    // stale token.
    newSocket.on('reconnect_attempt', () => refreshSocketAuth(newSocket));

    newSocket.on('onboarding-progress', (data) => {
      setProgress({
        step: data.step || '',
        percent: data.progress || 0,
        details: data.details || ''
      });
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  }, [errors]);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'File size must be less than 10MB' }));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Only JPG, PNG, or SVG allowed' }));
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, logo: '' }));
  }, []);

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name required';
    if (!formData.email.trim()) newErrors.email = 'Email required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Valid email required';
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number required';
    else if (!validatePhone(formData.phoneNumber)) newErrors.phoneNumber = 'Valid phone number required (e.g., +254712345678)';

    if (!formData.location.trim()) newErrors.location = 'Location required';

    if (formData.deploymentType === 'multi') {
      const validBranches = branches.filter(b => b.name.trim());
      if (validBranches.length === 0) newErrors.branches = 'At least one branch with a name is required';
    } else {
      if (!formData.branchName.trim()) newErrors.branchName = 'Primary branch name required';
    }

    if (!logoFile && !logoPreview) newErrors.logo = 'Logo required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, logoFile, logoPreview, branches]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) newErrors.password = `Must have: ${passwordErrors.join(', ')}`;
    }
    if (!formData.verifyPassword) {
      newErrors.verifyPassword = 'Please confirm password';
    } else if (formData.password !== formData.verifyPassword) {
      newErrors.verifyPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const goNext = useCallback(() => {
    if (currentStep === 0 && !validateStep1()) return;
    if (currentStep === 1 && !validateStep2()) return;
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, validateStep1, validateStep2]);

  const goBack = useCallback(() => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (currentStep < 2) {
      goNext();
      return;
    }
    if (!agreeTerms) {
      setErrors({ terms: 'You must agree to terms' });
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    setApiSuccess('');
    setProgress({ step: 'Initializing...', percent: 0, details: '' });

    try {
      const submitData = new FormData();
      submitData.append('organizationName', formData.organizationName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phoneNumber); // Backend expects 'phone' not 'phoneNumber'
      submitData.append('location', formData.location);
      submitData.append('password', formData.password);
      submitData.append('deploymentType', formData.deploymentType);
      submitData.append('termsAccepted', agreeTerms);
      if (logoFile) submitData.append('logo', logoFile);

      if (formData.deploymentType === 'multi') {
        submitData.append('branches', JSON.stringify(branches.filter(b => b.name.trim())));
      } else {
        submitData.append('branchName', formData.branchName);
      }

      const tenantSlug = formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (socket && socket.connected) {
        socket.emit('join-tenant', { tenantSlug, userId: 'temp', userRole: 'admin' });
      }

      const response = await api.post('/onboarding/organization', submitData, {
        headers: { 'Content-Type': null, 'x-tenant-slug': '' },
        timeout: 300000,
      });

      if (response.data.success || response.status === 200 || response.status === 201) {
        setApiSuccess(response.data.message || 'Organization setup completed! Redirecting...');
        setProgress({ step: 'Complete!', percent: 100, details: 'Redirecting to dashboard...' });

        const onboardingData = {
          organizationName: formData.organizationName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
          logo: logoPreview,
          organizationId: response.data.organizationId,
          userId: response.data.userId,
          completedAt: new Date().toISOString(),
        };

        localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('deploymentType', formData.deploymentType);
        if (response.data.token) localStorage.setItem('authToken', response.data.token);
        if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));

        setTimeout(() => {
          setIsSubmitting(false);
          navigate('/login');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Setup failed.');
      }
    } catch (error) {
      setIsSubmitting(false);
      setProgress({ step: '', percent: 0, details: '' });
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Server error';
        if (status === 409) setApiError('Organization with this email already exists.');
        else if (status === 400) setApiError(message || 'Invalid data provided.');
        else if (status === 500) setApiError('Server error. Please try again later.');
        else setApiError(message || `Error ${status}`);
      } else if (error.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError(error.message || 'An unexpected error occurred.');
      }
    }
  }, [formData, logoFile, agreeTerms, navigate, logoPreview, currentStep, goNext, socket]);

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="split-layout">
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${C.text};background:${C.bone};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:400;letter-spacing:-0.01em;color:${C.ink}}
        p{line-height:1.7;color:${C.textDim}}
        
        .split-layout { display: flex; min-height: 100vh; }
        
        /* ─── LEFT PANEL (Brand / Visual) ─── */
        .brand-panel {
          flex: 1;
          background: ${C.ink};
          color: ${C.bone};
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
          border-right: 1px solid ${C.inkBorder};
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: -10%; left: 20%;
          width: 60%; height: 50%;
          background: radial-gradient(circle, rgba(61, 79, 71, 0.35) 0%, transparent 70%);
          filter: blur(60px); z-index: 0;
          animation: pulse 8s infinite alternate;
        }

        .brand-panel::after {
          content: '';
          position: absolute;
          bottom: -10%; right: -10%;
          width: 50%; height: 50%;
          background: radial-gradient(circle, rgba(139, 115, 85, 0.25) 0%, transparent 70%);
          filter: blur(60px); z-index: 0;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        .brand-header, .brand-footer, .brand-content { position: relative; z-index: 1; }

        .brand-logo {
          display: flex; align-items: center; gap: 0.75rem;
          font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 500; color: ${C.bone};
        }

        .brand-content { max-width: 420px; margin-top: 2rem; }
        .brand-content h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem; color: ${C.bone}; }
        .brand-content h1 em { font-style: italic; color: ${C.brassLight}; }
        .brand-content p { color: rgba(250, 248, 244, 0.6); line-height: 1.7; font-size: 0.95rem; }

        .feature-list { margin-top: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .feature-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem; background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px;
          backdrop-filter: blur(10px); transition: all 0.3s ease;
        }
        .feature-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); }
        .feature-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(61, 79, 71, 0.2); display: flex; align-items: center; justify-content: center;
          color: ${C.verdigrisLight}; flex-shrink: 0;
        }
        .feature-text { display: flex; flex-direction: column; }
        .feature-title { font-size: 0.85rem; font-weight: 600; color: ${C.bone}; }
        .feature-sub { font-size: 0.75rem; color: rgba(250, 248, 244, 0.4); font-family: 'JetBrains Mono', monospace; }

        .brand-footer { font-size: 0.75rem; color: rgba(250, 248, 244, 0.3); font-family: 'JetBrains Mono', monospace; }

        /* ─── RIGHT PANEL (Form) ─── */
        .form-panel {
          flex: 1.2;
          background: ${C.bone};
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }

        .form-nav {
          padding: 1.5rem 3rem;
          display: flex; justify-content: flex-end;
          border-bottom: 1px solid ${C.line};
        }
        .nav-link {
          color: ${C.textDim}; font-size: 0.85rem; text-decoration: none; font-weight: 500; transition: color 0.2s;
          background: transparent; border: none; cursor: pointer; font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { color: ${C.ink}; }

        .form-container {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem 3rem 4rem;
        }
        .form-content { width: 100%; max-width: 580px; }

        .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .progress-steps { display: flex; align-items: center; gap: 0.75rem; }
        .step-node { display: flex; align-items: center; gap: 0.5rem; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: ${C.bone2}; border: 1.5px solid ${C.lineDark};
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: ${C.textMute};
          transition: all 0.3s ease;
        }
        .step-circle.active {
          background: ${C.ink}; border-color: ${C.ink}; color: ${C.bone};
          box-shadow: 0 0 0 4px rgba(8, 9, 10, 0.05);
        }
        .step-circle.completed { background: ${C.verdigris}; border-color: ${C.verdigris}; color: ${C.bone}; }
        .step-line { width: 30px; height: 1.5px; background: ${C.lineDark}; }
        .step-line.active { background: ${C.verdigris}; }
        .step-text {
          font-size: 0.75rem; font-weight: 600; color: ${C.textMute};
          font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .step-text.active { color: ${C.ink}; }

        .form-header { margin-bottom: 2.5rem; }
        .form-header .appreciation {
          font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: ${C.brass}; margin-bottom: 0.75rem; font-weight: 500;
        }
        .form-header h2 {
          font-size: 2.25rem; line-height: 1.2; margin-bottom: 0.5rem; font-weight: 400; color: ${C.ink};
        }
        .form-header h2 em { font-style: italic; color: ${C.brass}; }
        .form-header p { color: ${C.textDim}; font-size: 0.95rem; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: span 2; }

        .form-label {
          font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: ${C.textMute}; margin-bottom: 0.5rem; font-weight: 500;
        }

        .input-wrapper {
          position: relative; background: ${C.bone}; border: 1px solid ${C.lineDark};
          border-radius: 10px; transition: all 0.2s; display: flex; align-items: center;
        }
        .input-wrapper:hover { border-color: ${C.textMute}; }
        .input-wrapper:focus-within {
          border-color: ${C.verdigris}; box-shadow: 0 0 0 4px ${C.verdigrisGlow}; background: #fff;
        }
        .form-input {
          width: 100%; padding: 0.85rem 1rem; background: transparent; border: none; border-radius: 10px;
          font-size: 0.95rem; color: ${C.text}; font-family: 'Inter', sans-serif; outline: none;
        }
        .form-input::placeholder { color: ${C.textMute}; }
        .input-icon-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${C.textMute}; padding: 0.5rem; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .input-icon-btn:hover { color: ${C.ink}; }
        .input-icon-left { position: absolute; left: 1rem; color: ${C.textMute}; pointer-events: none; }
        .input-wrapper.has-icon .form-input { padding-left: 2.5rem; }

        .form-error { display: block; color: ${C.red}; font-size: 0.75rem; margin-top: 0.3rem; }
        .alert-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.5rem; }

        .upload-area {
          border: 1.5px dashed ${C.lineDark}; border-radius: 12px; padding: 1.5rem;
          display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; background: ${C.bone2};
        }
        .upload-area:hover { border-color: ${C.verdigris}; background: rgba(61, 79, 71, 0.03); }
        .upload-preview {
          width: 48px; height: 48px; border-radius: 8px; background: ${C.bone}; border: 1px solid ${C.lineDark};
          display: flex; align-items: center; justify-content: center; color: ${C.textMute}; overflow: hidden; flex-shrink: 0;
        }
        .upload-text { display: flex; flex-direction: column; }
        .upload-title { font-size: 0.9rem; font-weight: 600; color: ${C.ink}; }
        .upload-sub { font-size: 0.75rem; color: ${C.textMute}; }

        .segmented-control {
          display: flex; background: ${C.bone2}; border: 1px solid ${C.lineDark};
          border-radius: 10px; padding: 4px; gap: 4px; cursor: pointer;
        }
        .segment {
          flex: 1; padding: 0.65rem 1rem; text-align: center; border-radius: 7px;
          font-size: 0.85rem; font-weight: 600; color: ${C.textMute}; transition: all 0.2s;
        }
        .segment.active { background: ${C.ink}; color: ${C.bone}; box-shadow: 0 2px 8px rgba(8, 9, 10, 0.15); }

        .branch-list { display: flex; flex-direction: column; gap: 1rem; }
        .branch-card {
          border: 1px solid ${C.line}; border-radius: 12px; padding: 1.25rem;
          background: #fff; transition: all 0.2s;
        }
        .branch-card:hover { border-color: ${C.lineDark}; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .branch-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .branch-title { font-weight: 600; font-size: 0.9rem; color: ${C.ink}; display: flex; align-items: center; gap: 0.5rem; }
        .branch-badge {
          background: ${C.verdigrisGlow}; color: ${C.verdigris}; font-size: 0.65rem;
          padding: 0.15rem 0.5rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;
        }
        .btn-icon {
          background: transparent; border: none; color: ${C.textMute}; cursor: pointer;
          display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; transition: color 0.2s;
        }
        .btn-icon:hover { color: ${C.red}; }

        .btn-add-branch {
          width: 100%; padding: 1rem; background: transparent; border: 1.5px dashed ${C.lineDark};
          border-radius: 10px; color: ${C.textDim}; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: all 0.2s; margin-top: 1rem;
        }
        .btn-add-branch:hover { border-color: ${C.verdigris}; color: ${C.verdigris}; background: rgba(61, 79, 71, 0.02); }

        .form-actions {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid ${C.line};
        }
        .btn-back {
          background: transparent; border: none; color: ${C.textDim}; font-size: 0.9rem; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: color 0.2s;
        }
        .btn-back:hover { color: ${C.ink}; }
        .btn-primary {
          background: ${C.ink}; color: ${C.bone}; border: none; padding: 0.9rem 2rem; border-radius: 10px;
          font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(8, 9, 10, 0.15);
        }
        .btn-primary:hover { background: #000; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(8, 9, 10, 0.2); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .review-item {
          display: flex; justify-content: space-between; padding: 0.8rem 1rem;
          border-bottom: 1px solid ${C.line}; font-size: 0.85rem;
        }
        .review-item:last-child { border-bottom: none; }
        .review-label { color: ${C.textDim}; }
        .review-value { color: ${C.ink}; font-weight: 500; }

        .spinner { width: 14px; height: 14px; border: 2px solid rgba(250,248,244,0.35); border-top-color: ${C.bone}; border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .progress-bar-container {
          margin-bottom: 1.5rem; padding: 1rem; background: ${C.bone2}; border-radius: 8px; border: 1px solid ${C.line};
        }
        .progress-bar-track { width: 100%; height: 6px; background: ${C.line}; border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, ${C.brass}, ${C.verdigris}); border-radius: 3px; transition: width 0.4s ease; }

        @media(max-width: 900px){
          .split-layout { flex-direction: column; }
          .brand-panel { display: none; }
          .form-nav, .form-container { padding-left: 1.5rem; padding-right: 1.5rem; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: span 1; }
          .form-actions { flex-direction: column-reverse; gap: 1rem; }
          .btn-back, .btn-primary { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Left Brand Panel */}
      <aside className="brand-panel">
        <div className="brand-header">
          <div className="brand-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="#FAF8F4" stroke-width="1.5" />
              <path d="M16 8V24M8 16H24" stroke="#FAF8F4" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="16" cy="16" r="3.5" fill="#8B7355" />
            </svg>
            Rest Point
          </div>
        </div>

        <div className="brand-content">
          <h1>Configure your <em>enterprise</em> workspace.</h1>
          <p>Rest Point provides a unified operating system for funeral homes. Set up your organization to begin managing cases, smart dispatch, and family portals with engineering precision.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">Bank-Grade Security</span>
                <span className="feature-sub">AES-256 / SOC2 Compliant</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">Real-Time Sync</span>
                <span className="feature-sub">12ms Global Latency</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          Rest Point OS &copy; 2024
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="form-panel">
        <nav className="form-nav">
          <button onClick={goLogin} className="nav-link">Already have an account? Log in</button>
        </nav>

        <div className="form-container">
          <div className="form-content">
            
            <StepIndicator currentStep={currentStep} />

            {/* Progress Bar */}
            {isSubmitting && progress.percent > 0 && (
              <div className="progress-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink }}>{progress.step}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: C.brass }}>{progress.percent}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
                </div>
                {progress.details && <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: C.textDim, fontStyle: 'italic' }}>{progress.details}</div>}
              </div>
            )}

            {/* Form Header */}
            <div className="form-header">
              {currentStep === 0 && (
                <>
                  <div className="appreciation">Thank you for choosing Rest Point.</div>
                  <h2>Let's get <em>started</em>.</h2>
                  <p>Tell us about your organization so families and your team know who they're working with.</p>
                </>
              )}
              {currentStep === 1 && (
                <>
                  <h2>Secure your <em>account</em></h2>
                  <p>Create a strong password that only your team will use to sign in to Rest Point.</p>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <h2>Review and <em>confirm</em></h2>
                  <p>Check everything looks right, then create your account.</p>
                </>
              )}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <AlertMessage type="success" text={apiSuccess} />
              <AlertMessage type="error" text={apiError} />

              {/* Step 0 Content */}
              {currentStep === 0 && (
                <>
                  <FileUpload label="Organization Logo" preview={logoPreview} onUpload={handleLogoUpload} error={errors.logo} />

                  <div className="form-grid">
                    {/* Organization Name */}
                    <div className="form-group full">
                      <label className="form-label">Organization Name <span style={{ color: C.red }}>*</span></label>
                      <div className="input-wrapper" style={{ border: `1px solid ${errors.organizationName ? C.red : C.lineDark}` }}>
                        <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="e.g., Nairobi Funeral Home" className="form-input" disabled={isSubmitting} />
                      </div>
                      {errors.organizationName && <span className="form-error">{errors.organizationName}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">Contact Email <span style={{ color: C.red }}>*</span></label>
                      <div className="input-wrapper" style={{ border: `1px solid ${errors.email ? C.red : C.lineDark}` }}>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="info@funeralhome.co.ke" className="form-input" disabled={isSubmitting} />
                      </div>
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>

                    {/* Phone Number (NEW) */}
                    <div className="form-group">
                      <label className="form-label">Phone Number <span style={{ color: C.red }}>*</span></label>
                      <div className="input-wrapper has-icon" style={{ border: `1px solid ${errors.phoneNumber ? C.red : C.lineDark}` }}>
                        <span className="input-icon-left"><Phone size={16} /></span>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+254 712 345 678" className="form-input" disabled={isSubmitting} />
                      </div>
                      {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
                    </div>

                    {/* Location */}
                    <div className="form-group full">
                      <label className="form-label">Primary Location <span style={{ color: C.red }}>*</span></label>
                      <div className="input-wrapper" style={{ border: `1px solid ${errors.location ? C.red : C.lineDark}` }}>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Nairobi, Kenya" className="form-input" disabled={isSubmitting} />
                      </div>
                      {errors.location && <span className="form-error">{errors.location}</span>}
                    </div>

                    {/* Deployment Type */}
                    <div className="form-group full" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Deployment Type <span style={{ color: C.red }}>*</span></label>
                      <div className="segmented-control" onClick={(e) => {
                        const segment = e.target.closest('.segment');
                        const val = segment ? (segment.textContent.includes('Single') ? 'single' : 'multi') : formData.deploymentType;
                        setFormData(prev => ({ ...prev, deploymentType: val }));
                        localStorage.setItem('deploymentType', val);
                      }}>
                        <div className={`segment ${formData.deploymentType === 'single' ? 'active' : ''}`} style={formData.deploymentType === 'single' ? { background: C.ink, color: C.bone } : {}}>Single Tenant</div>
                        <div className={`segment ${formData.deploymentType === 'multi' ? 'active' : ''}`} style={formData.deploymentType === 'multi' ? { background: C.ink, color: C.bone } : {}}>Multi Tenant</div>
                      </div>
                    </div>

                    {/* Branches Section */}
                    <div className="form-group full">
                      <label className="form-label" style={{ marginBottom: '1rem' }}>Branch Configuration</label>
                      
                      <div className="branch-list">
                        {formData.deploymentType === 'multi' ? (
                          branches.map((branch, index) => (
                            <div key={index} className="branch-card">
                              <div className="branch-header">
                                <span className="branch-title">
                                  Branch {String(index + 1).padStart(2, '0')}
                                  {index === 0 && <span className="branch-badge">Primary</span>}
                                </span>
                                {branches.length > 1 && (
                                  <button type="button" className="btn-icon" onClick={() => setBranches(branches.filter((_, i) => i !== index))}>
                                    <Trash2 size={14} /> Remove
                                  </button>
                                )}
                              </div>
                              <div className="form-grid" style={{ margin: 0, gap: '1rem' }}>
                                <div className="input-wrapper">
                                  <input type="text" placeholder="Branch Name" value={branch.name} onChange={(e) => { const n = [...branches]; n[index].name = e.target.value; setBranches(n); }} className="form-input" />
                                </div>
                                <div className="input-wrapper">
                                  <input type="text" placeholder="Branch Location" value={branch.location} onChange={(e) => { const n = [...branches]; n[index].location = e.target.value; setBranches(n); }} className="form-input" />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="branch-card">
                            <div className="branch-header">
                              <span className="branch-title">Main Branch <span className="branch-badge">Primary</span></span>
                            </div>
                            <div className="input-wrapper" style={{ border: `1px solid ${errors.branchName ? C.red : C.lineDark}` }}>
                              <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} placeholder="e.g., Headquarters" className="form-input" disabled={isSubmitting} />
                            </div>
                            {errors.branchName && <span className="form-error">{errors.branchName}</span>}
                          </div>
                        )}
                      </div>

                      {formData.deploymentType === 'multi' && (
                        <button type="button" className="btn-add-branch" onClick={() => setBranches([...branches, { name: '', location: '' }])}>
                          <Plus size={16} /> Add Another Branch
                        </button>
                      )}
                      {errors.branches && <span className="form-error" style={{ marginTop: '0.5rem' }}>{errors.branches}</span>}
                    </div>
                  </div>
                </>
              )}

              {/* Step 1 Content */}
              {currentStep === 1 && (
                <>
                  <PasswordInput label="Password" value={formData.password} onChange={(e) => handleChange({ target: { name: 'password', value: e.target.value } })} showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} hasError={!!errors.password} errorMessage={errors.password} disabled={isSubmitting} placeholder="Create a strong password" />

                  {formData.password && (
                    <div className="form-group">
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        {[1, 2, 3].map((level) => (
                          <div key={level} style={{ flex: 1, height: '4px', background: level <= passwordStrength ? getPasswordStrengthColor(passwordStrength) : C.line, borderRadius: '2px', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: getPasswordStrengthColor(passwordStrength), fontWeight: 500 }}>
                        Strength: {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                  )}

                  <PasswordInput label="Verify Password" value={formData.verifyPassword} onChange={(e) => handleChange({ target: { name: 'verifyPassword', value: e.target.value } })} showPassword={showVerifyPassword} onToggle={() => setShowVerifyPassword(!showVerifyPassword)} hasError={!!errors.verifyPassword} errorMessage={errors.verifyPassword} disabled={isSubmitting} placeholder="Confirm your password" />
                </>
              )}

              {/* Step 2 Content */}
              {currentStep === 2 && (
                <>
                  <div style={{ border: `1px solid ${C.line}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', background: '#fff' }}>
                    <ReviewItem label="Organization" value={formData.organizationName} />
                    <ReviewItem label="Email Contact" value={formData.email} />
                    <ReviewItem label="Phone Number" value={formData.phoneNumber} />
                    <ReviewItem label="Location" value={formData.location} />
                    <ReviewItem label="Primary Branch" value={formData.deploymentType === 'multi' ? (branches[0]?.name || '—') : formData.branchName} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ marginTop: '0.25rem', accentColor: C.ink }} />
                    <label htmlFor="terms" style={{ fontSize: '0.85rem', color: C.textDim, lineHeight: 1.5 }}>
                      I agree to the <span style={{ color: C.brass, cursor: 'pointer', textDecoration: 'underline' }} onClick={goTerms}>Terms of Service</span> and <span style={{ color: C.brass, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/privacy')}>Privacy Policy</span>.
                    </label>
                  </div>
                  {errors.terms && <span className="form-error" style={{ marginBottom: '1rem' }}>{errors.terms}</span>}
                </>
              )}

              {/* Footer Actions */}
              <div className="form-actions">
                {currentStep > 0 ? (
                  <button type="button" className="btn-back" onClick={goBack} disabled={isSubmitting}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back
                  </button>
                ) : <div />}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      <span>Setting up... {progress.percent}%</span>
                    </>
                  ) : currentStep === 2 ? 'Complete Setup' : 'Continue Setup'}
                  {!isSubmitting && (
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}