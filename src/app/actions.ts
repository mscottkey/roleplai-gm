'use server';

import { generateNewGame, GenerateNewGameInput, GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction, ResolveActionInput, ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow } from "@/ai/flows/update-world-state";
import { classifyIntent, ClassifyIntentOutput, ClassifyIntentInput } from "@/ai/flows/classify-intent";
import { askQuestion, AskQuestionInput, AskQuestionOutput } from "@/ai/flows/ask-question";

import type { GenerateCharacterInput, GenerateCharacterOutput } from "@/ai/schemas/generate-character-schemas";
import type { UpdateWorldStateInput, UpdateWorldStateOutput } from "@/ai/schemas/world-state-schemas";

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

export async function updateWorldState(input: UpdateWorldStateInput): Promise<UpdateWorldStateOutput> {
  try {
    return await updateWorldStateFlow(input);
  } catch (error) {
    console.error("Error in updateWorldState action:", error);
    throw new Error("Failed to update the world state. Please try again.");
  }
}

export async function routePlayerInput(playerInput: string): Promise<ClassifyIntentOutput> {
  try {
    return await classifyIntent({ playerInput });
  } catch (error) {
    console.error("Error in routePlayerInput action:", error);
    throw new Error("Failed to classify player intent. Please try again.");
  }
}

export async function getAnswerToQuestion(input: AskQuestionInput): Promise<AskQuestionOutput> {
  try {
    return await askQuestion(input);
  } catch (error) {
    console.error("Error in getAnswerToQuestion action:", error);
    throw new Error("Failed to get an answer from the GM. Please try again.");
  }
}
