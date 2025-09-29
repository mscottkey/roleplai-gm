
'use server';

/**
 * @fileOverview Flow for regenerating a single field of the game data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_GENERATION } from '../models';
import { regenerateFieldPromptText } from '../prompts/regenerate-field-prompt';
import type { GenerationUsage } from 'genkit';

const RegenerateFieldInputSchema = z.object({
  request: z.string().describe("The original user request for the game concept."),
  fieldName: z.enum(['setting', 'tone']).describe("The specific field to regenerate."),
  currentValue: z.string().describe("The current value of the field to be replaced."),
});
export type RegenerateFieldInput = z.infer<typeof RegenerateFieldInputSchema>;

const RegenerateFieldOutputSchema = z.object({
    newValue: z.string().describe('The new, regenerated value for the specified field.'),
});
export type RegenerateFieldOutput = z.infer<typeof RegenerateFieldOutputSchema>;

export type { RegenerateFieldInput, RegenerateFieldOutput };

export type RegenerateFieldResponse = {
  output: RegenerateFieldOutput;
  usage: GenerationUsage;
  model: string;
};

export async function regenerateField(input: RegenerateFieldInput): Promise<RegenerateFieldResponse> {
  const result = await prompt(input);
  return {
    output: result.output!,
    usage: result.usage,
    model: result.model,
  };
}

const prompt = ai.definePrompt({
  name: 'regenerateFieldPrompt',
  input: { schema: RegenerateFieldInputSchema },
  output: { schema: RegenerateFieldOutputSchema, format: 'json' },
  model: MODEL_GENERATION,
  prompt: regenerateFieldPromptText,
});

ai.defineFlow(
  {
    name: 'regenerateFieldFlow',
    inputSchema: RegenerateFieldInputSchema,
    outputSchema: RegenerateFieldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
