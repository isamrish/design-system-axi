import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadPrimer } from '../../src/adapters/primer/load.js';
import { loadStorybook } from '../../src/adapters/storybook/load.js';
import type {
  FragmentComponent,
  SourceFragment,
} from '../../src/adapters/types.js';
import { computeAggregates } from '../../src/catalog/aggregates.js';
import { mergeFragments, nameFromStoryId } from '../../src/catalog/merge.js';
import { makeProp } from '../helpers/catalog.js';

const entry = (
  o: Partial<FragmentComponent> & Pick<FragmentComponent, 'key' | 'name'>,
): FragmentComponent => ({
  isComponent: true,
  storyIds: [],
  ...o,
});
const storybook = (components: FragmentComponent[]): SourceFragment => ({
  adapter: 'storybook',
  location: 'sb',
  priority: 1,
  distinctEntries: false,
  components,
});
const primer = (components: FragmentComponent[]): SourceFragment => ({
  adapter: 'primer-components-json',
  location: 'pr',
  priority: 2,
  distinctEntries: true,
  components,
});

describe('mergeFragments', () => {
  it('joins by story id and applies field precedence with provenance', () => {
    const primerProp = makeProp({
      name: 'variant',
      type: "'default' | 'danger'",
    });
    const result = mergeFragments([
      storybook([
        entry({
          key: 'components-button',
          name: 'Button',
          storyIds: [
            'components-button--default',
            'components-button--primary',
          ],
          import: 'import { Button } from "@primer/react";',
          description: 'Triggers an action.',
          props: [makeProp({ name: 'as', type: 'TAs' })],
          examples: [
            {
              id: 'components-button--default',
              name: 'Default',
              snippet: 'const Default = () => <Button>Default</Button>;',
            },
            {
              id: 'components-button--primary',
              name: 'Primary',
              snippet: '<Button variant="primary">Go</Button>',
            },
          ],
        }),
      ]),
      primer([
        entry({
          key: 'button',
          name: 'Button',
          storyIds: ['components-button--default'],
          import: 'import { Button } from "@primer/react";',
          status: 'alpha',
          props: [primerProp],
          examples: [
            {
              id: 'components-button--default',
              name: '',
              snippet: '() => <Button>Default</Button>',
            },
          ],
        }),
      ]),
    ]);
    expect(result).toEqual({
      skipped: [],
      components: [
        {
          id: 'button',
          name: 'Button',
          import: 'import { Button } from "@primer/react";',
          status: 'alpha',
          description: 'Triggers an action.',
          deprecation: '',
          props: [primerProp],
          subcomponents: [],
          examples: [
            {
              id: 'components-button--default',
              name: 'Default',
              snippet: '() => <Button>Default</Button>',
            },
            {
              id: 'components-button--primary',
              name: 'Primary',
              snippet: '<Button variant="primary">Go</Button>',
            },
          ],
          related: [],
          provenance: {
            import: 'primer-components-json',
            status: 'primer-components-json',
            description: 'storybook',
            props: 'primer-components-json',
          },
        },
      ],
    });
  });

  it('joins story groupings by id prefix and skips non-components', () => {
    const result = mergeFragments([
      storybook([
        entry({
          key: 'components-linkbutton-features',
          name: 'Features',
          isComponent: false,
          storyIds: ['components-linkbutton-features--large'],
          examples: [
            {
              id: 'components-linkbutton-features--large',
              name: 'Large',
              snippet: '',
            },
          ],
        }),
        entry({
          key: 'components-linkbutton',
          name: 'LinkButton',
          storyIds: ['components-linkbutton--default'],
          import: 'import { LinkButton } from "@primer/react";',
          examples: [
            {
              id: 'components-linkbutton--default',
              name: 'Default',
              snippet: '',
            },
          ],
        }),
        entry({
          key: 'hooks-usefocus',
          name: 'useFocus',
          isComponent: false,
          storyIds: ['hooks-usefocus--default'],
        }),
      ]),
    ]);
    expect(result.skipped).toEqual(['hooks-usefocus']);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]).toMatchObject({
      id: 'components-linkbutton',
      name: 'LinkButton',
      status: 'unknown',
      examples: [
        { id: 'components-linkbutton--default', name: 'Default', snippet: '' },
        {
          id: 'components-linkbutton-features--large',
          name: 'Large',
          snippet: '',
        },
      ],
      provenance: { import: 'storybook' },
    });
  });

  it('joins by name, preferring the single non-deprecated component', () => {
    const result = mergeFragments([
      primer([
        entry({
          key: 'dialog',
          name: 'Dialog',
          status: 'deprecated',
          storyIds: ['deprecated-dialog--default'],
        }),
        entry({
          key: 'dialog_v2',
          name: 'Dialog',
          status: 'alpha',
          storyIds: ['components-dialog--default'],
        }),
      ]),
      storybook([
        entry({
          key: 'components-dialog-extra',
          name: 'Dialog',
          storyIds: ['components-dialog-extra--x'],
          examples: [
            {
              id: 'components-dialog-extra--x',
              name: 'X',
              snippet: '<Dialog />',
            },
          ],
        }),
      ]),
    ]);
    expect(result.components.map(c => [c.id, c.examples.length])).toEqual([
      ['dialog', 0],
      ['dialog_v2', 1],
    ]);
  });

  it('keeps a deprecated entry off a current component unless a story id links them', () => {
    const deprecated = (key: string, name: string, isComponent = true) =>
      entry({
        key,
        name,
        isComponent,
        status: 'deprecated',
        storyIds: [`${key}--default`],
        examples: [{ id: `${key}--default`, name: 'Default', snippet: '' }],
      });
    const result = mergeFragments([
      primer([
        entry({
          key: 'dialog',
          name: 'Dialog',
          status: 'deprecated',
          storyIds: ['deprecated-dialog--default'],
        }),
        entry({ key: 'dialog_v2', name: 'Dialog', status: 'alpha' }),
        entry({ key: 'action_list', name: 'ActionList', status: 'beta' }),
        entry({
          key: 'select_panel_v1',
          name: 'SelectPanel',
          status: 'deprecated',
          storyIds: ['deprecated-components-selectpanel--default'],
        }),
      ]),
      storybook([
        // joins the deprecated Dialog by name, not the current one
        deprecated('deprecated-components-dialogv1', 'Dialog'),
        // an old API of a current component: skipped, never attached
        deprecated('deprecated-components-actionlist', 'ActionList', false),
        deprecated('deprecated-components-actionmenu', 'ActionMenu'),
        entry({ key: 'components-actionmenu', name: 'ActionMenu' }),
        // linked by a published story id: joins as before
        deprecated('deprecated-components-selectpanel', 'SelectPanel'),
        // no current counterpart: becomes a deprecated component
        deprecated('deprecated-components-pagehead', 'Pagehead'),
      ]),
    ]);
    const byId = (id: string) => result.components.find(c => c.id === id);
    expect(byId('dialog')?.examples.map(e => e.id)).toEqual([
      'deprecated-components-dialogv1--default',
    ]);
    expect(byId('dialog_v2')?.examples).toEqual([]);
    expect(byId('action_list')?.examples).toEqual([]);
    expect(byId('select_panel_v1')?.examples.map(e => e.id)).toEqual([
      'deprecated-components-selectpanel--default',
    ]);
    expect(
      result.components.filter(c => c.name === 'ActionMenu').map(c => c.status),
    ).toEqual(['unknown']);
    expect(byId('deprecated-components-pagehead')?.status).toBe('deprecated');
    expect(result.skipped).toEqual([
      'deprecated-components-actionlist',
      'deprecated-components-actionmenu',
    ]);
  });

  it('gives a story claimed by a deprecated and a current component to the current one', () => {
    const result = mergeFragments([
      primer([
        entry({
          key: 'dialog',
          name: 'Dialog',
          status: 'deprecated',
          storyIds: ['components-dialog--default'],
        }),
        entry({
          key: 'dialog_v2',
          name: 'Dialog',
          status: 'alpha',
          storyIds: ['components-dialog--default'],
        }),
      ]),
      storybook([
        entry({
          key: 'components-dialog',
          name: 'Dialog',
          storyIds: [
            'components-dialog--default',
            'components-dialog--playground',
          ],
          examples: [
            {
              id: 'components-dialog--playground',
              name: 'Playground',
              snippet: '',
            },
          ],
        }),
      ]),
    ]);
    const examples = (id: string) =>
      result.components.find(c => c.id === id)?.examples.map(e => e.id);
    expect(examples('dialog_v2')).toEqual(['components-dialog--playground']);
    expect(examples('dialog')).toEqual([]);
  });

  it('never merges two entries of a distinct-entries fragment', () => {
    const result = mergeFragments([
      primer([
        entry({ key: 'tooltip', name: 'Tooltip', status: 'deprecated' }),
        entry({ key: 'tooltip_v2', name: 'Tooltip', status: 'beta' }),
      ]),
    ]);
    expect(result.components.map(c => c.id)).toEqual(['tooltip', 'tooltip_v2']);
  });

  it('does not throw when a component name contains regex metacharacters', () => {
    expect(() =>
      mergeFragments([
        storybook([
          entry({ key: 'components-weird-name', name: 'Weird(Name' }),
          entry({
            key: 'components-button',
            name: 'Button',
            examples: [
              {
                id: 'components-button--default',
                name: '',
                snippet: '<Button>Default</Button>',
              },
            ],
          }),
        ]),
      ]),
    ).not.toThrow();
  });

  it('derives example names and related components from snippets', () => {
    const result = mergeFragments([
      storybook([
        entry({ key: 'components-button', name: 'Button' }),
        entry({ key: 'components-buttongroup', name: 'ButtonGroup' }),
        entry({
          key: 'components-confirmationdialog',
          name: 'ConfirmationDialog',
          examples: [
            {
              id: 'components-confirmationdialog--with-buttons',
              name: '',
              snippet:
                '<ButtonGroup><Button>No</Button><Button>Yes</Button></ButtonGroup>',
            },
          ],
        }),
      ]),
    ]);
    const dialog = result.components.find(c => c.name === 'ConfirmationDialog');
    expect(dialog?.examples[0]?.name).toBe('With buttons');
    expect(dialog?.related).toEqual(['Button', 'ButtonGroup']);
  });
});

