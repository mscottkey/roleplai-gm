import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDialogue(text: string): string {
  if (!text) return text;
  return text.replace(/"([^"]*)"/g, '<span class="dialogue">"$1"</span>');
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
