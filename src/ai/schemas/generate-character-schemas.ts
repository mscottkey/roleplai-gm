import {z} from 'genkit';

export const CharacterSchema = z.object({
    name: z.string().describe('The full name of the character.'),
    description: z.string().describe('A brief, engaging one-sentence description of the character.'),
    aspect: z.string().describe('A key concept or catch-phrase for the character, like "Cyber-enhanced muscle with a hidden heart of gold."'),
});
export type Character = z.infer<typeof CharacterSchema>;


export const GenerateCharacterInputSchema = z.object({
  setting: z.string().describe('The game setting description.'),
  tone: z.string().describe('The game tone description.'),
});
export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

export const GenerateCharacterOutputSchema = z.object({
  characters: z.array(CharacterSchema).length(3).describe('An array of three distinct character suggestions.'),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;
