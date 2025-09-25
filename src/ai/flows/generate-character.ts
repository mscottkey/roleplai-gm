
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


export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
  return generateCharacterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSingleCharacterPrompt',
  input: {schema: SingleCharacterInputSchema},
  output: {schema: CharacterSchema},
  model: MODEL_GENERATION,
  prompt: `You are an expert game master creating a compelling character for a tabletop RPG based on the Fate Core system. Generate a unique character concept including skills and stunts.

Game Setting: {{{setting}}}
Game Tone: {{{tone}}}
{{#if existingCharacters}}
Existing Party Members (avoid creating a similar character):
{{#each existingCharacters}}
- Name: {{{this.name}}} (Role: {{{this.archetype}}}) - {{{this.description}}}
{{/each}}
{{/if}}

Generate one character that adheres to the provided preferences. If a preference is not provided, you should generate an appropriate value for that field. The generated character should be thematically distinct from any existing party members.

Provide:
- A unique name. If a 'Preferred Name' is given and is not empty, you MUST use it. Otherwise, generate a diverse name appropriate to the game's setting and avoid using common or repeated names.
- A one-sentence description.
- A core aspect.
- The character's pronouns (e.g., "She/Her", "He/Him", "They/Them").
- An age (e.g., "Young Adult", "Middle-Aged", "Elderly", "Ancient").
- An archetype or role (e.g., "Scout," "Face," "Bruiser," "Mage").
- A \`stats\` object containing the character's game mechanics. For the Fate Core system, this object MUST contain:
  - A 'skills' property: an array of exactly 6 skills, distributed in a pyramid: one skill at rank 3 (Good), two skills at rank 2 (Fair), and three skills at rank 1 (Average). The skills should be thematic to the character's archetype.
  - A 'stunts' property: an array of 2 unique and interesting stunt objects, each with a 'name' and a 'description' that grants a specific mechanical benefit, as per Fate Core rules.

Preferences:
{{#if playerName}}Player Name: {{{playerName}}}{{/if}}
{{#if name}}Preferred Character Name: {{{name}}}{{/if}}
{{#if vision}}Character Vision: {{{vision}}}{{/if}}
{{#if pronouns}}Preferred Pronouns: {{{pronouns}}}{{/if}}
{{#if age}}Preferred Age: {{{age}}}{{/if}}
{{#if archetype}}Preferred Archetype: {{{archetype}}}{{/if}}
`,
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
