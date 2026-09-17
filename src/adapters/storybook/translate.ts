import { z } from 'zod';
import type { Prop } from '../../catalog/schema.js';
import { parseOrThrow } from '../parse.js';
import type { FragmentComponent, SourceFragment } from '../types.js';

const Docgen = z.looseObject({
  description: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

const Entry = z.looseObject({
  id: z.string(),
  name: z.string(),
  import: z.string().optional(),
  description: z.string().optional(),
  jsDocTags: z.record(z.string(), z.array(z.string())).optional(),
  stories: z.array(
    z.looseObject({
      id: z.string(),
      name: z.string(),
      snippet: z.string().optional(),
    }),
  ),
  subcomponents: z
    .record(
      z.string(),
      z.looseObject({
        reactDocgen: Docgen.optional(),
        reactDocgenTypescript: Docgen.optional(),
      }),
    )
    .optional(),
  reactDocgen: Docgen.optional(),
  reactDocgenTypescript: Docgen.optional(),
});

const Manifest = z.looseObject({
  v: z.number(),
  components: z.record(z.string(), Entry),
});

interface DocgenProp {
  required?: boolean;
  description?: string;
  tsType?: { name?: string; raw?: string };
  type?: { name?: string; raw?: string };
  defaultValue?: { value?: unknown } | null;
}

export function translateStorybook(
  data: unknown,
  location: string,
): SourceFragment {
  const manifest = parseOrThrow(Manifest, data, 'storybook');
  const components = Object.values(manifest.components).map(
    (entry): FragmentComponent => {
      const deprecation = deprecationNote(entry.jsDocTags);
      // A compound entry such as `Tabs.Root` is catalogued as `Tabs`, with the
      // entry itself as the first subcomponent, because that is the name the
      // design system exports and an agent asks for.
      const [root = entry.name, ...parts] = entry.name.split('.');
      const compound = parts.length > 0;
      const statement = importing(entry.import, compound ? parts.at(-1) : root);
      const props = toProps(
        entry.reactDocgen?.props ?? entry.reactDocgenTypescript?.props,
      );
      const qualify = (key: string) =>
        key.startsWith(`${root}.`) ? key : `${root}.${key}`;
      return {
        key: entry.id,
        name: root,
        isComponent: /^[A-Z]/.test(root) && statement !== undefined,
        storyIds: entry.stories.map(story => story.id),
        import: compound
          ? statement
            ? `import { ${root} } from ${quoted(statement)};`
            : ''
          : (statement ?? entry.import ?? ''),
        description: (
          entry.description ??
          entry.reactDocgen?.description ??
          ''
        ).trim(),
        ...(deprecation !== undefined || inDeprecatedSection(entry.id)
          ? { status: 'deprecated' as const, deprecation: deprecation ?? '' }
          : {}),
        props: compound ? [] : props,
        subcomponents: [
          ...(compound ? [{ name: entry.name, props }] : []),
          ...Object.entries(entry.subcomponents ?? {}).map(([key, sub]) => ({
            name: qualify(key),
            props: toProps(
              sub.reactDocgen?.props ?? sub.reactDocgenTypescript?.props,
            ),
          })),
        ],
        examples: entry.stories.map(story => ({
          id: story.id,
          name: story.name,
          snippet: story.snippet ?? '',
        })),
      };
    },
  );
  return {
    adapter: 'storybook',
    location,
    priority: 1,
    distinctEntries: false,
    components,
  };
}

/** Named imports across every `import { … } from '…'` statement. */
export function importedNames(statement: string | undefined): string[] {
  return statements(statement).flatMap(({ names }) => names);
}

/** The one statement that imports `name`, verbatim, or undefined. */
function importing(
  statement: string | undefined,
  name: string | undefined,
): string | undefined {
  if (name === undefined) return undefined;
  return statements(statement).find(({ names }) => names.includes(name))?.text;
}

const IMPORT_SOURCE = /import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2\s*;?/;

function statements(
  statement: string | undefined,
): { text: string; names: string[] }[] {
  return [...(statement ?? '').matchAll(new RegExp(IMPORT_SOURCE, 'g'))].map(
    match => ({
      text: match[0],
      names: (match[1] ?? '')
        .split(',')
        .map(part => part.trim().split(/\s+as\s+/)[0] ?? '')
        .filter(name => name.length > 0),
    }),
  );
}

/** The module specifier of an import statement, with its original quotes. */
function quoted(statement: string): string {
  const match = IMPORT_SOURCE.exec(statement);
  return match ? `${match[2]}${match[3]}${match[2]}` : '""';
}

function toProps(raw: Record<string, unknown> | undefined): Prop[] {
  return Object.entries(raw ?? {})
    .map(([name, value]): Prop => {
      const prop = value as DocgenProp;
      const type = prop.tsType ?? prop.type;
      const fallback = prop.defaultValue?.value;
      return {
        name,
        type: type?.raw ?? type?.name ?? '',
        required: prop.required === true,
        default:
          fallback === undefined || fallback === null ? '' : String(fallback),
        description: (prop.description ?? '').trim(),
        deprecated: false,
      };
    })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * A story filed under a `Deprecated/` sidebar section, whose id therefore
 * starts with `deprecated-`. The section gives no reason, so none is recorded.
 */
function inDeprecatedSection(id: string): boolean {
  return id.startsWith('deprecated-');
}

function deprecationNote(
  tags: Record<string, string[]> | undefined,
): string | undefined {
  const note = tags?.deprecated;
  if (note === undefined) return undefined;
  return note.join(' ').trim() || 'deprecated';
}
