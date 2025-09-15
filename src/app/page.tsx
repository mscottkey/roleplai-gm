'use client';

import { useState } from 'react';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { startNewGame, continueStory, updateWorldState, routePlayerInput, getAnswerToQuestion } from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';

const normalizeOrderedList = (s: string) => {
  if (!s) return s;
  // Put every "N. " at the start of a new line (keeps the first "1. " as-is)
  return s
    .trim()
    .replace(/(\d+)\.\s/g, (m, num, offset, full) => (offset === 0 ? `${num}. ` : `\n${num}. `))
    .replace(/\n{2,}/g, '\n'); // collapse accidental extra blank lines
};

const normalizeInlineBulletsInSections = (md: string) => {
  if (!md) return md;
  // If bullets were jammed inline like: "Key Factions: * A * B * C"
  // turn them into real list lines ONLY for the named sections.
  const fixLine = (title: string, text: string) => {
    const re = new RegExp(`(${title}:)\\s*(.*)`, 'i');
    return text.replace(re, (_m, t, rest) => {
      const fixed = rest
        // turn " * " or "* " into "\n- " but only in this captured section tail
        .replace(/\s*\*\s+/g, '\n- ')
        .trim();
      return `${t}\n${fixed}`;
    });
  };
  md = fixLine('Key Factions', md);
  md = fixLine('Notable Locations', md);
  return md;
};


export default function RoleplAIGMPage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storyMessages, setStoryMessages] = useState<Message[]>([]);
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

    const cleanedSetting = normalizeInlineBulletsInSections(updatedGameData.setting);
    const cleanedTone = normalizeInlineBulletsInSections(updatedGameData.tone);
    const cleanedHooks = normalizeOrderedList(updatedGameData.initialHooks);

    const initialMessageContent = `
# Welcome to your adventure!

## Setting
${cleanedSetting}

## Tone
${cleanedTone}

## Your Party
${characterList}

---

## The Adventure Begins...

${cleanedHooks}

The stage is set, and the heroes are ready. What happens first is up to you.
`.trim();

    const initialMessage = {
      role: 'assistant',
      content: initialMessageContent,
    } as Message;
    setMessages([initialMessage]);
    setStoryMessages([initialMessage]);
  }


  const handleSendMessage = async (playerInput: string) => {
    if (!activeCharacter || !worldState) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An active character and game state are required to proceed.",
        });
        return;
    }
    const userMessageContent = `**${activeCharacter.name} (${activeCharacter.playerName})**: ${playerInput}`;
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { intent } = await routePlayerInput({ playerInput });
      
      let assistantMessage: Message;

      if (intent === 'Action') {
        const response = await continueStory({
          actionDescription: playerInput,
          worldState,
          character: activeCharacter,
          ruleAdapter: 'FateCore', 
          mechanicsVisibility,
        });

        assistantMessage = {
          role: 'assistant',
          content: response.narrativeResult,
          mechanics: mechanicsVisibility !== 'Hidden' ? response.mechanicsDetails : undefined,
        };

        setStoryMessages(prev => [...prev, assistantMessage]);
        
        // Kick off the world state update in the background.
        updateWorldState({
            worldState,
            playerAction: {
              characterName: activeCharacter.name,
              action: playerInput,
            },
            gmResponse: response.narrativeResult
        }).then(newWorldState => {
            setWorldState(newWorldState);
        }).catch(err => {
            console.error("Failed to update world state:", err);
            // Non-critical, so we just log the error.
        });

      } else { // Intent is 'Question'
        const response = await getAnswerToQuestion({
          question: playerInput,
          worldState,
        });

        assistantMessage = {
          role: 'assistant',
          content: response.answer,
        };
      }
      
      setMessages([...newMessages, assistantMessage]);

    } catch (error) {
       const err = error as Error;
       console.error("Failed to process input:", err);
       toast({
         variant: "destructive",
         title: "Error",
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
          storyMessages={storyMessages}
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
