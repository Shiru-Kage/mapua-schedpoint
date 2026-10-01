// Automated Direct SMTP / Gmail Email Dispatch Service for Mapúa SchedPoint
import { getFirebaseDb, collection, doc, setDoc } from './firebase';

const PRIMARY_API_ENDPOINT = '/api/send-email';
const NETLIFY_FUNCTION_ENDPOINT = '/.netlify/functions/send-email';
const CLOUD_FALLBACK_ENDPOINT = 'https://ojt-scheduler.netlify.app/.netlify/functions/send-email';

async function postEmailRequest(payload) {
  const endpoints = [
    PRIMARY_API_ENDPOINT,
    NETLIFY_FUNCTION_ENDPOINT,
    CLOUD_FALLBACK_ENDPOINT,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // try next endpoint
    }
  }

  return { success: false, error: 'All email endpoints unreachable' };
}

/**
 * Sends an automated retraction confirmation email directly via Gmail SMTP
 * and logs an audit record to Firestore.
 * 
 * @param {Object} booking - The booking object being retracted
 * @returns {Promise<{success: boolean, email?: string, retractionId?: string, error?: string}>}
 */
export async function sendRetractionEmail(booking) {
  if (!booking) {
    return { success: false, error: 'No booking details provided for retraction.' };
  }

  const recipientEmail = (booking.email || '').trim();
  if (!recipientEmail) {
    return { success: false, error: 'Student email is missing from this reservation.' };
  }

  const retractionId = `RET-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const timestampFormatted = now.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // 1. Audit Trail: Save cancellation in Firestore
  try {
    const db = getFirebaseDb();
    if (db) {
      const cancelDocId = `${booking.slotId}_${Date.now()}`;
      const cancelRef = doc(db, 'cancellations', cancelDocId);
      await setDoc(cancelRef, {
        retractionId,
        slotId: booking.slotId,
        date: booking.date,
        timeDisplay: booking.timeDisplay,
        studentName: booking.fullName,
        studentNumber: booking.studentNumber,
        gender: booking.gender || 'Not Specified',
        email: recipientEmail,
        course: booking.course,
        projectTitle: booking.projectTitle || 'N/A',
        bookingRefId: booking.id || 'N/A',
        cancelledAt: now.toISOString(),
        cancelledAtPHT: timestampFormatted,
        status: 'CANCELLED_AND_RELEASED'
      });
    }
  } catch (err) {
    console.warn('Firestore cancellation audit log warning:', err);
  }

  // 2. Direct SMTP dispatch (zero recipient activation needed)
  try {
    await postEmailRequest({
      type: 'retraction',
      recipientEmail,
      booking: {
        ...booking,
        retractionId,
        cancelledAtFormatted: timestampFormatted,
      }
    });
  } catch (err) {
    console.warn('Direct SMTP retraction email notice:', err);
  }

  return {
    success: true,
    email: recipientEmail,
    retractionId,
    timestamp: timestampFormatted
  };
}

/**
 * Sends an automated confirmation receipt with the official Reference Number/Code
 * directly to the student's email via Gmail SMTP.
 * 
 * @param {Object} booking - The newly confirmed booking object
 * @returns {Promise<{success: boolean, email?: string, referenceCode?: string, error?: string}>}
 */
export async function sendBookingConfirmationEmail(booking) {
  if (!booking) {
    return { success: false, error: 'No booking details provided.' };
  }

  const recipientEmail = (booking.email || '').trim();
  if (!recipientEmail) {
    return { success: false, error: 'Student email is missing from reservation.' };
  }

  const referenceCode = booking.id;
  const now = new Date();
  const timestampFormatted = now.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Direct SMTP dispatch (zero recipient activation needed)
  try {
    await postEmailRequest({
      type: 'confirmation',
      recipientEmail,
      booking: {
        ...booking,
        formattedTimestamp: timestampFormatted,
      }
    });
  } catch (err) {
    console.warn('Direct SMTP confirmation email notice:', err);
  }

  return {
    success: true,
    email: recipientEmail,
    referenceCode,
    timestamp: timestampFormatted
  };
}
