import type {
  DailyStatisticsPoint,
  GoalProgress,
  StreakSummary,
  StudyActivityDay,
} from '../types/statistics.types';
export function calculateGoalProgress(current: number, target: number): GoalProgress {
  const safe = Math.max(1, target);
  return {
    current,
    target,
    ratio: Math.min(1, Math.max(0, current / safe)),
    completed: current >= target,
    exceeded: current > target,
  };
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function calculateStreak(dates: readonly string[], today: string): StreakSummary {
  const valid = [...new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  let longest = 0,
    run = 0,
    previous = '';
  for (const date of valid) {
    run = previous && date === shiftDate(previous, 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  let current = 0,
    cursor = today;
  const set = new Set(valid);
  if (!set.has(cursor)) cursor = shiftDate(cursor, -1);
  while (set.has(cursor)) {
    current++;
    cursor = shiftDate(cursor, -1);
  }
  return {
    current,
    longest,
    nextMilestone: [3, 7, 14, 30, 60, 100, 365].find((m) => m > current) ?? current + 100,
  };
}
export const emptyDay = (date: string): DailyStatisticsPoint => ({
  date,
  studiedCards: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  newCards: 0,
  reviewedCards: 0,
  studySeconds: 0,
  earnedXp: 0,
  sessions: 0,
});
export function fillMissingDays(rows: readonly DailyStatisticsPoint[], start: string, end: string) {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out: DailyStatisticsPoint[] = [];
  for (let d = start; d <= end; d = shiftDate(d, 1)) out.push(map.get(d) ?? emptyDay(d));
  return out;
}
export function heatmapIntensity(cards: number, max: number): StudyActivityDay['intensity'] {
  if (cards <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((cards / max) * 4)) as StudyActivityDay['intensity'];
}
export function difficultScore(incorrect: number, lapses: number, reviews: number) {
  return Math.round((incorrect * 2 + lapses * 3) * (1 + Math.min(reviews, 20) / 20) * 10) / 10;
}
