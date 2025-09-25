// src/hooks/use-speech-synthesis.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type UseSpeechSynthesisProps = {
  onEnd: () => void;
};

export function useSpeechSynthesis({ onEnd }: UseSpeechSynthesisProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Enhanced voice scoring with browser-specific preferences
  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
    const isEdge = /edge/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    
    let score = 0;
    
    // Browser-specific high-quality voice preferences
    if (isEdge) {
      // Edge: Prefer neural voices, but favor male voices for narration
      if (name.includes('neural')) score += 100;
      if (name.includes('david') || name.includes('guy') || name.includes('mark')) score += 50; // Male voices
      if (name.includes('aria') || name.includes('zira')) score += 30; // Female fallback
    } else if (isChrome) {
      // Chrome: Limited options, prefer any decent system voice
      if (name.includes('google')) score += 60; // Google voices are usually better than system
      if (name.includes('male') || name.includes('david') || name.includes('alex')) score += 40;
      if (name.includes('female') || name.includes('victoria') || name.includes('karen')) score += 30;
    } else if (isSafari) {
      // Safari/macOS: Great system voices
      if (name.includes('alex')) score += 100; // Alex is the gold standard on macOS
      if (name.includes('daniel') || name.includes('fred')) score += 90; // Other good male voices
      if (name.includes('samantha') || name.includes('victoria')) score += 80; // Female alternatives
    }
    
    // General quality indicators
    if (name.includes('neural') || name.includes('premium') || name.includes('enhanced')) score += 80;
    if (name.includes('natural') || name.includes('wavenet')) score += 70;
    
    // Prefer local voices for performance
    if (voice.localService) score += 40;
    
    // Avoid obviously low-quality voices
    if (name.includes('compact') || name.includes('basic') || name.includes('eSpeak')) score -= 50;
    
    // Slight preference for male voices in narration (storytelling often sounds better)
    if (name.includes('male') || name.includes('david') || name.includes('alex') || 
        name.includes('daniel') || name.includes('mark') || name.includes('guy')) {
      score += 15;
    }
    
    return score;
  };

  const selectBestVoice = useCallback(() => {
    if (!window.speechSynthesis) return;
    
    const availableVoices = window.speechSynthesis.getVoices();
    const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
    
    if (englishVoices.length === 0) return;
    
    // Find the best voice by score
    const bestVoice = englishVoices.reduce((best, current) => {
      return scoreVoice(current) > scoreVoice(best) ? current : best;
    });
    
    setSelectedVoice(bestVoice);
    
    // Debug logging to see what voice was selected
    const browserInfo = /edge/i.test(navigator.userAgent) ? 'Edge' : 
                       /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent) ? 'Chrome' :
                       /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent) ? 'Safari' : 'Unknown';
    
    console.log(`🎤 Selected TTS voice for ${browserInfo}: ${bestVoice.name} (${bestVoice.lang}) - Score: ${scoreVoice(bestVoice)}`);
    
    // Log all available voices for debugging
    console.log('📋 Available voices:', englishVoices.map(v => `${v.name} (Score: ${scoreVoice(v)})`));
    
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      // Load voices immediately if available
      selectBestVoice();
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = selectBestVoice;
      }
      
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [selectBestVoice]);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    
    // Cancel any current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply the best voice and enhanced settings
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Browser-specific rate optimization
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
    
    // Chrome tends to speak faster with lower quality, so slow it down more
    utterance.rate = isChrome ? 0.8 : 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEnd();
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
      setIsSpeaking(true);
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
      setIsSpeaking(true);
    };
    
    utterance.onerror = (e) => {
      if (['interrupted', 'canceled', 'not-allowed'].includes(e.error)) {
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }
      console.error("Speech synthesis error", e.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    synth.speak(utterance);
  }, [supported, selectedVoice, onEnd]);

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking || isPaused) return;
    window.speechSynthesis.pause();
  }, [supported, isPaused]);

  const resume = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking || !isPaused) return;
    window.speechSynthesis.resume();
  }, [supported, isPaused]);

  const cancel = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported]);

  return { 
    isSpeaking, 
    isPaused, 
    speak, 
    pause, 
    resume, 
    cancel, 
    supported
  };
}
