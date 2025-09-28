
'use server';

/**
 * @fileOverview Flow for classifying a game's setting into a genre category.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_CLASSIFICATION } from '../models';
import { classifySettingPromptText, generateCategoryDescriptions } from '../prompts/classify-setting-prompt';
import { SETTING_EXAMPLES, SETTING_KEYWORDS, SettingCategory } from '@/lib/setting-examples';
import type { GenerationUsage } from 'genkit';

function getSettingCategoryEnum() {
  const categories = Object.keys(SETTING_EXAMPLES) as SettingCategory[];
  return z.enum(categories as [SettingCategory, ...SettingCategory[]]);
}

export const ClassifySettingInputSchema = z.object({
  setting: z.string().describe('The detailed setting description to classify.'),
  tone: z.string().optional().describe('The tone description (optional context).'),
  originalRequest: z.string().optional().describe("The user's original, one-sentence request for the game."),
});
export type ClassifySettingInput = z.infer<typeof ClassifySettingInputSchema>;

export const ClassifySettingOutputSchema = z.object({
  category: getSettingCategoryEnum(),
  confidence: z.number().min(0).max(1).describe('The confidence score of the classification.'),
  reasoning: z.string().describe('A brief explanation for the classification choice.'),
});
export type ClassifySettingOutput = z.infer<typeof ClassifySettingOutputSchema>;


export type ClassifySettingResponse = {
    output: ClassifySettingOutput;
    usage: GenerationUsage;
    model: string;
};

// Keyword-based fallback classifier
function classifyByKeywords(text: string): ClassifySettingOutput {
  const lowerText = text.toLowerCase();
  
  const scores = Object.keys(SETTING_EXAMPLES).reduce((acc, category) => {
    acc[category as SettingCategory] = 0;
    return acc;
  }, {} as Record<SettingCategory, number>);

  Object.entries(SETTING_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[category as SettingCategory] += 1;
      }
    });
  });

  const entries = Object.entries(scores) as [SettingCategory, number][];
  const [topCategory, topScore] = entries.reduce((a, b) => a[1] > b[1] ? a : b, ['generic' as SettingCategory, 0]);
  
  const totalWords = lowerText.split(/\s+/).length;
  const confidence = Math.min(topScore / Math.max(totalWords * 0.1, 1), 1);

  return { 
    category: topScore > 0 ? topCategory : 'generic', 
    confidence: confidence,
    reasoning: 'Classified using keyword analysis.'
  };
}


export async function classifySetting(input: ClassifySettingInput): Promise<ClassifySettingResponse> {
  try {
    const result = await ai.generate({
      model: MODEL_CLASSIFICATION,
      prompt: classifySettingPromptText,
      input: {
        ...input,
        availableCategories: generateCategoryDescriptions(),
      },
      output: { schema: ClassifySettingOutputSchema },
      retries: 2,
    });
    
    const output = result.output;
    if (!output || output.confidence < 0.6) {
        const keywordSource = `${input.originalRequest || ''} ${input.setting} ${input.tone || ''}`;
        const fallbackOutput = classifyByKeywords(keywordSource);
        return {
            output: fallbackOutput,
            usage: result.usage,
            model: 'fallback-classifier',
        }
    }

    return {
        output,
        usage: result.usage,
        model: result.model,
    };
  } catch (error) {
    console.warn(`AI setting classification failed: ${error}. Falling back to keyword-based method.`);
    const keywordSource = `${input.originalRequest || ''} ${input.setting} ${input.tone || ''}`;
    const fallbackOutput = classifyByKeywords(keywordSource);
    return {
        output: fallbackOutput,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        model: 'fallback-classifier',
    };
  }
}

// Define the flow for the Genkit developer UI
const classifySettingFlow = ai.defineFlow(
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
