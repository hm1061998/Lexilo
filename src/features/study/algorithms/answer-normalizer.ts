export function normalizeAnswer(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}
export function levenshteinDistance(a: string, b: string): number {
  const left = [...a],
    right = [...b];
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i++) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j++)
      current[j + 1] =
        left[i] === right[j] ? previous[j] : Math.min(previous[j], previous[j + 1], current[j]) + 1;
    previous = current;
  }
  return previous[right.length] ?? left.length;
}
export function evaluateTypingAnswer(
  submitted: string,
  accepted: readonly string[],
): { isCorrect: boolean; isMinorTypo: boolean; normalized: string } {
  const normalized = normalizeAnswer(submitted);
  if (!normalized) return { isCorrect: false, isMinorTypo: false, normalized };
  for (const answer of accepted) {
    const expected = normalizeAnswer(answer);
    if (normalized === expected) return { isCorrect: true, isMinorTypo: false, normalized };
    const punctuation = (value: string) => value.replace(/[\p{L}\p{N}\s]/gu, '');
    if (
      expected.length >= 6 &&
      punctuation(normalized) === punctuation(expected) &&
      levenshteinDistance(normalized, expected) === 1
    )
      return { isCorrect: true, isMinorTypo: true, normalized };
  }
  return { isCorrect: false, isMinorTypo: false, normalized };
}
