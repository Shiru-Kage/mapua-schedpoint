// Utility to generate accurate customizable slots for Morning (default 8-11 AM) and Afternoon (default 1-4 PM)

export const DEFAULT_TIMESLOT_CONFIG = {
  morningStart: '08:00',
  morningEnd: '11:00',
  afternoonStart: '13:00',
  afternoonEnd: '16:00',
  slotDurationMinutes: 10,
  enableMorning: true,
  enableAfternoon: true,
};

export function parseTimeString(timeStr, defaultHour = 8, defaultMinute = 0) {
  if (!timeStr || typeof timeStr !== 'string') return { hour: defaultHour, minute: defaultMinute };
  const parts = timeStr.split(':').map(Number);
  const hour = isNaN(parts[0]) ? defaultHour : Math.max(0, Math.min(23, parts[0]));
  const minute = isNaN(parts[1]) ? defaultMinute : Math.max(0, Math.min(59, parts[1]));
  return { hour, minute };
}

export function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : minute;
  return `${displayHour}:${displayMinute} ${period}`;
}

export function formatTimeShort(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${minute < 10 ? '0' : ''}${minute} ${period}`;
}

function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

export function buildSessionConfig(sessionType, startStr, endStr, slotMinutes = 10) {
  const isMorning = sessionType === 'morning';
  const defStart = isMorning ? { hour: 8, minute: 0 } : { hour: 13, minute: 0 };
  const defEnd = isMorning ? { hour: 11, minute: 0 } : { hour: 16, minute: 0 };

  const parsedStart = parseTimeString(startStr, defStart.hour, defStart.minute);
  const parsedEnd = parseTimeString(endStr, defEnd.hour, defEnd.minute);

  const startFormatted = formatTime(parsedStart.hour, parsedStart.minute);
  const endFormatted = formatTime(parsedEnd.hour, parsedEnd.minute);

  const startShort = formatTimeShort(parsedStart.hour, parsedStart.minute);
  const endShort = formatTimeShort(parsedEnd.hour, parsedEnd.minute);

  return {
    startHour: parsedStart.hour,
    startMinute: parsedStart.minute,
    endHour: parsedEnd.hour,
    endMinute: parsedEnd.minute,
    session: sessionType,
    title: isMorning ? 'Morning Session' : 'Afternoon Session',
    timeRange: `${startFormatted} – ${endFormatted}`,
    shortLabel: `${startShort} – ${endShort}`,
    slotMinutes: Math.max(1, Math.min(120, Number(slotMinutes) || 10)),
  };
}

// Pre-computed default sessions (8-11 AM and 1-4 PM, 10 min)
export const MORNING_CONFIG = buildSessionConfig('morning', '08:00', '11:00', 10);
export const AFTERNOON_CONFIG = buildSessionConfig('afternoon', '13:00', '16:00', 10);

export function generateSlotsForSession(config, dateString) {
  const slots = [];
  let currentMinutes = config.startHour * 60 + config.startMinute;
  const endMinutes = config.endHour * 60 + config.endMinute;

  while (currentMinutes < endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    
    const nextMinutes = currentMinutes + config.slotMinutes;
    // Don't create slots that extend past session end
    if (nextMinutes > endMinutes && slots.length > 0) {
      break;
    }

    const slotEndHour = Math.floor(nextMinutes / 60);
    const slotEndMin = nextMinutes % 60;

    const startTimeFormatted = formatTime(slotStartHour, slotStartMin);
    const endTimeFormatted = formatTime(slotEndHour, slotEndMin);
    const timeDisplay = `${startTimeFormatted} – ${endTimeFormatted}`;
    
    // e.g. "2026-10-01_0800"
    const slotKey = `${dateString}_${pad(slotStartHour)}${pad(slotStartMin)}`;

    slots.push({
      id: slotKey,
      date: dateString,
      startHour: slotStartHour,
      startMinute: slotStartMin,
      endHour: slotEndHour,
      endMinute: slotEndMin,
      startTimeDisplay: startTimeFormatted,
      endTimeDisplay: endTimeFormatted,
      timeDisplay,
      session: config.session,
      sessionTitle: config.title,
    });

    currentMinutes = nextMinutes;
  }

  return slots;
}

export function getAllSlotsForDate(dateString, customConfig = null) {
  const config = customConfig || DEFAULT_TIMESLOT_CONFIG;
  const isMorningEnabled = config.enableMorning !== false;
  const isAfternoonEnabled = config.enableAfternoon !== false;

  const morningConfig = buildSessionConfig(
    'morning',
    config.morningStart || '08:00',
    config.morningEnd || '11:00',
    config.slotDurationMinutes || 10
  );
  const afternoonConfig = buildSessionConfig(
    'afternoon',
    config.afternoonStart || '13:00',
    config.afternoonEnd || '16:00',
    config.slotDurationMinutes || 10
  );

  const morning = isMorningEnabled ? generateSlotsForSession(morningConfig, dateString) : [];
  const afternoon = isAfternoonEnabled ? generateSlotsForSession(afternoonConfig, dateString) : [];

  return {
    morning,
    afternoon,
    all: [...morning, ...afternoon],
    totalSlots: morning.length + afternoon.length,
    slotMinutes: morningConfig.slotMinutes,
    morningRange: morningConfig.timeRange,
    afternoonRange: afternoonConfig.timeRange,
    morningLabel: morningConfig.shortLabel,
    afternoonLabel: afternoonConfig.shortLabel,
    enableMorning: isMorningEnabled,
    enableAfternoon: isAfternoonEnabled,
  };
}

export function getFormattedDateLabel(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
