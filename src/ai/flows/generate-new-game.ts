
'use server';

/**
 * @fileOverview Flow for generating a new game setting and tone based on a player's request.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_GENERATION } from '../models';
import { generateNewGamePromptText } from '../prompts/generate-new-game-prompt';
import { GenerationUsage } from 'genkit';

const GenerateNewGameInputSchema = z.object({
  request: z.string().describe('A simple request describing the desired game, e.g., \'I want to play a cyberpunk heist.\''),
});
export type GenerateNewGameInput = z.infer<typeof GenerateNewGameInputSchema>;

const GenerateNewGameOutputSchema = z.object({
  name: z.string().describe('A short, evocative name for the campaign (4-6 words max).'),
  setting: z.string().describe('A description of the game setting, including 2-3 notable locations.'),
  tone: z.string().describe('A description of the game tone.'),
  difficulty: z.string().describe("A difficulty rating (e.g., 'Easy', 'Medium', 'Hard') and a short description of what it implies for characters."),
  initialHooks: z.array(z.string()).length(3).describe('An array of three, one-sentence plot hooks to give players immediate ideas.'),
});
export type GenerateNewGameOutput = z.infer<typeof GenerateNewGameOutputSchema>;

// Helper function to clean up markdown formatting
function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    // Fix escaped newlines
    .replace(/\\n/g, '\n')
    // Convert old-style bold headers to proper markdown headers
    .replace(/\*\*(Vibe|Tone Levers|Notable Locations):\*\*/g, '## $1')
    .replace(/\*\*(Vibe|Tone Levers|Notable Locations):\s*/g, '## $1\n\n')
    // Fix malformed bullet points patterns - be more conservative
    .replace(/\*\*\*\*\* /g, '* ')
    .replace(/\*\*\* /g, '* ')
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


export async function generateNewGame(input: GenerateNewGameInput): Promise<{ output: GenerateNewGameOutput; usage: GenerationUsage; model: string; }> {
  const { output, usage, model } = await prompt(input);
  
  // Clean up the markdown formatting in the response
  const cleanedOutput = {
    ...output!,
    setting: cleanMarkdown(output!.setting),
    tone: cleanMarkdown(output!.tone),
  };
  return { output: cleanedOutput, usage, model };
}

const prompt = ai.definePrompt({
  name: 'generateNewGamePrompt',
  input: { schema: GenerateNewGameInputSchema },
  output: { schema: GenerateNewGameOutputSchema, format: 'json' },
  model: MODEL_GENERATION,
  prompt: generateNewGamePromptText,
});

// This flow is now only for the Genkit developer UI and is not called directly by application code.
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
