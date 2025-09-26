
'use server';

import { generateNewGame as generateNewGameFlow, type GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow } from "@/ai/flows/update-world-state";
import { classifyIntent as classifyIntentFlow, type ClassifyIntentInput, type ClassifyIntentOutput } from "@/ai/flows/classify-intent";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput } from "@/ai/flows/ask-question";
import { generateCampaignStructure as generateCampaignStructureFlow, type GenerateCampaignStructureOutput } from "@/ai/flows/generate-campaign-structure";
import { estimateCost as estimateCostFlow } from "@/ai/flows/estimate-cost";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow } from "@/ai/flows/assess-consequences";
import { generateRecap as generateRecapFlow, type GenerateRecapInput, type GenerateRecapOutput } from "@/ai/flows/generate-recap";
import { regenerateField as regenerateFieldFlow, type RegenerateFieldInput } from "@/ai/flows/regenerate-field";
import { narratePlayerActions as narratePlayerActionsFlow, type NarratePlayerActionsInput, type NarratePlayerActionsOutput } from "@/ai/flows/narrate-player-actions";
import type { AssessConsequencesInput, AssessConsequencesOutput } from "@/ai/schemas/assess-consequences-schemas";

import type { UpdateWorldStateOutput } from "@/ai/schemas/world-state-schemas";
import type { EstimateCostInput, EstimateCostOutput } from "@/ai/schemas/cost-estimation-schemas";

import { updateUserPreferences } from './actions/user-preferences';
import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';


import { z } from 'genkit';
import { WorldStateSchema, type WorldState } from "@/ai/schemas/world-state-schemas";

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDoc, query, where, getDocs, deleteDoc, arrayUnion } from 'firebase/firestore';

import type { GenerateCharacterInput, GenerateCharacterOutput, AICharacter } from "@/ai/schemas/generate-character-schemas";
import type { Character, Message, GameSession } from "@/app/lib/types";

import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
function getAdminSDK() {
  if (getAdminApps().length > 0) {
    return getAdminApp();
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyBase64) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. It must be a base64 encoded string.');
  }

  try {
    // Decode the base64 string to get the JSON string
    const serviceAccountJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
    // Parse the JSON string into an object
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return initializeAdminApp({
      credential: cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid base64-encoded JSON string.', e.message);
    throw e;
  }
}


// Initialize Firebase for server actions
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function getServerApp() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerApp should not be called on the client');
  }
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Ensure firestore is initialized
  getFirestore(app);
  return app;
}

