'use server';

/**
 * @fileOverview Flow for intelligently updating the game's world state after an action.
 *
 * - updateWorldState - A function that processes the latest turn and updates the world state.
 * - UpdateWorldStateInput - The input type for the updateWorldState function.
 * - UpdateWorldStateOutput - The return type for the updateWorldState function.
 */

import {ai} from '@/ai/genkit';
import { UpdateWorldStateInputSchema, UpdateWorldStateOutputSchema, PlayerActionSchema, type UpdateWorldStateInput, type UpdateWorldStateOutput } from '../schemas/world-state-schemas';

export async function updateWorldState(input: UpdateWorldStateInput): Promise<UpdateWorldStateOutput> {
  return updateWorldStateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'updateWorldStatePrompt',
  input: {schema: UpdateWorldStateInputSchema},
  output: {schema: UpdateWorldStateOutputSchema},
  prompt: `You are the memory cortex for an AI Game Master. Your role is to process the latest game event (a player action and a GM response) and update the world state accordingly. Be concise but comprehensive.

Current World State:
- Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Characters: {{#each worldState.characters}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Places: {{#each worldState.places}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

Latest Game Event:
- Player: {{{playerAction.characterName}}}
- Action: {{{playerAction.action}}}
- GM Narration: {{{gmResponse}}}

Your task is to return a NEW, UPDATED world state object.
1. summary: Briefly update the summary to reflect the latest major developments.
2. storyOutline: Review the existing outline. If the latest event addresses or completes a point, remove it. If the event introduces a new clear path, add a new point. Do not add vague points.
3. recentEvents: Add a new, concise summary of this event to the top of the list. Keep the list to a maximum of 5 events, removing the oldest if necessary.
4. characters: Do not modify characters. This is handled elsewhere.
5. places: If the narration introduced a new, significant named location, add it to the list with a brief description.
6. storyAspects: If the narration introduced a new, important story element, theme, or recurring concept (like a mysterious organization or a strange magical effect), add it to the list.
`,
});

const updateWorldStateFlow = ai.defineFlow(
  {
    name: 'updateWorldStateFlow',
    inputSchema: UpdateWorldStateInputSchema,
    outputSchema: UpdateWorldStateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Ensure arrays are not null
    const updatedOutput = output!;
    updatedOutput.storyOutline = updatedOutput.storyOutline || [];
    updatedOutput.recentEvents = updatedOutput.recentEvents || [];
    updatedOutput.characters = updatedOutput.characters || [];
    updatedOutput.places = updatedOutput.places || [];
    updatedOutput.storyAspects = updatedOutput.storyAspects || [];

    return updatedOutput;
  }
);
