import { getFirebaseDb, doc, setDoc, getDoc } from './firebase';

export const ALLOWED_INSTRUCTOR_EMAILS = [
  'acvillaluz@mapua.edu.ph',
  'pvcabalag@mapua.edu.ph',
  'imppcabalag@gmail.com',
  'acvillaluz@gmail.com'
];

const LOCAL_STORAGE_PASS_KEY = 'ojt_instructor_passwords';
const LOCAL_STORAGE_SESSION_KEY = 'ojt_user_session';
const RESET_CODE_STORAGE_KEY = 'ojt_instructor_reset_codes';
const DEFAULT_PASSWORD = '1234';

/**
 * Normalizes email address for comparison
 */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Checks if an email is in the allowed instructors list
 */
export function isAllowedInstructorEmail(email) {
  const norm = normalizeEmail(email);
  return ALLOWED_INSTRUCTOR_EMAILS.some(e => normalizeEmail(e) === norm);
}

/**
 * Retrieves the stored password map from localStorage
 */
function getStoredPasswords() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PASS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading instructor passwords from localStorage:', err);
  }
  return {};
}

/**
 * Saves password for a specific instructor email
 */
function saveStoredPassword(email, newPassword) {
  const norm = normalizeEmail(email);
  const passwords = getStoredPasswords();
  passwords[norm] = newPassword;
  try {
    localStorage.setItem(LOCAL_STORAGE_PASS_KEY, JSON.stringify(passwords));
  } catch (err) {
    console.warn('Error saving instructor password to localStorage:', err);
  }
}

/**
 * Verifies instructor credentials (Email & Password)
 * Default password is 1234 unless reset.
 */
export async function verifyInstructorCredentials(email, password) {
  const norm = normalizeEmail(email);
  if (!norm) {
    return { success: false, error: 'Please enter your instructor email address.' };
  }

  if (!isAllowedInstructorEmail(norm)) {
    return { 
      success: false, 
      error: `Access Denied: "${email}" is not recognized as an authorized instructor email.` 
    };
  }

  const inputPass = String(password || '').trim();
  if (!inputPass) {
    return { success: false, error: 'Please enter your password.' };
  }

  // Check cloud Firestore for latest password if available
  let cloudPass = null;
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDoc(doc(db, 'settings', 'instructor_auth'));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.passwords && data.passwords[norm]) {
          cloudPass = data.passwords[norm];
          // Cache locally
          saveStoredPassword(norm, cloudPass);
        }
      }
    }
  } catch (err) {
    console.warn('Error checking Firestore for instructor password:', err);
  }

  const localPasswords = getStoredPasswords();
  const expectedPassword = cloudPass || localPasswords[norm] || DEFAULT_PASSWORD;

  if (inputPass === expectedPassword) {
    return { success: true, email: norm };
  }

  return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
}

/**
 * Updates / Resets an instructor's password
 */
export async function resetInstructorPassword(email, newPassword) {
  const norm = normalizeEmail(email);
  if (!isAllowedInstructorEmail(norm)) {
    return { success: false, error: `Email "${email}" is not authorized for password reset.` };
  }

  const cleanPass = String(newPassword || '').trim();
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters long.' };
  }

  // 1. Save to localStorage
  saveStoredPassword(norm, cleanPass);

  // 2. Save to Firestore if available
  try {
    const db = getFirebaseDb();
    if (db) {
      const passRef = doc(db, 'settings', 'instructor_auth');
      const snap = await getDoc(passRef);
      const existingData = snap.exists() ? snap.data() : { passwords: {} };
      const updatedPasswords = {
        ...(existingData.passwords || {}),
        [norm]: cleanPass
      };
      await setDoc(passRef, {
        passwords: updatedPasswords,
        lastUpdated: new Date().toISOString(),
        updatedBy: norm
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Error syncing updated password to Firestore:', err);
  }

  return { success: true };
}

/**
 * Generates and sends a 6-digit password reset verification code to the instructor's email
 */
export async function sendPasswordResetCode(email) {
  const norm = normalizeEmail(email);
  if (!isAllowedInstructorEmail(norm)) {
    return { 
      success: false, 
      error: `Email "${email}" is not an authorized instructor account.` 
    };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  // Store in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(RESET_CODE_STORAGE_KEY) || '{}');
    existing[norm] = { code, expiresAt };
    localStorage.setItem(RESET_CODE_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Error storing reset code:', e);
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

  // Email payload for ShipMyForm & FormSubmit
  const payload = {
    _subject: `[OJT Schedpoint] Instructor Password Reset Code: ${code}`,
    "Recipient": norm,
    "Verification Code": code,
    "Purpose": "Instructor Portal Password Reset",
    "Expiration": "15 Minutes",
    "Requested At": `${timestamp} (PHT)`,
    "Security Note": "If you did not request this password reset, please ignore this email."
  };

  try {
    await fetch(`https://shipmyform.com/to/${encodeURIComponent(norm)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('ShipMyForm reset email dispatch error, trying FormSubmit:', e);
  }

  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(norm)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        ...payload,
        _template: 'box',
        _captcha: 'false',
        _replyto: 'noreply-schedpoint@mapua.edu.ph'
      })
    });
  } catch (e) {
    console.warn('FormSubmit reset email dispatch warning:', e);
  }

  return { 
    success: true, 
    code, // Returned for UI testing / instant access convenience
    message: `Verification code sent to ${norm}. Please check your inbox or spam folder.` 
  };
}

/**
 * Validates a submitted 6-digit reset code
 */
export function verifyResetCode(email, inputCode) {
  const norm = normalizeEmail(email);
  try {
    const existing = JSON.parse(localStorage.getItem(RESET_CODE_STORAGE_KEY) || '{}');
    const record = existing[norm];
    if (!record) {
      return { success: false, error: 'No active reset request found for this email. Please request a new code.' };
    }
    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }
    if (String(inputCode || '').trim() !== record.code) {
      return { success: false, error: 'Incorrect verification code. Please check the code sent to your email.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Error validating code. Please try again.' };
  }
}

/**
 * Session storage management
 * The default and primary page is always the login page first upon visiting.
 */
export function getSavedSession() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    sessionStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  } catch (e) {
    // ignore
  }
  return null;
}

export function saveSession(sessionData) {
  try {
    sessionStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    // ignore
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  } catch (e) {
    // ignore
  }
}
