
'use server';

import { generateNewGame as generateNewGameFlow, type GenerateNewGameInput, type GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput, type ResolveActionResponse } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow, type GenerateCharacterResponse } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow, type UpdateWorldStateResponse } from "@/ai/flows/update-world-state";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput, type AskQuestionResponse } from "@/ai/flows/ask-question";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput, type SanitizeIpResponse } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow, type AssessConsequencesResponse } from "@/ai/flows/assess-consequences";
import { generateRecap as generateRecapFlow, type GenerateRecapInput, type GenerateRecapOutput, type GenerateRecapResponse } from "@/ai/flows/generate-recap";
import { regenerateField as regenerateFieldFlow, type RegenerateFieldInput, type RegenerateFieldResponse } from "@/ai/flows/regenerate-field";
import { narratePlayerActions as narratePlayerActionsFlow, type NarratePlayerActionsInput, type NarratePlayerActionsOutput, type NarratePlayerActionsResponse } from "@/ai/flows/narrate-player-actions";
import { unifiedClassify as unifiedClassifyFlow, type UnifiedClassifyResponse } from "@/ai/flows/unified-classify";
import type { AssessConsequencesInput, AssessConsequencesOutput } from "@/ai/schemas/assess-consequences-schemas";

import type { UpdateWorldStateInput as AIUpdateWorldStateInput, UpdateWorldStateOutput } from "@/ai/schemas/world-state-schemas";

import { updateUserPreferences } from './actions/user-preferences';
import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';

// Imports for granular campaign generation
import { 
    generateCampaignCore, 
    generateCampaignFactions, 
    generateCampaignNodes 
} from "@/ai/flows/generate-campaign-pieces";
import { generateCampaignResolution } from "@/ai/flows/generate-campaign-resolution";
import type { 
    CampaignCore, 
    Faction, 
    Node, 
    CampaignResolution, 
    GenerateFactionsInput, 
    GenerateNodesInput, 
    GenerateResolutionInput,
    GenerateCampaignCoreInput as CampaignCoreInput
} from '@/ai/schemas/campaign-structure-schemas';
import type { AICharacter } from "@/ai/schemas/generate-character-schemas";


import { z } from 'genkit';
import { WorldStateSchema, type WorldState } from "@/ai/schemas/world-state-schemas";

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDoc, query, where, getDocs, deleteDoc, arrayUnion, onSnapshot, writeBatch } from 'firebase/firestore';

import type { GenerateCharacterInput, GenerateCharacterOutput } from "@/ai/schemas/generate-character-schemas";
import type { Character, Message, GameSession, SessionStatus } from "@/app/lib/types";

import type { CampaignStructure } from '@/ai/schemas/campaign-structure-schemas';
import { GenerationUsage } from "genkit";
import { UnifiedClassifyInput, UnifiedClassifyOutput } from "@/ai/flows/unified-classify";

// Helper for user-friendly error messages
function handleAIError(error: Error, defaultMessage: string): Error {
    console.error(`AI Error in ${defaultMessage}:`, error);
    if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
        return new Error("The AI is currently experiencing high demand. Please wait a moment and try again.");
    }
    return new Error(`${defaultMessage}: ${error.message}`);
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

type StartNewGameInput = {
  request: string;
  userId: string;
  playMode: 'local' | 'remote';
};


