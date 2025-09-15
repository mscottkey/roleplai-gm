'use client';

import { useState } from 'react';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { startNewGame, continueStory } from '@/app/actions';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';

export default function RoleplAIGMPage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicsVisibility, setMechanicsVisibility] = useState<MechanicsVisibility>('Hidden');
  const [isCreatingCharacters, setIsCreatingCharacters] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);


  const handleCreateGame = async (request: string) => {
    setIsLoading(true);
    try {
      const newGame = await startNewGame({ request });
      setGameData(newGame);
      setIsCreatingCharacters(true); // Move to character creation
    } catch (error) {
       const err = error as Error;
       console.error("Failed to start new game:", err);
       toast({
         variant: "destructive",
         title: "Failed to Start Game",
         description: err.message || "An unknown error occurred.",
       });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterSelected = (character: Character) => {
    setActiveCharacter(character);
    setGameData(prev => prev ? { ...prev, characters: [character] } : null);
    setIsCreatingCharacters(false);

    const initialMessageContent = `
# Welcome to your adventure!

## Setting
${gameData?.setting}

## Tone
${gameData?.tone}

## Initial Hooks
${gameData?.initialHooks}

---

You are **${character.name}**: *${character.description}*
`.trim();

    setMessages([
      {
        role: 'assistant',
        content: initialMessageContent,
      },
    ]);
  }

  const handleSendMessage = async (playerAction: string) => {
    if (!activeCharacter) {
        toast({
            variant: "destructive",
            title: "No Active Character",
            description: "A character must be selected to perform actions.",
        });
        return;
    }
    const newMessages: Message[] = [...messages, { role: 'user', content: playerAction }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // The game state is the full history of interactions.
      const gameState = newMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      
      const response = await continueStory({
        actionDescription: playerAction,
        gameState,
        character: activeCharacter,
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
       const err = error as Error;
       console.error("Failed to get narration:", err);
       toast({
         variant: "destructive",
         title: "Failed to Continue Story",
         description: err.message || "An unknown error occurred.",
       });
       // Revert the user message on error
       setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  if (!gameData) {
    return <CreateGameForm onSubmit={handleCreateGame} isLoading={isLoading} />;
  }

  if (isCreatingCharacters) {
    return (
      <CharacterCreationForm
        gameData={gameData}
        onCharacterSelect={handleCharacterSelected}
        generateCharacterSuggestions={createCharacter}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    );
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
