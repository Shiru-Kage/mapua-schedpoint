// Utility to generate accurate 10-minute slots for Morning (7-11 AM) and Afternoon (1-4 PM)

export const MORNING_CONFIG = {
  startHour: 7,
  startMinute: 0,
  endHour: 11,
  endMinute: 0,
  session: 'morning',
  title: 'Morning Session',
  timeRange: '7:00 AM – 11:00 AM',
  slotMinutes: 10,
};

export const AFTERNOON_CONFIG = {
  startHour: 13, // 1:00 PM
  startMinute: 0,
  endHour: 16, // 4:00 PM
  endMinute: 0,
  session: 'afternoon',
  title: 'Afternoon Session',
  timeRange: '1:00 PM – 4:00 PM',
  slotMinutes: 10,
};

function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : minute;
  return `${displayHour}:${displayMinute} ${period}`;
}

function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

export function generateSlotsForSession(config, dateString) {
  const slots = [];
  let currentMinutes = config.startHour * 60 + config.startMinute;
  const endMinutes = config.endHour * 60 + config.endMinute;

  while (currentMinutes < endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    
    const nextMinutes = currentMinutes + config.slotMinutes;
    const slotEndHour = Math.floor(nextMinutes / 60);
    const slotEndMin = nextMinutes % 60;

    const startTimeFormatted = formatTime(slotStartHour, slotStartMin);
    const endTimeFormatted = formatTime(slotEndHour, slotEndMin);
    const timeDisplay = `${startTimeFormatted} – ${endTimeFormatted}`;
    
    // e.g. "2026-10-01_0700"
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

export function getAllSlotsForDate(dateString) {
  const morning = generateSlotsForSession(MORNING_CONFIG, dateString);
  const afternoon = generateSlotsForSession(AFTERNOON_CONFIG, dateString);
  return {
    morning,
    afternoon,
    all: [...morning, ...afternoon],
    totalSlots: morning.length + afternoon.length, // 24 + 18 = 42
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
