
'use server';

/**
 * @fileOverview Flow for estimating the token cost of a game session.
 *
 * - estimateCost - A function that estimates token usage.
 */

import {ai} from '@/ai/genkit';
import {
  EstimateCostInputSchema,
  EstimateCostOutputSchema,
  type EstimateCostInput,
  type EstimateCostOutput,
} from '@/ai/schemas/cost-estimation-schemas';
import { MODEL_ANALYSIS } from '../models';
import { estimateCostPromptText } from '../prompts/estimate-cost-prompt';

export async function estimateCost(input: EstimateCostInput): Promise<EstimateCostOutput> {
  return estimateCostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCostPrompt',
  input: {schema: EstimateCostInputSchema},
  output: {schema: EstimateCostOutputSchema},
  model: MODEL_ANALYSIS,
  prompt: estimateCostPromptText,
});

const estimateCostFlow = ai.defineFlow(
  {
    name: 'estimateCostFlow',
    inputSchema: EstimateCostInputSchema,
    outputSchema: EstimateCostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
    
