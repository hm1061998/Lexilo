import { evaluateTypingAnswer, levenshteinDistance, normalizeAnswer } from '../answer-normalizer';
describe('typing answer', () => {
  test('normalizes case and spaces', () =>
    expect(normalizeAnswer('  Maintain   APP ')).toBe('maintain app'));
  test('supports Unicode normalization', () => expect(normalizeAnswer('CÀ PHÊ')).toBe('cà phê'));
  test('allows one typo for long answers', () =>
    expect(evaluateTypingAnswer('maintan', ['maintain'])).toMatchObject({
      isCorrect: true,
      isMinorTypo: true,
    }));
  test('rejects typo for short words and preserves punctuation', () => {
    expect(evaluateTypingAnswer('cat', ['cut']).isCorrect).toBe(false);
    expect(evaluateTypingAnswer('login', ['log-in']).isCorrect).toBe(false);
  });
  test('calculates distance', () => expect(levenshteinDistance('kitten', 'sitting')).toBe(3));
});
