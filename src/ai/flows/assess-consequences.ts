
'use server';

/**
 * @fileOverview Flow for assessing the consequences of a player's action.
 *
 * - assessConsequences - A function that assesses the potential impact of an action.
 * - AssessConsequencesInput - The input type for the assessConsequences function.
 * - AssessConsequencesOutput - The return type for the assessConsequences function.
 */

import {ai} from '@/ai/genkit';
import { AssessConsequencesInputSchema, AssessConsequencesOutputSchema, type AssessConsequencesInput, type AssessConsequencesOutput } from '@/ai/schemas/assess-consequences-schemas';
import { MODEL_ANALYSIS } from '../models';

export async function assessConsequences(input: AssessConsequencesInput): Promise<AssessConsequencesOutput> {
  return assessConsequencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessConsequencesPrompt',
  input: {schema: AssessConsequencesInputSchema},
  output: {schema: AssessConsequencesOutputSchema},
  model: MODEL_ANALYSIS,
  prompt: `You are an expert Game Master reviewing a player's intended action. Your task is to determine if the action is significant enough to warrant a confirmation from the player.

A confirmation is needed if the action is:
1.  **Irreversible:** An action that permanently changes the world or a character in a way that cannot be easily undone.
2.  **Morally Significant:** An action that represents a major ethical choice or has significant moral implications for the character or world.
3.  **World-Altering:** An action that could dramatically shift the balance of power, change political landscapes, or have widespread, unforeseen consequences.
4.  **A Major Detour:** An action that would lead the party to abandon a primary objective or questline.

Do NOT ask for confirmation for routine actions, even if they are risky (e.g., attacking a monster, picking a lock, negotiating a price).

## World State
- Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each world.recentEvents}}- {{{this}}}{{/each}}

## Player's Intended Action
Character: {{{character.name}}}
Action: "{{{actionDescription}}}"

Based on the action and the world state, does this require confirmation? If so, provide a clear, concise question to the player that states the potential consequence (e.g., "This could start a war. Are you sure?").
`,
});

const assessConsequencesFlow = ai.defineFlow(
  {
    name: 'assessConsequencesFlow',
    inputSchema: AssessConsequencesInputSchema,
    outputSchema: AssessConsequencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
