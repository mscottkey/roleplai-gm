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
  const [step, setStep] = useState<'create' | 'characters' | 'play'>('create');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

  const { toast } = useToast();

  const handleCreateGame = async (request: string) => {
    setIsLoading(true);
    try {
      const newGame = await startNewGame({ request });
      setGameData(newGame);
      setStep('characters');
    } catch (error) {
       const err = error as Error;
       console.error("Failed to start new game:", err);
       toast({
         variant: "destructive",
         title: "Failed to Start Game",
         description: err.message || "An unknown error occurred.",
       });
       setStep('create');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharactersFinalized = (finalCharacters: Character[]) => {
    setCharacters(finalCharacters);
    setActiveCharacter(finalCharacters[0]); // Set the first character as active initially
    const updatedGameData = { ...gameData!, characters: finalCharacters };
    setGameData(updatedGameData);
    setStep('play');

    const characterList = finalCharacters.map(c => `- **${c.name}** (*${c.playerName}*): ${c.description}`).join('\n');

    const initialMessageContent = `
# Welcome to your adventure!

## Setting
${updatedGameData.setting}

## Tone
${updatedGameData.tone}

## Your Party
${characterList}

---

## The Adventure Begins...
${updatedGameData.initialHooks}

The stage is set, and the heroes are ready. What happens first is up to you.
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
    const newMessages: Message[] = [...messages, { role: 'user', content: `**${activeCharacter.name} (${activeCharacter.playerName})**: ${playerAction}` }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // The game state is the full history of interactions.
      const gameState = newMessages.map(m => m.content).join('\n\n');
      
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

  switch (step) {
    case 'create':
      return <CreateGameForm onSubmit={handleCreateGame} isLoading={isLoading} />;
    case 'characters':
       return (
        <CharacterCreationForm
          gameData={gameData!}
          onCharactersFinalized={handleCharactersFinalized}
          generateCharacterSuggestions={createCharacter}
        />
      );
    case 'play':
       return (
        <GameView
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          gameData={gameData!}
          characters={characters}
          activeCharacter={activeCharacter}
          setActiveCharacter={setActiveCharacter}
          mechanicsVisibility={mechanicsVisibility}
          setMechanicsVisibility={setMechanicsVisibility}
        />
      );
    default:
       return <CreateGameForm onSubmit={handleCreateGame} isLoading={isLoading} />;
  }
}
