'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';

import type { GameData, Message, MechanicsVisibility } from '@/app/lib/types';

type GameControlsProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function GameControls({
  messages,
  onSendMessage,
  isLoading,
  gameData,
  mechanicsVisibility,
  setMechanicsVisibility,
}: GameControlsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l">
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} />
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
        />
      </main>
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
