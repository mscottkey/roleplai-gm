
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams }
from 'next/navigation';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { startNewGame, continueStory, updateWorldState, routePlayerInput, getAnswerToQuestion } from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, getFirestore, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/icons';
import { LoginForm } from '@/components/login-form';
import { GameSession } from '@/app/lib/types';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [games, setGames] = useState<GameSession[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storyMessages, setStoryMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicsVisibility, setMechanicsVisibility] = useState<MechanicsVisibility>('Hidden');
  const [step, setStep] = useState<'create' | 'characters' | 'play' | 'loading'>('loading');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      setStep('loading');
      return;
    }
    if (!user) {
      // The login page is now responsible for handling the auth flow.
      // This page assumes a user is logged in.
      return;
    }

    const db = getFirestore();
    const q = query(
      collection(db, 'games'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userGames = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GameSession));
      setGames(userGames);

      // If no game is selected via URL, and we have games, default to the latest one.
      const currentGameId = searchParams.get('game');
      if (!currentGameId && userGames.length > 0) {
        // router.push(`/?game=${userGames[0].id}`);
      } else if (!currentGameId) {
        setStep('create');
      }
    }, (error) => {
      console.error("[Firestore Listener Error]: ", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not fetch your games. Please check your connection and security rules."
      })
    });

    return () => unsubscribe();
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId && gameId !== activeGameId) {
      setActiveGameId(gameId);
    } else if (!gameId && activeGameId) {
      // Clear state when navigating away from a game
      setActiveGameId(null);
      setGameData(null);
      setWorldState(null);
      setMessages([]);
      setStoryMessages([]);
      setCharacters([]);
      setActiveCharacter(null);
      setStep('create');
    }
  }, [searchParams, activeGameId]);

  useEffect(() => {
    if (!activeGameId) {
        if (!authLoading) setStep('create');
        return;
    }
    
    setStep('loading');
    const db = getFirestore();
    const unsub = onSnapshot(doc(db, "games", activeGameId), (doc) => {
      if (doc.exists()) {
        const game = doc.data() as GameSession;
        setGameData(game.gameData);
        setWorldState(game.worldState);
        setMessages(game.messages || []);
        setStoryMessages(game.storyMessages || []);
        const finalCharacters = game.gameData.characters || [];
        setCharacters(finalCharacters);
        
        if (finalCharacters.length > 0) {
          const savedActiveCharId = game.activeCharacterId;
          const restoredChar = finalCharacters.find(c => c.id === savedActiveCharId) || finalCharacters[0];
          setActiveCharacter(restoredChar);
        }

        setStep(game.step === 'characters' ? 'characters' : 'play');
      } else {
        console.error("No such game!");
        toast({ variant: 'destructive', title: 'Error', description: 'Game session not found.' });
        router.push('/');
      }
    });
    return () => unsub();
    
  }, [activeGameId, authLoading, router, toast]);
  
  if (authLoading || step === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }
  
  if (!user) {
    // This case should be handled by the /login page,
    // but as a fallback, show a loading or locked state.
    return <LoginForm />;
  }

  const handleCreateGame = async (request: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a game.' });
      return;
    }

    setIsLoading(true);
    try {
      const { gameId, newGame } = await startNewGame({ request, userId: user.uid });
      router.push(`/?game=${gameId}`);
      setActiveGameId(gameId); // This will trigger the snapshot listener
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

  const handleCharactersFinalized = async (finalCharacters: Character[]) => {
    if (!activeGameId || !gameData) return;

    setActiveCharacter(finalCharacters[0]);
    const updatedGameData = { ...gameData, characters: finalCharacters };
    const updatedWorldState = {
      ...worldState!,
      characters: finalCharacters.map(c => ({
        name: c.name,
        description: c.description,
        aspect: c.aspect,
        playerName: c.playerName,
        archetype: c.archetype,
        gender: c.gender,
        age: c.age,
        skills: c.skills,
        stunts: c.stunts,
      }))
    };

    setGameData(updatedGameData);
    setWorldState(updatedWorldState);
    setCharacters(finalCharacters);
    
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

    const initialMessage: Message = { role: 'assistant', content: initialMessageContent };
    const newMessages = [initialMessage];
    const newStoryMessages = [{ content: initialMessageContent }];
    setMessages(newMessages);
    setStoryMessages(newStoryMessages);

    try {
      await updateWorldState({
        gameId: activeGameId,
        updates: {
          'gameData.characters': finalCharacters,
          worldState: updatedWorldState,
          messages: newMessages,
          storyMessages: newStoryMessages,
          step: 'play',
          activeCharacterId: finalCharacters[0].id,
        }
      });
      setStep('play');
    } catch (error) {
      console.error("Failed to save characters:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save finalized characters.' });
    }
  };


  const handleSendMessage = async (playerInput: string) => {
    if (!activeCharacter || !worldState || !activeGameId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An active character and game state are required to proceed.",
        });
        return;
    }
    const userMessageContent = `**${activeCharacter.name} (${activeCharacter.playerName})**: ${playerInput}`;
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages); // Optimistic update
    setIsLoading(true);

    try {
      const { intent } = await routePlayerInput({ playerInput });
      
      let assistantMessage: Message;

      if (intent === 'Action') {
        const response = await continueStory({
          actionDescription: playerInput,
          worldState,
          character: {
            name: activeCharacter.name,
            description: activeCharacter.description,
            aspect: activeCharacter.aspect,
          },
          ruleAdapter: 'FateCore', 
          mechanicsVisibility,
        });

        assistantMessage = {
          role: 'assistant',
          content: response.narrativeResult,
          mechanics: mechanicsVisibility !== 'Hidden' ? response.mechanicsDetails : undefined,
        };

        const newStoryMessages = [...storyMessages, {content: response.narrativeResult}];
        setStoryMessages(newStoryMessages);
        
        // Auto-advance turn
        const currentIndex = characters.findIndex(c => c.id === activeCharacter.id);
        const nextIndex = (currentIndex + 1) % characters.length;
        const nextCharacter = characters[nextIndex];
        setActiveCharacter(nextCharacter);
        
        // Update world state in the background.
        updateWorldState({
            gameId: activeGameId,
            playerAction: {
              characterName: activeCharacter.name,
              action: playerInput,
            },
            gmResponse: response.narrativeResult,
            currentWorldState: worldState,
            updates: {
              messages: [...newMessages, assistantMessage],
              storyMessages: newStoryMessages,
              activeCharacterId: nextCharacter.id,
            }
        }).catch(err => {
            console.error("Failed to update world state:", err);
            // Non-critical, so we just log the error.
        });

      } else { // Intent is 'Question'
        const response = await getAnswerToQuestion({
          question: playerInput,
          worldState,
          character: {
            name: activeCharacter.name,
            description: activeCharacter.description,
            aspect: activeCharacter.aspect,
          },
        });

        assistantMessage = {
          role: 'assistant',
          content: response.answer,
        };
        
        // Save question and answer to message history
        await updateWorldState({
            gameId: activeGameId,
            updates: {
              messages: [...newMessages, assistantMessage],
            }
        });
      }
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
       const err = error as Error;
       console.error("Failed to process input:", err);
       toast({
         variant: "destructive",
         title: "Error",
         description: err.message || "An unknown error occurred.",
       });
       setMessages(messages); // Revert optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
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
            setActiveCharacter={(char) => {
              setActiveCharacter(char);
              if (activeGameId) {
                updateWorldState({ gameId: activeGameId, updates: { activeCharacterId: char.id } });
              }
            }}
            mechanicsVisibility={mechanicsVisibility}
            setMechanicsVisibility={setMechanicsVisibility}
          />
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        );
    }
  };

  return (
    <AppShell
      games={games}
      activeGameId={activeGameId}
      onNewGame={() => router.push('/')}
      onSelectGame={(gameId) => router.push(`/?game=${gameId}`)}
    >
      {renderContent()}
    </AppShell>
  );
}
