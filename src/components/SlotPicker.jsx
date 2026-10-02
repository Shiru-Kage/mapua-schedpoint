import React from 'react';
import { Sun, Sunset, Clock, CheckCircle2, Lock, CalendarDays } from 'lucide-react';
import { getFormattedDateLabel } from '../utils/slotGenerator';

export default function SlotPicker({
  date,
  setDate,
  slotsData,
  selectedSlot,
  setSelectedSlot,
  bookings,
  sessionFilter,
  setSessionFilter
}) {
  // Map bookings to a set of booked slot IDs
  const bookedSlotIds = new Set(bookings.map(b => b.slotId));

  // Filter slots based on active session tab
  const isMorningEnabled = slotsData?.enableMorning !== false;
  const isAfternoonEnabled = slotsData?.enableAfternoon !== false;
  const morningSlots = slotsData?.morning || [];
  const afternoonSlots = slotsData?.afternoon || [];
  const allSlots = slotsData?.all || [];

  let displayedSlots = allSlots;
  if (sessionFilter === 'morning' && isMorningEnabled) {
    displayedSlots = morningSlots;
  } else if (sessionFilter === 'afternoon' && isAfternoonEnabled) {
    displayedSlots = afternoonSlots;
  }

  // Count stats
  const totalSlotsCount = displayedSlots.length;
  const bookedCount = displayedSlots.filter(s => bookedSlotIds.has(s.id)).length;
  const availableCount = totalSlotsCount - bookedCount;

  // Session stats for tabs
  const morningBooked = morningSlots.filter(s => bookedSlotIds.has(s.id)).length;
  const morningAvailable = morningSlots.length - morningBooked;

  const afternoonBooked = afternoonSlots.filter(s => bookedSlotIds.has(s.id)).length;
  const afternoonAvailable = afternoonSlots.length - afternoonBooked;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Date Header & Quick Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CalendarDays size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Select OJT Defense Schedule
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {getFormattedDateLabel(date)} • {slotsData?.slotMinutes || 10}-Minute Defense Presentation Slots
          </p>
        </div>

        {/* Date Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null); // clear selection on date change
            }}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              padding: '8px 12px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Session Navigation Tabs (Morning 7-11 AM vs Afternoon 1-4 PM) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {/* Morning Tab */}
        {isMorningEnabled && (
          <button
            onClick={() => setSessionFilter('morning')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: sessionFilter === 'morning' 
                ? 'rgba(99, 102, 241, 0.2)' 
                : 'rgba(15, 23, 42, 0.6)',
              border: sessionFilter === 'morning' 
                ? '1.5px solid var(--accent-primary)' 
                : '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sun size={17} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Morning</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{slotsData?.morningRange || '8:00 AM – 11:00 AM'}</div>
              </div>
            </div>
            <span className={`badge ${morningAvailable > 0 ? 'badge-available' : 'badge-booked'}`}>
              {morningAvailable} / {morningSlots.length} Open
            </span>
          </button>
        )}

        {/* Afternoon Tab */}
        {isAfternoonEnabled && (
          <button
            onClick={() => setSessionFilter('afternoon')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: sessionFilter === 'afternoon' 
                ? 'rgba(99, 102, 241, 0.2)' 
                : 'rgba(15, 23, 42, 0.6)',
              border: sessionFilter === 'afternoon' 
                ? '1.5px solid var(--accent-primary)' 
                : '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sunset size={17} color="#f87171" />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Afternoon</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{slotsData?.afternoonRange || '1:00 PM – 4:00 PM'}</div>
              </div>
            </div>
            <span className={`badge ${afternoonAvailable > 0 ? 'badge-available' : 'badge-booked'}`}>
              {afternoonAvailable} / {afternoonSlots.length} Open
            </span>
          </button>
        )}

        {/* All Sessions Tab */}
        <button
          onClick={() => setSessionFilter('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: sessionFilter === 'all' 
              ? 'rgba(99, 102, 241, 0.2)' 
              : 'rgba(15, 23, 42, 0.6)',
            border: sessionFilter === 'all' 
              ? '1.5px solid var(--accent-primary)' 
              : '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={17} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>All Sessions</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Full Day ({slotsData?.totalSlots || 0} Slots)</div>
            </div>
          </div>
          <span className="badge badge-selected">
            {morningAvailable + afternoonAvailable} / {slotsData?.totalSlots || 0} Open
          </span>
        </button>
      </div>

      {/* Visual Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }}></span>
          <span>Available ({availableCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-primary)' }}></span>
          <span>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#64748b' }}></span>
          <span>Booked / Taken ({bookedCount})</span>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="slots-grid">
        {displayedSlots.map((slot) => {
          const isBooked = bookedSlotIds.has(slot.id);
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
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  10 Minutes Duration
                </div>
              </div>

              <div className="slot-status-row" style={{ marginTop: '10px' }}>
                {isBooked ? (
                  <span className="badge badge-booked" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    <Lock size={11} /> Taken
                  </span>
                ) : isSelected ? (
                  <span className="badge badge-selected" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    <CheckCircle2 size={11} /> Selected
                  </span>
                ) : (
                  <span className="badge badge-available" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    Open
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
