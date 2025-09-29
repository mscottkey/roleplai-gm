
'use server';

import { generateNewGame as generateNewGameFlow, type GenerateNewGameInput, type GenerateNewGameResponse } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput, type ResolveActionResponse } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow, type GenerateCharacterResponse, type GenerateCharacterInput, type GenerateCharacterOutput } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow, type UpdateWorldStateResponse } from "@/ai/flows/update-world-state";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput, type AskQuestionResponse } from "@/ai/flows/ask-question";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput, type SanitizeIpResponse } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow, type AssessConsequencesResponse, type AssessConsequencesInput, type AssessConsequencesOutput } from "@/ai/flows/assess-consequences";
import { generateRecap as generateRecapFlow, type GenerateRecapInput, type GenerateRecapOutput, type GenerateRecapResponse } from "@/ai/flows/generate-recap";
import { regenerateField as regenerateFieldFlow, type RegenerateFieldInput, type RegenerateFieldResponse } from "@/ai/flows/regenerate-field";
import { narratePlayerActions as narratePlayerActionsFlow, type NarratePlayerActionsInput, type NarratePlayerActionsOutput, type NarratePlayerActionsResponse } from "@/ai/flows/narrate-player-actions";
import { classifyInput as classifyInputFlow, type ClassifyInputResponse, type ClassifyInputOutput } from "@/ai/flows/classify-input";
import { classifySetting as classifySettingFlow, type ClassifySettingResponse, type ClassifySettingOutput } from "@/ai/flows/classify-setting";
import { generateSessionBeats, generateNextSessionBeats } from "@/ai/flows/generate-session-beats";

import type { UpdateWorldStateInput as AIUpdateWorldStateInput, UpdateWorldStateOutput, WorldState, GenerateSessionBeatsInput, StoryBeat, SessionProgress, CampaignCore, Faction, Node, CampaignResolution, GenerateFactionsInput, GenerateNodesInput, GenerateResolutionInput, GenerateCampaignCoreInput, CampaignStructure } from "@/ai/schemas/world-state-schemas";
import type { ClassifyInput, ClassifySettingInput } from "@/ai/schemas/classify-schemas";

import { updateUserPreferences } from './actions/user-preferences';
import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';
import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";

// Imports for granular campaign generation
import { 
    generateCampaignCore, 
    generateCampaignFactions, 
    generateCampaignNodes 
} from "@/ai/flows/generate-campaign-pieces";
import { generateCampaignResolution } from "@/ai/flows/generate-campaign-resolution";


import type { Character as AICharacter } from "@/ai/schemas/generate-character-schemas";


import { z } from 'genkit';

// Import Firebase client SDK with proper initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDoc, query, where, getDocs, deleteDoc, arrayUnion, writeBatch, initializeFirestore } from 'firebase/firestore';


import type { Character, Message, GameSession, SessionStatus } from "@/app/lib/types";

import { GenerationUsage } from "genkit";
import * as gtag from '@/lib/gtag';

// Helper for user-friendly error messages
function handleAIError(error: Error, flowType: string): Error {
    console.error(`AI Error in ${flowType}:`, error);
    if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
        return new Error("The AI is currently experiencing high demand. Please wait a moment and try again.");
    }
    return new Error(`Failed to ${flowType.replace(/_/g, ' ')}: ${error.message}`);
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
  initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  return app;
}

type StartNewGameInput = {
  request: string;
  userId: string;
  playMode: 'local' | 'remote';
};


export async function startNewGame(input: StartNewGameInput): Promise<{ gameId: string; newGame: GenerateNewGameOutput; warningMessage?: string }> {
  const { userId, request, playMode } = input;
  let sanitizeResult: SanitizeIpResponse;
  try {
    sanitizeResult = await sanitizeIpFlow({ request: input.request });
  } catch (e: any) {
    throw handleAIError(e, 'sanitize_request');
  }
  
  const ipCheck = sanitizeResult.output;
  let gameGenResult: GenerateNewGameResponse;
  try {
    gameGenResult = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
  } catch(e: any) {
    throw handleAIError(e, 'generate_new_game');
  }

  const { output: newGame } = gameGenResult;

  let classifyResult: ClassifySettingResponse;
  try {
    classifyResult = await classifySettingFlow({
      setting: newGame.setting,
      tone: newGame.tone,
      originalRequest: ipCheck.sanitizedRequest,
    });
  } catch (e: any) {
    throw handleAIError(e, 'classify_setting');
  }
  
  const { output: classification } = classifyResult;
  const settingCategory = classification.category || 'generic';
    
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(collection(db, 'games'));
    const gameId = gameRef.id;

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
      settingCategory: settingCategory,
      sessionProgress: null,
      lastActivity: new Date().toISOString(),
      idleTimeoutMinutes: 120,
      autoEndEnabled: true,
      idleWarningShown: false,
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
     if (e instanceof Error) {
        throw new Error(`Failed to save new game to database: ${e.message}`);
     }
     throw new Error('An unknown error occurred while saving the game.');
  }
}

