function shift(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  const value = new Date(Date.UTC(y, m - 1, d + days));
  return value.toISOString().slice(0, 10);
}
export function calculateCurrentStreak(studyDates: string[], today: string): number {
  const dates = new Set(studyDates);
  let cursor = dates.has(today) ? today : shift(today, -1);
  if (!dates.has(cursor)) return 0;
  let count = 0;
  while (dates.has(cursor)) {
    count++;
    cursor = shift(cursor, -1);
  }
  return count;
}
