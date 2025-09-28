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
});

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

const unifiedClassifyPromptText = `You are a classification expert for tabletop RPGs. You can classify both game settings and player intentions.

{{#if setting}}
## Setting Classification Task
Your primary goal is to determine the genre of the game.

### Source of Truth
The user's original request is the most important piece of information. Use it to determine the core genre.
- **Original Request:** "{{{originalRequest}}}"

### Additional Context
Use the following detailed descriptions to refine your classification.
- **Setting:** {{{setting}}}
{{#if tone}}
- **Tone:** {{{tone}}}
{{/if}}

### Available Categories
${generateCategoryDescriptions()}
{{/if}}

{{#if playerInput}}
## Intent Classification Task
Classify this player input as either an Action or Question:

**Player Input:** "{{{playerInput}}}"

- **Action**: Player describes what their character does, says, or attempts to do. Examples: "I attack the goblin", "I try to pick the lock", "I ask the bartender for rumors"
- **Question**: Player asks for information about the game world, rules, or possibilities. Examples: "Are there guards?", "What does the inscription say?", "Can I see the ceiling?"
{{/if}}

## Instructions
{{#if setting}}
1.  **For setting classification:** Based primarily on the **Original Request**, choose the best matching category. Provide your confidence (0-1) and explain your reasoning.
{{/if}}
{{#if playerInput}}
{{#if setting}}2.{{else}}1.{{/if}} For intent classification: Determine if this is an Action or Question, provide confidence (0-1), and explain your reasoning.
{{/if}}

Return only a valid JSON object with your classifications.`;

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
  async (input) => {
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
      const usage = result.usage;
      const model = result.model;

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
          reasoning: `Classified using keyword analysis due to AI error: ${error}`
        };
      }

      if (input.playerInput) {
        const keywordResult = classifyIntentByKeywords(input.playerInput);
        fallbackOutput.intentClassification = {
          intent: keywordResult.intent,
          confidence: keywordResult.confidence,
          reasoning: `Classified using keyword analysis due to AI error: ${error}`
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
