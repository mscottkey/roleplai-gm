
'use server';

import { generateNewGame as generateNewGameFlow, GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction, ResolveActionInput, ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow } from "@/ai/flows/update-world-state";
import { classifyIntent, type ClassifyIntentOutput } from "@/ai/flows/classify-intent";
import { askQuestion, type AskQuestionInput, type AskQuestionOutput } from "@/ai/flows/ask-question";
import { generateCampaignStructure as generateCampaignStructureFlow } from "@/ai/flows/generate-campaign-structure";
import { generateCampaignCore, generateCampaignFactions, generateCampaignNodes } from "@/ai/flows/generate-campaign-pieces";
import { estimateCost as estimateCostFlow } from "@/ai/flows/estimate-cost";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput } from "@/ai/flows/sanitize-ip";
import { assessConsequences } from "@/ai/flows/assess-consequences";
import { generateRecap as generateRecapFlow } from "@/ai/flows/generate-recap";
import type { AssessConsequencesInput, AssessConsequencesOutput } from "@/ai/schemas/assess-consequences-schemas";
import type { GenerateCampaignStructureInput, GenerateFactionsInput, GenerateNodesInput, CampaignCore, Faction, Node } from "@/ai/schemas/campaign-structure-schemas";
import type { UpdateWorldStateOutput } from "@/ai/schemas/world-state-schemas";
import type { EstimateCostInput, EstimateCostOutput } from "@/ai/schemas/cost-estimation-schemas";
import type { GenerateRecapInput, GenerateRecapOutput } from "@/ai/schemas/generate-recap-schemas";


import { z } from 'genkit';
import { WorldStateSchema, type WorldState } from "@/ai/schemas/world-state-schemas";

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, Timestamp, getDoc, runTransaction } from 'firebase/firestore';

import type { GenerateCharacterInput, GenerateCharacterOutput, Character } from "@/ai/schemas/generate-character-schemas";

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


