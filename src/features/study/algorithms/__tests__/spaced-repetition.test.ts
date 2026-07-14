import { DAY_MS, MINUTE_MS } from '../../constants/study.constants';
import { calculateNextReview, type ReviewScheduleInput } from '../spaced-repetition';
const base: ReviewScheduleInput = {
  rating: 'good',
  reviewedAt: 1_700_000_000_000,
  status: 'new',
  repetitions: 0,
  intervalDays: 0,
  easeFactor: 2.5,
  lapseCount: 0,
  correctCount: 0,
  incorrectCount: 0,
};
describe('spaced repetition', () => {
  test('again schedules ten minutes and clamps ease', () => {
    const input = { ...base, rating: 'again' as const, easeFactor: 1.31 };
    const result = calculateNextReview(input);
    expect(result).toMatchObject({
      status: 'relearning',
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 1.3,
      lapseCount: 1,
      incorrectCount: 1,
    });
    expect(result.nextReviewAt).toBe(base.reviewedAt + 10 * MINUTE_MS);
    expect(input).toEqual({ ...base, rating: 'again', easeFactor: 1.31 });
  });
  test('hard starts at one day', () =>
    expect(calculateNextReview({ ...base, rating: 'hard' }).nextReviewAt).toBe(
      base.reviewedAt + DAY_MS,
    ));
  test('good follows 1, 3 then ease interval', () => {
    expect(calculateNextReview(base).intervalDays).toBe(1);
    expect(calculateNextReview({ ...base, repetitions: 1, intervalDays: 1 }).intervalDays).toBe(3);
    expect(calculateNextReview({ ...base, repetitions: 2, intervalDays: 3 }).intervalDays).toBe(8);
  });
  test('easy raises ease and interval', () =>
    expect(calculateNextReview({ ...base, rating: 'easy' })).toMatchObject({
      intervalDays: 4,
      easeFactor: 2.65,
    }));
  test('marks mastered and again returns to relearning', () => {
    const mastered = calculateNextReview({
      ...base,
      rating: 'easy',
      status: 'review',
      repetitions: 5,
      intervalDays: 50,
      correctCount: 8,
    });
    expect(mastered.status).toBe('mastered');
    expect(calculateNextReview({ ...base, rating: 'again', status: 'mastered' }).status).toBe(
      'relearning',
    );
  });
  test('normalizes invalid boundaries', () => {
    const result = calculateNextReview({
      ...base,
      repetitions: -2,
      intervalDays: -1,
      easeFactor: 9,
    });
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(3.5);
  });
});
