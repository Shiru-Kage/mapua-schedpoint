import React, { useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Sun, 
  Sunset, 
  Grid, 
  List,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarView({
  date,
  setDate,
  slotsData,
  selectedSlot,
  setSelectedSlot,
  bookings,
  sessionFilter,
  setSessionFilter,
  viewMode, // 'grid' | 'timeline'
  setViewMode,
  allowedDates = []
}) {
  const bookedSlotMap = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      map.set(b.slotId, b);
    });
    return map;
  }, [bookings]);

  const isDateAllowed = useMemo(() => {
    if (!allowedDates || allowedDates.length === 0) return true;
    return allowedDates.includes(date);
  }, [allowedDates, date]);

  // Generate date strip based on instructor-designated allowed dates!
  const dateStrip = useMemo(() => {
    // If allowedDates is provided, map directly over allowedDates
    const targetDates = (Array.isArray(allowedDates) && allowedDates.length > 0)
      ? allowedDates
      : [date];

    return targetDates.map(dateStr => {
      try {
        const parts = dateStr.split('-').map(Number);
        const target = new Date(parts[0], parts[1] - 1, parts[2]);

        const dayName = target.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = target.getDate();
        const monthName = target.toLocaleDateString('en-US', { month: 'short' });

        const dayBookedCount = bookings.filter(b => b.date === dateStr).length;
        const dayOpenCount = Math.max(0, 42 - dayBookedCount);

        return {
          dateStr,
          dayName,
          dayNum,
          monthName,
          dayBookedCount,
          dayOpenCount,
          isSelected: dateStr === date,
        };
      } catch {
        return {
          dateStr,
          dayName: 'Date',
          dayNum: dateStr,
          monthName: '',
          dayBookedCount: 0,
          dayOpenCount: 42,
          isSelected: dateStr === date,
        };
      }
    });
  }, [allowedDates, date, bookings]);

  // Step active date to previous or next allowed date
  const shiftDateByStep = (direction) => {
    if (allowedDates && allowedDates.length > 0) {
      const currentIndex = allowedDates.indexOf(date);
      if (currentIndex === -1) {
        setDate(allowedDates[0]);
        setSelectedSlot(null);
        return;
      }
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < allowedDates.length) {
        setDate(allowedDates[nextIndex]);
        setSelectedSlot(null);
      }
      return;
    }

    const [y, m, d] = date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + direction);
    const nextDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    setDate(nextDate);
    setSelectedSlot(null);
  };

  let displayedSlots = slotsData.all;
  if (sessionFilter === 'morning') {
    displayedSlots = slotsData.morning;
  } else if (sessionFilter === 'afternoon') {
    displayedSlots = slotsData.afternoon;
  }

  const bookedCount = displayedSlots.filter(s => bookedSlotMap.has(s.id)).length;
  const availableCount = displayedSlots.length - bookedCount;

  return (
    <div className="academic-card" style={{ padding: '24px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} color="var(--mapua-crimson)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              OJT Consultation Schedule
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {getFormattedDateLabel(date)} • 10-Minute OJT Windows
          </p>
        </div>

        {/* View Mode Toggle: Timeline vs Grid */}
        <div className="segmented-control">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`segmented-control-item ${viewMode === 'timeline' ? 'active' : ''}`}
          >
            <List size={14} />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`segmented-control-item ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <Grid size={14} />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Selector Controls */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Select Date & Schedule View
          </span>

          {/* Quick Date Stepper & Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => shiftDateByStep(-1)}
              className="btn btn-secondary"
              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
              title="Previous Available Date"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                const today = getTodayString();
                const target = (allowedDates && allowedDates.includes(today))
                  ? today
                  : (allowedDates && allowedDates.length > 0 ? allowedDates[0] : today);
                setDate(target);
                setSelectedSlot(null);
              }}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600 }}
              title="Jump to Current Scheduled Date"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => shiftDateByStep(1)}
              className="btn btn-secondary"
              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
              title="Next Available Date"
            >
              <ChevronRight size={14} />
            </button>

            {/* Date Input */}
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                padding: '5px 8px',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* Dynamic 7-Day Date Selector Strip Centered on Active Date */}
        <div className="date-strip-container">
          {dateStrip.map((item) => {
            const isSelected = item.dateStr === date;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  setDate(item.dateStr);
                  setSelectedSlot(null);
                }}
                className={`date-strip-item ${isSelected ? 'active' : ''}`}
                style={{
                  minWidth: '100px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: isSelected ? 0.95 : 0.7 }}>
                  {item.dayName}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0', fontFamily: 'var(--font-mono)' }}>
                  {item.dayNum}
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                  {item.monthName}
                </div>

                <div style={{
                  marginTop: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  background: isSelected 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : (item.dayBookedCount > 0 ? 'var(--mapua-gold-bg)' : 'var(--status-available-bg)'),
                  color: isSelected 
                    ? '#ffffff' 
                    : (item.dayBookedCount > 0 ? 'var(--mapua-gold)' : 'var(--status-available-text)')
                }}>
                  {item.dayBookedCount === 0 ? '42 Open' : `${item.dayBookedCount} Booked`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '10px 12px',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
        border: '1px solid var(--border-light)'
      }}>
        <div className="segmented-control" style={{ flex: '1 1 auto' }}>
          <button
            type="button"
            onClick={() => setSessionFilter('morning')}
            className={`segmented-control-item ${sessionFilter === 'morning' ? 'active' : ''}`}
            title="Morning (7:00 – 11:00 AM)"
          >
            <Sun size={14} />
            <span>Morning (7–11 AM)</span>
          </button>

          <button
            type="button"
            onClick={() => setSessionFilter('afternoon')}
            className={`segmented-control-item ${sessionFilter === 'afternoon' ? 'active' : ''}`}
            title="Afternoon (1:00 – 4:00 PM)"
          >
            <Sunset size={14} />
            <span>Afternoon (1–4 PM)</span>
          </button>

          <button
            type="button"
            onClick={() => setSessionFilter('all')}
            className={`segmented-control-item ${sessionFilter === 'all' ? 'active' : ''}`}
          >
            <span>All</span>
          </button>
        </div>

        {/* High-Contrast Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span className="badge badge-available">
            {availableCount} Available
          </span>
          <span className="badge badge-booked">
            {bookedCount} Reserved
          </span>
        </div>
      </div>

      {/* UNAUTHORIZED DATE STATE OR TIMELINE / GRID VIEWS */}
      {!isDateAllowed ? (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mapua-crimson)'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {getFormattedDateLabel(date)} is Not Open for Scheduling
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
              The instructor has designated specific dates for OJT consultations and presentations. Please select one of the authorized dates below:
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
            {allowedDates.map((dStr) => (
              <button
                key={dStr}
                type="button"
                onClick={() => {
                  setDate(dStr);
                  setSelectedSlot(null);
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '8px 14px',
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-primary)'
                }}
              >
                📅 {getFormattedDateLabel(dStr)}
              </button>
            ))}
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayedSlots.map((slot) => {
            const booking = bookedSlotMap.get(slot.id);
            const isBooked = !!booking;
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => {
                  if (!isBooked) {
                    setSelectedSlot(slot);
                    // Smoothly scroll to booking form on mobile devices
                    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
                      setTimeout(() => {
                        const target = document.getElementById('student-booking-form-section');
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 50);
                    }
                  }
                }}
                className={`timeline-slot-row ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
              >
                {/* Time Display */}
                <div className="timeline-slot-time">
                  <Clock size={15} color={isBooked ? 'var(--text-disabled)' : 'var(--mapua-crimson)'} />
                  <span>{slot.timeDisplay}</span>
                </div>

                {/* Status Column */}
                <div className="timeline-slot-status">
                  {isBooked ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--status-booked-bg)',
                      border: '1px solid var(--status-booked-border)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--status-booked-text)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <Lock size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Reserved by Student ({booking.course || 'Closed'})
                      </span>
                    </div>
                  ) : isSelected ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--status-selected-bg)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                      <span>Selected Schedule (10 Minutes) ✓</span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--status-available-bg)',
                      border: '1px solid var(--status-available-border)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--status-available-text)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', flexShrink: 0 }}></span>
                      <span>Available for Consultation</span>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="timeline-slot-action">
                  {isBooked ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-disabled)' }}>
                      Slot Taken
                    </span>
                  ) : isSelected ? (
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-selected-bg)' }}>
                      Active ✓
                    </span>
                  ) : (
                    <span className="timeline-slot-cta-btn" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--mapua-crimson)' }}>
                      Select →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="slots-grid">
          {displayedSlots.map((slot) => {
            const booking = bookedSlotMap.get(slot.id);
            const isBooked = !!booking;
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isBooked}
                onClick={() => {
                  if (!isBooked) {
                    setSelectedSlot(slot);
                  }
                }}
                className={`slot-card ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
              >
                <div>
                  <div className="slot-time">
                    {slot.timeDisplay}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    10 Minutes Window
                  </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isBooked ? (
                    <span className="badge badge-booked" style={{ fontSize: '0.6875rem' }}>
                      <Lock size={11} /> Taken
                    </span>
                  ) : isSelected ? (
                    <span className="badge badge-selected" style={{ fontSize: '0.6875rem' }}>
                      <CheckCircle2 size={11} /> Selected
                    </span>
                  ) : (
                    <span className="badge badge-available" style={{ fontSize: '0.6875rem' }}>
                      Available
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
