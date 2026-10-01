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

      const title = encodeURIComponent(`Mapúa OJT Defense: ${booking.fullName}`);
      const details = encodeURIComponent(
        `Mapúa University OJT Defense Presentation\nStudent: ${booking.fullName}\nID: ${booking.studentNumber}\nCourse: ${booking.course}\nProject: ${booking.projectTitle || 'N/A'}\nRef Code: ${booking.id}`
      );
      const dates = `${toIsoString(startDate)}/${toIsoString(endDate)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    } catch {
      return '#';
    }
  };

  // Option 1: 1-Click direct Gmail / mailto URL with pre-filled Reference Code and reservation details
  const emailSubject = `[OJT Schedpoint] Reference Code: ${booking.id} - ${booking.fullName}`;
  const emailBody = `Hello ${booking.fullName},\n\nHere are your official Mapúa OJT Defense reservation details:\n\n• Official Reference Code: ${booking.id}\n• Scheduled Time: ${booking.timeDisplay}\n• Date: ${booking.date}\n• Student Number: ${booking.studentNumber}\n• Course & Section: ${booking.course}\n• Project Title: ${booking.projectTitle || 'N/A'}\n\nPlease keep this Reference Code safe. You will need it to retract or reschedule your slot at:\nhttps://ojt-scheduler.netlify.app/\n\nMapúa University - Department of OJT & Career Services`;

  const mailtoUrl = `mailto:${encodeURIComponent(booking.email || '')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(booking.email || '')}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const isGoogleUser = Boolean(booking?.email?.toLowerCase().includes('gmail.com') || booking?.email?.toLowerCase().includes('mapua.edu.ph'));
  const preferredEmailUrl = isGoogleUser ? gmailUrl : mailtoUrl;

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
      <div 
        className="modal-content ticket-card" 
        style={{ 
          maxWidth: '460px',
          width: '100%',
          maxHeight: 'min(94vh, 740px)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
      >
        {/* Academic Header Banner */}
        <div style={{
          background: 'var(--mapua-crimson)',
          padding: '14px 20px',
          color: '#ffffff',
          position: 'relative',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '14px',
              top: '14px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <CheckCircle2 size={18} color="#ffffff" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OJT Schedpoint Pass
            </span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            Schedule Confirmed
          </h3>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {/* Reference Code Card */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1.5px solid var(--mapua-crimson-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Reference Code
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: copiedCode ? '#DCFCE7' : undefined,
                  color: copiedCode ? '#166534' : undefined,
                  borderColor: copiedCode ? '#86EFAC' : undefined
                }}
              >
                {copiedCode ? <Check size={12} color="#166534" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: 'var(--mapua-crimson)',
              letterSpacing: '0.05em'
            }}>
              {booking.id}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              ⚠️ <strong>Save this code!</strong> You will need this Reference Code to retract or manage your slot.
            </div>
          </div>

          {/* Time Slot Highlight Box (High Contrast) */}
          <div style={{
            background: 'var(--status-selected-subtle)',
            border: '1.5px solid var(--status-selected-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Clock size={20} color="var(--status-selected-bg)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-selected-accent)', fontFamily: 'var(--font-mono)' }}>
                {booking.timeDisplay}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {getFormattedDateLabel(booking.date)} (OJT Defense Presentation)
              </div>
            </div>
          </div>

          {/* Student Info Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 12px',
            fontSize: '0.78rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>STUDENT NAME</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>{booking.fullName}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>STUDENT NUMBER</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                {booking.studentNumber}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>GENDER</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>
                {booking.gender || 'Not specified'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>COURSE & SECTION</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>{booking.course}</div>
            </div>

            {booking.projectTitle && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>PROJECT TITLE</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px', wordBreak: 'break-word' }}>
                  {booking.projectTitle}
                </div>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>STUDENT EMAIL</div>
              <div style={{ color: 'var(--text-primary)', marginTop: '1px', wordBreak: 'break-all' }}>{booking.email}</div>
            </div>
          </div>

          {/* Email Notification & First-Time User Instructions */}
          <div style={{
            background: '#EFF6FF',
            border: '1.5px solid #93C5FD',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E40AF', fontWeight: 700, fontSize: '0.78rem' }}>
              <Mail size={15} color="#2563EB" />
              <span>Automated Email Sent to: {booking.email}</span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#1E3A8A', lineHeight: 1.45 }}>
              📩 <strong>First-Time Users:</strong> Check your inbox (or Spam/Promotions folder) for an email from <strong>ShipMyForm</strong>. If prompted with <em>"Activate Form / View Submission"</em>, click the link once to unlock your submission and view your Reference Code.
            </div>
            <div style={{ fontSize: '0.71rem', color: '#2563EB', lineHeight: 1.4 }}>
              💡 <strong>Instant Backup:</strong> Your Reference Code is also shown above! Click <strong>"Copy Code"</strong> or <strong>"Print / PDF Pass"</strong> to keep a direct copy right now.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '2px' }}>
            {/* Option 1: Prominent 1-Click Direct Email Action */}
            <a
              href={preferredEmailUrl}
              target={isGoogleUser ? "_blank" : undefined}
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
              title="Open pre-filled draft in Gmail addressed to your inbox"
            >
              <Mail size={16} />
              <span>{isGoogleUser ? 'Send Pass to My Gmail (1-Click)' : 'Email Pass to Myself (1-Click)'}</span>
            </a>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Printer size={14} />
                <span>Print / PDF Pass</span>
              </button>

              <a
                href={createGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '7px 10px', justifyContent: 'center' }}
              >
                <ExternalLink size={14} />
                <span>Add to Calendar</span>
              </a>
            </div>

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