type ContinueStoryInput = Omit<ResolveActionInput, 'character'> & { characterId: string; gameId: string; userId: string; };
export async function continueStory(input: ContinueStoryInput): Promise<ResolveActionOutput> {
  const { characterId, worldState, gameId, userId, ...rest } = input;

  const character = worldState.characters.find(c => c.id === characterId);
  if (!character) {
      throw new Error("Character not found in world state.");
  }

  // Pre-flight checks
  const app = await getServerApp();
  const db = getFirestore(app);
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) throw new Error("Game not found for validation.");
  const gameData = gameDoc.data() as GameSession;
  if (gameData.gameData.playMode === 'remote' && gameData.activeCharacterId !== character.id) throw new Error("It is not this character's turn to act.");
  if (gameData.sessionStatus !== 'active') throw new Error("The game session is not active. Please resume the session to continue.");
  
  const flowInput = { ...rest, worldState, character };
  try {
    const result: ResolveActionResponse = await resolveActionFlow(flowInput);
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'resolve_action');
  }
}

export async function createCharacter(input: GenerateCharacterInput, gameId: string, userId: string): Promise<GenerateCharacterOutput> {
    try {
        const result: GenerateCharacterResponse = await generateCharacterFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_characters');
    }
}

type UpdateWorldStateServerInput = {
  gameId: string;
  userId: string;
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
  const { gameId, updates, playerAction, gmResponse, currentWorldState, campaignStructure, userId } = input;
  
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    if (playerAction && gmResponse && currentWorldState && campaignStructure) {
      const flowInput = { worldState: currentWorldState, playerAction, gmResponse, campaignStructure };
      try {
        const result: UpdateWorldStateResponse = await updateWorldStateFlow(flowInput);
        
        await updateDoc(gameRef, { worldState: result.output, previousWorldState: currentWorldState, ...updates });
        return result.output;
      } catch (e: any) {
        throw handleAIError(e, 'update_world_state');
      }

    } else if (updates) {
      await updateDoc(gameRef, updates);
    }

  } catch (e: any) {
     if (e instanceof Error) {
        throw new Error(`Failed to update world state in database: ${e.message}`);
     }
     throw new Error('An unknown error occurred while updating the world state.');
  }
}

export async function getAnswerToQuestion(input: AskQuestionInput, gameId: string, userId: string): Promise<AskQuestionOutput> {
  try {
    const character = input.worldState.characters.find(c => c.id === input.character.id);
    if (!character) throw new Error("Character asking question not found in world state.");
    
    const result: AskQuestionResponse = await askQuestionFlow({ ...input, character });
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'get_answer');
  }
}

export async function narratePlayerActions(input: NarratePlayerActionsInput, gameId: string, userId: string): Promise<NarratePlayerActionsOutput> {
    try {
        const result: NarratePlayerActionsResponse = await narratePlayerActionsFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'narrate_actions');
    }
}

export async function checkConsequences(input: AssessConsequencesInput, gameId: string, userId: string): Promise<AssessConsequencesOutput> {
    try {
        const result: AssessConsequencesResponse = await assessConsequencesFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'check_consequences');
    }
}

export async function generateRecap(input: GenerateRecapInput, gameId: string, userId: string): Promise<GenerateRecapOutput> {
    try {
        const result: GenerateRecapResponse = await generateRecapFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_recap');
    }
}

export async function regenerateField(input: RegenerateFieldInput, gameId: string, userId: string): Promise<{newValue: string}> {
    try {
        const result: RegenerateFieldResponse = await regenerateFieldFlow(input);
        
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        await updateDoc(gameRef, { [`gameData.${input.fieldName}`]: result.output.newValue });
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, `regenerate_${input.fieldName}`);
    }
}

export async function classifyInput(input: ClassifyInput, userId: string, gameId: string | null): Promise<ClassifyInputOutput> {
    try {
        const result: ClassifyInputResponse = await classifyInputFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'classify_input');
    }
}

export async function classifySetting(input: ClassifySettingInput, userId: string, gameId: string | null): Promise<ClassifySettingOutput> {
    try {
        const result: ClassifySettingResponse = await classifySettingFlow(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'classify_setting');
    }
}


