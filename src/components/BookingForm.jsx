import React, { useState, useMemo } from 'react';
import { User, Hash, BookOpen, Mail, Clock, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function BookingForm({
  selectedSlot,
  onSubmit,
  isSubmitting,
  errorMessage,
  clearError,
  bookings,
  date,
  onOpenRetractModal
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    gender: '',
    course: '',
    email: '',
  });
  const [studentNumError, setStudentNumError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    if (errorMessage) clearError();
    const { name, value } = e.target;

    if (name === 'studentNumber') {
      // Only permit numeric digits and cap at exactly 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));

      if (digitsOnly.length > 0 && !digitsOnly.startsWith('202')) {
        setStudentNumError('Student number must start with 202x (e.g. 2023...)');
      } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setStudentNumError(`10 digits required (${digitsOnly.length}/10 digits entered)`);
      } else {
        setStudentNumError('');
      }
      return;
    }

    if (name === 'email') {
      const emailVal = value.trim();
      setFormData(prev => ({ ...prev, [name]: value }));

      if (emailVal.includes('@')) {
        const lower = emailVal.toLowerCase();
        const isValid = lower.endsWith('@mymail.mapua.edu.ph') || lower.endsWith('@mapua.edu.ph');
        if (!isValid) {
          setEmailError('Must be an official Mapúa email ending in @mymail.mapua.edu.ph or @mapua.edu.ph');
        } else {
          setEmailError('');
        }
      } else {
        setEmailError('');
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Instant pre-validation for duplicate student number on this date
  const duplicateBooking = useMemo(() => {
    const cleanId = formData.studentNumber.trim().toLowerCase();
    if (!cleanId || cleanId.length < 5) return null;
    return bookings.find(b => 
      String(b.studentNumber || '').trim().toLowerCase() === cleanId && b.date === date
    );
  }, [formData.studentNumber, bookings, date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot || duplicateBooking) return;

    const cleanNum = formData.studentNumber.trim();
    if (!/^202\d{7}$/.test(cleanNum)) {
      setStudentNumError('Student number must be exactly 10 digits starting with 202x (e.g. 2023123456).');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const isValidEmail = cleanEmail.endsWith('@mymail.mapua.edu.ph') || cleanEmail.endsWith('@mapua.edu.ph');
    if (!isValidEmail) {
      setEmailError('Email must be an official Mapúa account ending in @mymail.mapua.edu.ph or @mapua.edu.ph');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="academic-card" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Student Reservation Form
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
          Enter your academic credentials to confirm your consultation schedule.
        </p>
      </div>

      {/* Selected Slot Notice */}
      {selectedSlot ? (
        <div style={{
          background: 'var(--mapua-crimson-subtle)',
          border: '1.5px solid var(--mapua-crimson-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            background: 'var(--mapua-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mapua-crimson)', fontWeight: 700 }}>
              Selected Time Slot ({selectedSlot.sessionTitle})
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {selectedSlot.timeDisplay}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {getFormattedDateLabel(selectedSlot.date)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Clock size={18} color="var(--text-muted)" />
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong>No time slot selected yet.</strong> Please select an open slot from the schedule on the left.
          </div>
        </div>
      )}

      {/* Duplicate Submission Warning Banner */}
      {duplicateBooking && (
        <div style={{
          background: 'var(--status-booked-bg)',
          border: '1px solid var(--status-booked-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="var(--mapua-crimson)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mapua-crimson)' }}>
              Duplicate Submission Detected
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              Student ID <strong>{formData.studentNumber}</strong> is already booked for <strong>{duplicateBooking.timeDisplay}</strong> on this date. Multiple reservations are not permitted.
            </div>
            <button
              type="button"
              onClick={onOpenRetractModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mapua-crimson)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '4px 0 0 0'
              }}
            >
              Click here to retract your existing reservation →
            </button>
          </div>
        </div>
      )}

      {/* Server Conflict Error Banner */}
      {errorMessage && (
        <div style={{
          background: 'var(--status-booked-bg)',
          border: '1px solid var(--status-booked-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="var(--mapua-crimson)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--mapua-crimson)' }}>
              Unable to Complete Reservation
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">
            <User size={14} color="var(--mapua-crimson)" />
            <span>Full Name (Last Name, First Name)</span>
          </label>
          <div className="input-container">
            <User size={15} className="input-icon" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. Dela Cruz, Juan M."
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              autoComplete="name"
            />
          </div>
        </div>

        {/* Student Number */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" htmlFor="studentNumber" style={{ margin: 0 }}>
              <Hash size={14} color="var(--mapua-crimson)" />
              <span>Student Number</span>
            </label>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: formData.studentNumber.length === 10 ? 'var(--status-available-text)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}>
              {formData.studentNumber.length}/10 digits
            </span>
          </div>
          <div className="input-container">
            <Hash size={15} className="input-icon" />
            <input
              id="studentNumber"
              name="studentNumber"
              type="text"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="e.g. 2023123456"
              value={formData.studentNumber}
              onChange={handleChange}
              className="form-input"
              pattern="^202[0-9]{7}$"
              title="Student number must be exactly 10 digits starting with 202x (e.g. 2023123456)"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                borderColor: studentNumError ? 'var(--status-booked-border)' : undefined
              }}
            />
          </div>
          {studentNumError ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--mapua-crimson)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <AlertCircle size={12} />
              <span>{studentNumError}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Must be exactly 10 digits starting with batch <strong>202x</strong> (e.g. 2020xxxxxx to 2026xxxxxx).
            </div>
          )}
        </div>

        {/* Gender Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="gender">
            <User size={14} color="var(--mapua-crimson)" />
            <span>Gender</span>
          </label>
          <div className="input-container">
            <select
              id="gender"
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              style={{ paddingLeft: '14px', cursor: 'pointer' }}
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Course / Program */}
        <div className="form-group">
          <label className="form-label" htmlFor="course">
            <BookOpen size={14} color="var(--mapua-crimson)" />
            <span>Course & Section</span>
          </label>
          <div className="input-container">
            <BookOpen size={15} className="input-icon" />
            <input
              id="course"
              name="course"
              type="text"
              required
              placeholder="e.g. BSCS - CS121 / A1"
              value={formData.course}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        {/* Student Email */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" htmlFor="email" style={{ margin: 0 }}>
              <Mail size={14} color="var(--mapua-crimson)" />
              <span>Mapúa Email (@mymail.mapua.edu.ph or @mapua.edu.ph)</span>
            </label>
            {(formData.email.trim().toLowerCase().endsWith('@mymail.mapua.edu.ph') || formData.email.trim().toLowerCase().endsWith('@mapua.edu.ph')) && (
              <span style={{ fontSize: '0.72rem', color: 'var(--status-available-text)', fontWeight: 600 }}>
                ✓ Valid Mapúa Email
              </span>
            )}
          </div>
          <div className="input-container">
            <Mail size={15} className="input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. jddelacruz@mymail.mapua.edu.ph or faculty@mapua.edu.ph"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              autoComplete="email"
              pattern="^[a-zA-Z0-9._%+-]+@(mymail\.)?mapua\.edu\.ph$"
              title="Must be an official Mapúa email ending in @mymail.mapua.edu.ph or @mapua.edu.ph"
              style={{
                borderColor: emailError ? 'var(--status-booked-border)' : undefined
              }}
            />
          </div>
          {emailError ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--mapua-crimson)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <AlertCircle size={12} />
              <span>{emailError}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Accepted domains: <strong>@mymail.mapua.edu.ph</strong> (Student) or <strong>@mapua.edu.ph</strong> (Faculty/Staff).
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedSlot || isSubmitting || !!duplicateBooking}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.9375rem',
            marginTop: '8px'
          }}
        >
          {isSubmitting ? (
            <span>Securing Slot...</span>
          ) : (
            <>
              <span>Confirm & Lock In Schedule</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Already reserved?</span>
          <button
            type="button"
            onClick={onOpenRetractModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mapua-crimson)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Manage / Retract my booking
          </button>
        </div>
      </form>
    </div>
  );
}
