
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
1.  **Session Arc & Pacing:** Structure the beats to form a mini-narrative arc with escalating intensity. The first beat must pick up directly from the "Last Known Location" and "Recent Events".
    - **Beats 1-6 (The Hook):** Keep \`intensity\` between 1-2. Focus on \`exploration\` and \`investigation\`. Advance faction clocks conservatively (aim for 2-3 advances total in this block). For Beat 1, strongly prefer 'exploration' or 'investigation' as the \`beatType\` unless the 'Recent Events' clearly indicate the players are already in an active crisis (e.g., a warzone, a chase).
    - **Beats 7-12 (Rising Action):** Increase \`intensity\` to 3. Introduce personal danger, \`confrontation\`, and major \`revelation\` beats. Advance clocks at a normal pace (3-4 advances total in this block).
    - **Beats 13-18 (The Climax):** Ramp \`intensity\` up to 4-5. Focus on major faction conflicts and \`crisis\` beats. Be more aggressive with clock advancement (4-5 advances total in this block) to build tension towards the finale.
2.  **Concrete Triggers:** The \`trigger\` field must describe a **concrete and specific** condition that causes the beat to happen or end. Good examples: "Players successfully pick the lock on the chest," "Players defeat the guard captain," "Players question 3+ villagers about the strange lights." Bad examples: "Players investigate the area," "After the fight," "Following a hunch."
3.  **Player-Driven:** Review the "Recent Events". What did the players focus on? What did they ignore? Generate beats that follow their demonstrated priorities and show the consequences of their inaction (e.g., by advancing a faction clock they ignored).
4.  **Flexible Beats:** A beat should only be marked \`isFlexible: true\` if it is a truly optional side-story or flavor encounter that does not contain critical clues or character introductions essential for the main plot. A beat that reveals a necessary clue or advances a faction clock should not be flexible.
5.  **Session Break Guidance:** Designate natural stopping points. For beats around the 6, 9, 12, and 15 mark, if they provide a satisfying, temporary conclusion, set \`isPotentialSessionBreak: true\`. The final beat of the session (e.g., beat 18) should always be marked as a potential session break.

### For each beat, you must provide:
-   \`beat\`: The sequence number (1, 2, 3, ...).
-   \`intensity\`: The narrative intensity of the beat, from 1 (calm) to 5 (high crisis).
-   \`trigger\`: A **concrete and specific** condition that causes this beat to happen or end.
-   \`beatType\`: Choose from "exploration", "investigation", "confrontation", "revelation", "crisis".
-   \`expectedFactionAdvancement\`: Name the faction whose clock is most likely to advance during or after this beat, or "None".
-   \`suggestedLocation\`: The title of the node where this beat is likely to occur.
-   \`description\`: A 1-2 sentence description of what happens in the beat.
-   \`isFlexible\`: \`true\` if this beat is optional, \`false\` if it is critical to the main plot.
-   \`isPotentialSessionBreak\`: \`true\` if this beat serves as a good stopping point for the session.

Return the result as a single, valid JSON array of StoryBeat objects. Do not include any extra text or explanations.
`;
