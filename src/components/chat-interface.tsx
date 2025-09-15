'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Message, Character } from '@/app/lib/types';
import { SendHorizonal, User, Bot } from 'lucide-react';

type ChatInterfaceProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeCharacter: Character | null;
};

export function ChatInterface({ messages, onSendMessage, isLoading, activeCharacter }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setInput(textarea.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'P';
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto h-full">
          {messages.map((message, index) => {
            const isUser = message.content.startsWith('**');
            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser && (
                  <Avatar className="w-8 h-8 bg-primary text-primary-foreground flex-shrink-0">
                    <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xl rounded-lg p-3.5 shadow-sm',
                     isUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-background border rounded-bl-none'
                  )}
                >
                  <div className="text-sm prose dark:prose-invert prose-p:my-0 prose-headings:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.mechanics && (
                    <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/30">
                      <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">{message.mechanics}</p>
                    </div>
                  )}
                </div>
                {isUser && (
                  <Avatar className="w-8 h-8 bg-secondary text-secondary-foreground flex-shrink-0">
                    <AvatarFallback>{getInitials(message.content.split('(')[1]?.split(')')[0])}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
           {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-4 justify-start">
               <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                  <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="max-w-xl rounded-lg p-4 bg-card border rounded-bl-none">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LoadingSpinner className="w-4 h-4 animate-spin"/>
                        <span>GM is thinking...</span>
                    </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={activeCharacter ? `What does ${activeCharacter.name} do?` : "Select a character to act"}
            className="flex-1 resize-none max-h-48"
            rows={1}
            disabled={isLoading || !activeCharacter}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !activeCharacter} className="flex-shrink-0 bg-accent hover:bg-accent/90">
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
