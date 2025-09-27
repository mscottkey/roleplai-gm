
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

export const CampaignStructureSchema = z.object({
    campaignIssues: z.array(z.string()).length(2).describe('Two high-level, unresolved tensions for the campaign.'),
    campaignAspects: z.array(z.string()).min(3).max(5).describe('3-5 overarching Fate Aspects for the campaign world.'),
    factions: z.array(FactionSchema).min(2).max(3).describe('2-3 key factions or looming threats.'),
    nodes: z.array(NodeSchema).min(5).max(7).describe('A web of 5-7 interconnected situation nodes.'),
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

// Base input for all sub-flows now includes the settingCategory
const SubFlowInputBaseSchema = GenerateCampaignStructureInputSchema.extend({
    settingCategory: z.string(),
});

export const GenerateFactionsInputSchema = SubFlowInputBaseSchema.merge(CampaignCoreSchema);
export type GenerateFactionsInput = z.infer<typeof GenerateFactionsInputSchema>;

export const GenerateNodesInputSchema = GenerateFactionsInputSchema.extend({
    factions: z.array(FactionSchema),
});
export type GenerateNodesInput = z.infer<typeof GenerateNodesInputSchema>;
