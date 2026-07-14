import { SQLiteSyncQueueRepository } from '@/features/synchronization/repositories/sqlite-sync-queue-repository';
import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

type SeedCard = readonly [word: string, meaning: string, phonetic: string, part: string];
const decks: readonly {
  name: string;
  description: string;
  tag: string;
  cards: readonly SeedCard[];
}[] = [
  {
    name: 'English for Developers',
    description: 'Essential vocabulary for software developers',
    tag: 'developer',
    cards: [
      ['maintain', 'duy trì', '/meɪnˈteɪn/', 'verb'],
      ['deploy', 'triển khai', '/dɪˈplɔɪ/', 'verb'],
      ['repository', 'kho mã nguồn', '/rɪˈpɒzɪtəri/', 'noun'],
      ['dependency', 'phần phụ thuộc', '/dɪˈpendənsi/', 'noun'],
      ['scalable', 'có khả năng mở rộng', '/ˈskeɪləbl/', 'adjective'],
      ['deprecated', 'không còn được khuyên dùng', '/ˈdeprəkeɪtɪd/', 'adjective'],
      ['authentication', 'xác thực danh tính', '/ɔːˌθentɪˈkeɪʃn/', 'noun'],
      ['authorization', 'phân quyền', '/ˌɔːθəraɪˈzeɪʃn/', 'noun'],
      ['database', 'cơ sở dữ liệu', '/ˈdeɪtəbeɪs/', 'noun'],
      ['performance', 'hiệu năng', '/pəˈfɔːməns/', 'noun'],
    ],
  },
  {
    name: 'Daily Communication',
    description: 'Common vocabulary for daily conversations',
    tag: 'daily',
    cards: [
      ['hello', 'xin chào', '/həˈləʊ/', 'interjection'],
      ['thank you', 'cảm ơn', '/ˈθæŋk juː/', 'phrase'],
      ['sorry', 'xin lỗi', '/ˈsɒri/', 'adjective'],
      ['please', 'làm ơn', '/pliːz/', 'adverb'],
      ['welcome', 'chào mừng', '/ˈwelkəm/', 'adjective'],
      ['morning', 'buổi sáng', '/ˈmɔːnɪŋ/', 'noun'],
      ['evening', 'buổi tối', '/ˈiːvnɪŋ/', 'noun'],
      ['friend', 'bạn bè', '/frend/', 'noun'],
      ['family', 'gia đình', '/ˈfæməli/', 'noun'],
      ['goodbye', 'tạm biệt', '/ˌɡʊdˈbaɪ/', 'interjection'],
    ],
  },
  {
    name: 'TOEIC Essential Vocabulary',
    description: 'High-frequency vocabulary for TOEIC',
    tag: 'toeic',
    cards: [
      ['applicant', 'ứng viên', '/ˈæplɪkənt/', 'noun'],
      ['appointment', 'cuộc hẹn', '/əˈpɔɪntmənt/', 'noun'],
      ['budget', 'ngân sách', '/ˈbʌdʒɪt/', 'noun'],
      ['conference', 'hội nghị', '/ˈkɒnfərəns/', 'noun'],
      ['deadline', 'hạn chót', '/ˈdedlaɪn/', 'noun'],
      ['equipment', 'thiết bị', '/ɪˈkwɪpmənt/', 'noun'],
      ['invoice', 'hóa đơn', '/ˈɪnvɔɪs/', 'noun'],
      ['negotiate', 'đàm phán', '/nɪˈɡəʊʃieɪt/', 'verb'],
      ['purchase', 'mua hàng', '/ˈpɜːtʃəs/', 'verb'],
      ['shipment', 'lô hàng', '/ˈʃɪpmənt/', 'noun'],
    ],
  },
];

export async function seedDevelopmentData(database: SQLiteDatabase): Promise<void> {
  if (!__DEV__) return;
  const count = await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) count FROM decks`);
  if ((count?.count ?? 0) > 0) return;
  await database.withExclusiveTransactionAsync(async (tx) => {
    const queue = new SQLiteSyncQueueRepository(tx);
    const now = Date.now();
    for (const seedDeck of decks) {
      const deckId = randomUUID();
      const tagId = randomUUID();
      await tx.runAsync(`INSERT INTO tags(id,name,created_at,updated_at) VALUES(?,?,?,?)`, [
        tagId,
        seedDeck.tag,
        now,
        now,
      ]);
      await tx.runAsync(
        `INSERT INTO decks(id,name,description,created_at,updated_at,sync_status) VALUES(?,?,?,?,?,'pending')`,
        [deckId, seedDeck.name, seedDeck.description, now, now],
      );
      await tx.runAsync(`INSERT INTO deck_tags(deck_id,tag_id) VALUES(?,?)`, [deckId, tagId]);
      await queue.enqueue({ entityType: 'deck', entityId: deckId, operation: 'create' });
      for (const [word, meaning, phonetic, part] of seedDeck.cards) {
        const cardId = randomUUID();
        const progressId = randomUUID();
        const example = `This example uses the word “${word}”.`;
        await tx.runAsync(
          `INSERT INTO cards(id,deck_id,front_text,back_text,phonetic,part_of_speech,example_text,example_translation,difficulty,created_at,updated_at,sync_status) VALUES(?,?,?,?,?,?,?,?,2,?,?,'pending')`,
          [
            cardId,
            deckId,
            word,
            meaning,
            phonetic,
            part,
            example,
            `Ví dụ này sử dụng từ “${word}”.`,
            now,
            now,
          ],
        );
        await tx.runAsync(`INSERT INTO card_tags(card_id,tag_id) VALUES(?,?)`, [cardId, tagId]);
        await tx.runAsync(
          `INSERT INTO card_progress(id,card_id,created_at,updated_at,sync_status) VALUES(?,?,?,?,'pending')`,
          [progressId, cardId, now, now],
        );
        await queue.enqueue({ entityType: 'card', entityId: cardId, operation: 'create' });
      }
    }
  });
}
