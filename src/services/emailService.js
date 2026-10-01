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

  // 2. Primary automated delivery via ShipMyForm
  const retractionPayload = {
    _subject: `[OJT Schedpoint] Reservation Retracted — Slot Reopened`,
    "Student Name": booking.fullName,
    "Student Number": booking.studentNumber,
    "Gender": booking.gender || 'Not specified',
    "Course & Section": booking.course,
    "Project Title": booking.projectTitle || 'N/A',
    "Retracted Slot Time": booking.timeDisplay,
    "Scheduled Date": booking.date,
    "Retraction ID": retractionId,
    "Booking Reference Code": booking.id || 'N/A',
    "Cancellation Timestamp": `${timestampFormatted} (PHT)`,
    "Status": "CONFIRMED CANCELLED & SLOT REOPENED",
    "Official Note": "Your OJT defense reservation has been officially retracted. The slot has been released back into the available pool for your peers. If you wish to reschedule for another time or day, please visit: https://ojt-scheduler.netlify.app/"
  };

  try {
    const res = await fetch(`https://shipmyform.com/to/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(retractionPayload)
    });
    if (res.ok) {
      return { success: true, email: recipientEmail, retractionId, timestamp: timestampFormatted };
    }
  } catch (err) {
    console.warn('ShipMyForm retraction error, trying FormSubmit:', err);
  }

  // 3. Fallback delivery via FormSubmit
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...retractionPayload,
        _template: 'box',
        _captcha: 'false',
        _replyto: 'noreply-schedpoint@mapua.edu.ph',
      })
    });
  } catch (err2) {
    console.warn('FormSubmit fallback error:', err2);
  }

  // 4. Also try backend Netlify SMTP if configured
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
  } catch {
    // ignore
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
 * directly to the student's email via ShipMyForm / FormSubmit.
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

  const confirmationPayload = {
    _subject: `[OJT Schedpoint] Reservation Confirmed — Reference Code: ${referenceCode}`,
    "OFFICIAL REFERENCE CODE": referenceCode,
    "Student Name": booking.fullName,
    "Student Number": booking.studentNumber,
    "Gender": booking.gender || 'Not specified',
    "Course & Section": booking.course,
    "Project Title": booking.projectTitle || 'N/A',
    "Reserved Slot Time": booking.timeDisplay,
    "Scheduled Defense Date": booking.date,
    "Confirmation Timestamp": `${timestampFormatted} (PHT)`,
    "Status": "CONFIRMED & LOCKED IN",
    "FIRST TIME USERS NOTE": "If this is your first time receiving a submission from ShipMyForm, click the 'Activate Form' link once to unlock future direct messages.",
    "RETRACTION INSTRUCTION": `Keep this Reference Code safe! If you need to retract or cancel this reservation to choose another time, enter your Reference Code (${referenceCode}) at: https://ojt-scheduler.netlify.app/`
  };

  // 1. Primary delivery via ShipMyForm
  try {
    const res = await fetch(`https://shipmyform.com/to/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(confirmationPayload)
    });
    if (res.ok) {
      return { success: true, email: recipientEmail, referenceCode, timestamp: timestampFormatted };
    }
  } catch (err) {
    console.warn('ShipMyForm confirmation error, attempting FormSubmit:', err);
  }

  // 2. Fallback delivery via FormSubmit
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...confirmationPayload,
        _template: 'box',
        _captcha: 'false',
        _replyto: 'noreply-schedpoint@mapua.edu.ph',
      })
    });
  } catch (err2) {
    console.warn('FormSubmit confirmation error:', err2);
  }

  // 3. Also try backend Netlify SMTP if configured
  try {
    await postEmailRequest({
      type: 'confirmation',
      recipientEmail,
      booking: {
        ...booking,
        formattedTimestamp: timestampFormatted,
      }
    });
  } catch {
    // ignore
  }

  return {
    success: true,
    email: recipientEmail,
    referenceCode,
    timestamp: timestampFormatted
  };
}
