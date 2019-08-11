import doubleMetaphone from 'double-metaphone';

export function arraySimilarity(a: any[], b: any[]): number {
  let matches = 0;

  for (const item of a) {
    if (b.includes(item)) {
      matches++;
    }
  }

  return matches / Math.max(a.length, b.length);
}

export function metaphones(name: string): string[] {
  return name
    .trim()
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => doubleMetaphone(part)[0]);
}
