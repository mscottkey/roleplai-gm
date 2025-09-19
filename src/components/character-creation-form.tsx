
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
import { Wand2, Dices, RefreshCw, UserPlus, Edit, User, Cake, Shield, PlusCircle, X, ScrollText, Users, Star, GraduationCap, Sparkles as StuntIcon, BrainCircuit, UserCheck, UserX } from 'lucide-react';
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
  onClaimCharacter: (characterId: string, claim: boolean) => void;
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
  onClaimCharacter,
  currentUser,
}: CharacterCreationFormProps) {
  const [partySize, setPartySize] = useState(initialCharacters.length || 4);
  const [characters, setCharacters] = useState<FormCharacter[]>(initialCharacters);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(initialCharacters.length > 0);
  const { toast } = useToast();
  
  useEffect(() => {
    // This effect syncs the internal state with props, useful for reloads.
    setCharacters(initialCharacters);
    if (initialCharacters.length > 0) {
      setHasGenerated(true);
    }
  }, [initialCharacters]);


  const getPartySuggestions = async () => {
    setIsGenerating(true);
    setHasGenerated(false); // Reset this flag

    const characterSlots = Array.from({ length: partySize }, (_, i) => ({
        id: `slot-${i}-${Date.now()}`,
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

        // Replace the current characters in the database
        await updateWorldState({
            gameId: (new URLSearchParams(window.location.search)).get('game')!,
            updates: { 'gameData.characters': newCharacters }
        });
        
        // The onSnapshot listener will update the local state.
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

  // Import the updateWorldState action
  const { updateWorldState } = require('@/app/actions');


  const allReady = characters.every(c => c.claimedBy);

  const handleFinalize = () => {
    if (!hasGenerated) {
       toast({
        title: "Generate Your Party",
        description: "Please generate your party before starting the adventure.",
      });
      return;
    }
    if (allReady) {
      onCharactersFinalized(characters);
    } else {
      toast({
        variant: "destructive",
        title: "Not Ready Yet",
        description: "Please make sure every character has been claimed by a player.",
      });
    }
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
            Generate a new party and have each player claim their character.
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
                    <div className="flex items-center gap-4">
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
                    <Button size="lg" onClick={getPartySuggestions} disabled={isGenerating}>
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
                          <CardContent className="flex-1">
                            <CharacterDisplay char={char} />
                          </CardContent>
                          <CardFooter>
                            {isClaimedByCurrentUser ? (
                              <Button variant="outline" className="w-full" onClick={() => onClaimCharacter(char.id, false)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Unclaim Character
                              </Button>
                            ) : (
                               <Button 
                                  className="w-full" 
                                  onClick={() => onClaimCharacter(char.id, true)} 
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
        <CardFooter className="flex-col gap-4 justify-center pt-6">
          <Button
            size="lg"
            onClick={handleFinalize}
            disabled={!allReady || isGenerating || !hasGenerated || isLoading}
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
                  Start Adventure
                </>
              )}
          </Button>
          <Button variant="ghost" size="sm" onClick={getPartySuggestions} disabled={isGenerating || isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Entire Party
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
