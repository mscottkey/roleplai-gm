'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoadingSpinner } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { GameData, Character } from '@/app/lib/types';
import type { GenerateCharacterOutput, GenerateCharacterInput } from '@/ai/schemas/generate-character-schemas';
import { Wand2, Dices, RefreshCw } from 'lucide-react';


type CharacterCreationFormProps = {
  gameData: GameData;
  onCharacterSelect: (character: Character) => void;
  generateCharacterSuggestions: (input: GenerateCharacterInput) => Promise<GenerateCharacterOutput>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export function CharacterCreationForm({
  gameData,
  onCharacterSelect,
  generateCharacterSuggestions,
  isLoading,
  setIsLoading
}: CharacterCreationFormProps) {
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const { toast } = useToast();
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'landing-background');

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
        const result = await generateCharacterSuggestions({
            setting: gameData.setting,
            tone: gameData.tone
        });
        setSuggestions(result.characters);
    } catch (error) {
        const err = error as Error;
        console.error("Failed to get character suggestions:", err);
        toast({
            variant: "destructive",
            title: "Character Generation Failed",
            description: err.message || "Could not generate character suggestions.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  // Fetch suggestions on initial component load
  useEffect(() => {
    getSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full p-4">
      {backgroundImage && (
        <Image
          src={backgroundImage.imageUrl}
          alt={backgroundImage.description}
          data-ai-hint={backgroundImage.imageHint}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary flex items-center justify-center gap-4">
            <Dices />
            Choose Your Hero
          </CardTitle>
          <CardDescription className="pt-2">
            Select one of the following characters to begin your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && suggestions.length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <LoadingSpinner className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">The AI is crafting some heroes for your story...</p>
             </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {suggestions.map((char, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{char.name}</CardTitle>
                    <CardDescription className="italic">"{char.aspect}"</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{char.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => onCharacterSelect(char)} className="w-full">
                      Play as {char.name.split(' ')[0]}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
             <Button
              variant="outline"
              onClick={getSuggestions}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Suggestions
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
