
import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';
import { FactionSchema } from './campaign-structure-schemas';

export const GenerateRecapInputSchema = z.object({
  recentEvents: z.array(z.string()).describe("A list of the last few significant events to maintain short-term context."),
  storyOutline: z.array(z.string()).describe("The list of current major plot points or objectives."),
  characters: z.array(CharacterSchema).describe("The player characters in the game."),
  factions: z.array(FactionSchema).optional().describe("The active factions and their current clock status."),
});
export type GenerateRecapInput = z.infer<typeof GenerateRecapInputSchema>;

export const GenerateRecapOutputSchema = z.object({
    recap: z.string().describe('A 2-3 paragraph summary of the recent events, written in a "Previously on..." style.'),
    characterReminders: z.record(z.string()).describe("A map where keys are character names and values are a short, one-sentence reminder of their personal situation or immediate goal."),
    urgentSituations: z.array(z.string()).describe("A list of the most pressing threats or time-sensitive issues facing the party, often derived from faction clocks or the story outline."),
});
export type GenerateRecapOutput = z.infer<typeof GenerateRecapOutputSchema>;
