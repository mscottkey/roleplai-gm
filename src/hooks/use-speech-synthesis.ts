
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Voice = {
    voiceURI: string;
    name: string;
    lang: string;
    localService: boolean;
    default: boolean;
    provider: string; // Heuristic: 'Google', 'Microsoft', 'local', etc.
    quality: 'premium' | 'high' | 'standard';
}

export interface UseSpeechSynthesisOptions {
  /** Try to auto-select this voice by voiceURI once voices are available */
  preferredVoiceURI?: string | null;
}

export interface SpeakOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Heuristic to label voices by quality tier for UI ranking.
 */
function getVoiceInfo(v: SpeechSynthesisVoice): Voice {
  const name = v.name || '';
  const uri = v.voiceURI || '';
  const lowerName = name.toLowerCase();
  const lowerUri = uri.toLowerCase();

  let quality: Voice['quality'] = 'standard';
  if (lowerName.includes('neural') || lowerUri.includes('neural') || lowerName.includes('siri')) {
    quality = 'premium';
  } else if (lowerName.includes('google') || lowerName.includes('microsoft') || lowerName.includes('enhanced')) {
    quality = 'high';
  }

  let provider = 'local';
   if (lowerUri.includes('google')) provider = 'Google';
   else if (lowerUri.includes('microsoft')) provider = 'Microsoft';
   else if (lowerUri.includes('apple')) provider = 'Apple';


  return {
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    default: v.default,
    quality,
    provider,
  };
}


/**
 * Stable feature detection (SSR-safe)
 */
function hasSpeech(): boolean {
  return typeof window !== 'undefined' &&
         'speechSynthesis' in window &&
         typeof (window as any).SpeechSynthesisUtterance !== 'undefined';
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { preferredVoiceURI = null } = options;

  const [supported, setSupported] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPrimedRef = useRef(false);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    const ok = hasSpeech();
    setSupported(ok);
    if (!ok) return;

    const synth = window.speechSynthesis;
    let cancelled = false;

    const applyVoices = () => {
      if (cancelled) return;
      const list = synth.getVoices();
      if (Array.isArray(list) && list.length) {
        setVoices(prev => {
          const changed = prev.length !== list.length ||
                          prev.some((v, i) => v.voiceURI !== list[i]?.voiceURI);
          return changed ? list.slice() : prev;
        });
      }
    };

    applyVoices();
    const handler = () => applyVoices();
    synth.addEventListener?.('voiceschanged', handler as any);

    return () => {
      cancelled = true;
      synth.removeEventListener?.('voiceschanged', handler as any);
    };
  }, []);

  useEffect(() => {
    if (!supported || !voices.length) return;

    if (selectedVoice && voices.some(v => v.voiceURI === selectedVoice.voiceURI)) {
      return;
    }

    if (preferredVoiceURI) {
      const pref = voices.find(v => v.voiceURI === preferredVoiceURI);
      if (pref) {
        setSelectedVoice(pref);
        return;
      }
    }

    const sortedVoices = voices
      .map(v => ({ voice: v, info: getVoiceInfo(v) }))
      .sort((a, b) => {
        const order: Record<Voice['quality'], number> = { premium: 0, high: 1, standard: 2 };
        const d = order[a.info.quality] - order[b.info.quality];
        if (d !== 0) return d;
        return a.voice.name.localeCompare(b.voice.name);
      });

    const bestEnglish = sortedVoices.find(v => v.voice.lang.startsWith('en-'))?.voice;
    setSelectedVoice(bestEnglish || voices[0] || null);

  }, [supported, voices, preferredVoiceURI, selectedVoice]);

  const categorizedVoices = useMemo(() => {
    if (voices.length === 0) return [];
    return voices.map(getVoiceInfo).sort((a, b) => {
      const order: Record<Voice['quality'], number> = { premium: 0, high: 1, standard: 2 };
      const d = order[a.quality] - order[b.quality];
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
  }, [voices]);


  const primeEngine = useCallback(() => {
    if (!supported || isPrimedRef.current) return;
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) return;

    console.log('[TTS Hook] Priming speech engine...');
    const primer = new SpeechSynthesisUtterance('');
    synth.speak(primer);
    isPrimedRef.current = true;
  }, [supported]);


  const selectVoice = useCallback((voiceURI: string) => {
    primeEngine();
    const voice = voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
        setSelectedVoice(voice);
        return true;
    }
    return false;
  }, [voices, primeEngine]);

  const cancel = useCallback(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    utteranceRef.current = null;
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [supported]);

  const speak = useCallback((options: SpeakOptions | string) => {
    if (!supported) return;

    const { text, rate = 1.0, pitch = 1.0, volume = 1.0 } =
      typeof options === 'string' ? { text: options } as SpeakOptions : options;

    const content = (text ?? '').trim();
    if (!content) return;
    
    console.log('[TTS Hook] `speak` function called.');
    
    const synth = window.speechSynthesis;
    
    const utterance = new SpeechSynthesisUtterance(content);
    utteranceRef.current = utterance; // Keep reference to avoid GC
    
    utterance.onstart = () => {
        console.log('[TTS Hook] Event: onstart');
        setIsSpeaking(true);
        setIsPaused(false);
    };

    utterance.onend = () => {
        console.log('[TTS Hook] Event: onend');
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
    };
    
    utterance.onpause = () => {
        console.log('[TTS Hook] Event: onpause');
        setIsPaused(true);
    };
    
    utterance.onresume = () => {
        console.log('[TTS Hook] Event: onresume');
        setIsPaused(false);
    };

    utterance.onerror = (e) => {
        console.error('[TTS Hook] Event: onerror', e);
    };

    const voiceToUse = selectedVoiceRef.current;
    if (voiceToUse) {
        utterance.voice = voiceToUse;
        console.log(`[TTS Hook] Applying voice: ${voiceToUse.name} (${voiceToUse.voiceURI})`);
    } else {
        console.warn('[TTS Hook] No voice selected, using browser default.');
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    console.log(`[TTS Hook] Settings: rate=${rate}, pitch=${pitch}, volume=${volume}`);

    // This is the defensive pattern to avoid race conditions.
    if (synth.speaking) {
      synth.cancel();
    }
    
    setTimeout(() => {
      console.log('[TTS Hook] synth.speak() is being called inside timeout.');
      synth.speak(utterance);
    }, 100);

  }, [supported]);


  return {
    supported,
    voices: categorizedVoices, // Use the categorized and sorted list for UI
    selectedVoice,
    selectVoice,
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    cancel,
  };
}

export type UseSpeechSynthesisReturn = ReturnType<typeof useSpeechSynthesis>;
