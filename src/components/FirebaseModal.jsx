import React, { useState } from 'react';
import { Cloud, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { getSavedFirebaseConfig, saveFirebaseConfig } from '../services/firebase';

export default function FirebaseModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getSavedFirebaseConfig();
  const [configText, setConfigText] = useState(
    currentConfig ? JSON.stringify(currentConfig, null, 2) : ''
  );
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      if (!configText.trim()) {
        saveFirebaseConfig(null);
        setStatus('Configuration cleared. Reverting to Local/Server mode.');
        setTimeout(() => {
          onConfigSaved(false);
          onClose();
        }, 1200);
        return;
      }

      // Try parsing JSON or JS object syntax
      let parsed;
      try {
        parsed = JSON.parse(configText);
      } catch {
        // Fallback for JS object without quotes
        const cleaned = configText
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
          .replace(/'/g, '"');
        parsed = JSON.parse(cleaned);
      }

      if (!parsed.apiKey || !parsed.projectId) {
        setStatus('Error: apiKey and projectId are required in Firebase config.');
        return;
      }

      saveFirebaseConfig(parsed);
      setStatus('Firebase Connected Successfully! Refreshing...');
      setTimeout(() => {
        onConfigSaved(true);
        window.location.reload();
      }, 1000);
    } catch (e) {
      setStatus(`Invalid JSON format: ${e.message}`);
    }
  };

  const handleReset = () => {
    saveFirebaseConfig(null);
    setConfigText('');
    setStatus('Firebase disconnected. Using Local / Express SSE.');
    setTimeout(() => {
      onConfigSaved(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Cloud Database (Firebase Firestore)
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

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
            <strong>Default Mode:</strong> By default, this app uses the built-in server with <strong>Server-Sent Events (SSE)</strong> and JSON persistence on your computer or local network.
          </p>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.5 }}>
            <strong>Optional Cloud Mode:</strong> If you want to host this web app permanently on <strong>Vercel, Netlify, or Firebase Hosting</strong> so students can access it from anywhere in the world with real-time slot sync, paste your free Firebase web configuration below:
          </p>

          <textarea
            rows={7}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "..."\n}`}
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              padding: '12px',
              marginBottom: '12px',
              resize: 'vertical'
            }}
          />

          {status && (
            <div style={{
              fontSize: '0.825rem',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '16px',
              background: status.startsWith('Error') ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
              color: status.startsWith('Error') ? '#fda4af' : '#34d399'
            }}>
              {status}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            {currentConfig ? (
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-outline-danger"
                style={{ fontSize: '0.85rem' }}
              >
                <Trash2 size={15} />
                <span>Disconnect</span>
              </button>
            ) : <div></div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Check size={16} />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
