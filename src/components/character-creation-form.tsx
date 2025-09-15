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
import type { GameData, Character } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw, UserPlus, Edit, User, Cake, Shield, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type CharacterCreationFormProps = {
  gameData: GameData;
  onCharactersFinalized: (characters: Character[]) => void;
  generateCharacterSuggestions: (input: Omit<GenerateCharacterInput, 'count'> & { count: number }) => Promise<GenerateCharacterOutput>;
};

type CharacterPreferences = {
  gender?: string;
  age?: string;
  archetype?: string;
};

export function CharacterCreationForm({
  gameData,
  onCharactersFinalized,
  generateCharacterSuggestions,
}: CharacterCreationFormProps) {
  const [characters, setCharacters] = useState<Character[]>(() => [
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
    try {
      // NOTE: We are not sending individual preferences for the batch generation
      // to allow the AI to create a more balanced and diverse party.
      const result = await generateCharacterSuggestions({
        setting: gameData.setting,
        tone: gameData.tone,
        count: characters.length,
      });

      if (result.characters.length < characters.length) {
        throw new Error("The AI didn't generate enough characters. Please try again.");
      }

      setCharacters(prev =>
        prev.map((c, index) => {
          const newChar = result.characters[index];
          return { ...c, name: newChar.name, description: newChar.description, aspect: newChar.aspect, isCustom: false };
        })
      );
    } catch (error) {
       const err = error as Error;
       console.error("Failed to get party suggestions:", err);
       toast({
         variant: "destructive",
         title: "Party Generation Failed",
         description: err.message || "Could not generate character suggestions.",
       });
       setHasGenerated(false);
    } finally {
        setIsGeneratingParty(false);
    }
  };

  const regenerateCharacter = async (characterId: string) => {
    setIndividualLoading(prev => ({ ...prev, [characterId]: true }));
    try {
      const charPrefs = preferences[characterId] || {};
      const result = await generateCharacterSuggestions({
        setting: gameData.setting,
        tone: gameData.tone,
        count: 1,
        ...charPrefs,
      });
      const newChar = result.characters[0];
      setCharacters(prev =>
        prev.map(c =>
          c.id === characterId
            ? { ...c, name: newChar.name, description: newChar.description, aspect: newChar.aspect, isCustom: false }
            : c
        )
      );
    } catch (error) {
       const err = error as Error;
       console.error("Failed to regenerate character:", err);
       toast({
         variant: "destructive",
         title: "Character Regeneration Failed",
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
    const newPlayer: Character = {
      id: `player-${characters.length}-${Date.now()}`,
      name: '',
      description: '',
      aspect: '',
      playerName: '',
      isCustom: false
    };

    if (hasGenerated) {
      // If we've already generated, create a new character for the new player immediately.
      setCharacters(prev => [...prev, newPlayer]);
      regenerateCharacter(newPlayer.id);
    } else {
       setCharacters(prev => [...prev, newPlayer]);
    }
  };

  const removePlayer = (id: string) => {
    if (characters.length > 1) {
      setCharacters(prev => prev.filter(c => c.id !== id));
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
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-background">
      <Card className="w-full max-w-7xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <UserPlus />
            Assemble Your Party
          </CardTitle>
          <CardDescription className="pt-2">
            Add players, then generate a unique party. You can regenerate individual characters or customize them.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      {isGeneratingParty || individualLoading[char.id] ? (
                         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-48">
                            <LoadingSpinner className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{isGeneratingParty ? 'Crafting a party...' : 'Crafting a hero...'}</p>
                         </div>
                      ) : char.name && !char.isCustom ? (
                        <div className="space-y-2 h-48">
                          <h3 className="font-bold text-xl">{char.name}</h3>
                          <p className="text-sm italic text-muted-foreground">"{char.aspect}"</p>
                          <p className="text-sm">{char.description}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-48">
                           <Dices className="h-8 w-8 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground">
                             Waiting for party generation...
                           </p>
                        </div>
                      )}
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
             <Card className="flex flex-col items-center justify-center border-2 border-dashed bg-card hover:bg-muted transition-colors">
                <CardContent className="p-6 text-center">
                    <Button variant="ghost" className="h-auto p-4 flex flex-col gap-2" onClick={addNewPlayer} disabled={isGeneratingParty}>
                        <PlusCircle className="h-10 w-10 text-muted-foreground" />
                        <span className="text-muted-foreground font-semibold">Add New Player</span>
                    </Button>
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

    