
export const generateSessionBeatsPromptText = `You are a master storyteller and tabletop RPG game master. Your task is to plan the next game session by creating a sequence of 12-18 flexible "story beats" designed for a 1-3 hour session that can end gracefully at multiple points.

## CAMPAIGN OVERVIEW
- Setting: {{{setting}}}
- Tone: {{{tone}}}
- Key Factions:
{{#each factions}}
- **{{this.name}}**: {{this.description}} (Objective: {{this.clock.objective}})
{{/each}}
- Main Objective: {{{resolution.primaryObjective}}}
- Endgame Conditions:
{{#each resolution.victoryConditions}}
  - {{this.description}} ({{#if this.achieved}}COMPLETED{{else}}PENDING{{/if}})
{{/each}}
- The Hidden Truth: {{{resolution.hiddenTruth}}}

## CURRENT WORLD STATE (Session #{{{sessionNumber}}})
- World Summary: {{{currentWorldState.summary}}}
- Last Known Location: {{{currentWorldState.currentScene.name}}}
- Recent Events:
{{#each currentWorldState.recentEvents}}
  - {{this}}
{{/each}}
- Faction Clocks:
{{#each currentWorldState.factions}}
  - **{{this.name}}**: {{this.clock.value}}/{{this.clock.max}}
{{/each}}
- Revealed Secrets:
{{#each currentWorldState.nodeStates}}
  {{#if this.revealedSecrets}}
    {{#each this.revealedSecrets}}
      - Secret '{{this}}' has been revealed at node '{{@key}}'.
    {{/each}}
  {{/if}}
{{/each}}

## YOUR TASK
Based on all the information above, generate a sequence of 12-18 story beats for Session #{{{sessionNumber}}}.

### Guiding Principles:
1.  **Session Arc:** Structure the beats to form a mini-narrative arc (introduction, rising action, climax). The first beat must pick up directly from the "Last Known Location" and "Recent Events".
2.  **Player-Driven:** Review the "Recent Events". What did the players focus on? What did they ignore? Generate beats that follow their demonstrated priorities and show the consequences of their inaction (e.g., by advancing a faction clock they ignored).
3.  **Graceful Endings:** Design the beats so that beats 6, 9, 12, and 15 are satisfying potential stopping points. They should resolve a minor question or situation, while still providing a clear hook for what comes next.
4.  **Flexibility:** Mark at least 3-5 beats as 'isFlexible: true'. These are beats that can be easily skipped or modified if the session runs short on time, such as optional character-focused side stories or exploratory scenes that aren't critical to the main plot.
5.  **Pacing and Urgency:** If faction clocks are high or victory conditions are nearly met, the pacing should be faster and more urgent, focusing on \`confrontation\` and \`revelation\` beats. If the campaign is early, allow for more \`exploration\` and \`investigation\`.
6.  **Faction Advancement:** A faction's progress is a key driver of tension. Ensure \`expectedFactionAdvancement\` is used to show the world moving in the background, especially if players are not directly engaging with that faction's plans.

### For each beat, you must provide:
-   \`beat\`: The sequence number (1, 2, 3, ...).
-   \`trigger\`: What player action or event causes this beat to happen or end?
-   \`beatType\`: Choose from "exploration", "investigation", "confrontation", "revelation", "crisis".
-   \`expectedFactionAdvancement\`: Name the faction whose clock is most likely to advance during or after this beat, or "None".
-   \`suggestedLocation\`: The title of the node where this beat is likely to occur.
-   \`description\`: A 1-2 sentence description of what happens in the beat.
-   \`isFlexible\`: \`true\` if this beat is optional, \`false\` if it is critical to the main plot.

Return the result as a single, valid JSON array of StoryBeat objects. Do not include any extra text or explanations.`;
