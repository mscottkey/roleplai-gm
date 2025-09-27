
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
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

export async function logAiInteraction(log: Omit<AILogRecord, 'timestamp'>) {
  try {
    const adminApp = getAdminApp();
    const db = getAdminFirestore(adminApp);
    const logsCollection = db.collection('ai_logs');
    
    // Ensure all parts of the log are serializable
    const serializableLog = {
      ...log,
      input: JSON.parse(JSON.stringify(log.input || {})),
      output: log.output ? JSON.parse(JSON.stringify(log.output)) : undefined,
      timestamp: FieldValue.serverTimestamp(),
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
