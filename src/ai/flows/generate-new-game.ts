
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
  input: { schema: GenerateNewGameInputSchema },
  output: { schema: GenerateNewGameOutputSchema },
  prompt: `
You are an expert tabletop Game Master and narrative designer.

## Task
Given the player's request below, create **three fields**—\`setting\`, \`tone\`, and \`initialHooks\`—as a **single JSON object** that exactly matches the provided schema. **Return only the JSON object**. Do **not** include any preamble, explanations, notes, code fences, or extra keys.

Player request:
"{{{request}}}"

## Output Contract (must follow exactly)
- **Format**: A single JSON object with these keys:
  - \`setting\`: *(Markdown string)* — 150–250 words. Start with a short *logline* (one sentence in italics, using Markdown's asterisks like *this*), followed by 1–2 vivid paragraphs. End with a short list:
    - **Key Factions:** 2–3 bullets
    - **Notable Locations:** 2–3 bullets
  - \`tone\`: *(Markdown string)* — 60–120 words. Start with **Vibe:** one sentence. Then a bullet list of 4 **Tone Levers** (e.g., pace, danger, humor, grit) describing how to tune scenes.
  - \`initialHooks\`: *(Markdown string)* — **exactly five** hooks as a **Markdown ordered list** numbered \`1.\` through \`5.\`. Each hook should be one or two sentences, start with a **bold inciting element**, and clearly state **stakes** or **complication**. Hooks should vary across modes (e.g., social, stealth, exploration, mystery, combat).

## Style & Safety Rules
- **Use only Markdown** inside field values (no HTML tags like <i>, no code fences).
- Keep content **PG-13** by default; avoid slurs and explicit sexual content.
- If details are missing, make sensible genre-appropriate assumptions—**do not ask questions**.
- Use original phrasing; avoid copyrighted proper nouns unless they are generic genre terms.

## JSON Shape Reminder (for format only—do not copy text):
{
  "setting": "…markdown…",
  "tone": "…markdown…",
  "initialHooks": "1. …\\n2. …\\n3. …\\n4. …\\n5. …"
}

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
