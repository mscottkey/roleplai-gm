

import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';


const FactionClockSchema = z.object({
    value: z.number().int().min(0).max(4).describe('The current progress of the clock, starting at 0.'),
    max: z.number().int().default(4).describe('The maximum value of the clock.'),
    objective: z.string().describe('What the faction achieves if the clock is filled.'),
    steps: z.array(z.string()).length(4).describe('An array of 4 strings, where each string describes what happens as the clock ticks from 1 to 4.')
});

export const FactionSchema = z.object({
    name: z.string().describe('The name of the faction or threat.'),
    description: z.string().describe('A one-sentence description of the faction.'),
    clock: FactionClockSchema.describe("The faction's project clock."),
});
export type Faction = z.infer<typeof FactionSchema>;

const FaceSchema = z.object({
    name: z.string().describe('The name of the NPC.'),
    role: z.string().describe('The role or job of the NPC at this node (e.g., "Merchant", "Guard Captain").'),
    aspect: z.string().describe("A descriptive aspect that implies their capabilities and personality (e.g., 'Deceptively Honest', 'Haunted by the Past')."),
    description: z.string().describe('A one-sentence description of the NPC.'),
});

const SecretSchema = z.object({
    id: z.string().describe('A short, unique identifier for the secret (e.g., "secret-altar", "hidden-ledger").'),
    trigger: z.string().describe('A description of the player action or condition that would reveal this secret.'),
    revelation: z.string().describe('The information that is learned when the secret is discovered.'),
    impact: z.string().describe('A brief explanation of how this revelation changes the story or opens up new possibilities.'),
});

export const NodeSchema = z.object({
    id: z.string().describe('A unique identifier for this node.'),
    title: z.string().describe('A clear, evocative name for the situation or location.'),
    description: z.string().describe('A one-paragraph description of the situation at this node.'),
    isStartingNode: z.boolean().describe('Set to true for exactly one node, which will be the campaign entry point.'),
    leads: z.array(z.string()).describe('A list of 2-3 titles of other nodes this one provides leads to.'),
    stakes: z.string().describe('What changes if the PCs succeed, fail, or get delayed here.'),
    challenges: z.array(z.string()).describe("A list of 2-3 general challenges or obstacles at this node."),
    faces: z.array(FaceSchema).describe('1-2 key NPCs at this node, with their roles and aspects.'),
    aspects: z.array(z.string()).describe('Two Fate Aspects specific to this node.'),
    hiddenAgenda: z.string().optional().describe("The true nature of this location or situation, what's really going on beneath the surface."),
    secrets: z.array(SecretSchema).optional().describe("A list of hidden secrets in this node, each with a trigger and a revelation."),
});
export type Node = z.infer<typeof NodeSchema>;

export const CampaignResolutionSchema = z.object({
  primaryObjective: z.string().describe('The main goal the players must achieve to "win" the campaign.'),
  hiddenTruth: z.string().describe('The secret, underlying story or context that re-frames the entire campaign.'),
  victoryConditions: z.array(z.object({
    id: z.string().describe('A unique ID for this condition.'),
    description: z.string().describe('A specific condition that must be met.'),
    achieved: z.boolean().describe('Whether this condition has been met.'),
  })).describe('A list of major objectives that contribute to the final victory.'),
  convergenceTriggers: z.array(z.object({
    condition: z.string().describe('A world-state condition that, when met, triggers a step towards the endgame.'),
    triggered: z.boolean().describe('Whether this trigger has been activated.'),
    result: z.string().describe('The narrative result of this trigger activating.'),
  })).describe('Events that advance the world towards its final climax.'),
  climaxReady: z.boolean().describe('Becomes true when enough triggers have been activated.'),
  climaxLocation: z.string().optional().describe('The location of the final confrontation.'),
  involvedFactions: z.array(z.string()).describe('The factions central to the endgame.'),
});
export type CampaignResolution = z.infer<typeof CampaignResolutionSchema>;

export const StoryBeatSchema = z.object({
    beat: z.number().int().min(1).max(20).describe('The beat number within the session, 1-20.'),
    intensity: z.number().int().min(1).max(5).describe('The narrative intensity of the beat, from 1 (calm) to 5 (high crisis).'),
    trigger: z.string().describe('A concrete and specific condition that causes this beat to happen or end.'),
    beatType: z.enum(["exploration", "investigation", "confrontation", "revelation", "crisis"]).describe('The type of this story beat.'),
    expectedFactionAdvancement: z.string().describe('Which faction clock should advance.'),
    suggestedLocation: z.string().describe('Recommended node for this beat.'),
    description: z.string().describe('What should happen during this beat.'),
    isFlexible: z.boolean().describe('Can this beat be skipped/modified if the session ends early.'),
    isPotentialSessionBreak: z.boolean().optional().describe('True if this beat is a natural and satisfying stopping point for a game session.'),
});

