// src/ai/flows/unified-classify.ts

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MODEL_CLASSIFICATION } from '../models';
import { SettingCategory, SETTING_KEYWORDS, SETTING_EXAMPLES } from '../../lib/setting-examples';
import type { GenerationUsage } from 'genkit';

// Helper function to generate enum values dynamically from the lib
function getSettingCategoryEnum() {
  const categories = Object.keys(SETTING_EXAMPLES) as SettingCategory[];
  return z.enum(categories as [SettingCategory, ...SettingCategory[]]);
}

// Helper function to generate category descriptions for prompts
function generateCategoryDescriptions(): string {
  return Object.entries(SETTING_EXAMPLES)
    .map(([key, value]) => `- **${key}**: ${value.description}`)
    .join('\n');
}

// Combined input schema
const UnifiedClassifyInputSchema = z.object({
  // For setting classification (only needed once per game)
  setting: z.string().optional().describe('The setting description to classify'),
  tone: z.string().optional().describe('The tone description (optional)'),
  originalRequest: z.string().optional().describe("The user's original, one-sentence request for the game, which is the primary source of truth for the genre."),
  
  // For intent classification (needed per player input)
  playerInput: z.string().optional().describe('The player input to classify intent for'),
  
  // Context for better classification
  gameContext: z.object({
    isFirstClassification: z.boolean().default(false).describe('Whether this is the first time classifying this game'),
  }).optional()
});

const UnifiedClassifyOutputSchema = z.object({
  // Setting classification (only present if setting was provided)
  settingClassification: z.object({
    category: getSettingCategoryEnum(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  }).optional(),
  
  // Intent classification (only present if playerInput was provided)
  intentClassification: z.object({
    intent: z.enum(['Action', 'Question'] as const),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  }).optional()
});

export type UnifiedClassifyInput = z.infer<typeof UnifiedClassifyInputSchema>;
export type UnifiedClassifyOutput = z.infer<typeof UnifiedClassifyOutputSchema>;

export type UnifiedClassifyResponse = {
  output: UnifiedClassifyOutput;
  usage: GenerationUsage;
  model: string;
};

const GenerationUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
}).passthrough();

const UnifiedClassifyResponseSchema = z.object({
  output: UnifiedClassifyOutputSchema,
  usage: GenerationUsageSchema,
  model: z.string(),
});


// Keyword-based setting classification fallback
function classifySettingByKeywords(text: string): { category: SettingCategory; score: number } {
  const lowerText = text.toLowerCase();
  
  // Initialize scores for all categories dynamically
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
  const [topCategory, topScore] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
  
  const totalWords = lowerText.split(/\s+/).length;
  const confidence = Math.min(topScore / Math.max(totalWords * 0.1, 1), 1);

  return { 
    category: topScore > 0 ? topCategory : 'generic', 
    score: confidence 
  };
}

// Simple intent classification fallback
function classifyIntentByKeywords(input: string): { intent: 'Action' | 'Question'; confidence: number } {
  const lowerInput = input.toLowerCase().trim();
  
  // Question indicators
  const questionWords = ['what', 'where', 'when', 'who', 'why', 'how', 'is', 'are', 'can', 'could', 'would', 'should'];
  const questionPunctuation = input.includes('?');
  
  // Action indicators  
  const actionWords = ['i ', 'my character', 'we ', 'let me', 'going to', 'want to', 'try to', 'attempt'];
  
  let questionScore = 0;
  let actionScore = 0;
  
  if (questionPunctuation) questionScore += 0.3;
  
  questionWords.forEach(word => {
    if (lowerInput.startsWith(word + ' ') || lowerInput.includes(' ' + word + ' ')) {
      questionScore += 0.1;
    }
  });
  
  actionWords.forEach(phrase => {
    if (lowerInput.includes(phrase)) {
      actionScore += 0.2;
    }
  });
  
  // Default to action if unclear
  if (questionScore > actionScore) {
    return { intent: 'Question', confidence: Math.min(questionScore, 0.9) };
  } else {
    return { intent: 'Action', confidence: Math.max(0.5, Math.min(actionScore, 0.9)) };
  }
}

