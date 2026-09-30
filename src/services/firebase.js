// Firebase integration (optional, for 1-click cloud deployment)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';

const STORAGE_KEY = 'mapua_scheduler_firebase_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCkZSiWHLb8qrzUAiocgrijAaQ5dujYJWo",
  authDomain: "mapua-schedpoint.firebaseapp.com",
  projectId: "mapua-schedpoint",
  storageBucket: "mapua-schedpoint.firebasestorage.app",
  messagingSenderId: "670467479029",
  appId: "1:670467479029:web:5a91bb3e3cd85ca51bbcbc"
};

export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading Firebase config from localStorage:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config) {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Firebase config:', e);
  }
}

export function getFirebaseDb() {
  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    return getFirestore(app);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return null;
  }
}

export {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
};
