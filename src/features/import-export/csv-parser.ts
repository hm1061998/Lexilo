import { z } from 'zod';
import { ImportLimitExceededError, InvalidImportFileError } from '@/shared/errors/app-error';

export const CSV_MAX_BYTES = 10 * 1024 * 1024;
export const CSV_MAX_ROWS = 10_000;
export const CSV_HEADERS = [
  'front_text',
  'back_text',
  'phonetic',
  'part_of_speech',
  'example_text',
  'example_translation',
  'note',
  'synonyms',
  'antonyms',
  'difficulty',
  'tags',
] as const;

export interface CsvCardRow {
  frontText: string;
  backText: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  exampleText: string | null;
  exampleTranslation: string | null;
  note: string | null;
  synonyms: string[];
  antonyms: string[];
  difficulty: number;
  tagNames: string[];
}
export interface CsvRowError {
  row: number;
  message: string;
}
export interface CsvPreview {
  totalRows: number;
  validRows: CsvCardRow[];
  errors: CsvRowError[];
}

function splitPipe(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split('|')
    .map((v) => v.trim())
    .filter((v) => {
      const key = v.toLocaleLowerCase();
      if (!v || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
export function parseCsvRecords(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (quoted) throw new InvalidImportFileError('Trường CSV chưa đóng dấu ngoặc kép.');
  row.push(field);
  if (row.some((v) => v.length)) rows.push(row);
  return rows;
}
const rowSchema = z.object({
  frontText: z.string().trim().min(1).max(500),
  backText: z.string().trim().min(1).max(1000),
  phonetic: z.string().max(200),
  partOfSpeech: z.string().max(100),
  exampleText: z.string().max(2000),
  exampleTranslation: z.string().max(2000),
  note: z.string().max(5000),
  difficulty: z.coerce.number().int().min(0).max(5),
});
export function parseCardCsv(source: string, byteSize = source.length): CsvPreview {
  if (byteSize > CSV_MAX_BYTES) throw new ImportLimitExceededError('File vượt quá 10 MB.');
  const records = parseCsvRecords(source.replace(/^\uFEFF/, ''));
  if (!records.length) throw new InvalidImportFileError('File CSV trống.');
  const headers = records[0].map((v) => v.trim().toLowerCase());
  if (CSV_HEADERS.some((header, index) => headers[index] !== header))
    throw new InvalidImportFileError('Header CSV không đúng định dạng.');
  if (records.length - 1 > CSV_MAX_ROWS)
    throw new ImportLimitExceededError('File vượt quá 10.000 dòng.');
  const validRows: CsvCardRow[] = [];
  const errors: CsvRowError[] = [];
  records.slice(1).forEach((values, index) => {
    const raw = {
      frontText: values[0] ?? '',
      backText: values[1] ?? '',
      phonetic: values[2] ?? '',
      partOfSpeech: values[3] ?? '',
      exampleText: values[4] ?? '',
      exampleTranslation: values[5] ?? '',
      note: values[6] ?? '',
      difficulty: values[9] || '0',
    };
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        row: index + 2,
        message: parsed.error.issues[0]?.message ?? 'Dòng không hợp lệ',
      });
      return;
    }
    const d = parsed.data;
    validRows.push({
      ...d,
      phonetic: d.phonetic || null,
      partOfSpeech: d.partOfSpeech || null,
      exampleText: d.exampleText || null,
      exampleTranslation: d.exampleTranslation || null,
      note: d.note || null,
      synonyms: splitPipe(values[7] ?? ''),
      antonyms: splitPipe(values[8] ?? ''),
      tagNames: splitPipe(values[10] ?? ''),
    });
  });
  return { totalRows: records.length - 1, validRows, errors };
}
