
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { Voice } from '@/hooks/use-speech-synthesis';
import { ScrollArea } from './scroll-area';

type VoiceSelectorProps = {
  voices: Voice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voiceURI: string) => boolean;
};

export function VoiceSelector({ voices, selectedVoice, onSelectVoice }: VoiceSelectorProps) {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const testVoice = () => {
    if (!selectedVoice) return;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(
      "Hello! This is a test of the selected narrator voice."
    );
    
    utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };
  
  useEffect(() => {
    return () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    }
  }, [])

  if (voices.length === 0) {
    return <p className="text-sm text-muted-foreground">No text-to-speech voices available in your browser.</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
          <Label>Narrator Voice</Label>
          <Select 
            value={selectedVoice?.voiceURI} 
            onValueChange={onSelectVoice}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a voice..." />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {voices.map(voiceInfo => (
                  <SelectItem key={voiceInfo.voiceURI} value={voiceInfo.voiceURI}>
                    <div className="flex items-center gap-2">
                        <span className="truncate">{voiceInfo.name} ({voiceInfo.lang})</span>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

      <div className="space-y-2">
          <Label>Speed: {rate.toFixed(1)}x</Label>
          <Slider 
            value={[rate]} 
            onValueChange={([v]) => setRate(v)}
            min={0.5}
            max={2}
            step={0.1}
          />
      </div>
      
      <Button 
        size="sm"
        variant="outline"
        onClick={isPlaying ? stopSpeaking : testVoice}
        disabled={!selectedVoice}
        className="w-full"
      >
        <Volume2 className="w-4 h-4 mr-2" />
        {isPlaying ? 'Stop Test' : 'Test Voice'}
      </Button>
    </div>
  );
}
