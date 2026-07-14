import {
  DAY_MS,
  MASTERED_INTERVAL_DAYS,
  MAX_EASE_FACTOR,
  MIN_EASE_FACTOR,
  MINUTE_MS,
  REVIEW_INTERVALS,
} from '../constants/study.constants';
import type { CardLearningStatus, ReviewRating } from '../types/study.types';
export interface ReviewScheduleInput {
  rating: ReviewRating;
  reviewedAt: number;
  status: CardLearningStatus;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapseCount: number;
  correctCount: number;
  incorrectCount: number;
}
export interface ReviewScheduleResult {
  status: CardLearningStatus;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapseCount: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: number;
  lastReviewedAt: number;
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function calculateNextReview(input: ReviewScheduleInput): ReviewScheduleResult {
  const repetitions = Math.max(0, input.repetitions);
  const previousInterval = Math.max(0, input.intervalDays);
  let ease = clamp(
    Number.isFinite(input.easeFactor) ? input.easeFactor : 2.5,
    MIN_EASE_FACTOR,
    MAX_EASE_FACTOR,
  );
  let result: ReviewScheduleResult = {
    status: input.status,
    repetitions,
    intervalDays: previousInterval,
    easeFactor: ease,
    lapseCount: Math.max(0, input.lapseCount),
    correctCount: Math.max(0, input.correctCount),
    incorrectCount: Math.max(0, input.incorrectCount),
    nextReviewAt: input.reviewedAt,
    lastReviewedAt: input.reviewedAt,
  };
  if (input.rating === 'again') {
    ease = clamp(ease - REVIEW_INTERVALS.againEasePenalty, MIN_EASE_FACTOR, MAX_EASE_FACTOR);
    return {
      ...result,
      status: 'relearning',
      repetitions: 0,
      intervalDays: 0,
      easeFactor: ease,
      lapseCount: result.lapseCount + 1,
      incorrectCount: result.incorrectCount + 1,
      nextReviewAt: input.reviewedAt + REVIEW_INTERVALS.againMinutes * MINUTE_MS,
    };
  }
  let interval: number;
  if (input.rating === 'hard') {
    interval =
      repetitions === 0
        ? REVIEW_INTERVALS.hardFirstDays
        : Math.max(1, Math.round(previousInterval * REVIEW_INTERVALS.hardMultiplier));
    ease = clamp(ease - REVIEW_INTERVALS.hardEasePenalty, MIN_EASE_FACTOR, MAX_EASE_FACTOR);
    result.status = repetitions === 0 ? 'learning' : 'review';
  } else if (input.rating === 'good') {
    interval =
      repetitions === 0
        ? REVIEW_INTERVALS.goodFirstDays
        : repetitions === 1
          ? REVIEW_INTERVALS.goodSecondDays
          : Math.max(previousInterval + 1, Math.round(previousInterval * ease));
    result.status = 'review';
  } else {
    interval =
      repetitions === 0
        ? REVIEW_INTERVALS.easyFirstDays
        : Math.max(
            previousInterval + 2,
            Math.round(previousInterval * ease * REVIEW_INTERVALS.easyMultiplier),
          );
    ease = clamp(ease + REVIEW_INTERVALS.easyEaseBonus, MIN_EASE_FACTOR, MAX_EASE_FACTOR);
    result.status = 'review';
  }
  result = {
    ...result,
    repetitions: repetitions + 1,
    intervalDays: interval,
    easeFactor: ease,
    correctCount: result.correctCount + 1,
    nextReviewAt: input.reviewedAt + interval * DAY_MS,
  };
  if (
    result.intervalDays >= MASTERED_INTERVAL_DAYS &&
    result.repetitions >= 5 &&
    result.correctCount > result.incorrectCount
  )
    result.status = 'mastered';
  return result;
}
