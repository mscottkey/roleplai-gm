import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  mechanics?: string;
};

export type Character = {
  name: string;
  description: string;
  aspect: string;
};

export type GameData = GenerateNewGameOutput & {
  characters?: Character[];
  places?: any[];
  aspects?: string[];
};

export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';
