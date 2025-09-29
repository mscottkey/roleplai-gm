
'use server';

/**
 * @fileoverview Centralized model for AI costs.
 * This file contains the pricing information for the AI models used in the application.
 */

import type { GenerationUsage } from 'genkit';

export interface ModelCost {
  input: number;  // Cost per 1,000,000 input tokens in USD
  output: number; // Cost per 1,000,000 output tokens in USD
}

export const AI_MODEL_COSTS: Record<string, ModelCost> = {
  // Source: https://ai.google.dev/pricing
  'gemini-2.5-flash': {
    input: 0.35,
    output: 0.70,
  },
  'gemini-pro': { // Example, not currently used
    input: 7,
    output: 21,
  },
  'fallback-classifier': { // Used for keyword-based fallbacks
      input: 0,
      output: 0,
  }
};

/**
 * Calculates the cost of a given AI generation usage.
 * @param model - The name of the model used (e.g., 'gemini-2.5-flash').
 * @param usage - The GenerationUsage object from a Genkit response.
 * @returns The calculated cost in USD, or 0 if the model is not found.
 */
export function calculateCost(model: string, usage: GenerationUsage): number {
  const modelCosts = AI_MODEL_COSTS[model];
  if (!modelCosts) {
    console.warn(`Cost calculation failed: Model "${model}" not found in AI_MODEL_COSTS.`);
    return 0;
  }

  const inputCost = (usage.inputTokens / 1_000_000) * modelCosts.input;
  const outputCost = (usage.outputTokens / 1_000_000) * modelCosts.output;

  return inputCost + outputCost;
}
