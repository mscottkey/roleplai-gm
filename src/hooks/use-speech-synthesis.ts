
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Voice = {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  provider: 'Google' | 'Microsoft' | 'Apple' | 'local';
  quality: 'premium' | 'high' | 'standard';
};

export interface UseSpeechSynthesisOptions {
  /** Auto-select this voice by voiceURI once voices are available */
  preferredVoiceURI?: string | null;
  /** Max chunk size for sentence splitting */
  maxChunkLen?: number; // default 200
}

export interface SpeakOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** Called after the *final* chunk ends */
  onEnd?: () => void;
}

function hasSpeech(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof (window as any).SpeechSynthesisUtterance !== 'undefined'
  );
}

function describeVoice(v: SpeechSynthesisVoice): Voice {
  const name = v.name || '';
  const uri = v.voiceURI || '';
  const ln = name.toLowerCase();
  const lu = uri.toLowerCase();

  let quality: Voice['quality'] = 'standard';
  if (ln.includes('neural') || lu.includes('neural') || ln.includes('siri')) quality = 'premium';
  else if (ln.includes('google') || ln.includes('microsoft') || ln.includes('enhanced')) quality = 'high';

  let provider: Voice['provider'] = 'local';
  if (lu.includes('google')) provider = 'Google';
  else if (lu.includes('microsoft')) provider = 'Microsoft';
  else if (lu.includes('apple') || ln.includes('siri')) provider = 'Apple';

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

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  if (voices && voices.length) return voices;

  // micro-prime can unblock voice list in some browsers
  try { synth.speak(new SpeechSynthesisUtterance(' ')); } catch {}

  const start = Date.now();
  return await new Promise((resolve) => {
    const tick = () => {
      voices = synth.getVoices();
      if (voices && voices.length) return resolve(voices || []);
      if (Date.now() - start > 3000) return resolve(voices || []);
      setTimeout(tick, 100);
    };
    const handler = () => resolve(synth.getVoices() || []);
    synth.addEventListener?.('voiceschanged', handler, { once: true } as any);
    setTimeout(tick, 0);
  });
}

function chunkText(text: string, maxLen = 200): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/([.!?])( +)/g);
  const chunks: string[] = [];
  let buf = '';

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if (!part) continue;
    const nextBuf = (buf + part).trim();
    if (nextBuf.length > maxLen) {
      if (buf) chunks.push(buf.trim());
      buf = part;
    } else {
      buf = nextBuf;
    }
  }
  if (buf) chunks.push(buf.trim());

  if (!chunks.length) {
    for (let i = 0; i < clean.length; i += maxLen) chunks.push(clean.slice(i, i + maxLen));
  }
  return chunks.filter(Boolean);
}

// Keep utterances alive to avoid GC
const utteranceQueue: SpeechSynthesisUtterance[] = [];

