// Automated Email Dispatch Service for Mapúa SchedPoint
import { getFirebaseDb, collection, doc, setDoc } from './firebase';

/**
 * Sends an automated retraction confirmation email directly to the student's email address
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
        bookingRefId: booking.id || 'N/A',
        cancelledAt: now.toISOString(),
        cancelledAtPHT: timestampFormatted,
        status: 'CANCELLED_AND_RELEASED'
      });
    }
  } catch (err) {
    console.warn('Firestore cancellation audit log warning:', err);
  }

  // 2. Automated Email Dispatch to student's email address via FormSubmit AJAX API
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[Mapúa SchedPoint] Reservation Retraction Receipt: ${booking.timeDisplay} (${booking.date})`,
        _template: 'box',
        _captcha: 'false',
        _replyto: 'noreply-schedpoint@mapua.edu.ph',
        "Student Name": booking.fullName,
        "Student Number": booking.studentNumber,
        "Gender": booking.gender || 'Not specified',
        "Course & Section": booking.course,
        "Retracted Slot Time": booking.timeDisplay,
        "Scheduled Date": booking.date,
        "Retraction ID": retractionId,
        "Cancellation Timestamp": `${timestampFormatted} (PHT)`,
        "Status": "CONFIRMED CANCELLED & SLOT REOPENED",
        "Official Note": "Your consultation / defense reservation has been officially retracted. The slot has been released back into the available pool for your peers. If you wish to reschedule for another time or day, please visit: https://shiru-kage.github.io/mapua-schedpoint/"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('FormSubmit response warning:', text);
    }

    return {
      success: true,
      email: recipientEmail,
      retractionId,
      timestamp: timestampFormatted
    };
  } catch (err) {
    console.error('Automated email dispatch error:', err);
    // Return success since the slot was retracted, with email notice
    return {
      success: true,
      email: recipientEmail,
      retractionId,
      timestamp: timestampFormatted,
      warning: `Slot was released, but email network delivery encountered an issue: ${err.message}`
    };
  }
}
