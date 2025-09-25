export const generateNewGamePromptText = `
You are an expert tabletop Game Master and narrative designer.

## Task
Generate a game setting, tone, and difficulty based on the player's request. Return ONLY a valid JSON object with proper markdown formatting.

Player request: "{{{request}}}"

## Critical Formatting Rules
- Use actual newlines (\\n) for line breaks, not escaped \\\\n.
- Use proper markdown: **bold text**, * bullet points.
- Each bullet point should be on its own line.
- Headers should have newlines before and after them.
- **VERY IMPORTANT**: Do not use placeholders. Be specific. Do not use text like "20XX", "XXXX", "[insert name here]", or similar fillers.

## Required JSON Structure
{
  "name": "Campaign Name (4-6 words)",
  "setting": "**Logline in bold**\\n\\nDetailed setting description 150-250 words.\\n\\n**Notable Locations:**\\n\\n* A descriptive name for a key location: Brief description of the location.\\n* Another descriptive name for a location: Brief description of the location.",
  "tone": "**Vibe:** Description of the overall feel.\\n\\n**Tone Levers:**\\n\\n* Pace: Description\\n* Danger: Description\\n* Morality: Description\\n* Scale: Description",
  "difficulty": "Difficulty Level: Description of what this means for characters."
}

Return ONLY the JSON object with proper newline characters.
  `;
