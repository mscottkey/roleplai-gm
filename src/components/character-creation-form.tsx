
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
import type { GameData, Character as CustomCharacterType } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Cake, Shield, PersonStanding, ScrollText, Users, Star, GraduationCap, Sparkles as StuntIcon, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Badge } from './ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { User as FirebaseUser } from 'firebase/auth';

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

type FormCharacter = CustomCharacterType;

type CharacterCreationFormProps = {
  gameData: GameData;
  initialCharacters?: FormCharacter[];
  onCharactersFinalized: (characters: FormCharacter[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  currentUser: FirebaseUser | null;
  onClaimCharacter: (characterId: string, claim: boolean) => void;
  activeGameId: string | null;
};

type PlayerSlot = {
  id: string;
  playerName: string;
  characterName: string;
  vision: string;
  gender: string;
  character: FormCharacter | null;
};


const getSkillDisplay = (rank: number) => {
    switch (rank) {
        case 1: return 'Average';
        case 2: return 'Fair';
        case 3: return 'Good';
        default: return `Rank ${rank}`;
    }
}

const CharacterDisplay = ({ char }: { char: FormCharacter }) => (
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
  onClaimCharacter,
}: CharacterCreationFormProps) {
  const formId = useId();
  const [partySize, setPartySize] = useState(initialCharacters.length || 4);
  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(initialCharacters.length > 0);
  const { toast } = useToast();

  useEffect(() => {
    // This effect syncs the internal state with props, useful for reloads or initial setup.
    if (initialCharacters.length > 0) {
      const slots = initialCharacters.map(char => ({
        id: char.id,
        playerName: char.playerName,
        characterName: char.name, // Pre-fill with existing name
        vision: '', // Vision is transient, not stored
        gender: char.gender || 'Any',
        character: char,
      }));
      setPlayerSlots(slots);
      setPartySize(slots.length);
      setHasGenerated(true);
    } else {
      // If no initial characters, set up empty slots based on party size
      const newSlots = Array.from({ length: partySize }, (_, i) => ({
        id: `${formId}-slot-${i}`,
        playerName: `Player ${i + 1}`,
        characterName: '',
        vision: '',
        gender: 'Any',
        character: null,
      }));
      setPlayerSlots(newSlots);
      setHasGenerated(false);
    }
  }, [initialCharacters, partySize, formId]);


  const updateSlot = (slotId: string, field: keyof Omit<PlayerSlot, 'id' | 'character'>, value: string) => {
    setPlayerSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ));
  };
  
  const handlePartySizeChange = (val: string) => {
    const newSize = Number(val);
    setPartySize(newSize);
    // Reset generation state when size changes
    setHasGenerated(false);
  }

  const generateParty = async () => {
    setIsGenerating(true);
    setHasGenerated(false);

    const characterSlotsForAI = playerSlots.map(slot => ({
        id: slot.id,
        name: slot.characterName, // Use the preferred character name for the AI
        vision: slot.vision,
        gender: slot.gender === 'Any' ? undefined : slot.gender,
    }));

    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: characterSlotsForAI,
        });
        
        const newPlayerSlots = playerSlots.map(slot => {
            const generatedCharData = result.characters.find(c => c.slotId === slot.id);
            if (!generatedCharData) return slot;

            const newCharacter: FormCharacter = {
                ...generatedCharData,
                id: slot.id, // Ensure ID matches the slot ID
                playerName: slot.playerName, // Carry over the player name
                isCustom: false,
                claimedBy: gameData.playMode === 'remote' ? '' : currentUser?.uid,
            };
            return { ...slot, character: newCharacter };
        });

        setPlayerSlots(newPlayerSlots);
        setHasGenerated(true);

    } catch (error) {
        const err = error as Error;
        toast({
            variant: "destructive",
            title: "Party Generation Failed",
            description: err.message || "Could not generate characters. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const regenerateCharacter = async (slotId: string) => {
    const slotToRegen = playerSlots.find(s => s.id === slotId);
    if (!slotToRegen) return;

    setIsGenerating(true);

    try {
        const otherCharacters = playerSlots
            .filter(s => s.id !== slotId && s.character)
            .map(s => ({ name: s.character!.name, description: s.character!.description, archetype: s.character!.archetype }));

        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: [{ 
              id: slotId, 
              name: slotToRegen.characterName, 
              vision: slotToRegen.vision,
              gender: slotToRegen.gender === 'Any' ? undefined : slotToRegen.gender,
            }],
            existingCharacters: otherCharacters,
        });
        
        const newCharData = result.characters[0];
        
        if (newCharData) {
            const newCharacter: FormCharacter = {
                ...newCharData,
                id: slotId,
                playerName: slotToRegen.playerName,
                isCustom: false,
                claimedBy: slotToRegen.character?.claimedBy || '',
            };
            setPlayerSlots(prev => prev.map(s => s.id === slotId ? { ...s, character: newCharacter } : s));
        }
        
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Regeneration Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleFinalize = () => {
    if (!hasGenerated) {
       toast({
        title: "Generate Your Party",
        description: "Please generate characters for your party before starting.",
      });
      return;
    }
    const finalCharacters = playerSlots.map(s => s.character).filter(Boolean) as FormCharacter[];
    if (finalCharacters.length !== playerSlots.length) {
       toast({
        title: "Incomplete Party",
        description: "One or more player slots do not have a character.",
      });
      return;
    }
    
    if (gameData.playMode === 'remote' && finalCharacters.some(c => !c.claimedBy)) {
        toast({
            variant: "destructive",
            title: "Unclaimed Characters",
            description: "All characters must be claimed by a player before starting a remote game.",
        });
        return;
    }
    
    onCharactersFinalized(finalCharacters);
  };
  
  const isHost = currentUser?.uid === gameData.userId;

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
                 {!hasGenerated ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <Label htmlFor="party-size">Number of Characters:</Label>
                      <Select value={String(partySize)} onValueChange={handlePartySizeChange} disabled={isGenerating || !isHost}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="w-full max-w-4xl space-y-4">
                        <p className="text-sm text-muted-foreground">For each player, you can optionally provide preferences.</p>
                        {playerSlots.map((slot, index) => (
                             <Card key={slot.id} className="p-3 bg-muted/30">
                                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                     <Input 
                                        placeholder={`Player ${index + 1}`}
                                        className="font-bold"
                                        value={slot.playerName}
                                        onChange={(e) => updateSlot(slot.id, 'playerName', e.target.value)}
                                        disabled={!isHost}
                                    />
                                    <Input 
                                        placeholder="Character Name (Optional)"
                                        value={slot.characterName}
                                        onChange={(e) => updateSlot(slot.id, 'characterName', e.target.value)}
                                        disabled={!isHost}
                                    />
                                     <Select value={slot.gender} onValueChange={(v) => updateSlot(slot.id, 'gender', v)} disabled={!isHost}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Any">Any Gender</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                                        </SelectContent>
                                     </Select>
                                     <Input 
                                        placeholder="Character Vision (e.g., 'grumpy space marine')"
                                        className="border-dashed"
                                        value={slot.vision}
                                        onChange={(e) => updateSlot(slot.id, 'vision', e.target.value)}
                                        disabled={!isHost}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                    {isHost && (
                      <Button size="lg" onClick={generateParty} disabled={isGenerating || isLoading} className="mt-6">
                        <Wand2 className={cn("mr-2 h-5 w-5", isGenerating && "animate-spin")} />
                        Generate Party
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerSlots.map((slot) => {
                      const isClaimedByCurrentUser = slot.character?.claimedBy === currentUser?.uid;
                      const isClaimedByOther = slot.character?.claimedBy && !isClaimedByCurrentUser;
                      return (
                        <Card key={slot.id} className={cn("flex flex-col relative group transition-all")}>
                          <CardHeader>
                             <p className="text-center font-bold text-lg">Played by {slot.playerName}</p>
                          </CardHeader>
                          
                          <CardContent className="flex-1 space-y-4">
                            {slot.character ? (
                                <CharacterDisplay char={slot.character} />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">Character not generated.</div>
                            )}
                          </CardContent>
                          
                          <CardFooter className="flex flex-col gap-2">
                            {isHost && (
                              <>
                                <Textarea 
                                  placeholder="New Character Vision..."
                                  value={slot.vision}
                                  onChange={(e) => updateSlot(slot.id, 'vision', e.target.value)}
                                  className="h-20 text-xs mb-2"
                                />
                                <Button size="sm" variant="secondary" className="w-full" onClick={() => regenerateCharacter(slot.id)} disabled={isGenerating}>
                                  <RefreshCw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                                  Regenerate Character
                                </Button>
                              </>
                            )}
                            {gameData.playMode === 'remote' && slot.character && (
                              <>
                                {isClaimedByCurrentUser ? (
                                  <Button variant="destructive" size="sm" className="w-full" onClick={() => onClaimCharacter(slot.character!.id, false)}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Release Character
                                  </Button>
                                ) : (
                                  <Button size="sm" className="w-full" onClick={() => onClaimCharacter(slot.character!.id, true)} disabled={!!isClaimedByOther}>
                                    {isClaimedByOther ? (
                                      'Claimed by another player'
                                    ) : (
                                      <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Claim Character
                                      </>
                                    )}
                                  </Button>
                                )}
                              </>
                            )}
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </CardContent>
        {isHost && (
          <CardFooter className="flex-col gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={handleFinalize}
              disabled={isGenerating || !hasGenerated || isLoading}
              className="font-headline text-xl"
            >
               {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
                    Building World...
                  </>
                ) : (
                  <>
                    <Dices className="mr-2 h-5 w-5" />
                    Finalize Party & Build World
                  </>
                )}
            </Button>
            {hasGenerated && (
              <Button variant="ghost" size="sm" onClick={generateParty} disabled={isGenerating || isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Entire Party
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
