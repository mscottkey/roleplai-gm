
'use server';

/**
 * @fileOverview Contains the flow for generating the campaign's resolution structure (endgame).
 *
 * - generateCampaignResolution - Generates the primary objective, hidden truth, and victory conditions.
 */

import {ai} from '@/ai/genkit';
import {
  CampaignResolutionSchema,
  GenerateResolutionInputSchema,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';
import { generateCampaignResolutionPromptText } from '../prompts/generate-campaign-resolution-prompt';
import { z } from 'genkit';

const generateCampaignResolutionPrompt = ai.definePrompt({
    name: 'generateCampaignResolutionPrompt',
    model: MODEL_GENERATION,
    prompt: generateCampaignResolutionPromptText,
    inputSchema: GenerateResolutionInputSchema,
    output: {
        format: 'json',
        schema: CampaignResolutionSchema,
    },
    retries: 2,
});

export async function generateCampaignResolution(input: z.infer<typeof GenerateResolutionInputSchema>) {
    
    const result = await generateCampaignResolutionPrompt(input);
    
    if (!result.output) {
      throw new Error('The AI failed to generate the campaign\'s resolution and endgame.');
    }
    return result;
}
