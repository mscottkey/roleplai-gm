'use client';

import { useState } from 'react';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { startNewGame, continueStory, updateWorldState } from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';

export default function RoleplAIGMPage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
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
      setWorldState({
        summary: `The game is a ${newGame.tone} adventure set in ${newGame.setting}.`,
        storyOutline: newGame.initialHooks.split('\n').filter(s => s.length > 0),
        recentEvents: ["The adventure has just begun."],
        characters: [],
        places: [],
        storyAspects: [],
      });
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
    setActiveCharacter(finalCharacters[0]);
    const updatedGameData = { ...gameData!, characters: finalCharacters };
    setGameData(updatedGameData);
    
    // Update World State with characters
    setWorldState(prevState => ({
      ...prevState!,
      characters: finalCharacters.map(c => ({
        name: c.name,
        description: c.description,
        aspect: c.aspect,
        playerName: c.playerName,
      }))
    }));

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
    if (!activeCharacter || !worldState) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An active character and game state are required to proceed.",
        });
        return;
    }
    const userMessageContent = `**${activeCharacter.name} (${activeCharacter.playerName})**: ${playerAction}`;
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await continueStory({
        actionDescription: playerAction,
        worldState,
        character: activeCharacter,
        ruleAdapter: 'FateCore', 
        mechanicsVisibility,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.narrativeResult,
        mechanics: mechanicsVisibility !== 'Hidden' ? response.mechanicsDetails : undefined,
      };
      
      setMessages([...newMessages, assistantMessage]);

      // Kick off the world state update in the background. No need to await it.
      updateWorldState({
          worldState,
          playerAction: {
            characterName: activeCharacter.name,
            action: playerAction,
          },
          gmResponse: response.narrativeResult
      }).then(newWorldState => {
          setWorldState(newWorldState);
      }).catch(err => {
          console.error("Failed to update world state:", err);
          // Non-critical, so we just log the error.
      });

    } catch (error) {
       const err = error as Error;
       console.error("Failed to get narration:", err);
       toast({
         variant: "destructive",
         title: "Failed to Continue Story",
         description: err.message || "An unknown error occurred.",
       });
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
          worldState={worldState}
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
