import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';

let adminApp: App | undefined;

/**
 * Gets the singleton server-side Firebase Admin App instance.
 * Initializes it if it doesn't exist.
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Next.js reuses server modules, so we need to check for existing apps
  const existingApp = getApps().find(app => app?.name === '[DEFAULT]');
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyBase64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. It must be a base64 encoded string for Admin SDK initialization.'
    );
  }

  try {
    const serviceAccountJson = Buffer.from(
      serviceAccountKeyBase64,
      'base64'
    ).toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    return adminApp;
  } catch (e: any) {
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK. Make sure it is a valid base64-encoded JSON string. Original error: ${e.message}`
    );
  }
}
