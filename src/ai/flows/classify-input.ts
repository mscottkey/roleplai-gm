
'use server';

/**
 * @fileOverview Flow for classifying player input as an action or a question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_CLASSIFICATION } from '../models';
import { classifyInputPromptText } from '../prompts/classify-input-prompt';
import type { GenerationUsage } from 'genkit';

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

export type ClassifyInputResponse = {
  output: ClassifyInputOutput;
  usage: GenerationUsage;
  model: string;
};

// Simple keyword-based fallback
function classifyByKeywords(input: string): ClassifyInputOutput {
  const lowerInput = input.toLowerCase().trim();
  
  const questionWords = ['what', 'where', 'when', 'who', 'why', 'how', 'is', 'are', 'can', 'could', 'would', 'should', 'do', 'does'];
  const questionPunctuation = lowerInput.endsWith('?');
  
  if (questionPunctuation || questionWords.some(word => lowerInput.startsWith(word + ' '))) {
    return {
      intent: 'Question',
      confidence: 0.9,
      reasoning: 'Input starts with a question word or ends with a question mark.'
    };
  }
  
  return {
    intent: 'Action',
    confidence: 0.7, // Default to Action with moderate confidence if not clearly a question
    reasoning: 'Input does not conform to a typical question structure.'
  };
}

export async function classifyInput(input: ClassifyInput): Promise<ClassifyInputResponse> {
  try {
    const result = await ai.generate({
      model: MODEL_CLASSIFICATION,
      prompt: classifyInputPromptText,
      input,
      output: { schema: ClassifyInputOutputSchema },
      retries: 1,
    });

    const output = result.output;
    if (!output || output.confidence < 0.65) {
      // If the AI is not confident, use the keyword-based fallback
      const fallbackOutput = classifyByKeywords(input.playerInput);
      return {
        output: fallbackOutput,
        usage: result.usage, // Still log the usage from the low-confidence AI call
        model: 'fallback-classifier',
      };
    }

    return {
      output,
      usage: result.usage,
      model: result.model,
    };
  } catch (error) {
    console.warn(`AI classification failed: ${error}. Falling back to keyword-based method.`);
    const fallbackOutput = classifyByKeywords(input.playerInput);
    return {
      output: fallbackOutput,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      model: 'fallback-classifier',
    };
  }
}

// Define the flow for the Genkit developer UI
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
