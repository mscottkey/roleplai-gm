import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';

export const EstimateCostInputSchema = z.object({
  characters: z.array(CharacterSchema).describe('The list of player characters.'),
  campaignGenerated: z.boolean().describe('Whether the main campaign structure has been generated yet.'),
});
export type EstimateCostInput = z.infer<typeof EstimateCostInputSchema>;

export const EstimateCostOutputSchema = z.object({
    setupCost: z.number().int().describe('Estimated one-time token cost for game setup.'),
    perTurnCost: z.number().int().describe('Estimated token cost for a single player turn (action).'),
    perQuestionCost: z.number().int().describe('Estimated token cost for a player asking a question.'),
    estimatedSessionCost: z.number().int().describe('Estimated token cost for a typical 2-hour session with 4 players.'),
    sessionCostBreakdown: z.string().describe('A human-readable breakdown of the session cost estimation.'),
});
export type EstimateCostOutput = z.infer<typeof EstimateCostOutputSchema>;
