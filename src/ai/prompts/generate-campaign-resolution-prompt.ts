
export const generateCampaignResolutionPromptText = `You are an expert game designer and storyteller, tasked with creating a satisfying endgame for a tabletop RPG campaign. You have been given the complete campaign structure. Your job is to define the final objective, the shocking truth behind it all, and the conditions for victory.

## FULL CAMPAIGN CONTEXT

### Core Concept
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Campaign Issues: 
{{#each campaignIssues}}
  - {{{this}}}
{{/each}}
- Campaign Aspects: 
{{#each campaignAspects}}
  - {{{this}}}
{{/each}}

### Factions
{{#each factions}}
- **{{this.name}}**: {{this.description}}
{{/each}}

### Key Nodes (Locations/Situations)
{{#each nodes}}
- **{{this.title}}**: {{this.description}} (Hidden Agenda: {{this.hiddenAgenda}})
{{/each}}

### Player Characters
{{#each characters}}
- **{{this.name}}** (Played by {{this.playerName}}): {{this.description}}
{{/each}}

## YOUR TASK

Based on ALL the information above, create a cohesive endgame structure.

1.  **primaryObjective**: Define a clear, actionable final goal for the players. What must they ultimately do to "win"?
2.  **hiddenTruth**: Create a surprising twist or a deeper truth that re-contextualizes the entire campaign. This should be the big "aha!" moment.
3.  **victoryConditions**: List 2-3 major, distinct objectives players must complete to achieve the primary objective. These should be challenging and require significant effort.
4.  **convergenceTriggers**: Define 2-3 world-state changes or events that, when they occur, push the campaign towards its climax. These are the signs that the endgame is beginning.
5.  **climaxReady**: Set this to \`false\`.
6.  **climaxLocation**: Suggest a fitting location for the final confrontation, likely one of the existing nodes.
7.  **involvedFactions**: List the names of the factions that are central to the final conflict.

Return the result as a single, valid JSON object that conforms to the schema. Do not include any extra text or explanations.`;
