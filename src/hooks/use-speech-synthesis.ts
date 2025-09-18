
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type UseSpeechSynthesisProps = {
  onEnd: () => void;
};

export function useSpeechSynthesis({ onEnd }: UseSpeechSynthesisProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      const synth = window.speechSynthesis;
      
      const handleBoundary = () => {
        // Can be used to highlight words as they are spoken.
      };
      
      const handleEnd = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd();
      };
      
      const handleError = (e: SpeechSynthesisErrorEvent) => {
        console.error("Speech synthesis error", e.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      if(utteranceRef.current) {
        utteranceRef.current.addEventListener('boundary', handleBoundary);
        utteranceRef.current.addEventListener('end', handleEnd);
        utteranceRef.current.addEventListener('error', handleError);
      }
      
      return () => {
        if(utteranceRef.current) {
          utteranceRef.current.removeEventListener('boundary', handleBoundary);
          utteranceRef.current.removeEventListener('end', handleEnd);
          utteranceRef.current.removeEventListener('error', handleError);
        }
        synth.cancel();
      };
    }
  }, [onEnd]);

  const speak = useCallback((text: string) => {
    if (!supported || isSpeaking) return;

    const synth = window.speechSynthesis;
    // Cancel any previous speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Attach listeners dynamically
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
        console.error("Speech synthesis error", e.error);
        setIsSpeaking(false);
        setIsPaused(false);
    };
    
    synth.speak(utterance);
  }, [supported, isSpeaking, onEnd]);

  const pause = useCallback(() => {
    if (!supported || !isSpeaking || isPaused) return;
    window.speechSynthesis.pause();
  }, [supported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!supported || !isSpeaking || !isPaused) return;
    window.speechSynthesis.resume();
  }, [supported, isSpeaking, isPaused]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported]);


  return { isSpeaking, isPaused, speak, pause, resume, cancel, supported };
}
