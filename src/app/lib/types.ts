
import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import type { WorldState, CampaignStructure } from "@/ai/schemas/world-state-schemas";
import type { Timestamp } from "firebase/firestore";
import type { CharacterStats } from "@/ai/schemas/generate-character-schemas";

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  authorName?: string;
  mechanics?: string;
};

// This is the canonical Character object structure, used by the AI and stored in the player subcollection.
export type Character = {
  id: string; // The character's unique ID, often the same as the player slot ID.
  name: string;
  description: string;
  aspect: string; // The character's core aspect or high concept.
  pronouns: string;
  age: string;
  archetype: string;
  playerName: string;
  stats: CharacterStats;
  isCustom: boolean; // Was this character manually created?
  playerId: string; // User ID of the player who created/claimed this character
};

// Represents a player document in the `games/{gameId}/players` subcollection.
export type Player = {
    id: string; // The user's UID
    name: string; // The player's display name
    isHost: boolean;
    isMobile: boolean;
    connectionStatus: 'connected' | 'disconnected';
    characterCreationStatus: 'joining' | 'creating' | 'generated' | 'ready';
    characterData: {
        playerName: string;
        name?: string; // optional character name
        vision?: string; // character concept
        pronouns?: "Any" | "She/Her" | "He/Him" | "They/Them" | "Ze/Zir" | "It/Its";
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

export type SessionStatus = 'waiting_for_players' | 'character_creation' | 'party_generation' | 'active' | 'paused' | 'finished' | 'archived';

// This is the main game session document.
export type GameSession = {
  id:string;
  userId: string; // The user ID of the host
  createdAt: Timestamp;
  gameData: GenerateNewGameOutput & {
      playMode?: 'local' | 'remote';
      originalRequest?: string;
      promptHistory?: string[];
      campaignGenerated?: boolean;
  };
  worldState: WorldState;
  previousWorldState: WorldState | null;
  messages: Message[];
  storyMessages: StoryMessage[];
  step: 'summary' | 'characters' | 'play';
  activeCharacterId: string | null;
  sessionStatus: SessionStatus;
};


// Legacy type for local play, still used by the CharacterCreationForm for its internal state.
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
