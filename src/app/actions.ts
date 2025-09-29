
'use server';

import { generateNewGame as generateNewGameFlow, type GenerateNewGameInput, type GenerateNewGameResponse } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput, type ResolveActionResponse } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow, type GenerateCharacterResponse, type GenerateCharacterInput, type GenerateCharacterOutput } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow, type UpdateWorldStateResponse } from "@/ai/flows/update-world-state";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput, type AskQuestionResponse } from "@/ai/flows/ask-question";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput, type SanitizeIpResponse } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow, type AssessConsequencesResponse, type AssessConsequencesInput, type AssessConsequencesOutput } from "@/ai/flows/assess-consequences";
import { logAiUsage } from './actions/admin-actions';
import { updateUserPreferences } from './actions/user-preferences';

import type { UpdateWorldStateInput as AIUpdateWorldStateInput, UpdateWorldStateOutput, WorldState, GenerateSessionBeatsInput, StoryBeat, SessionProgress, CampaignCore, Faction, Node, CampaignResolution, GenerateFactionsInput, GenerateNodesInput, GenerateResolutionInput, GenerateCampaignCoreInput, CampaignStructure } from "@/ai/schemas/world-state-schemas";
import { generateCampaignCore, generateCampaignFactions, generateCampaignNodes } from "@/ai/flows/generate-campaign-pieces";
import { generateCampaignResolution } from "@/ai/flows/generate-campaign-resolution";


import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';
import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";


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
    await logAiUsage({ userId, gameId: null, flowType: 'sanitize_ip', model: sanitizeResult.model, usage: sanitizeResult.usage });
  } catch (e: any) {
    throw handleAIError(e, 'sanitize_request');
  }
  
  const ipCheck = sanitizeResult.output;
  let gameGenResult: GenerateNewGameResponse;
  try {
    gameGenResult = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
    await logAiUsage({ userId, gameId: null, flowType: 'generate_new_game', model: gameGenResult.model, usage: gameGenResult.usage });
  } catch(e: any) {
    throw handleAIError(e, 'generate_new_game');
  }

  const { output: newGame } = gameGenResult;

  // Since classifySetting is a low-cost flow and doesn't involve generation, we can skip logging it for now.
  // This keeps the logs focused on the more expensive generation tasks.
    
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
      settingCategory: 'generic', // This will be updated by a separate client-side action
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

    const totalUsage: GenerationUsage = {
        inputTokens: sanitizeResult.usage.inputTokens + gameGenResult.usage.inputTokens,
        outputTokens: sanitizeResult.usage.outputTokens + gameGenResult.usage.outputTokens,
        totalTokens: sanitizeResult.usage.totalTokens + gameGenResult.usage.totalTokens,
    }
    await logAiUsage({ userId, gameId, flowType: 'start_new_game_total', model: 'aggregate', usage: totalUsage});


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
    await logAiUsage({ userId, gameId, flowType: 'resolve_action', model: result.model, usage: result.usage });
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'resolve_action');
  }
}

export async function createCharacter(input: GenerateCharacterInput, gameId: string, userId: string): Promise<GenerateCharacterOutput> {
    try {
        const result: GenerateCharacterResponse = await generateCharacterFlow(input);
        await logAiUsage({ userId, gameId, flowType: 'generate_character', model: result.model, usage: result.usage });
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
        await logAiUsage({ userId, gameId, flowType: 'update_world_state', model: result.model, usage: result.usage });
        
        await updateDoc(gameRef, { worldState: result.output, previousWorldState: currentWorldState, ...updates });
        return result.output;
      } catch (e: any) {
        throw handleAIError(e, 'update_world_state');
      }

    } else if (updates) {
      await updateDoc(gameRef, updates);
    }

  } catch (e: any) {
    console.error("Error in updateWorldState action:", e);
    const message = e instanceof Error ? e.message : "An unknown database error occurred.";
    throw new Error(`Failed to update world state: ${message}`);
  }
}

export async function checkConsequences(input: AssessConsequencesInput, gameId: string, userId: string): Promise<AssessConsequencesOutput> {
  try {
    const result: AssessConsequencesResponse = await assessConsequencesFlow(input);
    // Low-cost classification, so we can skip logging to reduce noise.
    // await logAiUsage({ userId, gameId, flowType: 'assess_consequences', model: result.model, usage: result.usage });
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'assess_consequences');
  }
}

// Campaign Generation Actions
export async function generateCampaignCoreAction(input: GenerateCampaignCoreInput, gameId: string, userId: string): Promise<CampaignCore> {
    const result = await generateCampaignCore(input);
    await logAiUsage({ userId, gameId, flowType: 'generate_campaign_core', model: result.model!, usage: result.usage });
    return result.output;
}

export async function generateCampaignFactionsAction(input: GenerateFactionsInput, gameId: string, userId: string): Promise<Faction[]> {
    const result = await generateCampaignFactions(input);
    await logAiUsage({ userId, gameId, flowType: 'generate_campaign_factions', model: result.model!, usage: result.usage });
    return result.output;
}

export async function generateCampaignNodesAction(input: GenerateNodesInput, gameId: string, userId: string): Promise<Node[]> {
    const result = await generateCampaignNodes(input);
    await logAiUsage({ userId, gameId, flowType: 'generate_campaign_nodes', model: result.model!, usage: result.usage });
    return result.output;
}

export async function generateCampaignResolutionAction(input: GenerateResolutionInput, gameId: string, userId: string): Promise<CampaignResolution> {
    const result = await generateCampaignResolution(input);
    await logAiUsage({ userId, gameId, flowType: 'generate_campaign_resolution', model: result.model!, usage: result.usage });
    return result.output;
}

export async function saveCampaignStructure(gameId: string, campaignStructure: CampaignStructure) {
  const app = await getServerApp();
  const db = getFirestore(app);
  const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');
  await setDoc(campaignRef, campaignStructure, { merge: true });
}
