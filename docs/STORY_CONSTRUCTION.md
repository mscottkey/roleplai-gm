# Story and Campaign Construction Flow

The application employs a multi-stage, AI-driven pipeline to construct a rich, playable tabletop RPG campaign from a single user prompt. This process is designed to be robust, creating interconnected narrative elements that form the foundation of the game world.

Here is a step-by-step breakdown of the technical flow:

### Stage 1: Initial Concept Generation

1.  **User Request & Sanitization**: The process begins when the user submits a simple text prompt (e.g., "a neon-fantasy heist") via the UI. This request is first sent to the `sanitizeIp` flow (`src/ai/flows/sanitize-ip.ts`), an AI-powered function that checks for and replaces any references to protected intellectual property with generic equivalents (e.g., "Star Wars" becomes "space opera").

2.  **Core World Generation**: The sanitized request is then passed to the `generateNewGame` flow (`src/ai/flows/generate-new-game.ts`). This is the first major creative step, where the AI generates the high-level concept for the campaign. It produces a structured object containing:
    *   **Name**: A short, evocative campaign title.
    *   **Setting**: A detailed description of the world, including a markdown section for **Notable Locations**.
    *   **Tone**: A description of the game's feel, including markdown sections for **Vibe** and **Tone Levers** (Pace, Danger, Morality, Scale).
    *   **Difficulty**: A difficulty rating and description.
    *   **Initial Hooks**: A list of one-sentence plot ideas to engage the players immediately.

This initial data is saved to Firestore, and the application transitions to the character creation stage.

### Stage 2: Character Creation

The `setting` and `tone` generated in Stage 1 are now used as context for character generation. The user defines player slots, and the `generateCharacter` flow (`src/ai/flows/generate-character.ts`) is used to create unique characters that are thematically consistent with the game world.

### Stage 3: Detailed Campaign Structure Generation (The "World Build")

This is the most complex stage, occurring after the player characters have been finalized. It is orchestrated by the `generateCampaignStructureFlow` in `src/ai/flows/generate-campaign-structure.ts`. To prevent server timeouts, this single conceptual task is broken down into three sequential, smaller AI flows:

1.  **`generateCampaignCore`**:
    *   **Input**: `setting`, `tone`, and the list of finalized `characters`.
    *   **Process**: This flow (`src/ai/flows/generate-campaign-pieces.ts`) establishes the central conflicts of the story.
    *   **Output**: Two high-level **Campaign Issues** (unresolved tensions) and 3-5 overarching **Campaign Aspects** (thematic truths about the world).

2.  **`generateCampaignFactions`**:
    *   **Input**: All data from the previous step (`setting`, `tone`, `characters`, `campaignIssues`, `campaignAspects`).
    *   **Process**: This flow designs the primary movers and shakers of the world. It creates active threats directly related to the core concepts.
    *   **Output**: An array of 2-3 **Factions**. Each faction has a name, a description, and a "Project Clock"—a 4-step series of events that will occur if the players do not intervene.

3.  **`generateCampaignNodes`**:
    *   **Input**: All data from the previous steps, including the newly created `factions`.
    *   **Process**: This is the final step, where the AI builds the "web" of playable situations. It uses the Notable Locations from Stage 1 as inspiration.
    *   **Output**: An array of 5-7 interconnected **Nodes**. Each node represents a person, place, or problem and contains:
        *   `title` and `description`.
        *   `isStartingNode`: A boolean flag to mark the campaign's entry point.
        *   `leads`: A list of other node titles it connects to.
        *   `stakes`, `challenges`, and key NPCs (`faces`).

### Stage 4: Finalization and Game Start

The complete `CampaignStructure` object (containing issues, aspects, factions, and nodes) is saved to a subcollection in Firestore (`/games/{gameId}/campaign/data`).

The system then generates the final welcome message for the storyboard, which includes the full setting, tone, difficulty, and initial hooks. The `description` of the node marked as `isStartingNode` is used as the opening scene narration, and the players are placed into the world, ready to act. The game is now fully constructed and ready for play.
