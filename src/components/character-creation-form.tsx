

'use client';

import { useState, useId, useEffect } from 'react';
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

    return processedMd;
};


type CharacterCreationFormProps = {
  gameData: GameData;
  initialCharacters?: Character[];
  onCharactersFinalized: (characters: Character[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  currentUser: FirebaseUser | null;
  onUpdatePlayerSlots: (slots: PlayerSlot[]) => void;
  activeGameId: string | null;
};


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
        {char.gender && <p><PersonStanding className="inline h-3 w-3 mr-1"/>{char.gender}</p>}
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


export function CharacterCreationForm({
  gameData,
  initialCharacters = [],
  onCharactersFinalized,
  generateCharacterSuggestions,
  isLoading,
  currentUser,
  onUpdatePlayerSlots,
  activeGameId
}: CharacterCreationFormProps) {
  const formId = useId();
  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const isHost = currentUser?.uid === gameData.userId;
  const currentUserPlayerId = currentUser?.uid;
  const userHasCharacter = playerSlots.some(slot => slot.character?.playerId === currentUserPlayerId);

  useEffect(() => {
    // If loading an existing game with characters, populate the slots from DB
    if (initialCharacters.length > 0) {
        const slots: PlayerSlot[] = initialCharacters.map(char => ({
            id: char.id,
            character: char
        }));
        setPlayerSlots(slots);
    } else {
        // New game, start with one slot for the host/first player
        const hostPlayerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player 1';
        const initialSlot: PlayerSlot = { 
            id: `${formId}-slot-0`, 
            character: null,
            preferences: {
                playerName: hostPlayerName
            }
        };
        setPlayerSlots([initialSlot]);
    }
}, [initialCharacters, formId, currentUser]);


  const updateSlots = (newSlots: PlayerSlot[]) => {
    setPlayerSlots(newSlots);
    onUpdatePlayerSlots(newSlots);
  }

  const addPlayerSlot = () => {
    const newSlot: PlayerSlot = {
      id: `${formId}-slot-${playerSlots.length}`,
      character: null,
      preferences: {
        playerName: ''
      }
    };
    updateSlots([...playerSlots, newSlot]);
  };

  const removePlayerSlot = (slotId: string) => {
    const newSlots = playerSlots.filter(slot => slot.id !== slotId);
    updateSlots(newSlots);
  };
  
  const generateCharacterForSlot = async (slotId: string, preferences: { name?: string; vision?: string; gender?: string; playerName?: string }) => {
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
                gender: preferences.gender === 'Any' ? undefined : preferences.gender,
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
            const newSlots = playerSlots.map(s => s.id === slotId ? { ...s, character: newCharacter } : s);
            updateSlots(newSlots);
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
    const [charName, setCharName] = useState('');
    const [vision, setVision] = useState('');
    const [gender, setGender] = useState('Any');
    const [isCreating, setIsCreating] = useState(false);

    const canCreate = !userHasCharacter && !slot.character;

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
                    <Textarea placeholder="e.g. A grumpy cyber-samurai with a heart of gold" value={vision} onChange={e => setVision(e.target.value)} />
                    <Label>Character Name (Optional)</Label>
                    <Input placeholder="e.g. Kaito Tanaka" value={charName} onChange={e => setCharName(e.target.value)} />
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Any">Any</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={() => onGenerate({ name: charName, vision, gender })} disabled={isGenerating}>
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
  const LocalPlayerSlot = ({ slot, onUpdate, onRemove }: { slot: PlayerSlot, onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
    
    const pref = slot.preferences || {};
    const [playerName, setPlayerName] = useState(pref.playerName || '');
    const [charName, setCharName] = useState(pref.name || '');
    const [vision, setVision] = useState(pref.vision || '');
    const [gender, setGender] = useState(pref.gender || 'Any');
    
    useEffect(() => {
        const newPrefs = slot.preferences || {};
        setPlayerName(newPrefs.playerName || '');
        setCharName(newPrefs.name || '');
        setVision(newPrefs.vision || '');
        setGender(newPrefs.gender || 'Any');
    }, [slot.preferences]);


    const handleUpdate = (field: string, value: string) => {
        const currentPrefs = slot.preferences || {};
        onUpdate(slot.id, { ...currentPrefs, [field]: value });
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
                <Input placeholder="e.g. Sarah" value={playerName} onChange={e => { setPlayerName(e.target.value); handleUpdate('playerName', e.target.value)}} />
                <Label>Character Vision</Label>
                <Textarea placeholder="e.g. A grumpy cyber-samurai with a heart of gold" value={vision} onChange={e => { setVision(e.target.value); handleUpdate('vision', e.target.value)}} />
                <Label>Character Name (Optional)</Label>
                <Input placeholder="e.g. Kaito Tanaka" value={charName} onChange={e => { setCharName(e.target.value); handleUpdate('name', e.target.value)}} />
                <Label>Gender</Label>
                <Select value={gender} onValueChange={val => { setGender(val); handleUpdate('gender', val)}}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onRemove(slot.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
        </Card>
    );
};

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
                gender: prefs.gender === 'Any' ? undefined : prefs.gender,
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
        updateSlots(newSlots);

    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
};

  const updateSlotPreferences = (id: string, updates: any) => {
    setPlayerSlots(currentSlots => {
        return currentSlots.map(slot => {
            if (slot.id === id) {
                 if (updates.character === null) {
                    return { ...slot, character: null };
                }
                const oldPrefs = (slot as any).preferences || {};
                return { ...slot, preferences: { ...oldPrefs, ...updates } };
            }
            return slot;
        });
    });
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
                   <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
                     <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
                        <section className="prose prose-sm dark:prose-invert max-w-none">
                          <h2 className="mt-0">Setting</h2>
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {normalizeInlineBulletsInSections(gameData.setting)}
                          </ReactMarkdown>
                        </section>
                        <section className="prose prose-sm dark:prose-invert max-w-none">
                          <h2 className="mt-0">Tone</h2>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                           {normalizeInlineBulletsInSections(gameData.tone)}
                          </ReactMarkdown>
                        </section>
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>
              <TabsContent value="party">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {playerSlots.map((slot) => (
                        <LocalPlayerSlot 
                            key={slot.id} 
                            slot={slot} 
                            onUpdate={updateSlotPreferences}
                            onRemove={removePlayerSlot}
                        />
                    ))}
                    <Button variant="outline" onClick={addPlayerSlot} className="w-full border-dashed h-full min-h-64">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Player Slot
                    </Button>
                </div>
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
          {!hasGeneratedAll && playerSlots.length > 0 && (
             <Button variant="link" size="sm" onClick={() => updateSlots(playerSlots.map(s => ({...s, character: null})))}>
                <RefreshCw className="mr-2 h-3 w-3" /> Start Over
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
