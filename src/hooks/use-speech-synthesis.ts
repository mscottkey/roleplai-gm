
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type Voice = {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
  quality: 'premium' | 'high' | 'standard';
  provider: string;
};

type UseSpeechSynthesisProps = {
  onEnd: () => void;
  preferredVoiceURI?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export function useSpeechSynthesis({ 
  onEnd, 
  preferredVoiceURI,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0 
}: UseSpeechSynthesisProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect voice quality and provider
  const analyzeVoice = (voice: SpeechSynthesisVoice): { quality: Voice['quality'], provider: string } => {
    let quality: Voice['quality'] = 'standard';
    let provider = 'System';
    
    const name = voice.name.toLowerCase();
    const uri = voice.voiceURI.toLowerCase();
    
    // Google voices (usually highest quality in Chrome)
    if (name.includes('google') || uri.includes('google')) {
      quality = 'premium';
      provider = 'Google';
    }
    // Microsoft Edge voices
    else if (name.includes('microsoft') || name.includes('edge') || name.includes('azure')) {
      quality = 'premium';
      provider = 'Microsoft';
    }
    // Amazon Polly voices (if installed)
    else if (name.includes('amazon') || name.includes('polly')) {
      quality = 'premium';
      provider = 'Amazon';
    }
    // Remote/Cloud voices
    else if (!voice.localService) {
      quality = 'high';
      provider = 'Cloud';
    }
    // Enhanced system voices
    else if (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) {
      quality = 'high';
      provider = 'System Enhanced';
    }
    // Specific high-quality voices
    else if (
      name.includes('samantha') || // iOS/macOS high quality
      name.includes('alex') || // macOS
      name.includes('victoria') || // Windows
      name.includes('zira') || // Windows
      name.includes('david') || // Windows
      name.includes('hazel') || // Windows UK
      name.includes('susan') || // macOS
      name.includes('fred') // macOS
    ) {
      quality = 'high';
      provider = 'System';
    }
    
    return { quality, provider };
  };

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      const synth = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synth.getVoices();
        
        // Map to simpler voice objects and sort by quality
        const voiceList: Voice[] = availableVoices.map(v => {
          const { quality, provider } = analyzeVoice(v);
          return {
            name: v.name,
            lang: v.lang,
            localService: v.localService,
            default: v.default,
            voiceURI: v.voiceURI,
            quality,
            provider
          };
        }).sort((a, b) => {
          // Sort by quality first
          const qualityOrder = { premium: 0, high: 1, standard: 2 };
          const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality];
          if (qualityDiff !== 0) return qualityDiff;
          
          // Then prioritize English voices
          const aEnglish = a.lang.startsWith('en');
          const bEnglish = b.lang.startsWith('en');
          if (aEnglish && !bEnglish) return -1;
          if (!aEnglish && bEnglish) return 1;
          
          return 0;
        });
        
        setVoices(voiceList);
        
        const preferred = preferredVoiceURI ? availableVoices.find(v => v.voiceURI === preferredVoiceURI) : null;
        
        if (preferred) {
            setSelectedVoice(preferred);
        } else if (voiceList.length > 0 && !selectedVoice) {
          const bestEnglish = availableVoices.find(v => {
            const { quality } = analyzeVoice(v);
            return v.lang.startsWith('en') && quality === 'premium';
          }) || availableVoices.find(v => v.lang.startsWith('en'));
          
          if (bestEnglish) {
            setSelectedVoice(bestEnglish);
          }
        }
      };

      // Load voices immediately
      loadVoices();
      
      // Chrome loads voices asynchronously
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      
      return () => {
        if (synth.speaking) {
          synth.cancel();
        }
      };
    }
  }, [preferredVoiceURI]);

  const speak = useCallback((text: string, voiceOverride?: SpeechSynthesisVoice) => {
    if (!supported) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice
    const voiceToUse = voiceOverride || selectedVoice;
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    // Set speech parameters
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Attach listeners
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
      if (e.error === 'interrupted' || e.error === 'canceled' || e.error === 'not-allowed') {
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }
      console.error("Speech synthesis error", e.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    synth.speak(utterance);
  }, [supported, selectedVoice, rate, pitch, volume, onEnd]);

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

  const selectVoice = useCallback((voiceURI: string) => {
    const synth = window.speechSynthesis;
    const allVoices = synth.getVoices();
    if (allVoices.length === 0) {
      // Voices not loaded yet, this can happen on some browsers
      return false;
    }
    const voice = allVoices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      setSelectedVoice(voice);
      return true;
    }
    return false;
  }, []);

  return { 
    isSpeaking, 
    isPaused, 
    speak, 
    pause, 
    resume, 
    cancel, 
    supported,
    voices,
    selectedVoice,
    selectVoice
  };
}
