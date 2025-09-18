'use server';

/**
 * @fileOverview Flow for generating a new game setting, tone, and initial hooks based on a player's request.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_GENERATION } from '../models';

const GenerateNewGameInputSchema = z.object({
  request: z.string().describe('A simple request describing the desired game, e.g., \'I want to play a cyberpunk heist.\''),
});
export type GenerateNewGameInput = z.infer<typeof GenerateNewGameInputSchema>;

const GenerateNewGameOutputSchema = z.object({
  name: z.string().describe('A short, evocative name for the campaign (4-6 words max).'),
  setting: z.string().describe('A description of the game setting.'),
  tone: z.string().describe('A description of the game tone.'),
  initialHooks: z.string().describe('A few initial hooks to get the game started.'),
  difficulty: z.string().describe("A difficulty rating (e.g., 'Easy', 'Medium', 'Hard') and a short description of what it implies for characters."),
});
export type GenerateNewGameOutput = z.infer<typeof GenerateNewGameOutputSchema>;

// Helper function to clean up markdown formatting
function cleanMarkdown(text: string): string {
  return text
    // Fix escaped newlines
    .replace(/\\n/g, '\n')
    // Convert old-style bold headers to proper markdown headers
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\*\*/g, '## $1')
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\s*/g, '## $1\n\n')
    // Fix malformed bullet points patterns
    .replace(/\*\*\*\*\* /g, '* ')
    .replace(/\*\*\*\* /g, '* ')
    // Fix mangled asterisks around text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
    // Clean up excessive whitespace but preserve single spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Ensure proper spacing around headers
    .replace(/\n(##\s+[^\n]+)\n/g, '\n\n$1\n\n')
    // Clean up any remaining formatting issues
    .replace(/\n{3,}/g, '\n\n')
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
    initialHooks: cleanMarkdown(result.initialHooks),
  };
}

const prompt = ai.definePrompt({
  name: 'generateNewGamePrompt',
  input: { schema: GenerateNewGameInputSchema },
  output: { schema: GenerateNewGameOutputSchema, format: 'json' },
  model: MODEL_GENERATION,
  prompt: `
You are an expert tabletop Game Master and narrative designer.

## Task
Generate a complete game setup based on the player's request. Return ONLY a valid JSON object with proper markdown formatting.

Player request: "{{{request}}}"

## Critical Formatting Rules
- Use actual newlines (\\n) for line breaks, not escaped \\\\n
- Use proper markdown: **bold text**, * bullet points
- Each bullet point should be on its own line
- Headers should have newlines before and after them

## Required JSON Structure
{
  "name": "Campaign Name (4-6 words)",
  "setting": "**Logline in bold**\\n\\nDetailed setting description 150-250 words.\\n\\n**Key Factions:**\\n\\n* Faction 1: Description\\n* Faction 2: Description\\n\\n**Notable Locations:**\\n\\n* Location 1: Description\\n* Location 2: Description",
  "tone": "**Vibe:** Description of the overall feel.\\n\\n**Tone Levers:**\\n\\n* Pace: Description\\n* Danger: Description\\n* Morality: Description\\n* Scale: Description",
  "initialHooks": "1. **Hook element** description of first hook.\\n2. **Hook element** description of second hook.\\n3. **Hook element** description of third hook.\\n4. **Hook element** description of fourth hook.\\n5. **Hook element** description of fifth hook.",
  "difficulty": "Difficulty Level: Description of what this means for characters."
}

Return ONLY the JSON object with proper newline characters.
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