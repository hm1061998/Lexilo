import { escapeLikePattern, parseCommaSeparatedValues } from '../strings';
describe('string utilities', () => {
  test('deduplicates comma values without losing Vietnamese', () => {
    expect(parseCommaSeparatedValues(' Tốt, tốt, đẹp, ,ĐẸP ')).toEqual(['Tốt', 'đẹp']);
  });
  test('escapes LIKE wildcards', () => {
    expect(escapeLikePattern('100%_ok\\')).toBe('100\\%\\_ok\\\\');
  });
});
