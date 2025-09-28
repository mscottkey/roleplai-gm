
// src/ai/prompts/generate-campaign-pieces-prompts.ts

export const generateCampaignCorePromptText = `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign.

## SOURCE OF TRUTH
The following setting and tone are the absolute source of truth. All generated content MUST be directly inspired by and consistent with them.

- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Player Characters:
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The following examples are for a different campaign in the '{{{genreDescription}}}' genre. Use them ONLY to understand the desired style, scope, and format of your response. DO NOT use the content of these examples. Your response MUST be based on the SOURCE OF TRUTH above.

### Example Campaign Issues:
{{#each genreCampaignIssues}}
- {{this}}
{{/each}}

### Example Campaign Aspects:
{{#each genreCampaignAspects}}
- "{{this}}"
{{/each}}

## Your Task
Based **ONLY** on the SOURCE OF TRUTH (Setting, Tone, and Characters), create:

1. **Campaign Issues (2):** Two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict.
2. **Campaign Aspects (3-5):** 3 to 5 overarching Fate Aspects for the campaign world. These should be things you can compel to introduce complications.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignFactionsPromptText = `You are a master storyteller and game designer designing the active threats and factions for a tabletop RPG campaign.

## SOURCE OF TRUTH
The following campaign concept is the absolute source of truth. All factions MUST be directly related to it and exist logically within this specific world.

- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- "{{this}}}"{{/each}}
- Player Characters:
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The campaign genre is '{{{genreDescription}}}'. Keep this in mind for the tone and type of factions you create, but base their specific details on the SOURCE OF TRUTH.

## Your Task
Based **ONLY** on the SOURCE OF TRUTH above, design 2 or 3 key factions or looming threats. For each faction:

1.  Provide a name and a one-sentence description that fits the setting.
2.  Create a 4-step "Project Clock" with a clear objective. For each step of the clock (1-4), write a short sentence describing what happens if the players ignore this faction and their clock advances.

Return the result as a single, valid JSON array of faction objects that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignNodesPromptText = `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## SOURCE OF TRUTH
The following campaign concept is the absolute source of truth. All nodes, NPCs, and secrets MUST be derived from it. Use the "Notable Locations" mentioned in the Setting as direct inspiration for your nodes.

- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- "{{this}}}"{{/each}}
- Factions:
{{#each factions}}
  - **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}
- Player Characters:
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The campaign genre is '{{{genreDescription}}}'. Ensure the challenges, secrets, and NPC details are appropriate for this genre, but base their existence on the SOURCE OF TRUTH.

## Your Task
Based **ONLY** on the SOURCE OF TRUTH, create a web of 5 to 7 interconnected situation nodes.

For each node:
1.  **title:** A descriptive name for the situation or location.
2.  **description:** A one-paragraph description of the situation at this node.
3.  **isStartingNode:** Designate **exactly one** node as the starting point for the campaign by setting this to \`true\`. This should be the most logical entry point. All other nodes must have this set to \`false\`.
4.  **leads:** List 2-3 other node titles that this node provides clear leads to.
5.  **stakes:** Briefly describe what changes if the PCs succeed, fail, or get delayed here.
6.  **challenges (2-3):** Provide 2-3 general challenges or obstacles present at this node.
7.  **faces (1-2):** Name 1-2 key NPCs at this node. For each Face, provide a name, role, aspect, and one-sentence description.
8.  **aspects (2):** Provide two Fate Aspects specific to this node.
9.  **hiddenAgenda:** A one-sentence description of the true nature of this location or situation, or what's really going on beneath the surface.
10. **secrets (2-3):** An array of 2-3 secret objects. Each secret must have:
    *   **id:** A short, unique identifier for the secret (e.g., "secret-altar").
    *   **trigger:** A clear condition for discovering the secret (e.g., "If a character inspects the strange altar").
    *   **revelation:** The information that is learned when the secret is discovered.
    *   **impact:** How this revelation changes the story or opens up new possibilities.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;
