'use server';

/**
 * @fileOverview Flow for generating character suggestions for the RPG.
 *
 * - generateCharacter - A function that generates character concepts.
 * - GenerateCharacterInput - The input type for the generateCharacter function.
 * - GenerateCharacterOutput - The return type for the generateCharacter function.
 */

import {ai} from '@/ai/genkit';
import { GenerateCharacterInputSchema, GenerateCharacterOutputSchema, type GenerateCharacterInput, type GenerateCharacterOutput } from '@/ai/schemas/generate-character-schemas';


export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  return generateCharacterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterPrompt',
  input: {schema: GenerateCharacterInputSchema},
  output: {schema: GenerateCharacterOutputSchema},
  prompt: `You are an expert game master creating compelling characters for a tabletop RPG. Based on the provided information, generate a unique character for each slot defined in the \`characterSlots\` array. Ensure that all generated character names are unique within this batch.

Game Setting: {{{setting}}}
Game Tone: {{{tone}}}

For each slot below, generate one character that adheres to the provided preferences. If a preference is not provided, you should generate an appropriate value for that field. Return the original \`id\` for each slot so the characters can be matched up.

{{#each characterSlots}}
- Slot ID: {{{this.id}}}
  {{#if this.gender}}Preferred Gender: {{{this.gender}}}{{/if}}
  {{#if this.age}}Preferred Age: {{{this.age}}}{{/if}}
  {{#if this.archetype}}Preferred Archetype: {{{this.archetype}}}{{/if}}
{{/each}}

For each character, provide:
- A unique name.
- The original \`slotId\` from the input.
- A one-sentence description.
- A core aspect.
- A gender.
- An age (e.g., "Young Adult", "Middle-Aged", "Elderly", "Ancient").
- An archetype or role (e.g., "Scout," "Face," "Bruiser," "Mage").
`,
});

const generateCharacterFlow = ai.defineFlow(
  {
    name: 'generateCharacterFlow',
    inputSchema: GenerateCharacterInputSchema,
    outputSchema: GenerateCharacterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
