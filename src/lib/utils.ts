import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDialogue(text: string) {
  if (!text) return text;
  // Replace unescaped double quotes with a span for styling
  // This regex finds text wrapped in double quotes and wraps it in a span.
  // It handles multiple quotes in a single block of text.
  return text.replace(/"([^"]*)"/g, '<span class="dialogue">"$1"</span>');
}

// Helper function to clean up markdown formatting from AI responses
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
