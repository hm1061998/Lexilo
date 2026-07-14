import { z } from 'zod';

export const cardFormSchema = z.object({
  frontText: z
    .string()
    .trim()
    .min(1, 'Nội dung mặt trước không được để trống')
    .max(500, 'Nội dung mặt trước không được vượt quá 500 ký tự'),
  backText: z
    .string()
    .trim()
    .min(1, 'Nội dung mặt sau không được để trống')
    .max(1000, 'Nội dung mặt sau không được vượt quá 1000 ký tự'),
  phonetic: z.string().trim().max(200).optional(),
  partOfSpeech: z.string().trim().max(100).optional(),
  exampleText: z.string().trim().max(2000).optional(),
  exampleTranslation: z.string().trim().max(2000).optional(),
  note: z.string().trim().max(5000).optional(),
  synonymsText: z.string().trim().max(1000).optional(),
  antonymsText: z.string().trim().max(1000).optional(),
  difficulty: z.number().int().min(0).max(5),
  tagIds: z.array(z.string()),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
