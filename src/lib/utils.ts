import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDialogue(text: string, messageId: string = 'msg'): string {
  if (!text) return text;

  // First, handle dialogue spans
  let processedText = text.replace(/"([^"]*)"/g, '<span class="dialogue">"$1"</span>');

  // Then, inject speaker buttons next to all markdown headers
  let headingCounter = 0;
  processedText = processedText.replace(/^(#+)(.*)$/gm, (match, hashes, headingText) => {
    const headingLevel = hashes.length;
    const uniqueId = `${messageId}-h${headingLevel}-${headingCounter++}`;
    const buttonHtml = `<button class="tts-play-button" data-play-id="${uniqueId}" aria-label="Play section"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>`;
    
    // The content to be played is wrapped in a span with the unique ID
    const contentToPlay = `<span id="${uniqueId}">${match}</span>`;
    
    return `${buttonHtml}${contentToPlay}`;
  });

  // Inject a play button for the whole message if no headers were found
  if (headingCounter === 0) {
      const uniqueId = `${messageId}-full`;
      const buttonHtml = `<button class="tts-play-button" data-play-id="${uniqueId}" aria-label="Play section"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>`;
      processedText = `${buttonHtml}<span id="${uniqueId}">${processedText}</span>`;
  }

  return processedText;
}


// Helper function to clean up markdown formatting from AI responses FOR SPEECH
export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return text;
  return text
    // Remove markdown headers (e.g., #, ##, ###)
    .replace(/^#+\s*/gm, '')
    // Remove bold and italic markers but keep the text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove any remaining markdown-like symbols that are sometimes used for lists
    .replace(/^[*-]\s+/gm, '')
    // Collapse multiple newlines into a single space for better flow
    .replace(/\n+/g, ' ')
    // Trim whitespace from the start and end of the string
    .trim();
}

// Original clean markdown for display purposes if needed
export function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    // Remove markdown headers and titles (e.g., #, ##, ###, **Title:**)
    .replace(/^#+\s.*$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '')
    // Remove all other markdown symbols like *, _, `
    .replace(/[*_`]/g, '')
    // Remove any lines that are just whitespace
    .replace(/^\s*$/gm, '')
    // Trim whitespace from the start and end of the string
    .trim();
}
