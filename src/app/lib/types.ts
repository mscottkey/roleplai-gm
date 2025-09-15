import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";
import type { WorldState } from "@/ai/schemas/world-state-schemas";

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
};

export type GameData = GenerateNewGameOutput & {
  characters?: Character[];
  places?: any[];
  aspects?: string[];
};

export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';
