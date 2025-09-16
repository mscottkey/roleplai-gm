'use server';

/**
 * @fileOverview Flow for generating a detailed campaign structure based on the initial setting and characters.
 *
 * - generateCampaignStructure - A function that builds out the campaign web.
 * - GenerateCampaignStructureInput - The input type for the generateCampaignStructure function.
 * - GenerateCampaignStructureOutput - The return type for the generateCampaignStructure function.
 */

import {ai} from '@/ai/genkit';
import {
  CampaignStructureSchema,
  GenerateCampaignStructureInputSchema,
  type GenerateCampaignStructureInput,
  type GenerateCampaignStructureOutput,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';

export async function generateCampaignStructure(input: GenerateCampaignStructureInput): Promise<GenerateCampaignStructureOutput> {
  return generateCampaignStructureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCampaignStructurePrompt',
  input: {schema: GenerateCampaignStructureInputSchema},
  output: {schema: CampaignStructureSchema},
  model: MODEL_GENERATION,
  prompt: `You are an expert Game Master and narrative designer specializing in the Fate Core system. Your task is to flesh out a compelling campaign starter based on the provided setting, tone, and player characters. Use the "situation web" model, not a linear plot.

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}})
  - Archetype: {{this.archetype}}
  - Aspect: "{{this.aspect}}"
  - Description: {{this.description}}
{{/each}}

## Your Task
Based on the provided information, generate a structured campaign object. Follow these instructions precisely:

1.  **Campaign Issues (2):** Create two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict.
2.  **Campaign Aspects (3-5):** Define 3 to 5 overarching Fate Aspects for the campaign world. These should be things you can compel to introduce complications. Make them evocative and relevant to the characters and setting.
3.  **Factions (2-3):** Design 2 or 3 key factions or looming threats. For each faction:
    *   Provide a name and a one-sentence description.
    *   Create a 4-step "Project Clock" with a clear objective. For each step of the clock, write a short sentence describing what happens if the players ignore this faction and their clock advances.
4.  **Nodes (5-7):** Create a web of 5 to 7 interconnected situation nodes (these can be people, places, or problems). For each node:
    *   **Title:** A clear, evocative name (e.g., "The Rustgate Smugglers' Den," "Councilwoman Valerius's Secret").
    *   **Description:** A one-paragraph description of the situation at this node.
    *   **isStartingNode:** Designate **exactly one** node as the starting point for the campaign by setting this to \`true\`. This should be the most logical and exciting entry point for the created party. All other nodes must have this set to \`false\`.
    *   **Leads:** List 2-3 other nodes that this node provides clear leads to. This creates the "web."
    *   **Stakes:** Briefly describe what changes if the PCs succeed, fail, or get delayed at this node. Focus on consequences, not specific paths.
    *   **Faces (1-2):** Name 1 or 2 key NPCs at this node, each with a one-sentence descriptor.
    *   **Aspects (2):** Provide two Fate Aspects specific to this node.

Ensure the entire output is a single, valid JSON object that conforms to the schema.
`,
});

const generateCampaignStructureFlow = ai.defineFlow(
  {
    name: 'generateCampaignStructureFlow',
    inputSchema: GenerateCampaignStructureInputSchema,
    outputSchema: CampaignStructureSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
