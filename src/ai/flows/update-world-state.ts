
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
import Handlebars from 'handlebars';

// Register a Handlebars helper to look up a node by ID
Handlebars.registerHelper('lookup', function(obj, key, options) {
  if (Array.isArray(obj)) {
    const item = obj.find(o => o.id === key);
    return item ? options.fn(item) : '';
  }
  return obj && obj[key] ? options.fn(obj[key]) : '';
});


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
    
    const updatedOutput = output!;
    
    // Ensure critical fields are not lost
    updatedOutput.characters = input.worldState.characters; 
    updatedOutput.storyOutline = updatedOutput.storyOutline || [];
    updatedOutput.recentEvents = updatedOutput.recentEvents || [];
    updatedOutput.places = updatedOutput.places || [];
    updatedOutput.storyAspects = updatedOutput.storyAspects || [];
    updatedOutput.knownPlaces = updatedOutput.knownPlaces || [];
    updatedOutput.knownFactions = updatedOutput.knownFactions || [];
    updatedOutput.nodeStates = updatedOutput.nodeStates || input.worldState.nodeStates || {};
    updatedOutput.resolution = updatedOutput.resolution || input.worldState.resolution || undefined;
    
    if (!updatedOutput.currentScene) {
        updatedOutput.currentScene = input.worldState.currentScene || { nodeId: 'unknown', name: 'Unknown', description: 'The area has not been described.', presentCharacters: [], presentNPCs: [], environmentalFactors: [], connections: [] };
    }
    updatedOutput.currentScene.presentCharacters = updatedOutput.currentScene.presentCharacters || [];
    updatedOutput.currentScene.presentNPCs = updatedOutput.currentScene.presentNPCs || [];
    updatedOutput.currentScene.environmentalFactors = updatedOutput.currentScene.environmentalFactors || [];
    updatedOutput.currentScene.connections = updatedOutput.currentScene.connections || [];


    return updatedOutput;
  }
);

