
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
import { cleanMarkdown } from '@/lib/utils';

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
Given the player's request, create **five fields**—\`name\`, \`setting\`, \`tone\`, \`initialHooks\`, and \`difficulty\`—as a **single JSON object**. **Return only the JSON object**. Do **not** include any preamble, explanations, notes, code fences, or extra keys.

Player request:
"{{{request}}}"

## Output Contract & Example
Follow these rules and use the example as a strict guide for Markdown formatting.

---
### Example of a Perfect JSON Object:
\`\`\`json
{
  "name": "The Seraphim Conspiracy",
  "setting": "**In a city powered by captured starlight, a renegade angel-binder seeks to shatter the celestial engines and plunge the world into chaos.**\\n\\nThe gleaming metropolis of Lumina is a marvel of celestial engineering, its crystalline towers and shimmering avenues powered by the captured essence of constellations. The ruling Astrolarchy dictates every aspect of life, their authority absolute, their power derived from the sacred star-engines that hum beneath the city's foundations. For centuries, this power has brought prosperity and order.\\n\\nBut a shadow falls over the city. Whispers of a figure known as 'The Penitent'—a master angel-binder who has broken their vows—spread through the underbelly. They believe the stars are not gifts, but prisoners, and seek to liberate them, an act that would bring about a new dark age. You are individuals caught in the middle, bound by fate or misfortune to the secrets that keep the city alight.\\n\\n**Key Factions:**\\n\\n* The Astrolarchy: The rigid, light-worshipping ruling class.\\n* The Penitent's Disciples: A zealous cult dedicated to freeing the stars.\\n* The Unlit: The masses who live in the city's dimmer, unsupported sectors.\\n\\n**Notable Locations:**\\n\\n* The Orrery: The central control hub for all of Lumina's star-engines.\\n* The Shadow Bazaars: Black markets where forbidden artifacts and secrets are traded.",
  "tone": "**Vibe:** A tone of 'mythic noir.' Imagine blade runner meets a fallen heaven, blending high-stakes conspiracy with cosmic mystery and personal sacrifice.\\n\\n**Tone Levers:**\\n\\n* Pace: The story should simmer with investigative tension, punctuated by bursts of desperate action.\\n* Danger: Combat is swift and decisive. The true threats are the secrets you uncover and the enemies you make.\\n* Morality: Choices are rarely black and white. Will you preserve a flawed order or embrace a catastrophic freedom?\\n* Scale: Your actions have the potential to save or doom millions, shaking the foundations of reality itself.",
  "initialHooks": "1. **A cryptic message** from a dying Astrolarch official lands in your possession, speaking of a 'key' that can silence the stars. It includes a time and place for a clandestine meeting.\\n2. **A loved one** is afflicted with 'Fading Sickness,' a mysterious illness tied to a faltering star-engine. The only cure is rumored to lie in forbidden Penitent scripture.\\n3. **You are hired** by a shadowy patron to steal a celestial focusing crystal from a high-security Astrolarchy vault, but the plans you're given show a second, hidden objective.\\n4. **An Unlit prophet** who preaches of the 'coming darkness' is arrested. You are the only ones who know their 'mad' prophecies have started coming true in small, terrifying ways.\\n5. **Your own past** catches up to you. An old contact, believed dead, reappears as a high-ranking member of the Penitent's Disciples and offers you a choice: join them or be exposed.",
  "difficulty": "Medium: Characters are expected to be competent, but will be frequently outmatched by powerful factions. Smart thinking is more important than raw power, and making powerful enemies is easy."
}
\`\`\`
---

### Your Task: Create JSON for this Request
Player request: "{{{request}}}"

## Rules to Follow
- **Format**: A single JSON object with the keys: \`name\`, \`setting\`, \`tone\`, \`initialHooks\`, \`difficulty\`.
- **Setting**: 150-250 words. Start with a bold logline using \`**\`. Use \`* \` for bullet points.
- **Tone**: 60-120 words. Start with a bold \`**Vibe:**\`. Use \`* \` for bullet points.
- **Initial Hooks**: Exactly five hooks, each on a new line starting with a number (e.g., \`1. ...\\n2. ...\`). Each hook should have a bold inciting element.
- **Style & Safety**: Use only Markdown. Content should be PG-13. Make sensible genre assumptions.

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
    if (!output) {
      throw new Error("Failed to generate new game.");
    }
    
    // Sanitize the markdown fields before returning
    return {
      ...output,
      setting: cleanMarkdown(output.setting),
      tone: cleanMarkdown(output.tone),
      initialHooks: cleanMarkdown(output.initialHooks),
    };
  }
);
