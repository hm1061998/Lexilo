export interface RandomSource {
  next(): number;
}
export const systemRandom: RandomSource = { next: () => Math.random() };
export function shuffle<T>(values: readonly T[], random: RandomSource = systemRandom): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
