import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import {
  ActiveStudySessionExistsError,
  InvalidStudySessionTransitionError,
  NoStudyCardsAvailableError,
  StudyItemAlreadyAnsweredError,
  StudyItemNotFoundError,
  StudySessionNotFoundError,
} from '@/shared/errors/app-error';
import { calculateNextReview } from '../algorithms/spaced-repetition';
import { calculateAnswerXp } from '../algorithms/xp-calculator';
import { REVIEW_RATING_SCORE } from '../constants/study.constants';
import type {
  CreateStudySessionInput,
  GetStudyCandidatesOptions,
  StudySessionRepository,
  SubmitStudyAnswerInput,
  SubmitStudyAnswerResult,
} from './study-repository';
import type {
  CardLearningStatus,
  StudyCard,
  StudyQuestion,
  StudySession,
  StudySessionItem,
  StudySessionResult,
  StudySetup,
} from '../types/study.types';
import { toLocalStudyDate } from '../utils/study-time';

interface SessionRow {
  id: string;
  mode: StudySession['mode'];
  scope: StudySession['scope'];
  status: StudySession['status'];
  started_at: number;
  paused_at: number | null;
  completed_at: number | null;
  current_item_index: number;
  total_cards: number;
  answered_cards: number;
  correct_answers: number;
  incorrect_answers: number;
  duration_seconds: number;
  earned_xp: number;
  settings_json: string | null;
  deck_ids: string | null;
}
interface ItemRow {
  id: string;
  session_id: string;
  card_id: string;
  position: number;
  mode: StudySessionItem['mode'];
  status: StudySessionItem['status'];
  question_json: string;
  answered_at: number | null;
  rating: StudySessionItem['rating'];
  is_correct: number | null;
  response_time_ms: number | null;
}
const parseSetup = (value: string | null): StudySetup =>
  value
    ? (JSON.parse(value) as StudySetup)
    : {
        deckIds: [],
        mode: 'flashcard',
        scope: 'mixed',
        cardLimit: 20,
        newCardLimit: 10,
        reviewCardLimit: 20,
        shuffle: true,
        autoPlayAudio: false,
        includeMastered: false,
      };
function mapSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    deckIds: row.deck_ids ? row.deck_ids.split(',') : [],
    mode: row.mode,
    scope: row.scope,
    status: row.status,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    completedAt: row.completed_at,
    currentItemIndex: row.current_item_index,
    totalCards: row.total_cards,
    answeredCards: row.answered_cards,
    correctAnswers: row.correct_answers,
    incorrectAnswers: row.incorrect_answers,
    durationSeconds: row.duration_seconds,
    earnedXp: row.earned_xp,
    setup: parseSetup(row.settings_json),
  };
}
function mapItem(row: ItemRow): StudySessionItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    cardId: row.card_id,
    position: row.position,
    mode: row.mode,
    status: row.status,
    question: JSON.parse(row.question_json) as StudyQuestion,
    answeredAt: row.answered_at,
    rating: row.rating,
    isCorrect: row.is_correct === null ? null : row.is_correct === 1,
    responseTimeMs: row.response_time_ms,
  };
}
const SESSION_SELECT = `SELECT s.*,(SELECT group_concat(deck_id) FROM study_session_decks WHERE session_id=s.id) deck_ids FROM study_sessions s`;

