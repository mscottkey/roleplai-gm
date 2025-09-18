
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

export async function generateNewGame(input: GenerateNewGameInput): Promise<GenerateNewGameOutput> {
  return generateNewGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewGamePrompt',
  input: { schema: GenerateNewGameInputSchema },
  output: { schema: GenerateNewGameOutputSchema, format: 'json' },
  model: MODEL_GENERATION,
  prompt: `
You are an expert tabletop Game Master and narrative designer.

## Task
Given the player's request below, create **five fields**—\`name\`, \`setting\`, \`tone\`, \`initialHooks\`, and \`difficulty\`—as a **single JSON object** that exactly matches the provided schema. **Return only the JSON object**. Do **not** include any preamble, explanations, notes, code fences, or extra keys.

Player request:
"{{{request}}}"

## Output Contract (must follow exactly)
- **Format**: A single JSON object with these keys:
  - \`name\`: *(string)* - A short, evocative name for the campaign (4-6 words max).
  - \`setting\`: *(Markdown string)* — 150–250 words. Start with a short **logline** (one sentence in bold, using Markdown's asterisks like **this**), followed by 1–2 vivid paragraphs. End with two bulleted lists in Markdown (* not -). Each list must start with a heading (e.g., \`**Key Factions:**\`) followed by a blank line, and then 2–3 bullet points, each on a new line starting with \`* \`. Example:
    **Key Factions:**
    
    - The Arcane Technocracy
    - The Iron Guild
  - \`tone\`: *(Markdown string)* — 60–120 words. Start with **Vibe:** one sentence. Then a bullet list of 4 **Tone Levers** (e.g., pace, danger, humor, grit) describing how to tune scenes. The list must start on a new line, and each bullet must start with \`- \`.
  - \`initialHooks\`: *(Markdown string)* — **exactly five** hooks. Each hook must be on a new line and start with a number (e.g., "1. ...\\n2. ..."). Each hook should be one or two sentences, start with a **bold inciting element**, and clearly state **stakes** or **complication**. Hooks should vary across modes (e.g., social, stealth, exploration, mystery, combat).
  - \`difficulty\`: *(string)* — Start with a rating: "Easy", "Medium", or "Hard". Follow with a colon and a 1-2 sentence explanation of what this implies for the characters (e.g., "Hard: Characters should be resilient veterans; survival is a constant challenge and poor decisions can be lethal.").

## Style & Safety Rules
- **Use only Markdown** inside field values (no HTML tags, no code fences).
- Keep content **PG-13** by default; avoid slurs and explicit sexual content.
- If details are missing, make sensible genre-appropriate assumptions—**do not ask questions**.
- Use original phrasing; avoid copyrighted proper nouns unless they are generic genre terms.

**Return ONLY the JSON object.**
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
