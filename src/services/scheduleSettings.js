// Service for managing instructor-controlled allowed OJT scheduling dates
import { getFirebaseDb, doc, setDoc, onSnapshot, getDoc } from './firebase';

export const DEFAULT_ALLOWED_DATES = [
  '2026-10-05', // Monday, Oct 5, 2026
  '2026-10-07', // Wednesday, Oct 7, 2026
  '2026-10-12', // Monday, Oct 12, 2026
  '2026-10-14'  // Wednesday, Oct 14, 2026
];

const STORAGE_KEY = 'ojt_allowed_dates';

export function getLocalAllowedDates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort();
      }
    }
  } catch (e) {
    console.error('Error reading allowed dates from localStorage:', e);
  }
  return [...DEFAULT_ALLOWED_DATES];
}

export function saveLocalAllowedDates(dates) {
  try {
    const sorted = Array.from(new Set(dates)).filter(Boolean).sort();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    return sorted;
  } catch (e) {
    console.error('Error saving allowed dates:', e);
    return dates;
  }
}

export async function fetchAllowedDates() {
  const db = getFirebaseDb();
  if (db) {
    try {
      const configRef = doc(db, 'settings', 'schedule_dates');
      const snap = await getDoc(configRef);
      if (snap.exists() && Array.isArray(snap.data()?.allowedDates) && snap.data().allowedDates.length > 0) {
        const remoteDates = snap.data().allowedDates.sort();
        saveLocalAllowedDates(remoteDates);
        return remoteDates;
      }
    } catch (err) {
      console.warn('Could not fetch remote allowed dates from Firestore:', err);
    }
  }
  return getLocalAllowedDates();
}

export async function updateAllowedDates(dates) {
  const sorted = saveLocalAllowedDates(dates);
  const db = getFirebaseDb();
  if (db) {
    try {
      const configRef = doc(db, 'settings', 'schedule_dates');
      await setDoc(configRef, {
        allowedDates: sorted,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to update allowed dates in Firestore:', err);
    }
  }
  // Dispatch local window event so all open tabs update in real-time
  window.dispatchEvent(new CustomEvent('ojt_allowed_dates_updated', { detail: sorted }));
  return sorted;
}

export function subscribeToAllowedDates(callback) {
  const db = getFirebaseDb();
  let unsubFirestore = null;

  if (db) {
    try {
      const configRef = doc(db, 'settings', 'schedule_dates');
      unsubFirestore = onSnapshot(configRef, (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.allowedDates) && snap.data().allowedDates.length > 0) {
          const dates = snap.data().allowedDates.sort();
          saveLocalAllowedDates(dates);
          callback(dates);
        }
      }, (err) => {
        console.warn('Firestore allowed dates listener error:', err);
      });
    } catch (e) {
      console.warn('Error subscribing to allowed dates:', e);
    }
  }

  const handleCustomEvent = (e) => {
    if (Array.isArray(e.detail)) {
      callback(e.detail);
    }
  };
  window.addEventListener('ojt_allowed_dates_updated', handleCustomEvent);

  return () => {
    if (unsubFirestore) unsubFirestore();
    window.removeEventListener('ojt_allowed_dates_updated', handleCustomEvent);
  };
}

// -------------------------------------------------------------
// Timeslot Interval & Hours Configuration (Default: 8-11 AM, 1-4 PM, 10 min)
// -------------------------------------------------------------
export const DEFAULT_TIMESLOT_CONFIG = {
  morningStart: '08:00',
  morningEnd: '11:00',
  afternoonStart: '13:00',
  afternoonEnd: '16:00',
  slotDurationMinutes: 10,
  enableMorning: true,
  enableAfternoon: true,
  dateSessionOverrides: {},
};

const TIMESLOT_STORAGE_KEY = 'ojt_timeslot_config';

export function getLocalTimeslotConfig() {
  try {
    const raw = localStorage.getItem(TIMESLOT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_TIMESLOT_CONFIG,
          ...parsed,
          slotDurationMinutes: Math.max(1, Math.min(120, Number(parsed.slotDurationMinutes) || 10)),
          enableMorning: parsed.enableMorning !== false,
          enableAfternoon: parsed.enableAfternoon !== false,
          dateSessionOverrides: parsed.dateSessionOverrides || {},
        };
      }
    }
  } catch (e) {
    console.error('Error reading timeslot config from localStorage:', e);
  }
  return { ...DEFAULT_TIMESLOT_CONFIG };
}

export function saveLocalTimeslotConfig(config) {
  try {
    const validated = {
      morningStart: config.morningStart || DEFAULT_TIMESLOT_CONFIG.morningStart,
      morningEnd: config.morningEnd || DEFAULT_TIMESLOT_CONFIG.morningEnd,
      afternoonStart: config.afternoonStart || DEFAULT_TIMESLOT_CONFIG.afternoonStart,
      afternoonEnd: config.afternoonEnd || DEFAULT_TIMESLOT_CONFIG.afternoonEnd,
      slotDurationMinutes: Math.max(1, Math.min(120, Number(config.slotDurationMinutes) || 10)),
      enableMorning: config.enableMorning !== false,
      enableAfternoon: config.enableAfternoon !== false,
      dateSessionOverrides: config.dateSessionOverrides || {},
    };
    localStorage.setItem(TIMESLOT_STORAGE_KEY, JSON.stringify(validated));
    return validated;
  } catch (e) {
    console.error('Error saving timeslot config:', e);
    return config;
  }
}

export async function fetchTimeslotConfig() {
  const db = getFirebaseDb();
  if (db) {
    try {
      const configRef = doc(db, 'settings', 'timeslot_config');
      const snap = await getDoc(configRef);
      if (snap.exists() && snap.data()?.slotDurationMinutes) {
        const remote = snap.data();
        const saved = saveLocalTimeslotConfig(remote);
        return saved;
      }
    } catch (err) {
      console.warn('Could not fetch remote timeslot config from Firestore:', err);
    }
  }
  return getLocalTimeslotConfig();
}

export async function updateTimeslotConfig(config) {
  const saved = saveLocalTimeslotConfig(config);
  const db = getFirebaseDb();
  if (db) {
    try {
      const configRef = doc(db, 'settings', 'timeslot_config');
      await setDoc(configRef, {
        ...saved,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to update timeslot config in Firestore:', err);
    }
  }
  // Dispatch local window event so all open tabs update in real-time
  window.dispatchEvent(new CustomEvent('ojt_timeslot_config_updated', { detail: saved }));
  return saved;
}

export function subscribeToTimeslotConfig(callback) {
  const db = getFirebaseDb();
  let unsubFirestore = null;

  if (db) {
    try {
      const configRef = doc(db, 'settings', 'timeslot_config');
      unsubFirestore = onSnapshot(configRef, (snap) => {
        if (snap.exists() && snap.data()?.slotDurationMinutes) {
          const config = saveLocalTimeslotConfig(snap.data());
          callback(config);
        }
      }, (err) => {
        console.warn('Firestore timeslot config listener error:', err);
      });
    } catch (e) {
      console.warn('Error subscribing to timeslot config:', e);
    }
  }

  const handleCustomEvent = (e) => {
    if (e.detail && typeof e.detail === 'object') {
      callback(e.detail);
    }
  };
  window.addEventListener('ojt_timeslot_config_updated', handleCustomEvent);

  return () => {
    if (unsubFirestore) unsubFirestore();
    window.removeEventListener('ojt_timeslot_config_updated', handleCustomEvent);
  };
}

