import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, Check } from '../../utils/icons/icons';
import { ENDPOINTS } from '../../api/endpoints';
import api from '../../api/axios';

const C = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  lineDark: 'rgba(250,248,244,0.14)',
  gray: '#6B6862',
  grayLight: 'rgba(250,248,244,0.62)',
  red: '#9B4A3F',
  redBg: '#F7ECE9',
  redLine: '#E8D2CC',
  success: '#475A43',
  successBg: '#EEF3EC',
  white: '#FFFFFF',
};

const Mark = ({ size = 28, color = C.verdigris }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="16" cy="16" r="15" stroke={color} strokeWidth="1.5" />
    <path d="M16 8V24M8 16H24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="16" cy="16" r="3.5" fill={color} />
  </svg>
);

const Spinner = () => (
  <span className="fp-spinner" />
);

const AlertMessage = ({ type, text }) => {
  if (!text) return null;
  const config = {
    error: { bg: C.redBg, color: C.red, border: C.redLine, icon: AlertCircle },
    success: { bg: C.successBg, color: C.success, border: '#DCE6D9', icon: CheckCircle },
  };
  const s = config[type] || config.error;
  const Icon = s.icon;
  return (
    <div className="fp-alert" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
};

const StepPill = ({ number, label, active, done }) => (
  <div className={`fp-step-pill ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
    <span className="fp-step-num">
      {done ? <Check size={12} strokeWidth={3} /> : number}
    </span>
    <span className="fp-step-label">{label}</span>
  </div>
);

const STEPS = [
  { n: 1, label: 'Email' },
  { n: 2, label: 'Verify code' },
  { n: 3, label: 'Password' },
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const initialAccount = query.get('account') || '';
  const resetToken = query.get('token') || '';
  const [account] = useState(initialAccount);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedAccounts, setVerifiedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(initialAccount && resetToken ? 3 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: email.trim() });
      if (response.data?.success) {
        setVerificationCode('');
        setVerifiedAccounts([]);
        setSelectedAccount('');
        setMessage({ type: 'success', text: response.data?.message || 'If an account exists for that email, a password reset code has been sent.' });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Could not send the code.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not send the code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) {
      setMessage({ type: 'error', text: 'Enter the 6-digit code from your email.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post(ENDPOINTS.AUTH.VERIFY_CODE, {
        email: email.trim(),
        code: verificationCode,
      });
      const accounts = response.data?.accounts || [];
      if (response.data?.success && accounts.length) {
        setVerifiedAccounts(accounts);
        setSelectedAccount(accounts[0].account);
        setStep(3);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'The code is invalid or expired.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'The code is invalid or expired.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        ...(resetToken
          ? { account, token: resetToken }
          : { email: email.trim(), code: verificationCode, account: selectedAccount }),
        password: newPassword,
      });
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Password reset successfully. Redirecting to sign in...' });
        setTimeout(() => navigate('/login'), 1800);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Could not reset your password.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not reset your password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setVerificationCode('');
      setVerifiedAccounts([]);
      setSelectedAccount('');
    }
    else if (step === 3) { setStep(2); }
    setMessage({ type: '', text: '' });
  };

  const sidebarContent = {
    1: {
      headline: 'Don\'t worry, it happens.',
      text: 'We\'ll send a secure reset code to your registered email address.',
    },
    2: {
      headline: 'Check your inbox.',
      text: 'Enter the 6-digit code from your email. The code expires in 15 minutes.',
    },
    3: {
      headline: 'Almost there.',
      text: 'Choose a strong new password. We recommend at least 8 characters with a mix of letters and numbers.',
    },
  };

  return (
    <div className="fp-page-wrapper">
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${C.gray};background:${C.bone2};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${C.ink}}

        .fp-page-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1.5rem; background:${C.bone2}; }

        /* Layout */
        .fp-container { width:100%; max-width:920px; display:flex; background:${C.white}; border-radius:24px; overflow:hidden; box-shadow:0 40px 80px -20px rgba(21,23,26,0.12), 0 10px 20px rgba(21,23,26,0.04); min-height:560px; }

        /* Sidebar */
        .fp-sidebar { width:380px; background:#000000; padding:3rem 2.5rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; flex-shrink:0; }
        .fp-sidebar-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
        .fp-sidebar-glow { position:absolute; inset:0; background:radial-gradient(circle at 30% 40%,rgba(61,79,71,0.3) 0%,transparent 60%); pointer-events:none; }
        .fp-sidebar-inner { position:relative; z-index:1; color:${C.bone}; height:100%; display:flex; flex-direction:column; }
        .fp-sidebar-logo { display:flex; align-items:center; gap:0.7rem; font-family:'Fraunces',serif; font-size:1.3rem; color:${C.bone}; margin-bottom:3rem; cursor:pointer; transition:opacity .2s; }
        .fp-sidebar-logo:hover { opacity:0.8; }
        .fp-sidebar-headline { font-family:'Fraunces',serif; font-size:1.8rem; line-height:1.3; margin-bottom:1rem; color:${C.bone}; }
        .fp-sidebar-text { font-size:0.9rem; color:rgba(255,255,255,0.6); line-height:1.6; }
        .fp-sidebar-footer { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:rgba(255,255,255,0.3); letter-spacing:0.05em; margin-top:auto; padding-top:2rem; }

        /* Steps in sidebar */
        .fp-sidebar-steps { display:flex; flex-direction:column; gap:0.6rem; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.08); }
        .fp-sidebar-step { display:flex; align-items:center; gap:0.75rem; font-size:0.82rem; color:rgba(255,255,255,0.35); transition:all .3s ease; }
        .fp-sidebar-step.active { color:${C.bone}; }
        .fp-sidebar-step.done { color:rgba(255,255,255,0.7); }
        .fp-sidebar-step-num { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:0.65rem; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); flex-shrink:0; transition:all .3s ease; }
        .fp-sidebar-step.active .fp-sidebar-step-num { background:rgba(139,115,85,0.2); border-color:rgba(139,115,85,0.4); color:${C.brassLight}; }
        .fp-sidebar-step.done .fp-sidebar-step-num { background:rgba(71,90,67,0.3); border-color:rgba(71,90,67,0.5); color:#8CB88C; }

        /* Form area */
        .fp-form { flex:1; padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; }

        /* Step pills (top) */
        .fp-steps-row { display:flex; gap:0.5rem; margin-bottom:2rem; }
        .fp-step-pill { display:flex; align-items:center; gap:0.5rem; padding:0.45rem 0.85rem; border-radius:8px; border:1px solid ${C.line}; background:${C.bone2}; font-size:0.78rem; color:${C.gray}; transition:all .3s ease; }
        .fp-step-pill.active { border-color:${C.brass}; background:rgba(139,115,85,0.06); color:${C.brass}; }
        .fp-step-pill.done { border-color:#C5D4C1; background:${C.successBg}; color:${C.success}; }
        .fp-step-num { display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:5px; background:rgba(0,0,0,0.04); font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:500; }
        .fp-step-pill.active .fp-step-num { background:${C.brass}; color:${C.white}; }
        .fp-step-pill.done .fp-step-num { background:${C.success}; color:${C.white}; }

        /* Form header */
        .fp-form-header { margin-bottom:1.5rem; }
        .fp-form-header h1 { font-size:1.8rem; margin-bottom:0.4rem; }
        .fp-form-header p { font-size:0.92rem; color:${C.gray}; line-height:1.5; }
        .fp-form-header p span { color:${C.ink}; font-weight:500; }

        /* Form elements */
        .fp-form-group { margin-bottom:1.2rem; }
        .fp-form-label { display:block; font-family:'JetBrains Mono',monospace; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:${C.brass}; margin-bottom:0.5rem; font-weight:500; }
        .fp-input-wrap { position:relative; border:1px solid ${C.line}; border-radius:8px; background:${C.bone2}; transition:all .2s; }
        .fp-input-wrap:focus-within { border-color:${C.brass}; background:${C.white}; box-shadow:0 0 0 3px rgba(139,115,85,0.12); }
        .fp-input { width:100%; padding:0.85rem 1rem; background:transparent; border:none; border-radius:8px; font-size:0.9rem; color:${C.ink}; font-family:'Inter',sans-serif; outline:none; }
        .fp-input::placeholder { color:${C.gray}; opacity:0.7; }
        .fp-input-icon-btn { position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:${C.gray}; padding:0.5rem; display:flex; align-items:center; justify-content:center; transition:color .2s; border-radius:4px; }
        .fp-input-icon-btn:hover { color:${C.ink}; background:rgba(0,0,0,0.04); }

        /* Code inputs */
        .fp-code-row { display:flex; gap:8px; justify-content:center; margin-bottom:1.5rem; }
        .fp-code-input { width:48px; height:58px; text-align:center; font-size:1.3rem; font-weight:500; font-family:'JetBrains Mono',monospace; background:${C.bone2}; border:1px solid ${C.line}; border-radius:10px; outline:none; color:${C.ink}; transition:all .25s ease; }
        .fp-code-input:focus { border-color:${C.brass}; background:${C.white}; box-shadow:0 0 0 3px rgba(139,115,85,0.12); transform:translateY(-2px); }
        .fp-code-input::placeholder { color:${C.gray}; opacity:0.3; }

        /* Alert */
        .fp-alert { display:flex; align-items:center; gap:0.6rem; padding:0.8rem 1rem; border-radius:8px; border:1px solid; font-size:0.85rem; font-weight:500; margin-bottom:1.2rem; animation:fpFadeUp .35s cubic-bezier(0.16,1,0.3,1) both; }

        /* Buttons */
        .fp-btn-primary { width:100%; padding:0.9rem 1.2rem; font-size:0.9rem; font-weight:600; font-family:'Inter',sans-serif; border:none; border-radius:8px; background:${C.ink}; color:${C.bone}; cursor:pointer; transition:all .3s ease; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .fp-btn-primary:hover:not(:disabled) { background:${C.verdigris}; transform:translateY(-1px); box-shadow:0 10px 20px rgba(21,23,26,0.15); }
        .fp-btn-primary:active:not(:disabled) { transform:translateY(0); }
        .fp-btn-primary:disabled { background:${C.gray}; cursor:not-allowed; opacity:0.5; transform:none; box-shadow:none; }

        .fp-btn-ghost { background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:500; padding:0.4rem 0; display:inline-flex; align-items:center; gap:0.35rem; transition:color .2s; }
        .fp-btn-ghost.brass { color:${C.brass}; }
        .fp-btn-ghost.brass:hover { color:${C.brassLight}; }
        .fp-btn-ghost.verdigris { color:${C.verdigris}; }
        .fp-btn-ghost.verdigris:hover { color:${C.verdigrisDark}; }

        .fp-btn-row { display:flex; align-items:center; justify-content:space-between; margin-top:0.8rem; }

        /* Footer */
        .fp-form-footer { margin-top:2rem; padding-top:1.5rem; border-top:1px solid ${C.line}; text-align:center; }
        .fp-encrypted-badge { display:flex; align-items:center; justify-content:center; gap:0.4rem; margin-top:0.8rem; font-size:0.7rem; font-family:'JetBrains Mono',monospace; color:${C.gray}; opacity:0.6; }

        /* Spinner */
        .fp-spinner { width:16px; height:16px; border:2px solid rgba(250,248,244,0.3); border-top-color:${C.bone}; border-radius:50%; animation:fpSpin .65s linear infinite; display:inline-block; }

        /* Animations */
        @keyframes fpSpin { to { transform:rotate(360deg); } }
        @keyframes fpFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fpFadeIn { from { opacity:0; } to { opacity:1; } }
        .fp-animate { animation:fpFadeUp .4s cubic-bezier(0.16,1,0.3,1) both; }

        /* Responsive */
        @media (max-width:768px) {
          .fp-container { flex-direction:column; max-width:440px; }
          .fp-sidebar { width:100%; padding:2rem; min-height:auto; }
          .fp-sidebar-logo { margin-bottom:1.5rem; }
          .fp-sidebar-headline { font-size:1.4rem; }
          .fp-sidebar-steps { display:none; }
          .fp-form { padding:2.5rem 2rem; }
        }
        @media (max-width:480px) {
          .fp-page-wrapper { padding:0; }
          .fp-container { border-radius:0; min-height:100vh; }
          .fp-sidebar { padding:1.5rem; }
          .fp-sidebar-headline { display:none; }
          .fp-sidebar-text { display:none; }
          .fp-form { padding:2rem 1.5rem; }
          .fp-code-input { width:42px; height:50px; font-size:1.1rem; }
        }
      `}</style>

      <div className="fp-container">
        {/* Sidebar */}
        <div className="fp-sidebar">
          <div className="fp-sidebar-grid" />
          <div className="fp-sidebar-glow" />
          <div className="fp-sidebar-inner">
            <div className="fp-sidebar-logo" onClick={() => navigate('/')}>
              <Mark size={28} color={C.brassLight} />
              Rest Point
            </div>

            <div>
              <h2 className="fp-sidebar-headline">{sidebarContent[step].headline}</h2>
              <p className="fp-sidebar-text">{sidebarContent[step].text}</p>
            </div>

            <div className="fp-sidebar-steps">
              {STEPS.map((s) => {
                const active = step === s.n;
                const done = step > s.n;
                return (
                  <div key={s.n} className={`fp-sidebar-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                    <span className="fp-sidebar-step-num">
                      {done ? <Check size={11} strokeWidth={3} /> : `0${s.n}`}
                    </span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="fp-sidebar-footer">
              WELT TALLIS TECHNOLOGIES
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="fp-form">
          {/* Step pills */}
          <div className="fp-steps-row">
            {STEPS.map((s) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <StepPill key={s.n} number={`0${s.n}`} label={s.label} active={active} done={done} />
              );
            })}
          </div>

          <div className="fp-animate" key={step}>
            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="fp-form-header">
                  <h1>Forgot your password?</h1>
                  <p>Enter your registered email and we'll send you a secure reset code.</p>
                </div>

                <form onSubmit={handleSendCode}>
                  <AlertMessage type={message.type} text={message.text} />

                  <div className="fp-form-group">
                    <label className="fp-form-label">Email address</label>
                    <div className="fp-input-wrap">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (message.text) setMessage({ type: '', text: '' }); }}
                        placeholder="director@funeralhome.co.ke"
                        disabled={isLoading}
                        autoFocus
                        autoComplete="email"
                        className="fp-input"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="fp-btn-primary">
                    {isLoading ? (
                      <><Spinner /><span>Sending code...</span></>
                    ) : (
                      <><span>Send reset code</span><ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Verify emailed code */}
            {step === 2 && (
              <>
                <div className="fp-form-header">
                  <h1>Check your email</h1>
                  <p>Enter the 6-digit reset code sent to <span>{email}</span>.</p>
                </div>
                <form onSubmit={handleVerifyCode}>
                  <AlertMessage type={message.type} text={message.text} />
                  <div className="fp-form-group">
                    <label className="fp-form-label">Verification code</label>
                    <div className="fp-input-wrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          if (message.text) setMessage({ type: '', text: '' });
                        }}
                        placeholder="6-digit code"
                        disabled={isLoading}
                        autoFocus
                        className="fp-input"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="fp-btn-primary">
                    {isLoading ? <><Spinner /><span>Verifying...</span></> : <><span>Verify code</span><ArrowRight size={16} /></>}
                  </button>
                </form>
                <p style={{ color: C.gray, fontSize: '0.88rem', lineHeight: 1.6, marginTop: '1rem' }}>The code expires in 15 minutes. Check your spam folder if it is not in your inbox.</p>
                <div className="fp-btn-row">
                  <button type="button" className="fp-btn-ghost verdigris" onClick={goBack}>
                    <ArrowLeft size={14} /> Use a different email
                  </button>
                  <button type="button" className="fp-btn-ghost brass" onClick={handleSendCode} disabled={isLoading}>
                    Resend code
                  </button>
                </div>
              </>
            )}
            {/* Step 3: New Password */}
            {step === 3 && (
              <>
                <div className="fp-form-header">
                  <h1>Set new password</h1>
                  <p>Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleResetPassword}>
                  <AlertMessage type={message.type} text={message.text} />

                  {!resetToken && verifiedAccounts.length > 1 && (
                    <div className="fp-form-group">
                      <label className="fp-form-label">Account</label>
                      <div className="fp-input-wrap">
                        <select
                          value={selectedAccount}
                          onChange={(e) => setSelectedAccount(e.target.value)}
                          disabled={isLoading}
                          className="fp-input"
                        >
                          {verifiedAccounts.map((verifiedAccount) => (
                            <option key={verifiedAccount.account} value={verifiedAccount.account}>
                              {verifiedAccount.tenantName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="fp-form-group">
                    <label className="fp-form-label">New password</label>
                    <div className="fp-input-wrap">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (message.text) setMessage({ type: '', text: '' }); }}
                        placeholder="At least 8 characters"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className="fp-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={isLoading}
                        className="fp-input-icon-btn"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="fp-form-group">
                    <label className="fp-form-label">Confirm password</label>
                    <div className="fp-input-wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (message.text) setMessage({ type: '', text: '' }); }}
                        placeholder="Repeat your password"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className="fp-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        className="fp-input-icon-btn"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="fp-btn-primary">
                    {isLoading ? (
                      <><Spinner /><span>Resetting...</span></>
                    ) : (
                      <><span>Reset password</span><ArrowRight size={16} /></>
                    )}
                  </button>

                  <div className="fp-btn-row">
                    <button type="button" className="fp-btn-ghost verdigris" onClick={goBack}>
                      <ArrowLeft size={14} /> Go back
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="fp-form-footer">
            <button onClick={() => navigate('/login')} className="fp-btn-ghost verdigris" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              Back to sign in
            </button>
            <div className="fp-encrypted-badge">
              <ShieldCheck size={12} />
              <span>Secure recovery</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>© 2026 Rest Point</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
