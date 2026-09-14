import { intFlag, parseCommandArgs } from "../args.js";
import { STATUSES, type Status } from "../catalog/schema.js";
import { requireCatalog } from "../catalog/store.js";
import { BIN, validationError } from "../errors.js";
import { importSource } from "../format/text.js";
import type { CommandContext } from "./context.js";

const FLAGS = {
  status: { type: "string" },
  limit: { type: "string" },
} as const;
const DEFAULT_LIMIT = 100;

export async function componentsCommand(
  args: string[],
  ctx: CommandContext,
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseCommandArgs("components", args, FLAGS);
  if (positionals.length > 0)
    throw validationError(
      `unexpected argument "${positionals[0]}"`,
      "components",
    );
  const status = flags.status;
  if (
    status !== undefined &&
    !(STATUSES as readonly unknown[]).includes(status)
  ) {
    throw validationError(
      `--status must be one of ${STATUSES.join(", ")}`,
      "components",
    );
  }
  const limit = intFlag("components", "limit", flags.limit, DEFAULT_LIMIT);
  const { catalog } = await requireCatalog(ctx);

  const filtered =
    status === undefined
      ? catalog.components.filter(
          (component) => component.status !== "deprecated",
        )
      : catalog.components.filter(
          (component) => component.status === (status as Status),
        );

  const output: Record<string, unknown> = {
    total: filtered.length,
    components: filtered.slice(0, limit).map((component) => ({
      name: component.name,
      status: component.status,
      from: importSource(component.import),
    })),
  };
  const deprecated = catalog.aggregates.byStatus.deprecated;
  if (status === undefined && deprecated > 0)
    output.excluded = `${deprecated} deprecated (use --status deprecated)`;
  if (filtered.length > limit)
    output.truncated = `showing ${limit} of ${filtered.length} (use --limit)`;
  if (filtered.length === 0) {
    output.result =
      status === undefined
        ? "no components in the catalog"
        : `no components with status "${status}"`;
  }
  output.help = [
    `Run \`${BIN} component <Name>\` for props, import, and an example`,
    `Run \`${BIN} find "<what you are building>"\` to rank components by purpose`,
  ];
  return output;
}
