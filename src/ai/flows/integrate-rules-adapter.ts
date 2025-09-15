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

const ResolveActionInputSchema = z.object({
  actionDescription: z.string().describe('The description of the player action.'),
  gameState: z.string().describe('The current state of the game.'),
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
  input: {schema: ResolveActionInputSchema},
  output: {schema: ResolveActionOutputSchema},
  prompt: `You are the game master, and must resolve the user's action according to the rules.

Player Action: {{{actionDescription}}}
Game State: {{{gameState}}}
Rules Adapter: {{{ruleAdapter}}}
Mechanics Visibility: {{{mechanicsVisibility}}}

Based on the above information, resolve the action and provide a narrative result.  If mechanics visibility is Full or Minimal, provide mechanics details as well.

Narrative Result:`, //Keep it very simple
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
