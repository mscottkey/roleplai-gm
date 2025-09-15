'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Users } from 'lucide-react';

type PlayerCountFormProps = {
  onSubmit: (count: number) => void;
};

export function PlayerCountForm({ onSubmit }: PlayerCountFormProps) {
  const [playerCount, setPlayerCount] = useState<string>('1');
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'landing-background');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseInt(playerCount, 10));
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full">
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
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-primary">RoleplAI GM</CardTitle>
          <CardDescription className="pt-2">
            How many players are joining the adventure?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={playerCount} onValueChange={setPlayerCount}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select number of players" />
                </SelectTrigger>
                <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                         <SelectItem key={num} value={String(num)}>
                            {num} Player{num > 1 ? 's' : ''}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button type="submit" className="w-full h-12">
                Assemble Party
                <Users className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
