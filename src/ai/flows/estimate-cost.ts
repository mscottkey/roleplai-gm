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
  prompt: `You are an expert AI cost analyst for a tabletop RPG application that uses large language models. Your task is to estimate the token usage for a typical game session based on the provided game data. The model used is 'gemini-2.5-flash'.

Provide your answer based on the following approximate token counts per operation:
- New Game Generation (name, setting, tone, hooks): ~1,500 tokens
- Character Generation (per character): ~500 tokens
- Campaign Structure Generation (for a party of 4): ~4,000 tokens
- Per-Turn Player Action (Action classification + Narrative response + World state update): ~1,200 tokens
- Per-Player Question: ~800 tokens

Current Game Data:
- Number of Characters: {{characters.length}}
- Campaign has been generated: {{#if campaignGenerated}}Yes{{else}}No{{/if}}

Based on this data, provide a breakdown of estimated costs.

1.  **SetupCost**: Calculate the one-time setup cost. This includes generating the new game, generating all characters, and generating the campaign structure. Sum these up.
2.  **PerTurnCost**: This is the cost for a single player taking an action. Use the value provided above.
3.  **PerQuestionCost**: This is the cost for a single player asking a question. Use the value provided above.
4.  **EstimatedSessionCost**: Estimate the cost for a typical 2-hour session. Assume a 4-player party, where each player takes about 10 actions and asks 2 questions over the session. Calculate this as (PerTurnCost * 10 * 4) + (PerQuestionCost * 2 * 4).
5.  **SessionCostBreakdown**: Provide a human-readable string explaining the session cost calculation.

Return the result as a valid JSON object.`,
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
