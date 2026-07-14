import { parseCardCsv, parseCsvRecords } from '../csv-parser';
describe('CSV parser', () => {
  test('supports commas and new lines in quoted fields', () => {
    expect(parseCsvRecords('a,b\n"hello, world","line 1\nline 2"')).toEqual([
      ['a', 'b'],
      ['hello, world', 'line 1\nline 2'],
    ]);
  });
  test('validates Unicode row', () => {
    const csv =
      'front_text,back_text,phonetic,part_of_speech,example_text,example_translation,note,synonyms,antonyms,difficulty,tags\nmaintain,duy trì,/x/,verb,Example,Ví dụ,,preserve|Preserve,,2,công nghệ';
    const result = parseCardCsv(csv);
    expect(result.validRows[0]?.backText).toBe('duy trì');
    expect(result.validRows[0]?.synonyms).toEqual(['preserve']);
  });
});
