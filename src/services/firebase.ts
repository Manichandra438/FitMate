import { initializeApp } from 'firebase/app';
// @ts-ignore — getReactNativePersistence is missing from the JS SDK's public types on RN
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Copy .env.example → .env and fill in your Firebase values.
// Never commit .env — it is gitignored.
// Auth/Firestore init throws synchronously on an empty apiKey, which would crash the
// whole bundle before React ever mounts — fall back to a placeholder so the app still
// boots (auth/sync features simply won't work) when .env is missing, e.g. in local dev.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'missing-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = initializeAuth(firebaseApp, {
  persistence:
    Platform.OS === 'web'
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
});

// Firestore's default transport is unreliable on React Native.
export const db = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
});

export const isFirebaseConfigured = () => firebaseConfig.apiKey !== 'missing-api-key';
