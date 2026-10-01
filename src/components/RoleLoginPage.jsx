import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ALLOWED_INSTRUCTOR_EMAILS, 
  verifyInstructorCredentials, 
  sendPasswordResetCode, 
  verifyResetCode, 
  resetInstructorPassword 
} from '../services/instructorAuth';

export default function RoleLoginPage({ onLoginStudent, onLoginInstructor }) {
  // view: 'select' | 'instructor_login' | 'reset_password'
  const [view, setView] = useState('select');

  // Instructor Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Request code, 2: Enter code & new password, 3: Done
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState('');

  const handleInstructorLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await verifyInstructorCredentials(email, password);
      if (res.success) {
        onLoginInstructor(res.email);
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setLoginError('An unexpected error occurred during authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsSendingCode(true);

    try {
      const res = await sendPasswordResetCode(resetEmail);
      if (res.success) {
        setResetStep(2);
        setResetSuccess(res.message);
        if (res.code) {
          setDevCodeHint(res.code);
        }
      } else {
        setResetError(res.error || 'Unable to send reset code for this email.');
      }
    } catch (err) {
      setResetError('Failed to send verification code. Please check your internet connection.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please verify your new password.');
      return;
    }

    if (newPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    // Verify code first
    const codeCheck = verifyResetCode(resetEmail, resetCode);
    if (!codeCheck.success) {
      setResetError(codeCheck.error);
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetInstructorPassword(resetEmail, newPassword);
      if (res.success) {
        setResetStep(3);
        setResetSuccess('Password has been successfully updated! You can now sign in.');
        setEmail(resetEmail);
        setPassword(newPassword);
      } else {
        setResetError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setResetError('An error occurred while saving your new password.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-canvas)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Top Banner Header */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--mapua-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              OJT Schedpoint
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Mapúa University • OJT Scheduling & Defense Portal
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'var(--status-available-bg)',
            color: 'var(--status-available-text)',
            fontWeight: 700,
            border: '1px solid var(--status-available-border)'
          }}>
            Active System
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>

          {/* VIEW 1: ROLE SELECTION CARDS */}
          {view === 'select' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mapua-crimson-subtle)',
                  color: 'var(--mapua-crimson)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  border: '1px solid var(--mapua-crimson-border)'
                }}>
                  <Sparkles size={14} />
                  <span>Welcome to OJT Consultation Portal</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
                  Please Select Your Portal
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                  Choose your role to access student scheduling or instructor dashboard management.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px'
              }}>
                {/* Student Card */}
                <div 
                  onClick={onLoginStudent}
                  className="academic-card"
                  style={{
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: '1.5px solid var(--border-medium)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--status-selected-bg)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--status-available-bg)',
                      border: '1px solid var(--status-available-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--status-available-text)',
                      marginBottom: '18px'
                    }}>
                      <GraduationCap size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                      I am a Student
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                      Schedule your 10-minute OJT consultation, reserve defense slots, or manage / retract your existing appointment.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Proceed as Student</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Instructor Card */}
                <div 
                  onClick={() => setView('instructor_login')}
                  className="academic-card"
                  style={{
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: '1.5px solid var(--border-medium)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--mapua-crimson)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--mapua-crimson-subtle)',
                      border: '1px solid var(--mapua-crimson-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--mapua-crimson)',
                      marginBottom: '18px'
                    }}>
                      <ShieldCheck size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                      I am an Instructor
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                      Manage available consultation dates, view full student appointment roster, cancel slots, and export records.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Instructor Sign In</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: INSTRUCTOR LOGIN FORM */}
          {view === 'instructor_login' && (
            <div className="academic-card" style={{ padding: '32px' }}>
              <button
                type="button"
                onClick={() => {
                  setView('select');
                  setLoginError('');
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  marginBottom: '20px',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Role Selection</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--mapua-crimson-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--mapua-crimson)'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  Instructor Authentication
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Please enter your registered Mapúa instructor email address and password.
              </p>

              {loginError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '18px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, lineHeight: 1.4 }}>{loginError}</div>
                </div>
              )}

              <form onSubmit={handleInstructorLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Email Field */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Instructor Email Address
                  </label>
                  <div className="input-container">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. acvillaluz@mapua.edu.ph"
                      className="form-input"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick email selector chips */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Quick Select Authorized Email:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ALLOWED_INSTRUCTOR_EMAILS.map((acc) => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setEmail(acc)}
                        style={{
                          background: email === acc ? 'var(--mapua-crimson)' : 'var(--bg-surface)',
                          color: email === acc ? '#ffffff' : 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: email === acc ? 700 : 500
                        }}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('reset_password');
                        setResetEmail(email);
                        setResetStep(1);
                        setResetError('');
                        setResetSuccess('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--mapua-crimson)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Forgot / Reset Password?
                    </button>
                  </div>
                  <div className="input-container" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (default: 1234)"
                      className="form-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Note: Default password is <strong>1234</strong> unless updated.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}
                >
                  {isLoggingIn ? 'Verifying Credentials...' : 'Sign In as Instructor →'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: FORGOT / RESET PASSWORD */}
          {view === 'reset_password' && (
            <div className="academic-card" style={{ padding: '32px' }}>
              <button
                type="button"
                onClick={() => {
                  setView('instructor_login');
                  setResetError('');
                  setResetSuccess('');
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  marginBottom: '20px',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Instructor Sign In</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--mapua-gold-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--mapua-gold)'
                }}>
                  <KeyRound size={20} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  Reset Instructor Password
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Recover access to your instructor account via verified email verification code.
              </p>

              {resetError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>{resetError}</div>
                </div>
              )}

              {resetSuccess && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>{resetSuccess}</div>
                </div>
              )}

              {/* Step 1: Request Code */}
              {resetStep === 1 && (
                <form onSubmit={handleRequestResetCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      Registered Instructor Email
                    </label>
                    <div className="input-container">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. acvillaluz@mapua.edu.ph"
                        className="form-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Authorized Accounts:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ALLOWED_INSTRUCTOR_EMAILS.map((acc) => (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => setResetEmail(acc)}
                          style={{
                            background: resetEmail === acc ? 'var(--mapua-crimson)' : 'var(--bg-surface)',
                            color: resetEmail === acc ? '#ffffff' : 'var(--text-primary)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: resetEmail === acc ? 700 : 500
                          }}
                        >
                          {acc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      justifyContent: 'center'
                    }}
                  >
                    {isSendingCode ? 'Sending Code...' : 'Send 6-Digit Verification Code →'}
                  </button>
                </form>
              )}

              {/* Step 2: Enter Code & New Password */}
              {resetStep === 2 && (
                <form onSubmit={handleCompleteReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {devCodeHint && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: '#1D4ED8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Info size={16} />
                      <span>Verification Code for testing: <strong>{devCodeHint}</strong></span>
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.trim())}
                      placeholder="e.g. 123456"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center' }}
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      New Password
                    </label>
                    <div className="input-container">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 4 characters)"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      Confirm New Password
                    </label>
                    <div className="input-container">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      justifyContent: 'center'
                    }}
                  >
                    {isResetting ? 'Saving New Password...' : 'Save New Password & Continue →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Didn't receive a code? Re-enter email
                  </button>
                </form>
              )}

              {/* Step 3: Success Screen */}
              {resetStep === 3 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#F0FDF4',
                    border: '2px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#166534'
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                    Password Successfully Reset!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                    Your new instructor password is active. You can now access the Instructor Portal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setView('instructor_login')}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 24px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    Proceed to Sign In →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-disabled)',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-surface)'
      }}>
        OJT Schedpoint • Authorized Instructor Access • Mapúa University
      </footer>
    </div>
  );
}
