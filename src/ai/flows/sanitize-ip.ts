'use server';

/**
 * @fileOverview Flow for checking a user's game request for protected intellectual property (IP).
 *
 * - sanitizeIp - A function that checks for and sanitizes protected IP.
 * - SanitizeIpInput - The input type for the sanitizeIp function.
 * - SanitizeIpOutput - The return type for the sanitizeIp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MODEL_CLASSIFICATION } from '../models';

const SanitizeIpInputSchema = z.object({
  request: z.string().describe("The user's initial request for a new game."),
});
export type SanitizeIpInput = z.infer<typeof SanitizeIpInputSchema>;

const SanitizeIpOutputSchema = z.object({
  containsIp: z.boolean().describe('True if the request contains protected IP.'),
  sanitizedRequest: z.string().describe('The original request, or a generic version if IP was found.'),
  warningMessage: z.string().optional().describe('A message to the user if their request was changed.'),
});
export type SanitizeIpOutput = z.infer<typeof SanitizeIpOutputSchema>;

export async function sanitizeIp(input: SanitizeIpInput): Promise<SanitizeIpOutput> {
  return sanitizeIpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sanitizeIpPrompt',
  input: {schema: SanitizeIpInputSchema},
  output: {schema: SanitizeIpOutputSchema},
  model: MODEL_CLASSIFICATION,
  prompt: `You are an Intellectual Property (IP) detection system for a game creation tool. Your task is to analyze a user's request and determine if it refers to a specific, protected IP (like a movie, book, or video game franchise).

Rules:
1.  **Identify Protected IP:** Look for names of franchises, specific characters, or unique locations from properties like Star Wars, Marvel, DC, Lord of the Rings, Harry Potter, Dungeons & Dragons settings (e.g., Forgotten Realms), etc.
2.  **Allow Generic Genres:** Do NOT flag generic genres like "space opera," "cyberpunk," "high fantasy," "superhero," or "noir detective." These are fine.
3.  **Sanitize if IP is Found:** If protected IP is detected, you must:
    *   Set \`containsIp\` to \`true\`.
    *   Create a \`sanitizedRequest\` by converting the specific IP into its generic genre (e.g., "Star Wars heist" becomes "space opera heist").
    *   Create a short, friendly \`warningMessage\` explaining the change (e.g., "Your request was changed from 'Star Wars' to 'space opera' to avoid using protected intellectual property.").
4.  **Do Nothing if No IP is Found:** If the request is for a generic genre or is original, you must:
    *   Set \`containsIp\` to \`false\`.
    *   Set \`sanitizedRequest\` to the original, unchanged request.
    *   Do not provide a \`warningMessage\`.

User Request: "{{{request}}}"

Analyze the request and return the result in the specified JSON format.
`,
});

const sanitizeIpFlow = ai.defineFlow(
  {
    name: 'sanitizeIpFlow',
    inputSchema: SanitizeIpInputSchema,
    outputSchema: SanitizeIpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
