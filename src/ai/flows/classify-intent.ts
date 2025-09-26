
'use server';

/**
 * @fileOverview Flow for classifying player input as an action or a question.
 *
 * - classifyIntent - A function that classifies the player's input.
 * - ClassifyIntentOutput - The return type for the classifyIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_CLASSIFICATION } from '../models';
import { classifyIntentPromptText } from '../prompts/classify-intent-prompt';

const ClassifyIntentInputSchema = z.object({
  playerInput: z.string().describe('The text input from the player.'),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;

const ClassifyIntentOutputSchema = z.object({
  intent: z.enum(['Action', 'Question']).describe('The classified intent of the player input.'),
});
export type ClassifyIntentOutput = z.infer<typeof ClassifyIntentOutputSchema>;

export async function classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentOutput> {
  return classifyIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyIntentPrompt',
  input: {schema: ClassifyIntentInputSchema},
  output: {schema: ClassifyIntentOutputSchema},
  model: MODEL_CLASSIFICATION,
  prompt: classifyIntentPromptText,
});

const classifyIntentFlow = ai.defineFlow(
  {
    name: 'classifyIntentFlow',
    inputSchema: ClassifyIntentInputSchema,
    outputSchema: ClassifyIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
