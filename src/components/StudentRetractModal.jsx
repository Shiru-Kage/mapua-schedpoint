import React, { useState } from 'react';
import { RotateCcw, Search, X, AlertTriangle, CheckCircle2, Clock, Calendar, User, Hash, Mail } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function StudentRetractModal({ isOpen, onClose, bookings, onRetract }) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [retractedReceipt, setRetractedReceipt] = useState(null);

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
    setRetractedReceipt(null);
  };

  const handleConfirmRetract = async (booking) => {
    if (!window.confirm(`Are you sure you want to retract your reservation for ${booking.timeDisplay}? This will release the slot and dispatch an automated cancellation email to ${booking.email}.`)) {
      return;
    }

    setIsRetracting(true);
    try {
      await onRetract(booking.slotId, booking);
      setRetractedReceipt({
        fullName: booking.fullName,
        studentNumber: booking.studentNumber,
        timeDisplay: booking.timeDisplay,
        date: booking.date,
        email: booking.email,
        id: booking.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
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

          {/* Retraction & Email Confirmation Card */}
          {retractedReceipt && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} color="#15803D" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                  Reservation Retracted & Slot Reopened!
                </span>
              </div>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600 }}>
                  <Mail size={15} color="#15803D" />
                  <span>Confirmation email dispatched to:</span>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#0F172A', paddingLeft: '21px' }}>
                  {retractedReceipt.email}
                </div>
                <div style={{ borderTop: '1px dashed #E2E8F0', marginTop: '6px', paddingTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Student:</strong> {retractedReceipt.fullName} ({retractedReceipt.studentNumber})</div>
                  <div><strong>Released Schedule:</strong> {retractedReceipt.timeDisplay} • {getFormattedDateLabel(retractedReceipt.date)}</div>
                </div>
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
                        onClick={() => handleConfirmRetract(b)}
                        className="btn btn-outline-danger"
                        style={{ width: '100%', fontSize: '0.8125rem', padding: '8px' }}
                      >
                        <RotateCcw size={14} />
                        <span>{isRetracting ? 'Retracting & Dispatching Email...' : 'Cancel & Retract This Reservation'}</span>
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
