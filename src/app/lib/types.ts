import type { GenerateNewGameOutput } from "@/ai/flows/generate-new-game";

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  mechanics?: string;
};

export type GameData = GenerateNewGameOutput & {
  // We can extend this with more structured data as needed
  characters?: any[];
  places?: any[];
  aspects?: string[];
};

export type MechanicsVisibility = 'Hidden' | 'Minimal' | 'Full';
