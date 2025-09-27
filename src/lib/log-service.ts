
'use server';

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import type { GenerationUsage } from 'genkit';

export type AILogRecord = {
  gameId: string;
  flowName: string;
  timestamp: any;
  status: 'success' | 'failure';
  model?: string;
  latency?: number;
  input: any;
  output?: any;
  error?: string;
  usage?: GenerationUsage;
};

// --- Firebase Admin SDK Initialization for Logging ---
let adminApp;
if (!getApps().some(app => app.name === 'firebase-admin-logging')) {
  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKeyBase64) {
    try {
      const serviceAccountJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      }, 'firebase-admin-logging');
    } catch (e: any) {
        console.error('[CRITICAL] Failed to initialize Firebase Admin for logging:', e.message);
    }
  } else {
    console.error('[CRITICAL] FIREBASE_SERVICE_ACCOUNT_KEY is not set. AI logging will not function.');
  }
} else {
  adminApp = getApp('firebase-admin-logging');
}

function getLoggingFirestore() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK for logging is not initialized.");
    }
    return getAdminFirestore(adminApp);
}
// --- End Initialization ---


export async function logAiInteraction(log: Omit<AILogRecord, 'timestamp'>) {
  try {
    const db = getLoggingFirestore();
    const logsCollection = db.collection('ai_logs');
    
    // Ensure all parts of the log are serializable
    const serializableLog = {
      ...log,
      input: JSON.parse(JSON.stringify(log.input || {})),
      output: log.output ? JSON.parse(JSON.stringify(log.output)) : undefined,
      timestamp: serverTimestamp(),
    };

    await logsCollection.add(serializableLog);

  } catch (error) {
    console.error(`[CRITICAL] Failed to write AI interaction to log collection.`, {
        log: { ...log, input: 'omitted for brevity' }, // Avoid logging large inputs on logging failure
        loggingError: error instanceof Error ? error.message : String(error)
    });
    // We don't re-throw here as logging is a background task and should not crash the main operation.
  }
}