const unifiedClassifyPromptText = `You are an expert classification system for a tabletop RPG tool. You may be given one or two independent tasks.

{{#if setting}}
## Task 1: Classify Game Setting
Your goal is to classify the provided game concept into one of the predefined genres.

### How to Classify for Task 1
1.  Start with the **Original Request**. This is the user's core idea.
2.  Use the detailed **Setting** and **Tone** descriptions to understand the world's specifics and mood. This detailed context is more important than the original request if they seem to conflict.
3.  Choose the single best-fitting category from the list below.

### Information for Task 1
- **Original Request:** \`{{{originalRequest}}}\`
- **Setting Description:** \`{{{setting}}}\`
{{#if tone}}
- **Tone Description:** \`{{{tone}}}\`
{{/if}}

### Available Categories for Task 1
${generateCategoryDescriptions()}
{{/if}}

{{#if playerInput}}
## Task 2: Classify Player Intent
Your goal is to classify the raw player input as either an "Action" or a "Question".

### Information for Task 2
- **Player Input:** \`{{{playerInput}}}\`

### Definitions for Task 2
- **Action**: The player describes what their character does, says, or attempts to do. Examples: "I attack the goblin", "I try to pick the lock".
- **Question**: The player asks for information about the game world, rules, or possibilities. Examples: "Are there guards?", "What does the inscription say?".

### How to Classify for Task 2
- Analyze ONLY the **Player Input** for this task. Do not use information from Task 1.
{{/if}}

## Your Response
You must provide a valid JSON response. For each task you were given, provide the classification, a confidence score (0.0 to 1.0), and a brief reasoning.
- The reasoning for the **Intent Classification** (Task 2) should be based *only* on the player's input text provided for that task.
`;

export async function unifiedClassify(input: UnifiedClassifyInput): Promise<UnifiedClassifyResponse> {
  const result = await unifiedClassifyFlow(input);
  return result;
}

export const unifiedClassifyFlow = ai.defineFlow(
  {
    name: 'unifiedClassify',
    inputSchema: UnifiedClassifyInputSchema,
    outputSchema: UnifiedClassifyResponseSchema,
  },
  async (input): Promise<UnifiedClassifyResponse> => {
    try {
      // Try AI classification first
      const result = await ai.generate({
        model: MODEL_CLASSIFICATION,
        prompt: unifiedClassifyPromptText,
        input: input,
        output: {
          format: 'json',
          schema: UnifiedClassifyOutputSchema,
        },
        retries: 2,
      });

      let finalOutput = result.output || {};
      
      const usage = {
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
        totalTokens: result.usage.totalTokens || (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0),
      };
      const model = result.model || MODEL_CLASSIFICATION;


      // Fallback to keyword-based classification if AI confidence is low or failed
      const keywordSource = input.originalRequest ? `${input.originalRequest} ${input.setting} ${input.tone || ''}` : `${input.setting} ${input.tone || ''}`;
      if (input.setting && (!finalOutput.settingClassification || finalOutput.settingClassification.confidence < 0.6)) {
        const keywordResult = classifySettingByKeywords(keywordSource);
        finalOutput.settingClassification = {
          category: keywordResult.category,
          confidence: Math.max(keywordResult.score, finalOutput.settingClassification?.confidence || 0),
          reasoning: `Classified using keyword analysis. ${finalOutput.settingClassification?.reasoning || 'AI classification had low confidence.'}`
        };
      }

      if (input.playerInput && (!finalOutput.intentClassification || finalOutput.intentClassification.confidence < 0.6)) {
        const keywordResult = classifyIntentByKeywords(input.playerInput);
        finalOutput.intentClassification = {
          intent: keywordResult.intent,
          confidence: Math.max(keywordResult.confidence, finalOutput.intentClassification?.confidence || 0),
          reasoning: `Classified using keyword analysis. ${finalOutput.intentClassification?.reasoning || 'AI classification had low confidence.'}`
        };
      }

      return { output: finalOutput, usage, model };

    } catch (error) {
      // Pure keyword fallback if AI fails completely
      const fallbackOutput: UnifiedClassifyOutput = {};
      
      const keywordSource = input.originalRequest ? `${input.originalRequest} ${input.setting} ${input.tone || ''}` : `${input.setting} ${input.tone || ''}`;
      if (input.setting) {
        const keywordResult = classifySettingByKeywords(keywordSource);
        fallbackOutput.settingClassification = {
          category: keywordResult.category,
          confidence: keywordResult.score,
          reasoning: `Classified using keyword analysis due to AI error: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      if (input.playerInput) {
        const keywordResult = classifyIntentByKeywords(input.playerInput);
        fallbackOutput.intentClassification = {
          intent: keywordResult.intent,
          confidence: keywordResult.confidence,
          reasoning: `Classified using keyword analysis due to AI error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // Since this is a fallback, usage and model are synthetic
      return {
        output: fallbackOutput,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        model: 'fallback-classifier'
      }
    }
  }
);
