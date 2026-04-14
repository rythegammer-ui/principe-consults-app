// ============================================================
// Firebase Project Configuration
// ============================================================
// Fill in YOUR Firebase project config below.
//
// How to get these values:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Enable Authentication > Email/Password sign-in method
// 4. Enable Realtime Database (set rules to allow authenticated read/write)
// 5. Go to Project Settings > General > Your apps > Add web app
// 6. Copy the config values here
//
// You can also use environment variables (for Vercel/Netlify deployment):
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Booking link for onboarding calls (shown after signup)
export const ONBOARDING_BOOKING_LINK = import.meta.env.VITE_ONBOARDING_BOOKING_LINK || 'https://link.leadconnectorhq.com/widget/booking/pj3w686q7SL091ZY30NH';
