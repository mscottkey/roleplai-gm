import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import type { WorldState } from "@/ai/schemas/world-state-schemas";
import type { Timestamp } from "firebase/firestore";
import type { Skill, Stunt } from "@/ai/schemas/generate-character-schemas";
import type { CampaignStructure } from "@/ai/schemas/campaign-structure-schemas";

export type Message = {
  role: 'user' | 'assistant';
  content: string;
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
  gender?: string;
  age?: string;
  skills?: Skill[];
  stunts?: Stunt[];
};

export type GameData = GenerateNewGameOutput & {
  name: string;
  characters?: Character[];
  places?: any[];
  aspects?: string[];
  campaignStructure?: CampaignStructure;
};

export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';

export type StoryMessage = {
  content: string;
};

export type GameSession = {
  id: string;
  userId: string;
  createdAt: Timestamp;
  gameData: GameData;
  worldState: WorldState;
  messages: Message[];
  storyMessages: StoryMessage[];
  step: 'characters' | 'play';
  activeCharacterId: string | null;
};
