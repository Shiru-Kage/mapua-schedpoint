import React, { useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Hash, 
  Mail, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Edit3, 
  Users, 
  Plus, 
  Trash2, 
  FileText, 
  BookOpen, 
  AlertCircle,
  Save
} from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function StudentRetractModal({ isOpen, onClose, bookings, onRetract, onUpdateBooking }) {
  const [refQueryInput, setRefQueryInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [retractedReceipt, setRetractedReceipt] = useState(null);

  // Mandatory Reference Code Verification State for Retract
  const [retractingBooking, setRetractingBooking] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Edit Reservation Details State (Protected by Reference Code)
  const [editingBooking, setEditingBooking] = useState(null);
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [editCodeInput, setEditCodeInput] = useState('');
  const [editVerifyError, setEditVerifyError] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    gender: '',
    course: '',
    projectTitle: '',
    email: '',
    isGroup: false,
    groupmates: []
  });
  const [editFormError, setEditFormError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessNotice, setEditSuccessNotice] = useState('');

  if (!isOpen) return null;

  const cleanQuery = refQueryInput.trim().toLowerCase();
  const matchedBookings = cleanQuery
    ? bookings.filter(b => 
        String(b.id || '').trim().toLowerCase() === cleanQuery ||
        String(b.referenceCode || '').trim().toLowerCase() === cleanQuery ||
        String(b.studentNumber || '').trim().toLowerCase() === cleanQuery ||
        String(b.email || '').trim().toLowerCase() === cleanQuery ||
        (Array.isArray(b.groupmates) && b.groupmates.some(g =>
          String(g.studentNumber || '').trim().toLowerCase() === cleanQuery ||
          String(g.fullName || '').trim().toLowerCase().includes(cleanQuery)
        ))
      )
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    setRetractedReceipt(null);
    setRetractingBooking(null);
    setEditingBooking(null);
    setIsEditUnlocked(false);
    setEditSuccessNotice('');
  };

  const handleResetSearchState = () => {
    setRetractingBooking(null);
    setEditingBooking(null);
    setIsEditUnlocked(false);
    setVerifyError('');
    setEditVerifyError('');
    setEditFormError('');
  };

  // --- RETRACTION FLOW ---
  const handleInitiateRetract = (booking) => {
    handleResetSearchState();
    setRetractingBooking(booking);
    setVerifyCodeInput('');
  };

  const handleExecuteVerifiedRetraction = async () => {
    if (!retractingBooking) return;

    const enteredCodeClean = verifyCodeInput.trim().toUpperCase();
    const actualCodeClean = String(retractingBooking.id || '').trim().toUpperCase();

    // STRICT REFERENCE CODE ENFORCEMENT
    if (enteredCodeClean !== actualCodeClean) {
      setVerifyError('Invalid Reference Code. Please enter the exact Reference Code for this booking.');
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

  // --- EDIT DETAILS FLOW (PROTECTED BY REFERENCE CODE) ---
  const handleInitiateEdit = (booking) => {
    handleResetSearchState();
    setEditingBooking(booking);
    setEditSuccessNotice('');

    // If student searched directly using their exact Reference Code, auto-unlock edit mode
    const enteredQueryClean = refQueryInput.trim().toUpperCase();
    const actualCodeClean = String(booking.id || '').trim().toUpperCase();
    const alreadyAuthorized = enteredQueryClean === actualCodeClean;

    setIsEditUnlocked(alreadyAuthorized);
    setEditCodeInput(alreadyAuthorized ? actualCodeClean : '');

    // Populate existing fields
    const hasGroup = Boolean(booking.isGroup || (Array.isArray(booking.groupmates) && booking.groupmates.length > 0));
    setEditFormData({
      fullName: booking.fullName || '',
      gender: booking.gender || '',
      course: booking.course || '',
      projectTitle: booking.projectTitle || '',
      email: booking.email || '',
      isGroup: hasGroup,
      groupmates: Array.isArray(booking.groupmates) && booking.groupmates.length > 0
        ? booking.groupmates.map(g => ({ fullName: g.fullName || '', studentNumber: g.studentNumber || '' }))
        : [{ fullName: '', studentNumber: '' }]
    });
  };

  const handleVerifyAndUnlockEdit = () => {
    if (!editingBooking) return;
    const enteredCodeClean = editCodeInput.trim().toUpperCase();
    const actualCodeClean = String(editingBooking.id || '').trim().toUpperCase();

    if (enteredCodeClean !== actualCodeClean) {
      setEditVerifyError('Invalid Reference Code. Please enter the exact Reference Code for this booking.');
      return;
    }

    setEditVerifyError('');
    setIsEditUnlocked(true);
  };

  const handleToggleEditGroup = (e) => {
    const checked = e.target.checked;
    setEditFormData(prev => ({
      ...prev,
      isGroup: checked,
      groupmates: checked && (!prev.groupmates || prev.groupmates.length === 0)
        ? [{ fullName: '', studentNumber: '' }]
        : prev.groupmates
    }));
    setEditFormError('');
  };

  const handleAddEditGroupmate = () => {
    if (editFormData.groupmates.length >= 6) {
      setEditFormError('Maximum of 6 groupmates permitted.');
      return;
    }
    setEditFormData(prev => ({
      ...prev,
      groupmates: [...(prev.groupmates || []), { fullName: '', studentNumber: '' }]
    }));
    setEditFormError('');
  };

  const handleRemoveEditGroupmate = (index) => {
    setEditFormData(prev => ({
      ...prev,
      groupmates: prev.groupmates.filter((_, i) => i !== index)
    }));
    setEditFormError('');
  };

  const handleEditGroupmateChange = (index, field, value) => {
    setEditFormData(prev => {
      const list = [...(prev.groupmates || [])];
      if (field === 'studentNumber') {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
        list[index] = { ...list[index], studentNumber: digitsOnly };
      } else {
        list[index] = { ...list[index], [field]: value };
      }
      return { ...prev, groupmates: list };
    });
    setEditFormError('');
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingBooking || !onUpdateBooking) return;

    if (!editFormData.fullName.trim()) {
      setEditFormError('Primary student full name is required.');
      return;
    }
    if (!editFormData.course.trim()) {
      setEditFormError('Course & Section is required.');
      return;
    }

    if (editFormData.isGroup) {
      const groupList = editFormData.groupmates || [];
      if (groupList.length === 0) {
        setEditFormError('Please add at least one group member or uncheck the group option.');
        return;
      }

      const studentNumSet = new Set([editingBooking.studentNumber]);
      for (let i = 0; i < groupList.length; i++) {
        const gm = groupList[i];
        if (!gm.fullName.trim()) {
          setEditFormError(`Groupmate #${i + 1} must have a valid full name.`);
          return;
        }
        if (!/^20\d{8}$/.test(gm.studentNumber.trim())) {
          setEditFormError(`Groupmate #${i + 1} (${gm.fullName}) student number must be 10 digits starting with 20xx (e.g. 2021123456).`);
          return;
        }
        if (studentNumSet.has(gm.studentNumber.trim())) {
          setEditFormError(`Duplicate student ID "${gm.studentNumber}" found in group.`);
          return;
        }
        studentNumSet.add(gm.studentNumber.trim());
      }
    }

    setIsSavingEdit(true);
    setEditFormError('');

    try {
      const res = await onUpdateBooking(editingBooking.slotId, {
        fullName: editFormData.fullName,
        gender: editFormData.gender,
        course: editFormData.course,
        projectTitle: editFormData.projectTitle,
        email: editFormData.email,
        isGroup: editFormData.isGroup,
        groupmates: editFormData.isGroup ? editFormData.groupmates : []
      });

      if (!res.success) {
        setEditFormError(res.error || 'Failed to update reservation details.');
      } else {
        setEditSuccessNotice('Reservation details and group members successfully updated!');
        setEditingBooking(null);
        setIsEditUnlocked(false);
        setEditCodeInput('');
      }
    } catch (err) {
      setEditFormError('Failed to update details: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: editingBooking && isEditUnlocked ? '560px' : '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-surface)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingBooking ? (
              <Edit3 size={18} color="var(--mapua-crimson)" />
            ) : (
              <RotateCcw size={18} color="var(--mapua-crimson)" />
            )}
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {editingBooking ? 'Edit Reservation Response' : 'Retract / Manage Your Reservation'}
            </h3>
          </div>
          <button
            onClick={() => {
              handleResetSearchState();
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
          {!editingBooking && !retractingBooking && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Enter your <strong>Reference Code</strong>, <strong>Student Number</strong>, or <strong>Email</strong> to locate your reservation. To confirm any edits or retraction, your official <strong>Reference Code</strong> is required.
            </p>
          )}

          {/* Success Banner when details are saved */}
          {editSuccessNotice && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#166534',
              fontSize: '0.8125rem',
              fontWeight: 600
            }}>
              <CheckCircle2 size={16} color="#15803D" style={{ flexShrink: 0 }} />
              <span>{editSuccessNotice}</span>
            </div>
          )}

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
                      <span>{isGoogle ? 'Save Copy in Gmail' : 'Email Copy'}</span>
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Search Form (visible when not in verify/edit sub-views) */}
          {!editingBooking && !retractingBooking && (
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
                    handleResetSearchState();
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
          )}

          {/* === RETRACT VERIFICATION PROMPT === */}
          {retractingBooking && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--mapua-crimson)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              animation: 'modalSlideUp 0.15s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mapua-crimson)', fontWeight: 700, fontSize: '0.925rem', marginBottom: '6px' }}>
                <ShieldAlert size={18} />
                <span>Reference Code Required to Retract</span>
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
                <em>Check the email confirmation sent to {retractingBooking.email}, or enter the code copied upon booking.</em>
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
                  onClick={handleResetSearchState}
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
          )}

          {/* === EDIT DETAILS: REFERENCE CODE AUTHORIZATION GATE === */}
          {editingBooking && !isEditUnlocked && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--mapua-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              animation: 'modalSlideUp 0.15s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.925rem', marginBottom: '6px' }}>
                <KeyRound size={18} color="var(--mapua-crimson)" />
                <span>Reference Code Required to Edit</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                To modify details or manage groupmates for <strong>{editingBooking.fullName}</strong> ({editingBooking.timeDisplay}), enter your official <strong>Reference Code</strong>:
              </p>

              <div className="input-container" style={{ marginBottom: '8px' }}>
                <KeyRound size={16} className="input-icon" color="var(--mapua-crimson)" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Paste Reference Code (e.g. BKG-MUN...)"
                  value={editCodeInput}
                  onChange={(e) => {
                    setEditCodeInput(e.target.value);
                    setEditVerifyError('');
                  }}
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.03em',
                    borderColor: editVerifyError ? 'var(--status-booked-border)' : 'var(--mapua-crimson)'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>
                <em>Check the email confirmation sent to {editingBooking.email}, or enter the code saved upon booking.</em>
              </div>

              {editVerifyError && (
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
                  <span>{editVerifyError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleResetSearchState}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!editCodeInput.trim()}
                  onClick={handleVerifyAndUnlockEdit}
                  className="btn btn-primary"
                  style={{ flex: 1.5, padding: '8px', fontSize: '0.8125rem' }}
                >
                  Verify Code & Open Editor
                </button>
              </div>
            </div>
          )}

          {/* === EDIT DETAILS FORM (UNLOCKED) === */}
          {editingBooking && isEditUnlocked && (
            <form onSubmit={handleSaveEdit} style={{ animation: 'modalSlideUp 0.15s ease-out' }}>
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#15803D" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Verified Reference:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--mapua-crimson)' }}>
                    {editingBooking.id}
                  </span>
                </div>
                <span className="badge badge-booked">
                  {editingBooking.timeDisplay}
                </span>
              </div>

              {/* Lead Student Number (Fixed ID of Record) */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  <Hash size={13} color="var(--mapua-crimson)" />
                  <span>Primary Student Number (Fixed)</span>
                </label>
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  {editingBooking.studentNumber}
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  <User size={13} color="var(--mapua-crimson)" />
                  <span>Primary Student Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Dela Cruz, Juan M."
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  <Mail size={13} color="var(--mapua-crimson)" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="form-input"
                  placeholder="student@mymail.mapua.edu.ph"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              {/* Gender & Course in 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <User size={13} color="var(--mapua-crimson)" />
                    <span>Gender</span>
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.8125rem', paddingLeft: '8px' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <BookOpen size={13} color="var(--mapua-crimson)" />
                    <span>Course & Section *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.course}
                    onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                    className="form-input"
                    placeholder="e.g. BSCS - CS121"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              {/* Project Title */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  <FileText size={13} color="var(--mapua-crimson)" />
                  <span>Project / Capstone Title</span>
                </label>
                <input
                  type="text"
                  value={editFormData.projectTitle}
                  onChange={(e) => setEditFormData({ ...editFormData, projectTitle: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Mapua AI-Powered Schedule Management"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              {/* Group Defense & Groupmates Section */}
              <div style={{
                background: editFormData.isGroup ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                border: editFormData.isGroup ? '1px solid var(--mapua-crimson)' : '1px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="var(--mapua-crimson)" />
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Group Defense / Add Groupmates
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Check to include fellow defense group members in this reservation.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editFormData.isGroup}
                    onChange={handleToggleEditGroup}
                    style={{ accentColor: 'var(--mapua-crimson)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>

                {editFormData.isGroup && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Group Members ({editFormData.groupmates.length})
                      </span>
                      {editFormData.groupmates.length < 6 && (
                        <button
                          type="button"
                          onClick={handleAddEditGroupmate}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <Plus size={12} />
                          <span>Add Member</span>
                        </button>
                      )}
                    </div>

                    {editFormData.groupmates.map((gm, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mapua-crimson)' }}>
                            Groupmate #{idx + 1}
                          </span>
                          {editFormData.groupmates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEditGroupmate(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Remove groupmate"
                            >
                              <Trash2 size={13} color="var(--mapua-crimson)" />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required={editFormData.isGroup}
                              placeholder="Last Name, First Name"
                              value={gm.fullName}
                              onChange={(e) => handleEditGroupmateChange(idx, 'fullName', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '0.8rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-medium)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                              Student # (10 digits) *
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={10}
                              required={editFormData.isGroup}
                              placeholder="e.g. 2021123456"
                              value={gm.studentNumber}
                              onChange={(e) => handleEditGroupmateChange(idx, 'studentNumber', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-mono)',
                                borderRadius: '4px',
                                border: '1px solid var(--border-medium)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editFormError && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--mapua-crimson)',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mapua-crimson-subtle)',
                  padding: '8px 10px',
                  borderRadius: '4px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{editFormError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleResetSearchState}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '9px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-primary"
                  style={{ flex: 1.5, padding: '9px', fontSize: '0.8125rem', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{isSavingEdit ? 'Saving Updates...' : 'Save & Update Reservation'}</span>
                </button>
              </div>
            </form>
          )}

          {/* === SEARCH RESULTS LIST === */}
          {!editingBooking && !retractingBooking && searched && (
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
                  No active reservations found matching: <strong>{refQueryInput}</strong>. Please check your confirmation pass or email receipt.
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
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            Ref: Protected
                          </span>
                        </div>
                      </div>

                      {Array.isArray(b.groupmates) && b.groupmates.length > 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontWeight: 700, color: 'var(--mapua-crimson)' }}>Group Members: </span>
                          {b.groupmates.map(g => `${g.fullName} (${g.studentNumber})`).join(', ')}
                        </div>
                      )}

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

                      {/* Action buttons: Edit Response (with ref code) and Cancel & Retract */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleInitiateEdit(b)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '8px', gap: '6px', justifyContent: 'center' }}
                        >
                          <Edit3 size={14} color="var(--mapua-crimson)" />
                          <span>Edit Details & Group</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiateRetract(b)}
                          className="btn btn-outline-danger"
                          style={{ fontSize: '0.78rem', padding: '8px', gap: '6px', justifyContent: 'center' }}
                        >
                          <RotateCcw size={14} />
                          <span>Cancel & Retract</span>
                        </button>
                      </div>
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
