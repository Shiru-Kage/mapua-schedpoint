// Unified booking storage and synchronization layer
import { getFirebaseDb, collection, doc, setDoc, deleteDoc, onSnapshot } from './firebase';

const LOCAL_STORAGE_KEY = 'mapua_student_scheduler_bookings';
const CHANNEL_NAME = 'mapua_scheduler_channel';

// Cross-tab broadcast channel for instantaneous zero-latency multi-tab sync
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

// Get fallback bookings from local storage
function getLocalBookings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read local bookings', e);
    return [];
  }
}

function saveLocalBookings(bookings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'BOOKINGS_UPDATED', bookings });
    }
  } catch (e) {
    console.error('Failed to save local bookings', e);
  }
}

export async function fetchAllBookings() {
  // 1. Check if Firebase is active
  const db = getFirebaseDb();
  if (db) {
    // Handled primarily via real-time subscription
  }

  // 2. Try Backend API
  try {
    const res = await fetch('/api/bookings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveLocalBookings(data);
        return data;
      }
    }
  } catch {
    // API not running or unreachable, fallback to localStorage
  }

  return getLocalBookings();
}

export async function submitBooking(bookingPayload) {
  const { slotId, date, timeDisplay, fullName, studentNumber, course, email } = bookingPayload;
  
  const booking = {
    id: `BKG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    slotId,
    date,
    timeDisplay,
    fullName: fullName.trim(),
    studentNumber: studentNumber.trim(),
    gender: (bookingPayload.gender || '').trim(),
    course: course.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  // 1. Try Firebase Firestore if configured
  const db = getFirebaseDb();
  if (db) {
    try {
      const slotRef = doc(db, 'bookings', slotId);
      await setDoc(slotRef, booking);
      return { success: true, booking };
    } catch (err) {
      console.error('Firebase save error:', err);
      return { success: false, error: 'Failed to save to Firebase: ' + err.message };
    }
  }

  // 2. Try Backend Server API
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { 
        success: false, 
        error: result.error || 'This slot was just claimed by another student. Please select an available slot.' 
      };
    }

    // Refresh local cache & notify tabs
    const current = getLocalBookings();
    const updated = [...current.filter(b => b.slotId !== slotId), booking];
    saveLocalBookings(updated);

    return { success: true, booking: result.booking || booking };
  } catch {
    // Server not running, use local storage atomic check
    const current = getLocalBookings();
    
    // Check slot collision
    const existingSlot = current.find(b => b.slotId === slotId);
    if (existingSlot) {
      return {
        success: false,
        error: `Slot (${timeDisplay}) has already been reserved! Please select a different schedule.`
      };
    }

    // Check duplicate student number
    const cleanStudentNum = String(studentNumber || '').trim().toLowerCase();
    const existingStudent = current.find(b => 
      String(b.studentNumber || '').trim().toLowerCase() === cleanStudentNum && b.date === date
    );
    if (existingStudent) {
      return {
        success: false,
        error: `Duplicate submission: Student Number "${studentNumber}" already has a reserved slot (${existingStudent.timeDisplay}) on this date. You can retract your existing booking to select a new time.`
      };
    }

    const updated = [...current, booking];
    saveLocalBookings(updated);
    return { success: true, booking };
  }
}

export async function cancelBooking(slotId) {
  // 1. Firebase Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'bookings', slotId));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 2. Backend Server API
  try {
    const res = await fetch(`/api/bookings/${slotId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const current = getLocalBookings();
      const updated = current.filter(b => b.slotId !== slotId);
      saveLocalBookings(updated);
      return { success: true };
    }
  } catch {
    // Local fallback
  }

  const current = getLocalBookings();
  const updated = current.filter(b => b.slotId !== slotId);
  saveLocalBookings(updated);
  return { success: true };
}

// Real-time synchronization subscriber
export function subscribeToBookings(onUpdate) {
  let unsubFirebase = null;
  let eventSource = null;

  // 1. Firebase Firestore Listener
  const db = getFirebaseDb();
  if (db) {
    try {
      const colRef = collection(db, 'bookings');
      unsubFirebase = onSnapshot(colRef, (snapshot) => {
        const bookings = [];
        snapshot.forEach((doc) => {
          bookings.push(doc.data());
        });
        saveLocalBookings(bookings);
        onUpdate(bookings);
      }, (err) => {
        console.warn('Firestore subscription error:', err);
      });
      return () => {
        if (unsubFirebase) unsubFirebase();
      };
    } catch (e) {
      console.warn('Could not subscribe to Firestore:', e);
    }
  }

  // 2. Server-Sent Events (SSE) from API
  try {
    eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          saveLocalBookings(data);
          onUpdate(data);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    eventSource.onerror = () => {
      // API or SSE not active, will close and fall back to local events
      eventSource.close();
    };
  } catch {
    // SSE not supported or unavailable
  }

  // 3. LocalStorage & BroadcastChannel listeners
  const handleStorage = (e) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      onUpdate(getLocalBookings());
    }
  };

  const handleBroadcast = (e) => {
    if (e.data && e.data.type === 'BOOKINGS_UPDATED' && Array.isArray(e.data.bookings)) {
      onUpdate(e.data.bookings);
    }
  };

  window.addEventListener('storage', handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // Return cleanup function
  return () => {
    if (unsubFirebase) unsubFirebase();
    if (eventSource) eventSource.close();
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
