import React, { useState } from 'react';
import { RotateCcw, Search, X, AlertTriangle, CheckCircle2, Clock, Calendar, User, Hash } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function StudentRetractModal({ isOpen, onClose, bookings, onRetract }) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const cleanQuery = studentIdInput.trim().toLowerCase();
  const matchedBookings = cleanQuery
    ? bookings.filter(b => 
        String(b.studentNumber || '').trim().toLowerCase() === cleanQuery ||
        String(b.id || '').trim().toLowerCase() === cleanQuery
      )
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    setSuccessMessage('');
  };

  const handleConfirmRetract = async (slotId, timeDisplay) => {
    if (!window.confirm(`Are you sure you want to retract your reservation for ${timeDisplay}? This will release the slot so other students can take it.`)) {
      return;
    }

    setIsRetracting(true);
    try {
      await onRetract(slotId);
      setSuccessMessage(`Reservation for ${timeDisplay} has been successfully cancelled and reopened for other students.`);
      setSearched(false);
      setStudentIdInput('');
    } catch (err) {
      alert('Failed to retract reservation: ' + err.message);
    } finally {
      setIsRetracting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} color="var(--mapua-crimson)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Retract / Manage Your Reservation
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Need to change your time or can no longer attend? Enter your <strong>Student Number</strong> or <strong>Reference ID</strong> to locate and release your slot for your peers.
          </p>

          {/* Success Banner */}
          {successMessage && (
            <div style={{
              background: 'var(--status-available-bg)',
              border: '1px solid var(--status-available-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} color="var(--status-available-text)" />
              <div style={{ fontSize: '0.8125rem', color: 'var(--status-available-text)', fontWeight: 600 }}>
                {successMessage}
              </div>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ marginBottom: '18px' }}>
            <div className="input-container" style={{ marginBottom: '10px' }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                autoFocus
                placeholder="Enter Student Number (e.g. 2022104592)"
                value={studentIdInput}
                onChange={(e) => {
                  setStudentIdInput(e.target.value);
                  setSearched(false);
                }}
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!studentIdInput.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '9px' }}
            >
              Find My Active Booking
            </button>
          </form>

          {/* Search Results */}
          {searched && (
            <div>
              {matchedBookings.length === 0 ? (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)'
                }}>
                  No active reservations found for student number: <strong>{studentIdInput}</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {matchedBookings.map((b) => (
                    <div
                      key={b.slotId}
                      style={{
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        background: 'var(--bg-surface)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {b.fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ID: {b.studentNumber} • {b.gender ? `${b.gender} • ` : ''}{b.course}
                          </div>
                        </div>
                        <span className="badge badge-booked">
                          Reserved
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 10px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        marginBottom: '12px'
                      }}>
                        <Clock size={15} color="var(--mapua-crimson)" />
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {b.timeDisplay}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {getFormattedDateLabel(b.date)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isRetracting}
                        onClick={() => handleConfirmRetract(b.slotId, b.timeDisplay)}
                        className="btn btn-outline-danger"
                        style={{ width: '100%', fontSize: '0.8125rem', padding: '8px' }}
                      >
                        <RotateCcw size={14} />
                        <span>Cancel & Retract This Reservation</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
