
'use server';

// AI FLOW IMPORTS
import { generateNewGame as generateNewGameFlow, type GenerateNewGameInput, type GenerateNewGameResponse } from "@/ai/flows/generate-new-game";
import { resolveAction as resolveActionFlow, type ResolveActionOutput, type ResolveActionResponse } from "@/ai/flows/integrate-rules-adapter";
import { generateCharacter as generateCharacterFlow, type GenerateCharacterResponse, type GenerateCharacterInput, type GenerateCharacterOutput } from "@/ai/flows/generate-character";
import { updateWorldState as updateWorldStateFlow, type UpdateWorldStateResponse } from "@/ai/flows/update-world-state";
import { askQuestion as askQuestionFlow, type AskQuestionInput, type AskQuestionOutput, type AskQuestionResponse } from "@/ai/flows/ask-question";
import { sanitizeIp as sanitizeIpFlow, type SanitizeIpOutput, type SanitizeIpResponse } from "@/ai/flows/sanitize-ip";
import { assessConsequences as assessConsequencesFlow, type AssessConsequencesResponse, type AssessConsequencesInput, type AssessConsequencesOutput } from "@/ai/flows/assess-consequences";
import { regenerateField as regenerateFieldFlow, type RegenerateFieldInput, type RegenerateFieldResponse, type RegenerateFieldOutput } from "@/ai/flows/regenerate-field";
import { narratePlayerActions as narratePlayerActionsFlow, type NarratePlayerActionsInput, type NarratePlayerActionsOutput, type NarratePlayerActionsResponse } from "@/ai/flows/narrate-player-actions";
import { generateRecap as generateRecapFlow, type GenerateRecapResponse, type GenerateRecapInput, type GenerateRecapOutput } from "@/ai/flows/generate-recap";
import { classifyInput as classifyInputFlow, type ClassifyInputResponse, type ClassifyInputOutput } from "@/ai/flows/classify-input";
import { classifySetting as classifySettingFlow, type ClassifySettingResponse, type ClassifySettingOutput } from "@/ai/flows/classify-setting";

import { generateCampaignCore, generateCampaignFactions, generateCampaignNodes } from "@/ai/flows/generate-campaign-pieces";
import { generateCampaignResolution } from "@/ai/flows/generate-campaign-resolution";
import { generateNextSessionBeats, generateSessionBeats } from "@/ai/flows/generate-session-beats";

// OTHER ACTION IMPORTS
import { logAiUsage } from './actions/admin-actions';
import { updateUserPreferences, type UserPreferences } from './actions/user-preferences';


// TYPE IMPORTS
import type { UpdateWorldStateInput as AIUpdateWorldStateInput, WorldState, GenerateSessionBeatsInput, StoryBeat, SessionProgress, CampaignCore, Faction, Node, CampaignResolution, GenerateFactionsInput, GenerateNodesInput, GenerateResolutionInput, GenerateCampaignCoreInput, CampaignStructure } from "@/ai/schemas/world-state-schemas";
import type { ResolveActionInput } from '@/ai/flows/integrate-rules-adapter';
import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import type { ClassifyInput, ClassifySettingInput } from "@/ai/schemas/classify-schemas";


import { z } from 'genkit';

// FIREBASE IMPORTS
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDoc, query, where, getDocs, deleteDoc, arrayUnion, writeBatch, initializeFirestore } from 'firebase/firestore';


import type { Character, Message, GameSession, SessionStatus } from "@/app/lib/types";

import { GenerationUsage } from "genkit";
import * as gtag from '@/lib/gtag';

// HELPER FUNCTIONS
function handleAIError(error: Error, flowType: string): Error {
    console.error(`AI Error in ${flowType}:`, error);
    if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
        return new Error("The AI is currently experiencing high demand. Please wait a moment and try again.");
    }
    return new Error(`Failed to ${flowType.replace(/_/g, ' ')}: ${error.message}`);
}

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

