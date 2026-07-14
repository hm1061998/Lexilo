import type { CardRepository } from '@/features/cards/repositories/card-repository';
import type { Card } from '@/features/cards/types/card';
import type { DeckRepository } from '@/features/decks/repositories/deck-repository';
import { DeckNotFoundError } from '@/shared/errors/app-error';
import { slugify } from '@/shared/utils/strings';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function mapDeckExport(
  deck: Awaited<ReturnType<DeckRepository['findById']>>,
  cards: Awaited<ReturnType<CardRepository['findAll']>>,
) {
  if (!deck) throw new DeckNotFoundError('Không tìm thấy bộ thẻ.');
  return {
    version: 1,
    type: 'flashcard_deck',
    exportedAt: Date.now(),
    deck: {
      name: deck.name,
      description: deck.description,
      languageFrom: deck.languageFrom,
      languageTo: deck.languageTo,
      tags: deck.tags,
    },
    cards: cards.map((card) => ({
      frontText: card.frontText,
      backText: card.backText,
      phonetic: card.phonetic,
      partOfSpeech: card.partOfSpeech,
      exampleText: card.exampleText,
      exampleTranslation: card.exampleTranslation,
      note: card.note,
      synonyms: card.synonyms,
      antonyms: card.antonyms,
      difficulty: card.difficulty,
      tags: card.tags,
    })),
  };
}
export async function exportDeckJson(
  deckRepository: DeckRepository,
  cardRepository: CardRepository,
  deckId: string,
): Promise<string> {
  const deck = await deckRepository.findById(deckId);
  const cards: Card[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const page = await cardRepository.findAll({ deckId, limit: pageSize, offset });
    cards.push(...page);
    if (page.length < pageSize) break;
  }
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const file = new File(Paths.cache, `deck-${slugify(deck?.name ?? 'deck')}-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(mapDeckExport(deck, cards), null, 2));
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export bộ thẻ',
    });
  return file.uri;
}
