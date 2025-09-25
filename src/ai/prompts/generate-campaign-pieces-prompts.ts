export const generateCampaignCorePromptText = `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign. Based on the provided setting, tone, and characters, generate the core narrative concepts.

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}})
  - Archetype: {{this.archetype}}
  - Aspect: "{{this.aspect}}"
  - Description: {{this.description}}
{{/each}}

## Your Task
1.  **Campaign Issues (2):** Create two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict.
2.  **Campaign Aspects (3-5):** Define 3 to 5 overarching Fate Aspects for the campaign world. These should be things you can compel to introduce complications. Make them evocative and relevant to the characters and setting.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;

export const generateCampaignFactionsPromptText = `You are a master storyteller and game designer. You are designing the active threats and factions for a tabletop RPG campaign.

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Design 2 or 3 key factions or looming threats that are directly related to the campaign issues and aspects. For each faction:
1.  Provide a name and a one-sentence description.
2.  Create a 4-step "Project Clock" with a clear objective. For each step of the clock (1-4), write a short sentence describing what happens if the players ignore this faction and their clock advances.

Return the result as a single, valid JSON array of faction objects that conforms to the schema. Do not include any extra text or explanations.`;

export const generateCampaignNodesPromptText = `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Factions
{{#each factions}}
- **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Create a web of 5 to 7 interconnected situation nodes (these can be people, places, or problems), using the Notable Locations from the setting as inspiration for some of the nodes. For each node:
1.  **title:** A descriptive name for the situation or location.
2.  **description:** A one-paragraph description of the situation at this node.
3.  **isStartingNode:** Designate **exactly one** node as the starting point for the campaign by setting this to \`true\`. This should be the most logical and exciting entry point for the created party. All other nodes must have this set to \`false\`.
4.  **leads:** List 2-3 other node titles that this node provides clear leads to. This creates the "web."
5.  **stakes:** Briefly describe what changes if the PCs succeed, fail, or get delayed at this node. Focus on consequences.
6.  **challenges (2-3):** Provide 2-3 general challenges or obstacles present at this node. Examples: "A group of hostile NPCs", "A dangerous environmental condition", "A social conflict to navigate".
7.  **faces (1-2):** Name 1 or 2 key NPCs at this node. For each Face, provide:
    *   **name:** The NPC's name.
    *   **role:** Their job or function (e.g., "Merchant", "Guard Captain", "Village Elder").
    *   **aspect:** A descriptive aspect implying their skills and personality (e.g., "Deceptively Honest", "Battle-Weary Veteran").
    *   **description:** A one-sentence descriptor.
8.  **aspects (2):** Provide two Fate Aspects specific to this node, reflecting its unique nature.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;
