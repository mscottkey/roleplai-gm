
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from '@/components/icons';
import { cn, formatDialogue } from '@/lib/utils';
import type { Message, Character } from '@/app/lib/types';
import { SendHorizonal, User, Bot, History, Ban } from 'lucide-react';
import { SpeechInput } from './speech-input';
import type { User as FirebaseUser } from 'firebase/auth';


type ChatInterfaceProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeCharacter: Character | null;
  currentUser: FirebaseUser | null;
  canAct: boolean;
};

export function ChatInterface({ messages, onSendMessage, isLoading, activeCharacter, currentUser, canAct }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevIsLoading = useRef(isLoading);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages]);

  useEffect(() => {
    // Refocus input after AI is done
    if (prevIsLoading.current && !isLoading) {
      textareaRef.current?.focus();
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

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
  
  const placeholderText = () => {
    if (!activeCharacter) return "Select a character to act";
    if (!canAct) return `Waiting for ${activeCharacter.name} to act...`;
    return `What does ${activeCharacter.name} do?`;
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto h-full">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isSystem = message.role === 'system';
            const contentWithDialogue = formatDialogue(message.content);
            const author = message.authorName || (isUser ? 'Player' : 'GM');
            return (
              <div
                key={message.id || `message-${index}-${message.role}`}
                className={cn(
                  'flex items-start gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser && (
                  <Avatar className="w-8 h-8 bg-primary text-primary-foreground flex-shrink-0">
                    <AvatarFallback>{isSystem ? <History className="w-5 h-5" /> : <Bot className="w-5 h-5" />}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xl rounded-lg p-3.5 shadow-sm relative group',
                     isUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : isSystem 
                      ? 'w-full max-w-2xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100 rounded-lg'
                      : 'bg-background border rounded-bl-none'
                  )}
                >
                  <div className={cn(
                      "text-sm prose dark:prose-invert prose-p:my-0 prose-headings:my-2",
                      isSystem && "prose-headings:text-amber-900 dark:prose-headings:text-amber-100"
                    )}>
                    {isUser && <p className="text-xs font-bold mb-2">{author}</p>}
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                      {contentWithDialogue}
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
                    <AvatarFallback>{getInitials(author)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
           {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div key="loading-indicator" className="flex items-start gap-4 justify-start">
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
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText()}
            className="flex-1 resize-none max-h-48 pr-12"
            rows={1}
            disabled={isLoading || !canAct}
            aria-label="Chat input"
          />
          <div className="absolute right-12 bottom-2">
            <SpeechInput onTranscript={setInput} disabled={isLoading || !canAct} />
          </div>
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !canAct} className="flex-shrink-0 bg-accent hover:bg-accent/90">
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
         {!canAct && activeCharacter && (
            <div className="text-center text-xs text-muted-foreground pt-2 animate-pulse flex items-center justify-center gap-2">
              <Ban className="h-3 w-3" />
              It's not your turn. Only questions are allowed.
            </div>
          )}
      </div>
    </div>
  );
}
