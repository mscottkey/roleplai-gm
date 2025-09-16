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
  input: {schema: ResolveActionInputSchema},
  output: {schema: ResolveActionOutputSchema},
  prompt: `You are the game master, and must resolve an action for a player's character.

You have a complete memory of the game world. Use it to inform your narration.
- World Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Characters: {{#each worldState.characters}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Places: {{#each worldState.places}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

Now, consider the current action:
Character: {{{character.name}}} ({{character.description}})
Player Action: {{{actionDescription}}}
Rules Adapter: {{{ruleAdapter}}}
Mechanics Visibility: {{{mechanicsVisibility}}}

Based on the world state and the player's action, resolve the action and provide a narrative result. The narration should be evocative, move the story forward, and be consistent with the established world. For any spoken dialogue in your response, you must use double quotes (""). If mechanics visibility is Full or Minimal, provide mechanics details as well. The narrative result should be from the perspective of the GM, describing what happens.
`,
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
