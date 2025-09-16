
'use client';

import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { GameData, Character as CustomCharacterType } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput, Character as GenCharacterType, Skill, Stunt } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Edit, User, Cake, Shield, PlusCircle, X, ScrollText, Users, Star, GraduationCap, Sparkles as StuntIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


const normalizeToneBullets = (s: string) => {
  if (!s) return s;
  let out = s.trim();

  // If a bullet follows sentence punctuation (e.g., "...wits.- Pace: ..."), break the line.
  out = out.replace(/([.!?])\s*-\s+(?=[A-Z][^:]{1,40}:)/g, '$1\n- ');

  // If bullets still run together (e.g., "- Pace: …- Danger: …"), break them too.
  // Safe because it only targets patterns like "- Word:" (capitalized + colon).
  out = out.replace(/-\s+(?=[A-Z][^:]{1,40}:)/g, '\n- ');

  // Ensure a blank line before the first bullet list (helps Markdown start a list block).
  out = out.replace(/(Vibe:[^\n]*)(\n-)/i, '$1\n\n-');

  return out;
};


// Combine custom fields with generated ones for the form's character state
type FormCharacter = CustomCharacterType & Omit<Partial<GenCharacterType>, 'name' | 'description' | 'aspect'>;

type CharacterCreationFormProps = {
  gameData: GameData;
  onCharactersFinalized: (characters: FormCharacter[]) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
};

type CharacterPreferences = {
  gender?: string;
  age?: string;
  archetype?: string;
};

const getSkillDisplay = (rank: number) => {
    switch (rank) {
        case 1: return 'Average';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Great';
        default: return `+${rank}`;
    }
}

