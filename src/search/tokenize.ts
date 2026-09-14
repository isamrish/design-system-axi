const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'display',
  'for',
  'from',
  'i',
  'in',
  'into',
  'is',
  'it',
  'my',
  'need',
  'of',
  'on',
  'or',
  'show',
  'so',
  'some',
  'that',
  'the',
  'this',
  'to',
  'use',
  'user',
  'users',
  'want',
  'when',
  'while',
  'with',
]);

export function tokenize(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss'))
    return word.slice(0, -1);
  return word;
}
