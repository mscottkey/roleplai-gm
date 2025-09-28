
import {z} from 'genkit';
import { SETTING_EXAMPLES, SettingCategory } from '@/lib/setting-examples';

// Schemas for classify-input flow
export const ClassifyInputSchema = z.object({
  playerInput: z.string().describe('The text input from the player.'),
});
export type ClassifyInput = z.infer<typeof ClassifyInputSchema>;

export const ClassifyInputOutputSchema = z.object({
  intent: z.enum(['Action', 'Question']).describe('The classified intent of the player input.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the classification.'),
  reasoning: z.string().describe('A brief explanation for the classification choice.'),
});
export type ClassifyInputOutput = z.infer<typeof ClassifyInputOutputSchema>;


// Schemas for classify-setting flow
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
