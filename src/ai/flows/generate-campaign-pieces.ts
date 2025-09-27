

'use server';

/**
 * @fileOverview Contains the smaller, decomposed flows for generating pieces of the campaign structure.
 * This is done to avoid server timeouts on a single, large generation request.
 *
 * - generateCampaignCore - Generates the high-level issues and aspects.
 * - generateCampaignFactions - Generates the main factions and threats.
 * - generateCampaignNodes - Generates the interconnected situation nodes.
 */

import {ai} from '@/ai/genkit';
import {
  CampaignCoreSchema,
  FactionSchema,
  GenerateFactionsInputSchema,
  GenerateNodesInputSchema,
  NodeSchema,
  type GenerateCampaignStructureInput,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';
import {z} from 'genkit';
import { 
  generateCampaignCorePromptText, 
  generateCampaignFactionsPromptText, 
  generateCampaignNodesPromptText 
} from '../prompts/generate-campaign-pieces-prompts';
import { SETTING_EXAMPLES } from '@/lib/setting-examples';
import { randomUUID } from 'crypto';


type GenerateCampaignCoreInput = GenerateCampaignStructureInput & { settingCategory: string };

// Flow 1: Generate Core Concepts
export const generateCampaignCore = ai.defineFlow(
  {
    name: 'generateCampaignCore',
    inputSchema: z.custom<GenerateCampaignCoreInput>(),
    outputSchema: CampaignCoreSchema,
  },
  async (input) => {
    const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;
    
    const { output } = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignCorePromptText,
      input: {
        ...input,
        genreDescription: examples.description,
        genreCampaignIssues: examples.campaignIssues,
        genreCampaignAspects: examples.campaignAspects,
      },
      output: {
        format: 'json',
        schema: CampaignCoreSchema,
      },
      retries: 2,
    });
    
    return output!;
  }
);

// Flow 2: Generate Factions
export const generateCampaignFactions = ai.defineFlow(
  {
    name: 'generateCampaignFactions',
    inputSchema: GenerateFactionsInputSchema,
    outputSchema: z.array(FactionSchema),
  },
  async (input) => {
    const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;

    const { output } = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignFactionsPromptText,
      input: {
        ...input,
        genreDescription: examples.description,
      },
      output: {
        format: 'json',
        schema: z.array(FactionSchema),
      },
      retries: 2,
    });
    return output!;
  }
);

// Flow 3: Generate Nodes
export const generateCampaignNodes = ai.defineFlow(
  {
    name: 'generateCampaignNodes',
    inputSchema: GenerateNodesInputSchema,
    outputSchema: z.array(NodeSchema),
  },
  async (input) => {
    const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;
    
    // Define the schema for the AI's output, excluding the 'id' field which we'll generate.
    const NodeGenerationSchema = NodeSchema.omit({ id: true });
    
    const { output } = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignNodesPromptText,
      input: {
        ...input,
        genreDescription: examples.description,
      },
      output: {
        format: 'json',
        schema: z.array(NodeGenerationSchema),
      },
      retries: 2,
    });

    if (!output || output.length === 0) {
      throw new Error('The AI failed to generate any campaign nodes. The campaign structure could not be built.');
    }

    // Manually add UUIDs to each node after generation
    const nodesWithIds = output.map(node => ({
      ...node,
      id: randomUUID(),
    }));
    
    return nodesWithIds;
  }
);
