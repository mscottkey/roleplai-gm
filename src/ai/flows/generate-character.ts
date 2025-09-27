
'use server';

/**
 * @fileOverview Flow for generating character suggestions for the RPG.
 *
 * - generateCharacter - A function that generates character concepts.
 * - GenerateCharacterInput - The input type for the generateCharacter function.
 * - GenerateCharacterOutput - The return type for the generateCharacter function.
 */

import {ai} from '@/ai/genkit';
import { GenerateCharacterInputSchema, GenerateCharacterOutputSchema, SingleCharacterInputSchema, CharacterSchema, type GenerateCharacterInput, type GenerateCharacterOutput } from '@/ai/schemas/generate-character-schemas';
import { MODEL_GENERATION } from '../models';
import { generateSingleCharacterPromptText } from '../prompts/generate-character-prompt';


export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  return generateCharacterFlow(input);
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
    outputSchema: GenerateCharacterOutputSchema,
  },
  async (input) => {
    const generatedCharacters = [];
    const existingForPrompt = [...(input.existingCharacters || [])];

    for (const slot of input.characterSlots) {
        const { output: newChar } = await prompt({
            setting: input.setting,
            tone: input.tone,
            existingCharacters: existingForPrompt,
            ...slot
        });

        if (newChar) {
            generatedCharacters.push({
                ...newChar,
                slotId: slot.id, // Manually add the slotId back
            });
            // Add the newly generated character to the list for the next iteration
            // to ensure diversity within the newly generated party.
            existingForPrompt.push({
                name: newChar.name,
                archetype: newChar.archetype,
                description: newChar.description,
            });
        }
    }
    
    return { characters: generatedCharacters };
  }
);
