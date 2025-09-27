
'use server';

import { getServerApp } from '@/app/actions';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';

// This type mirrors the `GenerationUsage` from Genkit's response.
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type TokenUsageRecord = TokenUsage & {
  gameId: string;
  flowName: string;
  model: string;
  timestamp: any; // Firestore serverTimestamp
};

export const MODEL_PRICING: Record<string, { input: number, output: number }> = {
  'gemini-2.5-flash': {
    input: 0.00000035, // $0.35 per 1M tokens
    output: 0.0000021,  // $2.10 per 1M tokens
  },
  'googleai/gemini-2.5-flash': { // The name can sometimes include the provider
    input: 0.00000035,
    output: 0.0000021,
  }
};


export async function logUsage(gameId: string, flowName: string, model: string, usage: TokenUsage) {
  if (!gameId || !usage) return;

  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const usageCollection = collection(db, 'games', gameId, 'token_usage');
    
    const record = {
      flowName,
      model,
      ...usage,
      timestamp: serverTimestamp(),
    };

    await addDoc(usageCollection, record);

  } catch (error) {
    console.error(`Failed to log token usage for game ${gameId}:`, error);
    // We don't re-throw here as logging is a non-critical background task.
  }
}

export async function getUsageForGame(gameId: string): Promise<TokenUsageRecord[]> {
  if (!gameId) return [];

  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const usageCollection = collection(db, 'games', gameId, 'token_usage');
    const q = query(usageCollection);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as TokenUsageRecord);
  } catch (error) {
    console.error(`Failed to get token usage for game ${gameId}:`, error);
    return [];
  }
}

export function calculateCost(usageRecords: TokenUsageRecord[]): { totalInputTokens: number; totalOutputTokens: number; totalCost: number } {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  for (const record of usageRecords) {
    totalInputTokens += record.inputTokens;
    totalOutputTokens += record.outputTokens;
    
    const pricing = MODEL_PRICING[record.model] || MODEL_PRICING['gemini-2.5-flash'];
    
    const inputCost = record.inputTokens * pricing.input;
    const outputCost = record.outputTokens * pricing.output;
    totalCost += inputCost + outputCost;
  }

  return { totalInputTokens, totalOutputTokens, totalCost };
}
