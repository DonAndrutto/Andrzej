import { markdownToPlainText } from "./plain-text";

const WORDS_PER_MINUTE = 225;

/** Estimated reading time in whole minutes (minimum 1). */
export function readingTimeMinutes(markdown: string): number {
  const words = markdownToPlainText(markdown)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
