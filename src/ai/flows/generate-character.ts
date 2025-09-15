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
  prompt: `You are an expert game master creating compelling characters for a tabletop RPG. Based on the provided information, generate {{{count}}} distinct and interesting character concepts.

Game Setting: {{{setting}}}
Game Tone: {{{tone}}}

Strictly adhere to the following preferences if they are provided. If a preference is not provided, you should generate an appropriate value for that field.

{{#if gender}}Preferred Gender: {{{gender}}}{{/if}}
{{#if age}}Preferred Age: {{{age}}}{{/if}}
{{#if archetype}}Preferred Archetype: {{{archetype}}}{{/if}}

For each character, provide:
- A name.
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
