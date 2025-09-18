
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SpeechInputProps = {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
};

export function SpeechInput({ onTranscript, disabled }: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
            variant: "destructive",
            title: "Speech Recognition Error",
            description: event.error === 'not-allowed' ? "Microphone access was denied." : `An error occurred: ${event.error}`,
        });
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };
      
      recognitionRef.current = recognition;
    } else {
        // Handle case where API is not supported
        recognitionRef.current = null;
    }
  }, [onTranscript, toast]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({
            variant: "destructive",
            title: "Unsupported Browser",
            description: "Your browser does not support speech recognition.",
        });
        return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleListening}
      disabled={disabled || recognitionRef.current === null}
      className={isListening ? 'text-accent' : ''}
    >
      {isListening ? <Mic className="h-5 w-5 animate-pulse" /> : <MicOff className="h-5 w-5" />}
      <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
    </Button>
  );
}
