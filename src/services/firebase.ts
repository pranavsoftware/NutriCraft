import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAe0D6EClkAUV1oXwZrKneISa09YqKifRA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nutricraft-d450f.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://nutricraft-d450f-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nutricraft-d450f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nutricraft-d450f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '864371133848',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:864371133848:web:8b25b1e42571ec144f2fed',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-S9BLBTV33S',
};

// Initialize Firebase client app
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Custom ActionCodeSettings to ensure Firebase verification emails
 * point directly to NutriCraft's custom verification page rather than
 * the default Firebase __/auth/action domain.
 */
export const getActionCodeSettings = () => {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://nutricraft.raybanpranav.tech';

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const targetUrl = isLocal
    ? `${origin}/verify-email`
    : 'https://nutricraft.raybanpranav.tech/verify-email';

  return {
    url: targetUrl,
    handleCodeInApp: true,
  };
};

/**
 * Custom ActionCodeSettings for password reset emails to ensure links
 * point directly to NutriCraft's custom /reset-password page rather
 * than the default Firebase __/auth/action domain.
 */
export const getPasswordResetActionCodeSettings = () => {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://nutricraft.raybanpranav.tech';

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const targetUrl = isLocal
    ? `${origin}/reset-password`
    : 'https://nutricraft.raybanpranav.tech/reset-password';

  return {
    url: targetUrl,
    handleCodeInApp: true,
  };
};

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  onAuthStateChanged,
  updateFirebaseProfile,
  firebaseSignOut,
};
