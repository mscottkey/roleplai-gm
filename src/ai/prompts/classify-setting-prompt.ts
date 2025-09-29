
import { SETTING_EXAMPLES } from "@/lib/setting-examples";

// Helper function to generate category descriptions for prompts
export function generateCategoryDescriptions(): string {
    return Object.entries(SETTING_EXAMPLES)
      .map(([key, value]) => `- **${key}**: ${value.description}`)
      .join('\n');
}

export const classifySettingPromptText = `You are an expert genre classification system for a tabletop RPG tool. Your goal is to classify the provided game concept into one of the predefined genres.

### How to Classify
1.  **Analyze Holistically**: Read the Original Request, Setting, and Tone together to get a full picture.
2.  **Identify Core Elements**: Look for the primary subjects, actions, and environment. Are they pirates on ships? Knights in castles? Hackers in a dystopia?
3.  **Prioritize Core Elements over Keywords**: Do not be swayed by superficial keywords. A story about a "brittle empire" of pirates is still a pirate story, not a post-apocalyptic one. The core subject matter (pirates, seas, ships) is more important than descriptive words like "brittle" or "ruins."
4.  **Choose the Best Fit**: Select the single category from the list below that best describes the central theme and environment of the story.

### Information to Analyze
- **Original Request:** \`{{{originalRequest}}}\`
- **Setting Description:** \`{{{setting}}}\`
{{#if tone}}
- **Tone Description:** \`{{{tone}}}\`
{{/if}}

### Available Categories
{{{availableCategories}}}

### Your Response
Synthesize all the information provided above. Choose the best category, provide a confidence score from 0.0 to 1.0, and a brief explanation for your choice that focuses on the core elements of the setting.
`;
