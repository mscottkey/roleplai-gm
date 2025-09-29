
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
import { sanitizeIpPromptText } from '../prompts/sanitize-ip-prompt';
import type { GenerationUsage } from 'genkit';

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

export type SanitizeIpResponse = {
  output: SanitizeIpOutput;
  usage: GenerationUsage;
  model: string;
};

export async function sanitizeIp(input: SanitizeIpInput): Promise<SanitizeIpResponse> {
  const result = await prompt(input);
  return {
    output: result.output!,
    usage: result.usage,
    model: result.model,
  };
}

const prompt = ai.definePrompt({
  name: 'sanitizeIpPrompt',
  input: {schema: SanitizeIpInputSchema},
  output: {schema: SanitizeIpOutputSchema},
  model: MODEL_CLASSIFICATION,
  prompt: sanitizeIpPromptText,
});

ai.defineFlow(
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
