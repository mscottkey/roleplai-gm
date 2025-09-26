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
  GenerateCampaignStructureInputSchema,
  GenerateFactionsInputSchema,
  GenerateNodesInputSchema,
  NodeSchema,
} from '@/ai/schemas/campaign-structure-schemas';
import { MODEL_GENERATION } from '../models';
import {z} from 'zod';
import { unifiedClassify } from './unified-classify';
import { 
  generateCampaignCorePromptText, 
  generateCampaignFactionsPromptText, 
  generateCampaignNodesPromptText 
} from '../prompts/generate-campaign-pieces-prompts';
import { SETTING_EXAMPLES } from '@/lib/setting-examples';

// Flow 1: Generate Core Concepts
export const generateCampaignCore = ai.defineFlow(
  {
    name: 'generateCampaignCore',
    inputSchema: GenerateCampaignStructureInputSchema,
    outputSchema: CampaignCoreSchema,
  },
  async (input) => {
    console.log('DEBUG: Input to generateCampaignCore flow:');
    console.log('Setting:', input.setting);
    console.log('Tone:', input.tone);
    
    const classification = await unifiedClassify({
      setting: input.setting,
      tone: input.tone,
      gameContext: { isFirstClassification: true }
    });
    
    const settingCategory = classification.settingClassification?.category || 'generic';
    console.log(`Setting classified as: ${settingCategory} (confidence: ${classification.settingClassification?.confidence})`);

    const examples = SETTING_EXAMPLES[settingCategory];
    
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
    const classification = await unifiedClassify({
      setting: input.setting,
      tone: input.tone
    });
    
    const settingCategory = classification.settingClassification?.category || 'generic';
    console.log(`Factions generation using genre: ${settingCategory}`);
    
    const examples = SETTING_EXAMPLES[settingCategory];

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
    const classification = await unifiedClassify({
      setting: input.setting,
      tone: input.tone
    });
    
    const settingCategory = classification.settingClassification?.category || 'generic';
    console.log(`Nodes generation using genre: ${settingCategory}`);

    const examples = SETTING_EXAMPLES[settingCategory];
    
    const { output } = await ai.generate({
      model: MODEL_GENERATION,
      prompt: generateCampaignNodesPromptText,
      input: {
        ...input,
        genreDescription: examples.description,
      },
      output: {
        format: 'json',
        schema: z.array(NodeSchema),
      },
    });
    return output!;
  }
);