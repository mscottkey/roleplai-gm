'use server';

/**
 * @fileOverview Flow for estimating the token cost of a game session.
 *
 * - estimateCost - A function that estimates token usage.
 * - EstimateCostInput - The input type for the estimateCost function.
 * - EstimateCostOutput - The return type for the estimateCost function.
 */

import {ai} from '@/ai/genkit';
import {
  EstimateCostInputSchema,
  EstimateCostOutputSchema,
  type EstimateCostInput,
  type EstimateCostOutput,
} from '@/ai/schemas/cost-estimation-schemas';

export async function estimateCost(input: EstimateCostInput): Promise<EstimateCostOutput> {
  return estimateCostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCostPrompt',
  input: {schema: EstimateCostInputSchema},
  output: {schema: EstimateCostOutputSchema},
  prompt: `You are an expert AI cost analyst for a tabletop RPG application that uses large language models. Your task is to estimate the token usage and cost for a typical game session based on the provided game data.

## Model & Pricing
- **Model**: 'gemini-2.5-flash'
- **Input Pricing**: $0.00000035 per token ($0.35 per 1M tokens)
- **Output Pricing**: $0.0000021 per token ($2.10 per 1M tokens)

## Token Estimates (Input/Output)
- New Game Generation: 500 / 1000 tokens
- Character Generation (per character): 600 / 400 tokens
- Campaign Structure Generation (for a 4-char party): 2500 / 1500 tokens
- Per-Turn Action (Classification + Resolution + World Update): 800 / 400 tokens
- Per-Player Question: 700 / 100 tokens

## Current Game Data
- Number of Characters: {{characters.length}}
- Campaign has been generated: {{#if campaignGenerated}}Yes{{else}}No{{/if}}

## Your Task
Based on the data, provide a breakdown of estimated tokens and costs. Calculate the cost for each line item by applying the pricing to the input and output token estimates.

1.  **setupCost / setupCostUSD**: Calculate the one-time setup cost. This includes generating the new game, generating all characters, and generating the campaign structure (if not already done). Sum these up.
2.  **perTurnCost / perTurnCostUSD**: The cost for a single player taking an action. Use the values provided.
3.  **perQuestionCost / perQuestionCostUSD**: The cost for a single player asking a question. Use the values provided.
4.  **estimatedSessionCost / estimatedSessionCostUSD**: Estimate the cost for a typical 2-hour session. Assume a 4-player party, where each player takes about 10 actions and asks 2 questions. Calculate this as (PerTurnCost * 10 * 4) + (PerQuestionCost * 2 * 4).
5.  **sessionCostBreakdown**: Provide a human-readable string explaining the session cost calculation.

Return the result as a single, valid JSON object. All cost fields (ending in 'USD') must be numbers, not strings.
`,
});

const estimateCostFlow = ai.defineFlow(
  {
    name: 'estimateCostFlow',
    inputSchema: EstimateCostInputSchema,
    outputSchema: EstimateCostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
