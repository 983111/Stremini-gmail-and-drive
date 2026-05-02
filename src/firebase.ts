import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();

const normalizeAuthDomain = (value?: string) => {
  if (!value) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;

  try {
    return new URL(withProtocol).hostname.trim();
  } catch {
    return value
      .replace(/^https?:\/\//i, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .split('/')[0]
      .trim();
  }
};

const normalizedAuthDomain = normalizeAuthDomain(configuredAuthDomain);
const fallbackAuthDomain = projectId ? `${projectId}.firebaseapp.com` : '';

const authDomain =
  normalizedAuthDomain && normalizedAuthDomain !== 'firebaseapp.com'
    ? normalizedAuthDomain
    : fallbackAuthDomain;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);

setPersistence(auth, browserLocalPersistence).catch(() => {
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'consent'
});
