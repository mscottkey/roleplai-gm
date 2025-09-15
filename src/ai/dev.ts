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
