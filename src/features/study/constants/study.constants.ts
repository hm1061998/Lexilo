import type { ReviewRating } from '../types/study.types';
export const REVIEW_RATING_SCORE: Record<ReviewRating, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.5;
export const MASTERED_INTERVAL_DAYS = 60;
export const REVIEW_INTERVALS = {
  againMinutes: 10,
  hardFirstDays: 1,
  goodFirstDays: 1,
  goodSecondDays: 3,
  easyFirstDays: 4,
  hardMultiplier: 1.2,
  easyMultiplier: 1.3,
  hardEasePenalty: 0.15,
  againEasePenalty: 0.2,
  easyEaseBonus: 0.15,
} as const;
export const DAY_MS = 86_400_000;
export const MINUTE_MS = 60_000;
