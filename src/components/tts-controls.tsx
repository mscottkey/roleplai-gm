
'use client';

import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Play, Pause, Square, Rss } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type TTSControlsProps = {
  isSpeaking: boolean;
  isPaused: boolean;
  isAutoPlayEnabled: boolean;
  isTTSSupported: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetAutoPlay: (enabled: boolean) => void;
  ttsVolume: 'low' | 'med' | 'high';
  onCycleTtsVolume: () => void;
};

export function TTSControls({
  isSpeaking,
  isPaused,
  isAutoPlayEnabled,
  isTTSSupported,
  onPlay,
  onPause,
  onStop,
  onSetAutoPlay,
  ttsVolume,
  onCycleTtsVolume
}: TTSControlsProps) {

  if (!isTTSSupported) {
    return (
        <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">TTS not supported</p>
        </div>
    );
  }

  const handlePlayPause = () => {
    if (isSpeaking && !isPaused) {
      onPause();
    } else {
      onPlay();
    }
  }

  return (
    <TooltipProvider>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
            >
              {isSpeaking && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isSpeaking && !isPaused ? 'Pause' : 'Play'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSpeaking && !isPaused ? 'Pause Narration' : (isPaused ? 'Resume Narration' : 'Play Story Aloud')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onStop} disabled={!isSpeaking}>
              <Square className="h-5 w-5" />
              <span className="sr-only">Stop</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop Narration</p>
          </TooltipContent>
        </Tooltip>
        
        <Button variant="ghost" onClick={onCycleTtsVolume} className="w-20">
          {ttsVolume === 'low' && '🔈 Low'}
          {ttsVolume === 'med' && '🔉 Med'}
          {ttsVolume === 'high' && '🔊 High'}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
            id="autoplay-switch" 
            checked={isAutoPlayEnabled}
            onCheckedChange={onSetAutoPlay}
        />
        <Label htmlFor="autoplay-switch" className="flex items-center gap-1.5 text-sm font-normal">
            <Rss className="h-4 w-4" />
            Auto-Play
        </Label>
      </div>
    </div>
    </TooltipProvider>
  );
}
