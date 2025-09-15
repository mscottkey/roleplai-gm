import {z} from 'genkit';

export const CharacterSchema = z.object({
    name: z.string().describe('The full name of the character.'),
    description: z.string().describe('A brief, engaging one-sentence description of the character.'),
    aspect: z.string().describe('A key concept or catch-phrase for the character, like "Cyber-enhanced muscle with a hidden heart of gold."'),
    gender: z.string().optional().describe("The character's gender."),
    age: z.string().optional().describe("The character's age (e.g., 'Young Adult', 'Veteran')."),
    archetype: z.string().optional().describe("The character's archetype or role (e.g., 'Healer', 'Rogue')."),
    playerName: z.string().optional().describe("The name of the player controlling this character."),
});
export type Character = z.infer<typeof CharacterSchema>;


export const GenerateCharacterInputSchema = z.object({
  setting: z.string().describe('The game setting description.'),
  tone: z.string().describe('The game tone description.'),
  count: z.number().min(1).max(5).default(1).describe('The number of characters to generate.'),
  gender: z.string().optional().describe('A preferred gender for the character (e.g., "Female", "Non-binary").'),
  age: z.string().optional().describe('A preferred age or age range for the character (e.g., "Young Adult", "Veteran").'),
  archetype: z.string().optional().describe('A desired character archetype or role (e.g., "Healer", "Tank", "Rogue").'),
  existingNames: z.array(z.string()).optional().describe('An array of character names that already exist in the party to avoid duplicates.'),
});
export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

export const GenerateCharacterOutputSchema = z.object({
  characters: z.array(CharacterSchema).describe('An array of distinct character suggestions.'),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;
