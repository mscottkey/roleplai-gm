
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
  GenerateCampaignCoreInputSchema,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';
import {z} from 'genkit';
import { 
  generateCampaignCorePromptText, 
  generateCampaignFactionsPromptText, 
  generateCampaignNodesPromptText 
} from '../prompts/generate-campaign-pieces-prompts';
import { randomUUID } from 'crypto';
import { SETTING_EXAMPLES } from '@/lib/setting-examples';

// Step 1: Define Prompt & Flow for Core Concepts
const generateCampaignCorePrompt = ai.definePrompt({
    name: 'generateCampaignCorePrompt',
    model: MODEL_GENERATION,
    prompt: generateCampaignCorePromptText,
    inputSchema: GenerateCampaignCoreInputSchema.extend({
        genreDescription: z.string(),
        genreCampaignIssues: z.array(z.string()),
        genreCampaignAspects: z.array(z.string()),
    }),
    output: {
        format: 'json',
        schema: CampaignCoreSchema,
    },
    retries: 2,
});

export async function generateCampaignCore(input: GenerateCampaignCoreInput) {
    const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;
    
    const result = await generateCampaignCorePrompt({
        ...input,
        genreDescription: examples.description,
        genreCampaignIssues: examples.campaignIssues,
        genreCampaignAspects: examples.campaignAspects,
    });
    
    if (!result.output) {
      throw new Error('AI failed to generate campaign core concepts.');
    }
    return result;
}


// Step 2: Define Prompt & Flow for Factions
const generateCampaignFactionsPrompt = ai.definePrompt({
    name: 'generateCampaignFactionsPrompt',
    model: MODEL_GENERATION,
    prompt: generateCampaignFactionsPromptText,
    inputSchema: GenerateFactionsInputSchema.extend({
        genreDescription: z.string(),
        genreCampaignIssues: z.array(z.string()),
        genreCampaignAspects: z.array(z.string()),
    }),
    output: {
        format: 'json',
        schema: z.array(FactionSchema),
    },
    retries: 2,
});

export async function generateCampaignFactions(input: z.infer<typeof GenerateFactionsInputSchema>) {
  const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;  
  
  const result = await generateCampaignFactionsPrompt({
    ...input,
    genreDescription: examples.description,
    genreCampaignIssues: examples.campaignIssues,
    genreCampaignAspects: examples.campaignAspects,
  });

    if (!result.output || result.output.length === 0) {
      throw new Error('AI failed to generate campaign factions.');
    }
    return result;
}


// Step 3: Define Prompt & Flow for Nodes
const NodeGenerationSchema = NodeSchema.omit({ id: true });
const generateCampaignNodesPrompt = ai.definePrompt({
    name: 'generateCampaignNodesPrompt',
    model: MODEL_GENERATION,
    prompt: generateCampaignNodesPromptText,
    inputSchema: GenerateNodesInputSchema.extend({
        genreDescription: z.string(),
        genreCampaignIssues: z.array(z.string()),
        genreCampaignAspects: z.array(z.string()),
    }),
    output: {
        format: 'json',
        schema: z.array(NodeGenerationSchema),
    },
    retries: 2,
});

export async function generateCampaignNodes(input: z.infer<typeof GenerateNodesInputSchema>) {
    const examples = SETTING_EXAMPLES[input.settingCategory as keyof typeof SETTING_EXAMPLES] || SETTING_EXAMPLES.generic;
    
    const result = await generateCampaignNodesPrompt({
        ...input,
        genreDescription: examples.description,
        genreCampaignIssues: examples.campaignIssues,
        genreCampaignAspects: examples.campaignAspects,
    });

    const output = result.output;

    if (!output || output.length === 0) {
      throw new Error('The AI failed to generate any campaign nodes. The campaign structure could not be built.');
    }

    const nodesWithIds = output.map((node: z.infer<typeof NodeGenerationSchema>) => ({
      ...node,
      id: randomUUID(),
    }));
    
    return { ...result, output: nodesWithIds };
}
