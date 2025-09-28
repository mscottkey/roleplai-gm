

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
  type GenerateCampaignCoreInput,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';
import {z} from 'genkit';
import { 
  generateCampaignCorePromptText, 
  generateCampaignFactionsPromptText, 
  generateCampaignNodesPromptText 
} from '../prompts/generate-campaign-pieces-prompts';
import { randomUUID } from 'crypto';


// Step 1: Generate Core Concepts
export async function generateCampaignCore(input: GenerateCampaignCoreInput) {
    const result = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignCorePromptText,
      input: input,
      output: {
        format: 'json',
        schema: CampaignCoreSchema,
      },
      retries: 2,
    });
    
    if (!result.output) {
      throw new Error('AI failed to generate campaign core concepts.');
    }
    return result;
}

// Step 2: Generate Factions
export async function generateCampaignFactions(input: z.infer<typeof GenerateFactionsInputSchema>) {
    const result = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignFactionsPromptText,
      input: input,
      output: {
        format: 'json',
        schema: z.array(FactionSchema),
      },
      retries: 2,
    });

    if (!result.output || result.output.length === 0) {
      throw new Error('AI failed to generate campaign factions.');
    }
    return result;
}

// Step 3: Generate Nodes
export async function generateCampaignNodes(input: z.infer<typeof GenerateNodesInputSchema>) {
    const NodeGenerationSchema = NodeSchema.omit({ id: true });
    
    const result = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignNodesPromptText,
      input: input,
      output: {
        format: 'json',
        schema: z.array(NodeGenerationSchema),
      },
      retries: 2,
    });

    const output = result.output;

    if (!output || output.length === 0) {
      throw new Error('The AI failed to generate any campaign nodes. The campaign structure could not be built.');
    }

    const nodesWithIds = output.map(node => ({
      ...node,
      id: randomUUID(),
    }));
    
    return { ...result, output: nodesWithIds };
}
