
'use server';

/**
 * @fileOverview Orchestrates the generation of a detailed campaign structure by calling smaller, sequential AI flows.
 *
 * - generateCampaignStructure - A function that builds out the campaign web by orchestrating smaller generation flows.
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
import { generateCampaignCore, generateCampaignFactions, generateCampaignNodes } from './generate-campaign-pieces';

export async function generateCampaignStructure(input: GenerateCampaignStructureInput): Promise<GenerateCampaignStructureOutput> {
  return generateCampaignStructureFlow(input);
}

const generateCampaignStructureFlow = ai.defineFlow(
  {
    name: 'generateCampaignStructureFlow',
    inputSchema: GenerateCampaignStructureInputSchema,
    outputSchema: CampaignStructureSchema,
  },
  async (input) => {
    // Step 1: Generate the core concepts (issues and aspects)
    const coreConcepts = await generateCampaignCore(input);

    // Step 2: Generate the factions based on the core concepts
    const factions = await generateCampaignFactions({ ...input, ...coreConcepts });

    // Step 3: Generate the nodes based on the core concepts and factions
    const nodes = await generateCampaignNodes({ ...input, ...coreConcepts, factions });

    // Step 4: Assemble the final campaign structure
    const finalStructure: GenerateCampaignStructureOutput = {
      campaignIssues: coreConcepts.campaignIssues,
      campaignAspects: coreConcepts.campaignAspects,
      factions,
      nodes,
    };

    return finalStructure;
  }
);
