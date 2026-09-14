import { loadPrimer } from "../adapters/primer/load.js";
import { isUrl } from "../adapters/read-json.js";
import { loadStorybook } from "../adapters/storybook/load.js";
import type { AdapterId, SourceFragment } from "../adapters/types.js";
import { parseCommandArgs } from "../args.js";
import { computeAggregates } from "../catalog/aggregates.js";
import { describeChanges } from "../catalog/diff.js";
import { mergeFragments } from "../catalog/merge.js";
import { CATALOG_SCHEMA_VERSION, type Catalog } from "../catalog/schema.js";
import { readCatalog, writeCatalog } from "../catalog/store.js";
import { resolveSyncConfig } from "../config/load.js";
import { BIN, validationError } from "../errors.js";
import { displayPath } from "../format/text.js";
import { VERSION } from "../version.js";
import type { CommandContext } from "./context.js";

export type Loaders = Record<AdapterId, (location: string) => Promise<SourceFragment>>;

export const defaultLoaders: Loaders = {
  storybook: loadStorybook,
  "primer-components-json": loadPrimer,
};

const FLAGS = {
  storybook: { type: "string" },
  primer: { type: "string" },
  catalog: { type: "string" },
} as const;

export async function syncCommand(
  args: string[],
  ctx: CommandContext,
  loaders: Loaders = defaultLoaders,
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseCommandArgs("sync", args, FLAGS);
  if (positionals.length > 0) throw validationError(`unexpected argument "${positionals[0]}"`, "sync");

  const config = await resolveSyncConfig(ctx, {
    storybook: stringFlag(flags.storybook),
    primer: stringFlag(flags.primer),
    catalog: stringFlag(flags.catalog),
  });
  if (config.sources.length === 0) {
    throw validationError(
      "no sources: pass --storybook <url|dir> and/or --primer <dir>, or add sources to design-system.axi.json",
      "sync",
    );
  }

  const fragments: SourceFragment[] = [];
  for (const source of config.sources) fragments.push(await loaders[source.adapter](source.location));

  const { components, skipped } = mergeFragments(fragments);
  const catalog: Catalog = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedBy: { tool: "design-system-axi", version: VERSION },
    syncedAt: ctx.now().toISOString(),
    designSystem: resolveIdentity(config.designSystem, fragments),
    sources: fragments.map((fragment) => ({
      adapter: fragment.adapter,
      location: isUrl(fragment.location) ? fragment.location : displayPath(ctx.cwd, fragment.location),
      entries: fragment.components.length,
    })),
    skippedEntries: skipped,
    components,
    aggregates: computeAggregates(components),
  };

  const previous = await readCatalog(config.catalogPath).catch(() => undefined);
  await writeCatalog(config.catalogPath, catalog);

  const ds = catalog.designSystem;
  return {
    synced: displayPath(ctx.cwd, config.catalogPath),
    design_system: `${ds.name} ${ds.package} ${ds.version}`,
    sources: catalog.sources,
    components: components.length,
    skipped_entries: skipped,
    changes: describeChanges(previous, catalog),
    help: [`Run \`${BIN}\` for an overview`, `Run \`${BIN} find "<what you are building>"\` to pick components`],
  };
}

export function resolveIdentity(
  configured: { name?: string; package?: string; version?: string },
  fragments: SourceFragment[],
): Catalog["designSystem"] {
  const ordered = [...fragments].sort((a, b) => b.priority - a.priority);
  const pick = (field: "name" | "package" | "version"): string =>
    configured[field] ?? ordered.map((fragment) => fragment.designSystem?.[field]).find((value) => value) ?? "unknown";
  return { name: pick("name"), package: pick("package"), version: pick("version") };
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
