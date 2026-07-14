import {
  InvalidDateRangeError,
  InvalidLearningGoalError,
  LearningGoalsNotFoundError,
} from '@/shared/errors/app-error';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  calculateGoalProgress,
  calculateStreak,
  difficultScore,
  emptyDay,
  fillMissingDays,
  heatmapIntensity,
} from '../algorithms/statistics-calculators';
import { DEFAULT_LEARNING_GOAL_ID } from '../constants/statistics.constants';
import type {
  DailyStatisticsPoint,
  DeckProgressSummary,
  DifficultCardSummary,
  LearningGoals,
  ProgressOverview,
  StatisticsRange,
  StudyActivityDay,
  StudyHistoryItem,
} from '../types/statistics.types';
import type { StatisticsRepository } from './statistics-repository';
type StatRow = {
  study_date: string;
  studied_cards: number;
  correct_answers: number;
  incorrect_answers: number;
  new_cards: number;
  reviewed_cards: number;
  study_seconds: number;
  earned_xp: number;
  study_sessions: number;
};
const mapDay = (r: StatRow): DailyStatisticsPoint => ({
  date: r.study_date,
  studiedCards: r.studied_cards,
  correctAnswers: r.correct_answers,
  incorrectAnswers: r.incorrect_answers,
  newCards: r.new_cards,
  reviewedCards: r.reviewed_cards,
  studySeconds: r.study_seconds,
  earnedXp: r.earned_xp,
  sessions: r.study_sessions,
});
function valid(range: StatisticsRange) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.startDate) || range.startDate > range.endDate)
    throw new InvalidDateRangeError('Khoảng ngày không hợp lệ.');
}
export class SQLiteStatisticsRepository implements StatisticsRepository {
  constructor(private readonly database: SQLiteDatabase) {}
  async getDailyStatistics(range: StatisticsRange) {
    valid(range);
    const rows = await this.database.getAllAsync<StatRow>(
      'SELECT * FROM daily_statistics WHERE study_date BETWEEN ? AND ? ORDER BY study_date',
      [range.startDate, range.endDate],
    );
    return fillMissingDays(rows.map(mapDay), range.startDate, range.endDate);
  }
  async getLearningGoals() {
    const r = await this.database.getFirstAsync<any>('SELECT * FROM learning_goals WHERE id=?', [
      DEFAULT_LEARNING_GOAL_ID,
    ]);
    if (!r) throw new LearningGoalsNotFoundError('Không tìm thấy mục tiêu học tập.');
    return {
      id: r.id,
      dailyCardGoal: r.daily_card_goal,
      dailyMinutesGoal: r.daily_minutes_goal,
      weeklyDaysGoal: r.weekly_days_goal,
      dailyNewCardsGoal: r.daily_new_cards_goal,
      dailyReviewCardsGoal: r.daily_review_cards_goal,
      updatedAt: r.updated_at,
    };
  }
  async updateLearningGoals(g: Omit<LearningGoals, 'id' | 'updatedAt'>, now: number) {
    if (Object.values(g).some((v) => !Number.isInteger(v) || v < 1 || v > 1000))
      throw new InvalidLearningGoalError('Mục tiêu phải là số nguyên dương.');
    await this.database.runAsync(
      "UPDATE learning_goals SET daily_card_goal=?,daily_minutes_goal=?,weekly_days_goal=?,daily_new_cards_goal=?,daily_review_cards_goal=?,updated_at=?,sync_status='pending' WHERE id=?",
      [
        g.dailyCardGoal,
        g.dailyMinutesGoal,
        Math.min(g.weeklyDaysGoal, 7),
        g.dailyNewCardsGoal,
        g.dailyReviewCardsGoal,
        now,
        DEFAULT_LEARNING_GOAL_ID,
      ],
    );
    return this.getLearningGoals();
  }
  async getHomeDashboard(today: string, weekStart: string, now: number) {
    const [goals, todayRow, activeDates, counts, total] = await Promise.all([
      this.getLearningGoals(),
      this.database.getFirstAsync<StatRow>('SELECT * FROM daily_statistics WHERE study_date=?', [
        today,
      ]),
      this.database.getAllAsync<{ study_date: string }>(
        'SELECT study_date FROM daily_statistics WHERE study_date BETWEEN ? AND ? AND studied_cards>0',
        [weekStart, today],
      ),
      this.database.getFirstAsync<{ due: number; fresh: number }>(
        `SELECT SUM(CASE WHEN cp.status<>'new' AND cp.next_review_at<=? THEN 1 ELSE 0 END) due,SUM(CASE WHEN COALESCE(cp.status,'new')='new' THEN 1 ELSE 0 END) fresh FROM cards c LEFT JOIN card_progress cp ON cp.card_id=c.id WHERE c.deleted_at IS NULL`,
        [now],
      ),
      this.database.getFirstAsync<{ xp: number }>(
        'SELECT COALESCE(SUM(earned_xp),0) xp FROM daily_statistics',
      ),
    ]);
    const day = todayRow ? mapDay(todayRow) : emptyDay(today);
    const dates = await this.database.getAllAsync<{ study_date: string }>(
      'SELECT study_date FROM daily_statistics WHERE studied_cards>0 ORDER BY study_date',
    );
    return {
      today: day,
      cardGoal: calculateGoalProgress(day.studiedCards, goals.dailyCardGoal),
      minutesGoal: calculateGoalProgress(Math.round(day.studySeconds / 60), goals.dailyMinutesGoal),
      weeklyDays: calculateGoalProgress(activeDates.length, goals.weeklyDaysGoal),
      streak: calculateStreak(
        dates.map((d) => d.study_date),
        today,
      ),
      dueCards: counts?.due ?? 0,
      newCards: counts?.fresh ?? 0,
      totalXp: total?.xp ?? 0,
    };
  }
  async getProgressOverview(range: StatisticsRange): Promise<ProgressOverview> {
    const days = await this.getDailyStatistics(range);
    const totals = days.reduce(
      (a, d) => ({
        ...a,
        studiedCards: a.studiedCards + d.studiedCards,
        correctAnswers: a.correctAnswers + d.correctAnswers,
        incorrectAnswers: a.incorrectAnswers + d.incorrectAnswers,
        newCards: a.newCards + d.newCards,
        reviewedCards: a.reviewedCards + d.reviewedCards,
        studySeconds: a.studySeconds + d.studySeconds,
        earnedXp: a.earnedXp + d.earnedXp,
        sessions: a.sessions + d.sessions,
      }),
      emptyDay(range.startDate),
    );
    const active = days.filter((d) => d.studiedCards > 0).length;
    const answered = totals.correctAnswers + totals.incorrectAnswers;
    const distribution = await this.database.getAllAsync<{ status: string; count: number }>(
      'SELECT status,COUNT(*) count FROM card_progress GROUP BY status',
    );
    return {
      totals,
      accuracy: answered ? Math.round((totals.correctAnswers / answered) * 100) : 0,
      averageCardsPerActiveDay: active ? Math.round(totals.studiedCards / active) : 0,
      averageMinutesPerActiveDay: active ? Math.round(totals.studySeconds / 60 / active) : 0,
      activeDays: active,
      trendPercent: 0,
      distribution: Object.fromEntries(distribution.map((x) => [x.status, x.count])),
    };
  }
  async getDeckProgress(): Promise<DeckProgressSummary[]> {
    const rows = await this.database.getAllAsync<any>(
      `SELECT d.id deckId,d.name,COUNT(c.id) totalCards,SUM(CASE WHEN COALESCE(cp.status,'new')='new' THEN 1 ELSE 0 END) newCards,SUM(CASE WHEN cp.status IN ('learning','review','relearning') THEN 1 ELSE 0 END) learningCards,SUM(CASE WHEN cp.status='mastered' THEN 1 ELSE 0 END) masteredCards,COALESCE(ROUND(100.0*SUM(cp.correct_count)/NULLIF(SUM(cp.correct_count+cp.incorrect_count),0)),0) accuracy FROM decks d LEFT JOIN cards c ON c.deck_id=d.id AND c.deleted_at IS NULL LEFT JOIN card_progress cp ON cp.card_id=c.id WHERE d.deleted_at IS NULL GROUP BY d.id ORDER BY d.updated_at DESC`,
    );
    return rows;
  }
  async getDifficultCards(limit = 20): Promise<DifficultCardSummary[]> {
    const rows = await this.database.getAllAsync<any>(
      `SELECT c.id cardId,c.front_text frontText,c.back_text backText,d.name deckName,cp.incorrect_count incorrectCount,cp.lapse_count lapseCount,cp.total_review_count reviews FROM card_progress cp JOIN cards c ON c.id=cp.card_id JOIN decks d ON d.id=c.deck_id WHERE c.deleted_at IS NULL AND (cp.incorrect_count>0 OR cp.lapse_count>0) ORDER BY (cp.incorrect_count*2+cp.lapse_count*3) DESC LIMIT ?`,
      [limit],
    );
    return rows.map((r) => ({
      ...r,
      difficultyScore: difficultScore(r.incorrectCount, r.lapseCount, r.reviews),
    }));
  }
  async getHeatmap(range: StatisticsRange): Promise<StudyActivityDay[]> {
    const days = await this.getDailyStatistics(range);
    const max = Math.max(0, ...days.map((d) => d.studiedCards));
    return days.map((d) => ({
      date: d.date,
      studiedCards: d.studiedCards,
      intensity: heatmapIntensity(d.studiedCards, max),
    }));
  }
  async getStudyHistory(limit = 20, offset = 0): Promise<StudyHistoryItem[]> {
    return this.database.getAllAsync<any>(
      `SELECT id,status,started_at startedAt,completed_at completedAt,answered_cards cards,CASE WHEN answered_cards>0 THEN ROUND(100.0*correct_answers/answered_cards) ELSE 0 END accuracy,duration_seconds durationSeconds,earned_xp earnedXp FROM study_sessions WHERE status IN ('completed','abandoned') ORDER BY COALESCE(completed_at,updated_at) DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }
}