// GAME CREATION
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
    if (sanitizeResult.model && sanitizeResult.usage) {
        await logAiUsage({ userId, gameId: null, flowType: 'sanitize_ip', model: sanitizeResult.model, usage: sanitizeResult.usage });
    }
  } catch (e: any) {
    throw handleAIError(e, 'sanitize_request');
  }
  
  const ipCheck = sanitizeResult.output;
  let gameGenResult: GenerateNewGameResponse;
  try {
    gameGenResult = await generateNewGameFlow({ request: ipCheck.sanitizedRequest });
    if (gameGenResult.model && gameGenResult.usage) {
        await logAiUsage({ userId, gameId: null, flowType: 'generate_new_game', model: gameGenResult.model, usage: gameGenResult.usage });
    }
  } catch(e: any) {
    throw handleAIError(e, 'generate_new_game');
  }

  const { output: newGame } = gameGenResult;
    
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
      settingCategory: 'generic', 
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

// IN-GAME ACTIONS
type ContinueStoryInput = Omit<ResolveActionInput, 'character'> & { characterId: string; gameId: string; userId: string; };
export async function continueStory(input: ContinueStoryInput): Promise<ResolveActionOutput> {
  const { characterId, worldState, gameId, userId, ...rest } = input;

  const character = worldState.characters.find(c => c.id === characterId);
  if (!character) {
      throw new Error("Character not found in world state.");
  }
  
  const flowInput = { ...rest, worldState, character };
  try {
    const result: ResolveActionResponse = await resolveActionFlow(flowInput);
    if (result.model && result.usage) {
        await logAiUsage({ userId, gameId, flowType: 'resolve_action', model: result.model, usage: result.usage });
    }
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'resolve_action');
  }
}

export async function getAnswerToQuestion(input: AskQuestionInput, gameId: string, userId: string): Promise<AskQuestionOutput> {
  try {
    const result: AskQuestionResponse = await askQuestionFlow(input);
    if (result.model && result.usage) {
        await logAiUsage({ userId, gameId, flowType: 'ask_question', model: result.model, usage: result.usage });
    }
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'ask_question');
  }
}

export async function narratePlayerActions(input: NarratePlayerActionsInput, gameId: string, userId: string): Promise<NarratePlayerActionsOutput> {
    try {
        const result: NarratePlayerActionsResponse = await narratePlayerActionsFlow(input);
        if (result.model && result.usage) {
            await logAiUsage({ userId, gameId, flowType: 'narrate_action', model: result.model, usage: result.usage });
        }
        return result.output;
    } catch (e: any) {
        throw handleAIError(e, 'narrate_action');
    }
}

