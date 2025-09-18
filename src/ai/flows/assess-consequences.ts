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
  prompt: `You are an expert Game Master reviewing a player's intended action. Your task is to determine if the action is significant enough to warrant a confirmation.

A confirmation is needed if the action is:
1.  **Irreversible:** e.g., killing a key NPC, destroying a unique item, burning down a city.
2.  **Morally Significant:** e.g., betraying an ally, committing a major crime, making a choice that leads to widespread suffering.
3.  **World-Altering:** e.g., declaring war, revealing a secret that changes political dynamics, unleashing a sealed evil.
4.  **A Major Detour:** e.g., abandoning the main quest line entirely.

Do NOT ask for confirmation for routine actions, even if they are risky (e.g., attacking a monster, picking a lock, negotiating a price).

## World State
- Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}

## Player's Intended Action
Character: {{{character.name}}}
Action: "{{{actionDescription}}}"

Based on the action and the world state, does this require confirmation? If so, provide a clear, concise question to the player.
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
