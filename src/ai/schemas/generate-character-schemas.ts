
import {z} from 'genkit';

export const SkillSchema = z.object({
  name: z.string().describe('The name of the skill.'),
  rank: z.number().int().describe('The numerical rank or bonus for the skill.'),
});
export type Skill = z.infer<typeof SkillSchema>;

export const StuntSchema = z.object({
  name: z.string().describe('The name of the stunt or special ability.'),
  description: z.string().describe('The mechanical description of what the stunt does.'),
});
export type Stunt = z.infer<typeof StuntSchema>;

const CharacterStatsSchema = z.object({
  skills: z.array(SkillSchema).describe("An array of the character's skills, each with a name and rank."),
  stunts: z.array(StuntSchema).describe("An array of the character's stunts or special abilities."),
}).describe("A flexible object to hold system-specific character mechanics.");
export type CharacterStats = z.infer<typeof CharacterStatsSchema>;


export const CharacterSchema = z.object({
    id: z.string().describe('A unique identifier for the character.'),
    name: z.string().describe('The full name of the character.'),
    description: z.string().describe('A brief, engaging one-sentence description of the character.'),
    aspect: z.string().describe('A key concept or catch-phrase for the character, like "Cyber-enhanced muscle with a hidden heart of gold."'),
    gender: z.string().optional().describe("The character's gender."),
    age: z.string().optional().describe("The character's age (e.g., 'Young Adult', 'Veteran')."),
    archetype: z.string().optional().describe("The character's archetype or role (e.g., 'Healer', 'Rogue')."),
    stats: CharacterStatsSchema,
    playerName: z.string().optional().describe("The name of the player controlling this character."),
});
export type Character = z.infer<typeof CharacterSchema>;


const CharacterSlotSchema = z.object({
  id: z.string().describe("A unique identifier for this character slot."),
  name: z.string().optional().describe("A preferred name for the character."),
  vision: z.string().optional().describe("A player-provided vision or concept for the character."),
  gender: z.string().optional().describe('A preferred gender for the character (e.g., "Female", "Non-binary").'),
  age: z.string().optional().describe('A preferred age or age range for the character (e.g., "Young Adult", "Veteran").'),
  archetype: z.string().optional().describe('A desired character archetype or role (e.g., "Healer", "Tank", "Rogue").'),
});

const ExistingCharacterSchema = z.object({
  name: z.string(),
  archetype: z.string().optional(),
  description: z.string(),
});

export const SingleCharacterInputSchema = CharacterSlotSchema.extend({
  setting: z.string().describe('The game setting description.'),
  tone: z.string().describe('The game tone description.'),
  existingCharacters: z.array(ExistingCharacterSchema).optional().describe('An optional list of existing characters in the party to ensure the new character is unique in concept.'),
});

export const GenerateCharacterInputSchema = z.object({
  setting: z.string().describe('The game setting description.'),
  tone: z.string().describe('The game tone description.'),
  characterSlots: z.array(CharacterSlotSchema).describe('An array of character slots to be filled, each with its own optional preferences.'),
  existingCharacters: z.array(ExistingCharacterSchema).optional().describe('An optional list of existing characters in the party to ensure the new character is unique in concept.'),
});
export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

export const GenerateCharacterOutputSchema = z.object({
  characters: z.array(CharacterSchema.extend({slotId: z.string()})).describe('An array of distinct character suggestions, one for each requested slot.'),
});
export type GenerateCharacterOutput = z.infer<typeof GenerateCharacterOutputSchema>;
