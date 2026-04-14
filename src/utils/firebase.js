import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config/firebase.config';

let app = null;
let db = null;
let auth = null;

// Auto-initialize Firebase if config is present
function ensureInit() {
  if (app) return true;
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) return false;
  try {
    app = initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    auth = getAuth(app);
    return true;
  } catch (err) {
    console.error('Firebase init failed:', err);
    return false;
  }
}

// Initialize on import if config exists
ensureInit();

export function isFirebaseConfigured() {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.databaseURL);
}

export function getDb() {
  ensureInit();
  return db;
}

export function getFirebaseAuth() {
  ensureInit();
  return auth;
}

// ── Auth Functions ──────────────────────────────────────────

export async function createAccount(email, password) {
  ensureInit();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signIn(email, password) {
  ensureInit();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function onAuthChanged(callback) {
  ensureInit();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── Database Functions ──────────────────────────────────────

export async function saveToFirebase(path, data) {
  if (!db) return;
  try {
    await set(ref(db, path), data);
  } catch (err) {
    console.error(`Firebase save failed (${path}):`, err);
  }
}

export async function loadFromFirebase(path) {
  ensureInit();
  if (!db) return null;
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.error(`Firebase load failed (${path}):`, err);
    return null;
  }
}

export function subscribeToFirebase(path, callback) {
  if (!db) return () => {};
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  }, (err) => {
    console.error(`Firebase subscribe failed (${path}):`, err);
  });
  return unsubscribe;
}

// Sanitize email for use as a Firebase key (no dots or special chars)
export function encodeEmail(email) {
  return email.toLowerCase().replace(/\./g, ',').replace(/@/g, '_at_');
}
