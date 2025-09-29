

'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import { StoryDrawer } from '@/components/story-drawer';
import { TurnManager } from '@/components/turn-manager';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';


import type { GameData, Message, MechanicsVisibility, Character, SessionStatus } from '@/app/lib/types';
import type { WorldState } from '@/ai/schemas/world-state-schemas';
import type { CampaignStructure } from '@/ai/schemas/campaign-structure-schemas';
import type { Voice } from '@/hooks/use-speech-synthesis';

type GameControlsProps = {
  messages: Message[];
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
  onOpenStory: () => void;
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
  onPlay: () => void;
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

export function GameControls({
  messages,
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
  onOpenStory,
  onUndo,
  canUndo,
  onRegenerateStoryline,
  currentUser,
  sessionStatus,
  onUpdateStatus,
  onConfirmEndCampaign,
  ...ttsProps
}: GameControlsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { playMode } = gameData;
  
  const canAct = playMode === 'local' || (activeCharacter?.playerId === currentUser?.uid);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l">
      <Header 
        onOpenDrawer={() => setIsDrawerOpen(true)} 
        onOpenStory={onOpenStory} 
        {...ttsProps}
      />
      <TurnManager 
        characters={characters}
        activeCharacter={activeCharacter}
        setActiveCharacter={setActiveCharacter}
        currentUserId={currentUser?.uid}
        hostId={gameData.userId}
        playMode={gameData.playMode}
      />
      <div className="flex-1 overflow-y-auto">
        <ChatInterface
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          activeCharacter={activeCharacter}
          currentUser={currentUser}
          canAct={canAct}
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
        campaignStructure={campaignStructure}
        mechanicsVisibility={mechanicsVisibility}
        setMechanicsVisibility={setMechanicsVisibility}
        onRegenerateStoryline={onRegenerateStoryline}
        isLoading={isLoading}
        voices={ttsProps.voices}
        selectedVoice={ttsProps.selectedVoice}
        onSelectVoice={ttsProps.onSelectVoice}
        sessionStatus={sessionStatus}
        onUpdateStatus={onUpdateStatus}
        onConfirmEndCampaign={onConfirmEndCampaign}
      />
    </div>
  );
}
