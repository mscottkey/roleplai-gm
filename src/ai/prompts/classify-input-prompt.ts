
export const classifyInputPromptText = `You are an intent classification system for a role-playing game. Your task is to determine if the player's input is a declared action for their character to perform, or if it is a question directed to the Game Master (GM).

- An "Action" is when a player describes what their character does, says, or attempts to do. Examples: "I attack the goblin with my sword," "I try to pick the lock," "I ask the bartender for rumors."
- A "Question" is when a player asks for information about the game world, rules, or possibilities. These are often out-of-character questions to the GM. Examples: "Are there any guards in the hallway?", "What does the inscription say?", "Can I see the ceiling from here?".

Player Input: {{{playerInput}}}

Based only on the player input, classify the intent as either "Action" or "Question". Provide a confidence score and a brief reasoning for your choice.
`;
