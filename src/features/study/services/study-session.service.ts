import { NoStudyCardsAvailableError } from '@/shared/errors/app-error';
import { randomUUID } from 'expo-crypto';
import type {
  StudySessionRepository,
  SubmitStudyAnswerInput,
} from '../repositories/study-repository';
import { studySetupSchema } from '../schemas/study-setup.schema';
import type { StudyCard, StudySession, StudySessionResult, StudySetup } from '../types/study.types';
import type { RandomSource } from '../utils/shuffle';
import { shuffle } from '../utils/shuffle';
import type { Clock } from '../utils/study-time';
import { generateStudyQuestion } from './question-generator.service';
export class StudySessionService {
  constructor(
    private readonly repository: StudySessionRepository,
    private readonly clock: Clock,
    private readonly random: RandomSource,
  ) {}
  async prepareSession(setup: StudySetup): Promise<StudyCard[]> {
    const valid = studySetupSchema.parse(setup);
    let cards = await this.repository.getStudyCandidates({
      deckIds: valid.deckIds,
      scope: valid.scope,
      currentTime: this.clock.now(),
      includeMastered: valid.includeMastered,
      newCardLimit: valid.newCardLimit,
      reviewCardLimit: valid.reviewCardLimit,
      totalLimit: Math.max(valid.cardLimit, valid.mode === 'multiple_choice' ? 4 : valid.cardLimit),
    });
    if (valid.scope === 'mixed') {
      const review = cards
        .filter((card) => card.learningStatus !== 'new')
        .slice(0, valid.reviewCardLimit);
      const fresh = cards
        .filter((card) => card.learningStatus === 'new')
        .slice(0, valid.newCardLimit);
      cards = [...review, ...fresh];
    }
    cards = cards.slice(0, valid.cardLimit);
    if (!cards.length)
      throw new NoStudyCardsAvailableError('Không có flashcard phù hợp với lựa chọn hiện tại.');
    return valid.shuffle ? shuffle(cards, this.random) : cards;
  }
  async startSession(setup: StudySetup): Promise<StudySession> {
    const cards = await this.prepareSession(setup);
    const now = this.clock.now();
    const questionPool =
      setup.mode === 'multiple_choice'
        ? await this.repository.getStudyCandidates({
            deckIds: setup.deckIds,
            scope: 'all',
            currentTime: now,
            includeMastered: true,
            newCardLimit: 50,
            reviewCardLimit: 100,
            totalLimit: 100,
          })
        : cards;
    const questions = cards.map((card) => {
      const itemId = randomUUID();
      return generateStudyQuestion(card, questionPool, setup.mode, itemId, now, this.random);
    });
    return this.repository.createSession({ setup, cards, questions, startedAt: now });
  }
  submitAnswer(input: Omit<SubmitStudyAnswerInput, 'reviewedAt'>) {
    return this.repository.submitAnswer({ ...input, reviewedAt: this.clock.now() });
  }
  completeSession(id: string): Promise<StudySessionResult> {
    return this.repository.completeSession(id, this.clock.now());
  }
  recoverActiveSession() {
    return this.repository.findActiveSession();
  }
}
