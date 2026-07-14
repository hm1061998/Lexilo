import { generateStudyQuestion } from '../question-generator.service';
import type { StudyCard } from '../../types/study.types';
const card = (id: string, front: string, back: string, part = 'noun'): StudyCard => ({
  cardId: id,
  deckId: 'd',
  frontText: front,
  backText: back,
  phonetic: null,
  partOfSpeech: part,
  exampleText: null,
  exampleTranslation: null,
  audioUri: null,
  imageUri: null,
  difficulty: 0,
  learningStatus: 'new',
  repetitions: 0,
  intervalDays: 0,
  easeFactor: 2.5,
  nextReviewAt: null,
  lastReviewedAt: null,
  correctCount: 0,
  incorrectCount: 0,
  lapseCount: 0,
});
const cards = [
  card('1', 'maintain', 'duy trì', 'verb'),
  card('2', 'deploy', 'triển khai', 'verb'),
  card('3', 'database', 'cơ sở dữ liệu'),
  card('4', 'server', 'máy chủ'),
  card('5', 'repeat', 'duy trì'),
];
const random = { next: () => 0.25 };
describe('question generator', () => {
  test('creates flashcard with source data', () =>
    expect(generateStudyQuestion(cards[0], cards, 'flashcard', 'i', 1, random)).toMatchObject({
      mode: 'flashcard',
      frontText: 'maintain',
      backText: 'duy trì',
    }));
  test('creates one correct unique multiple-choice option', () => {
    const question = generateStudyQuestion(cards[0], cards, 'multiple_choice', 'i', 1, random);
    if (question.mode !== 'multiple_choice') throw new Error('wrong mode');
    expect(
      question.options.filter((option) => option.id === question.correctOptionId),
    ).toHaveLength(1);
    expect(new Set(question.options.map((option) => option.text)).size).toBe(
      question.options.length,
    );
    expect(question.options.some((option) => option.cardId === '1')).toBe(true);
  });
  test('creates typing accepted answer', () =>
    expect(generateStudyQuestion(cards[0], cards, 'typing', 'i', 1, random)).toMatchObject({
      mode: 'typing',
      promptText: 'duy trì',
      acceptedAnswers: ['maintain'],
    }));
  test('serializes question JSON', () => {
    const question = generateStudyQuestion(cards[0], cards, 'multiple_choice', 'i', 1, random);
    expect(JSON.parse(JSON.stringify(question))).toEqual(question);
  });
});
