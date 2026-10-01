// Unified booking storage and synchronization layer
import { getFirebaseDb, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from './firebase';

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
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      const list = [];
      snap.forEach(d => list.push(d.data()));
      saveLocalBookings(list);
      return list;
    } catch (e) {
      console.warn('Failed to fetch from Firestore:', e);
    }
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
  const { slotId, date, timeDisplay, fullName, studentNumber, course, email, projectTitle } = bookingPayload;
  
  const booking = {
    id: `BKG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    slotId,
    date,
    timeDisplay,
    fullName: (fullName || '').trim(),
    studentNumber: (studentNumber || '').trim(),
    gender: (bookingPayload.gender || '').trim(),
    course: (course || '').trim(),
    projectTitle: (projectTitle || bookingPayload.projectTitle || '').trim(),
    email: (email || '').trim().toLowerCase(),
    attendanceStatus: 'active', // 'active' | 'finished' | 'missed'
    createdAt: new Date().toISOString(),
  };

  // Validate 10-digit Mapúa student number template starting with 202x
  const cleanStudentNum = String(studentNumber || '').trim();
  if (!/^202\d{7}$/.test(cleanStudentNum)) {
    return {
      success: false,
      error: 'Student Number must be exactly 10 digits starting with 202x (e.g. 2023123456).'
    };
  }

  // Validate email domain (@mymail.mapua.edu.ph, @mapua.edu.ph, or @gmail.com)
  const cleanEmail = String(email || '').trim().toLowerCase();
  const isValidEmail = cleanEmail.endsWith('@mymail.mapua.edu.ph') || 
                       cleanEmail.endsWith('@mapua.edu.ph') || 
                       cleanEmail.endsWith('@gmail.com');
  if (!isValidEmail) {
    return {
      success: false,
      error: 'Invalid email. Must be from @mymail.mapua.edu.ph, @mapua.edu.ph, or @gmail.com'
    };
  }

  // Pre-submission validation against current booking pool
  const current = getLocalBookings();
  const existingSlot = current.find(b => b.slotId === slotId);
  if (existingSlot) {
    return {
      success: false,
      error: `Slot (${timeDisplay}) has already been reserved! Please select a different schedule.`
    };
  }

  const existingStudent = current.find(b => 
    String(b.studentNumber || '').trim().toLowerCase() === cleanStudentNum.toLowerCase() && b.date === date
  );
  if (existingStudent) {
    return {
      success: false,
      error: `Duplicate submission: Student Number "${studentNumber}" already has a reserved slot (${existingStudent.timeDisplay}) on this date. You can retract your existing booking to select a new time.`
    };
  }

  // 1. Try Firebase Firestore if configured
  const db = getFirebaseDb();
  if (db) {
    try {
      const slotRef = doc(db, 'bookings', slotId);
      await setDoc(slotRef, booking);
      const updated = [...current.filter(b => b.slotId !== slotId), booking];
      saveLocalBookings(updated);
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
  // Always update local cache and broadcast immediately so the UI reflects removal with 0 delay
  const current = getLocalBookings();
  const targetBooking = current.find(b => b.slotId === slotId || b.id === slotId);
  const updated = current.filter(b => b.slotId !== slotId && b.id !== slotId);
  saveLocalBookings(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mapua_bookings_updated', { detail: updated }));
  }

  // 1. Firebase Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'bookings', slotId));
      if (targetBooking && targetBooking.id && targetBooking.id !== slotId) {
        await deleteDoc(doc(db, 'bookings', targetBooking.id));
      }
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }

  // 2. Backend Server API
  try {
    await fetch(`/api/bookings/${encodeURIComponent(slotId)}`, {
      method: 'DELETE',
    });
  } catch {
    // API not running or static environment
  }

  return { success: true };
}

export async function updateBookingAttendance(slotId, attendanceStatus) {
  const current = getLocalBookings();
  const updated = current.map(b => {
    if (b.slotId === slotId) {
      return { 
        ...b, 
        attendanceStatus, 
        attendanceUpdatedAt: new Date().toISOString() 
      };
    }
    return b;
  });
  saveLocalBookings(updated);

  const db = getFirebaseDb();
  if (db) {
    try {
      await setDoc(doc(db, 'bookings', slotId), { 
        attendanceStatus, 
        attendanceUpdatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore attendance status update error:', e);
    }
  }

  window.dispatchEvent(new CustomEvent('mapua_bookings_updated', { detail: updated }));
  return { success: true, updatedBookings: updated };
}

export async function batchUpdateBookingAttendance(slotIds, attendanceStatus) {
  const slotIdSet = new Set(slotIds);
  const current = getLocalBookings();
  const updated = current.map(b => {
    if (slotIdSet.has(b.slotId)) {
      return { 
        ...b, 
        attendanceStatus, 
        attendanceUpdatedAt: new Date().toISOString() 
      };
    }
    return b;
  });
  saveLocalBookings(updated);

  const db = getFirebaseDb();
  if (db) {
    try {
      const promises = slotIds.map(id => 
        setDoc(doc(db, 'bookings', id), { 
          attendanceStatus, 
          attendanceUpdatedAt: new Date().toISOString() 
        }, { merge: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.warn('Firestore batch attendance update error:', e);
    }
  }

  window.dispatchEvent(new CustomEvent('mapua_bookings_updated', { detail: updated }));
  return { success: true, updatedBookings: updated };
}

export async function updateBookingProjectTitle(slotId, projectTitle) {
  const cleanTitle = (projectTitle || '').trim();
  const current = getLocalBookings();
  const updated = current.map(b => {
    if (b.slotId === slotId) {
      return { 
        ...b, 
        projectTitle: cleanTitle, 
        updatedAt: new Date().toISOString() 
      };
    }
    return b;
  });
  saveLocalBookings(updated);

  const db = getFirebaseDb();
  if (db) {
    try {
      await setDoc(doc(db, 'bookings', slotId), { 
        projectTitle: cleanTitle, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore projectTitle update error:', e);
    }
  }

  window.dispatchEvent(new CustomEvent('mapua_bookings_updated', { detail: updated }));
  return { success: true, updatedBookings: updated };
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

  const handleCustom = (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      onUpdate(e.detail);
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('mapua_bookings_updated', handleCustom);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // Return cleanup function
  return () => {
    if (unsubFirebase) unsubFirebase();
    if (eventSource) eventSource.close();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('mapua_bookings_updated', handleCustom);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
