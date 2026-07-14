export type StudyMode = 'flashcard' | 'multiple_choice' | 'typing';
export type SupportedStudyMode =
  StudyMode | 'listening' | 'true_false' | 'sentence_ordering' | 'speaking';
export type StudyScope = 'due' | 'new' | 'mixed' | 'all';
export type StudySessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type CardLearningStatus =
  'new' | 'learning' | 'review' | 'relearning' | 'mastered' | 'suspended';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface StudySetup {
  deckIds: string[];
  mode: StudyMode;
  scope: StudyScope;
  cardLimit: number;
  newCardLimit: number;
  reviewCardLimit: number;
  shuffle: boolean;
  autoPlayAudio: boolean;
  includeMastered: boolean;
}
export interface StudyCard {
  cardId: string;
  deckId: string;
  frontText: string;
  backText: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  exampleText: string | null;
  exampleTranslation: string | null;
  audioUri: string | null;
  imageUri: string | null;
  difficulty: number;
  learningStatus: CardLearningStatus;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: number | null;
  lastReviewedAt: number | null;
  correctCount: number;
  incorrectCount: number;
  lapseCount: number;
}
export interface BaseStudyQuestion {
  id: string;
  sessionItemId: string;
  cardId: string;
  mode: StudyMode;
  prompt: string;
  createdAt: number;
}
export interface FlashcardStudyQuestion extends BaseStudyQuestion {
  mode: 'flashcard';
  frontText: string;
  backText: string;
  phonetic: string | null;
  exampleText: string | null;
  exampleTranslation: string | null;
}
export interface MultipleChoiceOption {
  id: string;
  text: string;
  cardId: string | null;
}
export interface MultipleChoiceStudyQuestion extends BaseStudyQuestion {
  mode: 'multiple_choice';
  promptText: string;
  options: MultipleChoiceOption[];
  correctOptionId: string;
}
export interface TypingStudyQuestion extends BaseStudyQuestion {
  mode: 'typing';
  promptText: string;
  acceptedAnswers: string[];
  hint: string | null;
}
export type StudyQuestion =
  FlashcardStudyQuestion | MultipleChoiceStudyQuestion | TypingStudyQuestion;
export interface StudySessionItem {
  id: string;
  sessionId: string;
  cardId: string;
  position: number;
  mode: StudyMode;
  status: 'pending' | 'current' | 'answered' | 'skipped';
  question: StudyQuestion;
  answeredAt: number | null;
  rating: ReviewRating | null;
  isCorrect: boolean | null;
  responseTimeMs: number | null;
}
export interface StudySession {
  id: string;
  deckIds: string[];
  mode: StudyMode;
  scope: StudyScope;
  status: StudySessionStatus;
  startedAt: number;
  pausedAt: number | null;
  completedAt: number | null;
  currentItemIndex: number;
  totalCards: number;
  answeredCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  durationSeconds: number;
  earnedXp: number;
  setup: StudySetup;
}
export interface StudySessionResult {
  session: StudySession;
  accuracy: number;
  wrongAnswers: { cardId: string; frontText: string; backText: string }[];
}
