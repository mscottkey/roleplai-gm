
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


export const generateCampaignResolution = ai.defineFlow(
  {
    name: 'generateCampaignResolution',
    inputSchema: GenerateResolutionInputSchema,
    outputSchema: CampaignResolutionSchema,
  },
  async (input) => {
    
    const { output } = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignResolutionPromptText,
      input: input,
      output: {
        format: 'json',
        schema: CampaignResolutionSchema,
      },
      retries: 2,
    });
    
    return output!;
  }
);
