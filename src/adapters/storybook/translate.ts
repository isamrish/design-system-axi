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
      return {
        key: entry.id,
        name: entry.name,
        isComponent:
          /^[A-Z]/.test(entry.name) &&
          importedNames(entry.import).includes(entry.name),
        storyIds: entry.stories.map(story => story.id),
        import: entry.import ?? '',
        description: (
          entry.description ??
          entry.reactDocgen?.description ??
          ''
        ).trim(),
        ...(deprecation ? { status: 'deprecated' as const, deprecation } : {}),
        props: toProps(
          entry.reactDocgen?.props ?? entry.reactDocgenTypescript?.props,
        ),
        subcomponents: Object.entries(entry.subcomponents ?? {}).map(
          ([key, sub]) => ({
            name: `${entry.name}.${key}`,
            props: toProps(
              sub.reactDocgen?.props ?? sub.reactDocgenTypescript?.props,
            ),
          }),
        ),
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

export function importedNames(statement: string | undefined): string[] {
  const match = statement?.match(/import\s*\{([^}]*)\}/);
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map(part => part.trim().split(/\s+as\s+/)[0] ?? '')
    .filter(name => name.length > 0);
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

function deprecationNote(
  tags: Record<string, string[]> | undefined,
): string | undefined {
  const note = tags?.deprecated;
  if (note === undefined) return undefined;
  return note.join(' ').trim() || 'deprecated';
}
