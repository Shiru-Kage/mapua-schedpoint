import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Printer, ExternalLink, RotateCcw, X, PlusCircle, Copy, Check, Mail, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function ConfirmationModal({ booking, onClose, onRetractBooking }) {
  const [isRetracting, setIsRetracting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Retraction verification state
  const [showRetractVerify, setShowRetractVerify] = useState(false);
  const [inputRetractCode, setInputRetractCode] = useState('');
  const [retractError, setRetractError] = useState('');

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  }, []);

  if (!booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(booking.id).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }).catch(() => {});
  };

  const createGoogleCalendarUrl = () => {
    try {
      const [year, month, day] = booking.date.split('-').map(Number);
      const startHour = booking.slotId.includes('_') ? parseInt(booking.slotId.split('_')[1].substring(0, 2)) : 8;
      const startMin = booking.slotId.includes('_') ? parseInt(booking.slotId.split('_')[1].substring(2, 4)) : 0;
      
      const startDate = new Date(year, month - 1, day, startHour, startMin);
      const endDate = new Date(startDate.getTime() + 10 * 60000);

      const toIsoString = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

      const title = encodeURIComponent(`Mapúa Consultation: ${booking.fullName}`);
      const details = encodeURIComponent(
        `Mapúa University Consultation / Presentation\nStudent: ${booking.fullName}\nID: ${booking.studentNumber}\nCourse: ${booking.course}\nRef Code: ${booking.id}`
      );
      const dates = `${toIsoString(startDate)}/${toIsoString(endDate)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    } catch {
      return '#';
    }
  };

  // Generate mailto link so student can instantly email the Reference Code to themselves
  const mailtoUrl = `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(`[Mapúa SchedPoint] Reference Code: ${booking.id}`)}&body=${encodeURIComponent(
    `Hello ${booking.fullName},\n\nHere are your Mapúa Consultation details:\n\nOfficial Reference Code: ${booking.id}\nScheduled Time: ${booking.timeDisplay}\nDate: ${booking.date}\nCourse: ${booking.course}\nStudent Number: ${booking.studentNumber}\n\nKeep this Reference Code safe. You will need it to retract or manage your slot at: https://shiru-kage.github.io/mapua-schedpoint/`
  )}`;

  // MANDATORY: Verify Reference Code before retracting!
  const handleExecuteVerifiedRetract = async () => {
    const entered = inputRetractCode.trim().toLowerCase();
    const actual = String(booking.id || '').trim().toLowerCase();

    if (entered !== actual) {
      setRetractError('❌ Invalid Reference Code. Retraction denied. Please enter the exact Reference Code.');
      return;
    }

    setIsRetracting(true);
    setRetractError('');
    try {
      await onRetractBooking(booking.slotId, booking);
      onClose();
    } catch (err) {
      setRetractError('Failed to retract: ' + err.message);
    } finally {
      setIsRetracting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content ticket-card" style={{ maxWidth: '480px' }}>
        {/* Academic Header Banner */}
        <div style={{
          background: 'var(--mapua-crimson)',
          padding: '20px 24px',
          color: '#ffffff',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CheckCircle2 size={24} color="#ffffff" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mapúa University Consultation Pass
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Schedule Confirmed
          </h3>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Reference Code Card */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1.5px solid var(--mapua-crimson-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Reference Code
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: copiedCode ? '#DCFCE7' : undefined,
                  color: copiedCode ? '#166534' : undefined,
                  borderColor: copiedCode ? '#86EFAC' : undefined
                }}
              >
                {copiedCode ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: 'var(--mapua-crimson)',
              letterSpacing: '0.05em'
            }}>
              {booking.id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              ⚠️ <strong>Save this code!</strong> You will need this Reference Code if you ever need to retract or modify your consultation schedule.
            </div>
          </div>

          {/* Time Slot Highlight Box (High Contrast) */}
          <div style={{
            background: 'var(--mapua-crimson-subtle)',
            border: '1.5px solid var(--mapua-crimson-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Clock size={22} color="var(--mapua-crimson)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--mapua-crimson)', fontFamily: 'var(--font-mono)' }}>
                {booking.timeDisplay}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {getFormattedDateLabel(booking.date)} (10-Minute Consultation)
              </div>
            </div>
          </div>

          {/* Student Info Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
            fontSize: '0.8125rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>STUDENT NAME</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{booking.fullName}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>STUDENT NUMBER</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {booking.studentNumber}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>GENDER</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {booking.gender || 'Not specified'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>COURSE & SECTION</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{booking.course}</div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>STUDENT EMAIL</div>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>{booking.email}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '9px' }}
              >
                <Printer size={15} />
                <span>Print Pass</span>
              </button>

              <a
                href={mailtoUrl}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '9px' }}
              >
                <Mail size={15} />
                <span>Email Pass to Me</span>
              </a>
            </div>

            <a
              href={createGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '9px', width: '100%', justifyContent: 'center' }}
            >
              <ExternalLink size={15} />
              <span>Add to Google Calendar</span>
            </a>

            {/* Retract Reservation Verification Section */}
            {!showRetractVerify ? (
              <button
                type="button"
                onClick={() => {
                  setShowRetractVerify(true);
                  setInputRetractCode('');
                  setRetractError('');
                }}
                className="btn btn-outline-danger"
                style={{ width: '100%', fontSize: '0.8125rem', padding: '9px', marginTop: '4px' }}
              >
                <RotateCcw size={14} />
                <span>Cancel & Retract This Reservation</span>
              </button>
            ) : (
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--mapua-crimson)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginTop: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mapua-crimson)', fontWeight: 700, fontSize: '0.875rem' }}>
                  <ShieldAlert size={18} />
                  <span>Reference Code Required to Retract</span>
                </div>
                <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  To confirm cancellation and prevent accidental slot loss, please enter your <strong>Reference Code</strong> below:
                </p>
                <div className="input-container" style={{ margin: 0 }}>
                  <KeyRound size={15} className="input-icon" color="var(--mapua-crimson)" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter Reference Code (e.g. BKG-...)"
                    value={inputRetractCode}
                    onChange={(e) => {
                      setInputRetractCode(e.target.value);
                      setRetractError('');
                    }}
                    className="form-input"
                    style={{
                      paddingLeft: '36px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.875rem',
                      borderColor: retractError ? 'var(--status-booked-border)' : 'var(--mapua-crimson)'
                    }}
                  />
                </div>
                {retractError && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--mapua-crimson)',
                    background: 'var(--mapua-crimson-subtle)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600
                  }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{retractError}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRetractVerify(false);
                      setInputRetractCode('');
                      setRetractError('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                  >
                    Keep Slot
                  </button>
                  <button
                    type="button"
                    disabled={isRetracting || !inputRetractCode.trim()}
                    onClick={handleExecuteVerifiedRetract}
                    className="btn btn-danger"
                    style={{ flex: 1.4, padding: '8px', fontSize: '0.8125rem' }}
                  >
                    {isRetracting ? 'Releasing Slot...' : 'Verify Code & Retract'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            >
              <PlusCircle size={16} />
              <span>Done / Return to Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
