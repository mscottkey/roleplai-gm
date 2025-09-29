
'use server';

import { getServerApp } from '@/app/actions';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { GenerationUsage } from 'genkit';
import { calculateCost } from '@/lib/ai-costs';

export interface AiUsageLog {
  userId: string;
  gameId: string | null;
  flowType: string;
  model: string;
  usage: GenerationUsage;
  cost: number;
  createdAt: any; // ServerTimestamp
}

/**
 * Logs a record of an AI model call to Firestore for tracking and analysis.
 * @param logData - The data for the AI usage log entry.
 * @returns An object indicating success or failure.
 */
export async function logAiUsage(logData: Omit<AiUsageLog, 'createdAt' | 'cost'>): Promise<{ success: boolean; message?: string }> {
  const { userId, gameId, flowType, model, usage } = logData;

  if (!userId || !flowType || !model || !usage) {
    return { success: false, message: 'Missing required fields for AI usage logging.' };
  }

  try {
    const app = await getServerApp();
    const db = getFirestore(app);

    const cost = calculateCost(model, usage);

    const logEntry: Omit<AiUsageLog, 'createdAt'> = {
      userId,
      gameId,
      flowType,
      model,
      usage,
      cost,
    };
    
    await addDoc(collection(db, 'aiUsageLogs'), {
      ...logEntry,
      createdAt: serverTimestamp(),
    });
    
    return { success: true };

  } catch (error) {
    console.error('Error in logAiUsage action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while logging AI usage.';
    return { success: false, message };
  }
}
