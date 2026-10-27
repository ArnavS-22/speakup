import { WORDS_PER_MINUTE } from '@/config';

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Chinese has no spaces: count roughly 1.6 characters per spoken word.
  const cjk = (trimmed.match(/[\u3400-\u9fff]/g) ?? []).length;
  const rest = trimmed.replace(/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef“”]/g, ' ').trim();
  const latin = rest ? rest.split(/\s+/).length : 0;
  return latin + Math.round(cjk / 1.6);
}

export function secondsForWords(words: number, wpm: number = WORDS_PER_MINUTE): number {
  if (words <= 0) return 0;
  return Math.round((words / wpm) * 60);
}

export function wordsForMinutes(minutes: number, wpm: number = WORDS_PER_MINUTE): number {
  return Math.round(minutes * wpm);
}

export function targetWordCount(timeLimitMinutes: number): number {
  return Math.round(wordsForMinutes(timeLimitMinutes) * 0.85);
}

export function isOverLimit(
  text: string,
  timeLimitMinutes: number,
  wpm: number = WORDS_PER_MINUTE,
): boolean {
  return wordCount(text) > wordsForMinutes(timeLimitMinutes, wpm);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatEstimatedTime(text: string, wpm: number = WORDS_PER_MINUTE): string {
  const seconds = secondsForWords(wordCount(text), wpm);
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