describe('nameFromStoryId', () => {
  it('turns the story slug into words', () => {
    expect(
      nameFromStoryId('components-button-features--trailing-counter'),
    ).toBe('Trailing counter');
  });
});

describe('mergeFragments on real Primer data', () => {
  it('produces the verified catalog', async () => {
    const [sb, pr] = await Promise.all([
      loadStorybook(
        fileURLToPath(new URL('../fixtures/primer/storybook', import.meta.url)),
      ),
      loadPrimer(
        fileURLToPath(new URL('../fixtures/primer/package', import.meta.url)),
      ),
    ]);
    const { components, skipped } = mergeFragments([sb, pr]);
    expect(components).toHaveLength(86);
    expect(skipped).toEqual([
      'components-skeleton-examples',
      'deprecated-components-actionlist',
      'deprecated-components-actionmenu',
      'experimental-components-csscomponent',
      'hooks-useanchoredposition',
      'hooks-usefocustrap',
      'hooks-usefocuszone',
      'hooks-useformcontrolforwardedprops',
      'hooks-userovingtabindex',
      'octicons-customization',
    ]);
    expect(computeAggregates(components).byStatus).toEqual({
      stable: 0,
      beta: 6,
      alpha: 56,
      draft: 7,
      deprecated: 12,
      unknown: 5,
    });
    expect(
      components
        .filter(c => c.name === 'Dialog')
        .map(c => c.status)
        .sort(),
    ).toEqual(['alpha', 'deprecated']);
    const confirmation = components.find(c => c.name === 'ConfirmationDialog');
    expect(confirmation?.provenance.description).toBe('storybook');
    expect(confirmation?.related).toContain('Button');
    const button = components.find(c => c.id === 'button');
    expect(button?.examples.every(e => e.name.length > 0)).toBe(true);
    expect(
      components
        .filter(c => c.status !== 'deprecated')
        .flatMap(c => c.examples.map(e => e.id))
        .filter(id => id.startsWith('deprecated-')),
    ).toEqual([]);
  });
});
