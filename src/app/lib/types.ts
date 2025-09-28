
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

export type Character = {
  id: string;
  name: string;
  description:string;
  aspect: string;
  playerName: string;
  isCustom: boolean;
  archetype?: string;
  pronouns?: string;
  age?: string;
  stats?: CharacterStats;
  playerId: string; // User ID of the player who created/claimed this character
};

export type GameData = GenerateNewGameOutput & {
  userId?: string; // The user who created the game
  characters?: Character[];
  campaignStructure?: CampaignStructure; // This is now optional, as it will be loaded from a subcollection
  playMode?: 'local' | 'remote';
  originalRequest?: string; // The sanitized prompt used to generate the game
  promptHistory?: string[]; // A history of all prompts used for generation
};

export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';

export type StoryMessage = {
  content: string;
};

export type SessionStatus = 'active' | 'paused' | 'finished' | 'archived';

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
