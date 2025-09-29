
'use server';

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getServerApp } from '@/app/actions';
import { calculateCost } from '@/lib/ai-costs';
import type { GenerationUsage } from 'genkit';

type LogAiUsageInput = {
    userId: string;
    gameId: string | null;
    flowType: string;
    model: string;
    usage: GenerationUsage;
};

export async function logAiUsage(input: LogAiUsageInput): Promise<{ success: boolean; message?: string }> {
    const { userId, gameId, flowType, model, usage } = input;

    if (!userId || !flowType || !model || !usage) {
        return { success: false, message: 'Missing required fields for logging AI usage.' };
    }

    try {
        const cost = calculateCost(model, usage);
        
        const app = await getServerApp();
        const db = getFirestore(app);
        
        await addDoc(collection(db, 'aiUsageLogs'), {
            userId,
            gameId,
            flowType,
            model,
            usage,
            cost,
            createdAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error in logAiUsage action:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred while logging usage.';
        return { success: false, message };
    }
}
