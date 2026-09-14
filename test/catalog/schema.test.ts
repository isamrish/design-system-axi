import { describe, expect, it } from 'vitest';
import { computeAggregates } from '../../src/catalog/aggregates.js';
import { CatalogSchema } from '../../src/catalog/schema.js';
import { makeCatalog, makeComponent, makeProp } from '../helpers/catalog.js';

const button = makeComponent({
  id: 'button',
  name: 'Button',
  props: [makeProp({ name: 'variant' }), makeProp({ name: 'size' })],
  examples: [
    {
      id: 'components-button--default',
      name: 'Default',
      snippet: '<Button>Go</Button>',
    },
  ],
});
const flash = makeComponent({
  id: 'flash',
  name: 'Flash',
  status: 'deprecated',
  deprecation: 'Use `Banner` instead.',
});

describe('CatalogSchema', () => {
  it('accepts a complete catalog', () => {
    expect(CatalogSchema.safeParse(makeCatalog([button, flash])).success).toBe(
      true,
    );
  });

  it('rejects a component missing a field', () => {
    const { description: _omit, ...partial } = button;
    const result = CatalogSchema.safeParse(
      makeCatalog([partial as typeof button]),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([
      'components',
      0,
      'description',
    ]);
  });

  it('rejects unknown statuses and newer schema versions', () => {
    expect(
      CatalogSchema.safeParse(
        makeCatalog([{ ...button, status: 'experimental' as never }]),
      ).success,
    ).toBe(false);
    expect(
      CatalogSchema.safeParse({ ...makeCatalog([button]), schemaVersion: 2 })
        .success,
    ).toBe(false);
  });
});

describe('computeAggregates', () => {
  it('counts components by every status, examples, and props', () => {
    expect(computeAggregates([button, flash])).toEqual({
      components: 2,
      byStatus: {
        stable: 0,
        beta: 0,
        alpha: 1,
        draft: 0,
        deprecated: 1,
        unknown: 0,
      },
      examples: 1,
      props: 2,
    });
  });
});
