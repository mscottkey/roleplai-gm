// src/ai/prompts/generate-campaign-pieces-prompts.ts (Updated)

import { SettingCategory, SETTING_EXAMPLES } from '../../lib/setting-examples';

export function generateCampaignCorePromptText(settingCategory: SettingCategory): string {
  const examples = SETTING_EXAMPLES[settingCategory];
  
  return `You are a master storyteller and game designer creating the foundation for a new tabletop RPG campaign. Based on the provided setting, tone, and characters, generate the core narrative concepts.

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

## Genre Context: ${examples.description}

## Examples for This Genre (DO NOT COPY - Use as inspiration only)

### Example Campaign Issues:
${examples.campaignIssues.map(issue => `- ${issue}`).join('\n')}

### Example Campaign Aspects:
${examples.campaignAspects.map(aspect => `- "${aspect}"`).join('\n')}

## Your Task
Based SPECIFICALLY on the setting and tone above, create:

1. **Campaign Issues (2):** Create two high-level, unresolved tensions for the campaign. These should be big problems that can't be easily solved and will drive long-term conflict. Draw inspiration from the examples above but make them specific to your setting.

2. **Campaign Aspects (3-5):** Define 3 to 5 overarching Fate Aspects for the campaign world. These should be things you can compel to introduce complications. Make them evocative and relevant to the characters and setting. Follow the style of the examples but reflect the specific world described in the setting.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;
}

export function generateCampaignFactionsPromptText(settingCategory: SettingCategory): string {
  const examples = SETTING_EXAMPLES[settingCategory];
  
  return `You are a master storyteller and game designer. You are designing the active threats and factions for a tabletop RPG campaign.

## CRITICAL INSTRUCTIONS
- Create factions that fit the specific setting and campaign issues provided
- Use the genre context as inspiration but make factions specific to the actual setting
- Focus on threats and factions that would realistically exist in this world

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Genre Context: ${examples.description}

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
}

export function generateCampaignNodesPromptText(settingCategory: SettingCategory): string {
  const examples = SETTING_EXAMPLES[settingCategory];
  
  return `You are a master storyteller and game designer creating a web of interconnected situations for a tabletop RPG.

## CRITICAL INSTRUCTIONS
- Create nodes that directly reflect the specific setting, locations, and factions provided
- Use the Notable Locations from the setting as the basis for your nodes
- Make NPCs, challenges, and aspects that fit the established world

## Game Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: {{#each campaignIssues}}- {{{this}}}{{/each}}
- Campaign Aspects: {{#each campaignAspects}}- {{{this}}}{{/each}}

## Genre Context: ${examples.description}

## Factions
{{#each factions}}
- **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}

## Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## Your Task
Create a web of 5 to 7 interconnected situation nodes, using the Notable Locations from the setting as inspiration and foundation for your nodes. Each node should feel like it belongs in the specific world described above.

For each node:
1. **title:** A descriptive name for the situation or location.
2. **description:** A one-paragraph description of the situation at this node.
3. **isStartingNode:** Designate **exactly one** node as the starting point for the campaign by setting this to \`true\`. This should be the most logical and exciting entry point for the created party. All other nodes must have this set to \`false\`.
4. **leads:** List 2-3 other node titles that this node provides clear leads to. This creates the "web."
5. **stakes:** Briefly describe what changes if the PCs succeed, fail, or get delayed at this node. Focus on consequences.
6. **challenges (2-3):** Provide 2-3 general challenges or obstacles present at this node. Examples: "A group of hostile NPCs", "A dangerous environmental condition", "A social conflict to navigate".
7. **faces (1-2):** Name 1 or 2 key NPCs at this node. For each Face, provide:
    *   **name:** The NPC's name.
    *   **role:** Their job or function (e.g., "Merchant", "Guard Captain", "Village Elder").
    *   **aspect:** A descriptive aspect implying their skills and personality (e.g., "Deceptively Honest", "Battle-Weary Veteran").
    *   **description:** A one-sentence descriptor.
8. **aspects (2):** Provide two Fate Aspects specific to this node, reflecting its unique nature.

Return the result as a single, valid JSON array of node objects that conforms to the schema. Do not include any extra text or explanations.`;
}