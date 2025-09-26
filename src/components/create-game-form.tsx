
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/icons';
import { ArrowRight, Users, User, Dices } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { genres, type Genre } from '@/lib/genres';
import { promptsByGenre } from '@/lib/prompts';
import { cn } from '@/lib/utils';

type CreateGameFormProps = {
  onSubmit: (request: string, playMode: 'local' | 'remote') => void;
  isLoading: boolean;
};

export function CreateGameForm({ onSubmit, isLoading }: CreateGameFormProps) {
  const [request, setRequest] = useState('');
  const [playMode, setPlayMode] = useState<'local' | 'remote'>('remote');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.trim()) {
      onSubmit(request.trim(), playMode);
    }
  };

  const handleGenreClick = (genre: Genre) => {
    const prompts = promptsByGenre[genre];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setRequest(randomPrompt);
  };
  
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setRequest(textarea.value);
  };


  return (
    <div className="flex items-center justify-center min-h-full w-full bg-background p-4">
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex justify-center items-center gap-3">
            Create a New Adventure
          </CardTitle>
          <CardDescription className="pt-2">
            What kind of story do you want to tell, and how do you want to play?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block w-full font-semibold">1. Choose your play style</Label>
              <RadioGroup value={playMode} onValueChange={(v) => setPlayMode(v as 'local' | 'remote')} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="remote" id="mode-remote" className="peer sr-only" />
                  <Label htmlFor="mode-remote" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Users className="mb-3 h-6 w-6" />
                    Remote
                    <span className="text-xs text-muted-foreground mt-1 text-center">Online Multiplayer</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="local" id="mode-local" className="peer sr-only" />
                  <Label htmlFor="mode-local" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <User className="mb-3 h-6 w-6" />
                    Local
                    <span className="text-xs text-muted-foreground mt-1 text-center">Hot Seat / Solo</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-center block w-full font-semibold">2. Describe your adventure</Label>
              <Textarea
                value={request}
                onChange={handleInput}
                placeholder="e.g., 'A neon-fantasy heist...'"
                aria-label="Your adventure idea"
                disabled={isLoading}
                className="h-auto text-center text-base resize-none overflow-hidden min-h-[3rem]"
                rows={1}
              />
              <div className="space-y-2">
                 <p className="text-center text-xs text-muted-foreground">...or get inspired by a genre:</p>
                 <div className="flex flex-wrap justify-center gap-2">
                    {genres.map((genre) => (
                        <Button 
                            key={genre} 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleGenreClick(genre)}
                            disabled={isLoading}
                            className="text-xs"
                        >
                            <Dices className="mr-2 h-3 w-3" />
                            {genre}
                        </Button>
                    ))}
                 </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading || !request.trim()}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
                  Conjuring World...
                </>
              ) : (
                <>
                  Start Adventure
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
