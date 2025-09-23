// /lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Guard: crash early if env is missing/misnamed.
const required = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]
for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`[Firebase config] Missing ${k}. Check your .env.local or Studio env vars.`)
  }
}

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,           // MUST be like studio-...firebaseapp.com
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Persistence: prevents "user disappears on next render" loops.
setPersistence(auth, browserLocalPersistence)

// Handy debug hook in dev only
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as any).__fb = { opts: app.options }
  // Quick sanity print once
  // console.log('[FB opts]', app.options)
}

export { app, auth, db }