export function useSpeechSynthesis(opts: UseSpeechSynthesisOptions = {}) {
  const { preferredVoiceURI = null, maxChunkLen = 200 } = opts;

  const [supported, setSupported] = useState(false);
  const [rawVoices, setRawVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const primedRef = useRef(false);

  useEffect(() => {
    const ok = hasSpeech();
    setSupported(ok);
    if (!ok) return;

    let cancelled = false;
    const loadVoices = async () => {
        const list = await waitForVoices();
        if (!cancelled) setRawVoices(list);
    };

    const synth = window.speechSynthesis;
    // Use onvoiceschanged to robustly load voices
    synth.onvoiceschanged = () => loadVoices();
    loadVoices(); // Initial attempt

    return () => {
      cancelled = true;
      synth.onvoiceschanged = null;
    };
  }, []);

  const voices: Voice[] = useMemo(() => {
    // Simple check for Edge browser.
    const isEdge = typeof navigator !== 'undefined' && navigator.userAgent.includes("Edg/");

    return rawVoices
      .filter(v => {
        // Must be local and English
        if (!v.localService || !v.lang.startsWith('en')) {
          return false;
        }
        // If not in Edge, filter out Microsoft voices
        if (!isEdge && v.name.includes('Microsoft')) {
          return false;
        }
        return true;
      })
      .map(describeVoice)
      .sort((a, b) => {
        const ord: Record<Voice['quality'], number> = { premium: 0, high: 1, standard: 2 };
        const d = ord[a.quality] - ord[b.quality];
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      });
  }, [rawVoices]);

  useEffect(() => {
    if (!supported || !voices.length) return;

    const currentVoiceIsValid = selectedVoice && voices.some(v => v.voiceURI === selectedVoice.voiceURI);
    if (currentVoiceIsValid) return;

    if (preferredVoiceURI) {
      const pref = voices.find(v => v.voiceURI === preferredVoiceURI);
      if (pref) {
          const rawPref = rawVoices.find(rv => rv.voiceURI === pref.voiceURI);
          if (rawPref) {
            setSelectedVoice(rawPref);
            return;
          }
      }
    }
    
    // Fallback to the first voice in the filtered & sorted list
    const bestFallback = voices[0];
    if (bestFallback) {
        const rawFallback = rawVoices.find(rv => rv.voiceURI === bestFallback.voiceURI);
        setSelectedVoice(rawFallback || null);
    }

  }, [supported, voices, rawVoices, preferredVoiceURI, selectedVoice]);

  const primeEngine = useCallback(() => {
    if (!supported || primedRef.current) return;
    const synth = window.speechSynthesis;
    try {
      if (!(synth.speaking || synth.pending)) synth.speak(new SpeechSynthesisUtterance(' '));
      primedRef.current = true;
    } catch {}
  }, [supported]);

  const selectVoice = useCallback((voiceURI: string) => {
    primeEngine();
    const v = rawVoices.find(x => x.voiceURI === voiceURI);
    if (v) { setSelectedVoice(v); return true; }
    return false;
  }, [rawVoices, primeEngine]);

  const cancel = useCallback(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    utteranceQueue.length = 0;
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

  const speak = useCallback((opts: SpeakOptions | string) => {
    if (!supported) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    primeEngine();

    const { text, rate = 1.0, pitch = 1.0, volume = 1.0, onEnd } =
      typeof opts === 'string' ? ({ text: opts } as SpeakOptions) : opts;

    const content = (text ?? '').trim();
    if (!content) return;

    const synth = window.speechSynthesis;

    const startSpeaking = () => {
        const chunks = chunkText(content, maxChunkLen);
        if (!chunks.length) return;

        let idx = 0;
        const playNext = () => {
            if (idx >= chunks.length) return;

            const utterance = new SpeechSynthesisUtterance(chunks[idx++]);
            utterance.voice = selectedVoice;
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;

            utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
            utterance.onpause = () => setIsPaused(true);
            utterance.onresume = () => setIsPaused(false);
            utterance.onerror = (e) => { console.warn('[TTS] error', e); };
            utterance.onend = () => {
                const k = utteranceQueue.indexOf(utterance);
                if (k > -1) utteranceQueue.splice(k, 1);
                if (idx < chunks.length) {
                    playNext();
                } else {
                    setIsSpeaking(false);
                    setIsPaused(false);
                    try { onEnd?.(); } catch {}
                }
            };

            utteranceQueue.push(utterance);
            synth.speak(utterance);
        };
        playNext();
    };

    if (synth.speaking || synth.pending) {
        synth.cancel();
        // Add a small delay to prevent race conditions where speak() is called before cancel() has fully finished.
        setTimeout(startSpeaking, 100);
    } else {
        startSpeaking();
    }
  }, [supported, primeEngine, maxChunkLen, selectedVoice]);

  useEffect(() => {
    const onVis = () => {
      if (!supported) return;
      if (document.visibilityState === 'visible' && isPaused) {
        try { window.speechSynthesis.resume(); } catch {}
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }
  }, [supported, isPaused]);

  return {
    supported,
    voices,
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
