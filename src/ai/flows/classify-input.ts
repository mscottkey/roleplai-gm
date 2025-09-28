
'use server';

/**
 * @fileOverview Flow for classifying player input as an action or a question.
 */

import {ai} from '@/ai/genkit';
import { MODEL_CLASSIFICATION } from '../models';
import { classifyInputPromptText } from '../prompts/classify-input-prompt';
import type { GenerationUsage } from 'genkit';
import {
  ClassifyInputSchema,
  ClassifyInputOutputSchema,
  type ClassifyInput,
  type ClassifyInputOutput,
} from '../schemas/classify-schemas';


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