type GenerateNewGameInput = {
  request: string;
  userId: string;
  playMode: 'local' | 'remote';
};


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
    
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(collection(db, 'games'));
    console.log("Game document ID will be:", gameRef.id);

    const initialWorldState: Omit<z.infer<typeof WorldStateSchema>, 'settingCategory'> & { settingCategory?: string } = {
      summary: `The game is set in ${newGame.setting}. The tone is ${newGame.tone}.`,
      storyOutline: [],
      recentEvents: ["The adventure has just begun."],
      characters: [],
      places: [],
      storyAspects: [],
      knownPlaces: [],
      knownFactions: [],
      currentLocation: {
        name: "Unknown",
        description: "The adventure is about to begin.",
        environmentalConditions: [],
        connections: [],
      },
    };
    
    const welcomeMessageText = `**Welcome to ${newGame.name}!**\n\nReview the story summary, then continue to create your character(s).`;
    
    const welcomeChatMessage: Message = {
        id: `welcome-chat-${Date.now()}`,
        role: 'system',
        content: welcomeMessageText
    };

    const newGameDocument = {
      userId: input.userId,
      createdAt: serverTimestamp(),
      gameData: {
        ...newGame,
        playMode: input.playMode,
        originalRequest: ipCheck.sanitizedRequest,
        promptHistory: [ipCheck.sanitizedRequest],
      },
      worldState: initialWorldState,
      previousWorldState: null,
      messages: [welcomeChatMessage],
      storyMessages: [],
      step: 'summary',
      activeCharacterId: null,
      sessionStatus: 'active',
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

type ContinueStoryInput = Omit<ResolveActionInput, 'character'> & { characterId: string };
export async function continueStory(input: ContinueStoryInput): Promise<ResolveActionOutput> {
  const { characterId, worldState, ...rest } = input;

  const character = worldState.characters.find(c => c.id === characterId);
  if (!character) {
      throw new Error("Character not found in world state.");
  }
  
  // A bit of a hacky way to find the gameId from the worldState
  const app = await getServerApp();
  const db = getFirestore(app);
  const gameQuery = query(collection(db, 'games'), where('worldState.summary', '==', worldState.summary));
  const gameSnapshot = await getDocs(gameQuery);
  
  if (gameSnapshot.empty) {
    throw new Error("Game not found for validation.");
  }
  const gameDoc = gameSnapshot.docs[0];
  const gameData = gameDoc.data() as GameSession;

  if (gameData.gameData.playMode === 'remote' && gameData.activeCharacterId !== character.id) {
      throw new Error("It is not this character's turn to act.");
  }

  if (gameData.sessionStatus !== 'active') {
    throw new Error("The game session is not active. Please resume the session to continue.");
  }
  
  try {
    return await resolveActionFlow({ ...rest, worldState, character });
  } catch (error) {
    console.error("Error in continueStory action:", error);
    if (error instanceof Error) {
        throw new Error(`The story could not be continued: ${error.message}`);
    }
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
    const app = await getServerApp();
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
    if (error instanceof Error) {
        throw new Error(`Failed to update the world state: ${error.message}`);
    }
    throw new Error("Failed to update the world state. Please try again.");
  }
}

export async function classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentOutput> {
    try {
        return await classifyIntentFlow(input);
    } catch (error) {
        console.error("Error in classifyIntent action:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to classify intent: ${error.message}`);
        }
        throw new Error("Failed to classify intent. Please try again.");
    }
}

export async function getAnswerToQuestion(input: AskQuestionInput): Promise<AskQuestionOutput> {
  try {
    const character = input.worldState.characters.find(c => c.id === input.character.id);
    if (!character) {
      throw new Error("Character asking question not found in world state.");
    }
    return await askQuestionFlow({ ...input, character });
  } catch (error) {
    console.error("Error in getAnswerToQuestion action:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get an answer from the GM: ${error.message}`);
    }
    throw new Error("Failed to get an answer from the GM. Please try again.");
  }
}

export async function narratePlayerActions(input: NarratePlayerActionsInput): Promise<NarratePlayerActionsOutput> {
    try {
        return await narratePlayerActionsFlow(input);
    } catch (error) {
        console.error("Error in narratePlayerActions action:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get GM acknowledgement: ${error.message}`);
        }
        throw new Error("Failed to get GM acknowledgement. Please try again.");
    }
}

export async function generateCampaignStructureAction(input: GenerateCampaignStructureInput): Promise<GenerateCampaignStructureOutput> {
    try {
        return await generateCampaignStructureFlow(input);
    } catch (error) {
        console.error("Error in generateCampaignStructureAction action:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to generate campaign structure: ${error.message}`);
        }
        throw new Error("Failed to generate campaign structure. Please try again.");
    }
}

export async function saveCampaignStructure(gameId: string, campaign: Omit<GenerateCampaignStructureOutput, 'settingCategory'>): Promise<{ success: boolean; message?: string }> {
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    
    // Create a reference to the subcollection document with a consistent ID.
    const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');
    
    // Save the entire campaign structure object to this single document.
    await setDoc(campaignRef, campaign);

    return { success: true };
    
  } catch (error) {
    console.error("Error in saveCampaignStructure action:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message };
  }
}


export async function getCostEstimation(input: EstimateCostInput): Promise<EstimateCostOutput> {
    try {
        return await estimateCostFlow(input);
    } catch (error) {
        console.error("Error in getCostEstimation action:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to get cost estimation: ${error.message}`);
        }
        throw new Error("Failed to get cost estimation. Please try again.");
    }
}

export async function checkConsequences(input: AssessConsequencesInput): Promise<AssessConsequencesOutput> {
    try {
        return await assessConsequencesFlow(input);
    } catch (error)
    {
        console.error("Error in checkConsequences action:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to assess consequences: ${error.message}`);
        }
        throw new Error("Failed to assess consequences. Please try again.");
    }
}

export async function generateRecap(input: GenerateRecapInput): Promise<GenerateRecapOutput> {
    try {
        return await generateRecapFlow(input);
    } catch (error) {
        console.error("Error in generateRecap action:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to generate recap: ${error.message}`);
        }
        throw new Error("Failed to generate recap. Please try again.");
    }
}

export async function undoLastAction(gameId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const app = await getServerApp();
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

export async function deleteGame(gameId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        await deleteDoc(doc(db, "games", gameId));
        return { success: true };
    } catch (error) {
        console.error("Error in deleteGame action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function renameGame(gameId: string, newName: string): Promise<{ success: boolean; message?: string }> {
    if (!newName.trim()) {
        return { success: false, message: "Game name cannot be empty." };
    }
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
            'gameData.name': newName
        });
        return { success: true };
    } catch (error) {
        console.error("Error in renameGame action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function updateUserProfile(userId: string, isAnonymous: boolean, updates: { displayName?: string; defaultPronouns?: string; defaultVoiceURI?: string; }): Promise<{ success: boolean; message?: string }> {
    if (!userId) {
        return { success: false, message: "User ID is required." };
    }
    
    const { displayName, defaultPronouns, defaultVoiceURI } = updates;
    
    try {
        getAdminSDK(); // Ensure admin app is initialized
        
        // Update Firebase Auth display name if provided and user is not anonymous
        if (displayName && displayName.trim().length >= 3) {
            if (!isAnonymous) {
                await getAdminAuth().updateUser(userId, { displayName });
            }
        } else if (displayName) {
             return { success: false, message: "Display name must be at least 3 characters long." };
        }

        // Update custom preferences in Firestore
        const prefsToUpdate: { displayName?: string; defaultPronouns?: string; defaultVoiceURI?: string; } = {};
        if (displayName) prefsToUpdate.displayName = displayName;
        if (defaultPronouns) prefsToUpdate.defaultPronouns = defaultPronouns;
        if (defaultVoiceURI) prefsToUpdate.defaultVoiceURI = defaultVoiceURI;

        if (Object.keys(prefsToUpdate).length > 0) {
            const firestoreResult = await updateUserPreferences(userId, prefsToUpdate);
            if (!firestoreResult.success) {
                // If this fails, we should still return success if the auth update succeeded, but log the error.
                console.error("Failed to update user preferences in Firestore, but auth may have succeeded.", firestoreResult.message);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error in updateUserProfile action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function setAdminClaim(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    getAdminSDK(); // Ensure admin app is initialized
    await getAdminAuth().setCustomUserClaims(userId, { admin: true });
    return { success: true, message: `Successfully set admin claim for user ${userId}.` };
  } catch (error) {
    console.error(`Error setting admin claim for user ${userId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message };
  }
}

export async function regenerateGameConcept(gameId: string, request: string): Promise<{ success: boolean; warningMessage?: string; message?: string }> {
    try {
        const ipCheck = await sanitizeIpFlow({ request });
        const newGame = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });

        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        await updateDoc(gameRef, {
            'gameData.name': newGame.name,
            'gameData.setting': newGame.setting,
            'gameData.tone': newGame.tone,
            'gameData.difficulty': newGame.difficulty,
            'gameData.initialHooks': newGame.initialHooks,
            'gameData.originalRequest': ipCheck.sanitizedRequest,
            'gameData.promptHistory': arrayUnion(ipCheck.sanitizedRequest)
        });

        return { success: true, warningMessage: ipCheck.warningMessage };
    } catch (error) {
        console.error("Error in regenerateGameConcept action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function regenerateGameField(gameId: string, input: RegenerateFieldInput): Promise<{ success: boolean; message?: string }> {
    try {
        const { newValue } = await regenerateFieldFlow(input);

        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        await updateDoc(gameRef, {
            [`gameData.${input.fieldName}`]: newValue,
        });

        return { success: true };
    } catch (error) {
        console.error(`Error in regenerateGameField action for field ${input.fieldName}:`, error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function updateSessionStatus(gameId: string, status: 'active' | 'paused' | 'finished' | 'archived'): Promise<{ success: boolean; message?: string }> {
    if (!gameId || !status) {
        return { success: false, message: "Game ID and status are required." };
    }
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, {
            sessionStatus: status
        });
        return { success: true };
    } catch (error) {
        console.error("Error in updateSessionStatus action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}
