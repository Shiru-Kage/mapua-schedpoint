import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Search, 
  Printer, 
  FileSpreadsheet, 
  UserX,
  Calendar,
  Filter,
  X,
  AlertTriangle,
  Mail,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  CalendarPlus,
  Sliders,
  Save,
  Edit2,
  CheckSquare,
  Square,
  Check,
  XCircle,
  AlertCircle,
  Undo2,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function AdminDashboard({
  bookings,
  date,
  setDate,
  slotsData,
  onCancelBooking,
  onBatchCancelBooking,
  isCancelling,
  allowedDates = [],
  onUpdateAllowedDates,
  timeslotConfig,
  onUpdateTimeslotConfig,
  onUpdateAttendance,
  onBatchUpdateAttendance,
  onUpdateProjectTitle
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('roster'); // 'roster' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  // Default to 'all' so instructor sees ALL reserved schedules across all dates by default
  const [filterDate, setFilterDate] = useState('all');
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [showBatchRemoveModal, setShowBatchRemoveModal] = useState(false);

  // Attendance Tab & Management State
  const [attendanceTab, setAttendanceTab] = useState('active'); // 'active' | 'finished' | 'missed' | 'all'
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [editingTitleBooking, setEditingTitleBooking] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [attendanceFeedback, setAttendanceFeedback] = useState('');

  // Date Management State
  const [newDateInput, setNewDateInput] = useState('');
  const [dateFeedback, setDateFeedback] = useState('');

  // Timeslot configuration state
  const [morningStart, setMorningStart] = useState(timeslotConfig?.morningStart || '08:00');
  const [morningEnd, setMorningEnd] = useState(timeslotConfig?.morningEnd || '11:00');
  const [afternoonStart, setAfternoonStart] = useState(timeslotConfig?.afternoonStart || '13:00');
  const [afternoonEnd, setAfternoonEnd] = useState(timeslotConfig?.afternoonEnd || '16:00');
  const [slotDuration, setSlotDuration] = useState(timeslotConfig?.slotDurationMinutes || 10);
  const [timeslotFeedback, setTimeslotFeedback] = useState('');
  const [isSavingTimeslot, setIsSavingTimeslot] = useState(false);

  useEffect(() => {
    if (timeslotConfig) {
      setMorningStart(timeslotConfig.morningStart || '08:00');
      setMorningEnd(timeslotConfig.morningEnd || '11:00');
      setAfternoonStart(timeslotConfig.afternoonStart || '13:00');
      setAfternoonEnd(timeslotConfig.afternoonEnd || '16:00');
      setSlotDuration(timeslotConfig.slotDurationMinutes || 10);
    }
  }, [timeslotConfig]);

  const handleSaveTimeslotConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingTimeslot(true);
    try {
      const newConfig = {
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        slotDurationMinutes: Math.max(1, Math.min(120, Number(slotDuration) || 10))
      };
      if (onUpdateTimeslotConfig) {
        await onUpdateTimeslotConfig(newConfig);
      }
      setTimeslotFeedback('✓ Timeslot settings saved! Student defense schedule updated in real-time.');
      setTimeout(() => setTimeslotFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setTimeslotFeedback('Error saving timeslot settings.');
    } finally {
      setIsSavingTimeslot(false);
    }
  };

  const handleResetTimeslotDefaults = async () => {
    setIsSavingTimeslot(true);
    const defaults = {
      morningStart: '08:00',
      morningEnd: '11:00',
      afternoonStart: '13:00',
      afternoonEnd: '16:00',
      slotDurationMinutes: 10
    };
    setMorningStart('08:00');
    setMorningEnd('11:00');
    setAfternoonStart('13:00');
    setAfternoonEnd('16:00');
    setSlotDuration(10);
    if (onUpdateTimeslotConfig) {
      await onUpdateTimeslotConfig(defaults);
    }
    setIsSavingTimeslot(false);
    setTimeslotFeedback('✓ Reset timeslots to defaults (8:00–11:00 AM & 1:00–4:00 PM, 10-min interval)');
    setTimeout(() => setTimeslotFeedback(''), 4000);
  };

  const handleAddAllowedDate = async (e) => {
    e.preventDefault();
    if (!newDateInput) return;
    if (allowedDates.includes(newDateInput)) {
      setDateFeedback(`Notice: ${newDateInput} is already an active scheduling date.`);
      setTimeout(() => setDateFeedback(''), 3000);
      return;
    }
    const updated = [...allowedDates, newDateInput].sort();
    if (onUpdateAllowedDates) {
      await onUpdateAllowedDates(updated);
    }
    setDateFeedback(`✓ Added ${getFormattedDateLabel(newDateInput)} to active schedule.`);
    setNewDateInput('');
    setTimeout(() => setDateFeedback(''), 3000);
  };

  const handleRemoveAllowedDate = async (dateStr) => {
    const bookingsOnDate = bookings.filter(b => b.date === dateStr).length;
    if (bookingsOnDate > 0) {
      const confirmRemove = window.confirm(
        `Warning: There are ${bookingsOnDate} student reservations on ${getFormattedDateLabel(dateStr)}. Are you sure you want to remove this date from the available schedule? (Existing reservations will remain saved).`
      );
      if (!confirmRemove) return;
    }
    const updated = allowedDates.filter(d => d !== dateStr);
    if (onUpdateAllowedDates) {
      await onUpdateAllowedDates(updated);
    }
    setDateFeedback(`Removed ${getFormattedDateLabel(dateStr)} from active schedule.`);
    setTimeout(() => setDateFeedback(''), 3000);
  };

  const handleResetDefaults = async () => {
    const defaultDates = ['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14'];
    if (onUpdateAllowedDates) {
      await onUpdateAllowedDates(defaultDates);
    }
    setDateFeedback(`✓ Reset schedule to default dates: Oct 5, 7, 12, 14`);
    setTimeout(() => setDateFeedback(''), 3000);
  };

  // Extract unique dates present in bookings and allowedDates for the date filter dropdown
  const uniqueDates = useMemo(() => {
    const datesSet = new Set(bookings.map(b => b.date).filter(Boolean));
    if (date) datesSet.add(date);
    (allowedDates || []).forEach(d => datesSet.add(d));
    return Array.from(datesSet).sort();
  }, [bookings, date, allowedDates]);

  const handlePrevDay = () => {
    if (uniqueDates.length === 0) return;
    if (filterDate === 'all') {
      setFilterDate(uniqueDates[0]);
      return;
    }
    const idx = uniqueDates.indexOf(filterDate);
    if (idx > 0) {
      setFilterDate(uniqueDates[idx - 1]);
    } else {
      setFilterDate(uniqueDates[uniqueDates.length - 1]);
    }
  };

  const handleNextDay = () => {
    if (uniqueDates.length === 0) return;
    if (filterDate === 'all') {
      setFilterDate(uniqueDates[0]);
      return;
    }
    const idx = uniqueDates.indexOf(filterDate);
    if (idx >= 0 && idx < uniqueDates.length - 1) {
      setFilterDate(uniqueDates[idx + 1]);
    } else {
      setFilterDate(uniqueDates[0]);
    }
  };

  // Filter bookings: by default shows all dates unless instructor picks a specific one
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Date filter
    if (filterDate !== 'all') {
      result = result.filter(b => b.date === filterDate);
    }

    // Session filter (dynamic based on morning AM vs afternoon PM)
    if (filterSession === 'morning') {
      result = result.filter(b => {
        const hour = parseInt(b.slotId?.split('_')[1]?.slice(0, 2), 10);
        return !isNaN(hour) ? hour < 12 : (b.timeDisplay?.includes('AM') || false);
      });
    } else if (filterSession === 'afternoon') {
      result = result.filter(b => {
        const hour = parseInt(b.slotId?.split('_')[1]?.slice(0, 2), 10);
        return !isNaN(hour) ? hour >= 12 : (b.timeDisplay?.includes('PM') || false);
      });
    }

    // Attendance tab filter
    if (attendanceTab === 'active') {
      result = result.filter(b => !b.attendanceStatus || b.attendanceStatus === 'active');
    } else if (attendanceTab === 'finished') {
      result = result.filter(b => b.attendanceStatus === 'finished');
    } else if (attendanceTab === 'missed') {
      result = result.filter(b => b.attendanceStatus === 'missed');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(b =>
        b.fullName?.toLowerCase().includes(q) ||
        b.studentNumber?.toLowerCase().includes(q) ||
        b.course?.toLowerCase().includes(q) ||
        b.projectTitle?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.timeDisplay?.toLowerCase().includes(q) ||
        b.date?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
      );
    }

    // Chronological sort: by date ascending, then slotId ascending
    result.sort((a, b) => {
      if (a.date !== b.date) {
        return (a.date || '').localeCompare(b.date || '');
      }
      return (a.slotId || '').localeCompare(b.slotId || '');
    });

    return result;
  }, [bookings, filterDate, filterSession, searchQuery, attendanceTab]);

  const totalAllBookings = bookings.length;
  const activeBookingsCount = bookings.filter(b => !b.attendanceStatus || b.attendanceStatus === 'active').length;
  const finishedBookingsCount = bookings.filter(b => b.attendanceStatus === 'finished').length;
  const missedBookingsCount = bookings.filter(b => b.attendanceStatus === 'missed').length;

  const morningBookingsCount = bookings.filter(b => {
    const hour = parseInt(b.slotId?.split('_')[1]?.slice(0, 2), 10);
    return !isNaN(hour) ? hour < 12 : (b.timeDisplay?.includes('AM') || false);
  }).length;
  const afternoonBookingsCount = bookings.filter(b => {
    const hour = parseInt(b.slotId?.split('_')[1]?.slice(0, 2), 10);
    return !isNaN(hour) ? hour >= 12 : (b.timeDisplay?.includes('PM') || false);
  }).length;

  // Single student attendance status change
  const handleMarkStatus = async (slotId, newStatus, studentName) => {
    try {
      if (onUpdateAttendance) {
        await onUpdateAttendance(slotId, newStatus);
      }
      const label = newStatus === 'finished' ? 'Marked as Finished' : newStatus === 'missed' ? 'Marked as Missed Schedule' : 'Reactivated to Active Schedule';
      setAttendanceFeedback(`✓ ${studentName || 'Student'}: ${label}`);
      setTimeout(() => setAttendanceFeedback(''), 3500);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Batch attendance status change
  const handleBatchStatus = async (newStatus) => {
    if (selectedSlotIds.length === 0) return;
    try {
      if (onBatchUpdateAttendance) {
        await onBatchUpdateAttendance(selectedSlotIds, newStatus);
      }
      const count = selectedSlotIds.length;
      const label = newStatus === 'finished' ? 'marked as Finished' : newStatus === 'missed' ? 'marked as Missed Schedule' : 'moved to Active Schedule';
      setAttendanceFeedback(`✓ ${count} student${count > 1 ? 's' : ''} ${label}`);
      setSelectedSlotIds([]);
      setTimeout(() => setAttendanceFeedback(''), 3500);
    } catch (err) {
      console.error('Error batch updating status:', err);
    }
  };

  // Selection toggle
  const isAllVisibleSelected = filteredBookings.length > 0 && filteredBookings.every(b => selectedSlotIds.includes(b.slotId));
  
  const handleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      const visibleIdSet = new Set(filteredBookings.map(b => b.slotId));
      setSelectedSlotIds(prev => prev.filter(id => !visibleIdSet.has(id)));
    } else {
      const visibleIds = filteredBookings.map(b => b.slotId);
      setSelectedSlotIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelect = (slotId) => {
    setSelectedSlotIds(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  // Project title editing
  const handleOpenEditTitle = (booking) => {
    setEditingTitleBooking(booking);
    setEditingTitleText(booking.projectTitle || '');
  };

  const handleSaveProjectTitle = async (e) => {
    if (e) e.preventDefault();
    if (!editingTitleBooking) return;
    setIsSavingTitle(true);
    try {
      if (onUpdateProjectTitle) {
        await onUpdateProjectTitle(editingTitleBooking.slotId, editingTitleText.trim());
      }
      setAttendanceFeedback(`✓ Project title updated for ${editingTitleBooking.fullName}`);
      setEditingTitleBooking(null);
      setTimeout(() => setAttendanceFeedback(''), 3500);
    } catch (err) {
      console.error('Error updating project title:', err);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const [exportSuccess, setExportSuccess] = useState(false);

  const downloadFilename = `Mapua_OJT_Defenses_${filterDate === 'all' ? 'All_Dates' : filterDate}.csv`;
  const serverDownloadUrl = `/api/export-csv?date=${encodeURIComponent(filterDate)}`;

  const handleExportCSV = (e) => {
    // Show download feedback
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);

    try {
      const dataToExport = filteredBookings.length > 0 ? filteredBookings : bookings;
      const headers = [
        'Scheduled Day & Date',
        'Slot Time',
        'Student Name',
        'Student Number',
        'Gender',
        'Course & Section',
        'Project Title',
        'Attendance Status',
        'Student Email',
        'Booking Reference ID',
        'Booking Timestamp'
      ];
      const rows = dataToExport.map(b => [
        `"${(getFormattedDateLabel(b.date) || b.date || '').replace(/"/g, '""')}"`,
        `"${(b.timeDisplay || '').replace(/"/g, '""')}"`,
        `"${(b.fullName || '').replace(/"/g, '""')}"`,
        `"${(b.studentNumber || '').replace(/"/g, '""')}"`,
        `"${(b.gender || 'Not specified').replace(/"/g, '""')}"`,
        `"${(b.course || '').replace(/"/g, '""')}"`,
        `"${(b.projectTitle || '').replace(/"/g, '""')}"`,
        `"${((b.attendanceStatus || 'active').toUpperCase()).replace(/"/g, '""')}"`,
        `"${(b.email || '').replace(/"/g, '""')}"`,
        `"${(b.id || '').replace(/"/g, '""')}"`,
        `"${(b.createdAt || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');

      // Use Data URI fallback with explicit text/csv MIME type
      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', downloadFilename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch {}
      }, 500);

      e.preventDefault(); // Handled via data URI with verified .csv extension
    } catch {
      // Allow browser to follow href="/api/export-csv"
    }
  };

  const handleRemoveStudent = (booking) => {
    setStudentToRemove(booking);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header & Tab Navigation Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--mapua-crimson)'
            }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Instructor Control Center
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {activeAdminTab === 'roster'
              ? 'Student defense schedule, presentation attendance tracking, and printable rosters.'
              : 'Configure available defense dates and customize timeslot durations.'}
          </p>
        </div>

        {/* View Switcher Pills */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-medium)',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveAdminTab('roster')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: activeAdminTab === 'roster' ? 700 : 500,
              background: activeAdminTab === 'roster' ? 'var(--bg-surface)' : 'transparent',
              color: activeAdminTab === 'roster' ? 'var(--mapua-crimson)' : 'var(--text-secondary)',
              border: activeAdminTab === 'roster' ? '1px solid var(--border-medium)' : '1px solid transparent',
              borderRadius: '6px',
              boxShadow: activeAdminTab === 'roster' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer'
            }}
          >
            <ClipboardList size={15} />
            <span>Defense Roster ({totalAllBookings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: activeAdminTab === 'settings' ? 700 : 500,
              background: activeAdminTab === 'settings' ? 'var(--bg-surface)' : 'transparent',
              color: activeAdminTab === 'settings' ? 'var(--mapua-crimson)' : 'var(--text-secondary)',
              border: activeAdminTab === 'settings' ? '1px solid var(--border-medium)' : '1px solid transparent',
              borderRadius: '6px',
              boxShadow: activeAdminTab === 'settings' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Sliders size={15} />
            <span>Schedule Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEFENSE ROSTER (METRICS) */}
      {activeAdminTab === 'roster' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
        <div className="academic-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Reserved Schedules
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', color: 'var(--mapua-crimson)', fontFamily: 'var(--font-mono)' }}>
                {totalAllBookings}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              background: 'var(--mapua-crimson-subtle)',
              border: '1px solid var(--mapua-crimson-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} color="var(--mapua-crimson)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            All active student appointments across all dates
          </div>
        </div>

        <div className="academic-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Morning Sessions ({slotsData?.morningLabel || '8–11 AM'})
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {morningBookingsCount}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="var(--text-secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Booked morning defense appointments
          </div>
        </div>

        <div className="academic-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Afternoon Sessions ({slotsData?.afternoonLabel || '1–4 PM'})
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {afternoonBookingsCount}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="var(--text-secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Booked afternoon presentation appointments
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: SCHEDULE SETTINGS (DATES & TIMESLOT CONFIGURATION) */}
      {activeAdminTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* OJT Scheduling Dates Availability Manager Card */}
      <div className="academic-card" style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--mapua-crimson)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                OJT Scheduling Available Dates Manager
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Designate which dates are available for student reservation. Currently active dates are displayed below.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', gap: '6px' }}
            title="Reset to default dates: Oct 5, 7, 12, 14"
          >
            <RotateCcw size={13} />
            <span>Reset to Default (Oct 5, 7, 12, 14)</span>
          </button>
        </div>

        {/* Date Feedback Notice */}
        {dateFeedback && (
          <div style={{
            fontSize: '0.8rem',
            color: '#166534',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#166534" />
            <span>{dateFeedback}</span>
          </div>
        )}

        {/* Active Dates Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {allowedDates.map((dateStr) => {
            const dateBookingsCount = bookings.filter(b => b.date === dateStr).length;
            const isCurrentDate = dateStr === date;

            return (
              <div
                key={dateStr}
                style={{
                  background: isCurrentDate ? 'var(--status-selected-subtle)' : 'var(--bg-subtle)',
                  border: isCurrentDate ? '1.5px solid var(--status-selected-border)' : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {getFormattedDateLabel(dateStr)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {dateStr}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllowedDate(dateStr)}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 6px',
                      color: 'var(--mapua-crimson)',
                      borderColor: 'var(--border-light)',
                      background: 'transparent'
                    }}
                    title={`Remove ${dateStr} from available dates`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  paddingTop: '6px',
                  borderTop: '1px dashed var(--border-light)'
                }}>
                  <span style={{ fontWeight: 600, color: dateBookingsCount > 0 ? 'var(--mapua-crimson)' : 'var(--status-available-text)' }}>
                    {dateBookingsCount} / 42 Booked
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDate(dateStr);
                      setFilterDate(dateStr);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--mapua-crimson)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Filter Table →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Date Form */}
        <form onSubmit={handleAddAllowedDate} style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            + Add Available Date:
          </span>
          <input
            type="date"
            value={newDateInput}
            onChange={(e) => setNewDateInput(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600
            }}
          />
          <button
            type="submit"
            disabled={!newDateInput}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <CalendarPlus size={14} />
            <span>Enable Date for Students</span>
          </button>
        </form>
      </div>

      {/* Timeslot & Schedule Hours / Interval Configuration Card */}
      <div className="academic-card" style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--mapua-crimson)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Timeslot & Schedule Hours Configuration
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Adjust start and end times for Morning and Afternoon sessions, and set the slot presentation interval (default: 10 minutes).
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetTimeslotDefaults}
            disabled={isSavingTimeslot}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', gap: '6px' }}
            title="Reset to default times: Morning 8-11 AM, Afternoon 1-4 PM, 10 min interval"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults (8–11 AM, 1–4 PM, 10m)</span>
          </button>
        </div>

        {/* Timeslot Feedback Notice */}
        {timeslotFeedback && (
          <div style={{
            fontSize: '0.8rem',
            color: '#166534',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#166534" />
            <span>{timeslotFeedback}</span>
          </div>
        )}

        <form onSubmit={handleSaveTimeslotConfig}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Morning Session Hours */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                <Clock size={15} color="var(--mapua-crimson)" />
                <span>Morning Session Hours</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Afternoon Session Hours */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                <Clock size={15} color="var(--mapua-crimson)" />
                <span>Afternoon Session Hours</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Interval / Slot Duration */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <Clock size={15} color="var(--mapua-crimson)" />
                  <span>Defense Slot Interval</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--mapua-crimson)', fontFamily: 'var(--font-mono)' }}>
                  {slotDuration} mins / slot
                </span>
              </div>

              {/* Quick Stepper + Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSlotDuration(prev => Math.max(5, Number(prev) - 5))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px' }}
                  title="Lower interval by 5 mins"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="1"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Math.max(1, Math.min(120, Number(e.target.value) || 10)))}
                  style={{
                    width: '70px',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '6px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSlotDuration(prev => Math.min(120, Number(prev) + 5))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px' }}
                  title="Increase interval by 5 mins"
                >
                  <Plus size={14} />
                </button>

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  {[5, 10, 15, 20, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSlotDuration(mins)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: slotDuration === mins ? 700 : 500,
                        background: slotDuration === mins ? 'var(--mapua-crimson)' : 'var(--bg-surface)',
                        color: slotDuration === mins ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Set the duration allocated for each student's presentation (Default: 10 mins).
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed var(--border-light)'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current generated slots per day: <strong>{slotsData?.totalSlots || 0} slots</strong> ({slotsData?.morning?.length || 0} Morning + {slotsData?.afternoon?.length || 0} Afternoon)
            </div>

            <button
              type="submit"
              disabled={isSavingTimeslot}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8125rem', gap: '6px' }}
            >
              <Save size={14} />
              <span>{isSavingTimeslot ? 'Saving Changes...' : 'Save Timeslot Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
        </div>
      )}

      {/* TAB 1: DEFENSE ROSTER (CONTROLS & TABLE) */}
      {activeAdminTab === 'roster' && (
        <>
          {/* Controls Bar: Search, Date Filter, Session Filter, Export */}
          <div className="academic-card" style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search name, ID, course, day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '7px 10px 7px 32px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)',
                  width: '100%'
                }}
              />
            </div>

            {/* Date Filter with Day Stepper Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handlePrevDay}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                title="Previous defense date"
              >
                <ChevronLeft size={14} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--text-muted)" />
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600
                  }}
                >
                  <option value="all">All Dates ({totalAllBookings} Bookings)</option>
                  {uniqueDates.map(d => (
                    <option key={d} value={d}>
                      {getFormattedDateLabel(d)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                title="Next defense date"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Session Filter */}
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                padding: '7px 10px',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <option value="all">All Sessions</option>
              <option value="morning">Morning Only ({slotsData?.morningLabel || '8–11 AM'})</option>
              <option value="afternoon">Afternoon Only ({slotsData?.afternoonLabel || '1–4 PM'})</option>
            </select>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
            >
              <Printer size={15} />
              <span>Print Roster</span>
            </button>

            <a
              href={serverDownloadUrl}
              download={downloadFilename}
              onClick={handleExportCSV}
              className="btn btn-primary"
              style={{
                fontSize: '0.8125rem',
                padding: '8px 14px',
                textDecoration: 'none',
                background: exportSuccess ? '#059669' : 'var(--mapua-crimson)',
                borderColor: exportSuccess ? '#059669' : 'var(--mapua-crimson)'
              }}
            >
              <FileSpreadsheet size={15} />
              <span>{exportSuccess ? 'CSV Downloaded ✓' : 'Export CSV (Excel)'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Roster Table Card with Day/Date Column & Attendance Status Tabs */}
      <div className="academic-card" style={{ padding: '20px', overflowX: 'auto' }}>
        {/* Attendance Action Feedback Toast */}
        {attendanceFeedback && (
          <div style={{
            fontSize: '0.8125rem',
            color: '#166534',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <CheckCircle2 size={16} color="#166534" />
            <span style={{ fontWeight: 600 }}>{attendanceFeedback}</span>
          </div>
        )}

        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {filterDate === 'all' ? 'All Scheduled OJT Defense Bookings' : `OJT Defense Roster for ${getFormattedDateLabel(filterDate)}`}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Showing {filteredBookings.length} of {totalAllBookings} total registered student appointments
            </p>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Mark students as <strong>Finished</strong> or <strong>Missed</strong> to filter them into designated tabs.
          </div>
        </div>

        {/* Attendance Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '14px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Active Schedule Tab (Default) */}
          <button
            type="button"
            onClick={() => { setAttendanceTab('active'); setSelectedSlotIds([]); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: attendanceTab === 'active' ? 'var(--mapua-crimson)' : 'var(--border-medium)',
              background: attendanceTab === 'active' ? 'var(--mapua-crimson)' : 'var(--bg-surface)',
              color: attendanceTab === 'active' ? '#ffffff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={15} />
            <span>Active Schedule</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: attendanceTab === 'active' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
              color: attendanceTab === 'active' ? '#ffffff' : 'var(--text-secondary)'
            }}>
              {activeBookingsCount}
            </span>
          </button>

          {/* Finished Tab */}
          <button
            type="button"
            onClick={() => { setAttendanceTab('finished'); setSelectedSlotIds([]); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: attendanceTab === 'finished' ? '#16a34a' : 'var(--border-medium)',
              background: attendanceTab === 'finished' ? '#16a34a' : 'var(--bg-surface)',
              color: attendanceTab === 'finished' ? '#ffffff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCircle2 size={15} />
            <span>Finished Defenses</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: attendanceTab === 'finished' ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
              color: attendanceTab === 'finished' ? '#ffffff' : '#166534'
            }}>
              {finishedBookingsCount}
            </span>
          </button>

          {/* Missed Tab */}
          <button
            type="button"
            onClick={() => { setAttendanceTab('missed'); setSelectedSlotIds([]); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: attendanceTab === 'missed' ? '#d97706' : 'var(--border-medium)',
              background: attendanceTab === 'missed' ? '#d97706' : 'var(--bg-surface)',
              color: attendanceTab === 'missed' ? '#ffffff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={15} />
            <span>Missed Schedule</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: attendanceTab === 'missed' ? 'rgba(255,255,255,0.25)' : '#FEF3C7',
              color: attendanceTab === 'missed' ? '#ffffff' : '#92400E'
            }}>
              {missedBookingsCount}
            </span>
          </button>

          {/* All Records Tab */}
          <button
            type="button"
            onClick={() => { setAttendanceTab('all'); setSelectedSlotIds([]); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: attendanceTab === 'all' ? '#475569' : 'var(--border-medium)',
              background: attendanceTab === 'all' ? '#475569' : 'var(--bg-surface)',
              color: attendanceTab === 'all' ? '#ffffff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} />
            <span>All Records</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: attendanceTab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
              color: attendanceTab === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}>
              {totalAllBookings}
            </span>
          </button>
        </div>

        {/* Batch Action Bar (Appears when 1 or more students are checked) */}
        {selectedSlotIds.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {selectedSlotIds.length} student{selectedSlotIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlotIds([])}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                Deselect All
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleBatchStatus('finished')}
                className="btn"
                style={{
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={14} />
                <span>Mark Selected Finished ({selectedSlotIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchStatus('missed')}
                className="btn"
                style={{
                  background: '#d97706',
                  borderColor: '#d97706',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <AlertTriangle size={14} />
                <span>Mark Selected Missed ({selectedSlotIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchStatus('active')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px', cursor: 'pointer' }}
              >
                <RotateCcw size={14} />
                <span>Move to Active ({selectedSlotIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBatchRemoveModal(true)}
                className="btn btn-outline-danger"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Trash2 size={14} />
                <span>Remove Selected ({selectedSlotIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)'
          }}>
            <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {attendanceTab === 'finished' ? 'No finished defenses yet' : 
               attendanceTab === 'missed' ? 'No missed schedule records' : 
               attendanceTab === 'active' ? 'No active scheduled defenses found' : 
               'No reserved schedules found matching this filter'}
            </div>
            <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
              {attendanceTab === 'finished' ? 'Mark active students as finished to see them here.' : 
               attendanceTab === 'missed' ? 'Mark absent students as missed to track them here.' : 
               'When students make reservations, they will appear here across all dates.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="admin-desktop-table-container">
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8125rem',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {/* Row Selection Header */}
                    <th style={{ padding: '10px 8px', width: '36px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleSelectAllVisible}
                        title="Select / Deselect all visible students"
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </th>
                    <th style={{ padding: '10px 12px' }}>Defense Status / Mark</th>
                    <th style={{ padding: '10px 12px' }}>Scheduled Day & Date</th>
                    <th style={{ padding: '10px 12px' }}>Time Slot</th>
                    <th style={{ padding: '10px 12px' }}>Student Name</th>
                    <th style={{ padding: '10px 12px' }}>Student Number</th>
                    <th style={{ padding: '10px 12px' }}>Gender</th>
                    <th style={{ padding: '10px 12px' }}>Course / Section</th>
                    <th style={{ padding: '10px 12px' }}>Project Title</th>
                    <th style={{ padding: '10px 12px' }}>Student Email</th>
                    <th style={{ padding: '10px 12px' }}>Reference ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const isSelected = selectedSlotIds.includes(b.slotId);
                    const status = b.attendanceStatus || 'active';

                    return (
                      <tr
                        key={b.slotId}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          background: isSelected ? 'rgba(217, 38, 38, 0.04)' : undefined
                        }}
                      >
                        {/* Row Selection Checkbox */}
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(b.slotId)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                        </td>

                        {/* Defense Status / Checkbox Action */}
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                          {status === 'active' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Checkbox to Mark Finished */}
                              <label style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                userSelect: 'none'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => handleMarkStatus(b.slotId, 'finished', b.fullName)}
                                  style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#16a34a' }}
                                />
                                <span>Finished</span>
                              </label>

                              {/* Button to Mark Missed */}
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(b.slotId, 'missed', b.fullName)}
                                title="Mark student as missed / absent"
                                style={{
                                  background: '#fffbeb',
                                  border: '1px solid #fcd34d',
                                  borderRadius: '6px',
                                  color: '#b45309',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <AlertTriangle size={12} color="#d97706" />
                                <span>Missed</span>
                              </button>
                            </div>
                          )}

                          {status === 'finished' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Checked Checkbox - Clicking unchecks and moves to Active */}
                              <label style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#166534',
                                background: '#dcfce7',
                                border: '1px solid #86efac',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                userSelect: 'none'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => handleMarkStatus(b.slotId, 'active', b.fullName)}
                                  title="Uncheck to return to Active schedule"
                                  style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: '#16a34a' }}
                                />
                                <CheckCircle2 size={13} color="#166534" />
                                <span>Finished</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleMarkStatus(b.slotId, 'active', b.fullName)}
                                title="Revert to active schedule"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Undo
                              </button>
                            </div>
                          )}

                          {status === 'missed' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#92400e',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                padding: '4px 8px'
                              }}>
                                <AlertTriangle size={13} color="#d97706" />
                                <span>Missed</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleMarkStatus(b.slotId, 'active', b.fullName)}
                                title="Revert to active schedule"
                                style={{
                                  background: 'var(--bg-subtle)',
                                  border: '1px solid var(--border-medium)',
                                  color: 'var(--text-secondary)',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '3px 8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <RotateCcw size={11} />
                                <span>Reactivate</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Scheduled Day & Date Column */}
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="var(--mapua-crimson)" />
                            <span>{getFormattedDateLabel(b.date)}</span>
                          </div>
                        </td>

                        {/* Time Slot Column */}
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--mapua-crimson)', whiteSpace: 'nowrap' }}>
                          {b.timeDisplay}
                        </td>

                        {/* Student Name */}
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.fullName}
                        </td>

                        {/* Student Number */}
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {b.studentNumber}
                        </td>

                        {/* Gender */}
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {b.gender || '—'}
                        </td>

                        {/* Course & Section */}
                        <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                          <span className="badge badge-neutral">
                            {b.course}
                          </span>
                        </td>

                        {/* Project Title with Inline Edit Icon */}
                        <td style={{ padding: '12px', color: 'var(--text-primary)', minWidth: '180px', maxWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span 
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: b.projectTitle ? 600 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: b.projectTitle ? 'var(--text-primary)' : 'var(--text-disabled)',
                                fontStyle: b.projectTitle ? 'normal' : 'italic'
                              }} 
                              title={b.projectTitle || 'Click edit to set title'}
                            >
                              {b.projectTitle || '— (No title set)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTitle(b)}
                              title="Edit Project Title"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '3px',
                                color: 'var(--mapua-crimson)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {b.email}
                        </td>

                        {/* Reference ID */}
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-disabled)' }}>
                          {b.id}
                        </td>

                        {/* Remove Button */}
                        <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(b)}
                            disabled={isCancelling}
                            className="btn btn-outline-danger"
                            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                            title="Remove this student and free up the slot"
                          >
                            <UserX size={13} />
                            <span>Remove Student</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="admin-mobile-card-list">
              {filteredBookings.map((b) => {
                const status = b.attendanceStatus || 'active';
                return (
                  <div key={b.slotId} className="admin-booking-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {b.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          ID: {b.studentNumber} {b.gender ? `• ${b.gender}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {b.course}
                      </span>
                    </div>

                    {/* Attendance Controls in Mobile Card */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-subtle)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Defense Status:
                      </span>
                      {status === 'active' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(b.slotId, 'finished', b.fullName)}
                            style={{
                              background: '#dcfce7',
                              border: '1px solid #86efac',
                              color: '#166534',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Mark Finished
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(b.slotId, 'missed', b.fullName)}
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#92400e',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ⚠️ Mark Missed
                          </button>
                        </div>
                      )}
                      {status === 'finished' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                            ✓ Finished
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(b.slotId, 'active', b.fullName)}
                            style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            Undo
                          </button>
                        </div>
                      )}
                      {status === 'missed' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                            ⚠️ Missed
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(b.slotId, 'active', b.fullName)}
                            style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            Reactivate
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Project Title Row */}
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      padding: '6px 10px',
                      background: 'rgba(217, 38, 38, 0.05)',
                      borderRadius: '4px',
                      borderLeft: '3px solid var(--mapua-crimson)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Project Title
                        </span>
                        <span>{b.projectTitle || '— (No title set)'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTitle(b)}
                        title="Edit Project Title"
                        style={{ background: 'none', border: 'none', color: 'var(--mapua-crimson)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-subtle)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--mapua-crimson)' }}>
                        <Clock size={14} />
                        <span>{b.timeDisplay}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {getFormattedDateLabel(b.date)}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                        <Mail size={12} color="var(--text-muted)" />
                        <span>{b.email}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
                        #{b.id?.slice(0, 8)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(b)}
                      disabled={isCancelling}
                      className="btn btn-outline-danger"
                      style={{ width: '100%', padding: '8px', fontSize: '0.8125rem' }}
                    >
                      <UserX size={14} />
                      <span>Remove Student Reservation</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
        </>
      )}

      {/* Edit Project Title Modal */}
      {editingTitleBooking && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--mapua-crimson)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Edit Project Title
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTitleBooking(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProjectTitle} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingTitleBooking.fullName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Student ID: {editingTitleBooking.studentNumber} • {editingTitleBooking.course}
                </div>
                <div style={{ color: 'var(--mapua-crimson)', fontSize: '0.78rem', fontWeight: 600, marginTop: '4px' }}>
                  {editingTitleBooking.timeDisplay} • {getFormattedDateLabel(editingTitleBooking.date)}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Project Title:
                </label>
                <textarea
                  rows={3}
                  value={editingTitleText}
                  onChange={(e) => setEditingTitleText(e.target.value)}
                  placeholder="e.g. AI-Powered Healthcare Diagnostics System"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    resize: 'vertical'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTitleBooking(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTitle}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{isSavingTitle ? 'Saving...' : 'Save Title'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Removal Confirmation Modal */}
      {studentToRemove && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={18} color="var(--mapua-crimson)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Remove Student Reservation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to remove this reservation? The slot will immediately reopen for other students.
              </p>

              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.8125rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  {studentToRemove.fullName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '2px' }}>
                  ID: {studentToRemove.studentNumber} • {studentToRemove.gender ? `${studentToRemove.gender} • ` : ''}{studentToRemove.course}
                </div>
                <div style={{ marginTop: '8px', color: 'var(--mapua-crimson)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {studentToRemove.timeDisplay} • {getFormattedDateLabel(studentToRemove.date)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <Mail size={12} color="var(--text-muted)" />
                  <span>Cancellation notice will be sent to: <strong>{studentToRemove.email}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStudentToRemove(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '9px', fontSize: '0.85rem' }}
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={async () => {
                    const target = studentToRemove;
                    setStudentToRemove(null);
                    await onCancelBooking(target.slotId, target);
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '9px',
                    fontSize: '0.85rem',
                    background: 'var(--mapua-crimson)',
                    borderColor: 'var(--mapua-crimson)'
                  }}
                >
                  {isCancelling ? 'Removing...' : 'Confirm Removal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Removal Confirmation Modal */}
      {showBatchRemoveModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px', maxHeight: 'min(90vh, 680px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="var(--mapua-crimson)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Batch Remove Reservations ({selectedSlotIds.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchRemoveModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to remove the <strong>{selectedSlotIds.length}</strong> selected student reservation{selectedSlotIds.length > 1 ? 's' : ''}? These defense slots will immediately reopen for other students.
              </p>

              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {bookings.filter(b => selectedSlotIds.includes(b.slotId)).map((b) => (
                  <div
                    key={b.slotId}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.fullName}</div>
                      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        ID: {b.studentNumber} • {b.course}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--mapua-crimson)', fontSize: '0.78rem' }}>
                        {b.timeDisplay}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {getFormattedDateLabel(b.date) || b.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBatchRemoveModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '9px', fontSize: '0.85rem' }}
                >
                  Keep Reservations
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={async () => {
                    const idsToCancel = [...selectedSlotIds];
                    const count = idsToCancel.length;
                    setShowBatchRemoveModal(false);
                    if (onBatchCancelBooking) {
                      await onBatchCancelBooking(idsToCancel);
                    } else if (onCancelBooking) {
                      for (const id of idsToCancel) {
                        await onCancelBooking(id);
                      }
                    }
                    setSelectedSlotIds([]);
                    setAttendanceFeedback(`✓ Successfully removed ${count} student reservation${count > 1 ? 's' : ''}`);
                    setTimeout(() => setAttendanceFeedback(''), 3500);
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1.2,
                    padding: '9px',
                    fontSize: '0.85rem',
                    background: 'var(--mapua-crimson)',
                    borderColor: 'var(--mapua-crimson)'
                  }}
                >
                  {isCancelling ? 'Removing...' : `Confirm Remove (${selectedSlotIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
