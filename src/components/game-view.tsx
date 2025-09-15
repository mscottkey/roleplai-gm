'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameControls } from '@/components/game-controls';
import type { GameData, Message, MechanicsVisibility, Character, StoryMessage } from '@/app/lib/types';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import { Separator } from './ui/separator';
import { formatDialogue } from '@/lib/utils';

type GameViewProps = {
  messages: Message[];
  storyMessages: StoryMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  worldState: WorldState | null;
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function GameView({
  messages,
  storyMessages,
  onSendMessage,
  isLoading,
  gameData,
  worldState,
  characters,
  activeCharacter,
  setActiveCharacter,
  mechanicsVisibility,
  setMechanicsVisibility,
}: GameViewProps) {
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyRef.current) {
        const viewport = storyRef.current.querySelector('div');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [storyMessages]);


  return (
    <div className="grid md:grid-cols-2 h-screen bg-background overflow-hidden">
      {/* Left Pane: Visual Story Board */}
      <div className="h-full hidden md:flex flex-col overflow-hidden bg-background">
        <ScrollArea className="flex-1" ref={storyRef}>
            <div className="p-12 text-foreground">
                <div className="prose prose-lg dark:prose-invert prose-headings:text-primary prose-headings:font-headline space-y-8">
                    {storyMessages.map((message, index) => {
                      const contentWithDialogue = formatDialogue(message.content);
                      return (
                        <div key={index}>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                            {contentWithDialogue}
                          </ReactMarkdown>
                          {index < storyMessages.length - 1 && <Separator className="mt-8" />}
                        </div>
                      )
                    })}
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
            worldState={worldState}
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
