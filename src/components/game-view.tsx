'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';

import type { GameData, Message, MechanicsVisibility } from '@/app/lib/types';

type GameViewProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameData: GameData;
  mechanicsVisibility: MechanicsVisibility;
  setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function GameView({
  messages,
  onSendMessage,
  isLoading,
  gameData,
  mechanicsVisibility,
  setMechanicsVisibility,
}: GameViewProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
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