export async function startNewGame(input: GenerateNewGameInput): Promise<{ gameId: string; newGame: GenerateNewGameOutput; warningMessage?: string }> {
  try {
    console.log("Starting new game for user:", input.userId);
    console.log("Original request:", input.request);

    // 1. Sanitize the request for IP
    const ipCheck = await sanitizeIpFlow({ request: input.request });
    console.log("IP Check complete. Sanitized request:", ipCheck.sanitizedRequest);

    // 2. Generate the game using the (potentially sanitized) request
    const newGame = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
    console.log("Game generated successfully:", newGame);
    
    const app = getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(collection(db, 'games'));
    console.log("Game document ID will be:", gameRef.id);

    const initialWorldState: z.infer<typeof WorldStateSchema> = {
      summary: `The game is set in ${newGame.setting}. The tone is ${newGame.tone}.`,
      storyOutline: newGame.initialHooks.split('\n').filter(s => s.length > 0),
      recentEvents: ["The adventure has just begun."],
      characters: [],
      places: [],
      storyAspects: [],
      knownPlaces: [],
      knownFactions: [],
    };
    
    const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        role: 'system' as const,
        content: `# Welcome to ${newGame.name}!\n\nThis is a new adventure set in the world of **${newGame.setting.split('\n')[0].replace(/\*\*/g,'')}**.\n\nOnce the party is assembled, the story will begin.`
    };


    const newGameDocument = {
      userId: input.userId,
      createdAt: serverTimestamp(),
      gameData: {
        name: newGame.name,
        setting: newGame.setting,
        tone: newGame.tone,
        initialHooks: newGame.initialHooks,
        difficulty: newGame.difficulty,
      },
      worldState: initialWorldState,
      previousWorldState: null,
      messages: [welcomeMessage],
      storyMessages: [{content: welcomeMessage.content}],
      step: 'characters',
      activeCharacterId: null,
    };
    
    console.log("Attempting to save game document...");
    await setDoc(gameRef, newGameDocument);
    console.log("Game document saved successfully!");

    // 3. Return the game data and any warning message
    return { gameId: gameRef.id, newGame, warningMessage: ipCheck.warningMessage };

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
    console.log("Attempting to create character with input:", JSON.stringify(input, null, 2));
    try {
        const result = await generateCharacterFlow(input);
        console.log("Successfully generated characters:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("Full error in createCharacter action:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to generate characters: ${error.message}`);
        }
        throw new Error("Failed to generate characters. An unknown error occurred.");
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
  currentWorldState?: WorldState;
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
        previousWorldState: currentWorldState,
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

type UpdateCharacterDetailsInput = {
  gameId: string;
  characterId: string;
  updates: {
    name?: string;
    gender?: string;
  };
  claim?: {
    userId: string;
    userName: string;
  };
  unclaim?: {
    userId: string;
  };
};

export async function updateCharacterDetails(input: UpdateCharacterDetailsInput): Promise<{ success: boolean; message?: string }> {
  const { gameId, characterId, updates, claim, unclaim } = input;

  try {
    const app = getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, "games", gameId);

    await runTransaction(db, async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists()) {
        throw new Error("Game not found.");
      }

      const gameData = gameDoc.data();
      const characters: any[] = gameData.gameData.characters || [];
      const charIndex = characters.findIndex(c => c.id === characterId);

      if (charIndex === -1) {
        throw new Error("Character not found.");
      }
      
      const charToUpdate = { ...characters[charIndex], ...updates };

      if (claim) {
        // Check if anyone else has claimed this character
        if (charToUpdate.claimedBy && charToUpdate.claimedBy !== claim.userId) {
          throw new Error("Character is already claimed by another player.");
        }
        // Check if this user has claimed another character
        if (characters.some(c => c.claimedBy === claim.userId && c.id !== characterId)) {
          throw new Error("You have already claimed another character in this game.");
        }
        charToUpdate.claimedBy = claim.userId;
        charToUpdate.playerName = claim.userName;
      }

      if (unclaim) {
        if (charToUpdate.claimedBy !== unclaim.userId) {
          throw new Error("You can only unclaim a character you have claimed.");
        }
        charToUpdate.claimedBy = null;
        charToUpdate.playerName = "";
      }

      characters[charIndex] = charToUpdate;
      transaction.update(gameRef, { 'gameData.characters': characters });
    });

    return { success: true };
  } catch (error) {
    console.error("Error in updateCharacterDetails action:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message };
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
  } catch (error)
{
    console.error("Error in getAnswerToQuestion action:", error);
    throw new Error("Failed to get an answer from the GM. Please try again.");
  }
}

export async function generateCore(input: GenerateCampaignStructureInput): Promise<CampaignCore> {
    try {
        return await generateCampaignCore(input);
    } catch (error) {
        console.error("Error in generateCore action:", error);
        throw new Error("Failed to generate campaign core concepts. Please try again.");
    }
}

export async function generateFactionsAction(input: GenerateFactionsInput): Promise<Faction[]> {
    try {
        return await generateCampaignFactions(input);
    } catch (error) {
        console.error("Error in generateFactionsAction:", error);
        throw new Error("Failed to generate factions. Please try again.");
    }
}

export async function generateNodesAction(input: GenerateNodesInput): Promise<Node[]> {
    try {
        return await generateCampaignNodes(input);
    } catch (error) {
        console.error("Error in generateNodesAction:", error);
        throw new Error("Failed to generate situation nodes. Please try again.");
    }
}

export async function getCostEstimation(input: EstimateCostInput): Promise<EstimateCostOutput> {
    try {
        return await estimateCostFlow(input);
    } catch (error) {
        console.error("Error in getCostEstimation action:", error);
        throw new Error("Failed to get cost estimation. Please try again.");
    }
}

export async function checkConsequences(input: AssessConsequencesInput): Promise<AssessConsequencesOutput> {
    try {
        return await assessConsequences(input);
    } catch (error) {
        console.error("Error in checkConsequences action:", error);
        throw new Error("Failed to assess consequences. Please try again.");
    }
}

export async function generateRecap(input: GenerateRecapInput): Promise<GenerateRecapOutput> {
    try {
        return await generateRecapFlow(input);
    } catch (error) {
        console.error("Error in generateRecap action:", error);
        throw new Error("Failed to generate recap. Please try again.");
    }
}

export async function undoLastAction(gameId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const app = getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) {
      throw new Error("Game not found.");
    }

    const gameData = gameDoc.data();
    const previousWorldState = gameData.previousWorldState;

    if (!previousWorldState) {
      return { success: false, message: "No previous state available to undo to." };
    }

    // Also roll back messages
    const messages = gameData.messages || [];
    const storyMessages = gameData.storyMessages || [];
    
    // A simpler logic is to find the last user message and slice everything after it.
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    const rolledBackMessages = lastUserIndex !== -1 ? messages.slice(0, lastUserIndex) : messages;
    
    // For story messages, just remove the last one.
    const rolledBackStoryMessages = storyMessages.length > 0 ? storyMessages.slice(0, -1) : [];
    

    await updateDoc(gameRef, {
      worldState: previousWorldState,
      previousWorldState: null, // Can only undo once
      messages: rolledBackMessages,
      storyMessages: rolledBackStoryMessages,
      // We don't need to change the active character, as it's part of the world state that's being restored.
      // But we should reset the activeCharacterId at the top level
      activeCharacterId: previousWorldState.characters.find((c: any) => c.name === gameData.worldState.activeCharacterName)?.id || gameData.activeCharacterId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in undoLastAction action:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message };
  }
}
