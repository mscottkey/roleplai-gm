'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type VoiceInfo = {
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

function describeVoice(v: SpeechSynthesisVoice): VoiceInfo {
  const name = v.name || '';
  const uri = v.voiceURI || '';
  const ln = name.toLowerCase();
  const lu = uri.toLowerCase();

  let quality: VoiceInfo['quality'] = 'standard';
  if (ln.includes('neural') || lu.includes('neural') || ln.includes('siri')) quality = 'premium';
  else if (ln.includes('google') || ln.includes('microsoft') || ln.includes('enhanced')) quality = 'high';

  let provider: VoiceInfo['provider'] = 'local';
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
      if (voices && voices.length) return resolve(voices);
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
const utteranceRefs: SpeechSynthesisUtterance[] = [];

export function useSpeechSynthesis(opts: UseSpeechSynthesisOptions = {}) {
  const { preferredVoiceURI = null, maxChunkLen = 200 } = opts;

  const [supported, setSupported] = useState(false);
  const [rawVoices, setRawVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const primedRef = useRef(false);

  useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);

  useEffect(() => {
    const ok = hasSpeech();
    setSupported(ok);
    if (!ok) return;

    let cancelled = false;
    (async () => {
      const list = await waitForVoices();
      if (!cancelled) setRawVoices(list);
    })();

    const synth = window.speechSynthesis;
    const handler = () => setRawVoices(synth.getVoices() || []);
    if (synth.addEventListener) synth.addEventListener('voiceschanged', handler);
    else (synth as any).onvoiceschanged = handler;

    return () => {
      cancelled = true;
      if (synth.removeEventListener) synth.removeEventListener('voiceschanged', handler);
      else (synth as any).onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!supported || !rawVoices.length) return;

    if (selectedVoice && rawVoices.some(v => v.voiceURI === selectedVoice.voiceURI)) return;

    if (preferredVoiceURI) {
      const pref = rawVoices.find(v => v.voiceURI === preferredVoiceURI);
      if (pref) { setSelectedVoice(pref); return; }
    }

    const ranked = rawVoices
      .map(v => ({ v, info: describeVoice(v) }))
      .sort((a, b) => {
        const ord: Record<VoiceInfo['quality'], number> = { premium: 0, high: 1, standard: 2 };
        const d = ord[a.info.quality] - ord[b.info.quality];
        if (d !== 0) return d;
        return a.v.name.localeCompare(b.v.name);
      });

    const bestEn = ranked.find(x => x.v.lang?.toLowerCase().startsWith('en'))?.v;
    setSelectedVoice(bestEn || ranked[0]?.v || rawVoices[0] || null);
  }, [supported, rawVoices, preferredVoiceURI, selectedVoice]);

  const voices: VoiceInfo[] = useMemo(() => {
    return rawVoices.map(describeVoice).sort((a, b) => {
      const ord: Record<VoiceInfo['quality'], number> = { premium: 0, high: 1, standard: 2 };
      const d = ord[a.quality] - ord[b.quality];
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
  }, [rawVoices]);

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
    utteranceRefs.length = 0;
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

    // Avoid tab-hidden glitches (Safari/Edge)
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    primeEngine();

    const { text, rate = 1.0, pitch = 1.0, volume = 1.0, onEnd } =
      typeof opts === 'string' ? ({ text: opts } as SpeakOptions) : opts;

    const content = (text ?? '').trim();
    if (!content) return;

    const synth = window.speechSynthesis;

    // replace any current speech
    if (synth.speaking || synth.pending) synth.cancel();

    const chunks = chunkText(content, maxChunkLen);
    if (!chunks.length) return;

    let idx = 0;
    const playNext = () => {
      if (idx >= chunks.length) return;

      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      u.voice = selectedVoiceRef.current ?? null;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;

      u.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      u.onpause = () => setIsPaused(true);
      u.onresume = () => setIsPaused(false);
      u.onerror = (e) => { console.warn('[TTS] error', e); };
      u.onend = () => {
        const k = utteranceRefs.indexOf(u);
        if (k > -1) utteranceRefs.splice(k, 1);
        if (idx < chunks.length) {
          playNext();
        } else {
          setIsSpeaking(false);
          setIsPaused(false);
          try { onEnd?.(); } catch {}
        }
      };

      utteranceRefs.push(u);
      synth.speak(u);
    };

    playNext();
  }, [supported, primeEngine, maxChunkLen]);

  // auto-resume when tab visible again
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
