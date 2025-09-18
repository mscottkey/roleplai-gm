
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
      
      return () => {
        synth.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }


    const synth = window.speechSynthesis;
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
        setIsSpeaking(true); // isSpeaking should remain true during pause
    };
    utterance.onresume = () => {
        setIsPaused(false);
        setIsSpeaking(true);
    };
    utterance.onerror = (e) => {
        if (e.error === 'interrupted') {
            return; // Don't log interruptions as errors
        }
        console.error("Speech synthesis error", e.error);
        setIsSpeaking(false);
        setIsPaused(false);
    };
    
    synth.speak(utterance);
  }, [supported, onEnd]);

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
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported]);


  return { isSpeaking, isPaused, speak, pause, resume, cancel, supported };
}
