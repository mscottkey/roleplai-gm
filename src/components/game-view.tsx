

'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameControls } from '@/components/game-controls';
import type { GameData, Message, MechanicsVisibility, Character, StoryMessage, SessionStatus } from '@/app/lib/types';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import type { CampaignStructure } from '@/ai/schemas/campaign-structure-schemas';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ArrowDown } from 'lucide-react';
import { formatDialogue } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { User as FirebaseUser } from 'firebase/auth';
import type { Voice } from '@/hooks/use-speech-synthesis';
import { extractProseForTTS } from '@/lib/tts';


type GameViewProps = {
  messages: Message[];
  storyMessages: StoryMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  worldState: WorldState | null;
  campaignStructure: CampaignStructure | null;
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
  onUndo: () => void;
  canUndo: boolean;
  onRegenerateStoryline: () => void;
  currentUser: FirebaseUser | null;
  // Session Status
  sessionStatus: SessionStatus;
  onUpdateStatus: (status: SessionStatus) => void;
  onConfirmEndCampaign: () => void;
  // TTS Props
  isSpeaking: boolean;
  isPaused: boolean;
  isAutoPlayEnabled: boolean;
  isTTSSupported: boolean;
  onPlay: (text?: string, onBoundary?: (e: SpeechSynthesisEvent) => void) => void;
  onPause: () => void;
  onStop: () => void;
  onSetAutoPlay: (enabled: boolean) => void;
  // Voice Selection
  voices: Voice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voiceURI: string) => boolean;
  ttsVolume: 'low' | 'med' | 'high';
  onCycleTtsVolume: () => void;
};

export function GameView({
  messages,
  storyMessages,
  onSendMessage,
  isLoading,
  gameData,
  worldState,
  campaignStructure,
  characters,
  activeCharacter,
  setActiveCharacter,
  mechanicsVisibility,
  setMechanicsVisibility,
  onUndo,
  canUndo,
  onRegenerateStoryline,
  currentUser,
  sessionStatus,
  onUpdateStatus,
  onConfirmEndCampaign,
  ...ttsProps
}: GameViewProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const storyContentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  
  const [showSmartScroll, setShowSmartScroll] = useState(false);

  useEffect(() => {
    const viewport = storyRef.current?.querySelector('div');
    if (viewport) {
      // On the very first render, scroll to the top. This effect only runs once.
      viewport.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []); // Empty dependency array ensures this runs only once on mount
  
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

  const StoryContent = () => {
    let charOffset = 0;

    const CustomParagraph: React.FC<React.PropsWithChildren<any>> = ({ children, node }) => {
      const currentOffset = charOffset;
      // Crude but effective way to estimate text length for offset
      const textContent = node.children.map((child: any) => child.value || '').join('');
      charOffset += textContent.length + 2; // +2 for newline

      return <div data-char-offset={currentOffset}>{children}</div>;
    };
    
    const components: Components = {
      p: CustomParagraph,
    };
    
    return (
      <div className="p-12 text-foreground" ref={storyContentRef}>
          <div className="prose prose-lg dark:prose-invert prose-headings:text-primary prose-headings:font-headline space-y-8">
              {storyMessages.map((message, index) => {
                const contentWithDialogue = formatDialogue(message.content);
                
                return (
                  <div key={index} className="relative group/message">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkBreaks]} 
                      rehypePlugins={[rehypeRaw]}
                      components={components}
                    >
                        {contentWithDialogue}
                      </ReactMarkdown>
                    {index < storyMessages.length - 1 && <Separator className="mt-8" />}
                  </div>
                )
              })}
          </div>
      </div>
    );
  };
  
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

  const handleBoundary = (e: SpeechSynthesisEvent) => {
    if (!storyContentRef.current) return;
    const charIndex = e.charIndex;

    const allParagraphs = Array.from(storyContentRef.current.querySelectorAll('[data-char-offset]')) as HTMLElement[];
    let currentParagraph: HTMLElement | null = null;
    
    for (const p of allParagraphs) {
      const offset = parseInt(p.dataset.charOffset || '0', 10);
      if (offset <= charIndex) {
        currentParagraph = p;
      } else {
        break;
      }
    }

    if (currentParagraph) {
      currentParagraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePlayStory = () => {
    const rawStoryText = storyMessages.map(m => m.content).join('\n\n');
    const storyTextForTTS = extractProseForTTS(rawStoryText);
    ttsProps.onPlay(storyTextForTTS, handleBoundary);
  };


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

      <div className="h-full flex flex-col overflow-hidden">
          {gameData.playMode === 'local' && <LocalPlayerGrid />}
           <GameControls
              messages={messages}
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              gameData={gameData}
              worldState={worldState}
              campaignStructure={campaignStructure}
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
              sessionStatus={sessionStatus}
              onUpdateStatus={onUpdateStatus}
              onConfirmEndCampaign={onConfirmEndCampaign}
              {...ttsProps}
              onPlay={handlePlayStory} // Override onPlay for this component
            />
      </div>
    </div>
  );
}
