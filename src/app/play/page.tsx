
'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  GameData,
  Message,
  MechanicsVisibility,
  Character,
  GameSession,
  PlayerSlot,
  SessionStatus,
} from '@/app/lib/types';
import {
  startNewGame,
  continueStory,
  updateWorldState,
  checkConsequences,
  undoLastAction,
  generateRecap,
  deleteGame,
  renameGame,
  updateUserProfile,
  saveCampaignStructure,
  regenerateGameConcept,
  regenerateField,
  narratePlayerActions,
  unifiedClassify,
  getAnswerToQuestion,
  updateSessionStatus,
  generateCampaignCoreAction,
  generateCampaignFactionsAction,
  generateCampaignNodesAction,
  generateCampaignResolutionAction,
} from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { createCharacter } from '@/app/actions';
import { CreateGameForm } from '@/components/create-game-form';
import { CharacterCreationForm } from '@/components/character-creation-form';
import { GameView } from '@/components/game-view';
import { useToast } from '@/hooks/use-toast';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/hooks/use-auth';
import {
  doc,
  onSnapshot,
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { BrandedLoadingSpinner, LoadingSpinner } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { cn } from '@/lib/utils';
import type { AICharacter } from "@/ai/schemas/generate-character-schemas";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ScrollText } from 'lucide-react';
import { AccountDialog } from '@/components/account-dialog';
import { getUserPreferences, type UserPreferences } from '../actions/user-preferences';
import { GenerationProgress } from '@/components/generation-progress';
import { extractProseForTTS } from '@/lib/tts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';
import type { CampaignCore, CampaignResolution, CampaignStructure, Faction, GenerateFactionsInput, GenerateNodesInput, GenerateResolutionInput, Node } from '@/ai/schemas/campaign-structure-schemas';

const MemoizedCharacterCreationForm = memo(CharacterCreationForm);

const SummaryReview = ({
    gameData,
    isLoading,
    onContinue,
    onRegenerateConcept,
    onRegenerateField,
  }: {
    gameData: GameData;
    isLoading: boolean;
    onContinue: () => void;
    onRegenerateConcept: (newRequest: string) => Promise<void>;
    onRegenerateField: (fieldName: 'setting' | 'tone') => Promise<void>;
  }) => {
    
    const [newRequest, setNewRequest] = useState(gameData.originalRequest || '');
    const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false);
    
    const handleRegenSubmit = async () => {
        await onRegenerateConcept(newRequest);
        setIsRegenDialogOpen(false);
    }
    
    return (
      <>
      <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
        <Card className="w-full max-w-4xl mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
              <ScrollText /> Story Concept
            </CardTitle>
            <CardDescription className="pt-2">
              Review the generated story concept. You can regenerate parts of it or continue to character creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
             <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
                <section className="prose prose-sm dark:prose-invert max-w-none relative group p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="mt-0">Setting</h2>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRegenerateField('setting')} disabled={isLoading}>
                        <LoadingSpinner className={cn("mr-2 h-3 w-3", isLoading ? "inline-block" : "hidden")} /> Regenerate
                    </Button>
                  </div>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {gameData.setting}
                  </ReactMarkdown>
                </section>
                <section className="prose prose-sm dark:prose-invert max-w-none relative group p-4 border rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                    <h2 className="mt-0">Tone</h2>
                     <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRegenerateField('tone')} disabled={isLoading}>
                        <LoadingSpinner className={cn("mr-2 h-3 w-3", isLoading ? "inline-block" : "hidden")} /> Regenerate
                    </Button>
                  </div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {gameData.tone}
                  </ReactMarkdown>
                </section>
             </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 justify-center pt-6">
            <Button size="lg" onClick={onContinue} disabled={isLoading} className="font-headline text-xl">
              Continue to Character Creation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => setIsRegenDialogOpen(true)} disabled={isLoading}>
                <LoadingSpinner className={cn("mr-2 h-4 w-4", isLoading ? "inline-block" : "hidden")} /> Regenerate Entire Concept
            </Button>
          </CardFooter>
        </Card>
      </div>

       <Dialog open={isRegenDialogOpen} onOpenChange={setIsRegenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate Story Concept</DialogTitle>
              <DialogDescription>
                Edit the prompt below to generate a new story concept. This will replace the current setting, tone, and plot hooks.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="regen-prompt">New Prompt</Label>
               <Textarea
                id="regen-prompt"
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                className="min-h-[100px] mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsRegenDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRegenSubmit} disabled={isLoading}>
                 <LoadingSpinner className={cn("mr-2 h-4 w-4", isLoading ? "inline-block" : "hidden")} /> Regenerate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}

