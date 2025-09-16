/**
 * @fileOverview Centralized model configuration for the application.
 * This file exports constants that define which AI model to use for different tasks,
 * making it easy to swap or upgrade models in one place.
 */

// Use for complex, one-off generation tasks like creating a new game,
// generating characters, or building the initial campaign structure.
// 'googleai/gemini-pro' could be a premium option here.
export const MODEL_GENERATION = 'googleai/gemini-2.5-flash';

// Use for frequent, in-game tasks like resolving actions, answering questions,
// and updating the world state. Needs to be fast and consistent.
export const MODEL_GAMEPLAY = 'googleai/gemini-2.5-flash';

// Use for simple, low-cost classification tasks.
export const MODEL_CLASSIFICATION = 'googleai/gemini-2.5-flash';

// Use for meta-tasks like cost estimation.
export const MODEL_ANALYSIS = 'googleai/gemini-2.5-flash';
