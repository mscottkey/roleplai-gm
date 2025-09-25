
'use server';

/**
 * @fileOverview Flow for generating a new game setting and tone based on a player's request.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_GENERATION } from '../models';
import { generateNewGamePromptText } from '../prompts/generate-new-game-prompt';

const GenerateNewGameInputSchema = z.object({
  request: z.string().describe('A simple request describing the desired game, e.g., \'I want to play a cyberpunk heist.\''),
});
export type GenerateNewGameInput = z.infer<typeof GenerateNewGameInputSchema>;

const GenerateNewGameOutputSchema = z.object({
  name: z.string().describe('A short, evocative name for the campaign (4-6 words max).'),
  setting: z.string().describe('A description of the game setting, including 2-3 notable locations.'),
  tone: z.string().describe('A description of the game tone.'),
  difficulty: z.string().describe("A difficulty rating (e.g., 'Easy', 'Medium', 'Hard') and a short description of what it implies for characters."),
});
export type GenerateNewGameOutput = z.infer<typeof GenerateNewGameOutputSchema>;

// Helper function to clean up markdown formatting
function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    // Fix escaped newlines
    .replace(/\\n/g, '\n')
    // Convert old-style bold headers to proper markdown headers
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\*\*/g, '## $1')
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\s*/g, '## $1\n\n')
    // Fix malformed bullet points patterns - be more conservative
    .replace(/\*\*\*\*\* /g, '* ')
    .replace(/\*\*\*\* /g, '* ')
    // Fix mangled asterisks around text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
    // Clean up excessive whitespace but preserve single spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Fix newlines - collapse excessive ones but preserve intentional breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/\n(##\s+[^\n]+)\n/g, '\n\n$1\n\n')
    // Ensure bullet points are on new lines if they aren't already
    .replace(/([^\n])\s*\* /g, '$1\n* ')
    .trim();
}


export async function generateNewGame(input: GenerateNewGameInput): Promise<GenerateNewGameOutput> {
  const result = await generateNewGameFlow(input);
  
  // Clean up the markdown formatting in the response
  return {
    ...result,
    setting: cleanMarkdown(result.setting),
    tone: cleanMarkdown(result.tone),
  };
}

const prompt = ai.definePrompt({
  name: 'generateNewGamePrompt',
  input: { schema: GenerateNewGameInputSchema },
  output: { schema: GenerateNewGameOutputSchema, format: 'json' },
  model: MODEL_GENERATION,
  prompt: generateNewGamePromptText,
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
