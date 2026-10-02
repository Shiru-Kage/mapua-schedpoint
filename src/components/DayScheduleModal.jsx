import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Sun, 
  Sunset, 
  Plus, 
  Minus,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { getFormattedDateLabel, getAllSlotsForDate } from '../utils/slotGenerator';

export default function DayScheduleModal({
  isOpen,
  onClose,
  date,
  allowedDates = [],
  timeslotConfig,
  onSaveDayConfig,
  onResetDayConfig
}) {
  const [activeDate, setActiveDate] = useState(date || (allowedDates && allowedDates[0]) || '');
  const [morningStart, setMorningStart] = useState('08:00');
  const [morningEnd, setMorningEnd] = useState('11:00');
  const [afternoonStart, setAfternoonStart] = useState('13:00');
  const [afternoonEnd, setAfternoonEnd] = useState('16:00');
  const [slotDuration, setSlotDuration] = useState(10);
  const [enableMorning, setEnableMorning] = useState(true);
  const [enableAfternoon, setEnableAfternoon] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever activeDate or timeslotConfig changes
  useEffect(() => {
    if (date && date !== activeDate) {
      setActiveDate(date);
    }
  }, [date]);

  useEffect(() => {
    if (!activeDate) return;
    const dateOverride = timeslotConfig?.dateSessionOverrides?.[activeDate];

    if (dateOverride) {
      setMorningStart(dateOverride.morningStart || timeslotConfig?.morningStart || '08:00');
      setMorningEnd(dateOverride.morningEnd || timeslotConfig?.morningEnd || '11:00');
      setAfternoonStart(dateOverride.afternoonStart || timeslotConfig?.afternoonStart || '13:00');
      setAfternoonEnd(dateOverride.afternoonEnd || timeslotConfig?.afternoonEnd || '16:00');
      setSlotDuration(dateOverride.slotDurationMinutes || timeslotConfig?.slotDurationMinutes || 10);
      setEnableMorning(dateOverride.morning !== undefined ? Boolean(dateOverride.morning) : (timeslotConfig?.enableMorning !== false));
      setEnableAfternoon(dateOverride.afternoon !== undefined ? Boolean(dateOverride.afternoon) : (timeslotConfig?.enableAfternoon !== false));
    } else {
      // Fallback to global defaults
      setMorningStart(timeslotConfig?.morningStart || '08:00');
      setMorningEnd(timeslotConfig?.morningEnd || '11:00');
      setAfternoonStart(timeslotConfig?.afternoonStart || '13:00');
      setAfternoonEnd(timeslotConfig?.afternoonEnd || '16:00');
      setSlotDuration(timeslotConfig?.slotDurationMinutes || 10);
      setEnableMorning(timeslotConfig?.enableMorning !== false);
      setEnableAfternoon(timeslotConfig?.enableAfternoon !== false);
    }
  }, [activeDate, timeslotConfig]);

  const isCurrentDateCustomized = useMemo(() => {
    if (!activeDate) return false;
    const override = timeslotConfig?.dateSessionOverrides?.[activeDate];
    return Boolean(
      override && (
        override.isCustom ||
        override.morningStart ||
        override.morningEnd ||
        override.afternoonStart ||
        override.afternoonEnd ||
        override.slotDurationMinutes ||
        override.morning !== undefined ||
        override.afternoon !== undefined
      )
    );
  }, [activeDate, timeslotConfig]);

  // Live preview of generated slots for this day with current inputs
  const previewSlots = useMemo(() => {
    if (!activeDate) return { totalSlots: 0, morning: [], afternoon: [] };
    const tempConfig = {
      ...timeslotConfig,
      dateSessionOverrides: {
        ...(timeslotConfig?.dateSessionOverrides || {}),
        [activeDate]: {
          isCustom: true,
          morning: enableMorning,
          afternoon: enableAfternoon,
          morningStart,
          morningEnd,
          afternoonStart,
          afternoonEnd,
          slotDurationMinutes: Number(slotDuration) || 10
        }
      }
    };
    return getAllSlotsForDate(activeDate, tempConfig);
  }, [activeDate, timeslotConfig, enableMorning, enableAfternoon, morningStart, morningEnd, afternoonStart, afternoonEnd, slotDuration]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!enableMorning && !enableAfternoon) {
      alert('At least one session (Morning or Afternoon) must remain active for this day.');
      return;
    }

    setIsSaving(true);
    try {
      const dayConfig = {
        isCustom: true,
        morning: enableMorning,
        afternoon: enableAfternoon,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        slotDurationMinutes: Math.max(1, Math.min(120, Number(slotDuration) || 10))
      };

      if (onSaveDayConfig) {
        await onSaveDayConfig(activeDate, dayConfig);
      }
      setFeedback(`✓ Saved custom configuration for ${getFormattedDateLabel(activeDate)}.`);
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      console.error(err);
      setFeedback('Error saving day schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToGlobal = async () => {
    const confirmReset = window.confirm(
      `Reset schedule configuration for ${getFormattedDateLabel(activeDate)} back to Global Defaults?`
    );
    if (!confirmReset) return;

    setIsSaving(true);
    try {
      if (onResetDayConfig) {
        await onResetDayConfig(activeDate);
      }
      setFeedback(`✓ Reset ${getFormattedDateLabel(activeDate)} to Global Defaults.`);
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="academic-card modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--mapua-crimson)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Day Defense Schedule Configuration
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Set custom presentation hours and slot intervals for specific dates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Date Selector Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Configuring Date
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {getFormattedDateLabel(activeDate)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {activeDate}
              </div>
            </div>

            {/* Quick Date Switcher (if multiple dates exist) */}
            {allowedDates.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Switch Date:
                </span>
                <select
                  value={activeDate}
                  onChange={(e) => setActiveDate(e.target.value)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  {allowedDates.map(dStr => (
                    <option key={dStr} value={dStr}>
                      {getFormattedDateLabel(dStr)} ({dStr})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            background: isCurrentDateCustomized ? 'var(--status-selected-subtle)' : 'var(--bg-surface)',
            border: isCurrentDateCustomized ? '1px solid var(--status-selected-border)' : '1px dashed var(--border-medium)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color={isCurrentDateCustomized ? 'var(--mapua-crimson)' : 'var(--text-secondary)'} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Status: {isCurrentDateCustomized ? 'Custom Day Schedule Active' : 'Inheriting Global Defaults'}
              </span>
            </div>
            {isCurrentDateCustomized && (
              <button
                type="button"
                onClick={handleResetToGlobal}
                disabled={isSaving}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                title="Remove overrides and revert to global configuration"
              >
                <RotateCcw size={12} />
                <span>Reset to Global</span>
              </button>
            )}
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div style={{
              fontSize: '0.8rem',
              color: '#166534',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} color="#166534" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Hours & Duration Form */}
          <form onSubmit={handleSave}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginBottom: '16px'
            }}>
              {/* Morning Session Hours */}
              <div style={{
                background: enableMorning ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                border: enableMorning ? '1px solid var(--border-medium)' : '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                opacity: enableMorning ? 1 : 0.65,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: enableMorning ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <Sun size={15} color={enableMorning ? 'var(--mapua-crimson)' : 'var(--text-muted)'} />
                    <span>Morning Session</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: enableMorning ? 'var(--mapua-crimson)' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={enableMorning}
                      onChange={(e) => {
                        if (!e.target.checked && !enableAfternoon) {
                          alert('At least one session must remain active.');
                          return;
                        }
                        setEnableMorning(e.target.checked);
                      }}
                      style={{ accentColor: 'var(--mapua-crimson)', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>{enableMorning ? 'Active' : 'Disabled'}</span>
                  </label>
                </div>
                {!enableMorning && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                    Morning session removed for this day.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                      disabled={!enableMorning}
                      required={enableMorning}
                      style={{
                        width: '100%',
                        background: enableMorning ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        color: enableMorning ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: enableMorning ? 'text' : 'not-allowed'
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
                      disabled={!enableMorning}
                      required={enableMorning}
                      style={{
                        width: '100%',
                        background: enableMorning ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        color: enableMorning ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: enableMorning ? 'text' : 'not-allowed'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Afternoon Session Hours */}
              <div style={{
                background: enableAfternoon ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                border: enableAfternoon ? '1px solid var(--border-medium)' : '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                opacity: enableAfternoon ? 1 : 0.65,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: enableAfternoon ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <Sunset size={15} color={enableAfternoon ? 'var(--mapua-crimson)' : 'var(--text-muted)'} />
                    <span>Afternoon Session</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: enableAfternoon ? 'var(--mapua-crimson)' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={enableAfternoon}
                      onChange={(e) => {
                        if (!e.target.checked && !enableMorning) {
                          alert('At least one session must remain active.');
                          return;
                        }
                        setEnableAfternoon(e.target.checked);
                      }}
                      style={{ accentColor: 'var(--mapua-crimson)', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>{enableAfternoon ? 'Active' : 'Disabled'}</span>
                  </label>
                </div>
                {!enableAfternoon && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                    Afternoon session removed for this day.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={afternoonStart}
                      onChange={(e) => setAfternoonStart(e.target.value)}
                      disabled={!enableAfternoon}
                      required={enableAfternoon}
                      style={{
                        width: '100%',
                        background: enableAfternoon ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        color: enableAfternoon ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: enableAfternoon ? 'text' : 'not-allowed'
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
                      disabled={!enableAfternoon}
                      required={enableAfternoon}
                      style={{
                        width: '100%',
                        background: enableAfternoon ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        color: enableAfternoon ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: enableAfternoon ? 'text' : 'not-allowed'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Slot Duration / Interval */}
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                gridColumn: '1 / -1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <Clock size={15} color="var(--mapua-crimson)" />
                    <span>Presentation Slot Interval for this Day</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--mapua-crimson)', fontFamily: 'var(--font-mono)' }}>
                    {slotDuration} mins / slot
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSlotDuration(prev => Math.max(5, Number(prev) - 5))}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px' }}
                    title="Decrease by 5 mins"
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
                    title="Increase by 5 mins"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Preset Pills */}
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
              </div>
            </div>

            {/* Slot Preview Calculation */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                Calculated for this date: <strong>{previewSlots?.totalSlots || 0} slots total</strong>
                {' '}(
                {enableMorning ? `${previewSlots?.morning?.length || 0} Morning` : 'Morning Disabled'}
                {' + '}
                {enableAfternoon ? `${previewSlots?.afternoon?.length || 0} Afternoon` : 'Afternoon Disabled'}
                )
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--mapua-crimson)' }}>
                {slotDuration} mins / slot
              </span>
            </div>

            {/* Bottom Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-light)'
            }}>
              <div>
                {isCurrentDateCustomized && (
                  <button
                    type="button"
                    onClick={handleResetToGlobal}
                    disabled={isSaving}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '7px 12px', gap: '6px' }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Day to Global</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '8px 16px', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Day Configuration'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
