
'use server';

/**
 * @fileOverview A conversational flow that acknowledges a player's action.
 *
 * - narratePlayerActions - A function that provides a short, conversational acknowledgement of a player action.
 * - NarratePlayerActionsInput - The input type for the narratePlayerActions function.
 * - NarratePlayerActionsOutput - The return type for the narratePlayerActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CharacterSchema } from '../schemas/generate-character-schemas';
import { MODEL_GAMEPLAY } from '../models';
import { narratePlayerActionsPromptText } from '../prompts/narrate-player-actions-prompt';
import type { GenerationUsage } from 'genkit';

const NarratePlayerActionsInputSchema = z.object({
  playerAction: z.string().describe('The action the player is taking.'),
  gameState: z.string().describe('The current state of the game.'),
  character: CharacterSchema.describe('The character performing the action.'),
});
export type NarratePlayerActionsInput = z.infer<typeof NarratePlayerActionsInputSchema>;

const NarratePlayerActionsOutputSchema = z.object({
  narration: z.string().describe("A short, conversational acknowledgement of the player's action (e.g., 'Okay, you attack the goblin. Here's what happens...')."),
});
export type NarratePlayerActionsOutput = z.infer<typeof NarratePlayerActionsOutputSchema>;

export type { NarratePlayerActionsInput, NarratePlayerActionsOutput };

export type NarratePlayerActionsResponse = {
  output: NarratePlayerActionsOutput;
  usage: GenerationUsage;
  model: string;
};

export async function narratePlayerActions(input: NarratePlayerActionsInput): Promise<NarratePlayerActionsResponse> {
  const result = await narratePlayerActionsPrompt(input);
  return {
    output: result.output!,
    usage: result.usage,
    model: result.model,
  };
}

const narratePlayerActionsPrompt = ai.definePrompt({
  name: 'narratePlayerActionsPrompt',
  input: {schema: NarratePlayerActionsInputSchema},
  output: {schema: NarratePlayerActionsOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: narratePlayerActionsPromptText,
  retries: 2,
});

const narratePlayerActionsFlow = ai.defineFlow(
  {
    name: 'narratePlayerActionsFlow',
    inputSchema: NarratePlayerActionsInputSchema,
    outputSchema: NarratePlayerActionsOutputSchema,
  },
  async input => {
    const {output} = await narratePlayerActionsPrompt(input);
    return output!;
  }
);

