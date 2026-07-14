export type StatisticsPeriod = 'week' | 'month' | 'year';
export interface StatisticsRange {
  startDate: string;
  endDate: string;
}
export interface LearningGoals {
  id: string;
  dailyCardGoal: number;
  dailyMinutesGoal: number;
  weeklyDaysGoal: number;
  dailyNewCardsGoal: number;
  dailyReviewCardsGoal: number;
  updatedAt: number;
}
export interface DailyStatisticsPoint {
  date: string;
  studiedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  newCards: number;
  reviewedCards: number;
  studySeconds: number;
  earnedXp: number;
  sessions: number;
}
export interface StreakSummary {
  current: number;
  longest: number;
  nextMilestone: number;
}
export interface GoalProgress {
  current: number;
  target: number;
  ratio: number;
  completed: boolean;
  exceeded: boolean;
}
export interface HomeDashboardSummary {
  today: DailyStatisticsPoint;
  cardGoal: GoalProgress;
  minutesGoal: GoalProgress;
  weeklyDays: GoalProgress;
  streak: StreakSummary;
  dueCards: number;
  newCards: number;
  totalXp: number;
}
export interface DeckProgressSummary {
  deckId: string;
  name: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  masteredCards: number;
  accuracy: number;
}
export interface DifficultCardSummary {
  cardId: string;
  frontText: string;
  backText: string;
  deckName: string;
  incorrectCount: number;
  lapseCount: number;
  difficultyScore: number;
}
export interface StudyActivityDay {
  date: string;
  studiedCards: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}
export interface ProgressOverview {
  totals: DailyStatisticsPoint;
  accuracy: number;
  averageCardsPerActiveDay: number;
  averageMinutesPerActiveDay: number;
  activeDays: number;
  trendPercent: number;
  distribution: Record<string, number>;
}
export interface StudyHistoryItem {
  id: string;
  status: string;
  startedAt: number;
  completedAt: number | null;
  cards: number;
  accuracy: number;
  durationSeconds: number;
  earnedXp: number;
}
