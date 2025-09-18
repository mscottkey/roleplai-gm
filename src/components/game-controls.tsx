
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';
import { TurnManager } from '@/components/turn-manager';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';
import type { WorldState } from '@/ai/schemas/world-state-schemas';

type GameControlsProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  worldState: WorldState | null;
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
  onOpenStory: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRegenerateStoryline: () => void;
  // TTS Props
  isSpeaking: boolean;
  isPaused: boolean;
  isAutoPlayEnabled: boolean;
  isTTSSupported: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetAutoPlay: (enabled: boolean) => void;
};

export function GameControls({
  messages,
  onSendMessage,
  isLoading,
  gameData,
  worldState,
  characters,
  activeCharacter,
  setActiveCharacter,
  mechanicsVisibility,
  setMechanicsVisibility,
  onOpenStory,
  onUndo,
  canUndo,
  onRegenerateStoryline,
  // TTS Props
  isSpeaking,
  isPaused,
  isAutoPlayEnabled,
  isTTSSupported,
  onPlay,
  onPause,
  onStop,
  onSetAutoPlay,
}: GameControlsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l">
      <Header 
        onOpenDrawer={() => setIsDrawerOpen(true)} 
        onOpenStory={onOpenStory} 
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        isAutoPlayEnabled={isAutoPlayEnabled}
        isTTSSupported={isTTSSupported}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        onSetAutoPlay={onSetAutoPlay}
      />
      <TurnManager 
        characters={characters}
        activeCharacter={activeCharacter}
        setActiveCharacter={setActiveCharacter}
      />
      <div className="flex-1 overflow-y-auto">
        <ChatInterface
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          activeCharacter={activeCharacter}
        />
      </div>
      {canUndo && (
         <div className="p-2 border-t bg-card/80 backdrop-blur-sm flex justify-center">
            <Button variant="ghost" size="sm" onClick={onUndo} disabled={isLoading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Undo Last Action
            </Button>
        </div>
      )}
      <StoryDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        gameData={gameData}
        worldState={worldState}
        mechanicsVisibility={mechanicsVisibility}
        setMechanicsVisibility={setMechanicsVisibility}
        onRegenerateStoryline={onRegenerateStoryline}
        isLoading={isLoading}
      />
    </div>
  );
}
