
'use client';

import { useState, useId, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { GameSession, Character, PlayerSlot, Player } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Cake, Shield, PersonStanding, Star, GraduationCap, Sparkles as StuntIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { User as FirebaseUser } from 'firebase/auth';
import { ShareGameInvite } from './share-game-invite';
import type { UserPreferences } from '@/app/actions/user-preferences';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';

type CharacterCreationFormProps = {
  gameData: GameSession['gameData'];
  initialCharacters?: Character[];
  onCharactersFinalized: (characters: Character[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  currentUser: FirebaseUser | null;
  activeGameId: string | null;
  userPreferences: UserPreferences | null;
  players: Player[];
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

export const CharacterCreationForm = memo(function CharacterCreationForm({
  gameData,
  initialCharacters = [],
  onCharactersFinalized,
  generateCharacterSuggestions,
  isLoading,
  currentUser,
  activeGameId,
  userPreferences,
  players,
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
          playerId: char.playerId,
        }
      }));
    }
    
    const hostPlayerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
    
    return [{ 
      id: `${formId}-slot-0`, 
      character: null,
      preferences: {
        playerName: hostPlayerName,
        playerId: gameData.playMode === 'remote' ? currentUser?.uid : undefined,
      }
    }];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const isHost = currentUser?.uid === gameData.userId;
  const currentUserPlayerId = currentUser?.uid;
  const userHasCharacter = players.some(p => p.id === currentUserPlayerId && p.characterCreationStatus === 'ready');

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

  const handleFinalize = () => {
    let finalCharacters: Character[];
    if (gameData.playMode === 'remote') {
        finalCharacters = players.map(p => p.characterData.generatedCharacter).filter(Boolean) as Character[];
    } else {
        finalCharacters = playerSlots.map(s => s.character).filter(Boolean) as Character[];
    }

    if (finalCharacters.length === 0) {
       toast({
        variant: "destructive",
        title: "Incomplete Party",
        description: "You must have at least one character to begin.",
      });
      return;
    }
    
    onCharactersFinalized(finalCharacters);
  };

  const updateSlotPreferences = useCallback((id: string, updates: any) => {
    setPlayerSlots(slots => slots.map(slot => {
        if (slot.id === id) {
            if (updates.character === null) {
                return { ...slot, character: null };
            }
            return { ...slot, preferences: updates };
        }
        return slot;
    }));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setPlayerSlots(slots => slots.filter(s => s.id !== id));
  }, []);

  const addNewSlot = useCallback(() => {
    setPlayerSlots(slots => [...slots, {
      id: `${formId}-slot-${slots.length}`,
      character: null,
      preferences: { playerName: '' }
    }]);
  }, [formId]);

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
                playerId: prefs.playerId || '',
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
                        playerName: slot.preferences?.playerName || 'Unknown',
                        playerId: slot.preferences?.playerId || currentUserPlayerId || '',
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


if (gameData.playMode === 'remote') {
    const allPlayersReady = players.length > 0 && players.every(p => p.characterCreationStatus === 'ready');
    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
            <Card className="w-full max-w-7xl mx-auto shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-4xl text-primary">Game Lobby</CardTitle>
                    <CardDescription className="pt-2">
                        {isHost 
                            ? "Share the invite link. Wait for all players to create their characters, then start the game."
                            : "Waiting for other players..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {activeGameId && isHost && <ShareGameInvite gameId={activeGameId} />}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {players.map((player) => (
                           <Card key={player.id} className="flex flex-col relative group transition-all">
                               <CardHeader>
                                   <div className='flex justify-between items-start'>
                                        <p className="text-center font-bold text-lg">{player.name}</p>
                                        <Badge variant={player.characterCreationStatus === 'ready' ? 'default' : 'secondary'} className='capitalize'>
                                            {player.characterCreationStatus}
                                        </Badge>
                                   </div>
                               </CardHeader>
                               <CardContent className="flex-1 space-y-4">
                                   {player.characterData.generatedCharacter ? (
                                       <CharacterDisplay char={player.characterData.generatedCharacter} />
                                   ) : (
                                       <div className="text-sm text-muted-foreground space-y-2">
                                           <p><strong>Vision:</strong> {player.characterData.vision || '...'}</p>
                                           <p><strong>Name:</strong> {player.characterData.name || '...'}</p>
                                           <p><strong>Pronouns:</strong> {player.characterData.pronouns || '...'}</p>
                                       </div>
                                   )}
                               </CardContent>
                           </Card>
                        ))}
                    </div>
                </CardContent>
                {isHost && (
                    <CardFooter className="flex-col gap-4 justify-center pt-6">
                        <Button
                            size="lg"
                            onClick={handleFinalize}
                            disabled={isGenerating || isLoading || !allPlayersReady}
                            className="font-headline text-xl"
                        >
                            {isLoading ? (
                                <><LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> Building World...</>
                            ) : (
                                <><Dices className="mr-2 h-5 w-5" /> Finalize Party & Build World</>
                            )}
                        </Button>
                        {!allPlayersReady && <p className="text-xs text-muted-foreground">All players must be 'Ready' before starting.</p>}
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

// Local Play Mode
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
             <form>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {playerSlots.map((slot) => (
                      <LocalPlayerSlot 
                          key={slot.id} 
                          slot={slot} 
                          onUpdate={updateSlotPreferences}
                          onRemove={removeSlot}
                      />
                  ))}
                  <Button variant="outline" type="button" onClick={addNewSlot} className="w-full border-dashed h-full min-h-64">
                      <UserPlus className="mr-2 h-4 w-4" /> Add Player Slot
                  </Button>
              </div>
             </form>
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
