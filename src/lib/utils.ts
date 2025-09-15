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