// CHARACTER & CAMPAIGN GENERATION
export async function createCharacter(input: GenerateCharacterInput, gameId: string, userId: string): Promise<GenerateCharacterOutput> {
    try {
        const result: GenerateCharacterResponse = await generateCharacterFlow(input);
        
        if (result.model && result.usage) {
            await logAiUsage({ userId, gameId, flowType: 'generate_character', model: result.model, usage: result.usage });
        }

        const app = await getServerApp();
        const db = getFirestore(app);
        const batch = writeBatch(db);

        result.output.characters.forEach((char) => {
          const playerRef = doc(db, 'games', gameId, 'players', char.slotId);
          const characterData: Character = {
            id: char.slotId,
            isCustom: false,
            playerId: char.slotId,
            playerName: char.playerName,
            name: char.name,
            description: char.description,
            aspect: char.aspect,
            pronouns: char.pronouns,
            age: char.age,
            archetype: char.archetype,
            stats: char.stats,
          };
          batch.set(playerRef, {
            characterData: {
                generatedCharacter: characterData,
            },
            characterCreationStatus: 'ready',
        }, { merge: true });
        });

        await batch.commit();
        
        return result.output;
    } catch (e: any) {
        console.error("Error in createCharacter or saving:", e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred during character creation or saving.';
        throw new Error(`Failed to create characters: ${message}`);
    }
}

export async function generateCampaignCoreAction(input: GenerateCampaignCoreInput, gameId: string, userId: string): Promise<CampaignCore> {
    const result = await generateCampaignCore(input);
    if (result.model && result.usage) {
      await logAiUsage({ userId, gameId, flowType: 'generate_campaign_core', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function generateCampaignFactionsAction(input: GenerateFactionsInput, gameId: string, userId: string): Promise<Faction[]> {
    const result = await generateCampaignFactions(input);
    if (result.model && result.usage) {
      await logAiUsage({ userId, gameId, flowType: 'generate_campaign_factions', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function generateCampaignNodesAction(input: GenerateNodesInput, gameId: string, userId: string): Promise<Node[]> {
    const result = await generateCampaignNodes(input);
    if (result.model && result.usage) {
      await logAiUsage({ userId, gameId, flowType: 'generate_campaign_nodes', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function generateCampaignResolutionAction(input: GenerateResolutionInput, gameId: string, userId: string): Promise<CampaignResolution> {
    const result = await generateCampaignResolution(input);
    if (result.model && result.usage) {
      await logAiUsage({ userId, gameId, flowType: 'generate_campaign_resolution', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function regenerateField(input: RegenerateFieldInput, gameId: string, userId: string): Promise<RegenerateFieldOutput> {
    try {
        const result: RegenerateFieldResponse = await regenerateFieldFlow(input);
        if (result.model && result.usage) {
            await logAiUsage({ userId, gameId, flowType: 'regenerate_field', model: result.model, usage: result.usage });
        }
        return result.output;
    } catch(e: any) {
        throw handleAIError(e, 'regenerate_field');
    }
}

// WORLD STATE & GAME MANAGEMENT
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
        if (result.model && result.usage) {
            await logAiUsage({ userId, gameId, flowType: 'update_world_state', model: result.model, usage: result.usage });
        }
        
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

export async function undoLastAction(gameId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);

        if (!gameSnap.exists()) {
            throw new Error('Game not found.');
        }

        const gameData = gameSnap.data() as GameSession;
        if (!gameData.previousWorldState) {
            throw new Error('No previous state to restore.');
        }

        await updateDoc(gameRef, {
            worldState: gameData.previousWorldState,
            previousWorldState: null,
            // Also revert the last message if applicable
        });

        return { success: true };
    } catch (e: any) {
        const message = e instanceof Error ? e.message : "An unknown error occurred during undo.";
        console.error("Undo failed:", message);
        return { success: false, message };
    }
}

export async function checkConsequences(input: AssessConsequencesInput, gameId: string, userId: string): Promise<AssessConsequencesOutput> {
  try {
    const result: AssessConsequencesResponse = await assessConsequencesFlow(input);
    if (result.model && result.usage) {
        await logAiUsage({ userId, gameId, flowType: 'assess_consequences', model: result.model, usage: result.usage });
    }
    return result.output;
  } catch (e: any) {
    throw handleAIError(e, 'assess_consequences');
  }
}

export async function saveCampaignStructure(gameId: string, campaignStructure: CampaignStructure) {
  const app = await getServerApp();
  const db = getFirestore(app);
  const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');
  await setDoc(campaignRef, campaignStructure, { merge: true });
}

export async function updateSessionStatus(gameId: string, status: SessionStatus): Promise<{ success: boolean }> {
  try {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, { sessionStatus: status });
    return { success: true };
  } catch (error) {
    console.error('Error updating session status:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to update session status: ${message}`);
  }
}

export async function deleteGame(gameId: string): Promise<{ success: boolean }> {
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        // It's good practice to also delete subcollections, but for this MVP, deleting the main doc is sufficient.
        await deleteDoc(doc(db, 'games', gameId));
        return { success: true };
    } catch (error) {
        console.error(`Error deleting game ${gameId}:`, error);
        throw new Error('Failed to delete game.');
    }
}

export async function renameGame(gameId: string, newName: string): Promise<{ success: boolean }> {
    if (!newName.trim()) {
        throw new Error('Game name cannot be empty.');
    }
    try {
        const app = await getServerApp();
        const db = getFirestore(app);
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, { 'gameData.name': newName });
        return { success: true };
    } catch (error) {
        console.error(`Error renaming game ${gameId}:`, error);
        throw new Error('Failed to rename game.');
    }
}

// SESSION MANAGEMENT
export async function generateRecap(input: GenerateRecapInput, gameId: string, userId: string): Promise<GenerateRecapOutput> {
    try {
        const result: GenerateRecapResponse = await generateRecapFlow(input);
        if (result.model && result.usage) {
            await logAiUsage({ userId, gameId, flowType: 'generate_recap', model: result.model, usage: result.usage });
        }
        return result.output;
    } catch(e: any) {
        throw handleAIError(e, 'generate_recap');
    }
}

export async function generateSessionBeatsAction(input: GenerateSessionBeatsInput, gameId: string, userId: string): Promise<StoryBeat[]> {
    const result = await generateSessionBeats(input);
    if (result.model && result.usage) {
      await logAiUsage({ userId, gameId, flowType: 'generate_session_beats', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function endCurrentSessionAction(gameId: string, endType: 'natural' | 'interrupted' | 'early' | 'idle_timeout'): Promise<{ success: boolean }> {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);

    const updates: Record<string, any> = {
        'worldState.sessionProgress.sessionComplete': true,
        'worldState.sessionProgress.readyForNextSession': true,
        'sessionStatus': 'paused'
    };

    if (endType === 'interrupted') {
        updates['worldState.sessionProgress.interruptedMidBeat'] = true;
    }

    await updateDoc(gameRef, updates);
    return { success: true };
}


export async function startNextSessionAction(gameId: string, userId: string): Promise<{ newBeats: StoryBeat[], newSessionNumber: number }> {
    const app = await getServerApp();
    const db = getFirestore(app);
    const gameRef = doc(db, 'games', gameId);
    const campaignRef = doc(db, 'games', gameId, 'campaign', 'data');
    
    const [gameSnap, campaignSnap] = await Promise.all([getDoc(gameRef), getDoc(campaignRef)]);
    
    if (!gameSnap.exists() || !campaignSnap.exists()) {
        throw new Error("Game or campaign data not found.");
    }
    
    const game = gameSnap.data() as GameSession;
    const campaign = campaignSnap.data() as CampaignStructure;

    const newBeats = await generateNextSessionBeats(game.worldState, campaign);

    const newSessionNumber = (game.worldState.sessionProgress?.currentSession || 0) + 1;
    
    const newSessionProgress: SessionProgress = {
        currentSession: newSessionNumber,
        currentBeat: 1,
        beatsCompleted: 0,
        beatsPlanned: newBeats.length,
        sessionComplete: false,
        interruptedMidBeat: false,
        readyForNextSession: false,
    };
    
    await updateDoc(gameRef, {
        'worldState.sessionProgress': newSessionProgress,
        'campaign.currentSessionBeats': newBeats,
        sessionStatus: 'active'
    });

    return { newBeats, newSessionNumber };
}


// USER & PLAYER MANAGEMENT
export async function kickPlayerAction(gameId: string, playerId: string): Promise<{ success: true }> {
    const app = await getServerApp();
    const db = getFirestore(app);
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    await deleteDoc(playerRef);
    return { success: true };
}

export async function updateUserProfile(userId: string, updates: UserPreferences): Promise<{ success: boolean; message?: string; }> {
  return updateUserPreferences(userId, updates);
}

// CLASSIFICATION ACTIONS
export async function classifyInput(input: ClassifyInput, userId: string, gameId: string | null): Promise<ClassifyInputOutput> {
    const result: ClassifyInputResponse = await classifyInputFlow(input);
    if (result.model && result.usage) {
        await logAiUsage({ userId, gameId, flowType: 'classify_input', model: result.model, usage: result.usage });
    }
    return result.output;
}

export async function classifySetting(input: ClassifySettingInput, userId: string, gameId: string | null): Promise<ClassifySettingOutput> {
    const result: ClassifySettingResponse = await classifySettingFlow(input);
    if (result.model && result.usage) {
        await logAiUsage({ userId, gameId, flowType: 'classify_setting', model: result.model, usage: result.usage });
    }
    return result.output;
}
