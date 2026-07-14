export function parseCommaSeparatedValues(value?: string): string[] {
  const seen = new Set<string>();
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLocaleLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'deck'
  );
}
