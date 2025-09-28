// src/ai/prompts/generate-campaign-pieces-prompts.ts

export const generateCampaignCorePromptText = `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign.

## SOURCE OF TRUTH
The following setting and tone are the absolute source of truth. All generated content MUST be directly inspired by and consistent with them.

- **Setting:** {{{setting}}}
- **Tone:** {{{tone}}}
- **Genre Category:** {{{settingCategory}}}
- **Player Characters:**
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The following examples are for a campaign in the '{{{genreDescription}}}' genre. Use them ONLY to understand the desired style, scope, and format of your response. DO NOT use the content of these examples. Your response MUST be based on the SOURCE OF TRUTH above.

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

1.  **Campaign Issues (2):** Two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict.
2.  **Campaign Aspects (3-5):** 3 to 5 overarching thematic truths about the world, written as short, evocative phrases.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignFactionsPromptText = `You are a master storyteller and game designer designing the active threats and factions for a tabletop RPG campaign.

## SOURCE OF TRUTH
The following information is the absolute source of truth for the campaign. All generated content MUST be directly inspired by and consistent with it.

- **Setting:** {{{setting}}}
- **Tone:** {{{tone}}}
- **Genre Category:** {{{settingCategory}}}
- **Campaign Issues:** {{#each campaignIssues}}- {{{this}}}{{/each}}
- **Campaign Aspects:** {{#each campaignAspects}}- "{{this}}}"{{/each}}
- **Player Characters:**
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The following examples are for the '{{{genreDescription}}}' genre. Use them ONLY to understand the style, scope, and tone that should guide your factions. DO NOT copy these examples. Your factions must be original and based on the SOURCE OF TRUTH above.

### Example Genre-Appropriate Campaign Issues:
{{#each genreCampaignIssues}}
- {{this}}
{{/each}}

### Example Genre-Appropriate Campaign Aspects:
{{#each genreCampaignAspects}}
- "{{this}}"
{{/each}}

## Your Task
Based **ONLY** on the SOURCE OF TRUTH above, design 2 to 3 key factions or looming threats that fit the world. These factions should directly relate to the campaign issues and embody the campaign aspects.

For each faction:
1.  **Name:** An evocative name that fits the setting and genre.
2.  **Description:** A one-sentence summary that captures their essence and goals.
3.  **Project Clock:** A 4-step series of events that will occur if the players do not intervene. This should have a clear, one-sentence \`objective\`, and four \`steps\` describing the faction's escalating progress.

Your factions should feel authentic to the genre and setting. For a pirate campaign, think rival crews, naval powers, or sea monsters - NOT corporate syndicates or magical plagues unless they fit the specific setting described.

Return the result as a single, valid JSON array of faction objects that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignNodesPromptText = `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## SOURCE OF TRUTH
The following information is the absolute source of truth for the campaign. All generated content MUST be directly inspired by and consistent with it.

- **Setting:** {{{setting}}} (Pay special attention to any "Notable Locations" mentioned here and use them as inspiration for your nodes.)
- **Tone:** {{{tone}}}
- **Genre Category:** {{{settingCategory}}}
- **Campaign Issues:** {{#each campaignIssues}}- {{{this}}}{{/each}}
- **Campaign Aspects:** {{#each campaignAspects}}- "{{this}}}"{{/each}}
- **Factions:**
{{#each factions}}
  - **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}
- **Player Characters:**
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## STYLE AND FORMATTING GUIDE
The following examples are for the '{{{genreDescription}}}' genre. Use them ONLY to understand the style, scope, and atmosphere that should guide your nodes. DO NOT copy these examples. Your nodes must be original and based on the SOURCE OF TRUTH above.

### Example Genre-Appropriate Campaign Issues:
{{#each genreCampaignIssues}}
- {{this}}
{{/each}}

### Example Genre-Appropriate Campaign Aspects:
{{#each genreCampaignAspects}}
- "{{this}}"
{{/each}}

## Your Task
Based **ONLY** on the SOURCE OF TRUTH above, create a web of 5 to 7 interconnected situation nodes. These nodes should reflect the genre, connect to the factions' objectives, and embody the campaign's themes.

For each node, you must define all properties required by the JSON schema, including:
-   A title and detailed description that fits the genre and setting.
-   Designate **exactly one** node as the \`isStartingNode\`.
-   Stakes, challenges, NPC faces, node-specific aspects, and a hidden agenda or secret.
-   A list of 2-3 other node titles this node provides \`leads\` to.

Your nodes should feel authentic to the genre and setting. For a pirate campaign, think ports, ships, islands, and naval bases - NOT cyberpunk corporations, magical spires, or post-apocalyptic wastelands unless they specifically fit the setting described.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;