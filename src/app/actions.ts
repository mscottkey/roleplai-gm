'use server';

import { generateNewGame, GenerateNewGameInput, GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction, ResolveActionInput, ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";

export async function startNewGame(input: GenerateNewGameInput): Promise<GenerateNewGameOutput> {
  try {
    return await generateNewGame(input);
  } catch (error) {
    console.error("Error in startNewGame action:", error);
    throw new Error("Failed to generate a new game. Please try again.");
  }
}

export async function continueStory(input: ResolveActionInput): Promise<ResolveActionOutput> {
  try {
    // For this app, we are directly using the resolveAction flow as the primary
    // narrator. In a more complex scenario, this action could orchestrate
    // multiple AI calls.
    return await resolveAction(input);
  } catch (error) {
    console.error("Error in continueStory action:", error);
    throw new Error("The story could not be continued. Please try again.");
  }
}
