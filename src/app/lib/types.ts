
import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import type { WorldState } from "@/ai/schemas/world-state-schemas";
import type { Timestamp } from "firebase/firestore";
import type { CharacterStats } from "@/ai/schemas/generate-character-schemas";
import type { CampaignStructure } from "@/ai/schemas/campaign-structure-schemas";

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  authorName?: string;
  mechanics?: string;
};

// Represents a fully generated character, either from AI or custom creation.
// This structure is used in the worldState and is the output of the generation process.
export type Character = {
  id: string; // The character's unique ID, often the same as the player slot ID.
  name: string;
  description: string;
  aspect: string; // The character's core aspect or high concept.
  pronouns: string;
  age: string;
  archetype: string;
  playerName: string; // The name of the player controlling the character.
  stats: CharacterStats;
  isCustom: boolean; // Was this character manually created?
  playerId: string; // User ID of the player who created/claimed this character
};

// This represents the data for a player in the session's subcollection.
// It tracks their status and their character creation progress.
export type Player = {
    id: string; // The user's UID
    name: string; // The player's display name
    isHost: boolean;
    isMobile: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'creating_character';
    characterCreationStatus: 'joined' | 'creating' | 'generated' | 'ready';
    characterData: {
        playerName: string;
        name?: string;
        vision?: string;
        pronouns?: "Any" | "She/Her" | "He/Him" | "They/Them" | "Ze/Zir" | "It/Its";
        // This will be populated once the AI generates the character. It matches the `Character` type.
        generatedCharacter?: Character;
        isApproved: boolean;
    };
    joinedAt: Timestamp;
    lastActive: Timestamp;
};


export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';

export type StoryMessage = {
  content: string;
};

export type SessionStatus = 'active' | 'paused' | 'finished' | 'archived' | 'waiting_for_players' | 'character_creation' | 'party_generation';

// This is the old GameSession type, which will be phased out.
// Kept for reference and potential migration.
export type GameSession = {
  id:string;
  userId: string;
  createdAt: Timestamp;
  gameData: GameData;
  worldState: WorldState;
  previousWorldState: WorldState | null;
  messages: Message[];
  storyMessages: StoryMessage[];
  step: 'summary' | 'characters' | 'play';
  activeCharacterId: string | null;
  sessionStatus: SessionStatus;
};

// Legacy type, to be phased out.
export type GameData = GenerateNewGameOutput & {
  userId?: string;
  characters?: Character[];
  campaignStructure?: CampaignStructure;
  playMode?: 'local' | 'remote';
  originalRequest?: string;
  promptHistory?: string[];
};


// Legacy type for local play, may be adapted or replaced.
export type PlayerSlot = {
    id: string;
    character: Character | null;
    preferences?: {
        playerName?: string;
        name?: string;
        vision?: string;
        pronouns?: string;
        playerId?: string;
    }
}
