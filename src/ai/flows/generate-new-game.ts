
'use server';

/**
 * @fileOverview Flow for generating a new game setting, tone, and initial hooks based on a player's request.
 *
 * - generateNewGame - A function that generates the new game details.
 * - GenerateNewGameInput - The input type for the generateNewGame function.
 * - GenerateNewGameOutput - The return type for the generateNewGame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewGameInputSchema = z.object({
  request: z.string().describe('A simple request describing the desired game, e.g., \'I want to play a cyberpunk heist.\''),
});
export type GenerateNewGameInput = z.infer<typeof GenerateNewGameInputSchema>;

const GenerateNewGameOutputSchema = z.object({
  setting: z.string().describe('A description of the game setting.'),
  tone: z.string().describe('A description of the game tone.'),
  initialHooks: z.string().describe('A few initial hooks to get the game started.'),
});
export type GenerateNewGameOutput = z.infer<typeof GenerateNewGameOutputSchema>;

export async function generateNewGame(input: GenerateNewGameInput): Promise<GenerateNewGameOutput> {
  return generateNewGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewGamePrompt',
  input: {schema: GenerateNewGameInputSchema},
  output: {schema: GenerateNewGameOutputSchema},
  prompt: `You are an expert game master. A player wants to start a new game. Based on their request, generate a game setting, a game tone, and a few initial hooks to get the game started.

Request: {{{request}}}

Provide a response in the requested format.
- "setting": A description of the game setting.
- "tone": A description of the game tone.
- "initialHooks": A string containing a few initial hooks to get the game started. You must format this as a numbered list, with each item starting with "1.", "2.", "3.", etc., and separated by a newline character.

Example for initialHooks:
"1. The crew is hired to steal a priceless artifact from a moving mag-lev train.
2. A rival crew has been sabotaging your operations, and it's time to hit them back where it hurts.
3. An encrypted message from a mysterious benefactor offers a high-risk, high-reward job that could set you up for life."
`,
});

const generateNewGameFlow = ai.defineFlow(
  {
    name: 'generateNewGameFlow',
    inputSchema: GenerateNewGameInputSchema,
    outputSchema: GenerateNewGameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
