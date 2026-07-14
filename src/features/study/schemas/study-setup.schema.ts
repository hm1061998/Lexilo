import { z } from 'zod';
export const studySetupSchema = z
  .object({
    deckIds: z.array(z.string().min(1)).min(1, 'Hãy chọn ít nhất một bộ flashcard'),
    mode: z.enum(['flashcard', 'multiple_choice', 'typing']),
    scope: z.enum(['due', 'new', 'mixed', 'all']),
    cardLimit: z.number().int().min(1).max(100),
    newCardLimit: z.number().int().min(0).max(50),
    reviewCardLimit: z.number().int().min(0).max(100),
    shuffle: z.boolean(),
    autoPlayAudio: z.boolean(),
    includeMastered: z.boolean(),
  })
  .refine(
    (value) =>
      value.scope !== 'mixed' || value.newCardLimit + value.reviewCardLimit >= value.cardLimit,
    { message: 'Tổng giới hạn thẻ mới và ôn tập phải đủ cho phiên học' },
  );
