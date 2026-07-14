import type {
  ReviewRating,
  StudyCard,
  StudyMode,
  StudyQuestion,
  StudyScope,
  StudySession,
  StudySessionItem,
  StudySessionResult,
  StudySetup,
} from '../types/study.types';
export interface GetStudyCandidatesOptions {
  deckIds: string[];
  scope: StudyScope;
  currentTime: number;
  includeMastered: boolean;
  newCardLimit: number;
  reviewCardLimit: number;
  totalLimit: number;
}
export interface CreateStudySessionInput {
  setup: StudySetup;
  cards: StudyCard[];
  questions: StudyQuestion[];
  startedAt: number;
}
export interface SubmitStudyAnswerInput {
  sessionId: string;
  sessionItemId: string;
  cardId: string;
  mode: StudyMode;
  submittedAnswer: string | null;
  expectedAnswer: string;
  rating: ReviewRating;
  isCorrect: boolean;
  responseTimeMs: number;
  reviewedAt: number;
  usedHint?: boolean;
}
export interface SubmitStudyAnswerResult {
  session: StudySession;
  item: StudySessionItem;
  xpEarned: number;
  nextReviewAt: number;
}
export interface StudySessionRepository {
  getStudyCandidates(options: GetStudyCandidatesOptions): Promise<StudyCard[]>;
  createSession(input: CreateStudySessionInput): Promise<StudySession>;
  findActiveSession(): Promise<StudySession | null>;
  findSessionById(sessionId: string): Promise<StudySession | null>;
  getSessionItems(sessionId: string): Promise<StudySessionItem[]>;
  getCurrentSessionItem(sessionId: string): Promise<StudySessionItem | null>;
  submitAnswer(input: SubmitStudyAnswerInput): Promise<SubmitStudyAnswerResult>;
  pauseSession(sessionId: string, pausedAt: number): Promise<void>;
  resumeSession(sessionId: string, resumedAt: number): Promise<void>;
  completeSession(sessionId: string, completedAt: number): Promise<StudySessionResult>;
  abandonSession(sessionId: string, abandonedAt: number): Promise<void>;
  getSessionResult(sessionId: string): Promise<StudySessionResult>;
}
