
import {z} from 'genkit';

export const GenerateRecapInputSchema = z.object({
  recentEvents: z.array(z.string()).describe("A list of the last few significant events to maintain short-term context."),
});
export type GenerateRecapInput = z.infer<typeof GenerateRecapInputSchema>;

export const GenerateRecapOutputSchema = z.object({
    recap: z.string().describe('A 2-3 paragraph summary of the recent events, written in a "Previously on..." style.'),
});
export type GenerateRecapOutput = z.infer<typeof GenerateRecapOutputSchema>;
