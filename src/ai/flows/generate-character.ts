
'use server';

/**
 * @fileOverview Flow for generating character suggestions for the RPG.
 *
 * - generateCharacter - A function that generates character concepts.
 * - GenerateCharacterInput - The input type for the generateCharacter function.
 * - GenerateCharacterOutput - The return type for the generateCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateCharacterInputSchema, GenerateCharacterOutputSchema, SingleCharacterInputSchema, CharacterSchema, type GenerateCharacterInput, type GenerateCharacterOutput } from '@/ai/schemas/generate-character-schemas';
import { MODEL_GENERATION } from '../models';
import { generateSingleCharacterPromptText } from '../prompts/generate-character-prompt';
import type { GenerationUsage } from 'genkit';

type GenerateCharacterResponse = {
  output: GenerateCharacterOutput;
  usage: GenerationUsage;
  model: string;
};

export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterResponse> {
  const flowResult = await generateCharacterFlow(input);
  // This flow is more complex, so we manually aggregate usage.
  // Note: This is a simplification. A real implementation might need more robust usage tracking across multiple calls.
  const usage: GenerationUsage = {
    inputTokens: flowResult.totalInputTokens || 0,
    outputTokens: flowResult.totalOutputTokens || 0,
    totalTokens: (flowResult.totalInputTokens || 0) + (flowResult.totalOutputTokens || 0),
  };

  return {
    output: { characters: flowResult.characters },
    usage,
    model: MODEL_GENERATION, // Returning the base model as we can't get it per-call easily here
  };
}

const prompt = ai.definePrompt({
  name: 'generateSingleCharacterPrompt',
  input: {schema: SingleCharacterInputSchema},
  output: {schema: CharacterSchema},
  model: MODEL_GENERATION,
  prompt: generateSingleCharacterPromptText,
  retries: 2,
});

const generateCharacterFlow = ai.defineFlow(
  {
    name: 'generateCharacterFlow',
    inputSchema: GenerateCharacterInputSchema,
    outputSchema: z.object({
      characters: z.array(CharacterSchema.extend({slotId: z.string()})),
      totalInputTokens: z.number().optional(),
      totalOutputTokens: z.number().optional(),
    })
  },
  async (input) => {
    const generatedCharacters = [];
    const existingForPrompt = [...(input.existingCharacters || [])];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const slot of input.characterSlots) {
        const result = await prompt({
            setting: input.setting,
            tone: input.tone,
            existingCharacters: existingForPrompt,
            ...slot
        });

        if (result.output) {
            generatedCharacters.push({
                ...result.output,
                slotId: slot.id, // Manually add the slotId back
            });
            existingForPrompt.push({
                name: result.output.name,
                archetype: result.output.archetype,
                description: result.output.description,
            });
        }
        totalInputTokens += result.usage.inputTokens;
        totalOutputTokens += result.usage.outputTokens;
    }
    
    return { characters: generatedCharacters, totalInputTokens, totalOutputTokens };
  }
);
