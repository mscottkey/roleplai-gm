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
import { WorldStateSchema } from '../schemas/world-state-schemas';

const AskQuestionInputSchema = z.object({
  question: z.string().describe('The question the player is asking the GM.'),
  worldState: WorldStateSchema.describe('The entire current state of the game world.'),
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
  prompt: `You are the Game Master for a tabletop RPG. A player has asked you a question directly. Using your knowledge of the game world, provide a clear and concise answer. Do not narrate a new scene or advance time. Simply answer the question based on the information provided. If the answer is not known or the characters would not know, state that.

You have a complete memory of the game world. Use it to inform your answer.
- World Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Characters: {{#each worldState.characters}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Places: {{#each worldState.places}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

Player's Question: {{{question}}}

Provide a direct answer to the player's question.
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
