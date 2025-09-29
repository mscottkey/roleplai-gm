
'use server';

/**
 * @fileOverview Flow for generating a "previously on" recap of the last session.
 *
 * - generateRecap - A function that creates a summary of recent events.
 * - GenerateRecapInput - The input type for the generateRecap function.
 * - GenerateRecapOutput - The return type for the generateRecap function.
 */

import {ai} from '@/ai/genkit';
import { GenerateRecapInputSchema, GenerateRecapOutputSchema, type GenerateRecapInput, type GenerateRecapOutput } from '@/ai/schemas/generate-recap-schemas';
import { MODEL_GAMEPLAY } from '../models';
import { generateRecapPromptText } from '../prompts/generate-recap-prompt';
import type { GenerationUsage } from 'genkit';
import { FactionSchema } from '../schemas/world-state-schemas';

export type { GenerateRecapInput, GenerateRecapOutput };

export type GenerateRecapResponse = {
  output: GenerateRecapOutput;
  usage: GenerationUsage;
  model: string;
};

export async function generateRecap(input: GenerateRecapInput): Promise<GenerateRecapResponse> {
  const result = await prompt(input);
  return {
    output: result.output!,
    usage: result.usage,
    model: result.model,
  };
}

const prompt = ai.definePrompt({
  name: 'generateRecapPrompt',
  input: {schema: GenerateRecapInputSchema},
  output: {schema: GenerateRecapOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: generateRecapPromptText,
});

ai.defineFlow(
  {
    name: 'generateRecapFlow',
    inputSchema: GenerateRecapInputSchema,
    outputSchema: GenerateRecapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
