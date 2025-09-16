'use server';

/**
 * @fileOverview Narrates player actions and dynamically updates the game world.
 *
 * - narratePlayerActions - A function that narrates player actions based on the game state.
 * - NarratePlayerActionsInput - The input type for the narratePlayerActions function.
 * - NarratePlayerActionsOutput - The return type for the narratePlayerActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CharacterSchema } from '../schemas/generate-character-schemas';

const NarratePlayerActionsInputSchema = z.object({
  playerAction: z.string().describe('The action the player is taking.'),
  gameState: z.string().describe('The current state of the game.'),
  character: CharacterSchema.describe('The character performing the action.'),
});
export type NarratePlayerActionsInput = z.infer<typeof NarratePlayerActionsInputSchema>;

const NarratePlayerActionsOutputSchema = z.object({
  narration: z.string().describe('The AI-generated narration of the player action outcome.'),
});
export type NarratePlayerActionsOutput = z.infer<typeof NarratePlayerActionsOutputSchema>;

export async function narratePlayerActions(input: NarratePlayerActionsInput): Promise<NarratePlayerActionsOutput> {
  return narratePlayerActionsFlow(input);
}

const narratePlayerActionsPrompt = ai.definePrompt({
  name: 'narratePlayerActionsPrompt',
  input: {schema: NarratePlayerActionsInputSchema},
  output: {schema: NarratePlayerActionsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are the AI Gamemaster for a tabletop RPG.

The player, controlling {{{character.name}}}, has taken the following action: {{{playerAction}}}

The current game state is:
{{{gameState}}}

Narrate the outcome of the player's action in 2-5 sentences. Be evocative and descriptive, and dynamically update the game world based on the player's choices. For any spoken dialogue in your response, you must use double quotes ("").
`,
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
