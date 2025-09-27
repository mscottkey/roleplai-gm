
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


export async function generateCampaignResolution(input: z.infer<typeof GenerateResolutionInputSchema>) {
    
    const result = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignResolutionPromptText,
      input: input,
      output: {
        format: 'json',
        schema: CampaignResolutionSchema,
      },
      retries: 2,
    });
    
    if (!result.output) {
      throw new Error('The AI failed to generate the campaign\'s resolution and endgame.');
    }
    return result;
}
