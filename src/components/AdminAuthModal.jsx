import React, { useState } from 'react';
import { ShieldCheck, Lock, X } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default PIN: 1234 or teacher password
    if (pin.trim() === '1234' || pin.trim().toLowerCase() === 'mapua') {
      onUnlock();
      onClose();
      setError(false);
      setPin('');
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Instructor Access
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Enter your instructor passcode to access the consultation roster and CSV export.
          </p>

          <div className="form-group">
            <div className="input-container">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                autoFocus
                placeholder="Enter Instructor Passcode"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className="form-input"
              />
            </div>
            {error && (
              <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '6px' }}>
                Incorrect passcode. Please try again.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Unlock Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
