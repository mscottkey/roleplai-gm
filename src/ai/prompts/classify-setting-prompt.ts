
import { SETTING_EXAMPLES } from "@/lib/setting-examples";

// Helper function to generate category descriptions for prompts
export function generateCategoryDescriptions(): string {
    return Object.entries(SETTING_EXAMPLES)
      .map(([key, value]) => `- **${key}**: ${value.description}`)
      .join('\n');
}

export const classifySettingPromptText = `You are an expert genre classification system for a tabletop RPG tool. Your goal is to classify the provided game concept into one of the predefined genres.

### How to Classify
1.  Start with the **Original Request**. This is the user's core idea.
2.  Use the detailed **Setting** and **Tone** descriptions to understand the world's specifics and mood. This detailed context is more important than the original request if they seem to conflict.
3.  Choose the single best-fitting category from the list below.

### Information to Analyze
- **Original Request:** \`{{{originalRequest}}}\`
- **Setting Description:** \`{{{setting}}}\`
{{#if tone}}
- **Tone Description:** \`{{{tone}}}\`
{{/if}}

### Available Categories
{{{availableCategories}}}

### Your Response
Synthesize all the information provided above. Choose the best category, provide a confidence score from 0.0 to 1.0, and a brief explanation for your choice.
`;
