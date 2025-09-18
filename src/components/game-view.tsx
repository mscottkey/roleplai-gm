
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';

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
  onUndo: () => void;
  canUndo: boolean;
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
  onUndo,
  canUndo,
}: GameViewProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  
  const { speak, pause, resume, cancel, isSpeaking, isPaused, supported } = useSpeechSynthesis({
    onEnd: () => {
      // Implement playlist logic here if needed in the future
    }
  });

  const lastMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    if (storyRef.current) {
        const viewport = storyRef.current.querySelector('div');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [storyMessages]);
  
  const cleanForSpeech = (text: string) => text.replace(/\*\*.*?\*\*:/g, '').replace(/[*_`#]/g, '');

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (isAutoPlayEnabled && lastMessage && lastMessage.role === 'assistant' && lastMessage !== lastMessageRef.current) {
      const cleanedText = cleanForSpeech(lastMessage.content);
      if (cleanedText.trim()) {
        speak(cleanedText);
      }
      lastMessageRef.current = lastMessage;
    }
  }, [messages, speak, isAutoPlayEnabled]);
  
  const handlePlayAll = () => {
    if (isPaused) {
      resume();
    } else if (!isSpeaking) {
      const storyText = storyMessages.map(m => cleanForSpeech(m.content)).join('\n\n');
      if (storyText.trim()) {
        speak(storyText);
      }
    }
  }

  const StoryContent = () => (
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
  );

  return (
    <div className="grid md:grid-cols-2 h-screen bg-background overflow-hidden">
      {isMobile ? (
        <Sheet open={isStoryOpen} onOpenChange={setIsStoryOpen}>
          <SheetContent side="left" className="w-full max-w-full p-0">
             <SheetHeader className="p-4 border-b">
               <SheetTitle className="font-headline text-primary">Visual Storyboard</SheetTitle>
             </SheetHeader>
             <ScrollArea className="h-full">
                <StoryContent />
             </ScrollArea>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="h-full hidden md:flex flex-col overflow-hidden bg-background">
          <ScrollArea className="flex-1" ref={storyRef}>
              <StoryContent />
          </ScrollArea>
        </div>
      )}

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
            onOpenStory={() => setIsStoryOpen(true)}
            onUndo={onUndo}
            canUndo={canUndo}
            // TTS Props
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            isAutoPlayEnabled={isAutoPlayEnabled}
            onPlay={handlePlayAll}
            onPause={pause}
            onStop={cancel}
            onSetAutoPlay={setIsAutoPlayEnabled}
            isTTSSupported={supported}
          />
      </div>
    </div>
  );
}
