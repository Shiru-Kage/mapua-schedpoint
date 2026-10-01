import React, { useState } from 'react';
import { RotateCcw, Search, X, AlertTriangle, CheckCircle2, Clock, Calendar, User, Hash, Mail, ShieldAlert, KeyRound } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function StudentRetractModal({ isOpen, onClose, bookings, onRetract }) {
  const [refQueryInput, setRefQueryInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [retractedReceipt, setRetractedReceipt] = useState(null);

  // Mandatory Reference Code Verification State
  const [retractingBooking, setRetractingBooking] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  if (!isOpen) return null;

  const cleanQuery = refQueryInput.trim().toLowerCase();
  const matchedBookings = cleanQuery
    ? bookings.filter(b => 
        String(b.id || '').trim().toLowerCase() === cleanQuery ||
        String(b.referenceCode || '').trim().toLowerCase() === cleanQuery ||
        String(b.studentNumber || '').trim().toLowerCase() === cleanQuery ||
        String(b.email || '').trim().toLowerCase() === cleanQuery
      )
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    setRetractedReceipt(null);
    setRetractingBooking(null);
  };

  const handleInitiateRetract = (booking) => {
    setRetractingBooking(booking);
    setVerifyError('');
    // Strictly require manual code input, never prefill
    setVerifyCodeInput('');
  };

  const handleExecuteVerifiedRetraction = async () => {
    if (!retractingBooking) return;

    const enteredCodeClean = verifyCodeInput.trim().toUpperCase();
    const actualCodeClean = String(retractingBooking.id || '').trim().toUpperCase();

    // STRICT REFERENCE CODE ENFORCEMENT:
    if (enteredCodeClean !== actualCodeClean) {
      setVerifyError('❌ Invalid Reference Code. Retraction denied. You must enter the exact Reference Code (e.g. BKG-...) for this booking.');
      return;
    }

    setIsRetracting(true);
    setVerifyError('');

    try {
      await onRetract(retractingBooking.slotId, retractingBooking);
      setRetractedReceipt({
        fullName: retractingBooking.fullName,
        studentNumber: retractingBooking.studentNumber,
        timeDisplay: retractingBooking.timeDisplay,
        date: retractingBooking.date,
        email: retractingBooking.email,
        id: retractingBooking.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setRetractingBooking(null);
      setVerifyCodeInput('');
      setSearched(false);
      setRefQueryInput('');
    } catch (err) {
      setVerifyError('Failed to retract reservation: ' + err.message);
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
            onClick={() => {
              setRetractingBooking(null);
              setVerifyError('');
              onClose();
            }}
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
            Need to change your time or can no longer attend? Enter your <strong>Student Number</strong> or <strong>Email</strong> to locate your reservation. To confirm cancellation, you will be prompted to enter your private <strong>Reference Code</strong> sent to your email or saved on your pass.
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
                  <span>Cancellation details:</span>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#0F172A', paddingLeft: '21px' }}>
                  {retractedReceipt.email}
                </div>
                <div style={{ borderTop: '1px dashed #E2E8F0', marginTop: '6px', paddingTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Student:</strong> {retractedReceipt.fullName} ({retractedReceipt.studentNumber})</div>
                  <div><strong>Released Schedule:</strong> {retractedReceipt.timeDisplay} • {getFormattedDateLabel(retractedReceipt.date)}</div>
                  <div><strong>Reference ID:</strong> {retractedReceipt.id}</div>
                </div>

                {/* Option 1: 1-Click Email Cancellation Receipt */}
                {(() => {
                  const subject = `[OJT Schedpoint] Cancellation Receipt - Ref ${retractedReceipt.id}`;
                  const body = `Hello ${retractedReceipt.fullName},\n\nThis confirms your OJT Defense schedule has been officially retracted:\n\n• Reference Code: ${retractedReceipt.id}\n• Student Number: ${retractedReceipt.studentNumber}\n• Released Schedule: ${retractedReceipt.timeDisplay} (${retractedReceipt.date})\n• Retracted At: ${retractedReceipt.timestamp}\n\nYour slot has been released back into the available pool.\nMapúa University - Department of OJT & Career Services`;
                  const isGoogle = Boolean(retractedReceipt.email?.toLowerCase().includes('gmail.com') || retractedReceipt.email?.toLowerCase().includes('mapua.edu.ph'));
                  const url = isGoogle
                    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(retractedReceipt.email || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    : `mailto:${encodeURIComponent(retractedReceipt.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                  return (
                    <a
                      href={url}
                      target={isGoogle ? "_blank" : undefined}
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{
                        marginTop: '8px',
                        fontSize: '0.78rem',
                        padding: '7px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none'
                      }}
                    >
                      <Mail size={14} />
                      <span>{isGoogle ? 'Save Cancellation Receipt in Gmail (1-Click)' : 'Email Receipt to Myself'}</span>
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Search Form with Reference Code */}
          <form onSubmit={handleSearch} style={{ marginBottom: '18px' }}>
            <div className="input-container" style={{ marginBottom: '10px' }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                autoFocus
                placeholder="Enter Reference Code, Student #, or Email"
                value={refQueryInput}
                onChange={(e) => {
                  setRefQueryInput(e.target.value);
                  setSearched(false);
                  setRetractingBooking(null);
                }}
                className="form-input"
                style={{ paddingLeft: '38px', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}
              />
            </div>
            <button
              type="submit"
              disabled={!refQueryInput.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Locate Reservation
            </button>
          </form>

          {/* Verification Box (Required Reference Code step before slot release) */}
          {retractingBooking ? (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--mapua-crimson)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              animation: 'modalSlideUp 0.15s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mapua-crimson)', fontWeight: 700, fontSize: '0.925rem', marginBottom: '6px' }}>
                <ShieldAlert size={18} />
                <span>Reference Code Required</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                To authorize cancellation for <strong>{retractingBooking.fullName}</strong> ({retractingBooking.timeDisplay}), please enter your official <strong>Reference Code</strong>:
              </p>

              <div className="input-container" style={{ marginBottom: '8px' }}>
                <KeyRound size={16} className="input-icon" color="var(--mapua-crimson)" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Paste Reference Code (e.g. BKG-MUN...)"
                  value={verifyCodeInput}
                  onChange={(e) => {
                    setVerifyCodeInput(e.target.value);
                    setVerifyError('');
                  }}
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.03em',
                    borderColor: verifyError ? 'var(--status-booked-border)' : 'var(--mapua-crimson)'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>
                💡 <em>Check the email from ShipMyForm / SchedPoint sent to {retractingBooking.email}, or paste the code you copied upon booking.</em>
              </div>

              {verifyError && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--mapua-crimson)',
                  fontWeight: 600,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mapua-crimson-subtle)',
                  padding: '6px 10px',
                  borderRadius: '4px'
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{verifyError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRetractingBooking(null);
                    setVerifyCodeInput('');
                    setVerifyError('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isRetracting || !verifyCodeInput.trim()}
                  onClick={handleExecuteVerifiedRetraction}
                  className="btn btn-danger"
                  style={{ flex: 1.5, padding: '8px', fontSize: '0.8125rem' }}
                >
                  {isRetracting ? 'Verifying & Releasing...' : 'Verify Code & Retract Slot'}
                </button>
              </div>
            </div>
          ) : (
            /* Search Results */
            searched && (
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
                    No active reservations found matching: <strong>{refQueryInput}</strong>. Please check the confirmation email sent to you upon booking.
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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className="badge badge-booked">
                              Reserved
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              🔒 Ref Protected
                            </span>
                          </div>
                        </div>

                        {b.projectTitle && (
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                            padding: '5px 8px',
                            background: 'rgba(217, 38, 38, 0.05)',
                            borderRadius: '4px',
                            borderLeft: '3px solid var(--mapua-crimson)'
                          }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project Title</span>
                            {b.projectTitle}
                          </div>
                        )}

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
                          onClick={() => handleInitiateRetract(b)}
                          className="btn btn-outline-danger"
                          style={{ width: '100%', fontSize: '0.8125rem', padding: '9px' }}
                        >
                          <RotateCcw size={14} />
                          <span>Cancel & Retract This Reservation</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
