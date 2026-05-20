import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// Paste your Firebase project config here.
// Get it from: Firebase Console → Project Settings → Your apps → SDK setup
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyD-smnLSusD2BJGawdDiiR2aYGEVBbbkVs',
  authDomain:        'milbudgetbuddy.firebaseapp.com',
  projectId:         'milbudgetbuddy',
  storageBucket:     'milbudgetbuddy.firebasestorage.app',
  messagingSenderId: '1010412641351',
  appId:             '1:1010412641351:web:25348ecb227babc3166562',
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
