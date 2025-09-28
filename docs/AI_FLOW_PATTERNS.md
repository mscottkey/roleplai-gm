# AI Flow Design Patterns

This document outlines the standard pattern for creating, managing, and invoking AI flows within the application. Following this pattern ensures consistency, type safety, and maintainability.

## Core Principles

- **Separation of Concerns**: Each core component of an AI flow—the **Schema** (data structure), the **Prompt** (instructions for the AI), and the **Flow Logic** (the code that runs the task)—is kept in a dedicated directory.
- **Strongly Typed**: We use [Zod](https://zod.dev/) to define robust input and output schemas. This provides compile-time type safety and, crucially, gives the Genkit framework the information it needs to properly structure the AI's response.
- **Server-Side Execution**: All AI flows are defined as server-side TypeScript functions using Genkit. They are exposed to the client application exclusively through Next.js Server Actions defined in `src/app/actions.ts`.

## Directory Structure

All AI-related code resides within the `src/ai/` directory:

- `src/ai/flows/`: Contains the primary logic for each Genkit flow. (e.g., `summarize-text.ts`)
- `src/ai/prompts/`: Contains the text content of the prompts used by the flows. (e.g., `summarize-text-prompt.ts`)
- `src/ai/schemas/`: Contains the Zod schemas that define the data contracts for flow inputs and outputs. (e.g., `summarize-text-schemas.ts`)
- `src/ai/models.ts`: Centralized configuration for which AI models to use for different tasks.
- `src/ai/genkit.ts`: Main Genkit configuration file.
- `src/ai/dev.ts`: A file that imports all flows to make them available to the Genkit developer UI.

## How to Create a New AI Flow

Let's create a hypothetical flow called `summarizeText`.

### Step 1: Define the Schema

First, define the input and output data structures.

- Create a new file: `src/ai/schemas/summarize-text-schemas.ts`
- Use Zod to define the input and output schemas.
- Export the schemas and their inferred TypeScript types.

```typescript
// src/ai/schemas/summarize-text-schemas.ts
import {z} from 'genkit';

export const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().describe('The block of text that needs to be summarized.'),
  maxLength: z.number().int().optional().describe('The desired maximum length of the summary in sentences.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

export const SummarizeTextOutputSchema = z.object({
    summary: z.string().describe('The generated summary of the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;
```

### Step 2: Write the Prompt

Next, create the instructions for the language model.

- Create a new file: `src/ai/prompts/summarize-text-prompt.ts`
- Write the prompt as an exported template literal string.
- Use Handlebars syntax (`{{{...}}}`) to reference fields from your input schema.

```typescript
// src/ai/prompts/summarize-text-prompt.ts
export const summarizeTextPromptText = `You are a text-summarization expert. Summarize the following text.
{{#if maxLength}}
The summary should be no more than {{{maxLength}}} sentences long.
{{/if}}

Text to Summarize:
{{{textToSummarize}}}`;
```

### Step 3: Implement the Flow

Now, tie the schema and prompt together in a Genkit flow.

- Create a new file: `src/ai/flows/summarize-text.ts`
- Import the schemas, the prompt text, and the Genkit `ai` object.
- Define a `prompt` object using `ai.definePrompt`, linking your schema and prompt text.
- Define a `flow` object using `ai.defineFlow`, which orchestrates the call to the prompt.
- Create and export an async wrapper function that your server actions will call. This keeps the Genkit-specific code neatly encapsulated.

```typescript
// src/ai/flows/summarize-text.ts
'use server';

import {ai} from '@/ai/genkit';
import { MODEL_GAMEPLAY } from '../models'; // Choose the appropriate model
import { summarizeTextPromptText } from '../prompts/summarize-text-prompt';
import {
  SummarizeTextInputSchema,
  SummarizeTextOutputSchema,
  type SummarizeTextInput,
  type SummarizeTextOutput,
} from '../schemas/summarize-text-schemas';
import type { GenerationUsage } from 'genkit';

// Define a richer response type that includes usage data
export type SummarizeTextResponse = {
  output: SummarizeTextOutput;
  usage: GenerationUsage;
  model: string;
};

// The function we will export and call from our Server Action
export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextResponse> {
  const result = await summarizeTextFlow(input);
  return {
    output: result.output!,
    usage: result.usage,
    model: result.model!,
  };
}

// 1. Define the prompt for Genkit
const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  model: MODEL_GAMEPLAY,
  prompt: summarizeTextPromptText,
});

// 2. Define the flow for Genkit
const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async input => {
    // 3. Execute the prompt and return the structured output
    const result = await summarizeTextPrompt(input);
    return result.output!;
  }
);
```

### Step 4: Register the Flow with Genkit Dev UI

For the flow to be visible in the Genkit developer tools, you must import it in `src/ai/dev.ts`.

```typescript
// src/ai/dev.ts

// ... other imports

// Add these new imports
import '@/ai/flows/summarize-text';
```
*(Note: Schemas and prompts do not need to be individually imported into `dev.ts` as they are used by the flow file.)*

### Step 5: Expose as a Server Action

Finally, expose your new flow to the client-side application by creating a wrapper function in `src/app/actions.ts`.

```typescript
// src/app/actions.ts

// ... other imports

// 1. Import your new flow and its types
import { summarizeText as summarizeTextFlow, type SummarizeTextResponse, type SummarizeTextOutput } from "@/ai/flows/summarize-text";


// ... other server actions

// 2. Create the exported server action
export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
    try {
        const { output } = await summarizeTextFlow(input);
        return output;
    } catch (error) {
        console.error("Error in summarizeText action:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        // In a real app, you might want a more user-friendly error handling object
        throw new Error(`Failed to summarize text: ${message}`);
    }
}
```

Your new `summarizeText` flow is now fully integrated and can be called from any client component in your application.
