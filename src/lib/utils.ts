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
    // Fix escaped newlines
    .replace(/\\n/g, '\n')
    // Convert old-style bold headers to proper markdown headers
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\*\*/g, '## $1')
    .replace(/\*\*(Key Factions|Notable Locations|Tone Levers):\s*/g, '## $1\n\n')
    // Fix malformed bullet points patterns - be more conservative
    .replace(/\*\*\*\*\* /g, '* ')
    .replace(/\*\*\*\* /g, '* ')
    // Fix mangled asterisks around text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
    // Clean up excessive whitespace but preserve single spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Fix newlines - collapse excessive ones but preserve intentional breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/\n(##\s+[^\n]+)\n/g, '\n\n$1\n\n')
    // Ensure bullet points are on new lines if they aren't already
    .replace(/([^\n])\s*\* /g, '$1\n* ')
    .trim();
}