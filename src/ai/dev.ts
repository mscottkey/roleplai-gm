
'use server';

import { ai } from '@/ai/genkit';
import { classifyInput, ClassifyInputSchema, ClassifyInputOutputSchema } from '@/ai/flows/classify-input';
import { classifySetting, ClassifySettingInputSchema, ClassifySettingOutputSchema } from '@/ai/flows/classify-setting';

import '@/ai/flows/generate-new-game.ts';
import '@/ai/flows/integrate-rules-adapter.ts';
import '@/ai/flows/narrate-player-actions.ts';
import '@/ai/flows/generate-character.ts';
import '@/ai/flows/update-world-state.ts';
import '@/ai/flows/ask-question.ts';
import '@/ai/flows/sanitize-ip.ts';
import '@/ai/flows/assess-consequences.ts';
import '@/ai/flows/generate-recap.ts';
import '@/ai/flows/regenerate-field.ts';
import '@/ai/flows/classify-input.ts';
import '@/ai/flows/classify-setting.ts';
import '@/ai/schemas/assess-consequences-schemas.ts';
import '@/ai/schemas/generate-recap-schemas.ts';
import '@/ai/models.ts';
import '@/ai/prompts/ask-question-prompt.ts';
import '@/ai/prompts/assess-consequences-prompt.ts';
import '@/ai/prompts/generate-campaign-pieces-prompts.ts';
import '@/ai/prompts/generate-campaign-resolution-prompt.ts';
import '@/ai/prompts/generate-character-prompt.ts';
import '@/ai/prompts/generate-new-game-prompt.ts';
import '@/ai/prompts/generate-recap-prompt.ts';
import '@/ai/prompts/integrate-rules-adapter-prompt.ts';
import '@/ai/prompts/narrate-player-actions-prompt.ts';
import '@/ai/prompts/sanitize-ip-prompt.ts';
import '@/ai/prompts/update-world-state-prompt.ts';
import '@/ai/prompts/regenerate-field-prompt.ts';
import '@/ai/prompts/classify-input-prompt.ts';
import '@/ai/prompts/classify-setting-prompt.ts';

// Define the flows for the Genkit developer UI
ai.defineFlow(
  {
    name: 'classifyInputFlow',
    inputSchema: ClassifyInputSchema,
    outputSchema: ClassifyInputOutputSchema,
  },
  async (input) => {
    const { output } = await classifyInput(input);
    return output;
  }
);

ai.defineFlow(
  {
    name: 'classifySettingFlow',
    inputSchema: ClassifySettingInputSchema,
    outputSchema: ClassifySettingOutputSchema,
  },
  async (input) => {
    const { output } = await classifySetting(input);
    return output;
  }
);
