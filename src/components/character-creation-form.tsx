
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
import type { GenerateCharacterOutput, GenerateCharacterInput, Character as GenCharacterType } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Edit, User, Cake, Shield, PlusCircle, X, ScrollText, Users, Star, GraduationCap, Sparkles as StuntIcon, BrainCircuit, UserCheck, UserX, PersonStanding } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Badge } from './ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { User as FirebaseUser } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
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

type FormCharacter = CustomCharacterType;

type CharacterCreationFormProps = {
  gameData: GameData;
  initialCharacters?: FormCharacter[];
  onCharactersFinalized: (characters: FormCharacter[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  onUpdateCharacter: (characterId: string, details: { name?: string, gender?: string }, action: 'claim' | 'unclaim' | 'update') => void;
  currentUser: FirebaseUser | null;
};

type CharacterPreferences = {
  name?: string;
  vision?: string;
  gender?: string;
  age?: string;
  archetype?: string;
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
  onUpdateCharacter,
  currentUser,
}: CharacterCreationFormProps) {
  const [partySize, setPartySize] = useState(initialCharacters.length || 4);
  const [characters, setCharacters] = useState<FormCharacter[]>(initialCharacters);
  const [characterPrefs, setCharacterPrefs] = useState<Record<string, CharacterPreferences>>({});
  
  const [editingCharacter, setEditingCharacter] = useState<FormCharacter | null>(null);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(initialCharacters.length > 0);
  const { toast } = useToast();
  const formId = useId();

  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    // This effect syncs the internal state with props, useful for reloads.
    setCharacters(initialCharacters);
    if (initialCharacters.length > 0) {
      setHasGenerated(true);
    }
  }, [initialCharacters]);

   useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('game');
    setGameId(id);
  }, []);

  const updatePreference = (charId: string, field: keyof CharacterPreferences, value: string) => {
    setCharacterPrefs(prev => ({
        ...prev,
        [charId]: {
            ...prev[charId],
            [field]: value
        }
    }));
  };

  const getPartySuggestions = async () => {
    setIsGenerating(true);
    setHasGenerated(false); // Reset this flag

    const characterSlots = Array.from({ length: partySize }, (_, i) => ({
        id: `slot-${i}-${Date.now()}`,
        ...characterPrefs[`slot-${i}`]
    }));

    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: characterSlots,
        });

        const newCharacters: FormCharacter[] = result.characters.map(c => ({
            ...c,
            id: c.slotId,
            playerName: '',
            isCustom: false,
            claimedBy: '',
        }));

        if (gameId) {
            await updateWorldState({
                gameId: gameId,
                updates: { 'gameData.characters': newCharacters }
            });
        }
        
        setHasGenerated(true);

    } catch (error) {
        const err = error as Error;
        console.error("Failed to generate party:", err);
        toast({
            variant: "destructive",
            title: "Party Generation Failed",
            description: err.message || "Could not generate characters. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const regenerateCharacter = async (charToRegen: FormCharacter) => {
    setIsGenerating(true);
    const slotId = charToRegen.id;

    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: [{ id: slotId, ...characterPrefs[slotId] }],
            existingCharacters: characters.filter(c => c.id !== slotId).map(c => ({ name: c.name, description: c.description, archetype: c.archetype })),
        });
        
        const newCharData = result.characters[0];
        const newCharacter: FormCharacter = {
            ...newCharData,
            id: slotId,
            playerName: charToRegen.playerName, // Keep player name if it was set
            isCustom: false,
            claimedBy: charToRegen.claimedBy
        };

        const updatedCharacters = characters.map(c => c.id === slotId ? newCharacter : c);
        
        if (gameId) {
            await updateWorldState({
                gameId: gameId,
                updates: { 'gameData.characters': updatedCharacters }
            });
        }
        
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: 'Regeneration Failed', description: err.message });
    } finally {
        setIsGenerating(false);
    }
  }


  const handleClaimClick = (char: FormCharacter) => {
    setEditingCharacter(char);
    setEditName(char.name);
    setEditGender(char.gender || '');
  };

  const handleSaveClaim = () => {
    if (!editingCharacter) return;
    onUpdateCharacter(editingCharacter.id, { name: editName, gender: editGender }, 'claim');
    setEditingCharacter(null);
  };

  const handleUnclaim = (char: FormCharacter) => {
     onUpdateCharacter(char.id, {}, 'unclaim');
  };

  // Import the updateWorldState action
  const { updateWorldState } = require('@/app/actions');


  const isHost = currentUser?.uid === gameData.userId;

  const handleFinalize = () => {
    if (!hasGenerated) {
       toast({
        title: "Generate Your Party",
        description: "Please generate your party before starting the adventure.",
      });
      return;
    }
    onCharactersFinalized(characters);
  };

  const currentUserClaim = characters.find(c => c.claimedBy === currentUser?.uid);

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
      <Card className="w-full max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <UserPlus />
            Assemble Your Party
          </CardTitle>
          <CardDescription className="pt-2">
             {gameData.playMode === 'remote' ? 'Send the invite link to your friends, then have each player claim a character.' : 'Generate a party and get ready to play!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
             {gameData.playMode === 'remote' && gameId && hasGenerated && (
              <div className="mb-8">
                <ShareGameInvite gameId={gameId} />
              </div>
            )}
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
                      <Label htmlFor="party-size">Number of Players:</Label>
                      <Select value={String(partySize)} onValueChange={(val) => setPartySize(Number(val))}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2,3,4,5,6].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="w-full max-w-lg space-y-4">
                        <p className="text-sm text-muted-foreground">Optionally, provide a name or vision for any character slot.</p>
                        {Array.from({ length: partySize }, (_, i) => (
                             <Card key={`${formId}-slot-${i}`} className="p-3 bg-muted/30">
                                <div className="flex items-center gap-4">
                                     <Label className="w-24">Player {i + 1}</Label>
                                     <Input 
                                        placeholder="Preferred Name"
                                        className="border-dashed"
                                        value={characterPrefs[`slot-${i}`]?.name || ''}
                                        onChange={(e) => updatePreference(`slot-${i}`, 'name', e.target.value)}
                                    />
                                     <Input 
                                        placeholder="Character Vision (e.g., 'grumpy space marine')"
                                        className="border-dashed"
                                        value={characterPrefs[`slot-${i}`]?.vision || ''}
                                        onChange={(e) => updatePreference(`slot-${i}`, 'vision', e.target.value)}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                    <Button size="lg" onClick={getPartySuggestions} disabled={isGenerating} className="mt-6">
                      <Wand2 className={cn("mr-2 h-5 w-5", isGenerating && "animate-spin")} />
                      Generate Party
                    </Button>
                  </div>
                ) : isGenerating ? (
                   <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
                        <LoadingSpinner className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Crafting the party...</p>
                    </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {characters.map((char) => {
                      const isClaimedByCurrentUser = char.claimedBy === currentUser?.uid;
                      const isClaimedByOther = char.claimedBy && !isClaimedByCurrentUser;
                      const charSlotId = char.id;

                      return (
                        <Card key={char.id} className={cn("flex flex-col relative group transition-all", isClaimedByCurrentUser && "ring-2 ring-primary")}>
                          {isClaimedByCurrentUser && <Badge className="absolute -top-2 -right-2">You</Badge>}
                          
                          <CardHeader>
                             {char.claimedBy ? (
                                <p className="text-center font-bold text-lg">Claimed by {char.playerName}</p>
                             ) : (
                                <p className="text-center font-bold text-lg text-muted-foreground">Unclaimed</p>
                             )}
                          </CardHeader>

                          <CardContent className="flex-1 space-y-4">
                            <Tabs defaultValue="display" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 text-xs h-8">
                                    <TabsTrigger value="display">Generated</TabsTrigger>
                                    <TabsTrigger value="regen">Regenerate</TabsTrigger>
                                </TabsList>
                                <TabsContent value="display" className="pt-4">
                                     <CharacterDisplay char={char} />
                                </TabsContent>
                                <TabsContent value="regen" className="pt-4 space-y-3">
                                    <p className="text-xs text-muted-foreground text-center">Provide a new name or vision and regenerate just this character.</p>
                                    <Input 
                                        placeholder="New Name"
                                        value={characterPrefs[charSlotId]?.name || ''}
                                        onChange={(e) => updatePreference(charSlotId, 'name', e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <Textarea 
                                        placeholder="New Character Vision (e.g., 'optimistic medic with a dark secret')"
                                        value={characterPrefs[charSlotId]?.vision || ''}
                                        onChange={(e) => updatePreference(charSlotId, 'vision', e.target.value)}
                                        className="h-20 text-xs"
                                    />
                                    <Button size="sm" variant="secondary" className="w-full" onClick={() => regenerateCharacter(char)} disabled={isGenerating}>
                                        <RefreshCw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                                        Regenerate Character
                                    </Button>
                                </TabsContent>
                            </Tabs>
                          </CardContent>
                          
                          <CardFooter>
                            {isClaimedByCurrentUser ? (
                              <Button variant="outline" className="w-full" onClick={() => handleUnclaim(char)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Unclaim Character
                              </Button>
                            ) : (
                               <Button 
                                  className="w-full" 
                                  onClick={() => handleClaimClick(char)} 
                                  disabled={!!isClaimedByOther || !!currentUserClaim}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  {isClaimedByOther ? 'Claimed' : 'Claim this Character'}
                                </Button>
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
            <Button variant="ghost" size="sm" onClick={getPartySuggestions} disabled={isGenerating || isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Entire Party
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {editingCharacter && (
        <Dialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Your Character</DialogTitle>
                    <DialogDescription>
                        Finalize your character's name and gender before joining the adventure.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">Gender</Label>
                        <Select value={editGender} onValueChange={setEditGender}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Non-binary">Non-binary</SelectItem>
                                <SelectItem value="Agender">Agender</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingCharacter(null)}>Cancel</Button>
                    <Button onClick={handleSaveClaim}>Claim and Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

