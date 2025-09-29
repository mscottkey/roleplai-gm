
'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  Message,
  MechanicsVisibility,
  Character,
  GameSession,
  Player,
  SessionStatus,
} from '@/app/lib/types';
import {
  startNewGame,
  continueStory,
  updateWorldState,
  undoLastAction,
  generateRecap,
  deleteGame,
  renameGame,
  updateUserProfile,
  saveCampaignStructure,
  regenerateField,
  narratePlayerActions,
  getAnswerToQuestion,
  endCurrentSessionAction,
  startNextSessionAction,
  kickPlayerAction,
  checkConsequences,
  generateCampaignCoreAction,
  generateCampaignFactionsAction,
  generateCampaignNodesAction,
  generateCampaignResolutionAction,
  createCharacter,
  classifyInput,
  classifySetting,
  updateSessionStatus,
  generateSessionBeatsAction,
} from '@/app/actions';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
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
  arrayUnion,
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
import type { GenerateCharacterInput, GenerateCharacterOutput } from "@/ai/schemas/generate-character-schemas";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, ScrollText, Play, Wand2, PartyPopper } from 'lucide-react';
import { AccountDialog } from '@/components/account-dialog';
import { getUserPreferences, type UserPreferences } from '../actions/user-preferences';
import { GenerationProgress } from '@/components/generation-progress';
import { extractProseForTTS } from '@/lib/tts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CampaignCore, Faction, Node, CampaignResolution, CampaignStructure, StoryBeat } from '@/ai/schemas/world-state-schemas';
import * as gtag from '@/lib/gtag';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ClassifySettingOutput } from '@/ai/schemas/classify-schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SETTING_CATEGORIES } from '@/lib/setting-examples';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';


const MemoizedCharacterCreationForm = memo(CharacterCreationForm);

const SummaryReview = ({
    gameData,
    classification,
    isLoading,
    onContinue,
    onRegenerateField,
    onUpdateCategory,
    allCategories,
  }: {
    gameData: GameSession['gameData'];
    classification: ClassifySettingOutput | null;
    isLoading: boolean;
    onContinue: () => void;
    onRegenerateField: (fieldName: 'setting' | 'tone') => Promise<void>;
    onUpdateCategory: (newCategory: string) => Promise<void>;
    allCategories: string[];
  }) => {
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(classification?.category || '');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (classification) {
            setSelectedCategory(classification.category);
        }
    }, [classification]);

    const handleUpdateCategory = async () => {
        setIsUpdating(true);
        try {
            await onUpdateCategory(selectedCategory);
        } finally {
            setIsUpdating(false);
        }
    }

    const handleRegenField = async (fieldName: 'setting' | 'tone') => {
        setIsSubmitting(true);
        try {
            await onRegenerateField(fieldName);
        } finally {
            setIsSubmitting(false);
        }
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
             {classification && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 font-sans">
                            <Bot className="h-5 w-5" /> AI Genre Classification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Selected Genre:</span>
                            <Badge variant="secondary" className="capitalize">{classification.category.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Confidence:</span>
                            <Badge variant={classification.confidence > 0.8 ? 'default' : 'destructive'}>
                                {Math.round(classification.confidence * 100)}%
                            </Badge>
                        </div>
                         <p><span className="font-semibold">Reasoning:</span> <em className="text-muted-foreground">"{classification.reasoning}"</em></p>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-4 items-start pt-6">
                        <div className="w-full sm:w-auto flex-1 space-y-2">
                            <Label htmlFor="category-override">Re-classify Genre</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category-override">
                                    <SelectValue placeholder="Select a genre..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="capitalize">
                                            {cat.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleUpdateCategory} disabled={isUpdating || selectedCategory === classification?.category} className="w-full sm:w-auto self-end">
                            {isUpdating && <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />}
                            Update Category
                        </Button>
                    </CardFooter>
                </Card>
             )}
             <Separator />
             <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
                <section className="prose prose-sm dark:prose-invert max-w-none relative group p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="mt-0">Setting</h2>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRegenField('setting')} disabled={isLoading || isSubmitting}>
                        <LoadingSpinner className={cn("mr-2 h-3 w-3", isSubmitting ? "inline-block animate-spin" : "hidden")} /> Regenerate
                    </Button>
                  </div>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {gameData.setting}
                  </ReactMarkdown>
                </section>
                <section className="prose prose-sm dark:prose-invert max-w-none relative group p-4 border rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                    <h2 className="mt-0">Tone</h2>
                     <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRegenField('tone')} disabled={isLoading || isSubmitting}>
                        <LoadingSpinner className={cn("mr-2 h-3 w-3", isSubmitting ? "inline-block animate-spin" : "hidden")} /> Regenerate
                    </Button>
                  </div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {gameData.tone}
                  </ReactMarkdown>
                </section>
             </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 justify-center pt-6">
            <Button size="lg" onClick={onContinue} disabled={isLoading || isSubmitting} className="font-headline text-xl">
              Continue to Character Creation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      </>
    );
}

