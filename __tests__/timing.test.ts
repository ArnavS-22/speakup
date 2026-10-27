import { formatClock, isOverLimit, secondsForWords, wordCount, wordsForMinutes } from '@/lib/timing';

describe('timing', () => {
  test('wordCount splits on whitespace', () => {
    expect(wordCount('  one two   three ')).toBe(3);
    expect(wordCount('')).toBe(0);
  });

  test('130 wpm conversions', () => {
    expect(wordsForMinutes(3)).toBe(390);
    expect(secondsForWords(130)).toBe(60);
  });

  test('over limit uses timeLimit * 130', () => {
    const over = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(isOverLimit(over, 3)).toBe(true);
    expect(isOverLimit('short comment', 3)).toBe(false);
  });

  test('formatClock pads minutes and seconds', () => {
    expect(formatClock(125)).toBe('02:05');
    expect(formatClock(0)).toBe('00:00');
  });
});
