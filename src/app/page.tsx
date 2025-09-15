'use client';

import { useState } from 'react';
import type { GameData, Message, MechanicsVisibility } from '@/app/lib/types';
import { startNewGame, continueStory } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { GameView } from '@/components/game-view';

export default function RoleplAIGMPage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicsVisibility, setMechanicsVisibility] = useState<MechanicsVisibility>('Hidden');

  const handleCreateGame = async (request: string) => {
    setIsLoading(true);
    try {
      const newGame = await startNewGame({ request });
      setGameData(newGame);
      // Create a formatted initial message
      const initialMessageContent = `
**Setting:**
${newGame.setting}

**Tone:**
${newGame.tone}

**Initial Hooks:**
${newGame.initialHooks}
      `.trim();

      setMessages([
        {
          role: 'assistant',
          content: initialMessageContent,
        },
      ]);
    } catch (error) {
      console.error("Failed to start new game:", error);
      // Optionally, show an error to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (playerAction: string) => {
    const newMessages: Message[] = [...messages, { role: 'user', content: playerAction }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // The game state is the full history of interactions.
      const gameState = newMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      
      const response = await continueStory({
        actionDescription: playerAction,
        gameState,
        ruleAdapter: 'FateCore', // This could be made selectable in settings
        mechanicsVisibility,
      });

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: response.narrativeResult,
          mechanics: mechanicsVisibility !== 'Hidden' ? response.mechanicsDetails : undefined,
        },
      ]);
    } catch (error) {
       console.error("Failed to get narration:", error);
       // Revert the user message and show an error
       setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  if (!gameData) {
    return <CreateGameForm onSubmit={handleCreateGame} isLoading={isLoading} />;
  }

  return (
    <GameView
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      gameData={gameData}
      mechanicsVisibility={mechanicsVisibility}
      setMechanicsVisibility={setMechanicsVisibility}
    />
  );
}
