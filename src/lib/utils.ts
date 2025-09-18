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
    // Ensure proper spacing around bullet points and numbered lists
    .replace(/(\S)([*•-])/g, '$1\n$2') // Ensure newline before a bullet
    .replace(/(\d+\.)([^\s])/g, '$1 $2') // Ensure space after a numbered list item
    // Standardize bolding and remove mangled asterisks
    .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
    .replace(/ \*\* /g, ' **') // Correct spacing for bold
    // Ensure titles/headings have space after them, without being too greedy
    .replace(/(\*\*|##)\s*([^\n]+?)\s*(\*\*|##)/g, '**$2**\n\n')
    .trim();
}
