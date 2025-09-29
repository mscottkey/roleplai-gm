# **App Name**: RoleplAI GM

## Core Features:

- Game Initialization: Allow a player to start a new game with a simple request like 'I want to play a neon-fantasy heist' which kicks off a new adventure, offering setting, tone, and initial hooks using generative AI.
- AI Gamemaster Narration: The AI GM narrates the outcomes of player actions in short, evocative beats (2-5 sentences), dynamically updating the game world based on player choices, using generative AI. It acts as a tool to drive a compelling narrative.
- Rules Adapter Interface: Integrate a pluggable rules adapter (default: Fate Core) where the AI seamlessly resolves actions and challenges behind the scenes, with a toggle to control the visibility of underlying mechanics. The AI is acting as a tool, using the rule adapter when its reasoning decides it is required.
- Action Resolution: Players declare their intent ('I sneak past the guards'), and the system resolves the action by calling the rules adapter (Fate Core or Savage Worlds stub) silently. Outcomes are presented through narrative text.
- Mechanics Visibility Toggle: Provide a toggle to control the visibility of game mechanics: Hidden (fiction only), Minimal (show outcome tier only), or Full (show rolls/resources).
- Chat Interface: Implement a chat interface where all game interaction happens, including player input and AI GM narration.
- Story Notes Drawer: A right drawer provides quick access to story notes, characters, places, aspects, and session settings.

## Style Guidelines:

- Primary color: Deep Indigo (#663399), providing a sense of mystery, intellect, and the fantastical, hinting at the endless possibilities of tabletop RPGs.
- Background color: Light gray (#F0F0F0) for readability in a text-heavy chat interface.
- Accent color: Electric Purple (#BF5FFF), is used sparingly for highlights and interactive elements, drawing the user's eye to key parts of the UI.
- Body text: 'Inter', a sans-serif font, for readability and a modern feel in the chat interface.
- Headline Font: 'Space Grotesk', sans-serif font, adds a touch of tech and science-fantasy to the presentation
- Use simple, clear icons in the right drawer to represent story elements and settings.
- Subtle animations for new messages in the chat, and transitions in the right drawer.