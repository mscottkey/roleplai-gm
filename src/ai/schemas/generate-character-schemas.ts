import {z} from 'genkit';

export const CharacterSchema = z.object({
    name: z.string().describe('The full name of the character.'),
    description: z.string().describe('A brief, engaging one-sentence description of the character.'),
    aspect: z.string().describe('A key concept or catch-phrase for the character, like "Cyber-enhanced muscle with a hidden heart of gold."'),
    gender: z.string().optional().describe("The character's gender."),
    age: z.string().optional().describe("The character's age (e.g., 'Young Adult', 'Veteran')."),
    archetype: z.string().optional().describe("The character's archetype or role (e.g., 'Healer', 'Rogue')."),
    stats: z.record(z.any()).optional().describe("A flexible object to hold system-specific character mechanics, such as skills, stunts, attributes, etc. For Fate Core, this should contain 'skills' and 'stunts' arrays."),
    playerName: z.string().optional().describe("The name of the player controlling this character."),
});
export type Character = z.infer<typeof CharacterSchema>;


const CharacterSlotSchema = z.object({
  id: z.string().describe("A unique identifier for this character slot."),
  gender: z.string().optional().describe('A preferred gender for the character (e.g., "Female", "Non-binary").'),
  age: z.string().optional().describe('A preferred age or age range for the character (e.g., "Young Adult", "Veteran").'),
  archetype: z.string().optional().describe('A desired character archetype or role (e.g., "Healer", "Tank", "Rogue").'),
});

const ExistingCharacterSchema = z.object({
  name: z.string(),
  archetype: z.string().optional(),
  description: z.string(),
});

export const GenerateCharacterInputSchema = z.object({
  setting: z.string().describe('The game setting description.'),
  tone: z.string().describe('The game tone description.'),
  characterSlots: z.array(CharacterSlotSchema).describe('An array of character slots to be filled, each with its own optional preferences.'),
  existingCharacters: z.array(ExistingCharacterSchema).optional().describe('An optional list of existing characters in the party to ensure the new character is unique in concept.'),
});
export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

export const GenerateCharacterOutputSchema = z.object({
  characters: z.array(CharacterSchema.extend({slotId: z.string().describe("The unique ID of the slot this character was generated for.")})).describe('An array of distinct character suggestions, one for each requested slot.'),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;
