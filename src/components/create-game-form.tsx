'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoadingSpinner } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

type CreateGameFormProps = {
  onSubmit: (request: string) => void;
  isLoading: boolean;
};

export function CreateGameForm({ onSubmit, isLoading }: CreateGameFormProps) {
  const [request, setRequest] = useState('');
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'landing-background');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.trim()) {
      onSubmit(request.trim());
    }
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
            Your personal AI Game Master. What adventure awaits?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="e.g., 'A neon-fantasy heist...'"
              aria-label="Your adventure idea"
              disabled={isLoading}
              className="h-12 text-center text-base"
            />
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
