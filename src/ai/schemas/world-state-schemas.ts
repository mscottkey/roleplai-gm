
import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';
import { CampaignStructureSchema, FactionSchema, NodeSchema, CampaignResolutionSchema } from './campaign-structure-schemas';

export const PlaceSchema = z.object({
    name: z.string().describe('The name of the location.'),
    description: z.string().describe('A brief description of the location.'),
});
export type Place = z.infer<typeof PlaceSchema>;

const SceneSchema = z.object({
    nodeId: z.string().describe("The ID of the current story node."),
    name: z.string().describe("The party's current, specific location (e.g., 'The Dragon's Tooth Tavern', 'Blackwood Forest - Western Edge')."),
    description: z.string().describe("A 2-3 sentence description of the immediate surroundings, focusing on sensory details."),
    presentCharacters: z.array(z.string()).describe("A list of IDs of player characters currently in the scene."),
    presentNPCs: z.array(z.string()).describe("A list of names of non-player characters currently in the scene."),
    environmentalFactors: z.array(z.string()).describe("A list of any active environmental effects or conditions (e.g., 'Heavy Rain', 'Magical Darkness', 'Unstable Ground')."),
    connections: z.array(z.string()).describe("A list of names of directly adjacent or reachable known places from the current location."),
});

const NodeStateSchema = z.object({
  discoveryLevel: z.enum(['unknown', 'rumored', 'visited', 'explored', 'resolved']).default('unknown'),
  playerKnowledge: z.array(z.string()).describe('Specific facts or clues the players have learned about this node.'),
  revealedSecrets: z.array(z.string()).describe('A list of IDs of secrets that have been revealed.'),
  currentState: z.string().optional().describe("If the node has evolved, this describes its current state."),
});
export type NodeState = z.infer<typeof NodeStateSchema>;

export const WorldStateSchema = z.object({
  summary: z.string().describe("A high-level summary of the adventure so far."),
  storyOutline: z.array(z.string()).describe("A list of potential future scenes or plot points. The GM's plan."),
  recentEvents: z.array(z.string()).describe("A list of the last few significant events to maintain short-term context."),
  characters: z.array(CharacterSchema).describe("The player characters in the game."),
  places: z.array(PlaceSchema).describe("A list of all significant places in the world, discovered or not."),
  storyAspects: z.array(z.string()).describe("A list of key, recurring concepts, themes, or non-player entities in the story."),
  knownPlaces: z.array(PlaceSchema).describe("A list of significant places the players have discovered."),
  knownFactions: z.array(FactionSchema).describe("A list of factions the players have discovered."),
  currentScene: SceneSchema.describe("Details about the party's immediate scene."),
  settingCategory: z.string().optional().describe('The pre-classified genre category of the setting (e.g., "sci_fi_cyberpunk").'),
  nodeStates: z.record(z.string(), NodeStateSchema).optional().describe('A map of nodeId to its current dynamic state (discovery level, known secrets).'),
  resolution: CampaignResolutionSchema.optional().describe('The dynamic state of the campaign\'s endgame.'),
  factions: z.array(FactionSchema).optional().describe('The dynamic state of the campaign\'s factions and their clocks.'),
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
  campaignStructure: CampaignStructureSchema.describe("The static campaign structure, including all nodes and secrets."),
});
export type UpdateWorldStateInput = z.infer<typeof UpdateWorldStateInputSchema>;

export const UpdateWorldStateOutputSchema = WorldStateSchema;
export type UpdateWorldStateOutput = z.infer<typeof UpdateWorldStateOutputSchema>;
