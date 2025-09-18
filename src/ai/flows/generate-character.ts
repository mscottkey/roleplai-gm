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
import { MODEL_GENERATION } from '../models';


export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  return generateCharacterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterPrompt',
  input: {schema: GenerateCharacterInputSchema},
  output: {schema: GenerateCharacterOutputSchema},
  model: MODEL_GENERATION,
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
  {{#if this.name}}Preferred Name: {{{this.name}}}{{/if}}
  {{#if this.vision}}Character Vision: {{{this.vision}}}{{/if}}
  {{#if this.gender}}Preferred Gender: {{{this.gender}}}{{/if}}
  {{#if this.age}}Preferred Age: {{{this.age}}}{{/if}}
  {{#if this.archetype}}Preferred Archetype: {{{this.archetype}}}{{/if}}
{{/each}}

For each character, provide:
- A unique name. If a 'Preferred Name' is given, you MUST use it.
- The original \`slotId\` from the input.
- A one-sentence description.
- A core aspect.
- A gender.
- An age (e.g., "Young Adult", "Middle-Aged", "Elderly", "Ancient").
- An archetype or role (e.g., "Scout," "Face," "Bruiser," "Mage").
- A \`stats\` object containing the character's game mechanics. For the Fate Core system, this object MUST contain:
  - A 'skills' property: an array of exactly 6 skills, distributed in a pyramid: one skill at rank 3 (Good), two skills at rank 2 (Fair), and three skills at rank 1 (Average). The skills should be thematic to the character's archetype.
  - A 'stunts' property: an array of 2 unique and interesting stunt objects, each with a 'name' and a 'description' that grants a specific mechanical benefit, as per Fate Core rules.
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
