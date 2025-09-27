
'use server';

/**
 * @fileOverview Implements a flow for answering player questions to the GM.
 *
 * - askQuestion - Answers a player question using the current world state.
 * - AskQuestionInput - The input type for the askQuestion function.
 * - AskQuestionOutput - The return type for the askQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CharacterSchema } from '../schemas/generate-character-schemas';
import { WorldStateSchema } from '../schemas/world-state-schemas';
import { MODEL_GAMEPLAY } from '../models';
import { askQuestionPromptText } from '../prompts/ask-question-prompt';

const AskQuestionInputSchema = z.object({
  question: z.string().describe('The question the player is asking the GM.'),
  worldState: WorldStateSchema.describe('The entire current state of the game world.'),
  character: CharacterSchema.describe('The character asking the question.'),
  settingCategory: z.string().default('generic').describe('Pre-classified setting category to ensure genre-appropriate answers.'),
});
export type AskQuestionInput = z.infer<typeof AskQuestionInputSchema>;

const AskQuestionOutputSchema = z.object({
  answer: z.string().describe('The GMs answer to the question.'),
});
export type AskQuestionOutput = z.infer<typeof AskQuestionOutputSchema>;

export async function askQuestion(input: AskQuestionInput): Promise<AskQuestionOutput> {
  return askQuestionFlow(input);
}

const askQuestionPrompt = ai.definePrompt({
  name: 'askQuestionPrompt',
  input: {schema: AskQuestionInputSchema},
  output: {schema: AskQuestionOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: askQuestionPromptText,
  retries: 2,
});

const askQuestionFlow = ai.defineFlow(
  {
    name: 'askQuestionFlow',
    inputSchema: AskQuestionInputSchema,
    outputSchema: AskQuestionOutputSchema,
  },
  async input => {
    const {output} = await askQuestionPrompt(input);
    return output!;
  }
);
