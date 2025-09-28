
'use client';

import { useState, useId, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { GameSession, Character, Player } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Cake, Shield, PersonStanding, Star, GraduationCap, Sparkles as StuntIcon, Trash2, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { User as FirebaseUser } from 'firebase/auth';
import { ShareGameInvite } from './share-game-invite';
import { QRCodeDisplay } from './qr-code-display';
import type { UserPreferences } from '@/app/actions/user-preferences';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

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

const PlayerSlotCard = memo(({
    player,
    isHost,
    onKickPlayer,
    onUpdateSlot,
    onRemoveSlot,
    isLocal,
}: {
    player: Player;
    isHost: boolean;
    onKickPlayer: (id: string) => void;
    onUpdateSlot?: (id: string, prefs: any) => void;
    onRemoveSlot?: (id: string) => void;
    isLocal: boolean;
}) => {
    const { characterData, name, id, characterCreationStatus } = player;
    const { generatedCharacter } = characterData;
    const preferences = {
        playerName: name,
        vision: characterData.vision,
        name: characterData.name,
        pronouns: characterData.pronouns,
    };

    const handleUpdate = (field: string, value: string) => {
        onUpdateSlot?.(id, { ...preferences, [field]: value });
    };

    if (generatedCharacter) {
        return (
            <Card className="flex flex-col relative group transition-all">
                <CardHeader>
                    <p className="text-center font-bold text-lg">Played by {name}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <CharacterDisplay char={generatedCharacter} />
                </CardContent>
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onUpdateSlot?.(id, { ...preferences, character: null })}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                    </Button>
                </CardFooter>
                {isHost && onRemoveSlot && <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onRemoveSlot(id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
            </Card>
        );
    }
    
    if (isLocal && onUpdateSlot && onRemoveSlot) {
        // Form for local player (Hot-Seat Mode)
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
                    <Select value={characterData?.pronouns || 'Any'} onValueChange={val => handleUpdate('pronouns', val)}>
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
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onRemoveSlot(id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
            </Card>
        );
    }

    // Status display for remote or local lobby player
    return (
        <Card className="flex flex-col relative group transition-all">
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <p className="text-center font-bold text-lg">{name}</p>
                    <Badge variant={characterCreationStatus === 'ready' ? 'default' : 'secondary'} className='capitalize'>
                        {characterCreationStatus}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="text-sm text-muted-foreground space-y-2 p-4 border border-dashed rounded-md min-h-48">
                    <p><strong>Vision:</strong> {characterData.vision || '...'}</p>
                    <p><strong>Name:</strong> {characterData.name || '...'}</p>
                    <p><strong>Pronouns:</strong> {characterData.pronouns || '...'}</p>
                    <p className="text-xs pt-2 italic">Player is creating their character...</p>
                </div>
            </CardContent>
            {isHost && (
              <CardFooter>
                   <Button variant="destructive" size="sm" className="w-full" onClick={() => onKickPlayer(id)}>
                       <UserX className="mr-2 h-4 w-4" /> Kick Player
                   </Button>
              </CardFooter>
            )}
        </Card>
    );
});
PlayerSlotCard.displayName = 'PlayerSlotCard';

type CharacterCreationFormProps = {
  gameData: GameSession['gameData'];
  onCharactersFinalized: (characters: Character[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  currentUser: FirebaseUser | null;
  activeGameId: string | null;
  userPreferences: UserPreferences | null;
  players: Player[];
  onKickPlayer: (playerId: string) => void;
  hostId: string | null;
};

export const CharacterCreationForm = memo(function CharacterCreationForm({
  gameData,
  onCharactersFinalized,
  generateCharacterSuggestions,
  isLoading,
  currentUser,
  activeGameId,
  userPreferences,
  players,
  onKickPlayer,
  hostId,
}: CharacterCreationFormProps) {
  const formId = useId();
  const [localSlots, setLocalSlots] = useState<Player[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const isHost = currentUser?.uid === hostId;
  const isLocalGame = gameData.playMode === 'local';
  
  const [isHotSeatMode, setIsHotSeatMode] = useState(isLocalGame);

  const addNewSlot = useCallback((playerName: string = '', pronouns: string = 'Any') => {
    const newId = `${formId}-slot-${Date.now()}`;
    const newSlot: Player = {
      id: newId,
      name: playerName || `Player ${localSlots.length + 1}`,
      isHost: false,
      isMobile: false,
      connectionStatus: 'connected',
      characterCreationStatus: 'creating',
      characterData: {
        playerName: playerName || `Player ${localSlots.length + 1}`,
        isApproved: true,
        pronouns,
      },
      joinedAt: new Date() as any,
      lastActive: new Date() as any,
    };
    setLocalSlots(slots => [...slots, newSlot]);
  }, [formId, localSlots.length]);


  useEffect(() => {
    if (isLocalGame && isHotSeatMode && localSlots.length === 0 && currentUser) {
      const hostPlayerName = (userPreferences?.displayName && userPreferences.displayName.trim() !== '') 
        ? userPreferences.displayName 
        : currentUser.email?.split('@')[0] || 'Player 1';
      
      const hostPronouns = (userPreferences?.defaultPronouns && userPreferences.defaultPronouns.trim() !== '')
        ? userPreferences.defaultPronouns
        : 'Any';

      addNewSlot(hostPlayerName, hostPronouns);
    } else if (isLocalGame && !isHotSeatMode) {
        setLocalSlots([]);
    }
  }, [isLocalGame, isHotSeatMode, localSlots.length, currentUser, userPreferences, addNewSlot]);


  const allPlayerSlots = isLocalGame && isHotSeatMode ? localSlots : players;


  const handleFinalize = () => {
    const finalCharacters = allPlayerSlots
        .map(p => p.characterData.generatedCharacter)
        .filter(Boolean) as Character[];

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

  const updateLocalSlot = useCallback((id: string, updates: any) => {
    setLocalSlots(slots => slots.map(slot => {
        if (slot.id === id) {
            const newCharacter = updates.character === null ? null : slot.characterData.generatedCharacter;
            return { 
                ...slot, 
                name: updates.playerName || slot.name,
                characterData: {
                    ...slot.characterData,
                    ...updates,
                    generatedCharacter: newCharacter,
                }
            };
        }
        return slot;
    }));
  }, []);

  const removeLocalSlot = useCallback((id: string) => {
    setLocalSlots(slots => slots.filter(s => s.id !== id));
  }, []);

  const handleGenerateAll = async () => {
    const slotsToGenerate = allPlayerSlots.filter(s => !s.characterData.generatedCharacter);
    
    if (slotsToGenerate.length === 0) {
        toast({ title: 'All characters already generated.'});
        return;
    }

    if (slotsToGenerate.some(s => !s.name)) {
        toast({ variant: 'destructive', title: 'Player Names Required', description: 'Please ensure every player slot has a name.' });
        return;
    }

    setIsGenerating(true);
    try {
        const slotsForAI = slotsToGenerate.map(p => ({
            id: p.id,
            playerName: p.name,
            name: p.characterData.name,
            vision: p.characterData.vision,
            pronouns: p.characterData.pronouns === 'Any' ? undefined : p.characterData.pronouns,
            playerId: p.id,
        }));
        
        const existingCharacters = allPlayerSlots
            .map(p => p.characterData.generatedCharacter)
            .filter(Boolean)
            .map(c => ({ name: c!.name, archetype: c!.archetype, description: c!.description }));

        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: slotsForAI,
            existingCharacters,
        });
        
        const updatePlayerState = (players: Player[]): Player[] => {
            return players.map(p => {
                const newCharData = result.characters.find(c => c.slotId === p.id);
                if (newCharData) {
                    return {
                        ...p,
                        characterData: {
                            ...p.characterData,
                            generatedCharacter: {
                                ...newCharData,
                                id: p.id,
                                isCustom: false,
                                playerName: p.name,
                                playerId: p.id,
                            }
                        }
                    };
                }
                return p;
            });
        };

        if (isHotSeatMode) {
          setLocalSlots(updatePlayerState);
        } else {
          // In lobby mode, the parent component handles state via Firestore listeners.
          // We can just trust the suggestions were generated and will appear.
          // In a more complex setup, you might write these to Firestore here.
        }

    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const allSlotsFilled = allPlayerSlots.length > 0;
  const allCharactersGenerated = allSlotsFilled && allPlayerSlots.every(p => p.characterData.generatedCharacter);
  const slotsWithoutCharacters = allPlayerSlots.filter(p => !p.characterData.generatedCharacter).length;
  
  const allRemotePlayersReady = players.length > 0 && players.every(p => p.characterCreationStatus === 'ready' || p.characterData.generatedCharacter);

  const readyToFinalize = (isLocalGame && isHotSeatMode && allCharactersGenerated) || 
                          (!isLocalGame && allRemotePlayersReady);


  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
      <Card className="w-full max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <UserPlus />
            Assemble Your Party
          </CardTitle>
          <CardDescription className="pt-2">
             {isHost 
                ? "Manage your party below. Players can join via the invite link."
                : "Waiting for the host to start the game..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isHost && (
            <div className="flex flex-col items-center gap-4">
                {isLocalGame && (
                    <div className="flex items-center space-x-2">
                        <Switch id="hotseat-mode" checked={isHotSeatMode} onCheckedChange={setIsHotSeatMode} />
                        <Label htmlFor="hotseat-mode">Enable Hot-Seat Mode (Manual Entry)</Label>
                    </div>
                )}
                
                {/* Show Invite URL for Remote Games */}
                {!isLocalGame && activeGameId && (
                  <ShareGameInvite gameId={activeGameId} />
                )}

                {/* Show QR Code for Local Lobby Games */}
                {isLocalGame && !isHotSeatMode && activeGameId && (
                  <QRCodeDisplay 
                    gameId={activeGameId} 
                    gameName={gameData.name}
                    playerCount={allPlayerSlots.length}
                  />
                )}
            </div>
          )}
          

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allPlayerSlots.map((player) => (
                  <PlayerSlotCard
                      key={player.id} 
                      player={player}
                      isHost={isHost}
                      onKickPlayer={onKickPlayer}
                      onUpdateSlot={isHotSeatMode ? updateLocalSlot : undefined}
                      onRemoveSlot={isHotSeatMode ? removeLocalSlot : undefined}
                      isLocal={isHotSeatMode && !player.isMobile}
                  />
              ))}
              {isHost && isLocalGame && isHotSeatMode && (
                <Button variant="outline" type="button" onClick={() => addNewSlot()} className="w-full border-dashed h-full min-h-64">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Local Player
                </Button>
              )}
          </div>
        </CardContent>
        {isHost && (
            <CardFooter className="flex-col gap-4 justify-center pt-6">
              <div className="flex gap-4">
                 <Button
                    size="lg"
                    onClick={handleGenerateAll}
                    disabled={isGenerating || isLoading || slotsWithoutCharacters === 0}
                    className="font-headline text-xl"
                    variant="secondary"
                  >
                    {isGenerating ? (
                       <><Wand2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="mr-2 h-5 w-5" /> Generate {slotsWithoutCharacters > 0 ? `${slotsWithoutCharacters} ` : ''}Character{slotsWithoutCharacters !== 1 ? 's' : ''}</>
                    )}
                </Button>
                <Button
                  size="lg"
                  onClick={handleFinalize}
                  disabled={isGenerating || isLoading || !allCharactersGenerated}
                  className="font-headline text-xl"
                >
                  {isLoading ? (
                      <><LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> Building World...</>
                  ) : (
                      <><Dices className="mr-2 h-5 w-5" /> Finalize Party & Build World</>
                  )}
                </Button>
              </div>
              {!allCharactersGenerated && <p className="text-xs text-muted-foreground">Once concepts are filled in, click "Generate" then "Finalize Party".</p>}
            </CardFooter>
        )}
      </Card>
    </div>
  );
});
