import { z } from 'zod';
import { type Prop, STATUSES, type Status } from '../../catalog/schema.js';
import { parseOrThrow } from '../parse.js';
import type { FragmentComponent, SourceFragment } from '../types.js';

const PrimerProp = z.looseObject({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
});
type PrimerProp = z.infer<typeof PrimerProp>;

const PrimerComponent = z.looseObject({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  importPath: z.string(),
  props: z.array(PrimerProp).default([]),
  subcomponents: z
    .array(
      z.looseObject({
        name: z.string(),
        props: z.array(PrimerProp).default([]),
      }),
    )
    .default([]),
  stories: z
    .array(z.looseObject({ id: z.string(), code: z.string().optional() }))
    .default([]),
});

const ComponentsJson = z.looseObject({
  components: z.record(z.string(), PrimerComponent),
});

export const PackageJsonSchema = z.looseObject({
  name: z.string().optional(),
  version: z.string().optional(),
});

export function translatePrimer(
  data: unknown,
  location: string,
  pkg: { name?: string; version?: string } = {},
): SourceFragment {
  const parsed = parseOrThrow(ComponentsJson, data, 'primer-components-json');
  const components = Object.values(parsed.components).map(
    (c): FragmentComponent => ({
      key: c.id,
      name: c.name,
      isComponent: true,
      storyIds: c.stories.map(story => story.id),
      import: `import { ${c.name} } from "${c.importPath}";`,
      status: toStatus(c.status),
      props: c.props.map(toProp),
      subcomponents: c.subcomponents.map(sub => ({
        name: sub.name,
        props: sub.props.map(toProp),
      })),
      examples: c.stories.map(story => ({
        id: story.id,
        name: '',
        snippet: story.code ?? '',
      })),
    }),
  );
  return {
    adapter: 'primer-components-json',
    location,
    priority: 2,
    distinctEntries: true,
    designSystem: {
      name: 'Primer React',
      package: pkg.name,
      version: pkg.version,
    },
    components,
  };
}

function toProp(prop: PrimerProp): Prop {
  return {
    name: prop.name,
    type: prop.type ?? '',
    required: prop.required === true,
    default: prop.defaultValue ?? '',
    description: (prop.description ?? '').trim(),
    deprecated: prop.deprecated === true,
  };
}

function toStatus(status: string): Status {
  return (STATUSES as readonly string[]).includes(status)
    ? (status as Status)
    : 'unknown';
}