// Granular actions for client-side orchestration
export async function generateCampaignCoreAction(input: GenerateCampaignCoreInput, gameId: string, userId: string): Promise<CampaignCore> {
    try {
        const result = await generateCampaignCore(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_campaign_core');
    }
}

export async function generateCampaignFactionsAction(input: GenerateFactionsInput, gameId: string, userId: string): Promise<Faction[]> {
    try {
        const result = await generateCampaignFactions(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_campaign_factions');
    }
}

export async function generateCampaignNodesAction(input: GenerateNodesInput, gameId: string, userId: string): Promise<Node[]> {
    try {
        const result = await generateCampaignNodes(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_campaign_nodes');
    }
}

export async function generateCampaignResolutionAction(input: GenerateResolutionInput, gameId: string, userId: string): Promise<CampaignResolution> {
    try {
        const result = await generateCampaignResolution(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_campaign_resolution');
    }
}

export async function generateSessionBeatsAction(input: GenerateSessionBeatsInput, gameId: string, userId: string): Promise<StoryBeat[]> {
    try {
        const result = await generateSessionBeats(input);
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'generate_session_beats');
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

export async function kickPlayerAction(gameId: string, playerId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        await deleteDoc(doc(db, "games", gameId, "players", playerId));
        return { success: true };
    } catch (error) {
        console.error("Error in kickPlayerAction:", error);
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

export async function regenerateGameConcept(gameId: string, request: string, userId: string): Promise<{ success: boolean; warningMessage?: string; message?: string }> {
    let sanitizeResult: SanitizeIpResponse;
    try {
        sanitizeResult = await sanitizeIpFlow({ request });
    } catch (e: any) {
        throw handleAIError(e, 'sanitize_request');
    }

    const ipCheck = sanitizeResult.output;
    try {
        const result: GenerateNewGameResponse = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
        
        const { output: newGame } = result;

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
        throw handleAIError(e, 'regenerate_game_concept');
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

export async function endCurrentSessionAction(gameId: string, endType: 'natural' | 'early' | 'interrupted' | 'idle_timeout'): Promise<{ success: boolean; message?: string }> {
    if (!gameId) {
        return { success: false, message: "Game ID is required." };
    }
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);

        const gameDoc = await getDoc(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");
        
        const updates: Record<string, any> = {
            'worldState.sessionProgress.sessionComplete': true,
            'worldState.sessionProgress.readyForNextSession': true,
            'worldState.sessionProgress.interruptedMidBeat': endType === 'interrupted' || endType === 'early' || endType === 'idle_timeout',
        };

        if (endType === 'idle_timeout') {
            updates.sessionStatus = 'paused';
        }

        await updateDoc(gameRef, updates);
        return { success: true };

    } catch (error) {
        console.error("Error in endCurrentSession action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success, message };
    }
}
    
export async function startNextSessionAction(gameId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    if (!gameId) {
        return { success: false, message: "Game ID is required." };
    }

    const app = await getServerApp();
    const db = getFirestore(app);
    const batch = writeBatch(db);

    try {
        const gameRef = doc(db, 'games', gameId);
        const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');

        const [gameDoc, campaignDoc] = await Promise.all([getDoc(gameRef), getDoc(campaignRef)]);

        if (!gameDoc.exists() || !campaignDoc.exists()) {
            throw new Error("Game or campaign data not found.");
        }

        const gameData = gameDoc.data() as GameSession;
        const campaignStructure = campaignDoc.data() as CampaignStructure;
        const worldState = gameData.worldState;

        if (!worldState.sessionProgress?.readyForNextSession) {
            throw new Error("The previous session has not been marked as complete and ready for the next session.");
        }
        
        const nextSessionNumber = (worldState.sessionProgress.currentSession || 0) + 1;
        
        const beatsInput: GenerateSessionBeatsInput = {
            setting: gameData.gameData.setting,
            tone: gameData.gameData.tone,
            characters: worldState.characters,
            campaignIssues: campaignStructure.campaignIssues,
            campaignAspects: campaignStructure.campaignAspects,
            factions: campaignStructure.factions,
            nodes: campaignStructure.nodes,
            resolution: campaignStructure.resolution,
            currentWorldState: worldState,
            sessionNumber: nextSessionNumber,
        };
        const result = await generateSessionBeatsAction(beatsInput, gameId, userId);
        
        const nextSessionBeats = result;
        const shouldConclude = nextSessionBeats.length === 0;

        if (shouldConclude) {
            await updateDoc(gameRef, { sessionStatus: 'finished' });
            return { success: true, message: "Campaign has reached its natural conclusion!" };
        }

        const newSessionProgress: SessionProgress = {
            currentSession: nextSessionNumber,
            currentBeat: 0,
            beatsCompleted: 0,
            beatsPlanned: nextSessionBeats.length,
            sessionComplete: false,
            interruptedMidBeat: false,
            readyForNextSession: false,
        };

        batch.update(campaignRef, {
            currentSessionBeats: nextSessionBeats
        });
        
        batch.update(gameRef, {
            'worldState.sessionProgress': newSessionProgress
        });

        const systemMessage: Message = {
            id: `session-start-${Date.now()}`,
            role: 'system',
            content: `**Session ${nextSessionNumber} has begun!** The story continues...`,
        };
        batch.update(gameRef, {
            messages: arrayUnion(systemMessage)
        });

        await batch.commit();
        return { success: true };

    } catch (error) {
        console.error("Error starting next session:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message };
    }
}
