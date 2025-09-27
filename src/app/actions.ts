
'use server';

import { generateNewGame as generateNewGameFlow, type GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow } from "@/ai/flows/update-world-state";
import { classifyIntent as classifyIntentFlow } from "@/ai/flows/classify-intent";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput } from "@/ai/flows/ask-question";
import { generateCampaignStructure as generateCampaignStructureFlow, type GenerateCampaignStructureInput as GenCampaignInput, type GenerateCampaignStructureOutput } from "@/ai/flows/generate-campaign-structure";
import { estimateCost as estimateCostFlow } from "@/ai/flows/estimate-cost";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow } from "@/ai/flows/assess-consequences";
import { generateRecap as generateRecapFlow, type GenerateRecapInput, type GenerateRecapOutput } from "@/ai/flows/generate-recap";
import { regenerateGameField as regenerateGameFieldFlow, type RegenerateFieldInput } from "@/ai/flows/regenerate-field";
import { narratePlayerActions as narratePlayerActionsFlow, type NarratePlayerActionsInput, type NarratePlayerActionsOutput } from "@/ai/flows/narrate-player-actions";
import { unifiedClassify } from "@/ai/flows/unified-classify";
import type { AssessConsequencesInput, AssessConsequencesOutput } from "@/ai/schemas/assess-consequences-schemas";

import type { UpdateWorldStateInput as AIUpdateWorldStateInput, UpdateWorldStateOutput } from "@/ai/schemas/world-state-schemas";
import type { EstimateCostInput, EstimateCostOutput } from "@/ai/schemas/cost-estimation-schemas";

import { updateUserPreferences } from './actions/user-preferences';
import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';


import { z } from 'genkit';
import { WorldStateSchema, type WorldState } from "@/ai/schemas/world-state-schemas";

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDoc, query, where, getDocs, deleteDoc, arrayUnion, onSnapshot, writeBatch } from 'firebase/firestore';

import type { GenerateCharacterInput, GenerateCharacterOutput, AICharacter } from "@/ai/schemas/generate-character-schemas";
import type { Character, Message, GameSession, SessionStatus } from "@/app/lib/types";

import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert } from 'firebase-admin/app';
import type { CampaignStructure, Node } from '@/ai/schemas/campaign-structure-schemas';

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
    const serviceAccountJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
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
    const ipCheck = await sanitizeIpFlow({ request: input.request });
    const newGame = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
    
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(collection(db, 'games'));

    const initialWorldState: WorldState = {
      summary: `The game is set in ${newGame.setting}. The tone is ${newGame.tone}.`,
      storyOutline: [],
      recentEvents: ["The adventure has just begun."],
      characters: [],
      places: [],
      storyAspects: [],
      knownPlaces: [],
      knownFactions: [],
      factions: [],
      nodeStates: {},
      resolution: undefined,
      currentScene: {
        nodeId: "start",
        name: "Unknown",
        description: "The adventure is about to begin.",
        presentCharacters: [],
        presentNPCs: [],
        environmentalFactors: [],
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
      sessionStatus: 'active' as SessionStatus,
    };
    
    await setDoc(gameRef, newGameDocument);

    return { gameId: gameRef.id, newGame, warningMessage: ipCheck.warningMessage };

  } catch (error) {
    console.error("Critical error in startNewGame action:", error);
    if (error instanceof Error) {
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
    try {
        return await generateCharacterFlow(input);
    } catch (error) {
        console.error("Full error in createCharacter action:", error);
        if (error instanceof Error) {
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
  campaignStructure?: CampaignStructure;
};

export async function updateWorldState(input: UpdateWorldStateInput): Promise<UpdateWorldStateOutput | void> {
  const { gameId, updates, playerAction, gmResponse, currentWorldState, campaignStructure } = input;
  
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    if (playerAction && gmResponse && currentWorldState && campaignStructure) {
      // This is an AI-driven world state update
      const newWorldState = await updateWorldStateFlow({
        worldState: currentWorldState,
        playerAction: playerAction,
        gmResponse: gmResponse,
        campaignStructure: campaignStructure,
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

export async function generateCampaignStructureAction(input: GenCampaignInput): Promise<GenerateCampaignStructureOutput> {
    try {
        return await generateCampaignStructureFlow(input);
    } catch (error) {
        console.error("Error in generateCampaignStructureAction action:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate campaign structure: ${error.message}`);
        }
        throw new Error("Failed to generate campaign structure. Please try again.");
    }
}

export async function saveCampaignStructure(gameId: string, campaign: CampaignStructure): Promise<{ success: boolean; message?: string }> {
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const batch = writeBatch(db);

    const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');
    batch.set(campaignRef, campaign);

    // Also update the top-level game doc to indicate campaign has been generated
    const gameRef = doc(db, 'games', gameId);
    batch.update(gameRef, {
      'gameData.campaignGenerated': true,
    });
    
    await batch.commit();

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

    let lastUserIndex = -1;
    for (let i = gameData.messages.length - 1; i >= 0; i--) {
      if (gameData.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    const rolledBackMessages = lastUserIndex !== -1 ? gameData.messages.slice(0, lastUserIndex) : gameData.messages;
    const rolledBackStoryMessages = gameData.storyMessages.length > 0 ? gameData.storyMessages.slice(0, -1) : [];
    
    const previousActiveCharacter = previousWorldState.characters.find((c: any) => c.id === gameData.activeCharacterId);

    await updateDoc(gameRef, {
      worldState: previousWorldState,
      previousWorldState: null,
      messages: rolledBackMessages,
      storyMessages: rolledBackStoryMessages,
      activeCharacterId: previousActiveCharacter?.id || gameData.activeCharacterId,
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
        // This doesn't handle subcollections automatically. In a real app,
        // you'd need a Cloud Function to recursively delete. For now, this is fine.
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
        getAdminSDK();
        
        if (displayName && displayName.trim().length >= 3) {
            if (!isAnonymous) {
                await getAdminAuth().updateUser(userId, { displayName });
            }
        } else if (displayName) {
             return { success: false, message: "Display name must be at least 3 characters long." };
        }

        const prefsToUpdate: { displayName?: string; defaultPronouns?: string; defaultVoiceURI?: string; } = {};
        if (displayName) prefsToUpdate.displayName = displayName;
        if (defaultPronouns) prefsToUpdate.defaultPronouns = defaultPronouns;
        if (defaultVoiceURI) prefsToUpdate.defaultVoiceURI = defaultVoiceURI;

        if (Object.keys(prefsToUpdate).length > 0) {
            const firestoreResult = await updateUserPreferences(userId, prefsToUpdate);
            if (!firestoreResult.success) {
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
    getAdminSDK();
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
        const { newValue } = await regenerateGameFieldFlow(input);

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

export async function updateSessionStatus(gameId: string, status: SessionStatus): Promise<{ success: boolean; message?: string }> {
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

export { classifyIntent, unifiedClassify };