export async function startNewGame(input: StartNewGameInput): Promise<{ gameId: string; newGame: GenerateNewGameOutput; warningMessage?: string }> {
  // Step 1: Sanitize IP (this is also an AI call)
  const sanitizeInput = { request: input.request };
  let ipCheck: SanitizeIpOutput;
  try {
    const sanitizeResult: SanitizeIpResponse = await sanitizeIpFlow(sanitizeInput);
    ipCheck = sanitizeResult.output;
  } catch (e: any) {
    throw handleAIError(e, 'Failed to sanitize your request');
  }

  // Step 2: Generate Game
  const generateGameInput: GenerateNewGameInput = { request: ipCheck.sanitizedRequest };
  try {
    const { output: newGame }: { output: GenerateNewGameOutput } = await generateNewGameFlow(generateGameInput);
    
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
      resolution: null,
      turn: 0,
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
    const welcomeChatMessage: Message = { id: `welcome-chat-${Date.now()}`, role: 'system', content: welcomeMessageText };

    const newGameDocument = {
      userId: input.userId, createdAt: serverTimestamp(),
      gameData: { ...newGame, playMode: input.playMode, originalRequest: ipCheck.sanitizedRequest, promptHistory: [ipCheck.sanitizedRequest], },
      worldState: initialWorldState, previousWorldState: null, messages: [welcomeChatMessage], storyMessages: [],
      step: 'summary', activeCharacterId: null, sessionStatus: 'active' as SessionStatus,
    };
    
    await setDoc(gameRef, newGameDocument);

    return { gameId: gameRef.id, newGame, warningMessage: ipCheck.warningMessage };

  } catch (e: any) {
    throw handleAIError(e, 'Failed to generate a new game');
  }
}

type ContinueStoryInput = Omit<ResolveActionInput, 'character'> & { characterId: string; gameId: string; };
export async function continueStory(input: ContinueStoryInput): Promise<ResolveActionOutput> {
  const { characterId, worldState, gameId, ...rest } = input;

  const character = worldState.characters.find(c => c.id === characterId);
  if (!character) {
      throw new Error("Character not found in world state.");
  }

  // Pre-flight checks (no logging needed for these)
  const app = await getServerApp();
  const db = getFirestore(app);
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) throw new Error("Game not found for validation.");
  const gameData = gameDoc.data() as GameSession;
  if (gameData.gameData.playMode === 'remote' && gameData.activeCharacterId !== character.id) throw new Error("It is not this character's turn to act.");
  if (gameData.sessionStatus !== 'active') throw new Error("The game session is not active. Please resume the session to continue.");
  
  const flowInput = { ...rest, worldState, character };
  try {
    const { output }: ResolveActionResponse = await resolveActionFlow(flowInput);
    return output;
  } catch (e: any) {
    throw handleAIError(e, 'The story could not be continued');
  }
}

export async function createCharacter(input: GenerateCharacterInput, gameId: string): Promise<GenerateCharacterOutput> {
    try {
        const result: GenerateCharacterResponse = await generateCharacterFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate characters');
    }
}

type UpdateWorldStateServerInput = {
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

export async function updateWorldState(input: UpdateWorldStateServerInput): Promise<UpdateWorldStateOutput | void> {
  const { gameId, updates, playerAction, gmResponse, currentWorldState, campaignStructure } = input;
  
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    if (playerAction && gmResponse && currentWorldState && campaignStructure) {
      const flowInput = { worldState: currentWorldState, playerAction, gmResponse, campaignStructure };
      try {
        const { output: newWorldState }: UpdateWorldStateResponse = await updateWorldStateFlow(flowInput);
        await updateDoc(gameRef, { worldState: newWorldState, previousWorldState: currentWorldState, ...updates });
        return newWorldState;
      } catch (e: any) {
        throw e; // Re-throw to be caught by the outer catch block
      }

    } else if (updates) {
      // This is a direct data update
      await updateDoc(gameRef, updates);
    }

  } catch (e: any) {
    throw handleAIError(e, 'Failed to update the world state');
  }
}

export async function getAnswerToQuestion(input: AskQuestionInput & { gameId: string }): Promise<AskQuestionOutput> {
  const { gameId, ...flowInput } = input;
  try {
    const character = flowInput.worldState.characters.find(c => c.id === flowInput.character.id);
    if (!character) throw new Error("Character asking question not found in world state.");
    
    const { output }: AskQuestionResponse = await askQuestionFlow({ ...flowInput, character });
    return output;
  } catch (e: any) {
    throw handleAIError(e, 'Failed to get an answer from the GM');
  }
}