export default function RoleplAIGMPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<GameSession[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  const [gameData, setGameData] = useState<GameSession['gameData'] | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [campaignStructure, setCampaignStructure] = useState<CampaignStructure | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [previousWorldState, setPreviousWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storyMessages, setStoryMessages] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
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
  const [lastClassification, setLastClassification] = useState<ClassifySettingOutput | null>(null);

  const deletingGameId = useRef<string | null>(null);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null | undefined>(undefined);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; step: string } | null>(null);
  
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active');
  const [endCampaignConfirmation, setEndCampaignConfirmation] = useState(false);
  const [sessionEnding, setSessionEnding] = useState(false);

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

  const handleCreateGame = async (request: string, playMode: 'local' | 'remote', source: 'manual' | 'genre') => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to create a game.' });
      return;
    }
    setIsLoading(true);
    try {
      gtag.event({
        action: 'create_game',
        category: 'game_creation',
        label: source,
      });
      const { gameId, warningMessage } = await startNewGame({ request, userId: user.uid, playMode });
      if (warningMessage) {
          toast({
              title: 'A note from the GM',
              description: warningMessage,
              duration: 7000,
          });
      }
      router.push(`/play?game=${gameId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Game Creation Failed', description: err.message });
      setIsLoading(false);
    }
    // isLoading will be reset by the page transition
  };

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
      setHostId(null);
      setWorldState(null);
      setPreviousWorldState(null);
      setCampaignStructure(null);
      setMessages([]);
      setStoryMessages([]);
      setCharacters([]);
      setActiveCharacter(null);
      setSessionStatus('active');
      setPlayers([]);
      setStep('create');
    }

    return () => { if (supported) cancel(); };
  }, [searchParams, activeGameId, cancel, supported]);

  useEffect(() => {
    if (step !== 'play' || sessionStatus !== 'active' || !worldState?.autoEndEnabled || !worldState?.lastActivity) {
      return;
    }
  
    const checkIdle = async () => {
      if (!worldState?.lastActivity) return;
      const lastActivityDate = new Date(worldState.lastActivity!);
      const minutesSince = differenceInMinutes(new Date(), lastActivityDate);
      const timeoutMinutes = worldState.idleTimeoutMinutes || 120;
      const warningThreshold = timeoutMinutes - 30;
  
      if (minutesSince >= warningThreshold && minutesSince < timeoutMinutes && !worldState.idleWarningShown) {
        toast({
          title: 'Session Idle Warning',
          description: `This session will automatically pause in about ${Math.round(timeoutMinutes - minutesSince)} minutes due to inactivity. Take an action to keep it alive.`,
          duration: 60000,
        });
        if (activeGameId && user) {
          await updateWorldState({gameId: activeGameId, userId: user.uid, updates: {
            'worldState.idleWarningShown': true
          }});
        }
      }
    };
  
    const interval = setInterval(checkIdle, 5 * 60 * 1000); 
    checkIdle();
  
    return () => clearInterval(interval);
  }, [step, sessionStatus, worldState, activeGameId, toast, user]);

  useEffect(() => {
    if (!activeGameId) {
      setStep('create');
      return;
    }

    setStep('loading');
    const db = getFirestore();
    
    const unsubGame = onSnapshot(doc(db, 'games', activeGameId), (docSnap) => {
      if (docSnap.exists()) {
        const game = docSnap.data() as GameSession;

        setGameData(game.gameData);
        setHostId(game.userId);

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
            let shouldShowRecap = game.worldState.sessionProgress && game.worldState.sessionProgress.currentSession > 1 && game.worldState.sessionProgress.currentBeat === 0;
            if (shouldShowRecap && user && game.worldState.recentEvents.length > 1) {
              setIsLoading(true);
              generateRecap({
                recentEvents: game.worldState.recentEvents,
                storyOutline: game.worldState.storyOutline,
                characters: game.worldState.characters,
                factions: game.worldState.factions || undefined
              }, activeGameId, user.uid).then(recapOutput => {
                const recapMessage: Message = {
                  id: `recap-${Date.now()}`,
                  role: 'system',
                  content: `**Previously On:**\n\n${recapOutput.recap}\n\n**Urgent Situations:**\n${recapOutput.urgentSituations.map(s => `- ${s}`).join('\n')}`
                };
                setMessages(prev => [...prev, recapMessage]);
              }).catch(err => {
                console.error("Failed to generate recap:", err);
              }).finally(() => setIsLoading(false));
            }
          }
        }
        
        if (game.step === 'summary' && user && gameData?.originalRequest !== game.gameData.originalRequest) {
          if (!lastClassification || lastClassification.reasoning.includes('fallback')) {
             classifySetting({
                setting: game.gameData.setting,
                tone: game.gameData.tone,
                originalRequest: game.gameData.originalRequest,
              }, user.uid, activeGameId).then(classification => {
                setLastClassification(classification);
                if (game.worldState.settingCategory !== classification.category) {
                    updateWorldState({
                        gameId: activeGameId,
                        userId: user.uid,
                        updates: { 'worldState.settingCategory': classification.category }
                    });
                }
            });
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

    const unsubPlayers = onSnapshot(collection(db, 'games', activeGameId, 'players'), (snapshot) => {
        const playersData = snapshot.docs.map(doc => doc.data() as Player);
        setPlayers(playersData);
    });

    return () => {
        unsubGame();
        unsubCampaign();
        unsubPlayers();
    };
  }, [activeGameId, router, toast]);

  const onRegenerateStoryline = useCallback(async () => {
    if (!activeGameId || !gameData || !worldState || !user) return;
  
    setIsLoading(true);
    toast({ title: 'Regenerating Storyline...', description: 'The AI is crafting a new narrative web. Please wait.' });
  
    try {
      const currentCharacters = worldState.characters || [];
      if (currentCharacters.length === 0) throw new Error('Cannot regenerate storyline without characters.');
  
      setGenerationProgress({ current: 1, total: 5, step: 'Generating Core Concepts...' });
      const campaignCore = await generateCampaignCoreAction({
          setting: gameData.setting,
          tone: gameData.tone,
          characters: currentCharacters,
          settingCategory: worldState.settingCategory || 'generic',
      }, activeGameId, user.uid);

      setGenerationProgress({ current: 2, total: 5, step: 'Designing Factions...' });
      const factions = await generateCampaignFactionsAction({
          ...campaignCore,
          setting: gameData.setting,
          tone: gameData.tone,
          characters: currentCharacters,
          settingCategory: worldState.settingCategory || 'generic',
      }, activeGameId, user.uid);

      setGenerationProgress({ current: 3, total: 5, step: 'Building Situation Nodes...' });
      const nodes = await generateCampaignNodesAction({
          ...campaignCore,
          factions,
          setting: gameData.setting,
          tone: gameData.tone,
          characters: currentCharacters,
          settingCategory: worldState.settingCategory || 'generic',
      }, activeGameId, user.uid);

      setGenerationProgress({ current: 4, total: 5, step: 'Creating Endgame...' });
      const resolution = await generateCampaignResolutionAction({
          ...campaignCore,
          factions,
          nodes,
          setting: gameData.setting,
          tone: gameData.tone,
          characters: currentCharacters,
          settingCategory: worldState.settingCategory || 'generic',
      }, activeGameId, user.uid);

      const completeCampaignStructure: CampaignStructure = {
          ...campaignCore,
          factions,
          nodes,
          resolution,
      };

      setGenerationProgress({ current: 5, total: 5, step: 'Finalizing World...' });
      await saveCampaignStructure(activeGameId, completeCampaignStructure);

      const startingNode = nodes.find(n => n.isStartingNode);
      const welcomeMessageText = `**The stage is set!**\n\nYour adventure begins.\n\n${startingNode ? startingNode.description : 'A new story unfolds before you.'}`;
      const welcomeStoryMessage = { content: welcomeMessageText };
      
      const newSystemMessage = { id: `start-play-${Date.now()}`, role: 'system' as const, content: `The world has been rebuilt. A new story can now begin.` };

      await updateWorldState({
          gameId: activeGameId,
          userId: user.uid,
          updates: {
              'gameData.campaignGenerated': true,
              messages: [...messages, newSystemMessage],
              storyMessages: [welcomeStoryMessage],
              'worldState.currentScene.nodeId': startingNode?.id || 'unknown',
              'worldState.currentScene.name': startingNode?.title || 'Starting Point',
              'worldState.currentScene.description': startingNode?.description || 'The scene is not yet described.',
              'worldState.recentEvents': ["The adventure has just begun, anew."],
              'worldState.turn': 0,
          }
      });

      toast({ title: 'Storyline Regenerated!', description: 'Your new campaign is ready to play.' });

    } catch (error) {
      const err = error as Error;
      console.error('Failed to regenerate storyline:', err);
      toast({ variant: 'destructive', title: 'Regeneration Error', description: err.message });
    } finally {
      setGenerationProgress(null);
      setIsLoading(false);
    }
  }, [activeGameId, gameData, worldState, user, toast, messages]);

  const handleCharactersFinalized = useCallback(async (finalCharacters: Character[]) => {
    if (!activeGameId || !gameData || !worldState || !user) return;

    if (finalCharacters.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Party', description: 'You must have at least one character to start the game.' });
      return;
    }
    if (finalCharacters.some(c => !c.playerName.trim())) {
      toast({ variant: 'destructive', title: 'Player Names Required', description: 'All characters must have a player name before starting.' });
      return;
    }
    if (gameData.playMode === 'remote' && finalCharacters.some(c => !c.playerId)) {
      toast({ variant: 'destructive', title: 'Unclaimed Characters', description: 'All characters must be claimed by a player.' });
      return;
    }

    setIsLoading(true);

    try {
        setGenerationProgress({ current: 1, total: 5, step: 'Generating Core Concepts...' });
        const campaignCore = await generateCampaignCoreAction({
            setting: gameData.setting,
            tone: gameData.tone,
            characters: finalCharacters,
            settingCategory: worldState.settingCategory || 'generic',
        }, activeGameId, user.uid);

        setGenerationProgress({ current: 2, total: 5, step: 'Designing Factions...' });
        const factions = await generateCampaignFactionsAction({
            ...campaignCore,
            setting: gameData.setting,
            tone: gameData.tone,
            characters: finalCharacters,
            settingCategory: worldState.settingCategory || 'generic',
        }, activeGameId, user.uid);

        setGenerationProgress({ current: 3, total: 5, step: 'Building Situation Nodes...' });
        const nodes = await generateCampaignNodesAction({
            ...campaignCore,
            factions,
            setting: gameData.setting,
            tone: gameData.tone,
            characters: finalCharacters,
            settingCategory: worldState.settingCategory || 'generic',
        }, activeGameId, user.uid);

        setGenerationProgress({ current: 4, total: 5, step: 'Creating Endgame...' });
        const resolution = await generateCampaignResolutionAction({
            ...campaignCore,
            factions,
            nodes,
            setting: gameData.setting,
            tone: gameData.tone,
            characters: finalCharacters,
            settingCategory: worldState.settingCategory || 'generic',
        }, activeGameId, user.uid);

        const completeCampaignStructure: CampaignStructure = {
            ...campaignCore,
            factions,
            nodes,
            resolution,
        };

        setGenerationProgress({ current: 5, total: 5, step: 'Finalizing World...' });
        await saveCampaignStructure(activeGameId, completeCampaignStructure);

        const startingNode = nodes.find(n => n.isStartingNode);
        const welcomeMessageText = `**The stage is set!**\n\nYour adventure begins.\n\n${startingNode ? startingNode.description : 'A new story unfolds before you.'}`;
        const welcomeStoryMessage = { content: welcomeMessageText };
        
        const newSystemMessage = { id: `start-play-${Date.now()}`, role: 'system' as const, content: `The world has been built. The story can now begin.` };

        await updateWorldState({
            gameId: activeGameId,
            userId: user.uid,
            updates: {
                step: 'play',
                'gameData.campaignGenerated': true,
                'worldState.characters': finalCharacters,
                messages: [...messages, newSystemMessage],
                storyMessages: [welcomeStoryMessage],
                'worldState.currentScene.nodeId': startingNode?.id || 'unknown',
                'worldState.currentScene.name': startingNode?.title || 'Starting Point',
                'worldState.currentScene.description': startingNode?.description || 'The scene is not yet described.',
            }
        });

        toast({ title: 'World Built!', description: 'Your campaign is ready to play.' });

    } catch (error) {
      const err = error as Error;
      const currentStep = generationProgress?.step || 'an unknown step';
      console.error(`Failed during world generation at step: ${currentStep}`, err);
      toast({ variant: 'destructive', title: `World Generation Failed`, description: `The process failed at: "${currentStep}". Error: ${err.message}`, duration: 10000 });
    } finally {
      setGenerationProgress(null);
      setIsLoading(false);
    }
  }, [activeGameId, gameData, worldState, user, toast, generationProgress, messages]);

  const handleGenerateCharacters = (input: GenerateCharacterInput) => {
    if (!activeGameId || !user) {
        toast({ variant: "destructive", title: "Error", description: "You must be in a game to generate characters." });
        return Promise.reject(new Error("Not in a game"));
    }
    gtag.event({ action: 'generate_characters', category: 'game_setup' });
    return createCharacter(input, activeGameId, user.uid);
  };
  
  const handleUndo = useCallback(async () => {
    if (!activeGameId || !user) {
      toast({ variant: 'destructive', title: 'Undo Failed', description: 'No active game selected.' });
      return;
    }
    setIsLoading(true);
    try {
        const result = await undoLastAction(activeGameId);
        if (result.success) {
            toast({ title: 'Last Action Undone', description: 'The game state has been reverted.' });
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
  }, [activeGameId, user, toast]);
  
  const handleRegenerateField = useCallback(async (fieldName: 'setting' | 'tone') => {
    if (!activeGameId || !gameData || !user) return;
    try {
        gtag.event({
            action: 'regenerate_field',
            category: 'game_setup',
            label: fieldName,
        });
        const result = await regenerateField({
            request: gameData.originalRequest || '',
            fieldName,
            currentValue: gameData[fieldName],
        }, activeGameId, user.uid);
        
        await updateWorldState({
            gameId: activeGameId,
            userId: user.uid,
            updates: { [`gameData.${fieldName}`]: result.newValue }
        });
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Regeneration Failed', description: err.message });
    }
  }, [activeGameId, gameData, toast, user]);

  const handleUpdateCategory = useCallback(async (newCategory: string) => {
    if (!activeGameId || !worldState || !user) return;

    if (worldState.settingCategory === newCategory) {
        toast({ title: 'No Change', description: 'The selected category is already set.' });
        return;
    }

    try {
        await updateWorldState({
            gameId: activeGameId,
            userId: user.uid,
            updates: { 'worldState.settingCategory': newCategory }
        });
        toast({ title: 'Category Updated', description: `Game genre has been set to ${newCategory.replace(/_/g, ' ')}.` });
    } catch (error) {
        const err = error as Error;
        console.error('Failed to update category:', err);
        toast({ variant: 'destructive', title: 'Update Failed', description: err.message });
    }
  }, [activeGameId, worldState, user, toast]);

  const handleUpdateStatus = async (status: SessionStatus) => {
    if (!activeGameId || !user) return;
    try {
      await updateSessionStatus(activeGameId, status);
      toast({ title: "Status Updated", description: `Session is now ${status}.`});
      if (endCampaignConfirmation) setEndCampaignConfirmation(false);
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message });
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
      const intentClassification = await classifyInput({ playerInput }, user.uid, activeGameId);
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
                character: activeCharacter,
            }, activeGameId, user.uid);

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
        
        const ack = await narratePlayerActions({ playerAction: playerInput, gameState: worldState.summary, character: activeCharacter }, activeGameId, user.uid);
        const acknowledgementMessage: Message = {
            id: `assistant-ack-${Date.now()}`,
            role: 'assistant',
            content: ack.narration,
        };
        
        const finalChatMessages = [...newMessages, acknowledgementMessage];

        const storyResponse = await continueStory({
            actionDescription: playerInput,
            characterId: actingCharacter.id,
            worldState,
            ruleAdapter: "FateCore",
            mechanicsVisibility: mechanicsVisibility,
            settingCategory: worldState.settingCategory || 'generic',
            gameId: activeGameId,
            userId: user.uid,
        });

        const newStoryMessages = [...storyMessages, { content: storyResponse.narrativeResult }];
  
        const currentIndex = characters.findIndex((c) => c.id === activeCharacter.id);
        const nextIndex = (currentIndex + 1) % characters.length;
        const foundNextCharacter = characters[nextIndex];
        setNextCharacter(foundNextCharacter);
  
        const serializableWorldState = JSON.parse(JSON.stringify(worldState));
        
        const worldUpdatePayload = {
            gameId: activeGameId,
            userId: user.uid,
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
        const response = await getAnswerToQuestion({ question: playerInput, worldState, character: actingCharacter, settingCategory: worldState.settingCategory || 'generic' }, activeGameId, user.uid);
  
        const assistantMessage: Message = {
          id: `assistant-ans-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
        };
  
        await updateWorldState({
          gameId: activeGameId,
          userId: user.uid,
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


  const handleEndSession = async (type: 'natural' | 'interrupted' | 'early') => {
    if (!activeGameId) return;
    setSessionEnding(false);
    try {
        await endCurrentSessionAction(activeGameId, type);
        toast({ title: "Session Paused", description: "The session has been paused. You can start a new session from the story drawer."});
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Failed to End Session', description: err.message });
    }
  };


  const handleHandoffConfirm = async () => {
    if (!activeGameId || !nextCharacter || !worldState || !user) return;

    setShowHandoff(false);

    await updateWorldState({
      gameId: activeGameId,
      userId: user.uid,
      updates: { activeCharacterId: nextCharacter.id },
    });

    setActiveCharacter(nextCharacter);
    setNextCharacter(null);
  };

  const handleDeleteGame = async () => {
    if (!deleteConfirmation) return;

    const gameIdToDelete = deleteConfirmation.id;
    deletingGameId.current = gameIdToDelete;
    setDeleteConfirmation(null);
    router.push('/play');
    try {
        await deleteGame(gameIdToDelete);
        toast({ title: 'Game Deleted', description: `"${deleteConfirmation.gameData.name}" has been permanently deleted.`});
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
    deletingGameId.current = null;
  };

  const handleRenameGame = async () => {
    if (!renameTarget || !newGameName.trim()) return;

    const gameIdToRename = renameTarget.id;
    setRenameTarget(null);
    try {
        await renameGame(gameIdToRename, newGameName.trim());
        toast({ title: 'Game Renamed', description: `Your game has been renamed to "${newGameName.trim()}".`});
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Rename Failed', description: err.message });
    }
    setNewGameName('');
  };

  const handleLocalCharacterSwitch = (char: Character) => {
    if (activeGameId && user) {
      setActiveCharacter(char);
      updateWorldState({ gameId: activeGameId, userId: user.uid, updates: { activeCharacterId: char.id } });
    }
  };

  const handleProfileUpdate = async (updates: { displayName: string; defaultPronouns: string; defaultVoiceURI?: string; }) => {
    if (!user) return;
    try {
        await updateUserProfile(user.uid, updates);
        toast({ title: "Profile Updated", description: "Your preferences have been saved." });
        setIsAccountDialogOpen(false);
    } catch (error) {
        const err = error as Error;
        toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };
  
  const handleStartNewSession = async () => {
    if (!activeGameId || !user) return;
    setIsLoading(true);
    toast({ title: "Starting New Session...", description: "The GM is preparing the next chapter." });
    try {
        await startNextSessionAction(activeGameId, user.uid);
        toast({ title: 'New Session Started!', description: 'The story continues.' });
    } catch (error) {
        const err = error as Error;
        console.error("Failed to start new session:", err);
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKickPlayer = async (playerId: string) => {
    if (!activeGameId || !user || user.uid !== hostId) return;
    try {
      await kickPlayerAction(activeGameId, playerId);
      toast({ title: "Player Kicked", description: "The player has been removed from the game." });
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Kick Failed', description: err.message });
    }
  }

  const ttsProps = {
    isSpeaking, isPaused, isAutoPlayEnabled, isTTSSupported: supported,
    onPlay: handlePlayAll, onPause: pause, onStop: cancel,
    onSetAutoPlay: setIsAutoPlayEnabled, voices, selectedVoice, onSelectVoice: selectVoice,
    ttsVolume, onCycleTtsVolume: cycleTtsVolume,
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
            classification={lastClassification}
            isLoading={isLoading}
            onContinue={async () => {
              if (activeGameId && user) {
                await updateWorldState({ gameId: activeGameId, userId: user.uid, updates: { step: 'characters' } });
              }
            }}
            onRegenerateField={handleRegenerateField}
            onUpdateCategory={handleUpdateCategory}
            allCategories={SETTING_CATEGORIES}
          />
        );
      case 'characters':
        if (!gameData || !activeGameId || !hostId) {
            return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
        }
        return (
          <MemoizedCharacterCreationForm
            gameData={gameData}
            onCharactersFinalized={handleCharactersFinalized}
            generateCharacterSuggestions={handleGenerateCharacters}
            isLoading={isLoading}
            currentUser={user}
            activeGameId={activeGameId}
            userPreferences={userPreferences}
            players={players}
            onKickPlayer={handleKickPlayer}
            hostId={hostId}
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
            onConfirmEndSession={() => setSessionEnding(true)}
            onStartNewSession={handleStartNewSession}
            {...ttsProps}
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

      {sessionEnding && (
        <AlertDialog open onOpenChange={setSessionEnding}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>How are you ending the session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This helps the AI prepare for the next session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:flex-col sm:space-y-2">
                    <AlertDialogAction onClick={() => handleEndSession('natural')}>
                        This is a good stopping point.
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => handleEndSession('interrupted')} variant="destructive">
                        We have to stop unexpectedly.
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
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
