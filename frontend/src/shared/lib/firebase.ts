import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// ── Configuració Firebase ─────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Evita reinicialitzar si ja existeix (HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Serveis ───────────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (només en producció i si el navegador ho suporta)
export const analytics = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
);

// ── Emuladors (Desenvolupament) ───────────────────────────────────────────────
if (import.meta.env.VITE_APP_ENV === 'development' && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('🔧 Firebase Emulators actius');
}

// ── Persistència offline Firestore ────────────────────────────────────────────
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore: múltiples pestanyes obertes, persistència desactivada');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore: el navegador no suporta persistència offline');
    }
  });
}

export default app;