export async function narratePlayerActions(input: NarratePlayerActionsInput, gameId: string): Promise<NarratePlayerActionsOutput> {
    try {
        const { output }: NarratePlayerActionsResponse = await narratePlayerActionsFlow(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to get GM acknowledgement');
    }
}

export async function checkConsequences(input: AssessConsequencesInput, gameId: string): Promise<AssessConsequencesOutput> {
    try {
        const { output }: AssessConsequencesResponse = await assessConsequencesFlow(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to assess consequences');
    }
}

export async function generateRecap(input: GenerateRecapInput, gameId: string): Promise<GenerateRecapOutput> {
    try {
        const { output }: GenerateRecapResponse = await generateRecapFlow(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate recap');
    }
}

export async function regenerateField(input: RegenerateFieldInput, gameId: string): Promise<{newValue: string}> {
    try {
        const { output }: RegenerateFieldResponse = await regenerateFieldFlow(input);
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        await updateDoc(gameRef, { [`gameData.${input.fieldName}`]: output.newValue });
        return output;
    } catch (e: any) {
        throw handleAIError(e, `Failed to regenerate ${input.fieldName}`);
    }
}

export async function unifiedClassify(input: UnifiedClassifyInput, gameId: string): Promise<UnifiedClassifyOutput> {
    try {
        const { output }: UnifiedClassifyResponse = await unifiedClassifyFlow(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to classify input');
    }
}

// Granular actions for client-side orchestration
export async function generateCampaignCoreAction(input: CampaignCoreInput, gameId: string): Promise<CampaignCore> {
    try {
        const { output } = await generateCampaignCore(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate campaign core concepts');
    }
}

export async function generateCampaignFactionsAction(input: GenerateFactionsInput, gameId: string): Promise<Faction[]> {
    try {
        const { output } = await generateCampaignFactions(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate campaign factions');
    }
}

export async function generateCampaignNodesAction(input: GenerateNodesInput, gameId: string): Promise<Node[]> {
    try {
        const { output } = await generateCampaignNodes(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate campaign nodes');
    }
}

export async function generateCampaignResolutionAction(input: GenerateResolutionInput, gameId: string): Promise<CampaignResolution> {
    try {
        const { output } = await generateCampaignResolution(input);
        return output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to generate campaign resolution');
    }
}


// NON-AI Actions below.
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

    if (isAnonymous) {
      return { success: false, message: "Guest users cannot have profiles." };
    }
    
    const { displayName, defaultPronouns, defaultVoiceURI } = updates;
    
    try {
        const prefsToUpdate: { displayName?: string; defaultPronouns?: string; defaultVoiceURI?: string; } = {};
        if (displayName) prefsToUpdate.displayName = displayName;
        if (defaultPronouns) prefsToUpdate.defaultPronouns = defaultPronouns;
        if (defaultVoiceURI) prefsToUpdate.defaultVoiceURI = defaultVoiceURI;

        if (Object.keys(prefsToUpdate).length > 0) {
            const firestoreResult = await updateUserPreferences(userId, prefsToUpdate);
            if (!firestoreResult.success) {
                throw new Error(firestoreResult.message);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error in updateUserProfile action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}

export async function regenerateGameConcept(gameId: string, request: string): Promise<{ success: boolean; warningMessage?: string; message?: string }> {
    const sanitizeInput = { request };
    let ipCheck: SanitizeIpOutput;
     try {
        const sanitizeResult = await sanitizeIpFlow(sanitizeInput);
        ipCheck = sanitizeResult.output;
    } catch (e: any) {
        throw handleAIError(e, 'Failed to sanitize your request');
    }

    const generateGameInput = { request: ipCheck.sanitizedRequest };
    try {
        const { output: newGame } = await generateNewGameFlow(generateGameInput);

        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        await updateDoc(gameRef, {
            'gameData.name': newGame.name, 'gameData.setting': newGame.setting, 'gameData.tone': newGame.tone,
            'gameData.difficulty': newGame.difficulty, 'gameData.initialHooks': newGame.initialHooks,
            'gameData.originalRequest': ipCheck.sanitizedRequest, 'gameData.promptHistory': arrayUnion(ipCheck.sanitizedRequest)
        });
        
        return { success: true, warningMessage: ipCheck.warningMessage };
    } catch (e: any) {
        throw handleAIError(e, 'Failed to regenerate game concept');
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

    