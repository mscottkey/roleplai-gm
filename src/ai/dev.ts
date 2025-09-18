'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-new-game.ts';
import '@/ai/flows/integrate-rules-adapter.ts';
import '@/ai/flows/narrate-player-actions.ts';
import '@/ai/flows/generate-character.ts';
import '@/ai/flows/update-world-state.ts';
import '@/ai/flows/classify-intent.ts';
import '@/ai/flows/ask-question.ts';
import '@/ai/flows/generate-campaign-structure.ts';
import '@/ai/flows/generate-campaign-pieces.ts';
import '@/ai/flows/estimate-cost.ts';
import '@/ai/flows/sanitize-ip.ts';
import '@/ai/flows/assess-consequences.ts';
import '@/ai/schemas/assess-consequences-schemas.ts';
import '@/ai/models.ts';
