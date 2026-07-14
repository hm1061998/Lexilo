import { calculateCurrentStreak } from '../streak-calculator';
import { calculateAnswerXp } from '../xp-calculator';
describe('XP and streak', () => {
  test('calculates mode bonuses and penalties', () => {
    expect(
      calculateAnswerXp({
        mode: 'typing',
        rating: 'easy',
        isCorrect: true,
        responseTimeMs: 3000,
        usedHint: false,
        isNewCard: true,
      }),
    ).toBe(17);
    expect(
      calculateAnswerXp({
        mode: 'flashcard',
        rating: 'again',
        isCorrect: false,
        responseTimeMs: 9000,
        usedHint: true,
        isNewCard: false,
      }),
    ).toBe(2);
  });
  test('streak handles today, yesterday, duplicates and unsorted input', () => {
    expect(calculateCurrentStreak(['2026-01-02', '2026-01-01', '2026-01-02'], '2026-01-03')).toBe(
      2,
    );
    expect(calculateCurrentStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2);
    expect(calculateCurrentStreak([], '2026-01-01')).toBe(0);
  });
});
