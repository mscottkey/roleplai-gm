

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
import { Button } from './ui/button';
import { ArrowDown, Volume2, Pause } from 'lucide-react';
import { cn, formatDialogue, cleanMarkdownForSpeech } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { User as FirebaseUser } from 'firebase/auth';
import type { Voice } from '@/hooks/use-speech-synthesis';
import { ChatInterface } from './chat-interface';


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
  onRegenerateStoryline: () => void;
  currentUser: FirebaseUser | null;
  // TTS Props
  isSpeaking: boolean;
  isPaused: boolean;
  isAutoPlayEnabled: boolean;
  isTTSSupported: boolean;
  onPlay: (text?: string) => void;
  onPause: () => void;
  onStop: () => void;
  onSetAutoPlay: (enabled: boolean) => void;
  // Voice Selection
  voices: Voice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voiceURI: string) => boolean;
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
  onRegenerateStoryline,
  currentUser,
  // TTS props
  isSpeaking,
  isPaused,
  isAutoPlayEnabled,
  isTTSSupported,
  onPlay,
  onPause,
  onStop,
  onSetAutoPlay,
  // Voice Selection
  voices,
  selectedVoice,
  onSelectVoice
}: GameViewProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const storyContentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const isInitialStoryLoad = useRef(true);
  
  const [showSmartScroll, setShowSmartScroll] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const viewport = storyRef.current?.querySelector('div');
    if (viewport) {
      if (isInitialStoryLoad.current) {
        viewport.scrollTo({ top: 0 });
        isInitialStoryLoad.current = false;
      } else {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [storyMessages]);
  
  const handleSmartScroll = () => {
    const viewport = storyRef.current?.querySelector('div');
    const content = storyContentRef.current;
    if (!viewport || !content) return;

    const headings = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    const scrollBottom = viewport.scrollTop + viewport.clientHeight;
    
    // Find the next heading that is below the current viewport bottom
    const nextHeading = headings.find(h => h.offsetTop > viewport.scrollTop + 20);

    if (nextHeading) {
      viewport.scrollTo({ top: nextHeading.offsetTop, behavior: 'smooth' });
    } else {
      // If no next heading, either scroll to bottom or back to top
      if (scrollBottom < viewport.scrollHeight - 50) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      } else {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleScroll = () => {
    const viewport = storyRef.current?.querySelector('div');
    if (viewport) {
        const isScrollable = viewport.scrollHeight > viewport.clientHeight;
        const isAtBottom = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + 50;
        setShowSmartScroll(isScrollable && !isAtBottom);
    }
  };

  useEffect(() => {
    const viewport = storyRef.current?.querySelector('div');
    if (viewport) {
        viewport.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, [storyMessages]); // Re-check when content changes

  const handleSectionPlay = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest('button[data-play-id]');

    if (!button) return;
    
    const playId = button.getAttribute('data-play-id');
    if (!playId) return;

    const contentElement = document.getElementById(playId);
    if (!contentElement) return;

    if (isSpeaking && currentlyPlayingId === playId) {
      if (isPaused) {
        onPlay(); // Resume
      } else {
        onPause();
      }
    } else {
      const textToPlay = cleanMarkdownForSpeech(contentElement.innerText);
      onPlay(textToPlay);
      setCurrentlyPlayingId(playId);
    }
  };
  
  useEffect(() => {
    if (!isSpeaking) {
      setCurrentlyPlayingId(null);
    }
  }, [isSpeaking]);

  const isPostCharacterCreation = messages.length === 1 && messages[0].role === 'system' && storyMessages.length > 0;
  
  const StoryContent = () => (
    <div className="p-12 text-foreground" ref={storyContentRef} onClick={handleSectionPlay}>
        <div className="prose prose-lg dark:prose-invert prose-headings:text-primary prose-headings:font-headline space-y-8">
            {storyMessages.map((message, index) => {
              const contentWithDialogueAndButtons = formatDialogue(message.content, `msg-${index}`);
              
              const PlayIcon = isSpeaking && !isPaused && currentlyPlayingId === `msg-${index}-full` ? Pause : Volume2;
              
              return (
                <div key={index} className="relative group/message">
                   {isTTSSupported && (
                    <button 
                      className="tts-play-button" 
                      data-play-id={`msg-${index}-full`}
                      data-state={isSpeaking && currentlyPlayingId === `msg-${index}-full` ? 'playing' : 'idle'}
                      aria-label="Play section"
                    >
                      <PlayIcon />
                    </button>
                  )}
                  <div id={`msg-${index}-full`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                      {contentWithDialogueAndButtons}
                    </ReactMarkdown>
                  </div>
                  {index < storyMessages.length - 1 && <Separator className="mt-8" />}
                </div>
              )
            })}
        </div>
    </div>
  );
  
  const LocalPlayerGrid = () => (
    <div className="p-4 border-b bg-card">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
        {characters.map(char => (
          <Button
            key={char.id}
            variant={activeCharacter?.id === char.id ? "default" : "outline"}
            className="h-auto min-h-20 py-2 flex-col gap-1 items-center justify-center text-center whitespace-normal"
            onClick={() => setActiveCharacter(char)}
          >
            <span className="font-bold text-xs sm:text-sm leading-tight break-words">{char.playerName}</span>
            <span className="text-xs text-muted-foreground leading-tight break-words">({char.name})</span>
          </Button>
        ))}
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
        <div className="h-full hidden md:flex flex-col overflow-hidden bg-background relative">
          <ScrollArea className="flex-1" ref={storyRef}>
              <StoryContent />
          </ScrollArea>
          {showSmartScroll && (
              <Button 
                size="icon"
                className="absolute bottom-6 right-6 z-10 rounded-full h-12 w-12 bg-primary/80 backdrop-blur-sm shadow-lg animate-[bounce-down_2s_ease-out_infinite]"
                onClick={handleSmartScroll}
              >
                  <ArrowDown className="h-6 w-6" />
              </Button>
          )}
        </div>
      )}

      {/* Right Pane: Game Controls */}
      <div className="h-full flex flex-col overflow-hidden">
          {gameData.playMode === 'local' && <LocalPlayerGrid />}
           <GameControls
              messages={isPostCharacterCreation ? storyMessages.map((m, i) => ({ id: `story-${i}`, role: 'assistant', content: m.content })) : messages}
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
              onRegenerateStoryline={onRegenerateStoryline}
              currentUser={currentUser}
              // TTS Props
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              isAutoPlayEnabled={isAutoPlayEnabled}
              isTTSSupported={isTTSSupported}
              onPlay={onPlay}
              onPause={onPause}
              onStop={onStop}
              onSetAutoPlay={onSetAutoPlay}
              // Voice Selection
              voices={voices}
              selectedVoice={selectedVoice}
              onSelectVoice={onSelectVoice}
            />
      </div>
    </div>
  );
}
