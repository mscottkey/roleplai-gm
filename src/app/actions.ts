'use server';

import { generateNewGame as generateNewGameFlow, GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction, ResolveActionInput, ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow, UpdateWorldStateOutput } from "@/ai/flows/update-world-state";
import { classifyIntent, type ClassifyIntentOutput } from "@/ai/flows/classify-intent";
import { askQuestion, type AskQuestionInput, type AskQuestionOutput } from "@/ai/flows/ask-question";
import { generateCampaignStructure as generateCampaignStructureFlow, type GenerateCampaignStructureInput, type GenerateCampaignStructureOutput } from "@/ai/flows/generate-campaign-structure";

import { z } from 'genkit';
import { WorldStateSchema } from "@/ai/schemas/world-state-schemas";

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, Timestamp } from 'firebase/firestore';

import type { GenerateCharacterInput, GenerateCharacterOutput } from "@/ai/schemas/generate-character-schemas";

// Initialize Firebase for server actions
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getServerApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const GenerateNewGameInputSchema = z.object({
  request: z.string(),
  userId: z.string(),
});
type GenerateNewGameInput = z.infer<typeof GenerateNewGameInputSchema>;


const ClassifyIntentInputSchema = z.object({
  playerInput: z.string().describe('The text input from the player.'),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;


export async function startNewGame(input: GenerateNewGameInput): Promise<{ gameId: string; newGame: GenerateNewGameOutput }> {
  try {
    console.log("Starting new game for user:", input.userId);
    
    const newGame = await generateNewGameFlow({ request: input.request });
    console.log("Game generated successfully:", newGame);
    
    const app = getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(collection(db, 'games'));
    console.log("Game document ID will be:", gameRef.id);

    const initialWorldState: z.infer<typeof WorldStateSchema> = {
      summary: `The game is a ${newGame.tone} adventure set in ${newGame.setting}.`,
      storyOutline: newGame.initialHooks.split('\n').filter(s => s.length > 0),
      recentEvents: ["The adventure has just begun."],
      characters: [],
      places: [],
      storyAspects: [],
    };

    const newGameDocument = {
      userId: input.userId,
      createdAt: serverTimestamp(),
      gameData: {
        setting: newGame.setting,
        tone: newGame.tone,
        initialHooks: newGame.initialHooks,
      },
      worldState: initialWorldState,
      messages: [],
      storyMessages: [],
      step: 'characters',
      activeCharacterId: null,
    };
    
    console.log("Attempting to save game document...");
    await setDoc(gameRef, newGameDocument);
    console.log("Game document saved successfully!");

    return { gameId: gameRef.id, newGame };

  } catch (error) {
    console.error("Critical error in startNewGame action:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      throw new Error(`Failed to generate a new game: ${error.message}`);
    }
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
        return await generateCharacterFlow(input);
    } catch (error) {
        console.error("Error in createCharacter action:", error);
        throw new Error("Failed to generate characters. Please try again.");
    }
}


type UpdateWorldStateInput = {
  gameId: string;
  updates?: Record<string, any>;
  playerAction?: {
    characterName: string;
    action: string;
  };
  gmResponse?: string;
  currentWorldState?: z.infer<typeof WorldStateSchema>;
};

export async function updateWorldState(input: UpdateWorldStateInput): Promise<UpdateWorldStateOutput | void> {
  const { gameId, updates, playerAction, gmResponse, currentWorldState } = input;
  
  try {
    const app = getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    if (playerAction && gmResponse && currentWorldState) {
      // This is an AI-driven world state update
      const newWorldState = await updateWorldStateFlow({
        worldState: currentWorldState,
        playerAction: playerAction,
        gmResponse: gmResponse,
      });

      await updateDoc(gameRef, {
        worldState: newWorldState,
        ...updates
      });
      return newWorldState;

    } else if (updates) {
      // This is a direct data update
      await updateDoc(gameRef, updates);
    }

  } catch (error) {
    console.error("Error in updateWorldState action:", error);
    throw new Error("Failed to update the world state. Please try again.");
  }
}


export async function routePlayerInput(input: ClassifyIntentInput): Promise<ClassifyIntentOutput> {
  try {
    return await classifyIntent(input);
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

export async function generateCampaign(input: GenerateCampaignStructureInput): Promise<GenerateCampaignStructureOutput> {
    try {
        return await generateCampaignStructureFlow(input);
    } catch (error) {
        console.error("Error in generateCampaign action:", error);
        throw new Error("Failed to generate the campaign structure. Please try again.");
    }
}
