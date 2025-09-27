
'use server';

/**
 * @fileOverview Orchestrates the generation of a detailed campaign structure by calling smaller, sequential AI flows.
 * This flow is the main entry point for creating a campaign. It is now just an orchestrator.
 * - generateCampaignStructure - A function that builds out the campaign web by orchestrating smaller generation flows.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateCampaignStructureInputSchema,
  GenerateCampaignStructureOutputSchema,
  type GenerateCampaignStructureInput,
  type GenerateCampaignStructureOutput,
} from '@/ai/schemas/campaign-structure-schemas';
import { generateCampaignCore, generateCampaignFactions, generateCampaignNodes } from './generate-campaign-pieces';
import { generateCampaignResolution } from './generate-campaign-resolution';
import { unifiedClassify } from './unified-classify';

export async function generateCampaignStructure(input: GenerateCampaignStructureInput): Promise<GenerateCampaignStructureOutput> {
  return generateCampaignStructureFlow(input);
}

const generateCampaignStructureFlow = ai.defineFlow(
  {
    name: 'generateCampaignStructureFlow',
    inputSchema: GenerateCampaignStructureInputSchema,
    outputSchema: GenerateCampaignStructureOutputSchema,
  },
  async (input) => {
    // Step 1: Classify the setting to get the genre category.
    const classification = await unifiedClassify({
        setting: input.setting,
        tone: input.tone,
        gameContext: { isFirstClassification: true }
    });
    const settingCategory = classification.settingClassification?.category || 'generic';

    // Step 2: Generate the core concepts (issues and aspects)
    const coreConcepts = await generateCampaignCore({ ...input, settingCategory });

    // Step 3: Generate the factions based on the core concepts
    const factions = await generateCampaignFactions({ ...input, ...coreConcepts, settingCategory });

    // Step 4: Generate the nodes based on the core concepts and factions
    const nodes = await generateCampaignNodes({ ...input, ...coreConcepts, factions, settingCategory });
    
    // Step 5: Generate the resolution structure based on all previous data
    const resolution = await generateCampaignResolution({ ...input, ...coreConcepts, factions, nodes, settingCategory });

    // Step 6: Assemble the final campaign structure
    const finalStructure: GenerateCampaignStructureOutput = {
      campaignIssues: coreConcepts.campaignIssues,
      campaignAspects: coreConcepts.campaignAspects,
      factions,
      nodes,
      resolution,
      settingCategory,
    };

    return finalStructure;
  }
);
