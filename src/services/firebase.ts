import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_USE_MOCK_DATA !== 'true'
);

export const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export const auth = app ? getAuth(app) : null;

// Secondary Auth App creation so Admin sessions on primary app are never logged out
export async function createSecondaryAuthUser(email: string, pass: string): Promise<string | null> {
  if (!isFirebaseConfigured) return null;
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  try {
    const secondaryApp =
      getApps().find((a) => a.name === 'SecondaryApp') ||
      initializeApp(firebaseConfig, 'SecondaryApp');

    const secondaryAuth = getAuth(secondaryApp);
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPass);
    const uid = userCred.user.uid;

    // Immediately sign out secondary auth so current admin session stays intact
    await signOut(secondaryAuth);
    return uid;
  } catch (err: any) {
    console.warn('Secondary Auth User Creation Error:', err.message);
    throw err;
  }
}
