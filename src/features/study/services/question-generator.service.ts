import { NotEnoughMultipleChoiceOptionsError } from '@/shared/errors/app-error';
import type { RandomSource } from '../utils/shuffle';
import { shuffle } from '../utils/shuffle';
import type { StudyCard, StudyMode, StudyQuestion } from '../types/study.types';

export function generateStudyQuestion(
  card: StudyCard,
  candidates: readonly StudyCard[],
  mode: StudyMode,
  sessionItemId: string,
  createdAt: number,
  random: RandomSource,
): StudyQuestion {
  const base = {
    id: `question-${sessionItemId}`,
    sessionItemId,
    cardId: card.cardId,
    mode,
    prompt: card.frontText,
    createdAt,
  };
  if (mode === 'flashcard')
    return {
      ...base,
      mode,
      frontText: card.frontText,
      backText: card.backText,
      phonetic: card.phonetic,
      exampleText: card.exampleText,
      exampleTranslation: card.exampleTranslation,
    };
  if (mode === 'typing')
    return {
      ...base,
      mode,
      promptText: card.backText,
      acceptedAnswers: [card.frontText],
      hint: card.phonetic,
    };
  const unique = new Map<string, StudyCard>();
  for (const item of candidates) {
    const key = item.backText.trim().toLocaleLowerCase();
    if (
      item.cardId !== card.cardId &&
      key !== card.backText.trim().toLocaleLowerCase() &&
      !unique.has(key)
    )
      unique.set(key, item);
  }
  const preferred = [...unique.values()].sort(
    (a, b) =>
      Number(b.partOfSpeech === card.partOfSpeech) - Number(a.partOfSpeech === card.partOfSpeech),
  );
  const distractors = shuffle(preferred, random).slice(0, 3);
  if (!distractors.length)
    throw new NotEnoughMultipleChoiceOptionsError('Không đủ đáp án cho chế độ trắc nghiệm.');
  const options = shuffle(
    [
      { id: `${sessionItemId}-correct`, text: card.backText, cardId: card.cardId },
      ...distractors.map((item, index) => ({
        id: `${sessionItemId}-d${index}`,
        text: item.backText,
        cardId: item.cardId,
      })),
    ],
    random,
  );
  return {
    ...base,
    mode,
    promptText: card.frontText,
    options,
    correctOptionId: `${sessionItemId}-correct`,
  };
}
