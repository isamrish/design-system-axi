import type { Component } from '../catalog/schema.js';
import { synonymsOf } from './synonyms.js';
import { tokenize } from './tokenize.js';

export type FieldName =
  | 'name'
  | 'subcomponent'
  | 'description'
  | 'prop'
  | 'propDescription'
  | 'story';

export const FIELD_ORDER: FieldName[] = [
  'name',
  'subcomponent',
  'description',
  'prop',
  'propDescription',
  'story',
];
export const FIELD_WEIGHTS: Record<FieldName, number> = {
  name: 4,
  subcomponent: 2.5,
  description: 2,
  prop: 1.5,
  propDescription: 1.25,
  story: 1,
};
const FIELD_LABELS: Record<FieldName, string> = {
  name: 'name',
  subcomponent: 'subcomponent',
  description: 'description',
  prop: 'prop',
  propDescription: 'prop description',
  story: 'story',
};
export const SYNONYM_WEIGHT = 0.6;
/** Free-text fields where a match in a long text is weaker evidence than in a short one. */
const LENGTH_NORMALIZED: ReadonlySet<FieldName> = new Set([
  'description',
  'propDescription',
]);
/** BM25-style length normalization strength (0 = off, 1 = fully proportional). */
const LENGTH_NORMALIZATION = 0.75;
/** Fields that describe what a component is; a direct word match here is a strong match. */
const IDENTITY_FIELDS: ReadonlySet<FieldName> = new Set([
  'name',
  'subcomponent',
  'description',
]);
export const DEPRECATED_FACTOR = 0.3;
const WHY_TEXT_LIMIT = 40;

interface FieldItem {
  text: string;
  tokens: Set<string>;
  length: number;
}

interface IndexedComponent {
  component: Component;
  fields: Record<FieldName, FieldItem[]>;
}

export interface SearchIndex {
  entries: IndexedComponent[];
  df: Map<string, number>;
  averageLength: Record<FieldName, number>;
}

export interface Match {
  component: Component;
  score: number;
  /** strong: a query word (not a synonym) appears in the name, a subcomponent name, or the description. */
  strength: 'strong' | 'weak';
  why: string;
}

interface Evidence {
  value: number;
  field: FieldName;
  text: string;
  term: string;
  via?: string;
}

export function buildIndex(components: Component[]): SearchIndex {
  const df = new Map<string, number>();
  const entries = components.map((component): IndexedComponent => {
    const texts = fieldTexts(component);
    const fields = {} as Record<FieldName, FieldItem[]>;
    const seen = new Set<string>();
    for (const field of FIELD_ORDER) {
      fields[field] = texts[field].map(text => {
        const words = tokenize(text);
        return { text, tokens: new Set(words), length: words.length };
      });
      for (const item of fields[field])
        for (const token of item.tokens) seen.add(token);
    }
    for (const token of seen) df.set(token, (df.get(token) ?? 0) + 1);
    return { component, fields };
  });
  const averageLength = {} as Record<FieldName, number>;
  for (const field of FIELD_ORDER) {
    const items = entries.flatMap(entry => entry.fields[field]);
    const total = items.reduce((sum, item) => sum + item.length, 0);
    averageLength[field] = items.length > 0 ? total / items.length : 0;
  }
  return { entries, df, averageLength };
}

export function search(
  index: SearchIndex,
  query: string,
  limit: number,
): Match[] {
  const originals = [...new Set(tokenize(query))];
  const total = index.entries.length;
  const idf = (term: string) => {
    const df = index.df.get(term) ?? 0;
    return df === 0 ? 0 : Math.log(1 + (total - df + 0.5) / (df + 0.5));
  };

  const matches: Match[] = [];
  for (const entry of index.entries) {
    const used = new Set<string>();
    let score = 0;
    let strongest: Evidence | undefined;
    let identityMatch = false;
    for (const original of originals) {
      const candidates = [
        { term: original, weight: 1, via: undefined as string | undefined },
        ...synonymsOf(original)
          .filter(term => !originals.includes(term))
          .map(term => ({ term, weight: SYNONYM_WEIGHT, via: original })),
      ];
      let best: Evidence | undefined;
      for (const candidate of candidates) {
        if (used.has(candidate.term)) continue;
        const hit = strongestField(entry, candidate.term);
        if (!hit) continue;
        const value =
          candidate.weight *
          idf(candidate.term) *
          FIELD_WEIGHTS[hit.field] *
          lengthFactor(index, hit.field, hit.length);
        if (!best || value > best.value)
          best = {
            value,
            field: hit.field,
            text: hit.text,
            term: candidate.term,
            via: candidate.via,
          };
      }
      if (!best) continue;
      used.add(best.term);
      score += best.value;
      if (!best.via && IDENTITY_FIELDS.has(best.field)) identityMatch = true;
      if (!strongest || best.value > strongest.value) strongest = best;
    }
    if (!strongest) continue;
    if (entry.component.status === 'deprecated') score *= DEPRECATED_FACTOR;
    matches.push({
      component: entry.component,
      score,
      strength: identityMatch ? 'strong' : 'weak',
      why: explain(strongest),
    });
  }

  matches.sort(
    (a, b) =>
      b.score - a.score ||
      compare(a.component.name, b.component.name) ||
      compare(a.component.id, b.component.id),
  );
  const top = matches[0]?.score ?? 1;
  return matches.slice(0, limit).map(match => ({
    ...match,
    score: Math.round((match.score / top) * 100) / 100,
  }));
}

function fieldTexts(component: Component): Record<FieldName, string[]> {
  return {
    name: [component.name],
    subcomponent: component.subcomponents.map(
      sub => sub.name.split('.').at(-1) ?? sub.name,
    ),
    description: component.description ? [component.description] : [],
    prop: component.props
      .filter(prop => !prop.deprecated)
      .flatMap(prop => [
        prop.name,
        ...[...prop.type.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1] ?? ''),
      ]),
    propDescription: component.props
      .filter(prop => !prop.deprecated && prop.description)
      .map(prop => prop.description),
    story: component.examples.map(example => example.name),
  };
}

function strongestField(
  entry: IndexedComponent,
  term: string,
): { field: FieldName; text: string; length: number } | undefined {
  for (const field of FIELD_ORDER) {
    const item = entry.fields[field].find(candidate =>
      candidate.tokens.has(term),
    );
    if (item) return { field, text: item.text, length: item.length };
  }
  return undefined;
}

function lengthFactor(
  index: SearchIndex,
  field: FieldName,
  length: number,
): number {
  const average = index.averageLength[field];
  if (!LENGTH_NORMALIZED.has(field) || average <= 0) return 1;
  return (
    1 / (1 - LENGTH_NORMALIZATION + (LENGTH_NORMALIZATION * length) / average)
  );
}

function explain(evidence: Evidence): string {
  const text = evidence.text.replace(/\s+/g, ' ').trim();
  const shown =
    text.length > WHY_TEXT_LIMIT
      ? `${text.slice(0, WHY_TEXT_LIMIT - 1)}…`
      : text;
  const base = `${FIELD_LABELS[evidence.field]} "${shown}" matches "${evidence.via ?? evidence.term}"`;
  return evidence.via ? `${base} (synonym "${evidence.term}")` : base;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