export const SessionProgressSchema = z.object({
    currentSession: z.number().int().min(1).default(1).describe('The current session number, starting at 1.'),
    currentBeat: z.number().int().min(0).default(0).describe('The current beat number within the session.'),
    beatsCompleted: z.number().int().min(0).default(0).describe('The number of beats completed in the current session.'),
    beatsPlanned: z.number().int().min(0).default(0).describe('The number of beats originally planned for the current session.'),
    sessionComplete: z.boolean().default(false).describe('Whether the current session has reached a natural conclusion.'),
    interruptedMidBeat: z.boolean().default(false).describe('Whether the session ended unexpectedly in the middle of a beat.'),
    readyForNextSession: z.boolean().default(false).describe('Whether the system is ready to generate beats for the next session.'),
});
export type SessionProgress = z.infer<typeof SessionProgressSchema>;

export const CampaignStructureSchema = z.object({
    campaignIssues: z.array(z.string()).length(2).describe('Two high-level, unresolved tensions for the campaign.'),
    campaignAspects: z.array(z.string()).min(3).max(5).describe('3-5 overarching Fate Aspects for the campaign world.'),
    factions: z.array(FactionSchema).min(2).max(3).describe('2-3 key factions or looming threats.'),
    nodes: z.array(NodeSchema).min(5).max(7).describe('A web of 5-7 interconnected situation nodes.'),
    resolution: CampaignResolutionSchema.optional().nullable().describe("The overarching endgame structure and victory conditions."),
    currentSessionBeats: z.array(StoryBeatSchema).optional().describe("The narrative beats planned for the current session."),
});
export type CampaignStructure = z.infer<typeof CampaignStructureSchema>;

export const GenerateCampaignStructureInputSchema = z.object({
    setting: z.string().describe("The high-level description of the game's setting."),
    tone: z.string().describe("The high-level description of the game's tone."),
    characters: z.array(CharacterSchema).describe('The finalized list of player characters in the party.'),
});
export type GenerateCampaignStructureInput = z.infer<typeof GenerateCampaignStructureInputSchema>;

export const GenerateCampaignStructureOutputSchema = CampaignStructureSchema.extend({
    settingCategory: z.string().describe("The classified genre category of the campaign setting."),
});
export type GenerateCampaignStructureOutput = z.infer<typeof GenerateCampaignStructureOutputSchema>;

// Schemas for decomposed flows
export const CampaignCoreSchema = z.object({
    campaignIssues: z.array(z.string()).length(2).describe('Two high-level, unresolved tensions for the campaign.'),
    campaignAspects: z.array(z.string()).min(3).max(5).describe('3-5 overarching Fate Aspects for the campaign world.'),
});
export type CampaignCore = z.infer<typeof CampaignCoreSchema>;

export const GenerateCampaignCoreInputSchema = GenerateCampaignStructureInputSchema.extend({
    settingCategory: z.string(),
});
export type GenerateCampaignCoreInput = z.infer<typeof GenerateCampaignCoreInputSchema>;

export const GenerateFactionsInputSchema = GenerateCampaignCoreInputSchema.merge(CampaignCoreSchema).extend({
    genreDescription: z.string().optional(),
    genreCampaignIssues: z.array(z.string()).optional(),
    genreCampaignAspects: z.array(z.string()).optional(),
});
  
export const GenerateNodesInputSchema = GenerateFactionsInputSchema.extend({
    factions: z.array(FactionSchema),
    genreDescription: z.string().optional(),
    genreCampaignIssues: z.array(z.string()).optional(),
    genreCampaignAspects: z.array(z.string()).optional(),
});
  
export type GenerateNodesInput = z.infer<typeof GenerateNodesInputSchema>;

export const GenerateResolutionInputSchema = GenerateNodesInputSchema.extend({
    nodes: z.array(NodeSchema),
});
export type GenerateResolutionInput = z.infer<typeof GenerateResolutionInputSchema>;


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
  settingCategory: z.string().nullable().describe('The pre-classified genre of the setting (e.g., "sci_fi_cyberpunk").'),
  nodeStates: z.record(z.string(), NodeStateSchema).nullable().describe('A map of nodeId to its current dynamic state (discovery level, known secrets).'),
  resolution: CampaignResolutionSchema.nullable().optional().describe('The dynamic state of the campaign\'s endgame.'),
  factions: z.array(FactionSchema).nullable().describe('The dynamic state of the campaign\'s factions and their clocks.'),
  turn: z.number().int().default(0).describe("The current turn number, incremented after each player action."),
  sessionProgress: SessionProgressSchema.nullable().optional().describe('The dynamic state of the session progression.'),
  lastActivity: z.string().datetime().optional().describe("The timestamp of the last player action."),
  idleTimeoutMinutes: z.number().int().default(120).describe("The number of minutes of inactivity before a session is automatically ended."),
  autoEndEnabled: z.boolean().default(true).describe("Whether to automatically end the session after a period of inactivity."),
  idleWarningShown: z.boolean().default(false).describe("True if the idle warning has been shown to the user."),
});
export type WorldState = z.infer<typeof WorldStateSchema>;


export const GenerateSessionBeatsInputSchema = GenerateResolutionInputSchema.extend({
    currentWorldState: WorldStateSchema.describe("The current dynamic state of the game world."),
    sessionNumber: z.number().int().min(1).describe("The session number for which to generate beats (e.g., 1 for the first session)."),
});
export type GenerateSessionBeatsInput = z.infer<typeof GenerateSessionBeatsInputSchema>;


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
