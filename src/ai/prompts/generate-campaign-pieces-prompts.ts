

// src/ai/prompts/generate-campaign-pieces-prompts.ts

export const generateCampaignCorePromptText = `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign.

## Campaign Concept
- **Setting:** {{{setting}}}
- **Tone:** {{{tone}}}
- **Player Characters:**
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Based **ONLY** on the Campaign Concept provided above, create:

1.  **Two Campaign Issues:** High-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict.
2.  **3-5 Campaign Aspects:** Overarching thematic truths about the world, written as short, evocative phrases (e.g., "Magic is Fading," "The Stars Are Wrong," "A City That Never Sleeps").

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignFactionsPromptText = `You are a master storyteller and game designer designing the active threats and factions for a tabletop RPG campaign.

## Campaign Concept
- **Setting:** {{{setting}}}
- **Tone:** {{{tone}}}
- **Campaign Issues:** {{#each campaignIssues}}- {{{this}}}{{/each}}
- **Campaign Aspects:** {{#each campaignAspects}}- "{{this}}}"{{/each}}
- **Player Characters:**
{{#each characters}}
  - **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Based **ONLY** on the Campaign Concept above, design 2 to 3 key factions or looming threats.

For each faction:
1.  **Name:** An evocative name that fits the setting.
2.  **Description:** A one-sentence summary.
3.  **Project Clock:** A 4-step series of events that will occur if the players do not intervene. This should have a clear, one-sentence \`objective\`, and four \`steps\` describing the faction's progress.

Return the result as a single, valid JSON array of faction objects that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignNodesPromptText = `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## Campaign Concept
- **Setting:** {{{setting}}} (Pay special attention to any "Notable Locations" mentioned here and use them as inspiration for your nodes.)
- **Tone:** {{{tone}}}
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

## Your Task
Based **ONLY** on the Campaign Concept above, create a web of 5 to 7 interconnected situation nodes.

For each node, you must define all properties required by the JSON schema, including:
-   A title and detailed description.
-   Designate **exactly one** node as the \`isStartingNode\`.
-   Stakes, challenges, NPC faces, node-specific aspects, and a hidden agenda or secret.
-   A list of 2-3 other node titles this node provides \`leads\` to.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;
