'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameControls } from '@/components/game-controls';
import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type GameViewProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function GameView({
  messages,
  onSendMessage,
  isLoading,
  gameData,
  characters,
  activeCharacter,
  setActiveCharacter,
  mechanicsVisibility,
  setMechanicsVisibility,
}: GameViewProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'landing-background');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

  useEffect(() => {
    if (storyRef.current) {
        const viewport = storyRef.current.querySelector('div');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [lastAssistantMessage]);


  return (
    <div className="grid md:grid-cols-2 h-screen bg-background overflow-hidden">
      {/* Left Pane: Visual Story Board */}
      <div className="relative h-full hidden md:flex flex-col overflow-hidden">
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
        <div className="absolute inset-0 bg-background/90" />
        <ScrollArea className="relative flex-1" ref={storyRef}>
            <div className="p-12 text-foreground">
                <div className="prose prose-lg dark:prose-invert prose-headings:text-primary prose-headings:font-headline">
                    {lastAssistantMessage && (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {lastAssistantMessage.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </ScrollArea>
      </div>

      {/* Right Pane: Game Controls */}
      <div className="h-full flex flex-col overflow-hidden">
          <GameControls
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            gameData={gameData}
            characters={characters}
            activeCharacter={activeCharacter}
            setActiveCharacter={setActiveCharacter}
            mechanicsVisibility={mechanicsVisibility}
            setMechanicsVisibility={setMechanicsVisibility}
          />
      </div>
    </div>
  );
}
