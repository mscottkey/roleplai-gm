'use client';

import { useState, useId, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { GameData, Character, PlayerSlot } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Cake, Shield, PersonStanding, ScrollText, Users, Star, GraduationCap, Sparkles as StuntIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Badge } from './ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { User as FirebaseUser } from 'firebase/auth';
import { ShareGameInvite } from './share-game-invite';
import type { UserPreferences } from '@/app/actions/user-preferences';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

type CharacterCreationFormProps = {
  gameData: GameData;
  initialCharacters?: Character[];
  onCharactersFinalized: (characters: Character[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  currentUser: FirebaseUser | null;
  activeGameId: string | null;
  userPreferences: UserPreferences | null;
  onRegenerateConcept: (newRequest: string) => Promise<void>;
  onRegenerateField: (fieldName: 'setting' | 'tone') => Promise<void>;
};

const RegenerateStoryDialog = ({ onRegenerate, isLoading, currentRequest }: { onRegenerate: (newRequest: string) => Promise<void>; isLoading: boolean, currentRequest: string }) => {
    const [open, setOpen] = useState(false);
    const [newRequest, setNewRequest] = useState(currentRequest);

    const handleSubmit = async () => {
        if (!newRequest.trim()) return;
        await onRegenerate(newRequest);
        setOpen(false);
    }
    
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      setNewRequest(textarea.value);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Story
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate Story Concept</DialogTitle>
                    <DialogDescription>
                        Enter a new prompt to regenerate the entire story concept, including the name, setting, tone, and hooks.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="new-request">New Prompt</Label>
                    <Textarea
                        id="new-request"
                        value={newRequest}
                        onChange={handleInput}
                        placeholder="e.g., 'A classic high fantasy adventure'"
                        disabled={isLoading}
                        className="mt-2 h-auto resize-none overflow-hidden min-h-[4rem]"
                        rows={2}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !newRequest.trim()}>
                        {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Regenerate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const getSkillDisplay = (rank: number) => {
    switch (rank) {
        case 1: return 'Average';
        case 2: return 'Fair';
        case 3: return 'Good';
        default: return `Rank ${rank}`;
    }
}

const CharacterDisplay = ({ char }: { char: Character }) => (
  <div className="space-y-4 text-left">
    <div>
        <h3 className="font-semibold text-lg">{char.name}</h3>
        <p className="text-sm italic text-muted-foreground flex items-center gap-2">
            <Star className="h-3 w-3" />
            <span>"{char.aspect}"</span>
        </p>
        <p className="text-sm mt-1">{char.description}</p>
    </div>
    
    <div className="flex gap-4 text-sm">
        {char.archetype && <p><Shield className="inline h-3 w-3 mr-1"/>{char.archetype}</p>}
        {char.age && <p><Cake className="inline h-3 w-3 mr-1"/>{char.age}</p>}
        {char.pronouns && <p><PersonStanding className="inline h-3 w-3 mr-1"/>{char.pronouns}</p>}
    </div>
    
    {char.stats?.skills && char.stats.skills.length > 0 && (
      <div>
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><GraduationCap className="h-4 w-4"/> Skills</h4>
        <div className="flex flex-wrap gap-1">
          {char.stats.skills.sort((a, b) => b.rank - a.rank).map((skill) => (
            <Badge key={skill.name} variant="secondary" className="text-xs">
              {skill.name} ({getSkillDisplay(skill.rank)})
            </Badge>
          ))}
        </div>
      </div>
    )}

    {char.stats?.stunts && char.stats.stunts.length > 0 && (
       <div>
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><StuntIcon className="h-4 w-4"/> Stunts</h4>
        <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {char.stats.stunts.map((stunt) => (
            <Tooltip key={stunt.name}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">{stunt.name}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{stunt.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        </TooltipProvider>
      </div>
    )}
  </div>
);


export const CharacterCreationForm = memo(function CharacterCreationForm({
  gameData,
  initialCharacters = [],
  onCharactersFinalized,
  generateCharacterSuggestions,
  isLoading,
  currentUser,
  activeGameId,
  userPreferences,
  onRegenerateConcept,
  onRegenerateField
}: CharacterCreationFormProps) {
  const formId = useId();
  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>(() => {
    if (initialCharacters.length > 0) {
      return initialCharacters.map(char => ({
        id: char.id,
        character: char,
        preferences: {
          playerName: char.playerName,
          pronouns: char.pronouns,
        }
      }));
    }
    
    const hostPlayerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    
    return [{ 
      id: `${formId}-slot-0`, 
      character: null,
      preferences: {
        playerName: hostPlayerName,
      }
    }];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const isHost = currentUser?.uid === gameData.userId;
  const currentUserPlayerId = currentUser?.uid;
  const userHasCharacter = playerSlots.some(slot => slot.character?.playerId === currentUserPlayerId);

  useEffect(() => {
    if (gameData.playMode === 'local' && userPreferences && playerSlots.length > 0 && !playerSlots[0].character) {
      const hostSlot = playerSlots[0];
      if (!hostSlot.preferences?.pronouns) {
        setPlayerSlots(playerSlots.map((slot, index) => 
          index === 0 
            ? { ...slot, preferences: { ...slot.preferences, pronouns: userPreferences.defaultPronouns || 'Any' } } 
            : slot
        ));
      }
    }
  }, [userPreferences, gameData.playMode, playerSlots]);

  const updateCharacterInFirestore = async (slots: PlayerSlot[]) => {
    if (!activeGameId) return;
    const db = getFirestore();
    const gameRef = doc(db, 'games', activeGameId);

    try {
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) {
                throw "Game document does not exist!";
            }
            
            const currentCharacters = (gameDoc.data().worldState?.characters || []) as Character[];
            
            const updatedCharacters = slots.map(slot => {
                if (slot.character) return slot.character;
                const existing = currentCharacters.find(c => c.id === slot.id);
                return existing || null;
            }).filter(Boolean) as Character[];

            transaction.update(gameRef, {
                'worldState.characters': updatedCharacters,
                'gameData.characters': updatedCharacters,
            });
        });
    } catch (e) {
        console.error("Failed to update characters in transaction:", e);
        toast({
            variant: "destructive",
            title: "Sync Error",
            description: "Could not save character updates to the server."
        });
    }
  };


  const addPlayerSlot = () => {
    const newSlot: PlayerSlot = {
      id: `${formId}-slot-${playerSlots.length}`,
      character: null,
      preferences: {
        playerName: '',
      }
    };
    const newSlots = [...playerSlots, newSlot];
    setPlayerSlots(newSlots);
    if(gameData.playMode === 'remote') updateCharacterInFirestore(newSlots);
  };

  const removePlayerSlot = (slotId: string) => {
    const newSlots = playerSlots.filter(slot => slot.id !== slotId);
    setPlayerSlots(newSlots);
    if(gameData.playMode === 'remote') updateCharacterInFirestore(newSlots);
  };
  
  const generateCharacterForSlot = async (slotId: string, preferences: { name?: string; vision?: string; pronouns?: string; playerName?: string }) => {
    setIsGenerating(true);

    const playerName = preferences.playerName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player';

    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: [{
                id: slotId,
                playerName: playerName,
                name: preferences.name,
                vision: preferences.vision,
                pronouns: preferences.pronouns === 'Any' ? undefined : preferences.pronouns,
            }],
        });
        
        const newCharData = result.characters[0];
        
        if (newCharData) {
            const newCharacter: Character = {
                ...newCharData,
                id: slotId,
                playerName: playerName,
                isCustom: false,
                playerId: currentUserPlayerId!,
            };
            const newSlots = playerSlots.map(s => s.id === slotId ? { ...s, character: newCharacter, preferences: {} } : s);
            setPlayerSlots(newSlots);
            if(gameData.playMode === 'remote') updateCharacterInFirestore(newSlots);
        }
        
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleFinalize = () => {
    const finalCharacters = playerSlots.map(s => s.character).filter(Boolean) as Character[];
    if (finalCharacters.length !== playerSlots.length) {
       toast({
        title: "Incomplete Party",
        description: "All player slots must have a character before starting.",
      });
      return;
    }
    
    onCharactersFinalized(finalCharacters);
  };
  
const CharacterSlotCard = ({ slot, onGenerate, onRemove }: { slot: PlayerSlot; onGenerate: (prefs: any) => void; onRemove: () => void; }) => {
    const [charName, setCharName] = useState(slot.preferences?.name || '');
    const [vision, setVision] = useState(slot.preferences?.vision || '');
    const [pronouns, setPronouns] = useState(slot.preferences?.pronouns || 'Any');
    const [isCreating, setIsCreating] = useState(false);

    const canCreate = !userHasCharacter && !slot.character;

    useEffect(() => {
        setCharName(slot.preferences?.name || '');
        setVision(slot.preferences?.vision || '');
        setPronouns(slot.preferences?.pronouns || 'Any');
    }, [slot.preferences]);

    if (slot.character) {
        return (
            <Card className="flex flex-col relative group transition-all">
                <CardHeader>
                    <p className="text-center font-bold text-lg">Played by {slot.character.playerName}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <CharacterDisplay char={slot.character} />
                </CardContent>
                <CardFooter>
                    {isHost && slot.character.playerId !== currentUserPlayerId && (
                        <Button variant="destructive" size="sm" className="w-full" onClick={onRemove}>
                            <Trash2 className="mr-2 h-4 w-4" /> Kick Player
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    // Empty Slot
    return (
        <Card className="flex flex-col relative group transition-all border-dashed p-4 justify-center items-center min-h-64">
            {isCreating ? (
                <div className="w-full space-y-4 text-left p-4">
                    <Label>Character Vision</Label>
                    <Textarea placeholder="e.g. A grumpy cyber-samurai with a heart of gold" value={vision} onChange={e => setVision(e.target.value)} disabled={!isHost} />
                    <Label>Character Name (Optional)</Label>
                    <Input placeholder="e.g. Kaito Tanaka" value={charName} onChange={e => setCharName(e.target.value)} disabled={!isHost} />
                    <Label>Pronouns</Label>
                    <Select value={pronouns} onValueChange={setPronouns} disabled={!isHost}>
                        <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Any">Any</SelectItem>
                            <SelectItem value="She/Her">She/Her</SelectItem>
                            <SelectItem value="He/Him">He/Him</SelectItem>
                            <SelectItem value="They/Them">They/Them</SelectItem>
                            <SelectItem value="Ze/Zir">Ze/Zir</SelectItem>
                            <SelectItem value="It/Its">It/Its</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={() => onGenerate({ name: charName, vision, pronouns: pronouns, playerName: slot.preferences?.playerName })} disabled={isGenerating}>
                        <Wand2 className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                        Generate My Character
                    </Button>
                     <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Empty Slot</p>
                    {canCreate && (
                        <Button onClick={() => setIsCreating(true)}>
                            <UserPlus className="mr-2 h-4 w-4" /> Create Your Character
                        </Button>
                    )}
                    {!canCreate && <p className="text-xs text-muted-foreground">{userHasCharacter ? "You already have a character." : "Waiting for player..."}</p>}
                </div>
            )}
             {isHost && <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={onRemove}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
        </Card>
    );
};


if (gameData.playMode === 'remote') {
    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
            <Card className="w-full max-w-7xl mx-auto shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
                        <Users /> Multiplayer Lobby
                    </CardTitle>
                    <CardDescription className="pt-2">
                        {isHost 
                            ? "Add player slots and share the invite link. Wait for all players to create their characters, then start the game."
                            : "Create your character to join the party. The host will start the game when everyone is ready."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {activeGameId && isHost && <ShareGameInvite gameId={activeGameId} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {playerSlots.map((slot) => (
                            <CharacterSlotCard 
                                key={slot.id} 
                                slot={slot} 
                                onGenerate={(prefs) => generateCharacterForSlot(slot.id, prefs)}
                                onRemove={() => removePlayerSlot(slot.id)}
                            />
                        ))}

                        {isHost && (
                            <Button variant="outline" onClick={addPlayerSlot} className="w-full border-dashed h-full min-h-64">
                                <UserPlus className="mr-2 h-4 w-4" /> Add Player Slot
                            </Button>
                        )}
                    </div>
                </CardContent>
                {isHost && (
                    <CardFooter className="flex-col gap-4 justify-center pt-6">
                        <Button
                            size="lg"
                            onClick={handleFinalize}
                            disabled={isGenerating || isLoading || playerSlots.some(s => !s.character)}
                            className="font-headline text-xl"
                        >
                            {isLoading ? (
                                <><LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> Building World...</>
                            ) : (
                                <><Dices className="mr-2 h-5 w-5" /> Finalize Party & Build World</>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground">All slots must be filled before starting.</p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

// Local Play Mode
const LocalPlayerSlot = memo(({ slot, onUpdate, onRemove }: { slot: PlayerSlot, onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
    const { preferences } = slot;

    const handleUpdate = (field: string, value: string) => {
        onUpdate(slot.id, { ...preferences, [field]: value });
    };

    if (slot.character && !slot.character.isCustom) {
        return (
            <Card className="flex flex-col relative group transition-all">
                <CardHeader>
                    <p className="text-center font-bold text-lg">Played by {slot.character.playerName}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <CharacterDisplay char={slot.character} />
                </CardContent>
                <CardFooter>
                     <Button variant="outline" size="sm" className="w-full" onClick={() => onUpdate(slot.id, { character: null })}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                    </Button>
                </CardFooter>
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onRemove(slot.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
            </Card>
        );
    }
    
    return (
        <Card className="flex flex-col relative group transition-all border-dashed p-4 justify-center items-center min-h-64">
            <div className="w-full space-y-4 text-left p-4">
                <Label>Player Name</Label>
                <Input 
                    placeholder="Enter player name" 
                    value={preferences?.playerName || ''} 
                    onChange={e => handleUpdate('playerName', e.target.value)}
                />
                <Label>Character Vision</Label>
                <Textarea placeholder="e.g. A grumpy cyber-samurai with a heart of gold" value={preferences?.vision || ''} onChange={e => handleUpdate('vision', e.target.value)} />
                <Label>Character Name (Optional)</Label>
                <Input placeholder="e.g. Kaito Tanaka" value={preferences?.name || ''} onChange={e => handleUpdate('name', e.target.value)} />
                <Label>Pronouns</Label>
                <Select value={preferences?.pronouns || 'Any'} onValueChange={val => handleUpdate('pronouns', val)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
                        <SelectItem value="She/Her">She/Her</SelectItem>
                        <SelectItem value="He/Him">He/Him</SelectItem>
                        <SelectItem value="They/Them">They/Them</SelectItem>
                        <SelectItem value="Ze/Zir">Ze/Zir</SelectItem>
                        <SelectItem value="It/Its">It/Its</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onRemove(slot.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
        </Card>
    );
});
LocalPlayerSlot.displayName = 'LocalPlayerSlot';

const handleGenerateAll = async () => {
    const slotsToGenerate = playerSlots.filter(s => !s.character);
    if (slotsToGenerate.length === 0) {
        toast({ title: 'All characters already generated.'});
        return;
    }

    if (playerSlots.some(s => !s.preferences?.playerName)) {
        toast({ variant: 'destructive', title: 'Player Names Required', description: 'Please enter a name for each player.' });
        return;
    }

    setIsGenerating(true);
    try {
        const slotsForAI = playerSlots.map(s => {
            const prefs = s.preferences || {};
            return {
                id: s.id,
                playerName: prefs.playerName,
                name: prefs.name,
                vision: prefs.vision,
                pronouns: prefs.pronouns === 'Any' ? undefined : prefs.pronouns,
            };
        });

        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: slotsForAI,
            existingCharacters: []
        });

        const newSlots = playerSlots.map(slot => {
            const newCharData = result.characters.find(c => c.slotId === slot.id);
            if (newCharData) {
                return {
                    ...slot,
                    character: {
                        ...newCharData,
                        id: slot.id,
                        isCustom: false,
                        playerId: currentUserPlayerId!,
                        playerName: slot.preferences?.playerName || 'Unknown',
                    }
                };
            }
            return slot;
        });
        setPlayerSlots(newSlots);

    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
};

  const updateSlotPreferences = (id: string, updates: any) => {
    setPlayerSlots(playerSlots.map(slot => {
        if (slot.id === id) {
             if (updates.character === null) {
                return { ...slot, character: null };
            }
            return { ...slot, preferences: updates };
        }
        return slot;
    }));
};

  const hasGeneratedAll = playerSlots.length > 0 && playerSlots.every(slot => slot.character);
  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
      <Card className="w-full max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <UserPlus />
            Assemble Your Party
          </CardTitle>
          <CardDescription className="pt-2">
             Define your players, generate their characters, and get ready to play!
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="party" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="summary"><ScrollText className="mr-2 h-4 w-4"/>Story Summary</TabsTrigger>
                <TabsTrigger value="party"><Users className="mr-2 h-4 w-4"/>Party Builder</TabsTrigger>
              </TabsList>
               <TabsContent value="summary">
                 <Card className="bg-muted/50">
                   <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Campaign Briefing</CardTitle>
                        <RegenerateStoryDialog
                            onRegenerate={onRegenerateConcept}
                            isLoading={isLoading}
                            currentRequest={(gameData as any).originalRequest || ''}
                        />
                   </CardHeader>
                   <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
                     <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
                        <section className="prose prose-sm dark:prose-invert max-w-none relative group">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="mt-0">Setting</h2>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRegenerateField('setting')} disabled={isLoading}>
                                <RefreshCw className={cn("mr-2 h-3 w-3", isLoading && "animate-spin")} /> Regenerate
                            </Button>
                          </div>
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {gameData.setting}
                          </ReactMarkdown>
                        </section>
                        <section className="prose prose-sm dark:prose-invert max-w-none relative group">
                           <div className="flex items-center justify-between mb-2">
                            <h2 className="mt-0">Tone</h2>
                             <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRegenerateField('tone')} disabled={isLoading}>
                                <RefreshCw className={cn("mr-2 h-3 w-3", isLoading && "animate-spin")} /> Regenerate
                            </Button>
                          </div>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                           {gameData.tone}
                          </ReactMarkdown>
                        </section>
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>
              <TabsContent value="party">
                 <form>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {playerSlots.map((slot) => (
                          <LocalPlayerSlot 
                              key={slot.id} 
                              slot={slot} 
                              onUpdate={updateSlotPreferences}
                              onRemove={() => setPlayerSlots(slots => slots.filter(s => s.id !== slot.id))}
                          />
                      ))}
                      <Button variant="outline" type="button" onClick={addPlayerSlot} className="w-full border-dashed h-full min-h-64">
                          <UserPlus className="mr-2 h-4 w-4" /> Add Player Slot
                      </Button>
                  </div>
                 </form>
              </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="flex-col gap-4 justify-center pt-6">
          <Button
            size="lg"
            onClick={hasGeneratedAll ? handleFinalize : handleGenerateAll}
            disabled={isGenerating || isLoading || playerSlots.length === 0}
            className="font-headline text-xl"
          >
             {isLoading ? (
                <><LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> Building World...</>
              ) : isGenerating ? (
                 <><Wand2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
              ) : hasGeneratedAll ? (
                 <><Dices className="mr-2 h-5 w-5" /> Finalize Party & Build World</>
              ) : (
                <><Wand2 className="mr-2 h-5 w-5" /> Generate All Characters</>
              )}
          </Button>
          {!hasGeneratedAll && playerSlots.length > 0 && playerSlots.some(s => !s.character) && (
             <p className="text-xs text-muted-foreground">Fill out player names, then click "Generate All Characters".</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
});