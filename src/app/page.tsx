
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams }
from 'next/navigation';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { startNewGame, continueStory, updateWorldState, routePlayerInput, getAnswerToQuestion, checkConsequences, undoLastAction, generateCore, generateFactionsAction, generateNodesAction, generateRecap } from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, getFirestore, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { BrandedLoadingSpinner, LoadingSpinner } from '@/components/icons';
import { LoginForm } from '@/components/login-form';
import { GameSession } from '@/app/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { cleanMarkdown } from '@/lib/utils';

const normalizeOrderedList = (s: string) => {
  if (!s) return s;
  return s
    .trim()
    .replace(/(\d+)\.\s/g, '\n$1. ')
    .replace(/^\s*1\./, '1.')
    .replace(/\n{2,}/g, '\n');
};

const normalizeInlineBulletsInSections = (md: string) => {
    if (!md) return md;

    const fixLine = (title: string, text: string) => {
        return text.replace(new RegExp(`(${title}:)(.*)`, 'ims'), (_m, a, b) => {
            if (!b) return a;
            const listItems = b.replace(/([*-])\s/g, '\n$1 ').trim();
            return `${a.trim()}\n\n${listItems}`;
        });
    };

    let processedMd = md;
    processedMd = processedMd.replace(/^\s*\*\s*(Key Factions:|Notable Locations:|Tone Levers:)/gm, '$1');
    
    processedMd = fixLine('Key Factions', processedMd);
    processedMd = fixLine('Notable Locations', processedMd);
    processedMd = fixLine('Tone Levers', processedMd);

    return cleanMarkdown(processedMd);
};



