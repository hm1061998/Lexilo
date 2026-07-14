import { cardFormSchema } from '../card-form-schema';
const valid = { frontText: 'hello', backText: 'xin chào', difficulty: 0, tagIds: [] };
describe('card form', () => {
  test('accepts required fields', () => expect(cardFormSchema.safeParse(valid).success).toBe(true));
  test('rejects oversized text', () =>
    expect(cardFormSchema.safeParse({ ...valid, frontText: 'x'.repeat(501) }).success).toBe(false));
});
