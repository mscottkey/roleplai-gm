'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';
import { TurnManager } from '@/components/turn-manager';

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
}: GameControlsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l">
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} onOpenStory={onOpenStory} />
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
      <StoryDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        gameData={gameData}
        worldState={worldState}
        mechanicsVisibility={mechanicsVisibility}
        setMechanicsVisibility={setMechanicsVisibility}
      />
    </div>
  );
}