export default function RoleplAIGMPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [games, setGames] = useState<GameSession[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [previousWorldState, setPreviousWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storyMessages, setStoryMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicsVisibility, setMechanicsVisibility] = useState<MechanicsVisibility>('Hidden');
  const [step, setStep] = useState<'create' | 'characters' | 'play' | 'loading'>('loading');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; } | null>(null);

  const { toast } = useToast();

  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  
  const { speak, pause, resume, cancel, isSpeaking, isPaused, supported } = useSpeechSynthesis({
    onEnd: () => {}
  });

  const lastMessageRef = useRef<Message | null>(null);
  const sessionLoadedRef = useRef<string | null>(null);

  const cleanForSpeech = (text: string) => text.replace(/\*\*.*?\*\*:/g, '').replace(/[*_`#]/g, '');

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (isAutoPlayEnabled && lastMessage && lastMessage.role === 'assistant' && lastMessage !== lastMessageRef.current) {
      const cleanedText = cleanForSpeech(lastMessage.content);
      if (cleanedText.trim()) {
        speak(cleanedText);
      }
      lastMessageRef.current = lastMessage;
    }
  }, [messages, speak, isAutoPlayEnabled]);

  const handlePlayAll = () => {
    if (isPaused) {
      resume();
    } else if (!isSpeaking) {
      const storyText = storyMessages.map(m => cleanForSpeech(m.content)).join('\n\n');
      if (storyText.trim()) {
        speak(storyText);
      }
    }
  }

  useEffect(() => {
    if (authLoading) {
      setStep('loading');
      return;
    }
    if (!user) {
      // The login page is now responsible for handling the auth flow.
      // This page assumes a user is logged in.
      router.push('/login');
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
  }, [user, authLoading, router, searchParams, toast]);

  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId && gameId !== activeGameId) {
      setActiveGameId(gameId);
    } else if (!gameId && activeGameId) {
      // Clear state when navigating away from a game
      setActiveGameId(null);
      setGameData(null);
      setWorldState(null);
      setPreviousWorldState(null);
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
        setPreviousWorldState(game.previousWorldState || null);

        const currentMessages = game.messages || [];
        setMessages(currentMessages);

        setStoryMessages(game.storyMessages || []);
        const finalCharacters = game.gameData.characters || [];
        setCharacters(finalCharacters);
        
        if (finalCharacters.length > 0) {
          const savedActiveCharId = game.activeCharacterId;
          const restoredChar = finalCharacters.find(c => c.id === savedActiveCharId) || finalCharacters[0];
          setActiveCharacter(restoredChar);
        }

        if (game.step === 'play' && sessionLoadedRef.current !== activeGameId) {
          sessionLoadedRef.current = activeGameId;
          // Check if it's a returning session
          if (currentMessages.length > 1 && game.worldState?.recentEvents?.length > 1) {
            setIsLoading(true);
            generateRecap({ recentEvents: game.worldState.recentEvents })
              .then(recapResult => {
                const recapMessage: Message = {
                  id: 'recap-message',
                  role: 'system',
                  content: `### Previously On...\n\n${recapResult.recap}`
                };
                setMessages(prev => [recapMessage, ...prev]);
              })
              .catch(err => {
                console.error("Failed to generate recap:", err);
                toast({ variant: 'destructive', title: 'Recap Failed', description: 'Could not generate a session recap.' });
              })
              .finally(() => setIsLoading(false));
          }
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
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading Session...</p>
      </div>
    );
  }
  
  if (!user) {
    // This case is handled by the useEffect above which redirects to /login
    // It's good practice to have a fallback.
    return <LoginForm />;
  }

  const handleCreateGame = async (request: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a game.' });
      return;
    }

    setIsLoading(true);
    try {
      const { gameId, warningMessage } = await startNewGame({ request, userId: user.uid });
      
      if (warningMessage) {
        toast({
          title: "Request Modified",
          description: warningMessage,
          duration: 6000,
        });
      }

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
    setIsLoading(true);
    toast({ title: "Finalizing Characters", description: "Saving your party..." });

    try {
        const charactersForAI = finalCharacters.map(c => ({
            name: c.name,
            description: c.description,
            aspect: c.aspect,
            playerName: c.playerName,
            archetype: c.archetype,
            gender: c.gender,
            age: c.age,
            stats: c.stats,
        }));

        await updateWorldState({
            gameId: activeGameId,
            updates: {
                'gameData.characters': finalCharacters,
                'worldState.characters': charactersForAI,
                'activeCharacterId': finalCharacters[0].id,
            }
        });

        // The listener will update the local state to show the 'play' view.
        // Now, generate campaign in the background and update the messages.
        const characterList = finalCharacters.map(c => `- **${c.name}** (*${c.playerName}*): ${c.description}`).join('\n');
        
        const generatePlaceholderMessage = (status: string) => `
# Welcome to your adventure!

## Setting
${normalizeInlineBulletsInSections(gameData.setting)}

## Tone
${normalizeInlineBulletsInSections(gameData.tone)}

## Your Party
${characterList}

---

*The stage is being set. The AI is ${status}...*
`.trim();

        const placeholderMessage: Message = { id: `placeholder-${Date.now()}`, role: 'assistant', content: generatePlaceholderMessage("weaving a web of intrigue") };

        await updateWorldState({
            gameId: activeGameId,
            updates: {
                'messages': [placeholderMessage],
                'storyMessages': [{ content: placeholderMessage.content }],
                step: 'play'
            }
        });

        // Step 1: Generate Core Concepts
        await updateWorldState({ gameId: activeGameId, updates: { 'messages[0].content': generatePlaceholderMessage("generating core campaign concepts") } });
        const coreConcepts = await generateCore({ setting: gameData.setting, tone: gameData.tone, characters: charactersForAI });

        // Step 2: Generate Factions
        await updateWorldState({ gameId: activeGameId, updates: { 'messages[0].content': generatePlaceholderMessage("designing key factions and threats") } });
        const factions = await generateFactionsAction({ ...coreConcepts, setting: gameData.setting, tone: gameData.tone, characters: charactersForAI });

        // Step 3: Generate Nodes
        await updateWorldState({ gameId: activeGameId, updates: { 'messages[0].content': generatePlaceholderMessage("building the web of story nodes") } });
        const nodes = await generateNodesAction({ ...coreConcepts, factions, setting: gameData.setting, tone: gameData.tone, characters: charactersForAI });

        const campaignStructure = {
            campaignIssues: coreConcepts.campaignIssues,
            campaignAspects: coreConcepts.campaignAspects,
            factions,
            nodes,
        };

        const updatedGameData = { ...gameData, characters: finalCharacters, campaignStructure };
        
        const startingNode = campaignStructure.nodes.find(n => n.isStartingNode) || campaignStructure.nodes[0];
        const initialScene = startingNode ? `## The Adventure Begins...\n\n### ${startingNode.title}\n\n${startingNode.description}` : "## The Adventure Begins...";

        const newHooks = `1. **Stakes:** ${startingNode.stakes}\n2. **Leads:** Explore leads to ${startingNode.leads.join(', ')}.`;

        const finalInitialMessageContent = `
# Welcome to your adventure!

## Setting
${normalizeInlineBulletsInSections(updatedGameData.setting)}

## Tone
${normalizeInlineBulletsInSections(updatedGameData.tone)}

## Initial Hooks
${normalizeOrderedList(newHooks)}

## Your Party
${characterList}

---

${initialScene}

The stage is set. What do you do?
`.trim();

        const finalInitialMessage: Message = { id: `start-${Date.now()}`, role: 'assistant', content: finalInitialMessageContent };
        
        // Replace the placeholder message with the final one
        await updateWorldState({
            gameId: activeGameId,
            updates: {
                gameData: { ...updatedGameData, initialHooks: newHooks },
                'worldState.summary': `The adventure begins with the party facing the situation at '${startingNode.title}'.`,
                'worldState.storyOutline': campaignStructure.nodes.map(n => n.title),
                'worldState.recentEvents': ["The adventure has just begun."],
                'worldState.storyAspects': campaignStructure.campaignAspects,
                'messages': [finalInitialMessage],
                'storyMessages': [{ content: finalInitialMessageContent }],
                previousWorldState: null, // Clear previous state on new campaign
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error("Failed to finalize characters and generate campaign:", err);
        toast({ variant: 'destructive', title: 'Setup Error', description: err.message || 'Could not finalize the campaign setup.' });
    } finally {
        setIsLoading(false);
    }
  };


 const handleSendMessage = async (playerInput: string, confirmed: boolean = false) => {
    if (!activeCharacter || !worldState || !activeGameId || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An active character and game state are required to proceed.",
        });
        return;
    }
    
    // Remove the temporary recap message if it exists
    const messagesWithoutRecap = messages.filter(m => m.id !== 'recap-message');
    
    const authorName = activeCharacter.playerName || (user.isAnonymous ? "Guest" : user.email?.split('@')[0]) || "Player";

    const newMessage: Message = {
      id: `${user.uid}-${Date.now()}`,
      role: 'user',
      content: playerInput,
      authorName: authorName,
    };

    const newMessages: Message[] = [...messagesWithoutRecap, newMessage ];
    setMessages(newMessages); // Optimistic update
    setIsLoading(true);

    try {
        const { intent } = await routePlayerInput({ playerInput });

        if (intent === 'Action' && !confirmed) {
            const consequenceResult = await checkConsequences({
                actionDescription: playerInput,
                worldState,
                character: {
                    ...activeCharacter,
                    stats: activeCharacter.stats || {},
                },
            });

            if (consequenceResult.needsConfirmation && consequenceResult.confirmationMessage) {
                setConfirmation({
                    message: consequenceResult.confirmationMessage,
                    onConfirm: () => {
                        setConfirmation(null);
                        handleSendMessage(playerInput, true); // Resend with confirmation
                    },
                });
                // Since we need confirmation, we stop here. Revert the optimistic message update.
                setMessages(messagesWithoutRecap);
                setIsLoading(false);
                return;
            }
        }
        
        let assistantMessage: Message;
        const characterForAI = {
          ...activeCharacter,
          stats: activeCharacter.stats || {},
        };

        if (intent === 'Action') {
            const response = await continueStory({
                actionDescription: playerInput,
                worldState,
                character: characterForAI,
                ruleAdapter: 'FateCore',
                mechanicsVisibility,
            });

            assistantMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.narrativeResult,
                mechanics: mechanicsVisibility !== 'Hidden' ? response.mechanicsDetails : undefined,
            };

            const newStoryMessages = [...storyMessages, { content: response.narrativeResult }];
            setStoryMessages(newStoryMessages);

            const currentIndex = characters.findIndex(c => c.id === activeCharacter.id);
            const nextIndex = (currentIndex + 1) % characters.length;
            const nextCharacter = characters[nextIndex];

            // Update world state in the background. Note: we are saving the *current* worldState as previousWorldState
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
            }).then(() => {
                setActiveCharacter(nextCharacter); // Set active character only after successful state update
            }).catch(err => {
                console.error("Failed to update world state:", err);
                // Non-critical, so we just log the error.
            });

        } else { // Intent is 'Question'
            const response = await getAnswerToQuestion({
                question: playerInput,
                worldState,
                character: characterForAI,
            });

            assistantMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.answer,
            };

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
        setMessages(messagesWithoutRecap); // Revert optimistic update
    } finally {
        setIsLoading(false);
    }
};


  const handleUndo = async () => {
    if (!activeGameId || !previousWorldState) {
        toast({ variant: 'destructive', title: 'Undo Failed', description: 'No previous state to restore.' });
        return;
    }
    setIsLoading(true);
    try {
        const result = await undoLastAction(activeGameId);
        if (result.success) {
            toast({ title: 'Action Undone', description: 'The game state has been rolled back.' });
            // The snapshot listener will handle the state updates automatically.
        } else {
            throw new Error(result.message || 'Failed to undo the last action.');
        }
    } catch (error) {
        const err = error as Error;
        console.error("Failed to undo:", err);
        toast({ variant: 'destructive', title: 'Undo Error', description: err.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegenerateStoryline = async () => {
    if (!activeGameId || !gameData) return;

    setIsLoading(true);
    toast({ title: 'Regenerating Storyline...', description: 'The AI is crafting a new narrative web. Please wait.' });
    
    try {
        const currentCharacters = gameData.characters || [];
        if (currentCharacters.length === 0) {
            throw new Error("Cannot regenerate storyline without characters.");
        }
        
        const charactersForAI = currentCharacters.map(c => ({
            name: c.name,
            description: c.description,
            aspect: c.aspect,
            playerName: c.playerName,
            archetype: c.archetype,
            gender: c.gender,
            age: c.age,
            stats: c.stats || {},
        }));

        const { setting, tone } = gameData;
        const characterList = currentCharacters.map(c => `- **${c.name}** (*${c.playerName}*): ${c.description}`).join('\n');

        // Step 1: Generate Core Concepts
        toast({ title: 'Regenerating Storyline...', description: 'Generating core campaign concepts...' });
        const coreConcepts = await generateCore({ setting, tone, characters: charactersForAI });

        // Step 2: Generate Factions
        toast({ title: 'Regenerating Storyline...', description: 'Designing key factions and threats...' });
        const factions = await generateFactionsAction({ ...coreConcepts, setting, tone, characters: charactersForAI });

        // Step 3: Generate Nodes
        toast({ title: 'Regenerating Storyline...', description: 'Building the web of story nodes...' });
        const nodes = await generateNodesAction({ ...coreConcepts, factions, setting, tone, characters: charactersForAI });

        const campaignStructure = {
            campaignIssues: coreConcepts.campaignIssues,
            campaignAspects: coreConcepts.campaignAspects,
            factions,
            nodes,
        };
        
        const startingNode = campaignStructure.nodes.find(n => n.isStartingNode) || campaignStructure.nodes[0];
        const initialScene = startingNode ? `## The Adventure Begins...\n\n### ${startingNode.title}\n\n${startingNode.description}` : "## The Adventure Begins...";

        // Synthesize hooks from the new structure
        const newHooks = `1. **Stakes:** ${startingNode.stakes}\n2. **Leads:** Explore leads to ${startingNode.leads.join(', ')}.`;


        const finalInitialMessageContent = `
# Welcome to your (newly regenerated) adventure!

## Setting
${setting}

## Tone
${tone}

## Initial Hooks
${newHooks}

## Your Party
${characterList}

---

${initialScene}

The stage is set. What do you do?
`.trim();

        const finalInitialMessage: Message = { id: `regen-start-${Date.now()}`, role: 'assistant', content: finalInitialMessageContent };
        
        // Update the campaign structure within gameData and reset world state and messages
        await updateWorldState({
            gameId: activeGameId,
            updates: {
                'gameData.campaignStructure': campaignStructure,
                'gameData.initialHooks': newHooks, // Save the new hooks as well
                'worldState.summary': `The adventure begins with the party facing the situation at '${startingNode.title}'.`,
                'worldState.storyOutline': campaignStructure.nodes.map(n => n.title),
                'worldState.recentEvents': ["The adventure has just begun."],
                'worldState.storyAspects': campaignStructure.campaignAspects,
                'worldState.knownPlaces': [],
                'worldState.knownFactions': [],
                'worldState.places': [], // Reset discovered places from old plot
                'messages': [finalInitialMessage],
                'storyMessages': [{ content: finalInitialMessageContent }],
                previousWorldState: null, // Clear previous state on new campaign
            }
        });

        toast({ title: 'Storyline Regenerated!', description: 'Your adventure has been reset with a new plot.' });
    } catch (error) {
        const err = error as Error;
        console.error("Failed to regenerate storyline:", err);
        toast({ variant: 'destructive', title: 'Regeneration Error', description: err.message });
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
            initialCharacters={characters}
            onCharactersFinalized={handleCharactersFinalized}
            generateCharacterSuggestions={createCharacter}
            isLoading={isLoading}
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
            onUndo={handleUndo}
            canUndo={!!previousWorldState}
            onRegenerateStoryline={handleRegenerateStoryline}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            isAutoPlayEnabled={isAutoPlayEnabled}
            isTTSSupported={supported}
            onPlay={handlePlayAll}
            onPause={pause}
            onStop={cancel}
            onSetAutoPlay={setIsAutoPlayEnabled}
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
    <>
      <AppShell
        games={games}
        activeGameId={activeGameId}
        onNewGame={() => router.push('/')}
        onSelectGame={(gameId) => router.push(`/?game=${gameId}`)}
      >
        {renderContent()}
      </AppShell>
      {confirmation && (
        <AlertDialog open onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmation.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmation(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmation.onConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
