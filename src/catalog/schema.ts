import { z } from 'zod';

export const STATUSES = [
  'stable',
  'beta',
  'alpha',
  'draft',
  'deprecated',
  'unknown',
] as const;
export const StatusSchema = z.enum(STATUSES);
export type Status = z.infer<typeof StatusSchema>;

export const CATALOG_SCHEMA_VERSION = 1;

export const PropSchema = z.strictObject({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  default: z.string(),
  description: z.string(),
  deprecated: z.boolean(),
});
export type Prop = z.infer<typeof PropSchema>;

export const ExampleSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  snippet: z.string(),
});
export type Example = z.infer<typeof ExampleSchema>;

export const SubcomponentSchema = z.strictObject({
  name: z.string(),
  props: z.array(PropSchema),
});
export type Subcomponent = z.infer<typeof SubcomponentSchema>;

export const ComponentSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  import: z.string(),
  status: StatusSchema,
  description: z.string(),
  deprecation: z.string(),
  props: z.array(PropSchema),
  subcomponents: z.array(SubcomponentSchema),
  examples: z.array(ExampleSchema),
  related: z.array(z.string()),
  provenance: z.record(z.string(), z.string()),
});
export type Component = z.infer<typeof ComponentSchema>;

const count = z.number().int().nonnegative();

export const AggregatesSchema = z.strictObject({
  components: count,
  byStatus: z.record(StatusSchema, count),
  examples: count,
  props: count,
});
export type Aggregates = z.infer<typeof AggregatesSchema>;

export const CatalogSchema = z.strictObject({
  schemaVersion: z.literal(CATALOG_SCHEMA_VERSION),
  generatedBy: z.strictObject({
    tool: z.literal('design-system-axi'),
    version: z.string(),
  }),
  syncedAt: z.iso.datetime(),
  designSystem: z.strictObject({
    name: z.string(),
    package: z.string(),
    version: z.string(),
  }),
  sources: z.array(
    z.strictObject({
      adapter: z.string(),
      location: z.string(),
      entries: count,
    }),
  ),
  skippedEntries: count,
  components: z.array(ComponentSchema),
  aggregates: AggregatesSchema,
});
export type Catalog = z.infer<typeof CatalogSchema>;
