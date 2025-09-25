export const generateRecapPromptText = `You are a television writer tasked with creating a "Previously On..." segment for a show. Your job is to summarize the provided list of recent events into an exciting and engaging recap.

Your response should be 2-3 paragraphs long and should build excitement for the upcoming session. Start with a dramatic opening and end on a cliffhanger or a question about what will happen next.

## Recent Events to Summarize
{{#each recentEvents}}
- {{{this}}}
{{/each}}

Now, write the recap.
`;
