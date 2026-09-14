import { join } from "node:path";
import { computeAggregates } from "../../src/catalog/aggregates.js";
import type { Catalog, Component, Prop } from "../../src/catalog/schema.js";
import { writeCatalog } from "../../src/catalog/store.js";

export function makeProp(overrides: Partial<Prop> & Pick<Prop, "name">): Prop {
  return {
    type: "string",
    required: false,
    default: "",
    description: "",
    deprecated: false,
    ...overrides,
  };
}

export function makeComponent(
  overrides: Partial<Component> & Pick<Component, "id" | "name">,
): Component {
  return {
    import: `import { ${overrides.name} } from "@acme/ui";`,
    status: "alpha",
    description: "",
    deprecation: "",
    props: [],
    subcomponents: [],
    examples: [],
    related: [],
    provenance: {},
    ...overrides,
  };
}

export function makeCatalog(
  components: Component[],
  overrides: Partial<Catalog> = {},
): Catalog {
  return {
    schemaVersion: 1,
    generatedBy: { tool: "design-system-axi", version: "0.1.0" },
    syncedAt: "2026-09-11T12:00:00.000Z",
    designSystem: { name: "Acme UI", package: "@acme/ui", version: "3.4.1" },
    sources: [
      {
        adapter: "storybook",
        location: "https://storybook.acme.dev",
        entries: components.length,
      },
    ],
    skippedEntries: 0,
    components,
    aggregates: computeAggregates(components),
    ...overrides,
  };
}

export async function writeProjectCatalog(
  cwd: string,
  catalog: Catalog,
): Promise<void> {
  await writeCatalog(join(cwd, ".design-system-axi", "catalog.json"), catalog);
}
