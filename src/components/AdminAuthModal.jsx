import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound,
  CheckCircle2,
  Info 
} from 'lucide-react';
import { 
  ALLOWED_INSTRUCTOR_EMAILS, 
  verifyInstructorCredentials, 
  sendPasswordResetCode, 
  verifyResetCode, 
  resetInstructorPassword 
} from '../services/instructorAuth';

export default function AdminAuthModal({ isOpen, onClose, onUnlock }) {
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const res = await verifyInstructorCredentials(email, password);
      if (res.success) {
        onUnlock(res.email);
        onClose();
        setError('');
        setPassword('');
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsSubmittingReset(true);

    try {
      const res = await sendPasswordResetCode(resetEmail);
      if (res.success) {
        setResetStep(2);
        setResetSuccess(res.message);
        if (res.code) setDevCodeHint(res.code);
      } else {
        setResetError(res.error || 'Failed to send reset code.');
      }
    } catch {
      setResetError('Unable to dispatch verification code.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleSaveReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setResetError('Password must be at least 4 characters.');
      return;
    }

    const check = verifyResetCode(resetEmail, resetCode);
    if (!check.success) {
      setResetError(check.error);
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await resetInstructorPassword(resetEmail, newPassword);
      if (res.success) {
        setResetStep(3);
        setResetSuccess('Password updated successfully!');
        setEmail(resetEmail);
        setPassword(newPassword);
      } else {
        setResetError(res.error || 'Failed to update password.');
      }
    } catch {
      setResetError('An error occurred updating password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="var(--mapua-crimson)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              {mode === 'login' ? 'Instructor Authentication' : 'Reset Password'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Enter your authorized instructor email and password to access the instructor portal.
            </p>

            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Instructor Email</label>
              <div className="input-container">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="e.g. acvillaluz@mapua.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick email selector */}
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Authorized Emails:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setResetEmail(email);
                    setResetStep(1);
                    setResetError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--mapua-crimson)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Password?
                </button>
              </div>
              <div className="input-container" style={{ position: 'relative' }}>
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password (default: 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isVerifying ? 'Verifying...' : 'Unlock Portal'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '24px' }}>
            {resetError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#991B1B',
                marginBottom: '14px'
              }}>
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#166534',
                marginBottom: '14px'
              }}>
                {resetSuccess}
              </div>
            )}

            {resetStep === 1 && (
              <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Instructor Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. acvillaluz@mapua.edu.ph"
                    className="form-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setMode('login')} className="btn btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" disabled={isSubmittingReset} className="btn btn-primary" style={{ flex: 1 }}>
                    {isSubmittingReset ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleSaveReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {devCodeHint && (
                  <div style={{ fontSize: '0.8rem', color: '#1D4ED8', background: 'rgba(59, 130, 246, 0.08)', padding: '8px 10px', borderRadius: '4px' }}>
                    Code: <strong>{devCodeHint}</strong>
                  </div>
                )}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    className="form-input"
                    placeholder="123456"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Min 4 characters"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="Re-enter password"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setResetStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" disabled={isSubmittingReset} className="btn btn-primary" style={{ flex: 1 }}>
                    Save Password
                  </button>
                </div>
              </form>
            )}

            {resetStep === 3 && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#166534" style={{ margin: '0 auto 10px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontWeight: 800 }}>Password Reset!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Your password has been updated. You can now log in.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
