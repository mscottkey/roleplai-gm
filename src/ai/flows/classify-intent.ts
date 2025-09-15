'use server';

/**
 * @fileOverview Flow for classifying player input as an action or a question.
 *
 * - classifyIntent - A function that classifies the player's input.
 * - ClassifyIntentInput - The input type for the classifyIntent function.
 * - ClassifyIntentOutput - The return type for the classifyIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyIntentInputSchema = z.object({
  playerInput: z.string().describe('The text input from the player.'),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;

export const ClassifyIntentOutputSchema = z.object({
  intent: z.enum(['Action', 'Question']).describe('The classified intent of the player input.'),
});
export type ClassifyIntentOutput = z.infer<typeof ClassifyIntentOutputSchema>;

export async function classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentOutput> {
  return classifyIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyIntentPrompt',
  input: {schema: ClassifyIntentInputSchema},
  output: {schema: ClassifyIntentOutputSchema},
  prompt: `You are an intent classification system for a role-playing game. Your task is to determine if the player's input is a declared action for their character to perform, or if it is a question directed to the Game Master (GM).

- An "Action" is when a player describes what their character does, says, or attempts to do. Examples: "I attack the goblin with my sword," "I try to pick the lock," "I ask the bartender for rumors."
- A "Question" is when a player asks for information about the game world, rules, or possibilities. These are often out-of-character questions to the GM. Examples: "Are there any guards in the hallway?", "What does the inscription say?", "Can I see the ceiling from here?".

Player Input: {{{playerInput}}}

Based on the input, classify the intent as either "Action" or "Question".
`,
});

const classifyIntentFlow = ai.defineFlow(
  {
    name: 'classifyIntentFlow',
    inputSchema: ClassifyIntentInputSchema,
    outputSchema: ClassifyIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
