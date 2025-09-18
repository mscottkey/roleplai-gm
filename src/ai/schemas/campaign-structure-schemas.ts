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
    role: z.string().describe('The role or job of the NPC at this node (e.g., "Lead Investigator", "Security Chief", "Bartender").'),
    aspect: z.string().describe("A descriptive aspect that implies their capabilities and challenge level (e.g., 'Heavily-Armored Veteran', 'Deceptive Diplomat', 'Quick-Fingered Pickpocket')."),
    description: z.string().describe('A one-sentence description of the NPC.'),
});


const NodeSchema = z.object({
    title: z.string().describe('A clear, evocative name for the node (e.g., "The Gilded Cage Casino").'),
    description: z.string().describe('A one-paragraph description of the situation at this node.'),
    isStartingNode: z.boolean().describe('Set to true for exactly one node, which will be the campaign entry point.'),
    leads: z.array(z.string()).describe('A list of 2-3 titles of other nodes this one provides leads to.'),
    stakes: z.string().describe('What changes if the PCs succeed, fail, or get delayed here.'),
    challenges: z.array(z.string()).describe("A list of 2-3 general challenges, obstacles, or minion groups at this node (e.g., 'A squad of jumpy corporate guards', 'A flimsy, rusted catwalk')."),
    faces: z.array(FaceSchema).describe('1-2 key NPCs at this node, with their roles and aspects.'),
    aspects: z.array(z.string()).describe('Two Fate Aspects specific to this node.'),
});

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

export type GenerateCampaignStructureOutput = CampaignStructure;
