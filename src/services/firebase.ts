import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error — getReactNativePersistence exists at runtime on native
// (Metro resolves @firebase/auth's "react-native" export condition), but the
// `firebase` wrapper package's typings don't expose it. It genuinely does NOT
// exist in the browser build @firebase/auth ships for web, so it must never
// be called when Platform.OS === 'web' — see the branch below.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
};

const app  = initializeApp(firebaseConfig);
// getAuth() alone defaults to in-memory-only persistence on native (iOS/
// Android) — the session silently disappears the moment the app is closed.
// initializeAuth + AsyncStorage fixes that, but only exists in the native
// build of the SDK; the web build already persists via localStorage on its
// own through plain getAuth(), and calling getReactNativePersistence there
// would crash (it's undefined in that bundle).
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db   = getFirestore(app);
