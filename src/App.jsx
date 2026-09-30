import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import CalendarView from './components/CalendarView';
import BookingForm from './components/BookingForm';
import ConfirmationModal from './components/ConfirmationModal';
import StudentRetractModal from './components/StudentRetractModal';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthModal from './components/AdminAuthModal';
import FirebaseModal from './components/FirebaseModal';
import { getAllSlotsForDate } from './utils/slotGenerator';
import { 
  fetchAllBookings, 
  submitBooking, 
  cancelBooking, 
  subscribeToBookings 
} from './services/bookingStorage';
import { getFirebaseDb } from './services/firebase';
import { sendRetractionEmail } from './services/emailService';

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

  const [date, setDate] = useState(getTodayString());
  const [sessionFilter, setSessionFilter] = useState('morning');
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

  // Compute 42 slots (24 morning + 18 afternoon)
  const slotsData = useMemo(() => {
    return getAllSlotsForDate(date);
  }, [date]);

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
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedSlot]);

  // Student booking submission handler
  const handleBookingSubmit = async (formData) => {
    if (!selectedSlot) return;

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
      />

      {/* Main Container */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 20px 48px 20px',
        width: '100%',
        flex: 1
      }}>
        {currentTab === 'booking' ? (
          <div>
            {/* Academic Page Header */}
            <div style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '12px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0'
                }}>
                  Academic Consultation & Presentation Scheduling
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  margin: 0
                }}>
                  10-minute individual time slots across Morning (<strong>7:00 – 11:00 AM</strong>) and Afternoon (<strong>1:00 – 4:00 PM</strong>) sessions. Slots are locked upon confirmation.
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

            {/* Split layout: Calendar View (Left) & Form (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
              alignItems: 'start'
            }}>
              <div style={{ flex: '1 1 60%' }}>
                <CalendarView
                  date={date}
                  setDate={setDate}
                  slotsData={slotsData}
                  selectedSlot={selectedSlot}
                  setSelectedSlot={setSelectedSlot}
                  bookings={bookings}
                  sessionFilter={sessionFilter}
                  setSessionFilter={setSessionFilter}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              </div>

              <div style={{ flex: '1 1 40%', position: 'sticky', top: '76px' }}>
                <BookingForm
                  selectedSlot={selectedSlot}
                  onSubmit={handleBookingSubmit}
                  isSubmitting={isSubmitting}
                  errorMessage={errorMessage}
                  clearError={() => setErrorMessage('')}
                  bookings={bookings}
                  date={date}
                  onOpenRetractModal={() => setShowRetractModal(true)}
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
            isCancelling={isCancelling}
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

      {/* Instructor PIN Auth Modal */}
      <AdminAuthModal
        isOpen={showAdminAuth}
        onClose={() => setShowAdminAuth(false)}
        onUnlock={() => {
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
        Mapúa University Consultation System • Strict 1-Reservation Policy • Instant Slot Collision Prevention
      </footer>
    </div>
  );
}
