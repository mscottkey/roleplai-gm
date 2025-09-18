
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
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

  return { isSpeaking, speak, supported };
}
