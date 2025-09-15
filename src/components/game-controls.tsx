'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';
import { TurnManager } from '@/components/turn-manager';

import type { GameData, Message, MechanicsVisibility, Character } from '@/app/lib/types';

type GameControlsProps = {
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

export function GameControls({
  messages,
  onSendMessage,
  isLoading,
  gameData,
  characters,
  activeCharacter,
  setActiveCharacter,
  mechanicsVisibility,
  setMechanicsVisibility,
}: GameControlsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l">
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} />
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
        mechanicsVisibility={mechanicsVisibility}
        setMechanicsVisibility={setMechanicsVisibility}
      />
    </div>
  );
}
