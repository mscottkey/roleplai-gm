
// /lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Keep a client-side cache of the auth instance
let authInstance: Auth | null = null;

export function getAuthWithPersistence(): Auth {
  if (authInstance) {
    return authInstance;
  }
  
  const auth = getAuth(app);
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence);
  }
  
  authInstance = auth;
  return auth;
}

// Handy debug hook in dev only
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as any).__fb = { opts: app.options }
}

export { app, db }
