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

const AskQuestionInputSchema = z.object({
  question: z.string().describe('The question the player is asking the GM.'),
  worldState: WorldStateSchema.describe('The entire current state of the game world.'),
  character: CharacterSchema.describe('The character asking the question.'),
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
  prompt: `You are the Game Master for a tabletop RPG. A player controlling a specific character has asked you a question directly. Using your knowledge of the game world, provide a clear and helpful answer from a GM's perspective, addressed to that character. Do not narrate a new scene or advance time, but guide the player.

You have a complete memory of the game world. Use it to inform your answer.
- World Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Characters: {{#each worldState.characters}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Places: {{#each worldState.places}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

The character asking is: {{{character.name}}}
Player's Question: {{{question}}}

Address your answer directly to the character asking the question (e.g., "Kaito, you notice..."). For any spoken dialogue in your response, you must use double quotes ("").

If the question is open-ended (e.g., "What should we do?", "Where can we go?"), respond like a helpful GM by pointing out the most obvious courses of action for that character and their party based on the Story Outline and Recent Events. You might ask a clarifying question back to the players to help them decide.

If the question is about a specific detail of the world, answer it concisely based on the information provided. If the character would not know the answer, say so.
`,
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
