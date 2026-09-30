import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Printer, ExternalLink, RotateCcw, X, PlusCircle } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function ConfirmationModal({ booking, onClose, onRetractBooking }) {
  const [isRetracting, setIsRetracting] = useState(false);

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
        `Mapúa University Consultation / Presentation\nStudent: ${booking.fullName}\nID: ${booking.studentNumber}\nCourse: ${booking.course}\nRef: ${booking.id}`
      );
      const dates = `${toIsoString(startDate)}/${toIsoString(endDate)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    } catch {
      return '#';
    }
  };

  const handleRetract = async () => {
    if (window.confirm(`Are you sure you want to cancel and retract your reservation for ${booking.timeDisplay}? This slot will be reopened immediately for other students.`)) {
      setIsRetracting(true);
      try {
        await onRetractBooking(booking.slotId);
        onClose();
      } catch (err) {
        alert('Failed to retract: ' + err.message);
      } finally {
        setIsRetracting(false);
      }
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
          {/* Reference & Time Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              OFFICIAL REFERENCE CODE
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--mapua-crimson)',
              background: 'var(--mapua-crimson-subtle)',
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1px solid var(--mapua-crimson-border)'
            }}>
              {booking.id}
            </span>
          </div>

          {/* Reference Email Notice */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--status-available-text)',
            background: 'var(--status-available-bg)',
            border: '1px solid var(--status-available-border)',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="var(--status-available-text)" style={{ flexShrink: 0 }} />
            <span>
              Reference Code sent to <strong>{booking.email}</strong>. Use this code if you ever need to retract your schedule.
            </span>
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

            <div>
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
                href={createGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '9px' }}
              >
                <ExternalLink size={15} />
                <span>Add to Calendar</span>
              </a>
            </div>

            {/* Retract Reservation Option */}
            <button
              type="button"
              disabled={isRetracting}
              onClick={handleRetract}
              className="btn btn-outline-danger"
              style={{ width: '100%', fontSize: '0.8125rem', padding: '9px' }}
            >
              <RotateCcw size={14} />
              <span>Cancel & Retract This Reservation</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '4px', padding: '10px' }}
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
