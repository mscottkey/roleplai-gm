
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
  const isPrimedRef = useRef(false);
  const selectedVoiceRef = useRef(selectedVoice);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Detect voice quality and provider
  const analyzeVoice = (voice: SpeechSynthesisVoice): { quality: Voice['quality'], provider: string } => {
    let quality: Voice['quality'] = 'standard';
    let provider = 'System';
    
    const name = voice.name.toLowerCase();
    const uri = voice.voiceURI.toLowerCase();
    
    if (name.includes('google') || uri.includes('google')) {
      quality = 'premium';
      provider = 'Google';
    }
    else if (name.includes('microsoft') || name.includes('edge') || name.includes('azure')) {
      quality = 'premium';
      provider = 'Microsoft';
    }
    else if (name.includes('amazon') || name.includes('polly')) {
      quality = 'premium';
      provider = 'Amazon';
    }
    else if (!voice.localService) {
      quality = 'high';
      provider = 'Cloud';
    }
    else if (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) {
      quality = 'high';
      provider = 'System Enhanced';
    }
    else if (
      name.includes('samantha') ||
      name.includes('alex') ||
      name.includes('victoria') ||
      name.includes('zira') ||
      name.includes('david') ||
      name.includes('hazel') ||
      name.includes('susan') ||
      name.includes('fred')
    ) {
      quality = 'high';
      provider = 'System';
    }
    
    return { quality, provider };
  };

  const primeEngine = () => {
    if (!isPrimedRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      console.log('[TTS Hook] Priming speech engine...');
      const synth = window.speechSynthesis;
      const primer = new SpeechSynthesisUtterance('');
      synth.speak(primer);
      isPrimedRef.current = true;
    }
  }

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      const synth = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synth.getVoices();
        
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
          const qualityOrder = { premium: 0, high: 1, standard: 2 };
          const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality];
          if (qualityDiff !== 0) return qualityDiff;
          
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
        } else if (voiceList.length > 0 && !selectedVoiceRef.current) {
          const bestEnglish = availableVoices.find(v => {
            const { quality } = analyzeVoice(v);
            return v.lang.startsWith('en') && quality === 'premium';
          }) || availableVoices.find(v => v.lang.startsWith('en'));
          
          if (bestEnglish) {
            setSelectedVoice(bestEnglish);
          }
        }
      };

      loadVoices();
      
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

  const speak = useCallback((text: string) => {
    primeEngine();
    console.log('[TTS Hook] `speak` function called.');
    if (!supported) {
      console.log('[TTS Hook] Speech synthesis not supported.');
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }
    
    // Use a timeout to allow the cancel to process and avoid race conditions
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; 
        console.log(`[TTS Hook] Created new utterance for text: "${text.substring(0, 50)}..."`);
        
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
            onEnd();
        };

        utterance.onpause = () => {
            console.log('[TTS Hook] Event: onpause');
            setIsPaused(true);
            setIsSpeaking(true);
        };

        utterance.onresume = () => {
            console.log('[TTS Hook] Event: onresume');
            setIsPaused(false);
            setIsSpeaking(true);
        };

        utterance.onerror = (e) => {
          console.error('[TTS Hook] Event: onerror', e);
        };

        const voiceToUse = selectedVoiceRef.current;
        if (voiceToUse) {
            utterance.voice = voiceToUse;
            console.log(`[TTS Hook] Applying voice: ${voiceToUse.name} (${voiceToUse.voiceURI})`);
        } else {
            console.log('[TTS Hook] No specific voice selected, using browser default.');
        }

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        console.log(`[TTS Hook] Settings: rate=${rate}, pitch=${pitch}, volume=${volume}`);

        console.log('[TTS Hook] Stored utterance in ref. Calling synth.speak()...');
        synth.speak(utterance);
        console.log('[TTS Hook] synth.speak() has been called.');
    }, 100);

}, [supported, rate, pitch, volume, onEnd]);


  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking || isPaused) return;
    window.speechSynthesis.pause();
  }, [supported, isPaused]);

  const resume = useCallback(() => {
    primeEngine();
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
    primeEngine();
    const synth = window.speechSynthesis;
    const allVoices = synth.getVoices();
    if (allVoices.length === 0) {
      // Voices may not be loaded yet, try again after a short delay
      setTimeout(() => selectVoice(voiceURI), 100);
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
