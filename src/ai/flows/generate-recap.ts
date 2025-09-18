
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

export async function generateRecap(input: GenerateRecapInput): Promise<GenerateRecapOutput> {
  return generateRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecapPrompt',
  input: {schema: GenerateRecapInputSchema},
  output: {schema: GenerateRecapOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: `You are a television writer tasked with creating a "Previously On..." segment for a show. Your job is to summarize the provided list of recent events into an exciting and engaging recap.

Your response should be 2-3 paragraphs long and should build excitement for the upcoming session. Start with a dramatic opening and end on a cliffhanger or a question about what will happen next.

## Recent Events to Summarize
{{#each recentEvents}}
- {{{this}}}
{{/each}}

Now, write the recap.
`,
});

const generateRecapFlow = ai.defineFlow(
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
