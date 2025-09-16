import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';
import { FactionSchema } from './campaign-structure-schemas';

export const PlaceSchema = z.object({
    name: z.string().describe('The name of the location.'),
    description: z.string().describe('A brief description of the location.'),
});
export type Place = z.infer<typeof PlaceSchema>;

export const WorldStateSchema = z.object({
  summary: z.string().describe("A high-level summary of the adventure so far."),
  storyOutline: z.array(z.string()).describe("A list of potential future scenes or plot points. The GM's plan."),
  recentEvents: z.array(z.string()).describe("A list of the last few significant events to maintain short-term context."),
  characters: z.array(CharacterSchema).describe("The player characters in the game."),
  places: z.array(PlaceSchema).describe("A list of all significant places in the world, discovered or not."),
  storyAspects: z.array(z.string()).describe("A list of key, recurring concepts, themes, or non-player entities in the story."),
  knownPlaces: z.array(PlaceSchema).optional().describe("A list of significant places the players have discovered."),
  knownFactions: z.array(FactionSchema).optional().describe("A list of factions the players have discovered."),
});
export type WorldState = z.infer<typeof WorldStateSchema>;


export const PlayerActionSchema = z.object({
    characterName: z.string(),
    action: z.string(),
});

export const UpdateWorldStateInputSchema = z.object({
  worldState: WorldStateSchema.describe("The current state of the world before the action."),
  playerAction: PlayerActionSchema.describe("The action taken by the player."),
  gmResponse: z.string().describe("The GM's narration of the outcome."),
});
export type UpdateWorldStateInput = z.infer<typeof UpdateWorldStateInputSchema>;

export const UpdateWorldStateOutputSchema = WorldStateSchema;
export type UpdateWorldStateOutput = z.infer<typeof UpdateWorldStateOutputSchema>;
