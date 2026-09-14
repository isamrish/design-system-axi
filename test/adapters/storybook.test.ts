import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  loadStorybook,
  storybookManifestLocation,
} from '../../src/adapters/storybook/load.js';
import {
  importedNames,
  translateStorybook,
} from '../../src/adapters/storybook/translate.js';

const fixtureDir = fileURLToPath(
  new URL('../fixtures/primer/storybook', import.meta.url),
);

const manifest = {
  v: 0,
  components: {
    'components-button': {
      id: 'components-button',
      name: 'Button',
      path: './src/Button/Button.stories.tsx',
      import: 'import { Button } from "@acme/ui";',
      jsDocTags: {},
      description: 'Triggers an action.',
      reactDocgen: {
        props: {
          variant: {
            required: false,
            tsType: { name: 'union', raw: "'default' | 'danger'" },
            description: 'Visual style',
            defaultValue: { value: "'default'", computed: false },
          },
          children: {
            required: true,
            tsType: { name: 'ReactNode' },
            description: '',
          },
        },
      },
      stories: [
        {
          id: 'components-button--default',
          name: 'Default',
          snippet: 'const Default = () => <Button>Go</Button>;',
        },
      ],
    },
    'components-button-features': {
      id: 'components-button-features',
      name: 'Features',
      import: 'import { Button } from "@acme/ui";',
      jsDocTags: {},
      stories: [{ id: 'components-button-features--danger', name: 'Danger' }],
    },
    'components-flash': {
      id: 'components-flash',
      name: 'Flash',
      import: 'import { Flash, FlashItem as Item } from "@acme/ui";',
      jsDocTags: { deprecated: ['Use `Banner` instead.'] },
      stories: [],
      subcomponents: {
        Item: {
          name: 'Item',
          reactDocgenTypescript: {
            props: {
              tone: {
                required: false,
                type: { name: 'string' },
                description: 'Tone',
                defaultValue: null,
              },
            },
          },
        },
      },
    },
  },
};

describe('translateStorybook', () => {
  it('maps entries to fragment components', () => {
    const fragment = translateStorybook(manifest, 'https://storybook.acme.dev');
    expect(fragment).toMatchObject({
      adapter: 'storybook',
      location: 'https://storybook.acme.dev',
      priority: 1,
      distinctEntries: false,
    });
    expect(fragment.components).toEqual([
      {
        key: 'components-button',
        name: 'Button',
        isComponent: true,
        storyIds: ['components-button--default'],
        import: 'import { Button } from "@acme/ui";',
        description: 'Triggers an action.',
        props: [
          {
            name: 'children',
            type: 'ReactNode',
            required: true,
            default: '',
            description: '',
            deprecated: false,
          },
          {
            name: 'variant',
            type: "'default' | 'danger'",
            required: false,
            default: "'default'",
            description: 'Visual style',
            deprecated: false,
          },
        ],
        subcomponents: [],
        examples: [
          {
            id: 'components-button--default',
            name: 'Default',
            snippet: 'const Default = () => <Button>Go</Button>;',
          },
        ],
      },
      {
        key: 'components-button-features',
        name: 'Features',
        isComponent: false,
        storyIds: ['components-button-features--danger'],
        import: 'import { Button } from "@acme/ui";',
        description: '',
        props: [],
        subcomponents: [],
        examples: [
          {
            id: 'components-button-features--danger',
            name: 'Danger',
            snippet: '',
          },
        ],
      },
      {
        key: 'components-flash',
        name: 'Flash',
        isComponent: true,
        storyIds: [],
        import: 'import { Flash, FlashItem as Item } from "@acme/ui";',
        description: '',
        status: 'deprecated',
        deprecation: 'Use `Banner` instead.',
        props: [],
        subcomponents: [
          {
            name: 'Flash.Item',
            props: [
              {
                name: 'tone',
                type: 'string',
                required: false,
                default: '',
                description: 'Tone',
                deprecated: false,
              },
            ],
          },
        ],
        examples: [],
      },
    ]);
  });

  it('reads named imports, including aliases', () => {
    expect(
      importedNames('import { Flash, FlashItem as Item } from "@acme/ui";'),
    ).toEqual(['Flash', 'FlashItem']);
    expect(importedNames(undefined)).toEqual([]);
  });

  it('rejects drifted shapes with MANIFEST_SHAPE', () => {
    expect(() =>
      translateStorybook({ v: 0, components: [] }, 'x'),
    ).toThrowError(
      expect.objectContaining({
        code: 'MANIFEST_SHAPE',
        message: expect.stringContaining(
          'unrecognized storybook data at components:',
        ),
      }),
    );
    expect(() =>
      translateStorybook(
        { v: 0, components: { x: { id: 'x', name: 'X' } } },
        'x',
      ),
    ).toThrowError(
      expect.objectContaining({
        code: 'MANIFEST_SHAPE',
        message: expect.stringContaining('at components.x.stories:'),
      }),
    );
    expect(() => translateStorybook('<html>', 'x')).toThrowError(
      expect.objectContaining({
        code: 'MANIFEST_SHAPE',
        message: expect.stringContaining('at <root>:'),
      }),
    );
  });
});

describe('loadStorybook', () => {
  it('builds manifest locations for URLs and directories', () => {
    expect(
      storybookManifestLocation('https://primer.style/react/storybook/'),
    ).toBe('https://primer.style/react/storybook/manifests/components.json');
    expect(storybookManifestLocation('/tmp/storybook-static')).toBe(
      '/tmp/storybook-static/manifests/components.json',
    );
  });

  it('suggests a Storybook fix when the manifest cannot be read', async () => {
    await expect(
      loadStorybook(
        fileURLToPath(new URL('../fixtures/primer/package', import.meta.url)),
      ),
    ).rejects.toMatchObject({
      code: 'SOURCE_UNREACHABLE',
      suggestions: [
        'Point --storybook at a Storybook >= 10 URL or build directory with features.componentsManifest enabled',
      ],
    });
  });

  it('translates the real Primer manifest', async () => {
    const fragment = await loadStorybook(fixtureDir);
    expect(fragment.components).toHaveLength(210);
    const button = fragment.components.find(c => c.key === 'components-button');
    expect(button).toMatchObject({
      name: 'Button',
      isComponent: true,
      import: 'import { Button } from "@primer/react";',
    });
    expect(
      fragment.components.find(c => c.key === 'hooks-usefocustrap')
        ?.isComponent,
    ).toBe(false);
  });
});
