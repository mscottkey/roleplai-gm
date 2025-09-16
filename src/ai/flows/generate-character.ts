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
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert game master creating compelling characters for a tabletop RPG based on the Fate Core system. For each character slot, generate a unique character concept including skills and stunts.

Game Setting: {{{setting}}}
Game Tone: {{{tone}}}
{{#if existingCharacters}}
Existing Party Members (avoid creating similar characters):
{{#each existingCharacters}}
- Name: {{{this.name}}} (Role: {{{this.archetype}}}) - {{{this.description}}}
{{/each}}
{{/if}}

For each slot below, generate one character that adheres to the provided preferences. If a preference is not provided, you should generate an appropriate value for that field. The generated character should be thematically distinct from any existing party members. Ensure all generated character names are also unique.

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
- A list of 4-5 thematic skills, with ranks from +1 to +3, reflecting their archetype.
- A list of 2 unique and interesting stunts that grant a specific mechanical benefit, as per Fate Core rules.
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
