
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
    // Clean up on unmount
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [supported, isSpeaking]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    // onend will fire, which will set isSpeaking to false.
  }, [supported]);

  return { isSpeaking, speak, stop, supported };
}
