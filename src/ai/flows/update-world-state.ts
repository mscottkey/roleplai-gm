
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
import { MODEL_GAMEPLAY } from '../models';
import { updateWorldStatePromptText } from '../prompts/update-world-state-prompt';

export async function updateWorldState(input: UpdateWorldStateInput): Promise<UpdateWorldStateOutput> {
  return updateWorldStateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'updateWorldStatePrompt',
  input: {schema: UpdateWorldStateInputSchema},
  output: {schema: UpdateWorldStateOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: updateWorldStatePromptText,
});

const updateWorldStateFlow = ai.defineFlow(
  {
    name: 'updateWorldStateFlow',
    inputSchema: UpdateWorldStateInputSchema,
    outputSchema: UpdateWorldStateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Ensure arrays are not null and carry over the original character data to prevent ID loss
    const updatedOutput = output!;
    updatedOutput.characters = input.worldState.characters; // THIS IS THE FIX
    updatedOutput.storyOutline = updatedOutput.storyOutline || [];
    updatedOutput.recentEvents = updatedOutput.recentEvents || [];
    updatedOutput.places = updatedOutput.places || [];
    updatedOutput.storyAspects = updatedOutput.storyAspects || [];
    updatedOutput.knownPlaces = updatedOutput.knownPlaces || [];
    updatedOutput.knownFactions = updatedOutput.knownFactions || [];

    return updatedOutput;
  }
);
