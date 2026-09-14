import { describe, expect, it } from 'vitest';
import { buildIndex, search } from '../../src/search/rank.js';
import { makeComponent, makeProp } from '../helpers/catalog.js';

const components = [
  makeComponent({
    id: 'button',
    name: 'Button',
    props: [
      makeProp({ name: 'variant', type: "'default' | 'primary' | 'danger'" }),
    ],
    examples: [
      { id: 'components-button--default', name: 'Default', snippet: '' },
      { id: 'components-button--danger', name: 'Danger', snippet: '' },
    ],
  }),
  makeComponent({
    id: 'confirmationdialog',
    name: 'ConfirmationDialog',
    description: 'Confirms a destructive action before it happens.',
  }),
  makeComponent({ id: 'dialog', name: 'Dialog', status: 'deprecated' }),
  makeComponent({ id: 'dialog_v2', name: 'Dialog' }),
  makeComponent({ id: 'spinner', name: 'Spinner' }),
  makeComponent({
    id: 'counterlabel',
    name: 'CounterLabel',
    props: [
      makeProp({
        name: 'scheme',
        type: "'primary' | 'secondary'",
        description:
          "Pass in 'primary' for a darker background when the count is unread.",
      }),
    ],
  }),
];
const index = buildIndex(components);
const rows = (query: string, limit = 5) =>
  search(index, query, limit).map(match => [
    match.component.id,
    match.score,
    match.why,
  ]);

describe('search', () => {
  it('ranks name matches, breaks ties by name, and down-weights deprecated components', () => {
    expect(rows('dialogs')).toEqual([
      ['confirmationdialog', 1, 'name "ConfirmationDialog" matches "dialog"'],
      ['dialog_v2', 1, 'name "Dialog" matches "dialog"'],
      ['dialog', 0.3, 'name "Dialog" matches "dialog"'],
    ]);
  });

  it('uses synonyms at reduced weight and explains them', () => {
    expect(rows('delete')).toEqual([
      [
        'confirmationdialog',
        1,
        'description "Confirms a destructive action before it…" matches "delete" (synonym "destructive")',
      ],
      ['button', 0.75, 'prop "danger" matches "delete" (synonym "danger")'],
    ]);
  });

  it('matches words in prop descriptions and labels the evidence', () => {
    expect(rows('unread')).toEqual([
      [
        'counterlabel',
        1,
        'prop description "Pass in \'primary\' for a darker backgrou…" matches "unread"',
      ],
    ]);
  });

  it('weights a word in a long description below the same word in a short one', () => {
    const texts = buildIndex([
      makeComponent({
        id: 'timeline',
        name: 'Timeline',
        description:
          'Internal notes: these story examples cover issue events, repository activity, review requests, code scanning alerts, license changes, and the migration plan for the next phase.',
      }),
      makeComponent({
        id: 'banner',
        name: 'Banner',
        description: 'Announces a migration.',
      }),
    ]);
    const ranked = search(texts, 'migration', 5);
    expect(ranked.map(match => match.component.id)).toEqual([
      'banner',
      'timeline',
    ]);
    expect(ranked[1]?.score).toBeLessThan(1);
  });

  it('marks direct matches in name, subcomponent, or description as strong', () => {
    const strength = (query: string) =>
      search(index, query, 5).map(match => [
        match.component.id,
        match.strength,
      ]);
    expect(strength('dialog')).toEqual([
      ['confirmationdialog', 'strong'],
      ['dialog_v2', 'strong'],
      ['dialog', 'strong'],
    ]);
    expect(strength('delete')).toEqual([
      ['confirmationdialog', 'weak'],
      ['button', 'weak'],
    ]);
    expect(strength('unread')).toEqual([['counterlabel', 'weak']]);
  });

  it('respects the limit', () => {
    expect(rows('dialog', 1)).toHaveLength(1);
  });

  it('returns no matches for unknown words', () => {
    expect(rows('xyzzy')).toEqual([]);
  });
});
