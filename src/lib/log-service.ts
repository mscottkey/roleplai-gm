
'use server';

import { getServerApp } from '@/app/actions';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    const app = await getServerApp();
    const db = getFirestore(app);
    const logsCollection = collection(db, 'ai_logs');
    
    // Ensure all parts of the log are serializable
    const serializableLog = {
      ...log,
      input: JSON.parse(JSON.stringify(log.input || {})),
      output: log.output ? JSON.parse(JSON.stringify(log.output)) : undefined,
      timestamp: serverTimestamp(),
    };

    await addDoc(logsCollection, serializableLog);

  } catch (error) {
    console.error(`[CRITICAL] Failed to write AI interaction to log collection.`, {
        log,
        loggingError: error
    });
    // We don't re-throw here as logging is a background task and should not crash the main operation.
  }
}
