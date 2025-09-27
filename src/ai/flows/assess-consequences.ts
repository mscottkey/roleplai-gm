
'use server';

/**
 * @fileOverview Flow for assessing the consequences of a player's action.
 *
 * - assessConsequences - A function that assesses the potential impact of an action.
 * - AssessConsequencesInput - The input type for the assessConsequences function.
 * - AssessConsequencesOutput - The return type for the assessConsequences function.
 */

import {ai} from '@/ai/genkit';
import { AssessConsequencesInputSchema, AssessConsequencesOutputSchema, type AssessConsequencesInput, type AssessConsequencesOutput } from '@/ai/schemas/assess-consequences-schemas';
import { MODEL_ANALYSIS } from '../models';
import { assessConsequencesPromptText } from '../prompts/assess-consequences-prompt';

export async function assessConsequences(input: AssessConsequencesInput): Promise<AssessConsequencesOutput> {
  return assessConsequencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessConsequencesPrompt',
  input: {schema: AssessConsequencesInputSchema},
  output: {schema: AssessConsequencesOutputSchema},
  model: MODEL_ANALYSIS,
  prompt: assessConsequencesPromptText,
  retries: 2,
});

const assessConsequencesFlow = ai.defineFlow(
  {
    name: 'assessConsequencesFlow',
    inputSchema: AssessConsequencesInputSchema,
    outputSchema: AssessConsequencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
