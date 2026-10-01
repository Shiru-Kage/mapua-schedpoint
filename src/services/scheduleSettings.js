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
