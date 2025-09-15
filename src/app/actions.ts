'use server';

import { generateNewGame, GenerateNewGameInput, GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction, ResolveActionInput, ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter } from "@/ai/flows/generate-character";
import type { GenerateCharacterInput, GenerateCharacterOutput } from "@/ai/schemas/generate-character-schemas";

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
    return await resolveAction(input);
  } catch (error) {
    console.error("Error in continueStory action:", error);
    throw new Error("The story could not be continued. Please try again.");
  }
}

export async function createCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
    try {
        return await generateCharacter(input);
    } catch (error) {
        console.error("Error in createCharacter action:", error);
        throw new Error("Failed to generate characters. Please try again.");
    }
}
