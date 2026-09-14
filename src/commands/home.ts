import { resolveCatalogPath } from '../catalog/locate.js';
import { STATUSES } from '../catalog/schema.js';
import { readCatalog } from '../catalog/store.js';
import { formatAge } from '../env/age.js';
import { readInstalledVersion } from '../env/installed.js';
import { BIN } from '../errors.js';
import { displayPath } from '../format/text.js';
import type { CommandContext } from './context.js';

export async function homeCommand(
  ctx: CommandContext,
): Promise<Record<string, unknown>> {
  const path = resolveCatalogPath(ctx);
  const catalog = await readCatalog(path);
  if (!catalog) {
    return {
      catalog: `none at ${displayPath(ctx.cwd, path)}`,
      help: [
        `Run \`${BIN} sync --storybook <url|dir> --primer <dir>\` to build the catalog`,
        `Run \`${BIN} sync --help\` for sources and design-system.axi.json`,
      ],
    };
  }

  const { designSystem, aggregates } = catalog;
  const output: Record<string, unknown> = {
    design_system: {
      name: designSystem.name,
      package: designSystem.package,
      version: designSystem.version,
    },
    catalog: {
      synced: formatAge(catalog.syncedAt, ctx.now()),
      sources: catalog.sources.map(source => source.adapter).join(', '),
    },
  };

  const installed = await readInstalledVersion(ctx.cwd, designSystem.package);
  if (installed !== undefined) {
    const matches = installed === designSystem.version;
    output.installed = `${installed} (${matches ? 'matches' : 'mismatch'})`;
    if (!matches)
      output.warning = `catalog is ${designSystem.version} but the app has ${installed}; run \`${BIN} sync\``;
  }

  const components: Record<string, number> = { total: aggregates.components };
  for (const status of STATUSES) {
    if (aggregates.byStatus[status] > 0)
      components[status] = aggregates.byStatus[status];
  }
  output.components = components;
  output.help = [
    `Run \`${BIN} find "<what you are building>"\` before writing UI`,
    `Run \`${BIN} component <Name>\` for props, import, and an example`,
    `Run \`${BIN} components\` to list components`,
  ];
  return output;
}
