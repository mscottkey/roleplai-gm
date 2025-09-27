// src/ai/prompts/generate-campaign-pieces-prompts.ts

export const generateCampaignCorePromptText = `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign. Based on the provided setting, tone, and characters, generate the core narrative concepts.

## CRITICAL INSTRUCTIONS
- You MUST create campaign issues and aspects that are directly relevant to and consistent with the specific setting provided below
- Use the examples as inspiration for the STYLE and SCOPE, but create original content that fits the actual setting
- Do NOT copy the examples - they are just to show you the right type of content for this genre

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

## Genre Context: {{{genreDescription}}}

## Examples for This Genre (DO NOT COPY - Use as inspiration only)

### Example Campaign Issues:
{{#each genreCampaignIssues}}
- {{this}}
{{/each}}

### Example Campaign Aspects:
{{#each genreCampaignAspects}}
- "{{this}}"
{{/each}}

## Your Task
Based SPECIFICALLY on the setting and tone above, create:

1. **Campaign Issues (2):** Create two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict. Draw inspiration from the examples above but make them specific to your setting.

2. **Campaign Aspects (3-5):** Define 3 to 5 overarching Fate Aspects for the campaign world. These should be things you can compel to introduce complications. Make them evocative and relevant to the characters and setting. Follow the style of the examples but reflect the specific world described in the setting.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignFactionsPromptText = `You are a master storyteller and game designer. You are designing the active threats and factions for a tabletop RPG campaign.

## CRITICAL INSTRUCTIONS
- Create factions that fit the specific setting and campaign issues provided
- Use the genre context as inspiration but make factions specific to the actual setting
- Focus on threats and factions that would realistically exist in this world

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Genre Context: {{{genreDescription}}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Design 2 or 3 key factions or looming threats that are directly related to the campaign issues and aspects, and that would realistically exist in the specific setting described above. For each faction:

1. Provide a name and a one-sentence description that fits the setting
2. Create a 4-step "Project Clock" with a clear objective. For each step of the clock (1-4), write a short sentence describing what happens if the players ignore this faction and their clock advances.

The factions should feel like they belong in the specific world described in the setting, not generic threats.

Return the result as a single, valid JSON array of faction objects that conforms to the schema. Do not include any extra text or explanations.`;


export const generateCampaignNodesPromptText = `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## CRITICAL INSTRUCTIONS
- Create nodes that directly reflect the specific setting, locations, and factions provided.
- Use the Notable Locations from the setting as the basis for your nodes.
- Make NPCs, challenges, and secrets that fit the established world.

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Genre Context: {{{genreDescription}}}

## Factions
{{#each factions}}
- **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Create a web of 5 to 7 interconnected situation nodes, using the Notable Locations from the setting as inspiration. Each node must have narrative depth.

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
    *   **id:** A short, unique identifier for the secret (e.g., "secret-1").
    *   **trigger:** A clear condition for discovering the secret (e.g., "If a character inspects the strange altar," "If a character with high Lore succeeds on a check").
    *   **revelation:** The information that is learned when the secret is discovered.
    *   **impact:** How this revelation changes the story or opens up new possibilities.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;
