import type { ReviewRating, StudyMode } from '../types/study.types';
export interface XpCalculationInput {
  mode: StudyMode;
  rating: ReviewRating;
  isCorrect: boolean;
  responseTimeMs: number;
  usedHint: boolean;
  isNewCard: boolean;
}
const BASE: Record<StudyMode, number> = { flashcard: 5, multiple_choice: 7, typing: 10 };
export function calculateAnswerXp(input: XpCalculationInput): number {
  let xp =
    BASE[input.mode] +
    (input.rating === 'good' ? 2 : input.rating === 'easy' ? 4 : 0) +
    (input.isNewCard ? 2 : 0) +
    (input.responseTimeMs > 0 && input.responseTimeMs <= 5_000 ? 1 : 0);
  if (input.usedHint) xp *= 0.75;
  if (!input.isCorrect) xp *= 0.5;
  return Math.min(20, Math.max(0, Math.round(xp)));
}
