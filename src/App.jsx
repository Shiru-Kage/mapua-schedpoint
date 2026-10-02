import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import CalendarView from './components/CalendarView';
import BookingForm from './components/BookingForm';
import ConfirmationModal from './components/ConfirmationModal';
import StudentRetractModal from './components/StudentRetractModal';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthModal from './components/AdminAuthModal';
import FirebaseModal from './components/FirebaseModal';
import RoleLoginPage from './components/RoleLoginPage';
import { getAllSlotsForDate } from './utils/slotGenerator';
import { 
  fetchAllBookings, 
  submitBooking, 
  cancelBooking, 
  batchCancelBookings,
  subscribeToBookings,
  updateBookingAttendance,
  batchUpdateBookingAttendance,
  updateBookingProjectTitle
} from './services/bookingStorage';
import { 
  getLocalAllowedDates, 
  fetchAllowedDates, 
  updateAllowedDates, 
  subscribeToAllowedDates,
  getLocalTimeslotConfig,
  fetchTimeslotConfig,
  updateTimeslotConfig,
  subscribeToTimeslotConfig,
  DEFAULT_TIMESLOT_CONFIG
} from './services/scheduleSettings';
import { getSavedSession, saveSession, clearSession } from './services/instructorAuth';
import { getFirebaseDb } from './services/firebase';
import { sendRetractionEmail, sendBookingConfirmationEmail } from './services/emailService';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mapua_theme') || 'mapua';
  });

  // Default and primary page is ALWAYS the Login Portal first
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      localStorage.removeItem('ojt_user_session');
    } catch (e) {}
    return null;
  });

  const [allowedDates, setAllowedDates] = useState(() => getLocalAllowedDates());
  const [timeslotConfig, setTimeslotConfig] = useState(() => getLocalTimeslotConfig());
  const [date, setDate] = useState(() => {
    const initial = getLocalAllowedDates();
    const today = getTodayString();
    return initial.includes(today) ? today : (initial[0] || '2026-10-05');
  });
  const [sessionFilter, setSessionFilter] = useState('all'); // By default show all slots
  const [viewMode, setViewMode] = useState('timeline');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  const [currentTab, setCurrentTab] = useState('booking'); // 'booking' | 'admin'
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showRetractModal, setShowRetractModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mapua_theme', theme);
  }, [theme]);

  // Compute slots based on dynamic timeslot configuration (default 8-11 AM & 1-4 PM, 10 min)
  const slotsData = useMemo(() => {
    return getAllSlotsForDate(date, timeslotConfig);
  }, [date, timeslotConfig]);

  // Initial load & real-time sync listener
  useEffect(() => {
    const db = getFirebaseDb();
    setIsFirebaseActive(!!db);

    fetchAllBookings().then((initialBookings) => {
      if (Array.isArray(initialBookings)) {
        setBookings(initialBookings);
      }
    });

    const unsubscribe = subscribeToBookings((updatedBookings) => {
      setBookings(updatedBookings);

      if (selectedSlot) {
        const isNowBooked = updatedBookings.some(b => b.slotId === selectedSlot.id);
        if (isNowBooked) {
          setSelectedSlot(null);
          setErrorMessage('Notice: The slot you were viewing was just claimed by another student. Please select an available slot.');
        } else {
          // If the slot is open or was retracted, clear any stale claim error
          setErrorMessage(prev => prev.includes('claimed by another student') ? '' : prev);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedSlot]);

  // Subscribe to allowed scheduling dates configured by admin/instructor
  useEffect(() => {
    fetchAllowedDates().then((dates) => {
      if (Array.isArray(dates) && dates.length > 0) {
        setAllowedDates(dates);
      }
    });

    const unsubAllowed = subscribeToAllowedDates((dates) => {
      if (Array.isArray(dates) && dates.length > 0) {
        setAllowedDates(dates);
      }
    });

    return () => {
      if (unsubAllowed) unsubAllowed();
    };
  }, []);

  // Subscribe to timeslot interval and hours configuration
  useEffect(() => {
    fetchTimeslotConfig().then((cfg) => {
      if (cfg && cfg.slotDurationMinutes) {
        setTimeslotConfig(cfg);
      }
    });

    const unsubTimeslot = subscribeToTimeslotConfig((cfg) => {
      if (cfg && cfg.slotDurationMinutes) {
        setTimeslotConfig(cfg);
      }
    });

    return () => {
      if (unsubTimeslot) unsubTimeslot();
    };
  }, []);

  // Student booking submission handler
  const handleBookingSubmit = async (formData) => {
    if (!selectedSlot) return;

    // Check that selected date is an authorized scheduling date
    if (allowedDates && allowedDates.length > 0 && !allowedDates.includes(selectedSlot.date)) {
      setErrorMessage(`The selected date (${selectedSlot.date}) is not open for OJT scheduling. Please select an authorized date.`);
      return;
    }

    // Check duplicate student number locally
    const cleanId = String(formData.studentNumber || '').trim().toLowerCase();
    const existing = bookings.find(b => 
      String(b.studentNumber || '').trim().toLowerCase() === cleanId && b.date === selectedSlot.date
    );
    if (existing) {
      setErrorMessage(`Duplicate submission: Student Number "${formData.studentNumber}" already holds a reserved slot (${existing.timeDisplay}) on this date. Please cancel your previous reservation to book a new time.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitBooking({
        slotId: selectedSlot.id,
        date: selectedSlot.date,
        timeDisplay: selectedSlot.timeDisplay,
        ...formData,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setSelectedSlot(null);
      } else {
        setConfirmedBooking(result.booking);
        setSelectedSlot(null);
        // Automatically dispatch confirmation receipt with Reference Code to student's email
        sendBookingConfirmationEmail(result.booking).catch(emailErr => {
          console.warn('Booking confirmation email warning:', emailErr);
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instructor or student slot release/retraction handler
  const handleCancelBooking = async (slotId, bookingData = null) => {
    setIsCancelling(true);
    setErrorMessage('');
    try {
      const targetBooking = bookingData || bookings.find(b => b.slotId === slotId);
      // Immediately update UI state so table and calendar update with 0 latency
      setBookings(prev => prev.filter(b => b.slotId !== slotId));

      await cancelBooking(slotId);

      // Dispatch automated confirmation email in background without blocking UI
      if (targetBooking && targetBooking.email) {
        sendRetractionEmail(targetBooking).catch(emailErr => {
          console.warn('Retraction email warning:', emailErr);
        });
      }
    } catch (err) {
      console.error('Failed to release slot:', err);
      alert('Failed to release slot: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBatchCancelBooking = async (slotIds) => {
    if (!Array.isArray(slotIds) || slotIds.length === 0) return;
    setIsCancelling(true);
    setErrorMessage('');
    const idSet = new Set(slotIds);
    const targetBookings = bookings.filter(b => idSet.has(b.slotId));
    // Immediately update UI state so table and calendar update with 0 latency
    setBookings(prev => prev.filter(b => !idSet.has(b.slotId)));

    try {
      await batchCancelBookings(slotIds);

      // Dispatch automated cancellation emails in background
      targetBookings.forEach(b => {
        if (b && b.email) {
          sendRetractionEmail(b).catch(emailErr => {
            console.warn('Batch retraction email warning:', emailErr);
          });
        }
      });
    } catch (err) {
      console.error('Failed batch cancel:', err);
      alert('Failed batch removal: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateAttendance = async (slotId, status) => {
    setBookings(prev => prev.map(b => b.slotId === slotId ? { ...b, attendanceStatus: status } : b));
    await updateBookingAttendance(slotId, status);
  };

  const handleBatchUpdateAttendance = async (slotIds, status) => {
    const idSet = new Set(slotIds);
    setBookings(prev => prev.map(b => idSet.has(b.slotId) ? { ...b, attendanceStatus: status } : b));
    await batchUpdateBookingAttendance(slotIds, status);
  };

  const handleUpdateProjectTitle = async (slotId, projectTitle) => {
    setBookings(prev => prev.map(b => b.slotId === slotId ? { ...b, projectTitle } : b));
    await updateBookingProjectTitle(slotId, projectTitle);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsAdminUnlocked(false);
    setCurrentTab('booking');
    setSelectedSlot(null);
  };

  // If user is not yet authenticated as Student or Instructor, show Login Portal
  if (!currentUser) {
    return (
      <RoleLoginPage
        onLoginStudent={() => {
          const session = { role: 'student' };
          saveSession(session);
          setCurrentUser(session);
          setCurrentTab('booking');
        }}
        onLoginInstructor={(email) => {
          const session = { role: 'instructor', email };
          saveSession(session);
          setCurrentUser(session);
          setIsAdminUnlocked(true);
          setCurrentTab('admin');
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAdminUnlocked={isAdminUnlocked}
        openAdminModal={() => setShowAdminAuth(true)}
        openRetractModal={() => setShowRetractModal(true)}
        bookingsCount={bookings.length}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="main-content-layout">
        {currentTab === 'booking' ? (
          <div>
            {/* Academic Page Header */}
            <div className="academic-page-header">
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0'
                }}>
                  OJT Defense Scheduling Form
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  margin: 0
                }}>
                  {slotsData?.slotMinutes || 10}-minute individual presentation slots
                  {slotsData?.enableMorning !== false && slotsData?.enableAfternoon !== false ? (
                    <> across Morning (<strong>{slotsData?.morningRange || '8:00 AM – 11:00 AM'}</strong>) and Afternoon (<strong>{slotsData?.afternoonRange || '1:00 PM – 4:00 PM'}</strong>) sessions.</>
                  ) : slotsData?.enableMorning !== false ? (
                    <> for the Morning session (<strong>{slotsData?.morningRange || '8:00 AM – 11:00 AM'}</strong>).</>
                  ) : (
                    <> for the Afternoon session (<strong>{slotsData?.afternoonRange || '1:00 PM – 4:00 PM'}</strong>).</>
                  )}
                  {' '}Slots are locked upon confirmation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRetractModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                <span>Have a reservation? Manage or Retract</span>
              </button>
            </div>

            {/* Split layout: Calendar View (Left) & Form (Right) with Independent Scrolling */}
            <div className="booking-layout-grid">
              <div className="booking-schedule-scroll-col">
                <CalendarView
                  date={date}
                  setDate={(newDate) => {
                    setDate(newDate);
                    setSelectedSlot(null);
                    setErrorMessage('');
                  }}
                  slotsData={slotsData}
                  selectedSlot={selectedSlot}
                  setSelectedSlot={(slot) => {
                    setSelectedSlot(slot);
                    setErrorMessage('');
                  }}
                  bookings={bookings}
                  sessionFilter={sessionFilter}
                  setSessionFilter={setSessionFilter}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  allowedDates={allowedDates}
                />
              </div>

              <div id="student-booking-form-section" className="booking-form-scroll-col">
                <BookingForm
                  selectedSlot={selectedSlot}
                  onDeselectSlot={() => {
                    setSelectedSlot(null);
                    setErrorMessage('');
                  }}
                  onSubmit={handleBookingSubmit}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                  clearError={() => setErrorMessage('')}
                  bookings={bookings}
                  date={date}
                  onOpenRetractModal={() => {
                    setShowRetractModal(true);
                    setErrorMessage('');
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Instructor Portal */
          <AdminDashboard
            bookings={bookings}
            date={date}
            setDate={setDate}
            slotsData={slotsData}
            onCancelBooking={handleCancelBooking}
            onBatchCancelBooking={handleBatchCancelBooking}
            isCancelling={isCancelling}
            allowedDates={allowedDates}
            onUpdateAllowedDates={async (newDates) => {
              const res = await updateAllowedDates(newDates);
              if (res && Array.isArray(res)) {
                setAllowedDates(res);
              }
              return res;
            }}
            timeslotConfig={timeslotConfig}
            onUpdateTimeslotConfig={async (newConfig) => {
              const res = await updateTimeslotConfig(newConfig);
              if (res) {
                setTimeslotConfig(res);
              }
              return res;
            }}
            onUpdateAttendance={handleUpdateAttendance}
            onBatchUpdateAttendance={handleBatchUpdateAttendance}
            onUpdateProjectTitle={handleUpdateProjectTitle}
          />
        )}
      </main>

      {/* Confirmation Pass Modal */}
      {confirmedBooking && (
        <ConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
          onRetractBooking={handleCancelBooking}
        />
      )}

      {/* Student Retract / Lookup Modal */}
      <StudentRetractModal
        isOpen={showRetractModal}
        onClose={() => setShowRetractModal(false)}
        bookings={bookings}
        onRetract={handleCancelBooking}
      />

      {/* Instructor Auth Modal */}
      <AdminAuthModal
        isOpen={showAdminAuth}
        onClose={() => setShowAdminAuth(false)}
        onUnlock={(instructorEmail) => {
          const session = { role: 'instructor', email: instructorEmail };
          saveSession(session);
          setCurrentUser(session);
          setIsAdminUnlocked(true);
          setCurrentTab('admin');
        }}
      />

      {/* Firebase Cloud Config Modal */}
      <FirebaseModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onConfigSaved={(isActive) => setIsFirebaseActive(isActive)}
      />

      {/* Enterprise Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-disabled)',
        background: 'var(--bg-surface)'
      }}>
        OJT Schedpoint • Strict 1-Reservation Policy • Instant Slot Collision Prevention
      </footer>
    </div>
  );
}
