
'use server';

/**
 * @fileOverview A flow for generating a flexible sequence of story beats for a game session.
 * 
 * - generateSessionBeats - Generates beats for a specific session number.
 * - generateNextSessionBeats - A wrapper that determines the next session number and generates beats for it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  GenerateSessionBeatsInputSchema,
  StoryBeatSchema,
  type GenerateSessionBeatsInput,
} from '@/ai/schemas/campaign-structure-schemas';
import { generateSessionBeatsPromptText } from '../prompts/generate-session-beats-prompt';
import { MODEL_GENERATION } from '../models';
import type { WorldState } from '../schemas/world-state-schemas';


const generateSessionBeatsPrompt = ai.definePrompt({
  name: 'generateSessionBeatsPrompt',
  model: MODEL_GENERATION,
  prompt: generateSessionBeatsPromptText,
  input: { schema: GenerateSessionBeatsInputSchema },
  output: {
    format: 'json',
    schema: z.array(StoryBeatSchema),
  },
  config: {
    retries: 2,
  },
});

/**
 * Generates a sequence of story beats for a specific game session.
 * This flow analyzes the current state of the world, including faction progress,
 * remaining objectives, and player actions, to create a paced and relevant
 * session outline.
 *
 * @param input The complete current state of the campaign and world.
 * @returns An array of StoryBeat objects.
 */
export async function generateSessionBeats(input: GenerateSessionBeatsInput) {
  const result = await generateSessionBeatsPrompt(input);
  const output = result.output;

  if (!output || output.length === 0) {
    throw new Error('The AI failed to generate any story beats for the session.');
  }

  return { ...result, output };
}


/**
 * A wrapper function that prepares and generates beats for the upcoming game session.
 * It determines if the campaign should continue, calculates the next session number,
 * and calls the main generation flow.
 * 
 * @param worldState The current state of the game world after a session has concluded.
 * @param staticCampaignData The static campaign structure data (factions, nodes, etc.).
 * @returns An array of StoryBeat objects for the next session.
 */
export async function generateNextSessionBeats(
    worldState: WorldState,
    staticCampaignData: Omit<GenerateSessionBeatsInput, 'currentWorldState' | 'sessionNumber'>
) {

    const progress = worldState.sessionProgress;
    const resolution = worldState.resolution;

    // Determine if the campaign should conclude
    const allConditionsMet = resolution?.victoryConditions.every(vc => vc.achieved);
    if (allConditionsMet || resolution?.climaxReady) {
        // In a real implementation, you might generate a final "epilogue" session
        // or simply signal that the campaign is over.
        console.log("Campaign objective met or climax is ready. Concluding campaign.");
        return []; // Return empty beats, signaling the end.
    }

    const nextSessionNumber = (progress?.currentSession || 0) + 1;

    const input: GenerateSessionBeatsInput = {
        ...staticCampaignData,
        currentWorldState: worldState,
        sessionNumber: nextSessionNumber,
    };

    const result = await generateSessionBeats(input);
    return result.output;
}
