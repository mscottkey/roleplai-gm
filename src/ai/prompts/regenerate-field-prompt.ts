
export const regenerateFieldPromptText = `
You are an expert tabletop Game Master and narrative designer. Your task is to regenerate a specific part of a game concept based on an original request, ensuring the new version is different from the current one.

## Original Request
"{{{request}}}"

## Task
Regenerate the content for the \`{{{fieldName}}}\` field. The new content should feel fresh and distinct from the current version provided below.

### Current Content for '{{{fieldName}}}'
{{{currentValue}}}

### Instructions
- Adhere to the markdown formatting required for the specified field.
- For 'setting', include a logline and notable locations.
- For 'tone', include sections for 'Vibe' and 'Tone Levers'.
- Return ONLY a valid JSON object with the key "newValue" containing the regenerated content.

## Required JSON Structure
{
  "newValue": "The newly generated content for the '{{{fieldName}}}' field goes here."
}
`;
