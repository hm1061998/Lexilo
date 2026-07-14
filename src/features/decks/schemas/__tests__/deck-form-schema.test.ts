import { deckFormSchema } from '../deck-form-schema';
const valid = {
  name: 'Từ vựng',
  description: '',
  languageFrom: 'en',
  languageTo: 'vi',
  isFavorite: false,
  tagIds: [],
};
describe('deck form', () => {
  test('accepts Vietnamese', () => expect(deckFormSchema.safeParse(valid).success).toBe(true));
  test('rejects empty and long names', () => {
    expect(deckFormSchema.safeParse({ ...valid, name: ' ' }).success).toBe(false);
    expect(deckFormSchema.safeParse({ ...valid, name: 'x'.repeat(101) }).success).toBe(false);
  });
});
