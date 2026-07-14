export interface RetryDecisionInput {
  attempt: number;
  permanent?: boolean;
  retryAfterMs?: number;
  random?: () => number;
}
export function getRetryDelay({
  attempt,
  permanent = false,
  retryAfterMs,
  random = Math.random,
}: RetryDecisionInput): number | null {
  if (permanent || attempt < 1 || attempt > 6) return null;
  if (retryAfterMs !== undefined) return Math.max(0, retryAfterMs);
  const base = Math.min(300_000, 1_000 * 2 ** (attempt - 1));
  return Math.round(base * (0.8 + random() * 0.4));
}