const CharacterDisplay = ({ char }: { char: FormCharacter }) => (
  <div className="space-y-4 text-left">
    <div>
        <h3 className="font-bold text-xl">{char.name}</h3>
        <p className="text-sm italic text-muted-foreground flex items-center gap-2">
            <Star className="h-3 w-3" />
            <span>"{char.aspect}"</span>
        </p>
        <p className="text-sm mt-1">{char.description}</p>
    </div>
    
    {char.skills && char.skills.length > 0 && (
      <div>
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><GraduationCap className="h-4 w-4"/> Skills</h4>
        <div className="flex flex-wrap gap-1">
          {char.skills.sort((a,b) => b.rank - a.rank).map(skill => (
            <Badge key={skill.name} variant="secondary" className="text-xs">
              {skill.name} ({getSkillDisplay(skill.rank)})
            </Badge>
          ))}
        </div>
      </div>
    )}

    {char.stunts && char.stunts.length > 0 && (
       <div>
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><StuntIcon className="h-4 w-4"/> Stunts</h4>
        <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {char.stunts.map(stunt => (
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
  onCharactersFinalized,
  generateCharacterSuggestions,
}: CharacterCreationFormProps) {
  const [characters, setCharacters] = useState<FormCharacter[]>(() => [
    {
      id: `player-0-${Date.now()}`,
      name: '',
      description: '',
      aspect: '',
      playerName: '',
      isCustom: false
    }
  ]);
  const [preferences, setPreferences] = useState<Record<string, CharacterPreferences>>({});
  const [isGeneratingParty, setIsGeneratingParty] = useState(false);
  const [individualLoading, setIndividualLoading] = useState<Record<string, boolean>>({});
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();
  const formId = useId();

  const handlePreferenceChange = (id: string, field: keyof CharacterPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      }
    }));
  };

  const getPartySuggestions = async () => {
    setIsGeneratingParty(true);
    setHasGenerated(true);

    const characterSlots = characters.map(char => ({
        id: char.id,
        ...(preferences[char.id] || {})
    }));

    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone,
            characterSlots: characterSlots,
        });

        const newCharacters = new Map(result.characters.map(c => [c.slotId, c]));

        setCharacters(prev => 
            prev.map(char => {
                const newCharData = newCharacters.get(char.id);
                 if (newCharData) {
                    // Preserve playerName while updating the rest
                    return {
                        ...newCharData,
                        id: char.id,
                        playerName: char.playerName, 
                        isCustom: false,
                        skills: newCharData.skills || [],
                        stunts: newCharData.stunts || [],
                    };
                }
                return char;
            })
        );
        
        // Update preferences for all characters based on what was generated
        const newPreferences: Record<string, CharacterPreferences> = {};
        result.characters.forEach(char => {
            newPreferences[char.slotId] = {
                gender: char.gender || '',
                age: char.age || '',
archetype: char.archetype || '',
            };
        });
        setPreferences(prev => ({ ...prev, ...newPreferences }));

    } catch (error) {
        const err = error as Error;
        console.error("Failed to generate party:", err);
        toast({
            variant: "destructive",
            title: "Party Generation Failed",
            description: err.message || "Could not generate characters. Please try again.",
        });
    } finally {
        setIsGeneratingParty(false);
    }
  };

  const regenerateCharacter = async (characterId: string) => {
    setIndividualLoading(prev => ({ ...prev, [characterId]: true }));
    try {
      const charPrefs = preferences[characterId] || {};
      const existingCharacters = characters
        .filter(c => c.id !== characterId && c.name)
        .map(c => ({
            name: c.name,
            archetype: c.archetype,
            description: c.description,
        }));
      
      const result = await generateCharacterSuggestions({
        setting: gameData.setting,
        tone: gameData.tone,
        characterSlots: [{ id: characterId, ...charPrefs }],
        existingCharacters: existingCharacters,
      });

      if (result.characters.length > 0) {
        const newChar = result.characters[0];
        setCharacters(prev =>
          prev.map(c => {
            if (c.id === characterId) {
                // Preserve playerName while updating the rest
                const existingPlayerName = c.playerName;
                return {
                    ...newChar,
                    id: c.id,
                    playerName: existingPlayerName, 
                    isCustom: false,
                    skills: newChar.skills || [],
                    stunts: newChar.stunts || [],
                };
            }
            return c;
          })
        );

        // Update preferences for the regenerated character
        setPreferences(prev => ({
          ...prev,
          [characterId]: {
            gender: newChar.gender || '',
            age: newChar.age || '',
            archetype: newChar.archetype || '',
          }
        }));
      } else {
        throw new Error("The AI failed to return a character.");
      }

    } catch (error) {
       const err = error as Error;
       console.error("Failed to regenerate character:", err);
       toast({
         variant: "destructive",
         title: "Character Generation Failed",
         description: err.message || "Could not generate a character suggestion.",
       });
    } finally {
      setIndividualLoading(prev => ({ ...prev, [characterId]: false }));
    }
  };

  const handlePlayerNameChange = (id: string, name: string) => {
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, playerName: name } : c)));
  };
  
  const handleCustomFieldChange = (id: string, field: 'name' | 'aspect' | 'description', value: string) => {
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, [field]: value, isCustom: true } : c)));
  }

  const addNewPlayer = () => {
    const newPlayer: FormCharacter = {
      id: `player-${characters.length}-${Date.now()}`,
      name: '',
      description: '',
      aspect: '',
      playerName: '',
      isCustom: false
    };
    
    setCharacters(prev => [...prev, newPlayer]);

    if (hasGenerated) {
      // If we've already generated, create a new character for the new player immediately.
      regenerateCharacter(newPlayer.id);
    }
  };

  const removePlayer = (id: string) => {
    if (characters.length > 1) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      setPreferences(prev => {
        const newPrefs = {...prev};
        delete newPrefs[id];
        return newPrefs;
      });
    }
  };

  const allReady = characters.every(c => c.name && c.playerName);

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
        description: "Please make sure every player has a name and a character.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full p-4 bg-background">
      <Card className="w-full max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <UserPlus />
            Assemble Your Party
          </CardTitle>
          <CardDescription className="pt-2">
            Review the story summary, add players, then generate a unique party. You can regenerate individual characters or customize them.
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
                            {gameData.setting}
                          </ReactMarkdown>
                        </section>
                        <section className="prose prose-sm dark:prose-invert max-w-none">
                          <h2 className="mt-0">Tone</h2>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                           {normalizeToneBullets(gameData.tone)}
                          </ReactMarkdown>
                        </section>
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>
              <TabsContent value="party">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char, index) => (
                    <Card key={char.id} className="flex flex-col relative group">
                      {characters.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 z-10 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive"
                          onClick={() => removePlayer(char.id)}
                          aria-label="Remove player"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <CardHeader>
                        <Input
                          placeholder={`Player ${index + 1} Name`}
                          value={char.playerName}
                          onChange={e => handlePlayerNameChange(char.id, e.target.value)}
                          className="text-center font-bold text-lg"
                          aria-label={`Player ${index + 1} Name`}
                        />
                      </CardHeader>
                      <CardContent className="flex-1">
                        <Tabs defaultValue="generate" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="generate"><Wand2 className="mr-2 h-4 w-4"/>Generated</TabsTrigger>
                            <TabsTrigger value="custom"><Edit className="mr-2 h-4 w-4"/>Custom</TabsTrigger>
                          </TabsList>
                          <TabsContent value="generate" className="pt-4">
                            <div className="space-y-2 mb-4">
                              <Label>Regeneration Preferences (Optional)</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Select value={preferences[char.id]?.gender || ''} onValueChange={value => handlePreferenceChange(char.id, 'gender', value)}>
                                      <SelectTrigger className="pl-8">
                                        <SelectValue placeholder="Gender" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                                        <SelectItem value="Gender-fluid">Gender-fluid</SelectItem>
                                        <SelectItem value="Agender">Agender</SelectItem>
                                        <SelectItem value="Other">Other / Not Specified</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="relative">
                                    <Cake className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Age" className="pl-8" value={preferences[char.id]?.age || ''} onChange={e => handlePreferenceChange(char.id, 'age', e.target.value)} />
                                </div>
                                <div className="relative">
                                    <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Archetype" className="pl-8" value={preferences[char.id]?.archetype || ''} onChange={e => handlePreferenceChange(char.id, 'archetype', e.target.value)} />
                                </div>
                              </div>
                            </div>
                            <div className="min-h-[220px]">
                            {isGeneratingParty || individualLoading[char.id] ? (
                              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
                                  <LoadingSpinner className="h-8 w-8 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">{isGeneratingParty ? 'Crafting the party...' : 'Crafting a hero...'}</p>
                              </div>
                            ) : char.name && !char.isCustom ? (
                               <CharacterDisplay char={char} />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
                                <Dices className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {hasGenerated ? "Regenerate to see character" : "Waiting for party generation..."}
                                </p>
                              </div>
                            )}
                            </div>
                            {hasGenerated && (
                              <Button onClick={() => regenerateCharacter(char.id)} className="w-full mt-4" variant="outline" disabled={isGeneratingParty || individualLoading[char.id]}>
                                <RefreshCw className={cn("mr-2 h-4 w-4", individualLoading[char.id] && "animate-spin")} />
                                Regenerate
                              </Button>
                            )}
                          </TabsContent>
                          <TabsContent value="custom" className="pt-4">
                              <div className="space-y-2 h-[228px] overflow-y-auto pr-2">
                                  <Label htmlFor={`${formId}-${char.id}-name`}>Name</Label>
                                  <Input id={`${formId}-${char.id}-name`} value={char.name} onChange={(e) => handleCustomFieldChange(char.id, 'name', e.target.value)} placeholder="Character Name" />
                                  <Label htmlFor={`${formId}-${char.id}-aspect`}>Aspect</Label>
                                  <Input id={`${formId}-${char.id}-aspect`} value={char.aspect} onChange={(e) => handleCustomFieldChange(char.id, 'aspect', e.target.value)} placeholder="e.g., 'Haunted by the ghost of a cyborg...'" />
                                  <Label htmlFor={`${formId}-${char.id}-desc`}>Description</Label>
                                  <Textarea id={`${formId}-${char.id}-desc`} value={char.description} onChange={(e) => handleCustomFieldChange(char.id, 'description', e.target.value)} placeholder="A short description." className="h-24 resize-none" />
                              </div>
                              <div className="w-full mt-4 text-xs text-center text-muted-foreground italic">
                                  Custom characters are saved automatically.
                              </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="group flex flex-col items-center justify-center border-2 border-dashed bg-card hover:border-primary hover:bg-primary transition-colors cursor-pointer" onClick={addNewPlayer} >
                      <CardContent className="p-6 text-center">
                          <div className="h-auto p-4 flex flex-col gap-2 items-center text-primary group-hover:text-primary-foreground">
                              <PlusCircle className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                              <span className="font-semibold">Add New Player</span>
                          </div>
                      </CardContent>
                  </Card>
                </div>
                {!hasGenerated && (
                  <div className="flex justify-center pt-8">
                    <Button size="lg" onClick={getPartySuggestions} disabled={isGeneratingParty}>
                      <Wand2 className={cn("mr-2 h-5 w-5", isGeneratingParty && "animate-spin")} />
                      Generate Party
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          <Button
            size="lg"
            onClick={handleFinalize}
            disabled={!allReady || isGeneratingParty || !hasGenerated}
            className="font-headline text-xl"
          >
            <Dices className="mr-2 h-5 w-5" />
            Start Adventure
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
