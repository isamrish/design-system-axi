import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadPrimer } from '../../src/adapters/primer/load.js';
import { translatePrimer } from '../../src/adapters/primer/translate.js';

const fixtureDir = fileURLToPath(
  new URL('../fixtures/primer/package', import.meta.url),
);

const data = {
  schemaVersion: 2,
  components: {
    button: {
      id: 'button',
      name: 'Button',
      status: 'alpha',
      a11yReviewed: '2025-01-08',
      importPath: '@primer/react',
      props: [
        {
          name: 'variant',
          type: "'default' | 'primary' | 'danger'",
          defaultValue: "'default'",
          description: 'Style',
        },
        { name: 'sx', type: 'SxProp', deprecated: true },
      ],
      subcomponents: [
        {
          name: 'Button.Counter',
          props: [{ name: 'count', type: 'number', required: true }],
        },
      ],
      stories: [
        {
          id: 'components-button--default',
          code: '() => <Button>Default</Button>',
        },
      ],
    },
    widget: {
      id: 'widget',
      name: 'Widget',
      status: 'experimental',
      importPath: '@primer/react/experimental',
    },
  },
};

describe('translatePrimer', () => {
  it('maps components with import, status, props, subcomponents, and examples', () => {
    const fragment = translatePrimer(data, '/app/node_modules/@primer/react', {
      name: '@primer/react',
      version: '38.39.0',
    });
    expect(fragment).toMatchObject({
      adapter: 'primer-components-json',
      location: '/app/node_modules/@primer/react',
      priority: 2,
      distinctEntries: true,
      designSystem: {
        name: 'Primer React',
        package: '@primer/react',
        version: '38.39.0',
      },
    });
    expect(fragment.components).toEqual([
      {
        key: 'button',
        name: 'Button',
        isComponent: true,
        storyIds: ['components-button--default'],
        import: 'import { Button } from "@primer/react";',
        status: 'alpha',
        props: [
          {
            name: 'variant',
            type: "'default' | 'primary' | 'danger'",
            required: false,
            default: "'default'",
            description: 'Style',
            deprecated: false,
          },
          {
            name: 'sx',
            type: 'SxProp',
            required: false,
            default: '',
            description: '',
            deprecated: true,
          },
        ],
        subcomponents: [
          {
            name: 'Button.Counter',
            props: [
              {
                name: 'count',
                type: 'number',
                required: true,
                default: '',
                description: '',
                deprecated: false,
              },
            ],
          },
        ],
        examples: [
          {
            id: 'components-button--default',
            name: '',
            snippet: '() => <Button>Default</Button>',
          },
        ],
      },
      {
        key: 'widget',
        name: 'Widget',
        isComponent: true,
        storyIds: [],
        import: 'import { Widget } from "@primer/react/experimental";',
        status: 'unknown',
        props: [],
        subcomponents: [],
        examples: [],
      },
    ]);
  });

  it('rejects drifted shapes with MANIFEST_SHAPE', () => {
    expect(() =>
      translatePrimer(
        { components: { x: { id: 'x', name: 'X', status: 'alpha' } } },
        'x',
      ),
    ).toThrowError(
      expect.objectContaining({
        code: 'MANIFEST_SHAPE',
        message: expect.stringContaining(
          'primer-components-json data at components.x.importPath:',
        ),
      }),
    );
  });
});

describe('loadPrimer', () => {
  it('translates the real @primer/react 38.39.0 metadata', async () => {
    const fragment = await loadPrimer(fixtureDir);
    expect(fragment.designSystem).toEqual({
      name: 'Primer React',
      package: '@primer/react',
      version: '38.39.0',
    });
    expect(fragment.components).toHaveLength(80);
    const counts: Record<string, number> = {};
    for (const c of fragment.components)
      counts[c.status ?? 'none'] = (counts[c.status ?? 'none'] ?? 0) + 1;
    expect(counts).toEqual({ alpha: 56, deprecated: 11, draft: 7, beta: 6 });
    expect(fragment.components.find(c => c.key === 'button')?.import).toBe(
      'import { Button } from "@primer/react";',
    );
  });

  it('reports a directory without generated/components.json', async () => {
    await expect(
      loadPrimer(
        fileURLToPath(new URL('../fixtures/primer/storybook', import.meta.url)),
      ),
    ).rejects.toMatchObject({
      code: 'SOURCE_UNREACHABLE',
      suggestions: [
        'Install @primer/react, or point --primer at a directory containing package.json and generated/components.json',
      ],
    });
  });
});
