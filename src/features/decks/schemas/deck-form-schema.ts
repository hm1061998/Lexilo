import { z } from 'zod';

export const deckFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên bộ thẻ không được để trống')
    .max(100, 'Tên bộ thẻ không được vượt quá 100 ký tự'),
  description: z.string().trim().max(500, 'Mô tả không được vượt quá 500 ký tự').optional(),
  languageFrom: z.string().trim().min(2).max(10),
  languageTo: z.string().trim().min(2).max(10),
  isFavorite: z.boolean(),
  tagIds: z.array(z.string()),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
