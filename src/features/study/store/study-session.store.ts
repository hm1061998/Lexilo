import { create } from 'zustand';
import type { ReviewRating } from '../types/study.types';
interface StudyUiState {
  answerStartedAt: number;
  selectedAnswer: string | null;
  showAnswer: boolean;
  feedback: 'correct' | 'incorrect' | null;
  recommendedRating: ReviewRating | null;
  usedHint: boolean;
  startAnswer: (at: number) => void;
  selectAnswer: (answer: string) => void;
  revealAnswer: () => void;
  setFeedback: (feedback: 'correct' | 'incorrect', rating: ReviewRating) => void;
  useHint: () => void;
  resetQuestion: (at: number) => void;
}
export const useStudySessionStore = create<StudyUiState>((set) => ({
  answerStartedAt: 0,
  selectedAnswer: null,
  showAnswer: false,
  feedback: null,
  recommendedRating: null,
  usedHint: false,
  startAnswer: (at) => set({ answerStartedAt: at }),
  selectAnswer: (selectedAnswer) => set({ selectedAnswer }),
  revealAnswer: () => set({ showAnswer: true }),
  setFeedback: (feedback, recommendedRating) =>
    set({ feedback, recommendedRating, showAnswer: true }),
  useHint: () => set({ usedHint: true }),
  resetQuestion: (answerStartedAt) =>
    set({
      answerStartedAt,
      selectedAnswer: null,
      showAnswer: false,
      feedback: null,
      recommendedRating: null,
      usedHint: false,
    }),
}));