export class SQLiteStudyRepository implements StudySessionRepository {
  constructor(private readonly database: SQLiteDatabase) {}
  async getStudyCandidates(options: GetStudyCandidatesOptions): Promise<StudyCard[]> {
    if (!options.deckIds.length) return [];
    const placeholders = options.deckIds.map(() => '?').join(',');
    const params: (string | number)[] = [...options.deckIds];
    let scope = '';
    if (options.scope === 'due') {
      scope = `AND cp.status<>'new' AND cp.next_review_at<=?`;
      params.push(options.currentTime);
    } else if (options.scope === 'new') scope = `AND cp.status='new'`;
    else if (options.scope === 'mixed') {
      scope = `AND (cp.status='new' OR cp.next_review_at<=?)`;
      params.push(options.currentTime);
    }
    if (!options.includeMastered) scope += ` AND cp.status<>'mastered'`;
    const rows = await this.database.getAllAsync<Record<string, string | number | null>>(
      `SELECT c.id card_id,c.deck_id,c.front_text,c.back_text,c.phonetic,c.part_of_speech,c.example_text,c.example_translation,c.audio_uri,c.image_uri,c.difficulty,cp.id progress_id,cp.status,cp.repetitions,cp.interval_days,cp.ease_factor,cp.next_review_at,cp.last_reviewed_at,cp.correct_count,cp.incorrect_count,cp.lapse_count FROM cards c JOIN decks d ON d.id=c.deck_id LEFT JOIN card_progress cp ON cp.card_id=c.id WHERE c.deck_id IN (${placeholders}) AND c.deleted_at IS NULL AND d.deleted_at IS NULL AND COALESCE(cp.status,'new')<>'suspended' ${scope} ORDER BY CASE COALESCE(cp.status,'new') WHEN 'relearning' THEN 1 WHEN 'learning' THEN 2 WHEN 'review' THEN 3 WHEN 'new' THEN 4 WHEN 'mastered' THEN 5 ELSE 6 END,cp.next_review_at ASC,cp.lapse_count DESC,c.created_at ASC LIMIT ?`,
      [...params, Math.min(options.totalLimit, 100)],
    );
    const missing = rows.filter((row) => row.progress_id === null);
    if (missing.length) {
      await this.database.withExclusiveTransactionAsync(async (tx) => {
        const queue = new SQLiteSyncQueueRepository(tx);
        const now = options.currentTime;
        for (const row of missing) {
          const progressId = randomUUID();
          await tx.runAsync(
            `INSERT OR IGNORE INTO card_progress(id,card_id,created_at,updated_at,sync_status) VALUES(?,?,?,?,'pending')`,
            [progressId, String(row.card_id), now, now],
          );
          await queue.enqueue({
            entityType: 'card_progress',
            entityId: progressId,
            operation: 'create',
          });
        }
      });
    }
    return rows.map((row) => ({
      cardId: String(row.card_id),
      deckId: String(row.deck_id),
      frontText: String(row.front_text),
      backText: String(row.back_text),
      phonetic: row.phonetic as string | null,
      partOfSpeech: row.part_of_speech as string | null,
      exampleText: row.example_text as string | null,
      exampleTranslation: row.example_translation as string | null,
      audioUri: row.audio_uri as string | null,
      imageUri: row.image_uri as string | null,
      difficulty: Number(row.difficulty),
      learningStatus: (row.status ?? 'new') as CardLearningStatus,
      repetitions: Number(row.repetitions ?? 0),
      intervalDays: Number(row.interval_days ?? 0),
      easeFactor: Number(row.ease_factor ?? 2.5),
      nextReviewAt: row.next_review_at as number | null,
      lastReviewedAt: row.last_reviewed_at as number | null,
      correctCount: Number(row.correct_count ?? 0),
      incorrectCount: Number(row.incorrect_count ?? 0),
      lapseCount: Number(row.lapse_count ?? 0),
    }));
  }
  async createSession(input: CreateStudySessionInput): Promise<StudySession> {
    if (await this.findActiveSession())
      throw new ActiveStudySessionExistsError('Đang có một phiên học chưa hoàn thành.');
    if (!input.cards.length) throw new NoStudyCardsAvailableError('Không có flashcard phù hợp.');
    const id = randomUUID();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `INSERT INTO study_sessions(id,mode,scope,status,started_at,total_cards,settings_json,created_at,updated_at,sync_status) VALUES(?,?,?,'active',?,?,?,?,?,'pending')`,
        [
          id,
          input.setup.mode,
          input.setup.scope,
          input.startedAt,
          input.cards.length,
          JSON.stringify(input.setup),
          input.startedAt,
          input.startedAt,
        ],
      );
      for (const deckId of input.setup.deckIds)
        await tx.runAsync(`INSERT INTO study_session_decks(session_id,deck_id) VALUES(?,?)`, [
          id,
          deckId,
        ]);
      for (let i = 0; i < input.cards.length; i++)
        await tx.runAsync(
          `INSERT INTO study_session_items(id,session_id,card_id,position,mode,status,question_json,created_at,updated_at) VALUES(?,?,?,?,?,? ,?,?,?)`,
          [
            input.questions[i].sessionItemId,
            id,
            input.cards[i].cardId,
            i,
            input.setup.mode,
            i === 0 ? 'current' : 'pending',
            JSON.stringify(input.questions[i]),
            input.startedAt,
            input.startedAt,
          ],
        );
      const studyDate = toLocalStudyDate(input.startedAt);
      await tx.runAsync(
        `INSERT INTO daily_statistics(id,study_date,study_sessions,created_at,updated_at,sync_status)
         VALUES(?,?,1,?,?,'pending')
         ON CONFLICT(study_date) DO UPDATE SET study_sessions=study_sessions+1,updated_at=?`,
        [randomUUID(), studyDate, input.startedAt, input.startedAt, input.startedAt],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'study_session',
        entityId: id,
        operation: 'create',
        payload: input.setup,
      });
    });
    const session = await this.findSessionById(id);
    if (!session) throw new StudySessionNotFoundError('Không thể tạo phiên học.');
    return session;
  }
  async findActiveSession() {
    const row = await this.database.getFirstAsync<SessionRow>(
      `${SESSION_SELECT} WHERE s.status IN ('active','paused') ORDER BY s.updated_at DESC LIMIT 1`,
    );
    return row ? mapSession(row) : null;
  }
  async findSessionById(id: string) {
    const row = await this.database.getFirstAsync<SessionRow>(`${SESSION_SELECT} WHERE s.id=?`, [
      id,
    ]);
    return row ? mapSession(row) : null;
  }
  async getSessionItems(id: string) {
    return (
      await this.database.getAllAsync<ItemRow>(
        `SELECT * FROM study_session_items WHERE session_id=? ORDER BY position`,
        [id],
      )
    ).map(mapItem);
  }
  async getCurrentSessionItem(id: string) {
    const row = await this.database.getFirstAsync<ItemRow>(
      `SELECT * FROM study_session_items WHERE session_id=? AND status='current' LIMIT 1`,
      [id],
    );
    return row ? mapItem(row) : null;
  }
  async submitAnswer(input: SubmitStudyAnswerInput): Promise<SubmitStudyAnswerResult> {
    let xp = 0;
    let nextReviewAt = 0;
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      const sessionState = await tx.getFirstAsync<{ status: string }>(
        `SELECT status FROM study_sessions WHERE id=?`,
        [input.sessionId],
      );
      if (sessionState?.status !== 'active') {
        throw new InvalidStudySessionTransitionError('Phiên học không ở trạng thái hoạt động.');
      }
      const item = await tx.getFirstAsync<ItemRow>(
        `SELECT * FROM study_session_items WHERE id=? AND session_id=?`,
        [input.sessionItemId, input.sessionId],
      );
      if (!item) throw new StudyItemNotFoundError('Không tìm thấy câu hỏi.');
      if (item.status === 'answered')
        throw new StudyItemAlreadyAnsweredError('Câu trả lời đã được ghi nhận.');
      const progress = await tx.getFirstAsync<{
        id: string;
        status: CardLearningStatus;
        repetitions: number;
        interval_days: number;
        ease_factor: number;
        lapse_count: number;
        correct_count: number;
        incorrect_count: number;
        next_review_at: number | null;
        total_review_count: number;
        average_response_time_ms: number | null;
      }>(`SELECT * FROM card_progress WHERE card_id=?`, [input.cardId]);
      if (!progress) throw new StudyItemNotFoundError('Không tìm thấy tiến độ thẻ.');
      const schedule = calculateNextReview({
        rating: input.rating,
        reviewedAt: input.reviewedAt,
        status: progress.status,
        repetitions: progress.repetitions,
        intervalDays: progress.interval_days,
        easeFactor: progress.ease_factor,
        lapseCount: progress.lapse_count,
        correctCount: progress.correct_count,
        incorrectCount: progress.incorrect_count,
      });
      nextReviewAt = schedule.nextReviewAt;
      const total = progress.total_review_count + 1;
      const average = Math.round(
        ((progress.average_response_time_ms ?? 0) * progress.total_review_count +
          input.responseTimeMs) /
          total,
      );
      xp = calculateAnswerXp({
        mode: input.mode,
        rating: input.rating,
        isCorrect: input.isCorrect,
        responseTimeMs: input.responseTimeMs,
        usedHint: input.usedHint ?? false,
        isNewCard: progress.status === 'new',
      });
      await tx.runAsync(
        `UPDATE card_progress SET status=?,repetitions=?,interval_days=?,ease_factor=?,next_review_at=?,last_reviewed_at=?,correct_count=?,incorrect_count=?,lapse_count=?,total_review_count=?,average_response_time_ms=?,last_rating=?,updated_at=?,sync_status='pending' WHERE id=?`,
        [
          schedule.status,
          schedule.repetitions,
          schedule.intervalDays,
          schedule.easeFactor,
          schedule.nextReviewAt,
          schedule.lastReviewedAt,
          schedule.correctCount,
          schedule.incorrectCount,
          schedule.lapseCount,
          total,
          average,
          input.rating,
          input.reviewedAt,
          progress.id,
        ],
      );
      await tx.runAsync(
        `UPDATE study_session_items SET status='answered',answered_at=?,answer_json=?,rating=?,is_correct=?,response_time_ms=?,updated_at=? WHERE id=?`,
        [
          input.reviewedAt,
          JSON.stringify({ submitted: input.submittedAnswer, expected: input.expectedAnswer }),
          input.rating,
          input.isCorrect ? 1 : 0,
          input.responseTimeMs,
          input.reviewedAt,
          input.sessionItemId,
        ],
      );
      const logId = randomUUID();
      await tx.runAsync(
        `INSERT INTO review_logs(id,card_id,session_id,session_item_id,mode,answer_type,submitted_answer,expected_answer,rating,quality,is_correct,response_time_ms,previous_status,new_status,previous_repetitions,new_repetitions,previous_interval_days,new_interval_days,previous_ease_factor,new_ease_factor,previous_next_review_at,new_next_review_at,reviewed_at,created_at,sync_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
        [
          logId,
          input.cardId,
          input.sessionId,
          input.sessionItemId,
          input.mode,
          input.mode,
          input.submittedAnswer,
          input.expectedAnswer,
          input.rating,
          REVIEW_RATING_SCORE[input.rating],
          input.isCorrect ? 1 : 0,
          input.responseTimeMs,
          progress.status,
          schedule.status,
          progress.repetitions,
          schedule.repetitions,
          progress.interval_days,
          schedule.intervalDays,
          progress.ease_factor,
          schedule.easeFactor,
          progress.next_review_at,
          schedule.nextReviewAt,
          input.reviewedAt,
          input.reviewedAt,
        ],
      );
      const session = await tx.getFirstAsync<{ current_item_index: number }>(
        `SELECT current_item_index FROM study_sessions WHERE id=?`,
        [input.sessionId],
      );
      const nextIndex = (session?.current_item_index ?? 0) + 1;
      await tx.runAsync(
        `UPDATE study_sessions SET current_item_index=?,answered_cards=answered_cards+1,correct_answers=correct_answers+?,incorrect_answers=incorrect_answers+?,duration_seconds=duration_seconds+?,earned_xp=earned_xp+?,updated_at=?,sync_status='pending' WHERE id=?`,
        [
          nextIndex,
          input.isCorrect ? 1 : 0,
          input.isCorrect ? 0 : 1,
          Math.round(input.responseTimeMs / 1000),
          xp,
          input.reviewedAt,
          input.sessionId,
        ],
      );
      await tx.runAsync(
        `UPDATE study_session_items SET status='current',updated_at=? WHERE session_id=? AND position=? AND status='pending'`,
        [input.reviewedAt, input.sessionId, nextIndex],
      );
      const date = toLocalStudyDate(input.reviewedAt);
      const statId = randomUUID();
      await tx.runAsync(
        `INSERT INTO daily_statistics(id,study_date,studied_cards,unique_cards,correct_answers,incorrect_answers,new_cards,reviewed_cards,study_seconds,earned_xp,created_at,updated_at,sync_status) VALUES(?,?,1,1,?,?,?,?,?,?,?,?,'pending') ON CONFLICT(study_date) DO UPDATE SET studied_cards=studied_cards+1,unique_cards=unique_cards+CASE WHEN NOT EXISTS(SELECT 1 FROM review_logs rl WHERE rl.card_id=? AND date(rl.reviewed_at/1000,'unixepoch','localtime')=?) THEN 1 ELSE 0 END,correct_answers=correct_answers+?,incorrect_answers=incorrect_answers+?,new_cards=new_cards+?,reviewed_cards=reviewed_cards+?,study_seconds=study_seconds+?,earned_xp=earned_xp+?,updated_at=?`,
        [
          statId,
          date,
          input.isCorrect ? 1 : 0,
          input.isCorrect ? 0 : 1,
          progress.status === 'new' ? 1 : 0,
          progress.status === 'new' ? 0 : 1,
          Math.round(input.responseTimeMs / 1000),
          xp,
          input.reviewedAt,
          input.reviewedAt,
          input.cardId,
          date,
          input.isCorrect ? 1 : 0,
          input.isCorrect ? 0 : 1,
          progress.status === 'new' ? 1 : 0,
          progress.status === 'new' ? 0 : 1,
          Math.round(input.responseTimeMs / 1000),
          xp,
          input.reviewedAt,
        ],
      );
      const queue = new SQLiteSyncQueueRepository(tx);
      await queue.enqueue({
        entityType: 'card_progress',
        entityId: progress.id,
        operation: 'update',
      });
      await queue.enqueue({ entityType: 'review_log', entityId: logId, operation: 'create' });
      await queue.enqueue({
        entityType: 'study_session',
        entityId: input.sessionId,
        operation: 'update',
      });
    });
    const session = await this.findSessionById(input.sessionId);
    const item = await this.database.getFirstAsync<ItemRow>(
      `SELECT * FROM study_session_items WHERE id=?`,
      [input.sessionItemId],
    );
    if (!session || !item)
      throw new StudySessionNotFoundError('Không thể tải kết quả câu trả lời.');
    return { session, item: mapItem(item), xpEarned: xp, nextReviewAt };
  }
  async pauseSession(id: string, at: number) {
    const session = await this.findSessionById(id);
    if (!session || session.status !== 'active')
      throw new InvalidStudySessionTransitionError('Không thể tạm dừng.');
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE study_sessions SET status='paused',paused_at=?,updated_at=?,sync_status='pending' WHERE id=?`,
        [at, at, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'study_session',
        entityId: id,
        operation: 'update',
      });
    });
  }
  async resumeSession(id: string, at: number) {
    const session = await this.findSessionById(id);
    if (!session || session.status !== 'paused')
      throw new InvalidStudySessionTransitionError('Không thể tiếp tục.');
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE study_sessions SET status='active',resumed_at=?,updated_at=?,sync_status='pending' WHERE id=?`,
        [at, at, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'study_session',
        entityId: id,
        operation: 'update',
      });
    });
  }
  async abandonSession(id: string, at: number) {
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `UPDATE study_sessions SET status='abandoned',abandoned_at=?,updated_at=?,sync_status='pending' WHERE id=? AND status IN ('active','paused')`,
        [at, at, id],
      );
      await new SQLiteSyncQueueRepository(tx).enqueue({
        entityType: 'study_session',
        entityId: id,
        operation: 'update',
      });
    });
  }
  async completeSession(id: string, at: number) {
    const session = await this.findSessionById(id);
    if (!session) throw new StudySessionNotFoundError('Không tìm thấy phiên học.');
    if (session.status !== 'completed') {
      await this.database.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(
          `UPDATE study_sessions SET status='completed',completed_at=?,updated_at=?,sync_status='pending' WHERE id=? AND status IN ('active','paused')`,
          [at, at, id],
        );
        await new SQLiteSyncQueueRepository(tx).enqueue({
          entityType: 'study_session',
          entityId: id,
          operation: 'update',
        });
        const date = toLocalStudyDate(at);
        await tx.runAsync(
          `UPDATE daily_statistics SET completed_sessions=completed_sessions+1,updated_at=? WHERE study_date=?`,
          [at, date],
        );
      });
    }
    return this.getSessionResult(id);
  }
  async getSessionResult(id: string): Promise<StudySessionResult> {
    const session = await this.findSessionById(id);
    if (!session) throw new StudySessionNotFoundError('Không tìm thấy phiên học.');
    const wrong = await this.database.getAllAsync<{
      cardId: string;
      frontText: string;
      backText: string;
    }>(
      `SELECT c.id cardId,c.front_text frontText,c.back_text backText FROM study_session_items i JOIN cards c ON c.id=i.card_id WHERE i.session_id=? AND i.is_correct=0`,
      [id],
    );
    return {
      session,
      accuracy: session.answeredCards
        ? Math.round((session.correctAnswers / session.answeredCards) * 100)
        : 0,
      wrongAnswers: wrong,
    };
  }
}
