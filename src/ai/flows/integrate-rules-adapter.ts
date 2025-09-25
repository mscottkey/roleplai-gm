'use server';

/**
 * @fileOverview Implements the rules adapter integration for action resolution in the game.
 *
 * - resolveAction - Resolves a player action using the specified rules adapter.
 * - ResolveActionInput - The input type for the resolveAction function.
 * - ResolveActionOutput - The return type for the resolveAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CharacterSchema } from '../schemas/generate-character-schemas';
import { WorldStateSchema } from '../schemas/world-state-schemas';
import { MODEL_GAMEPLAY } from '../models';
import { resolveActionPromptText } from '../prompts/integrate-rules-adapter-prompt';

const ResolveActionInputSchema = z.object({
  actionDescription: z.string().describe('The description of the player action.'),
  worldState: WorldStateSchema.describe('The entire current state of the game world, including summary, characters, and plot points.'),
  character: CharacterSchema.describe('The character performing the action.'),
  ruleAdapter: z.enum(['FateCore', 'SavageWorlds']).default('FateCore').describe('The rules adapter to use.'),
  mechanicsVisibility: z.enum(['Hidden', 'Minimal', 'Full']).default('Hidden').describe('The level of mechanics visibility.'),
});
export type ResolveActionInput = z.infer<typeof ResolveActionInputSchema>;

const ResolveActionOutputSchema = z.object({
  narrativeResult: z.string().describe('The narrative result of the action.'),
  mechanicsDetails: z.string().optional().describe('Optional details of the mechanics used to resolve the action.'),
});
export type ResolveActionOutput = z.infer<typeof ResolveActionOutputSchema>;

export async function resolveAction(input: ResolveActionInput): Promise<ResolveActionOutput> {
  return resolveActionFlow(input);
}

const resolveActionPrompt = ai.definePrompt({
  name: 'resolveActionPrompt',
  model: MODEL_GAMEPLAY,
  input: {schema: ResolveActionInputSchema},
  output: {schema: ResolveActionOutputSchema},
  prompt: resolveActionPromptText,
});

const resolveActionFlow = ai.defineFlow(
  {
    name: 'resolveActionFlow',
    inputSchema: ResolveActionInputSchema,
    outputSchema: ResolveActionOutputSchema,
  },
  async input => {
    const {output} = await resolveActionPrompt(input);
    return output!;
  }
);