export default function RoleplAIGMPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<GameSession[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [campaignStructure, setCampaignStructure] = useState<CampaignStructure | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [previousWorldState, setPreviousWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storyMessages, setStoryMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicsVisibility, setMechanicsVisibility] = useState<MechanicsVisibility>('Hidden');
  const [step, setStep] = useState<'create' | 'summary' | 'characters' | 'play' | 'loading'>('loading');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<GameSession | null>(null);
  const [renameTarget, setRenameTarget] = useState<GameSession | null>(null);
  const [newGameName, setNewGameName] = useState('');

  const [showHandoff, setShowHandoff] = useState(false);
  const [nextCharacter, setNextCharacter] = useState<Character | null>(null);

  const deletingGameId = useRef<string | null>(null);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; step: string } | null>(null);
  
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active');
  const [endCampaignConfirmation, setEndCampaignConfirmation] = useState(false);

  const { toast } = useToast();

  type TtsVol = 'low' | 'med' | 'high';
  const [ttsVolume, setTtsVolume] = useState<TtsVol>('med');
  const volumeMap: Record<TtsVol, number> = { low: 0.4, med: 0.75, high: 1.0 };
  const cycleTtsVolume = () => setTtsVolume(v => (v === 'low' ? 'med' : v === 'med' ? 'high' : 'low'));
  
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);

  const { speak, pause, resume, cancel, isSpeaking, isPaused, supported, voices, selectVoice, selectedVoice } =
    useSpeechSynthesis({
      preferredVoiceURI: userPreferences?.defaultVoiceURI,
      maxChunkLen: 220,
      volume: volumeMap[ttsVolume],
    });

  const sessionLoadedRef = useRef<string | null>(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const setTrue = () => { userInteractedRef.current = true; };
    window.addEventListener('click', setTrue, { once: true });
    window.addEventListener('touchend', setTrue, { once: true });
    window.addEventListener('keydown', setTrue, { once: true });
    return () => {
      window.removeEventListener('click', setTrue);
      window.removeEventListener('touchend', setTrue);
      window.removeEventListener('keydown', setTrue);
    };
  }, []);

  const storyAsText = useMemo(
    () => (storyMessages || []).map((m: any) => extractProseForTTS(m?.content || '')).join('\n\n'),
    [storyMessages]
  );
  
  const handlePlayAll = (text?: string, onBoundary?: (e: SpeechSynthesisEvent) => void) => {
    if (isPaused) { resume(); return; }
    if (isSpeaking) { cancel(); }
    if (!userInteractedRef.current) {
      toast({ title: 'Click to enable audio', description: 'Tap anywhere once, then press Play again.' });
      return;
    }
    
    const textToPlay = text || storyAsText;

    if (textToPlay) {
      speak({ text: textToPlay, onBoundary });
    }
  };


  useEffect(() => {
    if (!user) return;
    getUserPreferences(user.uid).then(setUserPreferences);

    const db = getFirestore();
    const q = query(collection(db, 'games'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userGames = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GameSession));
        setGames(userGames);

        const currentGameId = searchParams.get('game');
        if (!currentGameId && userGames.length > 0) {
        } else if (!currentGameId) {
          setStep('create');
        }
      },
      (error) => {
        console.error('[Firestore Listener Error]: ', error);
        toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'Could not fetch your games. Please check your connection and security rules.',
        });
      }
    );

    return () => unsubscribe();
  }, [user, searchParams, router, toast]);

  useEffect(() => {
    const gameId = searchParams.get('game');
    if (gameId && gameId !== activeGameId) {
      setActiveGameId(gameId);
    } else if (!gameId && activeGameId) {
      setActiveGameId(null);
      setGameData(null);
      setWorldState(null);
      setPreviousWorldState(null);
      setCampaignStructure(null);
      setMessages([]);
      setStoryMessages([]);
      setCharacters([]);
      setActiveCharacter(null);
      setSessionStatus('active');
      setStep('create');
    }

    return () => { if (supported) cancel(); };
  }, [searchParams, activeGameId, cancel, supported]);

  useEffect(() => {
    if (!activeGameId) {
      setStep('create');
      return;
    }

    setStep('loading');
    const db = getFirestore();
    const unsub = onSnapshot(doc(db, 'games', activeGameId), (docSnap) => {
      if (docSnap.exists()) {
        const game = docSnap.data() as GameSession;

        setGameData(game.gameData);

        setWorldState(game.worldState);
        setPreviousWorldState(game.previousWorldState || null);
        setSessionStatus(game.sessionStatus || 'active');

        const currentMessages = game.messages || [];
        setMessages(currentMessages);

        setStoryMessages(game.storyMessages || []);

        const finalCharacters: Character[] = (game.worldState?.characters || []).map((c: any) => ({
          ...c,
          playerId: c.playerId || '',
        }));
        setCharacters(finalCharacters);

        if (finalCharacters.length > 0) {
          const savedActiveCharId = (game as any).activeCharacterId;
          const restoredChar = finalCharacters.find((c) => c.id === savedActiveCharId) || finalCharacters[0];
          setActiveCharacter(restoredChar);
        }

        if (game.step === 'play') {
          if (generationProgress) setGenerationProgress(null);

          if (sessionLoadedRef.current !== activeGameId) {
            sessionLoadedRef.current = activeGameId;

            if (currentMessages.length > 1 && game.worldState?.recentEvents?.length > 1) {
              setIsLoading(true);
              generateRecap({ 
                  recentEvents: game.worldState.recentEvents,
                  storyOutline: game.worldState.storyOutline,
                  characters: game.worldState.characters,
                  factions: game.worldState.factions,
              })
                .then((recapResult) => {
                  let recapContent = `### Previously On...\n\n${recapResult.recap}`;

                  if (recapResult.characterReminders && Object.keys(recapResult.characterReminders).length > 0) {
                      recapContent += `\n\n---\n\n### Reminders for the Party\n`;
                      for (const [charName, reminder] of Object.entries(recapResult.characterReminders)) {
                          recapContent += `*   **${charName}:** ${reminder}\n`;
                      }
                  }

                  if (recapResult.urgentSituations && recapResult.urgentSituations.length > 0) {
                      recapContent += `\n\n---\n\n### Urgent Situations\n`;
                      recapResult.urgentSituations.forEach(situation => {
                          recapContent += `*   ${situation}\n`;
                      });
                  }

                  const recapMessage: Message = {
                    id: `recap-${Date.now()}`,
                    role: 'system',
                    content: recapContent,
                  };
                  setMessages((prev) => [recapMessage, ...prev]);
                })
                .catch((err) => {
                  console.error('Failed to generate recap:', err);
                  toast({ variant: 'destructive', title: 'Recap Failed', description: 'Could not generate a session recap.' });
                })
                .finally(() => setIsLoading(false));
            }
          }
        }

        setStep(game.step || 'summary');
      } else {
        if (deletingGameId.current !== activeGameId) {
          console.error('No such game!');
          toast({ variant: 'destructive', title: 'Error', description: 'Game session not found.' });
        }
        router.push('/play');
      }
    });

    const unsubCampaign = onSnapshot(doc(db, 'games', activeGameId, 'campaign', 'data'), (docSnap) => {
        if (docSnap.exists()) {
            setCampaignStructure(docSnap.data() as CampaignStructure);
        } else {
            setCampaignStructure(null);
        }
    });

    return () => {
        unsub();
        unsubCampaign();
    };
  }, [activeGameId, router, toast]);

  const handleUpdateStatus = async (status: SessionStatus) => {
    if (!activeGameId) return;
    const result = await updateSessionStatus(activeGameId, status);
    if (result.success) {
      toast({ title: `Session ${status}`, description: `The game session has been marked as ${status}.`});
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
    if (endCampaignConfirmation) setEndCampaignConfirmation(false);
  };

  const handleCharactersFinalized = useCallback(async (finalCharacters: Character[]) => {
    if (!activeGameId || !gameData) return;
  
    if (finalCharacters.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Party', description: 'You must have at least one character to start the game.' });
      return;
    }
  
    if (finalCharacters.some((c) => !c.playerName.trim())) {
      toast({ variant: 'destructive', title: 'Player Names Required', description: 'All characters must have a player name before starting.' });
      return;
    }
  
    if (gameData.playMode === 'remote' && finalCharacters.some((c) => !c.playerId)) {
      toast({ variant: 'destructive', title: 'Unclaimed Characters', description: 'All characters must be claimed by a player.' });
      return;
    }
  
    setIsLoading(true);
  
    const plainCharacters: Character[] = finalCharacters.map((c) => ({
      id: c.id, name: c.name, description: c.description, aspect: c.aspect, playerName: c.playerName, isCustom: c.isCustom,
      archetype: c.archetype, pronouns: c.pronouns, age: c.age, stats: c.stats, playerId: c.playerId,
    }));
  
    try {
      await updateDoc(doc(getFirestore(), 'games', activeGameId), {
        'gameData.characters': plainCharacters, 'worldState.characters': plainCharacters,
        activeCharacterId: finalCharacters[0].id,
      });
  
      toast({ title: 'Finalizing Party', description: 'Saving characters and building the world...' });
  
      const charactersForAI: AICharacter[] = plainCharacters.map((c) => ({
        id: c.id, name: c.name, description: c.description, aspect: c.aspect, playerName: c.playerName,
        archetype: c.archetype, pronouns: c.pronouns, age: c.age, stats: c.stats,
      }));
      
      const baseInput = { setting: gameData.setting, tone: gameData.tone, characters: charactersForAI };

      setGenerationProgress({ current: 1, total: 5, step: 'Consulting the cosmic classifications...' });
      const classification = await unifiedClassify({ setting: gameData.setting, tone: gameData.tone, gameContext: { isFirstClassification: true } });
      const settingCategory = classification.settingClassification?.category || 'generic';
  
      setGenerationProgress({ current: 2, total: 5, step: 'Considering the threads of fate...' });
      const coreConcepts = await generateCampaignCoreAction({ ...baseInput, settingCategory });
  
      setGenerationProgress({ current: 3, total: 5, step: 'Populating the world with friends and foes...' });
      const factions = await generateCampaignFactionsAction({ ...baseInput, ...coreConcepts, settingCategory });
  
      setGenerationProgress({ current: 4, total: 5, step: 'Erecting monoliths and digging dungeons...' });
      const nodes = await generateCampaignNodesAction({ ...baseInput, ...coreConcepts, factions, settingCategory });
  
      setGenerationProgress({ current: 5, total: 5, step: 'Plotting the ultimate conclusion...' });
      const resolution = await generateCampaignResolutionAction({ ...baseInput, ...coreConcepts, factions, nodes, settingCategory });
      
      const finalCampaignStructure: CampaignStructure = {
        campaignIssues: coreConcepts.campaignIssues, campaignAspects: coreConcepts.campaignAspects,
        factions, nodes, resolution,
      };
  
      const saveResult = await saveCampaignStructure(activeGameId, finalCampaignStructure);
      if (!saveResult.success) throw new Error(saveResult.message || 'Failed to save campaign structure.');
  
      const startingNode = nodes.find((n) => n.isStartingNode) || nodes[0];
      const welcomeMessageForChat: Message = { id: `start-chat-${Date.now()}`, role: 'system', content: `**Let the adventure begin!**\n\nThe story is starting. The opening scene has been added to the storyboard. What do you do?` };
      const storyboardContent = `
# Welcome to ${gameData.name}

### Setting
${gameData.setting}

### Tone
${gameData.tone}

### Difficulty
${gameData.difficulty}

---

## And So It Begins...

${startingNode ? startingNode.description : gameData.setting}
`.trim();
  
      const knownPlaces = nodes.map((n) => ({ name: n.title, description: n.description.split('.')[0] + '.' }));
      const startingPlace = knownPlaces.find((p) => p.name === startingNode.title)!;
      const initialNodeStates: Record<string, any> = {};
      nodes.forEach(node => {
        initialNodeStates[node.id] = { discoveryLevel: node.isStartingNode ? 'visited' : 'unknown', playerKnowledge: [], revealedSecrets: [] };
      });
  
      await updateWorldState({
        gameId: activeGameId,
        updates: {
          messages: [welcomeMessageForChat], storyMessages: [{ content: storyboardContent }],
          'worldState.summary': `The adventure begins with the party facing the situation at '${startingNode.title}'.`,
          'worldState.storyOutline': nodes.map((n) => n.title), 'worldState.recentEvents': ['The adventure has just begun.'],
          'worldState.storyAspects': coreConcepts.campaignAspects, 'worldState.places': knownPlaces,
          'worldState.knownPlaces': [startingPlace], 'worldState.knownFactions': [],
          'worldState.nodeStates': initialNodeStates, 'worldState.resolution': resolution,
          'worldState.factions': factions, 'worldState.settingCategory': settingCategory,
          previousWorldState: null, step: 'play',
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('Failed to finalize characters and generate campaign:', err);
      toast({ variant: 'destructive', title: 'Setup Error', description: err.message || 'Could not finalize the campaign setup.' });
    } finally {
      setGenerationProgress(null);
      setIsLoading(false);
      setStep('play');
    }
  }, [activeGameId, gameData, toast]);

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
      } else {
        throw new Error(result.message || 'Failed to undo the last action.');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Failed to undo:', err);
      toast({ variant: 'destructive', title: 'Undo Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="w-48 h-48" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading Session...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleCreateGame = async (request: string, playMode: 'local' | 'remote') => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a game.' });
      return;
    }

    setIsLoading(true);
    try {
      const { gameId, newGame, warningMessage } = await startNewGame({ request, userId: user.uid, playMode });

      if (warningMessage) {
        toast({ title: 'Request Modified', description: warningMessage, duration: 6000 });
      }

      router.push(`/play?game=${gameId}`);
      setActiveGameId(gameId);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to start new game:', err);
      toast({ variant: 'destructive', title: 'Failed to Start Game', description: err.message || 'An unknown error occurred.' });
      setStep('create');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (playerInput: string, confirmed: boolean = false) => {
    if (!worldState || !activeGameId || !user || !campaignStructure) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'A character and game state are required to proceed.',
      });
      return;
    }
  
    const messagesWithoutRecap = messages.filter((m) => m.id && !m.id.startsWith('recap-'));
  
    const actingCharacter = gameData?.playMode === 'remote'
      ? characters.find(c => c.playerId === user.uid)
      : activeCharacter;

    if (!actingCharacter) {
      toast({
        variant: 'destructive',
        title: 'No Character',
        description: "You don't have a character in this game to act with.",
      });
      return;
    }
    
    const authorName = actingCharacter.playerName || (user.isAnonymous ? 'Guest' : user.email?.split('@')[0]) || 'Player';

    const newUserMessage: Message = {
      id: `${user.uid}-${Date.now()}`,
      role: 'user',
      content: playerInput,
      authorName,
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
  
    try {
      const { intentClassification } = await unifiedClassify({ playerInput });
      
      const newMessages = [...messagesWithoutRecap, newUserMessage];
  
      if (intentClassification?.intent === 'Action') {
        if (activeCharacter?.id !== actingCharacter.id && gameData?.playMode === 'remote') {
            toast({ variant: 'destructive', title: 'Not Your Turn', description: `It's currently ${activeCharacter?.name}'s turn to act.` });
            setMessages(messagesWithoutRecap);
            setIsLoading(false);
            return;
        }

        if (!activeCharacter) {
            toast({ variant: 'destructive', title: 'Error', description: 'No active character set to perform an action.' });
            setIsLoading(false);
            setMessages(messagesWithoutRecap);
            return;
        }

        if (sessionStatus !== 'active') {
          toast({ variant: 'destructive', title: 'Session Paused', description: 'Please resume the session to perform actions.' });
          setMessages(messagesWithoutRecap);
          setIsLoading(false);
          return;
        }

        if (!confirmed) {
            const consequenceResult = await checkConsequences({
                actionDescription: playerInput,
                worldState,
                character: {
                    ...activeCharacter,
                    stats: activeCharacter.stats || { skills: [], stunts: [] },
                    id: activeCharacter.id || '',
                },
            });

            if (consequenceResult.needsConfirmation && consequenceResult.confirmationMessage) {
                setConfirmation({
                    message: consequenceResult.confirmationMessage,
                    onConfirm: () => {
                        setConfirmation(null);
                        handleSendMessage(playerInput, true);
                    },
                });
                setMessages(messagesWithoutRecap);
                setIsLoading(false);
                return;
            }
        }
        
        const acknowledgement = await narratePlayerActions({
            playerAction: playerInput,
            gameState: worldState.summary,
            character: activeCharacter,
        });

        const acknowledgementMessage: Message = {
            id: `assistant-ack-${Date.now()}`,
            role: 'assistant',
            content: acknowledgement.narration,
        };
        
        const finalChatMessages = [...newMessages, acknowledgementMessage];

        const storyResponse = await continueStory({
            actionDescription: playerInput,
            characterId: actingCharacter.id,
            worldState,
            ruleAdapter: "FateCore",
            mechanicsVisibility: mechanicsVisibility,
            settingCategory: worldState.settingCategory || 'generic',
        });

        const newStoryMessages = [...storyMessages, { content: storyResponse.narrativeResult }];
  
        const currentIndex = characters.findIndex((c) => c.id === activeCharacter.id);
        const nextIndex = (currentIndex + 1) % characters.length;
        const foundNextCharacter = characters[nextIndex];
        setNextCharacter(foundNextCharacter);
  
        const serializableWorldState = JSON.parse(JSON.stringify(worldState));
        
        const worldUpdatePayload = {
            gameId: activeGameId,
            playerAction: { characterName: activeCharacter.name, action: playerInput },
            gmResponse: storyResponse.narrativeResult,
            currentWorldState: serializableWorldState,
            campaignStructure: campaignStructure,
            updates: {
                messages: finalChatMessages,
                storyMessages: newStoryMessages,
                activeCharacterId: gameData?.playMode === 'remote' ? foundNextCharacter.id : activeCharacter.id,
            },
        };
        
        await updateWorldState(worldUpdatePayload);

        if (gameData?.playMode === 'local') {
          setShowHandoff(true);
        } else {
          setActiveCharacter(foundNextCharacter);
        }
  
      } else {
        // QUESTION intent
        const response = await getAnswerToQuestion({
          question: playerInput,
          worldState,
          character: actingCharacter,
          settingCategory: worldState.settingCategory || 'generic',
        });
  
        const assistantMessage: Message = {
          id: `assistant-ans-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
        };
  
        await updateWorldState({
          gameId: activeGameId,
          updates: {
            messages: [...newMessages, assistantMessage],
          },
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Failed to process input:", err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unknown error occurred.',
      });
      setMessages(messagesWithoutRecap);
    } finally {
        setIsLoading(false);
    }
  };

  const handleHandoffConfirm = async () => {
    if (!activeGameId || !nextCharacter || !worldState) return;

    setShowHandoff(false);

    await updateWorldState({
      gameId: activeGameId,
      updates: { activeCharacterId: nextCharacter.id },
    });

    setActiveCharacter(nextCharacter);
    setNextCharacter(null);
  };

  const onRegenerateStoryline = async () => {
    if (!activeGameId || !gameData) return;

    setIsLoading(true);
    toast({ title: 'Regenerating Storyline...', description: 'The AI is crafting a new narrative web. Please wait.' });

    try {
      const currentCharacters = gameData.characters || [];
      if (currentCharacters.length === 0) throw new Error('Cannot regenerate storyline without characters.');

      const charactersForAI: AICharacter[] = currentCharacters.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        aspect: c.aspect,
        playerName: c.playerName,
        archetype: c.archetype,
        pronouns: c.pronouns,
        age: c.age,
        stats: c.stats,
      }));

      const baseInput = {
        setting: gameData.setting,
        tone: gameData.tone,
        characters: charactersForAI,
      };

      setGenerationProgress({ current: 1, total: 5, step: 'Consulting the cosmic classifications...' });
      const classification = await unifiedClassify({ setting: gameData.setting, tone: gameData.tone, gameContext: { isFirstClassification: true } });
      const settingCategory = classification.settingClassification?.category || 'generic';

      setGenerationProgress({ current: 2, total: 5, step: 'Considering the threads of fate...' });
      const coreConcepts = await generateCampaignCoreAction({ ...baseInput, settingCategory });

      setGenerationProgress({ current: 3, total: 5, step: 'Populating the world with friends and foes...' });
      const factions = await generateCampaignFactionsAction({ ...baseInput, ...coreConcepts, settingCategory });

      setGenerationProgress({ current: 4, total: 5, step: 'Erecting monoliths and digging dungeons...' });
      const nodes = await generateCampaignNodesAction({ ...baseInput, ...coreConcepts, factions, settingCategory });

      setGenerationProgress({ current: 5, total: 5, step: 'Plotting the ultimate conclusion...' });
      const resolution = await generateCampaignResolutionAction({ ...baseInput, ...coreConcepts, factions, nodes, settingCategory });
        
      const newCampaignStructure: CampaignStructure = {
        campaignIssues: coreConcepts.campaignIssues,
        campaignAspects: coreConcepts.campaignAspects,
        factions,
        nodes,
        resolution,
      };

      const saveResult = await saveCampaignStructure(activeGameId, newCampaignStructure);
      if (!saveResult.success) throw new Error(saveResult.message || 'Failed to save campaign structure.');

      const startingNode = newCampaignStructure.nodes.find((n) => n.isStartingNode) || newCampaignStructure.nodes[0];
      
      const welcomeMessageForChat: Message = { 
        id: `start-chat-regen-${Date.now()}`, 
        role: 'system', 
        content: `**The world has been reshaped!**\n\nThe story has been regenerated. The new opening scene is on the storyboard. What do you do?`
      };

      const storyboardContent = `
# Welcome to your (newly regenerated) adventure!

## Setting
${gameData.setting}

## Tone
${gameData.tone}

---

${startingNode.description}

The stage is set. What do you do?
`.trim();

    const initialNodeStates: Record<string, { discoveryLevel: string; playerKnowledge: string[]; revealedSecrets: string[]; currentState?: string; }> = {};
    newCampaignStructure.nodes.forEach(node => {
        initialNodeStates[node.id] = {
        discoveryLevel: node.isStartingNode ? 'visited' : 'unknown',
        playerKnowledge: [],
        revealedSecrets: [],
        };
    });

      await updateWorldState({
        gameId: activeGameId,
        updates: {
          'worldState.summary': `The adventure begins with the party facing the situation at '${startingNode.title}'.`,
          'worldState.storyOutline': newCampaignStructure.nodes.map((n) => n.title),
          'worldState.recentEvents': ['The adventure has just begun.'],
          'worldState.storyAspects': newCampaignStructure.campaignAspects,
          'worldState.nodeStates': initialNodeStates,
          'worldState.settingCategory': settingCategory,
          messages: [welcomeMessageForChat],
          storyMessages: [{ content: storyboardContent }],
          previousWorldState: null,
        },
      });

      toast({ title: 'Storyline Regenerated!', description: 'Your adventure has been reset with a new plot.' });
    } catch (error) {
      const err = error as Error;
      console.error('Failed to regenerate storyline:', err);
      toast({ variant: 'destructive', title: 'Regeneration Error', description: err.message });
    } finally {
      setGenerationProgress(null);
      setIsLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!deleteConfirmation) return;

    const gameIdToDelete = deleteConfirmation.id;
    deletingGameId.current = gameIdToDelete;
    setDeleteConfirmation(null);
    router.push('/play');

    const result = await deleteGame(gameIdToDelete);
    if (result.success) {
      toast({ title: 'Game Deleted', description: 'The game session has been successfully deleted.' });
    } else {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: result.message });
    }
    deletingGameId.current = null;
  };

  const handleRenameGame = async () => {
    if (!renameTarget || !newGameName.trim()) return;

    const gameIdToRename = renameTarget.id;
    setRenameTarget(null);

    const result = await renameGame(gameIdToRename, newGameName);
    if (result.success) {
      toast({ title: 'Game Renamed', description: 'The game session has been successfully renamed.' });
    } else {
      toast({ variant: 'destructive', title: 'Rename Failed', description: result.message });
    }
    setNewGameName('');
  };

  const handleLocalCharacterSwitch = (char: Character) => {
    if (activeGameId) {
      setActiveCharacter(char);
      updateWorldState({ gameId: activeGameId, updates: { activeCharacterId: char.id } });
    }
  };

  const handleProfileUpdate = async (updates: { displayName: string; defaultPronouns: string; defaultVoiceURI?: string; }) => {
    if (!user) return;
    const result = await updateUserProfile(user.uid, user.isAnonymous, updates);
    if (result.success) {
      toast({ title: 'Profile Updated', description: 'Your preferences have been saved.' });
      setIsAccountDialogOpen(false);
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
  };
  
  const handleRegenerateConcept = async (newRequest: string) => {
    if (!activeGameId) return;
    setIsLoading(true);
    const result = await regenerateGameConcept(activeGameId, newRequest);
    if (result.success) {
      toast({ title: 'Story Regenerated', description: 'The campaign concept has been updated.' });
      if (result.warningMessage) {
        toast({ title: 'Request Modified', description: result.warningMessage, duration: 6000 });
      }
    } else {
      toast({ variant: 'destructive', title: 'Regeneration Failed', description: result.message });
    }
    setIsLoading(false);
  }

  const handleRegenerateField = async (fieldName: 'setting' | 'tone') => {
    if (!activeGameId || !gameData) return;
    setIsLoading(true);
    const result = await regenerateField(activeGameId, {
      request: gameData.originalRequest || gameData.name,
      fieldName,
      currentValue: gameData[fieldName],
    });
    if (result.success) {
      toast({ title: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} Regenerated`, description: `The ${fieldName} has been updated.` });
    } else {
      toast({ variant: 'destructive', title: 'Regeneration Failed', description: result.message });
    }
    setIsLoading(false);
  };


  const renderContent = () => {
    if (generationProgress) {
        return (
          <div className="flex h-full w-full items-center justify-center p-4">
            <GenerationProgress current={generationProgress.current} total={generationProgress.total} step={generationProgress.step} />
          </div>
        );
    }
    
    switch (step) {
      case 'create':
        return <CreateGameForm onSubmit={handleCreateGame} isLoading={isLoading} />;
      case 'summary':
        if (!gameData) {
            return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
        }
        return (
          <SummaryReview
            gameData={gameData}
            isLoading={isLoading}
            onContinue={async () => {
              if (activeGameId) {
                await updateWorldState({ gameId: activeGameId, updates: { step: 'characters' } });
              }
            }}
            onRegenerateConcept={handleRegenerateConcept}
            onRegenerateField={handleRegenerateField}
          />
        );
      case 'characters':
        if (!gameData) {
            return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
        }
        return (
          <MemoizedCharacterCreationForm
            gameData={gameData!}
            initialCharacters={characters}
            onCharactersFinalized={handleCharactersFinalized}
            generateCharacterSuggestions={createCharacter}
            isLoading={isLoading}
            currentUser={user}
            activeGameId={activeGameId}
            userPreferences={userPreferences}
          />
        );
      case 'play':
         if (generationProgress) {
            return (
              <div className="flex h-full w-full items-center justify-center p-4">
                <GenerationProgress current={generationProgress.current} total={generationProgress.total} step={generationProgress.step} />
              </div>
            );
        }
        return (
          <GameView
            messages={messages}
            storyMessages={storyMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            gameData={gameData!}
            worldState={worldState}
            campaignStructure={campaignStructure}
            characters={characters}
            activeCharacter={activeCharacter}
            setActiveCharacter={handleLocalCharacterSwitch}
            mechanicsVisibility={mechanicsVisibility}
            setMechanicsVisibility={setMechanicsVisibility}
            onUndo={handleUndo}
            canUndo={!!previousWorldState}
            onRegenerateStoryline={onRegenerateStoryline}
            currentUser={user}
            sessionStatus={sessionStatus}
            onUpdateStatus={handleUpdateStatus}
            onConfirmEndCampaign={() => setEndCampaignConfirmation(true)}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            isAutoPlayEnabled={isAutoPlayEnabled}
            isTTSSupported={supported}
            onPlay={handlePlayAll}
            onPause={pause}
            onStop={cancel}
            onSetAutoPlay={setIsAutoPlayEnabled}
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={selectVoice}
            ttsVolume={ttsVolume}
            onCycleTtsVolume={cycleTtsVolume}
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
        onNewGame={() => router.push('/play')}
        onSelectGame={(gameId) => router.push(`/play?game=${gameId}`)}
        onDeleteGame={(game) => setDeleteConfirmation(game)}
        onRenameGame={(game) => {
          setRenameTarget(game);
          setNewGameName(game.gameData.name);
        }}
        onOpenAccount={() => setIsAccountDialogOpen(true)}
      >
        {renderContent()}
      </AppShell>

      {showHandoff && nextCharacter && (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[425px] text-center p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-center">Turn Complete!</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p>
                Pass the device to <strong className="text-primary">{nextCharacter.playerName}</strong>.
              </p>
              <p className="text-muted-foreground">You are playing as {nextCharacter.name}.</p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button type="button" size="lg" onClick={handleHandoffConfirm}>
                Start {nextCharacter.playerName}'s Turn <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmation && (
        <AlertDialog open onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>{confirmation.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmation(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmation.onConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {deleteConfirmation && (
        <AlertDialog open onOpenChange={() => setDeleteConfirmation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Game?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete the game "{deleteConfirmation.gameData.name}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGame}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {renameTarget && (
        <Dialog open onOpenChange={() => setRenameTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Game</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="game-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="game-name"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleRenameGame}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {endCampaignConfirmation && (
        <AlertDialog open onOpenChange={setEndCampaignConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this Campaign?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the campaign as 'finished', and it will eventually be archived. You won't be able to play it anymore. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleUpdateStatus('finished')}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Yes, End Campaign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {user && (
        <AccountDialog
          isOpen={isAccountDialogOpen}
          onOpenChange={setIsAccountDialogOpen}
          user={user}
          preferences={userPreferences}
          onProfileUpdate={handleProfileUpdate}
          voices={voices}
          currentVoiceURI={selectedVoice?.voiceURI}
          onSelectVoice={selectVoice}
        />
      )}
    </>
  );
}
