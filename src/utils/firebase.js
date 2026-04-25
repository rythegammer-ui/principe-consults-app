import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  deleteUser as firebaseDeleteUser,
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

export async function sendPasswordResetEmail(email) {
  ensureInit();
  if (!auth) throw new Error('Firebase not configured');
  await firebaseSendPasswordResetEmail(auth, email);
}

export async function deleteCurrentAuthUser() {
  if (!auth?.currentUser) return;
  try { await firebaseDeleteUser(auth.currentUser); } catch { /* ignore */ }
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

// Best-effort write — throws on real errors so callers can surface them, but
// no-ops cleanly when Firebase isn't configured (e.g., dev without env vars).
export async function saveToFirebase(path, data) {
  ensureInit();
  if (!db) return;
  await set(ref(db, path), data);
}

// Strict variant kept as an alias for paths where the caller must know the
// write landed. (Same behavior as `saveToFirebase` since that one now throws.)
export async function saveToFirebaseStrict(path, data) {
  ensureInit();
  if (!db) throw new Error('Firebase not configured');
  await set(ref(db, path), data);
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

// Always invokes the callback — null when the path is empty/missing — so
// remote deletions propagate to local state instead of leaving stale data.
export function subscribeToFirebase(path, callback) {
  if (!db) return () => {};
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (err) => {
    console.error(`Firebase subscribe failed (${path}):`, err);
  });
  return unsubscribe;
}
