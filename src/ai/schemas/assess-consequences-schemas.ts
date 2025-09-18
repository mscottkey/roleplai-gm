import {z} from 'genkit';
import { CharacterSchema } from './generate-character-schemas';
import { WorldStateSchema } from './world-state-schemas';

export const AssessConsequencesInputSchema = z.object({
  actionDescription: z.string().describe('The action the player intends to take.'),
  worldState: WorldStateSchema.describe('The current state of the game world.'),
  character: CharacterSchema.describe('The character performing the action.'),
});
export type AssessConsequencesInput = z.infer<typeof AssessConsequencesInputSchema>;

export const AssessConsequencesOutputSchema = z.object({
    needsConfirmation: z.boolean().describe('True if the action has significant, irreversible, or morally weighty consequences that a GM should confirm.'),
    confirmationMessage: z.string().optional().describe('If confirmation is needed, this is the question the GM should ask the player (e.g., "This could start a war. Are you sure?").'),
});
export type AssessConsequencesOutput = z.infer<typeof AssessConsequencesOutputSchema>;
